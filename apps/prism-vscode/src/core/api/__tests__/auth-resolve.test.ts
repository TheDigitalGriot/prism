/**
 * Unit tests for resolveAnthropicAuth (shared prism-core auth resolver).
 *
 * STRICT subscription-first policy: the Claude Code subscription OAuth token
 * (CLAUDE_CODE_OAUTH_TOKEN) is always preferred; the metered API key is used
 * ONLY when the subscription token is absent AND GRIOT_ALLOW_METERED is set.
 * Otherwise the resolver returns `none` — a Griot tool never silently bills the
 * metered API. (Whether the raw Messages API bills the subscription for an OAuth
 * token is verified against a live account, not here — this locks the policy.)
 */
import {
  resolveAnthropicAuth,
  OAUTH_TOKEN_ENV,
  ALLOW_METERED_ENV,
  OAUTH_BETA_HEADER,
} from "@prism-core/core/api/auth"

describe("resolveAnthropicAuth (strict subscription-first)", () => {
  test("prefers the subscription OAuth token — even when a metered key + flag are set", () => {
    const auth = resolveAnthropicAuth("sk-ant-metered", {
      [OAUTH_TOKEN_ENV]: "oauth-abc",
      [ALLOW_METERED_ENV]: "1",
    })
    expect(auth).toEqual({ mode: "subscription", authToken: "oauth-abc" })
  })

  test("trims whitespace and ignores an empty env token", () => {
    const auth = resolveAnthropicAuth("sk-ant-metered", {
      [OAUTH_TOKEN_ENV]: "   ",
      [ALLOW_METERED_ENV]: "1",
    })
    expect(auth).toEqual({ mode: "api-key", apiKey: "sk-ant-metered" })
  })

  test("STRICT: no OAuth token + no flag → none, even with a metered key present", () => {
    expect(resolveAnthropicAuth("sk-ant-metered", {})).toEqual({ mode: "none" })
  })

  test("metered key is used ONLY when GRIOT_ALLOW_METERED is flipped", () => {
    expect(
      resolveAnthropicAuth("sk-ant-metered", { [ALLOW_METERED_ENV]: "1" }),
    ).toEqual({ mode: "api-key", apiKey: "sk-ant-metered" })
    // truthy variants
    for (const v of ["true", "yes", "on", "TRUE", "On"]) {
      expect(
        resolveAnthropicAuth("sk-ant-metered", { [ALLOW_METERED_ENV]: v }),
      ).toEqual({ mode: "api-key", apiKey: "sk-ant-metered" })
    }
    // non-truthy → still strict none
    for (const v of ["0", "false", "no", "off", ""]) {
      expect(
        resolveAnthropicAuth("sk-ant-metered", { [ALLOW_METERED_ENV]: v }),
      ).toEqual({ mode: "none" })
    }
  })

  test("returns none when neither credential is available", () => {
    expect(resolveAnthropicAuth(undefined, {})).toEqual({ mode: "none" })
    expect(resolveAnthropicAuth("   ", { [ALLOW_METERED_ENV]: "1" })).toEqual({
      mode: "none",
    })
  })

  test("exposes the oauth beta header constant", () => {
    expect(OAUTH_BETA_HEADER).toBe("oauth-2025-04-20")
  })
})
