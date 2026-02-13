package app

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/prism-plugin/prism-tui/styles"
)

// renderAppShell renders the application shell with header, tab bar, content, and footer
func (m Model) renderAppShell(content string) string {
	var sections []string

	// App header (3D prism + project name)
	sections = append(sections, m.renderAppHeader())

	// Tab bar
	sections = append(sections, m.renderTabBar())

	// Active view content
	sections = append(sections, content)

	// Footer (context-sensitive key hints)
	sections = append(sections, m.renderAppFooter())

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

// renderAppHeader renders the persistent app header with 3D prism and project info
func (m Model) renderAppHeader() string {
	// Left: 3D prism animation
	var leftSection string
	if m.Prism != nil {
		prismStr := m.Prism.String()
		leftSection = prismStr
	} else {
		// Fallback: simple prism icon
		leftSection = styles.RenderPrismCompact(m.Anim.PrismFrame)
	}

	// Middle: Project name
	projectName := "PRISM TUI"
	if m.ProjectDir != "" {
		// Extract project directory name
		parts := strings.Split(strings.ReplaceAll(m.ProjectDir, "\\", "/"), "/")
		if len(parts) > 0 {
			projectName = parts[len(parts)-1]
		}
	}
	middleSection := styles.TitleStyle.Render(projectName)

	// Right: Branch info (future enhancement) + time
	rightSection := ""
	if !m.StartTime.IsZero() && m.State == StateRunning {
		elapsed := formatDuration(m.ElapsedTime())
		rightSection = styles.DimStyle.Render(elapsed)
	}

	// Calculate spacing
	leftWidth := lipgloss.Width(leftSection)
	middleWidth := lipgloss.Width(middleSection)
	rightWidth := lipgloss.Width(rightSection)
	totalContentWidth := leftWidth + middleWidth + rightWidth
	spacerWidth := m.Width - totalContentWidth - 4
	if spacerWidth < 2 {
		spacerWidth = 2
	}

	// Join sections
	header := lipgloss.JoinHorizontal(lipgloss.Center,
		leftSection,
		" ",
		middleSection,
		strings.Repeat(" ", spacerWidth),
		rightSection,
	)

	return styles.AppHeaderStyle.Width(m.Width).Render(header)
}

// renderTabBar renders the tab navigation bar
func (m Model) renderTabBar() string {
	var tabs []string

	// Icon/label mapping for tabs
	tabInfo := map[ActiveView]struct {
		number int
		label  string
		icon   string
	}{
		ViewHome:     {1, "Home", "⌂"},
		ViewResearch: {2, "Research", "📝"},
		ViewPlans:    {3, "Plans", "📋"},
		ViewSpectrum: {4, "Spectrum", "▶"},
	}

	for _, view := range m.TabOrder {
		info, exists := tabInfo[view]
		if !exists {
			continue
		}

		tabLabel := fmt.Sprintf("[%d] %s %s", info.number, info.icon, info.label)

		if view == m.ActiveView {
			tabs = append(tabs, styles.TabActiveStyle.Render(tabLabel))
		} else {
			tabs = append(tabs, styles.TabInactiveStyle.Render(tabLabel))
		}
	}

	tabBar := lipgloss.JoinHorizontal(lipgloss.Center, tabs...)
	return styles.PanelStyle.Width(m.Width - 2).Render(tabBar)
}

// renderAppFooter renders context-sensitive key hints
func (m Model) renderAppFooter() string {
	var hints []string

	// Global hints
	hints = append(hints, "[1-4] switch tabs")
	hints = append(hints, "[tab/shift+tab] cycle")

	// View-specific hints
	switch m.ActiveView {
	case ViewHome:
		hints = append(hints, "[j/k] navigate")
		hints = append(hints, "[enter] select")
	case ViewResearch, ViewPlans:
		if m.ActiveView == ViewResearch && m.Research.Viewing {
			hints = append(hints, "[esc] back to list")
		} else if m.ActiveView == ViewPlans && m.Plans.Viewing {
			hints = append(hints, "[esc] back to list")
		} else {
			hints = append(hints, "[j/k] navigate")
			hints = append(hints, "[enter] view")
		}
	case ViewSpectrum:
		switch m.State {
		case StateIdle:
			hints = append(hints, "[enter] start")
		case StateRunning:
			hints = append(hints, "[p] pause")
			hints = append(hints, "[/] skip")
		case StatePaused:
			hints = append(hints, "[p] resume")
		case StateComplete, StateMaxIterations, StateError:
			hints = append(hints, "[enter] quit")
		}
		hints = append(hints, "[a/s] page stories")
		hints = append(hints, "[z/x] page logs")
	}

	// Always show help and quit
	hints = append(hints, "[?] help")
	hints = append(hints, "[q] quit")

	footerText := strings.Join(hints, "  ")
	return styles.FooterStyle.Width(m.Width - 2).Render(footerText)
}
