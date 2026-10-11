import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { rpConfig, setChallenge } from "@/lib/auth";

// Usernameless sign-in: no allowCredentials — the authenticator offers any
// discoverable passkey it holds for this relying party.
export async function POST(req: Request) {
  const { rpID } = rpConfig(req);
  const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred" });
  await setChallenge("auth", options.challenge);
  return NextResponse.json(options);
}
