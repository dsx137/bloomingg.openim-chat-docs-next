# Security notes

## Supported baseline

- Node.js 22.12 or newer.
- Dependencies are pinned in `package-lock.json`.
- React and React DOM are pinned to 19.2.7.
- CI performs content validation, linting, TypeScript checks, and a production build.
- Dependabot is configured to open weekly npm and GitHub Actions update pull requests.

## Known transitive audit item — 2026-06-24

`npm audit --omit=dev` reports a moderate PostCSS advisory (`GHSA-qx2v-qp2m-jg93`) through the private PostCSS copy bundled by Next.js 16.2.9. PostCSS 8.5.10 and newer contain the upstream fix, but the latest stable Next.js package used by this project still bundles an older private copy.

The current application does not accept, parse, or re-serialize user-supplied CSS, which is the affected usage pattern. Do not add such a feature without isolating and sanitizing the input. Upgrade Next.js when a compatible stable release ships with the patched PostCSS version, then remove this note after `npm audit --omit=dev` is clean.

Do not run `npm audit fix --force` blindly: npm may propose a breaking framework downgrade or incompatible dependency graph.

## Reporting

Replace this section with the private security contact or disclosure process used by the OpenIM documentation team before publishing the repository.
