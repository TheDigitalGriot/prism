/**
 * Shared workspace types — used by both VSCode PrismPanelProvider and
 * Electron ElectronIPCBridge / WorkspacePanel.
 */

export interface EpicInfo {
  name: string;
  storiesPath: string;
  storyCount: number;
  completedCount: number;
}

export interface ProjectInfo {
  name: string;
  path: string;
  branch: string;
  storiesTotal: number;
  storiesComplete: number;
  epics: EpicInfo[];
  isCurrent: boolean;
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  head: string;
  isBare: boolean;
  isMain: boolean;
  prunable: boolean;
  agentStatus?: {
    agentType: string;
    status: string;
  };
}

export interface WorkspacesState {
  projects: ProjectInfo[];
  worktrees: WorktreeInfo[];
  loading: boolean;
}
