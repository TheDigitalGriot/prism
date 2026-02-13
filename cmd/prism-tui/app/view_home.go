package app

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/prism-plugin/prism-tui/styles"
)

// renderHomeView renders the Home screen with menu navigation
func (m Model) renderHomeView() string {
	var sections []string

	// ASCII logo (prism is now in app shell header)
	logo := m.renderPrismLogo()
	sections = append(sections, styles.PanelStyle.Width(m.Width-2).Render(logo))
	sections = append(sections, "")

	// Menu items (numbers now switch tabs, so we use icons instead)
	type menuItem struct {
		label string
		desc  string
		icon  string
	}
	items := []menuItem{
		{"Research", "Browse and create research documents", "📝"},
		{"Plans", "View and decompose implementation plans", "📋"},
		{"Spectrum", "Execute stories autonomously", "▶"},
	}

	menuWidth := m.Width - 8
	if menuWidth < 40 {
		menuWidth = 40
	}

	for i, item := range items {
		selected := i == m.Home.SelectedIndex
		line := fmt.Sprintf("  %s  %-12s %s", item.icon, item.label, item.desc)

		if selected {
			// Highlight selected item
			styledLine := styles.CurrentStyle.Bold(true).Render(fmt.Sprintf("  >  %s", line))
			sections = append(sections, styledLine)
		} else {
			styledLine := styles.DimStyle.Render(fmt.Sprintf("     %s", line))
			sections = append(sections, styledLine)
		}
		sections = append(sections, "") // spacing
	}

	// Navigation hints
	sections = append(sections, "")
	hints := styles.DimStyle.Render(strings.Repeat(" ", 6) + "j/k navigate   enter select   q quit")
	sections = append(sections, hints)

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

// handleHomeKeyPress handles keys for the Home view
func (m Model) handleHomeKeyPress(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	key := msg.String()

	switch key {
	case "j", "down":
		m.Home.SelectedIndex = (m.Home.SelectedIndex + 1) % len(m.Home.MenuItems)
		return m, nil
	case "k", "up":
		m.Home.SelectedIndex = (m.Home.SelectedIndex - 1 + len(m.Home.MenuItems)) % len(m.Home.MenuItems)
		return m, nil
	case "enter", " ":
		cmd := m.navigateToMenuItem()
		return m, cmd
	}

	return m, nil
}

// navigateToMenuItem handles menu selection, setting ActiveView and returning the appropriate command.
// In demo mode, all data is pre-loaded so no file commands are needed.
func (m *Model) navigateToMenuItem() tea.Cmd {
	switch m.Home.SelectedIndex {
	case 0: // Research
		m.ActiveView = ViewResearch
		if m.DemoMode {
			return nil
		}
		return LoadResearchFilesCmd(m.PrismDir)
	case 1: // Plans
		m.ActiveView = ViewPlans
		if m.DemoMode {
			return nil
		}
		return LoadPlansFilesCmd(m.PrismDir)
	case 2: // Spectrum
		m.ActiveView = ViewSpectrum
		if m.DemoMode {
			return nil
		}
		if m.StoriesPath != "" {
			return LoadStoriesCmd(m.StoriesPath)
		}
		return DiscoverEpicsCmd(m.PrismDir)
	}
	return nil
}
