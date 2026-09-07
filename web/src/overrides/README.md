# Personal UI overrides

The custom public experience lives entirely under this directory:

- `home/` contains the branded homepage.
- `docs/` contains the local developer documentation.
- `support/` contains the customer support page.

The administrator-controlled `Glass` preset is intentionally neutral rather
than cyan-tinted. Site appearance also accepts an HTTPS background image URL;
the frontend applies a readable scrim over it and keeps the image fixed while
content scrolls.

## Glass recipe

Every glass surface (cards, popovers, dialogs, sheets, menus, table
containers, the sidebar, the app header and `.glass-panel`) is composed from
the `--glass-*` recipe variables declared in `styles/theme-presets.css`:

- `--glass-tint` / `--glass-tint-raised` — translucent surface colour
- `--glass-blur` / `--glass-blur-raised` — backdrop blur radius
- `--glass-saturate` — backdrop saturation (lowered when a custom background
  image is set, because sampling a saturated photo reads dirty)
- `--glass-edge-top` / `--glass-edge-mid` / `--glass-edge-bottom` — the 1px
  gradient hairline drawn as a masked ring
- `--glass-sheen` — the diagonal specular highlight
- `--glass-shadow-*` — ambient / key / hover shadow layers
- `--glass-glow-*` + `--glass-glow-opacity` — ambient light painted on the
  body so the blur has something to refract
- `--glass-noise-opacity` — film grain strength

Light mode keeps the ambient light almost neutral; dark mode uses the
blue/violet/cyan bloom. `prefers-reduced-transparency` disables blur and grain
and raises the tint opacity, `prefers-reduced-motion` disables the hover lift,
and under `768px` the blur radius is reduced. `backdrop-filter` is applied only
to large containers — never to buttons, table rows or cells.

Glass is also opted out of the semantic surface bridge lower in
`theme-presets.css`, otherwise that block would flatten the translucent tokens
into opaque primary-tinted colours.

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
