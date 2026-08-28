# Personal UI overrides

The custom public experience lives entirely under this directory:

- `home/` contains the branded homepage.
- `docs/` contains the local developer documentation.
- `support/` contains the customer support page.

The administrator-controlled `Glass` preset is intentionally neutral rather
than cyan-tinted. Site appearance also accepts an HTTPS background image URL;
the frontend applies a readable scrim over it and keeps the image fixed while
content scrolls.

These files are separate from the stock feature components so upstream UI
updates can be merged without rewriting the branded pages. Route and feature
changes are small adapters that intentionally point at this override layer.

When syncing a new upstream release, review the adapter files first:

- `features/home/index.tsx`
- `features/about/index.tsx`
- `routes/docs/index.tsx`
- `components/layout/components/public-header.tsx`
- `context/theme-provider.tsx`

Keep the custom pages and this directory during conflict resolution.

## Upstream sync

From the repository root, update the fork in a dedicated branch:

```text
git fetch upstream
git switch main
git merge upstream/main
cd web
bun install --frozen-lockfile
bun run typecheck
bun run build
```

The TanStack Router plugin regenerates `src/routeTree.gen.ts` during the build;
do not hand-edit that generated file. If a merge conflicts in an adapter, keep
the upstream implementation and re-apply only the small import/render hook
that points to this override directory. The branded pages, translations, and
administrator theme options remain isolated from normal upstream feature work.
