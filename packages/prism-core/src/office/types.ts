/** Synchronous fire-and-forget function to post a message to the webview/renderer. */
export type PostMessageFn = (msg: unknown) => void;

export interface AgentState {
	id: number;
	terminalRef: unknown | null;  // platform-specific handle (vscode.Terminal, ChildProcess, etc.)
	projectDir: string;
	jsonlFile: string;
	fileOffset: number;
	lineBuffer: string;
	activeToolIds: Set<string>;
	activeToolStatuses: Map<string, string>;
	activeToolNames: Map<string, string>;
	activeSubagentToolIds: Map<string, Set<string>>; // parentToolId → active sub-tool IDs
	activeSubagentToolNames: Map<string, Map<string, string>>; // parentToolId → (subToolId → toolName)
	isWaiting: boolean;
	permissionSent: boolean;
	hadToolsInTurn: boolean;
}

export interface PersistedAgent {
	id: number;
	terminalName: string;
	jsonlFile: string;
	projectDir: string;
}
