/**
 * Platform-agnostic workspace discovery logic.
 *
 * Extracted from cmd/prism-vscode/src/hosts/vscode/PrismPanelProvider.ts.
 * All pure Node.js — no vscode or electron imports.
 */

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import type { EpicInfo, ProjectInfo, WorktreeInfo } from './types';

const execAsync = util.promisify(child_process.exec);

// ---------------------------------------------------------------------------
// Stories parsing
// ---------------------------------------------------------------------------

export function parseStoriesJson(filePath: string): { total: number; complete: number } | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw) as {
      stories?: Array<{ status?: string }>;
    };
    const stories = json.stories ?? [];
    const total = stories.length;
    const complete = stories.filter((s) => s.status === 'complete').length;
    return { total, complete };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Porcelain worktree parsing
// ---------------------------------------------------------------------------

export function parsePorcelainWorktrees(output: string): WorktreeInfo[] {
  const blocks = output.trim().split(/\n\n+/);
  return blocks
    .map((block, index): WorktreeInfo | null => {
      const lines = block.trim().split('\n');
      const worktreeLine = lines.find((l) => l.startsWith('worktree '));
      const headLine = lines.find((l) => l.startsWith('HEAD '));
      const branchLine = lines.find((l) => l.startsWith('branch '));
      const isBare = lines.some((l) => l === 'bare');
      const prunable = lines.some((l) => l.startsWith('prunable'));

      if (!worktreeLine) return null;

      const wtPath = worktreeLine.slice('worktree '.length).trim();
      const head = headLine ? headLine.slice('HEAD '.length).trim().slice(0, 7) : '???????';
      const rawBranch = branchLine ? branchLine.slice('branch '.length).trim() : '';
      const branch = rawBranch.replace(/^refs\/heads\//, '') || '(detached)';

      return {
        path: wtPath,
        branch,
        head,
        isBare,
        isMain: index === 0,
        prunable,
      };
    })
    .filter((wt): wt is WorktreeInfo => wt !== null);
}

// ---------------------------------------------------------------------------
// Build project info
// ---------------------------------------------------------------------------

export async function buildProjectInfo(
  projectPath: string,
  currentResolved: string,
): Promise<ProjectInfo | null> {
  try {
    const stat = await fs.promises.stat(projectPath);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  const name = path.basename(projectPath);
  const isCurrent = projectPath === currentResolved;

  let branch = 'unknown';
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
      cwd: projectPath,
      timeout: 5_000,
    });
    branch = stdout.trim() || 'unknown';
  } catch {
    // Not a git repo or git not installed
  }

  const prismDir = path.join(projectPath, '.prism');
  const epics: EpicInfo[] = [];
  let storiesTotal = 0;
  let storiesComplete = 0;

  const rootStoriesPaths = [
    path.join(prismDir, 'stories', 'stories.json'),
    path.join(prismDir, 'stories.json'),
  ];
  for (const sp of rootStoriesPaths) {
    const result = parseStoriesJson(sp);
    if (result) {
      storiesTotal += result.total;
      storiesComplete += result.complete;
      break;
    }
  }

  try {
    const storiesDir = path.join(prismDir, 'stories');
    const entries = await fs.promises.readdir(storiesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const epicStoriesPath = path.join(storiesDir, entry.name, 'stories.json');
      const result = parseStoriesJson(epicStoriesPath);
      if (result) {
        epics.push({
          name: entry.name,
          storiesPath: epicStoriesPath,
          storyCount: result.total,
          completedCount: result.complete,
        });
        storiesTotal += result.total;
        storiesComplete += result.complete;
      }
    }
  } catch {
    // No stories dir — fine
  }

  return { name, path: projectPath, branch, storiesTotal, storiesComplete, epics, isCurrent };
}

// ---------------------------------------------------------------------------
// Discover projects
// ---------------------------------------------------------------------------

export async function discoverProjects(workspaceRoot: string): Promise<ProjectInfo[]> {
  const parentDir = path.dirname(workspaceRoot);
  const seen = new Set<string>();
  const candidates: string[] = [];

  // Scan sibling directories for .prism/ presence
  try {
    const siblings = await fs.promises.readdir(parentDir, { withFileTypes: true });
    for (const entry of siblings.slice(0, 50)) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(parentDir, entry.name);
      try {
        await fs.promises.stat(path.join(fullPath, '.prism'));
        const resolved = path.resolve(fullPath);
        if (!seen.has(resolved)) {
          seen.add(resolved);
          candidates.push(resolved);
        }
      } catch {
        // No .prism/ — skip
      }
    }
  } catch {
    // Can't read parent dir — no-op
  }

  // Read global workspaces registry
  try {
    const globalPath = path.join(os.homedir(), '.prism', 'workspaces.json');
    const raw = await fs.promises.readFile(globalPath, 'utf-8');
    const parsed = JSON.parse(raw) as { paths?: string[]; workspaces?: string[] };
    const globalPaths = parsed.paths ?? parsed.workspaces ?? [];
    for (const p of globalPaths) {
      const resolved = path.resolve(p);
      if (!seen.has(resolved)) {
        seen.add(resolved);
        candidates.push(resolved);
      }
    }
  } catch {
    // File doesn't exist or malformed — skip
  }

  const currentResolved = path.resolve(workspaceRoot);
  const projects: ProjectInfo[] = [];

  await Promise.all(
    candidates.map(async (projectPath) => {
      try {
        const info = await buildProjectInfo(projectPath, currentResolved);
        if (info) projects.push(info);
      } catch {
        // Skip broken projects
      }
    }),
  );

  projects.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return a.name.localeCompare(b.name);
  });

  return projects;
}

// ---------------------------------------------------------------------------
// Add to global workspaces registry
// ---------------------------------------------------------------------------

export async function addToGlobalWorkspaces(projectPath: string): Promise<void> {
  const globalDir = path.join(os.homedir(), '.prism');
  const globalFile = path.join(globalDir, 'workspaces.json');

  try {
    await fs.promises.mkdir(globalDir, { recursive: true });
  } catch {
    // Already exists
  }

  let data: { paths: string[] } = { paths: [] };
  try {
    const raw = await fs.promises.readFile(globalFile, 'utf-8');
    const parsed = JSON.parse(raw) as { paths?: string[] };
    data.paths = parsed.paths ?? [];
  } catch {
    // File doesn't exist yet
  }

  const resolved = path.resolve(projectPath);
  if (!data.paths.some((p) => path.resolve(p) === resolved)) {
    data.paths.push(resolved);
    await fs.promises.writeFile(globalFile, JSON.stringify(data, null, 2), 'utf-8');
  }
}

// ---------------------------------------------------------------------------
// List worktrees
// ---------------------------------------------------------------------------

export async function listWorktrees(workspaceRoot: string): Promise<WorktreeInfo[]> {
  try {
    const { stdout: rootOut } = await execAsync('git rev-parse --show-toplevel', {
      cwd: workspaceRoot,
      timeout: 5_000,
    });
    const gitRoot = rootOut.trim();

    const { stdout } = await execAsync('git worktree list --porcelain', {
      cwd: gitRoot,
      timeout: 10_000,
    });

    return parsePorcelainWorktrees(stdout);
  } catch {
    return [];
  }
}
