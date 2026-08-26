# RevelatiO release workflow

## Production source

Production must be deployed only from the approved integration branch or a deployment created from it after review. Do not promote a direct v0 deployment to production.

## Working with v0

1. Let v0 work on its own `v0/*` branch.
2. Review the diff against `vercel-agent/revelatio-v0-integrated`.
3. Merge or rebase the v0 branch into the integration branch only after validation.
4. Deploy production from the integration branch and record the deployment URL in the pull request.

## Required checks

- `npm run check`
- syntax check for API modules and inline scripts
- `npm run sync:public` (canonical `js/`, `views/`, `css/` → `public/`; do not hand-edit the mirrors)
- verify the production deployment is Ready before assigning aliases

## Guardrails

- Keep `v0/*` deployments as previews until reviewed.
- Never overwrite the integration branch with a generated branch.
- Never promote a preview solely because its design looks correct; validate reader, IA, offline library, and WhatsApp flows.
