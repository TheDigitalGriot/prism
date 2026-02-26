import * as path from 'path';

/**
 * Context for a Prism-managed Claude session.
 * Linked to an office agent when the session's JSONL file is discovered.
 */
export interface PrismAgentContext {
	sessionId: string;
	storyId?: string;
	storyTitle?: string;
	workflowPhase?: string;
}

/**
 * AgentBridge — connects PrismController sessions to Office agents.
 *
 * Flow:
 *   1. PrismController calls registerSession() before starting a CLI session
 *   2. Office discovers the JSONL file via project scan
 *   3. Office calls matchSession() to check if this JSONL belongs to Prism
 *   4. If matched, office calls setAgentContext() to bind the office agent to the context
 *   5. When Spectrum advances to a new story, updateStoryContext() updates the label
 *   6. When agent is removed, clearContext() cleans up
 */
export class AgentBridge {
	/** Session UUID → context (registered by PrismController before CLI starts) */
	private readonly _sessions = new Map<string, PrismAgentContext>();

	/** Office agent ID → context (set after JSONL is matched to an agent) */
	private readonly _contextMap = new Map<number, PrismAgentContext>();

	/**
	 * Register a Prism-managed session before it starts.
	 * Called by PrismController when spawning chat, skill, or spectrum sessions.
	 */
	registerSession(sessionId: string, context: Omit<PrismAgentContext, 'sessionId'>): void {
		this._sessions.set(sessionId, { sessionId, ...context });
	}

	/**
	 * Check whether a JSONL file belongs to a registered Prism session.
	 * Called when the Office discovers a new JSONL file via project scan.
	 * Returns the context if this session is Prism-managed, undefined otherwise.
	 */
	matchSession(jsonlPath: string): PrismAgentContext | undefined {
		const sessionId = path.basename(jsonlPath, '.jsonl');
		return this._sessions.get(sessionId);
	}

	/**
	 * Bind an office agent ID to a Prism agent context.
	 * Called by OfficeViewProvider after matching a JSONL file via matchSession().
	 */
	setAgentContext(agentId: number, context: PrismAgentContext): void {
		this._contextMap.set(agentId, context);
	}

	/**
	 * Update the story context for an agent (e.g., when Spectrum starts a new story).
	 * Called by PrismController when a story_started event fires.
	 */
	updateStoryContext(agentId: number, storyId: string, storyTitle: string): void {
		const ctx = this._contextMap.get(agentId);
		if (ctx) {
			this._contextMap.set(agentId, { ...ctx, storyId, storyTitle });
		}
	}

	/**
	 * Remove context for an office agent (called when agent is closed/removed).
	 */
	clearContext(agentId: number): void {
		const ctx = this._contextMap.get(agentId);
		if (ctx) {
			this._sessions.delete(ctx.sessionId);
		}
		this._contextMap.delete(agentId);
	}

	/**
	 * Get the context for an office agent (if it was matched to a Prism session).
	 */
	getContext(agentId: number): PrismAgentContext | undefined {
		return this._contextMap.get(agentId);
	}

	/**
	 * Get all active agent contexts (for PrismState office.activeAgents).
	 */
	getAllContexts(): ReadonlyMap<number, PrismAgentContext> {
		return this._contextMap;
	}

	/** Clear all registered sessions and agent contexts. */
	clear(): void {
		this._sessions.clear();
		this._contextMap.clear();
	}
}
