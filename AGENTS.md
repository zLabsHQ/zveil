# Agent rules for this repo

## Git
- **Never commit or push unless the founder explicitly asks.** Leave changes uncommitted.
- Never add AI attribution to commits (no `Co-Authored-By: Devin`, no "Generated with" footers).
- Never commit the `docs/` folder.
- Commit identity: `0xKryptonian <xerox336699@gmail.com>` (already set in repo-local git config).

## Decisions
- Discuss product and infra decisions **before** implementing: network model (testnet/mainnet),
  key import, auth/onboarding, tenancy, env changes, production deploys. Open decisions are in
  `../docs/research/decisions-and-next-steps.md` (outside the repo).

## Verify
- Web: `cd apps/web && pnpm exec tsc --noEmit && pnpm lint && pnpm build`
- Scanner: `cd services/scanner && cargo build`
- Next.js 16 here differs from older versions — read `apps/web/node_modules/next/dist/docs/` first.
