# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Portfolio identity

- Owner: 肖林 / Tobey Xiao.
- Positioning: Landscape Architecture Student seeking internship opportunities; do not describe as a professional "Landscape Designer".
- Contact email: 18955612325up@gmail.com.

## Image direction

- All newly generated website visuals must use the two user-provided architectural references as the style benchmark.
- Visual language: soft warm-white paper ground, isometric / elevated axonometric view, delicate graphite-like linework, low-saturation warm gray and wood tones, sparse pale vegetation and tiny figures, restrained contrast, no photorealistic look, no oversaturated colors, no in-image text or watermark.
- For the Wanshan Lake project, depict the reservoir dam, water edge, slow-walk paths, viewing terraces, water-level markers, and ecological planting in this same architectural-illustration language.

## Updated visual direction (2026-08-26)

- Overall portfolio UI should feel cool, quiet, and restrained: icy white / blue-gray neutrals, thin technical rules, ample empty space, compact information labels, and low-saturation imagery.
- Avoid warm paper, clay-red UI accents, decorative heaviness, or abrupt visual changes.
- Appearance, image swaps, overlays, and dismissals should use subtle opacity-led fades; honor `prefers-reduced-motion`.
- Main visual modules should form a continuous scroll exhibition: the panel nearest the viewport center expands subtly into the primary reading state, while neighboring panels remain partly visible to cue continued scrolling.

## Interaction direction

- The portfolio should use a true interactive 3D axonometric floating-island scene for project exploration, rather than a static image with pan/zoom. Keep camera movement deliberately constrained and presentation-like; it should feel like an architectural model, not a game.
- The 3D scene should auto-rotate continuously through a full 360° loop. Keep the default viewpoint slightly lower, prioritizing terrain, paths, planting, and overall landscape systems over individual buildings.
- Default the spatial-roaming overview to a low oblique bird's-eye framing (about 19° above the site plane); it should show the core site in full, with the surrounding city receding into the background.
- Use discreet, floating, vertically oriented pins for key landscape nodes. Each node is a slightly opaque low-saturation colored sphere over an inverted cone; selecting it enters a close orbit around the node and hides all pins, while double-clicking exits the close view and restores them.
- Node calibration and top-down plan view are implementation aids only; keep their controls hidden in the finished scene while retaining locally saved node positions.
- Keep anchor labels editable from the node-calibration panel. Save custom names independently from positions so restoring positions never erases naming work, and restoring default names never moves anchors.
- Keep node-feature close-ups low and intimate, at a closer distance that foregrounds planted ground, paths, and landscape details.
- Keep node-feature close-ups visibly but noticeably slower than the overview while retaining the same drag-to-orbit controls.
- Let OrbitControls be the sole owner of automatic orbit and drag updates. Initialize its overview target once; never keep passing the overview target as a controlled prop while a node close-up is active, because rerenders will snap the camera away from the node.
- Clamp every close-up transition destination to the same polar-angle limits used by OrbitControls, and keep drag/zoom disabled only until that short transition completes; an unreachable destination leaves rotation disabled and pulls user input back toward the transition target.
- On leaving a node feature, return smoothly to the exact camera framing from immediately before it opened, then resume rotation from there; do not reset to a fixed initial view.
- Present spatial-roaming guidance as restrained cinematic credit text in the upper-right field: clearly legible scale, wide tracking, no card chrome, and an out-then-in transition where the old hint fully fades before the next hint slowly appears.
- When swapping `public/models/floating-island.glb`, retain the import-stabilization profile in `src/App.jsx`: use only the approved once-baked static shadow map (never continuously updating realtime shadows), and keep depth-stabilized transparent water. Validate the replacement model before handoff; do not wait for visual artifacts to be reported.

## Saved 3D rendering profile

- Reuse `src/sceneProfile.js` for all GLB replacements. It contains the approved `city.exr` Blender studio-light environment, soft cool-gray fill, low-saturation grade, medium-light ambient occlusion, material recovery colors, and depth-stabilization values.
- Keep the surrounding city massing translucent (about 30% opacity) while the museum, landscape, roads, and planting stay opaque, so the featured architecture remains the visual anchor.
- Use the approved neutral dark-gray (`#3f3f3f`) world background for the spatial-roaming canvas; keep the HDR environment responsible for model lighting rather than lightening the visible background.
- Keep the spatial-roaming render close to the approved Blender look: a broad warm-neutral key light, cool soft fill, and moderate high-quality ambient occlusion that defines contact edges without turning planting or recesses black.
- Use one frozen 2048 px soft directional shadow map for the static opaque site model; exclude transparent context buildings and water from the bake so orbiting stays stable and inexpensive.
- Keep enough HDR and hemisphere fill around the baked shadows that the whole site stays bright from every orbit angle; the key light should shape the model, not leave broad facades or planting in darkness.
- Change `ACTIVE_MODEL_URL` first when replacing a model. Keep the profile intact unless the user asks to tune rendering; only revise the saved camera coordinates if the new GLB has different world bounds.
- Every replacement GLB must pass a full-orbit rendering audit. Cull meshes that have identical geometry, material, and world transforms; clean known duplicate/degenerate triangle hotspots; keep transparent solids single-sided with deterministic depth writes; and assign distinct polygon offsets to grass, paving, secondary roads, tertiary roads, and asphalt before handoff.

## Current featured project

- The portfolio's current featured project is **《浮层叠影：郑州商城国家考古遗址公园景观升级设计》**.
- Keep the concise narrative centered on archaeological site reading, heritage protection, ecological continuity, and public experience.
- Source imagery lives in `public/images/shangdu/`, prepared from `F:/412/资产/` for fast web delivery.

## Loading and reliability (2026-09-05)

- Spatial roaming must immediately show an ordinary DOM preview and honest loading status. Keep the preview visible through download, decoding, and the first rendered scene frames; never rely on a loading label inside WebGL.
- Keep the homepage lightweight: import the 3D module on entry intent and download the model only after entry. Lazy-load below-the-fold images.
- Decoder files must be served locally from `public/draco/`; visitors must not depend on Google-hosted decoding resources.
- Reuse decoded model data and prepared geometry within the page session. Show recoverable errors and let visitors return to the project while preparation continues.
- The scene implementation is now `src/IslandScene.jsx`; `src/sceneProfile.js` still owns the approved rendering profile. Preserve the existing model, materials, lighting, and camera behavior when fixing loading.
- Calibration controls are available only in development with `?calibrate`; published scenes retain saved positions and names without exposing editing controls.
- Browser regression scripts live in `scripts/verify-site.cjs` and `scripts/verify-slow-mobile.cjs`. Run against the production preview (default `http://localhost:4173/`); they use Playwright and Edge. Set `TEST_URL` or `PLAYWRIGHT_MODULE` when using another preview URL or the bundled runtime.
