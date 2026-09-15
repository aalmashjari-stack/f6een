# فطين — final validation report

**6 September 2026 · revision `c106c442ddd0c291e3e0fbd204b6b4f886fede27`**

The normal game works through a complete browser session, and the existing regression suite passes. However, expanded tests reproduce important failures in account isolation, recovery, question exhaustion, imports, and server-side lifecycle controls. Address these before treating the app as ready for broader paid use.

This report supersedes the earlier review's verification status. It includes the source review and enhancement suggestions in its appendix, with the image-removal claim corrected. Application source, question bank, artwork, and production data were not changed. Only reports and evidence were added to the repository.

## What was tested

| Area | Result | Interpretation |
|---|---|---|
| Existing automated suite | 100/100 passed | Existing coverage remains green. |
| Expanded suite, including existing tests | 106 passed, 15 failed; 121 total | 21 added checks: six positive controls, 15 reproduced undesirable behaviors. Failures were retained as evidence, not fixed. |
| Fresh-session endurance | 500 sessions, no observed ID/family repeats or empty queues | Actual reducer and shipped bank, reproducible random seeds. |
| Consecutive sessions with persistent history | Repeats at session 31; empty final-round queue at session 33 | Reproducible workload, not a universal exhaustion threshold. |
| Team-size combinations | All 25 combinations from 2–6 players per team completed | Included in the positive controls; totals and question IDs checked. |
| Chromium browser scenarios | Four passed, five failed; nine scenarios | Includes a complete game, restoration, offline reporting, admin image removal, and a layout matrix. |
| Layout matrix within browser suite | 26/27 states kept enabled controls in viewport | Nine screen variants at 1920×1080, 1024×768, and 844×390. Twelve-player endgame fails at 844×390. |
| Database migrations and permission probes | 11 passed, five failed; 16 checks | All 43 repository migrations applied to isolated embedded PostgreSQL. One failure is an optional gift-code UX expectation. |
| Static HTTP server | 8/8 passed | Request handling, caching, traversal protection, malformed URLs, methods, and continued service. |
| TypeScript | Passed | `npx tsc --noEmit`. |
| Production web bundle | Passed | Vite build to temporary output; repository postbuild cleanup was not run. |
| iOS simulator target build | Passed | Unsigned Debug compile/package using an isolated copy. |
| Android | Blocked | Gradle cannot start because no Java runtime is available. |

These counts describe different levels of testing; they should not be added into one misleading “total tests” number.

## Confirmed findings and recommended order

### First: account and session reliability

1. **Account history crosses account boundaries.** A focused test showed account A's local history being uploaded for account B. Scope local history and snapshots by owner, reset account-bound state on account changes, and cancel stale synchronization. The broader local-session display concern remains supported by source inspection rather than a two-account browser playthrough.
2. **Reload grants additional final-round time.** Browser test: timer read 29 seconds, then reloaded to 30 while retaining 10 points. Persist timer identity, running state, and deadline with the session. Recovery duration/policy must follow the still-unresolved SPEC decision.
3. **Failed completion can restore an old round.** With the close request returning HTTP 503, completing the game and reloading restored the earlier final-round snapshot. Retain the final state and close operation until acknowledged; retry reliably and order cloud saves.
4. **A session owner can reopen a finished session and reuse it without balance.** Executed successfully against the repository migrations under modeled authenticated permissions. Restrict lifecycle transitions through controlled server operations. This is a repository-level finding, not proof of current production configuration.
5. **Malformed persisted state can blank the app.** Browser restoration of an accepted invalid snapshot produced `Cannot read properties of null (reading '0')` and an empty root. Add phase-specific validation, recovery UI, and safe migration.

### Next: protect the game's question guarantees

6. **Scarcity fallbacks violate exclusions.** Targeted tests returned a spent family and a reserved question. In the repeated-session workload, session 31 repeated two IDs; session 32 repeated two IDs and two families. Strict current-session ID/family exclusions must remain enforced when older history is recycled.
7. **The final round can exhaust its queue.** The same workload stalled in `stage3-play` at session 33 with an empty queue and 1,669 historical IDs. Design cross-session recycling and availability checks while preserving the two mandatory within-session guarantees.
8. **History synchronization can lose newly shown questions.** A delayed synchronization test overwrote an ID recorded while the request was in flight. Merge with current state at completion, await readiness where needed, and paginate history. Pagination remains a source-level concern; deployed response limits were not measured.

The endurance workload uses six seeded random playable categories, 18 board questions, four derby questions, and 14 judged questions per team in the final round, plus terminal displayed questions. It runs the real reducer and draw functions. Five hundred fresh sessions passing does not negate the persistent-history failures.

