// Package prism renders an animated light-through-prism dispersion effect
// as a terminal string using half-block characters. Designed to be
// embedded as a decorative header in Bubble Tea applications.
//
// Usage:
//
//	p := prism.New(80, 3)       // 80 columns, 3 cell rows
//	p.Tick()                    // advance animation (call each frame)
//	header := p.String()        // ANSI-encoded string ready for stdout
//	p.Resize(120, 3)            // handle terminal resize
package prism

import (
	"fmt"
	"image/color"
	"math"
	"strings"

	"github.com/prism-plugin/ralph-tui/prism/framebuffer"
)

// Renderer produces animated prism dispersion frames.
type Renderer struct {
	fb    *framebuffer.Framebuffer
	frame int
	w, h  int // pixel dimensions (w = cols, h = rows*2)
	cols  int
	rows  int
}

// New creates a renderer for the given terminal width (columns) and height
// (cell rows). Each cell row produces 2 vertical pixels via half-block
// encoding.
func New(cols, rows int) *Renderer {
	if cols < 1 {
		cols = 1
	}
	if rows < 1 {
		rows = 1
	}
	w := cols
	h := rows * 2
	return &Renderer{
		fb:   framebuffer.New(framebuffer.WithFixedSize(w, h)),
		w:    w,
		h:    h,
		cols: cols,
		rows: rows,
	}
}

// Resize updates the renderer to a new width and row count.
func (r *Renderer) Resize(cols, rows int) {
	if cols < 1 {
		cols = 1
	}
	if rows < 1 {
		rows = 1
	}
	r.cols = cols
	r.rows = rows
	r.w = cols
	r.h = rows * 2
	r.fb.Resize(r.w, r.h)
}

// Tick advances the animation by one frame. Call this from your Bubble Tea
// Update on each tick message.
func (r *Renderer) Tick() {
	r.frame++
}

// Width returns the current width in columns.
func (r *Renderer) Width() int { return r.cols }

// Rows returns the current height in cell rows.
func (r *Renderer) Rows() int { return r.rows }

// String renders the current frame and returns the ANSI-encoded half-block
// string. Safe to call from a Bubble Tea View.
func (r *Renderer) String() string {
	r.render()
	return r.encode()
}

const (
	fps       = 30
	glowFloor = 2.0
)

type vec2 struct{ x, y float64 }

func pointInTri(px, py float64, v [3]vec2) bool {
	sign := func(p, a, b vec2) float64 {
		return (p.x-b.x)*(a.y-b.y) - (a.x-b.x)*(p.y-b.y)
	}
	p := vec2{px, py}
	d1 := sign(p, v[0], v[1])
	d2 := sign(p, v[1], v[2])
	d3 := sign(p, v[2], v[0])
	hasNeg := d1 < 0 || d2 < 0 || d3 < 0
	hasPos := d1 > 0 || d2 > 0 || d3 > 0
	return !(hasNeg && hasPos)
}

func segDist(px, py, ax, ay, bx, by float64) float64 {
	dx, dy := bx-ax, by-ay
	l2 := dx*dx + dy*dy
	var t float64
	if l2 > 0 {
		t = ((px-ax)*dx + (py-ay)*dy) / l2
	}
	if t < 0 {
		t = 0
	} else if t > 1 {
		t = 1
	}
	ex, ey := px-(ax+t*dx), py-(ay+t*dy)
	return math.Sqrt(ex*ex + ey*ey)
}

func triEdgeDist(px, py float64, v [3]vec2) float64 {
	best := math.MaxFloat64
	for i := 0; i < 3; i++ {
		j := (i + 1) % 3
		if d := segDist(px, py, v[i].x, v[i].y, v[j].x, v[j].y); d < best {
			best = d
		}
	}
	return best
}

var bandColors = [4][3]float64{
	{59, 130, 246},  // blue
	{20, 184, 166},  // teal
	{34, 197, 94},   // green
	{245, 158, 11},  // amber
}

func bandLerp(t float64) (float64, float64, float64) {
	if t < 0 {
		t = 0
	} else if t > 1 {
		t = 1
	}
	ct := t * 3.0
	i := int(ct)
	f := ct - float64(i)
	if i >= 3 {
		i, f = 3, 0
	}
	j := i + 1
	if j > 3 {
		j = 3
	}
	a, b := bandColors[i], bandColors[j]
	lr := func(a, b, t float64) float64 { return a + (b-a)*t }
	return lr(a[0], b[0], f), lr(a[1], b[1], f), lr(a[2], b[2], f)
}

