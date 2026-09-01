# Design QA — Once-baked Soft Shadows

## Evidence

- Baseline implementation: `C:\Users\22877\Documents\个人网站\portfolio-site\qa-lighting-implementation.jpg`
- Browser-rendered implementation: `C:\Users\22877\Documents\个人网站\portfolio-site\qa-baked-shadows-implementation.jpg`
- Combined before/after comparison: `C:\Users\22877\Documents\个人网站\portfolio-site\qa-baked-shadows-comparison.jpg`
- Baseline and implementation pixels / CSS viewport: 800 × 685 at device scale factor 1.
- State: spatial-roaming dialog open, model fully loaded, default overview orbit active.

## Findings

No actionable P0, P1, or P2 findings remain.

## Full-view Comparison Evidence

The baked-shadow implementation adds clearer directional modeling to the museum roof steps, circular skylight, facade recesses, tree clusters, and small structures. The result remains soft and restrained because the frozen shadow map is blended with the existing HDR fill and gray ambient occlusion. The approved dark-gray world background, transparent surrounding city, materials, and camera behavior remain intact.

## Focused-region Evidence

The museum roof and foreground planting occupy enough pixels in the combined comparison to assess shadow direction, edge softness, and surface artifacts directly. No focused crop was required. No shadow acne, black speckling, transparent-building shadows, water shadows, or hard flickering edges are visible.

## Required Fidelity Surfaces

- Fonts and typography: unchanged; cinematic guidance and controls remain legible.
- Spacing and layout rhythm: unchanged; the scene camera, model framing, pins, and overlay controls were preserved.
- Colors and visual tokens: the existing restrained palette and `#3f3f3f` world background are unchanged; shadows use lighting rather than painted color overlays.
- Image quality and asset fidelity: the supplied GLB, HDR, textures, and materials remain original. The new 2048 px shadow texture is rendered once from the live model rather than approximated with a raster overlay.
- Copy and content: unchanged.

## Interaction and Stability Verification

- Entered spatial roaming and waited for the GLB, HDR, AO, and shadow pass to finish.
- Confirmed opaque site geometry casts and receives shadows.
- Confirmed transparent context buildings, water, and curtain glass are excluded from the bake.
- Confirmed the completed map freezes after two rendered frames; orbiting the camera does not recompute it.
- Production build passed.
- Browser console errors checked: 0.

## Comparison History

1. Initial bake — P2: the shadow contribution was too subtle because most illumination came from the HDR and hemisphere fill. Fixed by shifting the same overall light balance toward the soft key light while reducing fill intensity.
2. Initial bake — P2: exported alpha-enabled opaque materials were incorrectly excluded from shadow participation. Fixed by excluding only explicit water, transparent city massing, and curtain glass while allowing the remaining static site geometry into the bake.
3. Bake timing — P2: a generic immediate freeze could complete before the asynchronous GLB had contributed a stable frame. Fixed with a two-frame post-mount bake that explicitly updates the shadow texture before freezing it.

## Implementation Checklist

- [x] 2048 px soft directional shadow texture generated from the live GLB.
- [x] Shadow calculation frozen after initial model mount.
- [x] Transparent city, water, and glass excluded.
- [x] Ambient occlusion retained for contact detail.
- [x] Realtime orbit remains stable and inexpensive.
- [x] Production build and browser verification passed.

final result: passed

---

# Design QA — Plain project title restoration

## Findings

No actionable P0/P1/P2 findings remain. The title was restored to one ordinary live-text `h1` after the raster-slice treatment proved less legible than the project page needs.

## Evidence and checks

- Browser-rendered implementation: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\16-title-plain.png`.
- State: desktop project-page top view.
- Typography and copy: the heading renders as one complete, readable `浮层叠影` title using the existing page type scale and color.
- Layout and tokens: the original title alignment, grid background, place line, and visual hierarchy are preserved.
- Console errors and warnings: 0.
- Production build completed successfully with `pnpm build`.

final result: passed

---

# Design QA — Subtle raster-slice refinement

## Comparison target

- Browser-rendered implementation: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\15-title-subtle-slices.png`.
- State: desktop project-page top view.

