import { randomBytes, randomUUID } from "node:crypto";

export function id(): string {
  return randomUUID();
}

export function slug8(): string {
  return randomBytes(4).toString("hex");
}

export function memoSeed(): string {
  return `ZP-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function disclosureToken(): string {
  return randomBytes(24).toString("base64url");
}
