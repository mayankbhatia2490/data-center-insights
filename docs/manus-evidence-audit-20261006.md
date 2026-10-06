# Manus Evidence Audit and Remediation — 6 October 2026

## Release decision

**NOT READY — the code remediation is ready, but the public Vercel deployment is still serving the previous frontend bundle.**

The repository and GitHub branch contain the first public-truth remediation in commit `a2e996d5bf5ae6243e2c81cf00160111de1ad543`. The live alias `https://data-center-insights-fawn.vercel.app/` was rechecked after the push and still shows the old AI-inferred pulse, unsupported narrative, and previous wording. The deployment must be redeployed or the Vercel-GitHub integration must be repaired before claiming the fix is live.

## Baseline findings

The live Supabase project contains 1,929 article records and 23 published records. All 23 published records are from source tiers 1 or 2, but **zero published records have a validated or approved validation status**, and **zero published records are tagged as Middle East by category**.

The facility table contains 111 records, with **zero verified facilities**. The public tracker correctly discloses this limitation and reports only three facility records with published capacity.

The live research tables contain 121 market signals, 10 with no source article IDs and 15 with fewer than two sources. The regional outlook table contains five records, three with no sources and four with fewer than two sources. The strategic-insight table contains 71 records, five with no sources and five with fewer than two sources.

The current weekly pulse record is marked `ai_inferred`, has a score of `62`, and is linked to 638 article references. Only 65 of those references are published, and none are validated or approved. The score therefore cannot be presented as verified regional market intelligence.

## Public-site findings

The homepage currently shows 23 latest stories, but the latest stories are primarily global hardware, storage, and infrastructure reporting from ServeTheHome, Blocks & Files, and Data Center Knowledge. The prior label `validated MENA stories published` was not supported by the database definition.

The intelligence page displayed an AI-inferred `+62` pulse score with drivers, risks, and outlook language that was not accompanied by claim-level evidence or a visible corroboration requirement.

The insights page presented AI sentiment as `Bullish` or `Bearish`, which could be interpreted as a market or investment judgment rather than a model classification.

The public tracker was comparatively transparent: it reported 111 records, 66 with coordinates, 89 with a source on file, three with published capacity, and zero verified. This wording is retained.

## Remediation implemented in GitHub

The following changes were implemented and pushed:

1. The public pulse widget now withholds the score, drivers, risks, and outlook whenever the record is not `verified`.
2. The widget states that no independently verified pulse is published yet and explains that the AI-assisted score remains internal until corroborated and reviewed.
3. Public market signals now require `verified` status and at least two source article IDs.
4. When no signal meets that threshold, the public page states that corroborated signals are not yet published.
5. The homepage market-signal snapshot uses the same evidence gate and no longer displays an endless skeleton when no qualifying signal exists.
6. The homepage credibility count now queries published tier-1/tier-2 articles and labels them `specialist-source stories published`, not `validated MENA stories`.
7. The generic empty state was replaced with `No stories match this filter` and a truthful filter explanation.
8. Article sentiment badges now say `AI tone: bullish`, `AI tone: bearish`, or `AI tone: neutral`.
9. The intelligence-page copy now describes evidence-gated developments and clearly states that AI-assisted interpretations remain marked until reviewed.

## Validation completed

The following checks passed locally after the changes:

- TypeScript: passed
- Vite production build: passed
- Vitest: 47 tests passed across 8 test files
- ESLint on changed files: passed
- Git diff check: passed

The build emitted a non-blocking warning about large JavaScript chunks. This is a performance improvement opportunity, not an evidence or correctness blocker.

The live Supabase schedules remain active:

| Job | Schedule | Status |
|---|---|---|
| GDELT discovery | Every 30 minutes | Active |
| News fetch | Every 2 hours | Active |
| Candidate promotion | Every 2 hours, 15 minutes after fetch | Active |
| Evidence synchronization | Daily | Active |

## Remaining blockers

### Vercel deployment

The GitHub commit is present, but the stable Vercel alias continues to serve the previous bundle. The public intelligence page still shows:

- `Pulse Index AI-inferred · 100`
- `+62`
- The old drivers, risks, and outlook
- The old premium description

Do not tell users the frontend remediation is live until the deployment URL contains the new text `No independently verified pulse is published yet`.

### Data policy

The site still has no validated published article records, no verified facility records, and no corroborated public market signals. This is acceptable for a transparent research-in-progress state, but not for marketing the product as fully verified MENA market intelligence.

### Regional coverage

The current published news set should be described as specialist-source infrastructure coverage, not MENA coverage. A future MENA briefing should use a separate query requiring an explicit regional entity, facility, project, policy, or market connection.

## Next required action

1. Trigger or repair the Vercel deployment for GitHub commit `a2e996d5bf5ae6243e2c81cf00160111de1ad543`.
2. Recheck `/`, `/intelligence`, `/insights`, `/data`, and `/leaders` in the deployed environment.
3. Confirm that unsupported AI pulse and signals are withheld publicly.
4. Add automated metric-contract tests before the next content or pipeline release.
5. Do not publish a `READY` decision until the live deployment and evidence policy both pass.