## Findings

No actionable P0/P1/P2 findings remain. The earlier slice offsets were visually too assertive (P3 refinement). They now range from -3 px to +3 px, and each successive strip is lowered by 1 px to create a controlled breathing seam.

## Required Fidelity Surfaces

- **Fonts and typography:** The complete raster title stays legible as one phrase; the minimal offsets do not interrupt character recognition.
- **Spacing and layout rhythm:** Six bands retain equal heights and receive only 1 px vertical separation per seam.
- **Colors and visual tokens:** Unchanged charcoal raster title and transparent source asset.
- **Image quality and asset fidelity:** Existing master and strip PNGs are unchanged; only their rendered positions were refined.
- **Copy and content:** Unchanged, accessible `浮层叠影` heading.

## Interaction and implementation checks

- Browser capture: six slices present; console errors and warnings: 0.
- Production build completed successfully with `pnpm build`.

final result: passed

---

# Design QA — Raster-sliced project title

## Comparison target

- User-requested treatment: one complete title rendered as a transparent PNG, cut into equal horizontal image strips, then offset in the page.
- Transparent source asset: `C:\Users\22877\Documents\个人网站\portfolio-site\public\images\shangdu\title\fucengdieying-master.png`.
- Browser-rendered implementation: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\13-title-raster-slices.png`.
- Transparency inspection: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\14-title-transparent-check.png`.
- State: desktop project-page top view.

## Findings

No actionable P0/P1/P2 findings remain.

## Required Fidelity Surfaces

- **Fonts and typography:** `浮层叠影` is rendered once as a complete SimHei title asset, which keeps every original stroke intact before the six strips are offset.
- **Spacing and layout rhythm:** Six equal 60 px horizontal bands preserve a single title block and use restrained left/right offsets rather than overlap-based CSS glyph duplication.
- **Colors and visual tokens:** The raster title uses the existing charcoal `#15242c`; no new accent or background was introduced.
- **Image quality and asset fidelity:** The master is 1440 × 360 RGBA PNG. Its corner alpha is `0`, and the checkerboard inspection shows clean, transparent areas around the dark text. Six derived PNG slices are rendered in the header.
- **Copy and content:** The asset and the accessible `h1` both read exactly `浮层叠影`.

## Interaction and implementation checks

- Browser capture confirms six image strips are present and no console warnings or errors occurred.
- Production build completed successfully with `pnpm build`.

## Focused-region comparison

The title is the only changed surface and fills the capture, so the browser screenshot and checkerboard transparency inspection are sufficient; an additional crop would duplicate the evidence.

## Implementation checklist

1. Retain `fucengdieying-master.png` as the single source asset when revising title typography.
2. Regenerate all six equal-height strips whenever the master asset changes.
3. Keep the `h1` aria-label in sync with the raster title copy.

final result: passed

---

# Design QA — Topbar identity spacing

## Comparison target

- Source reference: `C:\Users\22877\AppData\Local\Temp\codex-clipboard-c75734aa-9723-4b0f-9ee1-bbcba05357f6.png` (user-marked compact header state).
- Rendered implementation: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\11-topbar-spaced.png`.
- Full-view comparison: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\12-topbar-qa-comparison.png`.
- State: desktop project-page topbar. The source is a cropped user screenshot, so the comparison normalizes only the header content rather than full-page viewport dimensions.

## Findings

No actionable P0/P1/P2 findings remain.

## Required Fidelity Surfaces

