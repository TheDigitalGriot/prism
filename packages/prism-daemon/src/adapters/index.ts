/**
 * Adapter factory — maps a ServiceDescriptor's adapterType to its implementation.
 * Phases 3-5 register rest / stdio-mcp / flask-http here.
 */
import type { ServiceDescriptor } from "../protocol";
import type { Adapter } from "./types";
import { WebSocketAdapter } from "./websocket";
import { PaseoWebSocketAdapter } from "./paseo-websocket";
import { StdioMcpAdapter } from "./stdio-mcp";
import { FlaskHttpAdapter } from "./flask-http";
import { RestAdapter } from "./rest";

export function createAdapter(desc: ServiceDescriptor): Adapter {
  switch (desc.adapterType) {
    case "websocket":
      return new WebSocketAdapter(desc);
    case "websocket-paseo":
      return new PaseoWebSocketAdapter(desc);
    case "stdio-mcp":
      return new StdioMcpAdapter(desc);
    case "flask-http":
      return new FlaskHttpAdapter(desc);
    case "rest":
      return new RestAdapter(desc);
    default:
      throw new Error(`No adapter implementation for type '${desc.adapterType}' (service '${desc.id}')`);
  }
}

export type { Adapter, AdapterFactory, ProbeResult, StreamEvent } from "./types";