func clampf(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func (r *Renderer) render() {
	w := float64(r.w)
	h := float64(r.h)
	if w <= 0 || h <= 0 {
		return
	}

	t := float64(r.frame) / fps
	cx, cy := w/2, h/2

	minDim := w
	if h < minDim {
		minDim = h
	}
	s := minDim / 30.0
	if s < 0.1 {
		s = 0.1
	}

	// prism geometry
	angle := t * 0.2
	pSize := minDim * 0.35
	var tri [3]vec2
	for i := 0; i < 3; i++ {
		a := angle + float64(i)/3.0*2*math.Pi - math.Pi/2
		tri[i] = vec2{cx + math.Cos(a)*pSize, cy + math.Sin(a)*pSize}
	}

	// beam
	beamY := cy + math.Sin(t*0.3)*h*0.05
	entryX := cx - pSize*0.3
	exitX := cx + pSize*0.4
	dispAngle := 0.55 + math.Sin(t*0.15)*0.08

	for py := 0; py < r.h; py++ {
		y := float64(py)
		for px := 0; px < r.w; px++ {
			x := float64(px)

			// background + vignette
			vx := (x/w - 0.5) * 2
			vy := (y/h - 0.5) * 2
			vig := 1.0 - 0.4*(vx*vx+vy*vy)
			cr, cg, cb := 8.0*vig, 6.0*vig, 16.0*vig

			// incoming beam
			if x < entryX+4*s {
				bd := math.Abs(y - beamY)
				bw := (1.5 + x/w*1.5) * s
				if bd < bw {
					bi := math.Max(0, 1-bd/bw)
					bi = bi * bi * (0.7 + 0.3*(x/entryX))
					cr += 220 * bi
					cg += 215 * bi
					cb += 240 * bi
				}
				if bd < bw*3 {
					gl := math.Exp(-bd*bd/(bw*bw*6)) * 0.15
					gr, gg, gb := 120*gl, 115*gl, 150*gl
					if gr >= glowFloor || gg >= glowFloor || gb >= glowFloor {
						cr += gr
						cg += gg
						cb += gb
					}
				}
			}

			// dispersed bands
			if x > exitX-4*s {
				dx := x - exitX
				rs := w - exitX
				prog := 0.0
				if rs > 0 {
					prog = math.Min(1, dx/rs)
				}
				spread := dispAngle * dx
				bh := spread * 2 / 4
				if bh > 0.3*s {
					for band := 0; band < 4; band++ {
						bcy := beamY - spread + bh*(float64(band)+0.5)
						bd := math.Abs(y - bcy)
						bw := bh*0.55 + prog*0.8*s
						br, bg, bb := bandLerp(float64(band) / 3.0)
						if bd < bw {
							in := math.Max(0, 1-bd/bw)
							ii := in * in * (0.5 + 0.5*math.Min(1, dx/(8*s)))
							cr += br * ii
							cg += bg * ii
							cb += bb * ii
						}
						if bd < bw*2.5 {
							gl := math.Exp(-bd*bd/(bw*bw*4)) * 0.08 * (0.3 + prog*0.7)
							gr, gg, gb := br*gl, bg*gl, bb*gl
							if gr >= glowFloor || gg >= glowFloor || gb >= glowFloor {
								cr += gr
								cg += gg
								cb += gb
							}
						}
					}
				}
			}

			// glass prism
			inside := pointInTri(x, y, tri)
			ed := triEdgeDist(x, y, tri)

			if inside {
				depth := ed / pSize
				gr := 30.0 + 40.0*depth
				gg := 35.0 + 50.0*depth
				gb := 55.0 + 80.0*depth

				caus := math.Sin(x*0.3/s+y*0.2/s+t*1.5)*
					math.Sin(x*0.15/s-y*0.25/s+t*0.8)*0.5 + 0.5
				ci := caus * depth * 0.4

				al := 0.55 + 0.2*(1-depth)
				cr = cr*(1-al) + (gr+30*ci)*al
				cg = cg*(1-al) + (gg+20*ci)*al
				cb = cb*(1-al) + (gb+50*ci)*al

				ang := math.Atan2(y-cy, x-cx)
				sp := (ang/math.Pi + 1) * 0.5
				sr, sg, sb := bandLerp(sp)
				si := 0.12 * depth
				cr += sr * si
				cg += sg * si
				cb += sb * si
			}

			// edge highlight
			et := 2.5 * s
			if ed < et {
				ei := math.Max(0, 1-ed/et)
				ei = ei * ei * 0.8
				er, eg, eb := 140*ei, 150*ei, 200*ei
				if er >= glowFloor || eg >= glowFloor || eb >= glowFloor {
					cr += er
					cg += eg
					cb += eb
				}
			}

			// top-facet specular
			if inside {
				td := segDist(x, y, tri[0].x, tri[0].y, tri[1].x, tri[1].y)
				if td < pSize*0.15 {
					si := math.Exp(-td*td/(pSize*pSize*0.003)) * 0.6
					cr += 200 * si
					cg += 210 * si
					cb += 255 * si
				}
			}

			cr = clampf(cr, 0, 255)
			cg = clampf(cg, 0, 255)
			cb = clampf(cb, 0, 255)
			r.fb.SetPixel(px, py, color.RGBA{R: uint8(cr), G: uint8(cg), B: uint8(cb), A: 255})
		}
	}
}

func (r *Renderer) encode() string {
	var buf strings.Builder
	buf.Grow(r.cols * r.rows * 30)

	var lastFG, lastBG color.RGBA
	for row := 0; row < r.rows; row++ {
		first := true
		for col := 0; col < r.cols; col++ {
			topY := row * 2
			botY := row*2 + 1
			var top, bot color.RGBA
			if topY < r.fb.Height && col < r.fb.Width {
				top = r.fb.Pixels.RGBAAt(col, topY)
			}
			if botY < r.fb.Height && col < r.fb.Width {
				bot = r.fb.Pixels.RGBAAt(col, botY)
			}
			if first || top != lastFG {
				fmt.Fprintf(&buf, "\x1b[38;2;%d;%d;%dm", top.R, top.G, top.B)
				lastFG = top
			}
			if first || bot != lastBG {
				fmt.Fprintf(&buf, "\x1b[48;2;%d;%d;%dm", bot.R, bot.G, bot.B)
				lastBG = bot
			}
			buf.WriteString("\u2580")
			first = false
		}
		buf.WriteString("\x1b[0m")
		lastFG = color.RGBA{}
		lastBG = color.RGBA{}
		if row < r.rows-1 {
			buf.WriteByte('\n')
		}
	}
	return buf.String()
}