### Then: admin, reporting, and defensive gameplay

9. **Photo CSV round trips lose most rows.** Exporting and importing 125 photo questions accepted one and rejected 124 because their shared prompt was treated as a duplicate. Deduplicate by content identity and distinguish updates from new rows.
10. **Partial import retry duplicates committed rows.** A mocked failure in a 600-row import followed by retry produced 900 persisted rows. Use stable row/job IDs or checkpointed batches.
11. **Offline reporting claims success without a local block.** Browser showed “بُلّغ” while stored blocked IDs remained empty after RPC failure. Persist a pending report/block and display pending versus confirmed delivery.
12. **Moving a question bypasses the category/level floor.** Database deletion correctly blocked 20→19, but moving a question using the save RPC left 19. Apply transactional safeguards to all editing paths.
13. **Reporting accepts an arbitrary question ID without a session.** A nonexistent ID and null session were accepted and added a block in the local database test. Validate eligible questions and report provenance. The test does not establish the extent of production abuse or settle SPEC's unresolved public-report policy.
14. **Database bank activation can omit completeness validation.** An authorized caller enabled database mode with only 20 rows by omitting the expected-count argument. Make completeness validation mandatory on the server; retain the separate source finding about admin views inferring mode from row presence.
15. **Stale reducer actions can advance or alter the wrong phase.** Tests reproduced duplicate final-round turn advancement, reveal outside its phase, tiebreak scoring outside tiebreak, and selecting a category not chosen for the session. Add phase and turn/question identity guards. These are defensive engine reproductions, not all observed normal-click UI failures.
16. **Twelve-player endgame exceeds a small landscape viewport.** At 844×390, “لعبة جديدة” begins near y=549 and “بلّغ عن سؤال” near y=593. The screenshot confirms clipped initial presentation. Provide fitting or deliberate scrolling and verify touch access. The test measures initial visibility; it does not prove that scrolling can never reach the controls.

The previous source findings about interval score attribution and the missing “لا تشاور” derby reminder remain in the appendix. They were not independently exercised in this expanded browser suite.

**Correction to earlier finding 11:** clicking image removal caused **zero save requests** in Chromium. The earlier claim of a demonstrated implicit-submit defect was too strong and is withdrawn. Explicit `type="button"` is still reasonable defensive cleanup; pending-upload behavior was not tested.

**Optional UX improvement:** lowercase `audit` did not redeem canonical uppercase `AUDIT`; this is case-sensitive behavior, not an established violation of the game specification. Normalize if case-insensitive codes are desired.

## Successful behavior worth preserving

- Complete browser playthrough: Arabic setup, six categories, opening draw, 18 board questions, four derby questions, both final-round turns, and final result. Final scores were **450–10**, 22 board/derby question IDs were unique, and no JavaScript errors occurred. The final round used the app's `?fast` mode, so this is not a real-time 30-second endurance test.
- Signed-out Arabic entry and empty-signup validation passed. Image removal did not save the form.
- Database checks passed for one free game on signup, one charge per start/resume lifecycle, cross-account session read/write isolation, direct balance protection, editor versus super-admin permissions, once-per-user gift redemption, deletion floors, ordinary-user admin rejection, and contact-message restrictions.
- Server checks passed for HTML no-cache, empty HEAD body, missing-asset 404, unsupported-method 405, malformed-URL 400, traversal protection, immutable hashed assets, and continued availability.

## Scope and limitations

Tests ran against an isolated source copy and a local browser backend mock. All browser external requests were blocked. SQL ran in PGlite with modeled Supabase auth/storage schemas and grants; no production database was connected or modified. Browser tests therefore validate client behavior under controlled responses, not live Supabase integration.

Not certified by this run: live signup/email delivery/password recovery, real Google OAuth, payment processing, deployed RLS/configuration, real multi-device races, native device gameplay, native Google login, Android compilation, Safari/Firefox, full accessibility compliance, load/performance limits, or factual/media quality of all 2,113 questions. Long-question and photo fixtures were sampled; 27 viewport checks do not establish that every text/image combination fits. The iOS build used the copied native project and its existing bundled web assets; Capacitor sync and on-device execution were not performed.

Payment route, resume window, group-history scope, and final-round reveal interaction remain unresolved in SPEC and require your decisions before implementation. This report does not choose them.

## Evidence and reproduction

Evidence lives in [evidence-2026-09-06](./evidence-2026-09-06/): structured unit, simulation, SQL, browser, and server results; browser screenshots; build logs; and the added test/probe scripts. These are audit artifacts, not installed project regression tests. Harnesses contain temporary absolute paths and require adaptation before reuse in CI.

