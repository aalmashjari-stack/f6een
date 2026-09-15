# f6een styling proposal — 7 September 2026

Open [the comparison preview](./index.html). It has six screen examples, desktop and landscape-phone sizes, and Before / Proposed / Compare modes. The slider compares matching fixtures. These are screenshots of the actual components with sample state, not playable game controls.

No application source was changed and no commit was created. The CSS in this folder is a review artifact, not imported by the game. Original logo, category artwork, question bank, RTL direction, team colors, and game mechanics are retained.

## Recommended visual direction

Refine the existing blocks identity. The most useful changes are clearer hierarchy and consistent spacing; another identity would discard already-approved work.

- **Board:** Keep the enclosing frame around each category, reduce nested outlines, enlarge the point values, and use a solid name plate. Used cells stay visible and disabled, with dashed edges and muted text. Their meaning is not communicated by color alone.
- **Scorebar:** Consistent corner radii and shallower shadows; larger team names; a steady baseline. Both correction controls remain visible. Yellow and turquoise retain their established team meaning.
- **Question:** Increase available text space and line spacing. Give the timer a quieter cream surface while preserving its number, progress bar, and red warning state. The question has stronger visual priority. This size increase is a proposal for approval: previous comments explicitly kept text size unchanged after removing the context row.
- **Answer:** A darker orange answer on white and more consistent card spacing. The original question remains visible and the scoring choices are unchanged.
- **Results:** A wide warm winner banner; clear table headers and totals; alternating player rows; stronger secondary text. Preserve a two-column composition on landscape phones so all twelve players and actions fit without scrolling.
- **Interaction:** Consistent keyboard focus rings; reduced-motion support; restrained movement. This review shows still frames with reduced motion, so animation quality and celebration timing have not been demonstrated.

## Styling architecture observations

`src/main.tsx` loads `theme.css`, `showtime.css`, `skins/neo.css`, and `skins/blocks.css` in sequence. Those four files contain 3,306 lines, alongside screen-local style tags. Multiple layers restyle the same scorebar, timer, buttons, and results elements. Existing comments explain the historical decisions, but the cascade makes small refinements harder to predict.

If this direction is approved, implement it in the active skin and shared sizing tokens, then progressively remove superseded rules after screenshot verification. Do not permanently add another global override layer: `proposal.css` intentionally uses stronger selectors only to make this isolated comparison possible.

Prefer a small, explicit system for border widths, shadow offsets, radii, text roles, and viewport spacing. Keep Baloo for the current character and Cairo for changing numbers. Additional opportunities outside this first preview are more consistent setup form spacing, input focus/error states, dialog padding, and admin table density. These have not been visually redesigned here.

## Validation and limits

Rendered six fixtures in Chromium at 1440×900 and 844×390, before and proposed: 24 views. No JavaScript errors were recorded. All enabled controls in the twelve proposed views were within the viewport. The original 12-player phone results fixture placed the new-game and report controls below the viewport; the proposal keeps both visible.

Visually inspected the board, text and photo question screens, reveal screen, and phone results; included the longest text question from the shipped bank. The evidence is in `visual-checks.json` and `shots/`.

This is a visual proposal, not a production-ready patch. It does not certify every question, long player names, every round, every device/browser, or full accessibility compliance. Setup, login, purchase, admin, derby, final-round, and dialog flows would need their own checks before applying shared CSS. The winner banner fixture shows team 0 winning; implementation must ensure the styling remains appropriate when team 1 wins or the result is tied.

The preview harness is in `/private/tmp/f6een-style-preview`; it imports a copied source tree, uses local assets, and does not connect to production. The durable screenshot comparison works directly from this folder without that server.