- **Fonts and typography:** The wordmark keeps its original size and weight. Author name, discipline, and project type now form distinct text groups with calmer letter spacing.
- **Spacing and layout rhythm:** A measured gap and two hairline separators create breathing room between wordmark, author/discipline, and project type without expanding the header vertically.
- **Colors and visual tokens:** Existing charcoal and blue-gray text colors remain; separators use the site’s muted technical-rule language.
- **Image quality and asset fidelity:** No image assets are used or changed.
- **Copy and content:** Text remains `TOBEY XIAO`, `肖林`, `LANDSCAPE ARCHITECTURE STUDENT`, and `课程作业`.

## Interaction and implementation checks

- Browser-rendered header capture completed; no console errors or warnings.
- Production build completed successfully with `pnpm build`.
- The wordmark remains a link to the page top; the additional spans are presentational only and do not change navigation.

## Focused-region comparison

The entire changed surface is the single-row topbar and is fully legible in the combined comparison. A separate crop would not add evidence.

## Implementation checklist

1. Preserve the separators and flexible gap when future topbar copy changes.
2. Keep the existing small-screen rule that hides the metadata rather than allowing the long discipline label to wrap.

final result: passed

---

# Design QA — Layered project title

## Comparison target

- Source visual truth: `C:\Users\22877\.codex\generated_images\01a05b83-118f-70b1-a8dc-1816a439e436\exec-c12179a4-79aa-465e-94a8-a70e218f9eb0.png` (selected Ideation option 3).
- Rendered implementation: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\08-title-layered-final.png`.
- Full-view comparison: `C:\Users\22877\Documents\个人网站\portfolio-site\audit-captures\09-title-qa-final-comparison.png`.
- State: desktop landing view at the top of the project page; title is static.
- Source pixels: 1672 × 941. Implementation pixels: 1265 × 712. The source was resized to the implementation comparison scale of 1280 × 720 in the combined image; both frames use the same 16:9 composition and no device frame.

## Findings

No actionable P0/P1/P2 findings remain.

## Required Fidelity Surfaces

- **Fonts and typography:** The implementation keeps the existing page font and dark display weight. The enlarged title and two offset horizontal slices deliver the selected spatial-cut effect while the heading remains readable.
- **Spacing and layout rhythm:** The larger title preserves the existing left alignment, place line, rule, and first image module’s reading order.
- **Colors and visual tokens:** The treatment uses the established charcoal title color against the blue-gray grid; it adds no new accent, gradient, or competing surface.
- **Image quality and asset fidelity:** Existing hero imagery is untouched and preserves its crop and resolution. The selected visual target contains no title image asset to reproduce; the effect is implemented as accessible live type.
- **Copy and content:** The accessible heading remains exactly `浮层叠影`; the site place and year copy are unchanged.

## Comparison History

1. **Initial comparison — P1:** the first implementation used a title size and slice offset that were too quiet relative to the selected reference, weakening the intended first-screen emphasis. Evidence: `audit-captures/07-title-qa-comparison.png`.
2. **Fix:** increased desktop title scale and strengthened the two measured slice offsets; mobile keeps a controlled 72 px size.
3. **Post-fix evidence:** `audit-captures/09-title-qa-final-comparison.png`. The implementation now carries the selected direction’s larger, sectional title presence while preserving the page’s original layout constraints.

## Interaction and implementation checks

- Browser-rendered desktop capture completed; the heading is exposed as `浮层叠影` in the accessibility tree.
- Console check: no warnings or errors in the final title capture.
- Production build completed successfully with `pnpm build`.

## Focused-region comparison

The title/hero area is large and legible in the combined comparison, so a separate crop was not needed. The comparison specifically checked title weight, size, horizontal slicing, alignment with the place line, grid contrast, and the opening image’s unchanged crop.

## Follow-up polish

- [P3] If the title later feels too assertive in a final portfolio review, reduce the slice offsets by roughly 15%; do not reduce the display scale first.

## Implementation checklist

1. Confirm the title remains a live `h1` with its accessible name after any future content edits.
2. Keep the mobile title override together with the desktop title treatment.

final result: passed
