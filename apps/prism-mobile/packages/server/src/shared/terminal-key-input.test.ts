import { describe, expect, it } from "vitest";
import { encodeTerminalKeyInput } from "./terminal-key-input.js";

describe("encodeTerminalKeyInput", () => {
  it("encodes ctrl+b for tmux prefix", () => {
    expect(encodeTerminalKeyInput({ key: "b", ctrl: true })).toBe("\x02");
  });

  it("encodes shifted arrow key modifiers", () => {
    expect(encodeTerminalKeyInput({ key: "ArrowLeft", shift: true })).toBe("\x1b[1;2D");
  });

  it("encodes alt-modified printable keys", () => {
    expect(encodeTerminalKeyInput({ key: "x", alt: true })).toBe("\x1bx");
  });

  it("encodes enter and backspace", () => {
    expect(encodeTerminalKeyInput({ key: "Enter" })).toBe("\r");
    expect(encodeTerminalKeyInput({ key: "Backspace" })).toBe("\x7f");
  });

  it("encodes shift+enter as kitty keyboard protocol CSI u", () => {
    expect(encodeTerminalKeyInput({ key: "Enter", shift: true })).toBe("\x1b[13;2u");
  });

  it("encodes enter with modifiers using CSI u", () => {
    expect(encodeTerminalKeyInput({ key: "Enter", ctrl: true })).toBe("\x1b[13;5u");
    expect(encodeTerminalKeyInput({ key: "Enter", alt: true })).toBe("\x1b[13;3u");
    expect(encodeTerminalKeyInput({ key: "Enter", meta: true })).toBe("\x1b[13;9u");
    expect(encodeTerminalKeyInput({ key: "Enter", shift: true, ctrl: true })).toBe("\x1b[13;6u");
  });

  it("returns empty string for unsupported keys", () => {
    expect(encodeTerminalKeyInput({ key: "UnidentifiedKey" })).toBe("");
  });
});