The isolated run directory was `/private/tmp/f6een-final-audit`. The expanded test invocation was `vitest run --config vite.audit.config.mjs --reporter=json`; the separate endurance test is `audit-simulation.test.ts`. Browser probes use bundled Playwright and the localhost mock configured by `vite.audit.config.mjs`; SQL probes use `@electric-sql/pglite`. The iOS build used `xcodebuild` with `CODE_SIGNING_ALLOWED=NO` and destination `generic/platform=iOS Simulator`. The recorded Java error is the Android blocker.

Screenshots: [full completed game](./evidence-2026-09-06/screenshots/full-session-end.png), [small landscape endgame](./evidence-2026-09-06/screenshots/844-endgame.png), [timer restoration](./evidence-2026-09-06/screenshots/sprint-reload.png).

## Appendix — source review and enhancement details

The following preserves the earlier source findings and all ten enhancement suggestions. The results above are the current validation status. Source-confirmed issues are distinguished from executed tests above.

## Priority 1 — account and session reliability

### 1. Scope all local state to the signed-in account

**Source-confirmed.** [App.tsx](/Users/alialmashjari/Documents/f6een/src/App.tsx:47) stores a session under one device-wide key, without an owner ID. [session.ts](/Users/alialmashjari/Documents/f6een/src/game/session.ts:310) does the same for question history. [usedQuestions.ts](/Users/alialmashjari/Documents/f6een/src/lib/usedQuestions.ts:54) merges this shared local history into whichever account signs in. Signing out does not clear these stores or reset game state.

On a shared device, account B can inherit A's question history. A stored session is loaded before ownership is established, so an account change can also display another account's local game; database RLS may reject its writes, but does not prevent local display.

**Improve:** account-specific storage keys; owner IDs in snapshots; load only after authentication resolves; reset account-bound state and pending requests when the user changes. Test A → sign out → B, including an open game in another tab.

### 2. Persist timer state, not just scores and questions

**Source-confirmed.** [Stage3.tsx](/Users/alialmashjari/Documents/f6een/src/screens/Stage3.tsx:22) keeps `started` only in component state. [useCountdown.ts](/Users/alialmashjari/Documents/f6een/src/components/useCountdown.ts:18) starts from the full duration on mount. No timer deadline is part of the saved game.

Closing/reloading during the final round preserves scored answers but returns to the ready screen with another full 30 seconds. The first two stages also restart their timers after remounting.

**Improve:** persist a round identifier, running state, and deadline. Validate answer actions against that deadline. Explicitly specify recovery after a crash; do not silently grant another full turn.

### 3. Make session close and synchronization retryable

**Source-confirmed.** [App.tsx](/Users/alialmashjari/Documents/f6een/src/App.tsx:275) clears `sessionId` before `closeSession` succeeds. Quit similarly clears local state despite a failed close. Cloud saves are debounced and failures are swallowed.

If the connection fails at the end, the server can retain an earlier open snapshot. Starting again can restore unfinished play instead of the completed result. Saves also lack a revision check: late requests or a second device can overwrite newer state.

**Improve:** durable pending operations for close, reports, and history; retry on reconnect; ordered/revisioned saves; retain the final snapshot until acknowledged. Keep the game playable while clearly distinguishing local save from cloud confirmation.

### 4. Harden the paid-session lifecycle at the database boundary

**Finding in repository migrations; not tested against production.** [sessions migration](/Users/alialmashjari/Documents/f6een/supabase/migrations/20260827090200_sessions.sql:31) permits the owner to update the entire row as long as `user_id` remains theirs. It does not prohibit changing a finished session back to `open` or replacing its state. `start_session` returns an open session before charging.

An altered client can therefore reuse a session through the permissions described in this repository. There is no later migration restricting this transition.

**Improve:** controlled lifecycle RPCs, immutable terminal states and ownership, and a defined boundary between an offline client and server-enforced paid entitlement. Narrowing status updates closes the reopen path; it alone does not make arbitrary client-owned game state tamper-proof.

## Priority 1 — repeat guarantees and long-term play

### 5. Separate permanent history from strict session exclusions

**Reproduced.** [draw.ts](/Users/alialmashjari/Documents/f6een/src/game/draw.ts:32) progressively abandons family and reservation constraints, then chooses from the whole pool when all questions are used. With a constrained pool, it returned an already-used question; it also selected a question from a spent family.

