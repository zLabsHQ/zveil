"use client";

import { useSyncExternalStore } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

export const passkeysSupported = () =>
  typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";

// Hydration-safe reads of browser-only state.
const noopSub = () => () => {};
export const usePasskeysSupported = () => useSyncExternalStore(noopSub, passkeysSupported, () => false);
export const useLocalFlag = (key: string) =>
  useSyncExternalStore(noopSub, () => Boolean(localStorage.getItem(key)), () => false);

type Result = { ok: true; recoveryCode?: string | null } | { ok: false; error: string };

const err = (e: unknown, fallback: string) =>
  e instanceof Error && e.name === "NotAllowedError"
    ? "Cancelled — the passkey prompt was dismissed"
    : e instanceof Error
      ? e.message
      : fallback;

const post = async (url: string, body: unknown) => {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed");
  return j;
};

/** Create a passkey for the current workspace. Returns the recovery code on first setup. */
export async function registerPasskey(): Promise<Result> {
  if (!passkeysSupported()) {
    return { ok: false, error: "This browser doesn't support passkeys — try a recovery code instead" };
  }
  try {
    const options = await post("/api/auth/register/options", {});
    const attestation = await startRegistration({ optionsJSON: options });
    const res = await post("/api/auth/register/verify", attestation);
    return { ok: true, recoveryCode: res.recoveryCode ?? null };
  } catch (e) {
    return { ok: false, error: err(e, "Passkey setup failed") };
  }
}

/** Sign in with a passkey — the server points this browser at that workspace. */
export async function loginWithPasskey(): Promise<Result> {
  if (!passkeysSupported()) {
    return { ok: false, error: "This browser doesn't support passkeys — use a recovery code" };
  }
  try {
    const options = await post("/api/auth/login/options", {});
    const assertion = await startAuthentication({ optionsJSON: options });
    await post("/api/auth/login/verify", assertion);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: err(e, "Sign-in failed") };
  }
}

/** Recover a workspace with a one-time recovery code. */
export async function recoverWorkspace(code: string): Promise<Result> {
  try {
    await post("/api/auth/recover", { code });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: err(e, "Recovery failed") };
  }
}
