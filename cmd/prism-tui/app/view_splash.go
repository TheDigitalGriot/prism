package app

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/prism-plugin/prism-tui/styles"
)

// renderSplashView renders the startup splash screen
func (m Model) renderSplashView() string {
	if !m.Ready {
		return "\n  Initializing..."
	}

	// Calculate center positions
	centerX := m.Width / 2
	centerY := m.Height / 2

	var sections []string

	// Vertical spacing to center content
	topPadding := centerY - 8 // Adjust based on content height
	if topPadding < 0 {
		topPadding = 0
	}
	sections = append(sections, strings.Repeat("\n", topPadding))

	// 1. 3D Prism Animation (centered)
	if m.Prism != nil {
		prismStr := m.Prism.String()
		prismLines := strings.Split(prismStr, "\n")
		for _, line := range prismLines {
			lineWidth := lipgloss.Width(line)
			leftPad := centerX - (lineWidth / 2)
			if leftPad < 0 {
				leftPad = 0
			}
			sections = append(sections, strings.Repeat(" ", leftPad)+line)
		}
	}

	sections = append(sections, "\n")

	// 2. PRISM Logo Gradient (centered)
	logo := m.renderPrismLogo()
	logoLines := strings.Split(logo, "\n")
	for _, line := range logoLines {
		lineWidth := lipgloss.Width(line)
		leftPad := centerX - (lineWidth / 2)
		if leftPad < 0 {
			leftPad = 0
		}
		sections = append(sections, strings.Repeat(" ", leftPad)+line)
	}

	sections = append(sections, "\n\n")

	// 3. Version String (centered)
	version := "v1.0.0-alpha"
	versionStyled := styles.DimStyle.Render(version)
	versionWidth := lipgloss.Width(versionStyled)
	versionPad := centerX - (versionWidth / 2)
	if versionPad < 0 {
		versionPad = 0
	}
	sections = append(sections, strings.Repeat(" ", versionPad)+versionStyled)

	sections = append(sections, "\n")

	// 4. Project Directory (centered)
	projectInfo := ""
	if m.ProjectDir != "" {
		// Extract project directory name
		parts := strings.Split(strings.ReplaceAll(m.ProjectDir, "\\", "/"), "/")
		projectName := "prism-plugin"
		if len(parts) > 0 && parts[len(parts)-1] != "" {
			projectName = parts[len(parts)-1]
		}
		projectInfo = fmt.Sprintf("Project: %s", projectName)
	} else if m.PrismDir != "" {
		projectInfo = "Prism TUI Dashboard"
	} else {
		projectInfo = "No project loaded"
	}
	projectStyled := styles.InfoStyle.Render(projectInfo)
	projectWidth := lipgloss.Width(projectStyled)
	projectPad := centerX - (projectWidth / 2)
	if projectPad < 0 {
		projectPad = 0
	}
	sections = append(sections, strings.Repeat(" ", projectPad)+projectStyled)

	sections = append(sections, "\n\n")

	// 5. "Press any key..." hint (centered, with animation pulse)
	hint := "Press any key to continue..."
	hintStyled := styles.DimStyle.Render(hint)
	hintWidth := lipgloss.Width(hintStyled)
	hintPad := centerX - (hintWidth / 2)
	if hintPad < 0 {
		hintPad = 0
	}
	sections = append(sections, strings.Repeat(" ", hintPad)+hintStyled)

	return strings.Join(sections, "")
}