The current tests protect normal fresh-bank play, but the algorithm treats two stated guarantees as preferences under scarcity. Its own comment also acknowledges that oldest-used selection is currently random.

**Improve:** hard-exclude IDs and families already shown this session. Track last-use order separately for cross-session reuse. Validate availability before charging and starting. Decide explicitly what the UI does when a bank cannot satisfy the guarantees, rather than silently violating them.

### 6. Add an exhaustion strategy for the final round

**Reproduced.** [draw.ts](/Users/alialmashjari/Documents/f6een/src/game/draw.ts:139) excludes every question in permanent history and has no oldest-used fallback. Passing all shipped IDs as history returned a queue of **zero** questions. The refill path applies the same filter, so it cannot recover.

**Improve:** recycle the least recently seen eligible questions across sessions while preserving strict within-session exclusions. Test many consecutive sessions with persistent history, heavily reported banks, and short final-round pools.

### 7. Await history readiness and retrieve the complete history

**Source-confirmed race; pagination risk depends on server configuration.** [App.tsx](/Users/alialmashjari/Documents/f6een/src/App.tsx:172) launches history synchronization, but `begin` does not await it. A game can be created before another device's history arrives. A later write from game state can then overwrite the larger merged local history.

[usedQuestions.ts](/Users/alialmashjari/Documents/f6een/src/lib/usedQuestions.ts:18) retrieves history in one unpaginated row query. The repository already documents an earlier 1,000-row truncation affecting admin question queries. This history path needs explicit pagination too; the reviewed shipped bank contains **2,113** questions.

**Improve:** a synchronization readiness barrier before creating the session, safe union with in-progress history, account-scoped request cancellation, and complete ordered pagination.

### 8. Validate saved states by phase and migrate them safely

**Reproduced.** [session.ts](/Users/alialmashjari/Documents/f6een/src/game/session.ts:260) accepts a stored `stage2-question` snapshot with both `currentQuestion` and `s2Sel` null. The screen dereferences them. Other arrays are checked for presence without validating their contents, sizes, or valid index ranges.

**Improve:** phase-specific validation and versioned migration. Add a recoverable error screen that preserves the snapshot. Do not automatically turn incompatible paid sessions into abandoned sessions without a defined recovery policy.

The local 24-hour expiry in [App.tsx](/Users/alialmashjari/Documents/f6een/src/App.tsx:48) also conflicts with SPEC's unresolved resume window, while the server has no matching expiry. This needs your decision before implementation.

## Priority 2 — admin and content quality

### 9. Fix photo-question export/import

**Reproduced on the shipped data.** [importQuestions.ts](/Users/alialmashjari/Documents/f6een/src/lib/importQuestions.ts:251) deduplicates by question text, including photo prompts. Exporting 125 photo questions with the prompt “من صاحب الصورة؟” and reimporting accepted **1** and rejected **124**.

**Improve:** distinguish photo identity from prompt text and treat a known-ID update separately from creating a duplicate. Add a real photo-bank CSV round-trip test.

### 10. Make batch imports safe to retry

**Source-confirmed.** [admin.ts](/Users/alialmashjari/Documents/f6een/src/lib/admin.ts:335) commits batches of 300 independently. If batch two fails, batch one remains committed. The dialog allows retry of the original plan, and rows without IDs receive new IDs again.

**Improve:** stable import/job IDs and row IDs or a persisted batch checkpoint; report partial success accurately. Test an interrupted 600-row import and retry without duplicate additions.

### 11. Explicit button types: defensive cleanup only

**Earlier defect claim withdrawn after browser testing.** Clicking the image-removal button caused zero save requests in Chromium. The missing explicit button type in [AdminApp.tsx](/Users/alialmashjari/Documents/f6een/src/admin/AdminApp.tsx:1719) is a hardening suggestion, not a demonstrated accidental-save bug. Pending-upload save behavior remains untested.

### 12. Make reports truthful and durable

**Source-confirmed.** [questionFlags.ts](/Users/alialmashjari/Documents/f6een/src/lib/questionFlags.ts:52) applies the local block only after the RPC succeeds, despite comments saying it happens immediately. The end screen says “بُلّغ” as soon as the reducer records a click. Failed reports are not durably queued for retry after that screen disappears.

**Improve:** local pending block immediately, persistent outbox, pending/sent state, and retry. Preserve the actual question snapshot or a content revision in reports so subsequent edits do not change what the reviewer thinks was shown.

### 13. Apply content safeguards to every editing path

