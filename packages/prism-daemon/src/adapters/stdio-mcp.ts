/**
 * StdioMcpAdapter — speaks MCP over a spawned subprocess's stdio (JSON-RPC 2.0,
 * newline-delimited). Used for code-intel (codebase-memory-mcp): `tools/list`
 * becomes the discovery manifest, `tools/call` becomes a service call.
 *
 * Spec: .prism/shared/designs/2026-06-12-daemon-broker-design.md (§5, StdioMcpAdapter)
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import type { ServiceDescriptor, SkillManifestEntry } from "../protocol";
import type { Adapter, ProbeResult, StreamEvent } from "./types";

const INIT_TIMEOUT_MS = 8000;

interface JsonRpcPending {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
}

interface McpTool {
  name: string;
  description?: string;
}

export class StdioMcpAdapter implements Adapter {
  readonly type = "stdio-mcp" as const;
  private proc?: ChildProcessWithoutNullStreams;
  private connecting?: Promise<void>;
  private connected = false;
  private nextId = 1;
  private stdoutBuffer = "";
  private readonly pending = new Map<number, JsonRpcPending>();
  private tools: SkillManifestEntry[] = [];

  constructor(private readonly desc: ServiceDescriptor) {
    if (!desc.spawnCmd) throw new Error(`StdioMcpAdapter: service '${desc.id}' has no spawnCmd`);
  }

  private parseCmd(): { cmd: string; args: string[] } {
    const parts = this.desc.spawnCmd!.trim().split(/\s+/);
    return { cmd: parts[0]!, args: parts.slice(1) };
  }

  connect(): Promise<void> {
    if (this.connected) return Promise.resolve();
    if (this.connecting) return this.connecting;

    this.connecting = new Promise<void>((resolve, reject) => {
      const { cmd, args } = this.parseCmd();
      let proc: ChildProcessWithoutNullStreams;
      try {
        proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
      } catch (err) {
        this.connecting = undefined;
        reject(err as Error);
        return;
      }
      this.proc = proc;

      const timer = setTimeout(() => {
        proc.kill();
        this.connecting = undefined;
        reject(new Error(`StdioMcpAdapter: '${this.desc.id}' initialize timed out after ${INIT_TIMEOUT_MS}ms`));
      }, INIT_TIMEOUT_MS);

      proc.on("error", (err) => {
        clearTimeout(timer);
        this.connecting = undefined;
        this.failAll(err);
        reject(err);
      });
      proc.stdout.on("data", (chunk: Buffer) => this.onData(chunk));
      proc.on("exit", () => {
        this.connected = false;
        this.failAll(new Error(`StdioMcpAdapter: '${this.desc.id}' process exited`));
      });

      this.request("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "prism-daemon", version: "0.1.0" },
      })
        .then(() => {
          this.notify("notifications/initialized", {});
          clearTimeout(timer);
          this.connected = true;
          this.connecting = undefined;
          resolve();
        })
        .catch((err: unknown) => {
          clearTimeout(timer);
          this.connecting = undefined;
          reject(err instanceof Error ? err : new Error(String(err)));
        });
    });
    return this.connecting;
  }

  private onData(chunk: Buffer): void {
    this.stdoutBuffer += chunk.toString();
    let nl: number;
    while ((nl = this.stdoutBuffer.indexOf("\n")) >= 0) {
      const line = this.stdoutBuffer.slice(0, nl).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(nl + 1);
      if (!line) continue;
      let msg: { id?: unknown; result?: unknown; error?: { message?: string } };
      try {
        msg = JSON.parse(line) as typeof msg;
      } catch {
        continue;
      }
      if (typeof msg.id === "number" && (msg.result !== undefined || msg.error !== undefined)) {
        const p = this.pending.get(msg.id);
        if (!p) continue;
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message ?? "MCP error"));
        else p.resolve(msg.result);
      }
      // server-initiated notifications (no id) are ignored for now
    }
  }

  private failAll(err: Error): void {
    for (const p of this.pending.values()) p.reject(err);
    this.pending.clear();
  }

  private write(obj: unknown): void {
    if (!this.proc) throw new Error(`StdioMcpAdapter: '${this.desc.id}' not started`);
    this.proc.stdin.write(`${JSON.stringify(obj)}\n`);
  }

  private request(method: string, params: unknown): Promise<unknown> {
    const id = this.nextId++;
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.write({ jsonrpc: "2.0", id, method, params });
    });
  }

  private notify(method: string, params: unknown): void {
    this.write({ jsonrpc: "2.0", method, params });
  }

  async probe(): Promise<ProbeResult> {
    const start = Date.now();
    try {
      await this.connect();
      const manifest = await this.describe();
      return { ok: true, via: "local", latencyMs: Date.now() - start, manifest };
    } catch {
      return { ok: false, via: "local", latencyMs: Date.now() - start };
    }
  }

  async describe(): Promise<SkillManifestEntry[]> {
    await this.connect();
    const result = (await this.request("tools/list", {})) as { tools?: McpTool[] };
    this.tools = (result.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description ?? "",
      methods: [t.name],
    }));
    return this.tools;
  }

  async call(method: string, payload: unknown): Promise<unknown> {
    await this.connect();
    return this.request("tools/call", { name: method, arguments: payload ?? {} });
  }

  async *stream(method: string, payload: unknown): AsyncGenerator<StreamEvent> {
    // MCP tools are unary; surface the single result as one stream frame.
    const result = await this.call(method, payload);
    yield { seq: 0, kind: "result", data: result };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.connecting = undefined;
    this.proc?.kill();
    this.proc = undefined;
  }
}
