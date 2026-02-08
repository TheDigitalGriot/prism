// Package prism renders an animated light-through-prism dispersion effect
// as a terminal string using half-block characters. Optimized for small
// header displays in Bubble Tea applications.
//
// Usage:
//
//	p := prism.New(30, 3)       // 30 columns, 3 cell rows
//	p.Tick()                    // advance animation (call each frame)
//	header := p.String()        // ANSI-encoded string ready for stdout
//	p.Resize(40, 3)             // handle terminal resize
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

// Tick advances the animation by one frame.
func (r *Renderer) Tick() {
	r.frame++
}

// Width returns the current width in columns.
func (r *Renderer) Width() int { return r.cols }

// Rows returns the current height in cell rows.
func (r *Renderer) Rows() int { return r.rows }

// String renders the current frame and returns the ANSI-encoded half-block
// string.
func (r *Renderer) String() string {
	r.render()
	return r.encode()
}

const fps = 30.0

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

// Spectrum: blue -> teal -> green -> amber
var bandColors = [4][3]float64{
	{59, 130, 246},
	{20, 184, 166},
	{34, 197, 94},
	{245, 158, 11},
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

// render draws a static upright prism with animated beam, dispersion rays,
// and glass shimmer. Optimized for small canvas (20-40 cols, 3 rows / 6px).
func (r *Renderer) render() {
	w := float64(r.w)
	h := float64(r.h)
	if w <= 0 || h <= 0 {
		return
	}

	t := float64(r.frame) / fps

	// === Prism geometry: static upright triangle ===
	// Positioned left-of-center to leave room for dispersion rays
	cx := w * 0.38
	cy := h * 0.5
	triH := h * 0.85                 // triangle height
	halfBase := triH * 0.55          // half the base width
	apexY := cy - triH/2             // top
	baseY := cy + triH/2             // bottom
	tri := [3]vec2{
		{cx, apexY},              // apex (top)
		{cx - halfBase, baseY},   // base-left
		{cx + halfBase, baseY},   // base-right
	}

	// Beam enters at vertical center, from the left
	beamY := cy
	// Where beam hits the left face of the prism
	beamHitX := cx - halfBase*0.35

	// Rays exit from right face of the prism
	rayStartX := cx + halfBase*0.4

	for py := 0; py < r.h; py++ {
		y := float64(py)
		for px := 0; px < r.w; px++ {
			x := float64(px)

			// === Background: dark with subtle blue-purple vignette ===
			vx := (x/w - 0.5) * 2
			vy := (y/h - 0.5) * 2
			vig := 1.0 - 0.35*(vx*vx+vy*vy)
			cr := 12.0 * vig
			cg := 10.0 * vig
			cb := 22.0 * vig

			// === Incoming white beam (left side) ===
			if x <= beamHitX+3 {
				bd := math.Abs(y - beamY)
				// Beam width pulses gently
				bw := 1.2 + 0.25*math.Sin(t*1.8)

				// Core beam
				if bd < bw*1.5 {
					bi := math.Max(0, 1-bd/(bw*1.5))
					bi *= bi
					// Fade in from left edge
					fade := clampf(x/(beamHitX*0.6), 0, 1)
					pulse := 0.85 + 0.15*math.Sin(t*2.5+x*0.12)
					bi *= fade * pulse
					cr += 240 * bi
					cg += 235 * bi
					cb += 255 * bi
				}
				// Soft glow around beam
				if bd < bw*4 {
					gl := math.Exp(-bd*bd/(bw*bw*8)) * 0.12
					fade := clampf(x/(beamHitX*0.8), 0, 1)
					cr += 110 * gl * fade
					cg += 105 * gl * fade
					cb += 140 * gl * fade
				}
			}

			// === Dispersed spectrum rays (right side) ===
			if x >= rayStartX-1 {
				dx := x - rayStartX
				if dx < 0 {
					dx = 0
				}
				// Spread factor: rays fan out. Subtle animation on spread.
				spreadF := 0.5 + 0.06*math.Sin(t*0.25)
				spread := dx * spreadF

				for band := 0; band < 4; band++ {
					// Fan from center: band 0 goes up, band 3 goes down
					bandT := (float64(band) - 1.5) / 1.5
					bandY := beamY + bandT*spread

					bd := math.Abs(y - bandY)
					// Rays widen as they travel
					bw := 0.7 + dx*0.018

					// Per-ray brightness animation (staggered phase)
					rayBright := 0.7 + 0.3*math.Sin(t*1.2+float64(band)*1.5)

					br, bg, bb := bandLerp(float64(band) / 3.0)

					if bd < bw {
						in := math.Max(0, 1-bd/bw)
						in = in * in * rayBright
						// Fade in as rays emerge from prism
						fade := clampf(dx/3.5, 0, 1)
						in *= fade
						cr += br * in
						cg += bg * in
						cb += bb * in
					}
					// Glow around each ray
					if bd < bw*2.5 {
						gl := math.Exp(-bd*bd/(bw*bw*4)) * 0.07 * rayBright
						fade := clampf(dx/5, 0, 1)
						cr += br * gl * fade
						cg += bg * gl * fade
						cb += bb * gl * fade
					}
				}
			}

			// === Glass prism body ===
			inside := pointInTri(x, y, tri)
			ed := triEdgeDist(x, y, tri)

			if inside {
				depth := clampf(ed/(triH*0.25), 0, 1)

				// Glass base color: blue-white crystal
				gr := 35.0 + 55.0*depth
				gg := 42.0 + 65.0*depth
				gb := 70.0 + 110.0*depth

				// Caustic shimmer inside glass
				caus := math.Sin(x*0.5+y*0.35+t*2.0)*
					math.Sin(x*0.25-y*0.4+t*1.1)*0.5 + 0.5
				ci := caus * depth * 0.35

				// Semi-transparent overlay
				al := 0.6 + 0.15*(1-depth)
				cr = cr*(1-al) + (gr+40*ci)*al
				cg = cg*(1-al) + (gg+25*ci)*al
				cb = cb*(1-al) + (gb+60*ci)*al

				// Internal spectrum tint (top=blue, bottom=amber)
				sp := clampf((y-apexY)/triH, 0, 1)
				sr, sg, sb := bandLerp(sp)
				si := 0.1 * depth
				cr += sr * si
				cg += sg * si
				cb += sb * si
			}

			// === Edge highlights ===
			edgeW := 1.8
			if ed < edgeW {
				ei := math.Max(0, 1-ed/edgeW)
				ei = ei * ei * 0.9
				shimmer := 0.8 + 0.2*math.Sin(t*3+ed*2)
				cr += 155 * ei * shimmer
				cg += 165 * ei * shimmer
				cb += 225 * ei * shimmer
			}

			// === Left-face specular highlight ===
			if inside {
				td := segDist(x, y, tri[0].x, tri[0].y, tri[1].x, tri[1].y)
				hw := triH * 0.1
				if td < hw {
					si := math.Exp(-td*td/(hw*hw*0.5)) * 0.55
					cr += 190 * si
					cg += 200 * si
					cb += 250 * si
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