**Source-confirmed.** Delete RPCs protect category/level floors, but [admin_save_question](/Users/alialmashjari/Documents/f6een/supabase/migrations/20260830180300_admin_save_question.sql:58) and bulk import can move questions out of a cell without the same checks. The single-question form also lacks the importer's duplicate checks, and provides no way to edit a declared `family`.

**Improve:** shared transactional validation for save/import/delete, including both source and destination cells, valid categories, duplicate content, and family metadata. Show effective playable counts after reports, not just raw counts.

### 14. Use the explicit bank mode everywhere in admin

**Source-confirmed.** [AdminApp.tsx](/Users/alialmashjari/Documents/f6een/src/admin/AdminApp.tsx:865) infers database mode from the presence of any `origin='bank'` row for reports and categories. During partial migration, or after reverting the mode, those screens can disagree with what the game actually uses.

**Improve:** one authoritative bank snapshot and mode shared by the game and admin views. Do not infer migration completion from a single seeded row.

## Priority 2 — gameplay details

### 15. Attribute score corrections to the correct stage

**Reproduced.** [session.ts](/Users/alialmashjari/Documents/f6een/src/game/session.ts:136) maps every interval to stage 1. Correcting points after the derby therefore changes the first-stage column in the final statistics. Totals still add up, but “where did we lose?” becomes misleading.

**Improve:** derive the interval's completed stage from game state or store it explicitly.

### 16. Reject stale and duplicate reducer actions

**Reproduced defensively, not observed through a normal UI sequence.** Dispatching `S3_END_TURN` twice advances through both teams, because the action carries no turn ID and the reducer does not verify the originating turn. Several reveal, score, and interval actions have similarly weak phase guards.

**Improve:** action-specific phase checks and round/question/turn IDs. Test duplicate and delayed events. A screen normally emitting one callback is helpful, but the engine should still reject stale ones.

### 17. Put the silence rule where it is needed

[Interval.tsx](/Users/alialmashjari/Documents/f6een/src/screens/Interval.tsx:26) describes derby scoring but omits “لا تشاور”. The question screen also removed that reminder. SPEC specifically identifies the transition as the place to prevent teammates helping.

**Improve:** add a short “لا تشاور” instruction to the derby transition. This restores an existing rule without adding a screen.

## Enhancement suggestions after the fixes

1. **Session readiness:** verify the selected six categories, reserve sufficient legal questions, and preload question images before deducting a game. Revalidate selections after bank synchronization; a selected category can disappear from the available list while still remaining in `cats`.
2. **Keep the display awake during play:** prevent an otherwise idle 60-second question from being interrupted by screen sleep, with appropriate lifecycle handling on web and native platforms.
3. **Faster repeat setup:** optionally remember team/player names per account, while keeping any decision about separate group question histories explicitly deferred to you.
4. **Question health in admin:** show playable counts by category/level, recent reports, declared families, and previews with the actual QuestionView. This is more useful for bank expansion than total question count alone.
5. **Password recovery and confirmation-email resend:** both are missing from the email account flow. They are valuable before bringing in more users.
6. **Accessible controls:** add input labels, dialog focus containment and restoration, appropriate Escape handling, and clearer accessible labels for score adjustments. The portrait gate is `aria-hidden` while the app is hidden, and page zoom is disabled; review those together.
7. **Simplify styling without changing the approved design:** main.tsx loads theme, showtime, neo, and blocks together, plus screen-local style tags. Those four files alone total 3,306 lines. Consolidate the current appearance into shared tokens/components and explicitly scoped screen styles. Treat this as a behavior-preserving refactor with screenshots, not a redesign.
8. **Browser regression suite:** a real reducer-driven session remains essential, but add UI tests for reload, account switching, delayed synchronization, picture upload, 12-player endgame, longest text, and landscape phone/TV sizes. The existing tests run in a non-browser environment.
9. **Operational visibility:** add recoverable error handling and lightweight diagnostics for failed saves, bank synchronization, empty pools, and image failures. Record enough context to reproduce a failure without logging account tokens or personal details.
10. **Reconcile SPEC and code comments:** current sections still describe removed category ownership, older score controls, older branding and bank counts. Move superseded history into a changelog and keep current behavior unambiguous. Your protected bank and approved artwork stay unchanged.

## Suggested implementation order

- **First:** account isolation, timer recovery, reliable close/save, strict draw constraints and exhaustion handling.
- **Next:** import/report fixes, content safeguards, score attribution, and focused browser/database tests.
- **Then:** readiness checks, simpler setup, content-health tooling, and stylesheet consolidation.

Payment routing, resume-window duration, group-history scope, and the unresolved final-round reveal interaction still require your decisions. This review does not choose them or propose changing your game rules to conceal implementation problems.
