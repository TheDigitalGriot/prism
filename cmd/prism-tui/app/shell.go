package app

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
	zone "github.com/lrstanley/bubblezone"
	"github.com/prism-plugin/prism-tui/styles"
)

// renderAppShell renders the application shell with tab bar, content, and footer.
// When the terminal is wide enough (>= 120 cols), a full-height right-side panel
// (inspired by Crush) is rendered alongside the left column (tabs + content + footer).
func (m Model) renderAppShell(content string) string {
	if m.showSidebar() {
		leftWidth := m.Width - SidebarWidth

		// Tab bar (left column width)
		tabBar := m.renderTabBar(leftWidth)

		// Adjust sidebar height to account for tab bar (1 line) + two-tier footer (2 lines)
		sidebarHeight := m.Height - 3

		// Content + sidebar horizontal join (NO footer here)
		contentRow := lipgloss.JoinHorizontal(lipgloss.Top, content, m.renderSidebar(sidebarHeight))

		// Two-tier footer at full terminal width
		footer := m.renderTwoTierFooter(m.Width)

		return lipgloss.JoinVertical(lipgloss.Left, tabBar, contentRow, footer)
	}

	// No sidebar — standard vertical layout
	tabBar := m.renderTabBar(m.Width)
	footer := m.renderTwoTierFooter(m.Width)
	return lipgloss.JoinVertical(lipgloss.Left, tabBar, content, footer)
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

	// Right: elapsed time from Spectrum plugin if running
	rightSection := ""
	if sp, ok := m.Registry.ActivePlugin().(*SpectrumPlugin); ok {
		if sp.state == StateRunning && !sp.startTime.IsZero() {
			elapsed := formatDuration(sp.elapsedTime())
			rightSection = styles.DimStyle.Render(elapsed)
		}
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

// tabLabel returns the display label for a plugin tab.
func tabLabel(i int, p interface{ Icon() string; Name() string }) string {
	icon := p.Icon()
	if icon != "" {
		return fmt.Sprintf("[%d] %s %s", i+1, icon, p.Name())
	}
	return fmt.Sprintf("[%d] %s", i+1, p.Name())
}

// renderTabBar renders the tab navigation bar.
// Uses bordered tabs when they fit; falls back to a compact inline style for narrow terminals.
func (m Model) renderTabBar(width int) string {
	// Estimate bordered tab width: each label + border(2) + padding(2) = +4 per tab
	totalBorderedWidth := 0
	for i, view := range m.TabOrder {
		pluginID := viewToPluginID(view)
		p := m.Registry.PluginByID(pluginID)
		if p == nil {
			continue
		}
		totalBorderedWidth += len(tabLabel(i, p)) + 4 // border + padding overhead
	}

	if totalBorderedWidth > width-2 {
		return m.renderCompactTabBar(width)
	}
	return m.renderBorderedTabBar(width)
}

// renderBorderedTabBar renders the full bordered tab bar.
func (m Model) renderBorderedTabBar(width int) string {
	var renderedTabs []string

	for i, view := range m.TabOrder {
		pluginID := viewToPluginID(view)
		p := m.Registry.PluginByID(pluginID)
		if p == nil {
			continue
		}
		label := tabLabel(i, p)

		isActive := pluginID == viewToPluginID(m.ActiveView)
		isFirst := i == 0
		isLast := i == len(m.TabOrder)-1

		var style lipgloss.Style
		if isActive {
			style = styles.TabActiveStyle
		} else {
			style = styles.TabInactiveStyle
		}

		// Adjust border corners for first/last tabs so the bottom rule
		// connects cleanly to the edges
		border, _, _, _, _ := style.GetBorder()
		if isFirst && isActive {
			border.BottomLeft = "│"
		} else if isFirst && !isActive {
			border.BottomLeft = "├"
		}
		if isLast && isActive {
			border.BottomRight = "│"
		} else if isLast && !isActive {
			border.BottomRight = "┤"
		}
		style = style.Border(border)

		tabZoneID := fmt.Sprintf("tab-%d", i)
		renderedTabs = append(renderedTabs, zone.Mark(tabZoneID, style.Render(label)))
	}

	row := lipgloss.JoinHorizontal(lipgloss.Top, renderedTabs...)

	// Fill remaining width with a bottom-border gap so the rule spans full width
	rowWidth := lipgloss.Width(row)
	gapWidth := width - rowWidth - 2
	if gapWidth > 0 {
		gap := styles.TabGapStyle.Render(strings.Repeat(" ", gapWidth))
		row = lipgloss.JoinHorizontal(lipgloss.Bottom, row, gap)
	}

	return row
}

// renderCompactTabBar renders a single-line compact tab bar for narrow terminals.
func (m Model) renderCompactTabBar(width int) string {
	var parts []string

	for i, view := range m.TabOrder {
		pluginID := viewToPluginID(view)
		p := m.Registry.PluginByID(pluginID)
		if p == nil {
			continue
		}
		label := fmt.Sprintf(" %d:%s ", i+1, p.Name())

		isActive := pluginID == viewToPluginID(m.ActiveView)
		tabZoneID := fmt.Sprintf("tab-%d", i)
		if isActive {
			parts = append(parts, zone.Mark(tabZoneID, styles.CurrentStyle.Bold(true).Render(label)))
		} else {
			parts = append(parts, zone.Mark(tabZoneID, styles.DimStyle.Render(label)))
		}
	}

	row := strings.Join(parts, styles.DimStyle.Render("│"))

	// Bottom rule to match bordered style
	rule := styles.DimStyle.Render(strings.Repeat("─", width-2))

	return row + "\n" + rule
}

// renderAppFooter has been replaced by renderTwoTierFooter in footer.go
// The key hints logic moved to renderKeyHintsFooter (tier 1)
// The powerline bar logic is in renderPowerlineFooter (tier 2)
