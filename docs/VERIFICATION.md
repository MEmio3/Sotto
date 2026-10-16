# Sotto verification

## v0.1.2 writing modes

- Twenty automated tests passed, including style-specific instructions, Prompting's no-answer/no-invented-requirements rules, language/meaning/JSON safeguards, persisted mode selection, and Precise defaults for existing profiles.
- Source desktop smoke passed at `.test-data/run-1792168855257/smoke.json`. It selects every mode through the actual controls, checks the outbound mock-provider instruction and saved history mode, verifies persistence and invalid-mode rejection, and blocks changes while recording. Desktop and compact stress layouts have no horizontal overflow.
- Independent Impeccable finish review: **ship**, no material findings. The reviewer confirmed type, monochrome materials, placement, visible selection, help text, compact reflow and behavior.
- Real-provider checks on Gemini 3.8 Flash Low returned distinct appropriate edits for all five modes using synthetic public text. Prompting returned a binary-search teaching prompt with the requested beginner audience, short Python example and no-recursion constraint; it did not answer the task. No user recordings or dictation history were sent for these checks, and the saved user profile was not modified.
- The finished portable executable passed the same desktop checks at `.test-data/run-1792169270911/smoke.json`, including all five modes, retained language settings and the account model picker. Build size: 91,673,989 bytes. SHA-256: `1a4663ae655838d38eeb3d1f2257f64aa1c08fe229054118e5adcd582f3646e5`.
- Cursor insertion was not changed in this release. The user confirmed successful automatic paste into Discord before mode implementation. Native Unicode/clipboard/focus checks from the baseline remain applicable.


## v0.1.1 Google connection and model picker

- 18 automated tests passed, including the exact empty-project-object regression, correct Antigravity client headers, bounded asynchronous onboarding, dynamic model IDs and step-specific error handling.
- Source desktop smoke passed at `.test-data/run-1792166315500/smoke.json`. New checks exercise model discovery failure, retry, choosing an exact model ID, saving it, and layout at the 900px desktop minimum width. Screenshots use an isolated example account and mock provider.
- Packaged desktop smoke passed at `.test-data/run-1792166644419/smoke.json`, including selecting the connection when **Use model** is clicked. The final compact-width inspection confirmed that the picker and its save/retry controls stay in view.
- The finished portable executable passed the same desktop checks at `.test-data/run-1792166864337/smoke.json`. Build size: 91,670,170 bytes. SHA-256: `453b57ff56757317254785dbbbf98aa1ba4490d79d45ca31b9728c92348e231c`.
- A real Google account returned 22 catalog entries, including 13 Gemini Flash variants. The account's actual project was discovered with the corrected client protocol; no manually supplied Cloud project was necessary for that account.
- Text editing succeeded on Gemini 3.5 Flash Lite and Gemini 2.5 Flash Lite. A synthetic English WAV saying “Please send the revised drawings tomorrow” was transcribed and polished correctly on Gemini 2.5 Flash Lite and Gemini 3.8 Flash Low. These checks used the saved session only in memory, did not read or send user dictation history, and did not modify the saved user profile.
- Model availability and sample success do not establish universal account eligibility, all-language accuracy, arbitrary audio support or stable latency. The Google connection remains experimental; its sign-in flow still lacks PKCE.

## v0.1.0 baseline

## Floating recorder review

| Area | Verdict | Evidence |
| --- | --- | --- |
| Layout and readability | Pass | Seven rendered states; no document overflow, readable language and elapsed time, bounded waveform. |
| Recording and processing | Pass | Finish and Cancel actions invoke the appropriate IPC actions. |
| Completion and errors | Pass | Copy, Dismiss and Open Sotto actions work; final-state dismissal hides the recorder. |
| Language settings | Pass | English, Bangla, Same as speech, disabled keyboard hints and spoken cues checked. |

The recorder now uses a 438 × 104 transparent native window with a 398 × 64 capsule, 14 px status text, 11 px supporting text, and distinct listening, processing, completion and error states. The final design review passed with no material findings. Preview and action evidence is under `.impeccable/review/floating/`; `actions.json` reports all six checks passing.

![Floating recorder](Floating-recorder.png)

## Automated and desktop checks

- All 11 core and provider tests passed after the recorder changes.
- Source desktop smoke passed: `.test-data/run-1792162593920/smoke.json`. This checks the bridge, native helper, layout, shortcut, text and recorded-audio pipelines using a local mock provider, language selection, shortcut release, failure history, stale retry protection, recorder language settings and Windows credential encryption.
- Packaged desktop smoke passed against `release/win-unpacked/Sotto.exe` with the polished recorder: `.test-data/run-1792162838277/smoke.json`. This exercises the same workflow from the packaged application archive, including its unpacked native helper.
- The finished portable `release/Sotto-0.1.0-Windows.exe` also passed the desktop smoke: `.test-data/run-1792163081814/smoke.json`. Build size: 91,670,725 bytes. SHA-256: `6AE052568DCD5905C3F753E4DF85559284C82B738D9591D75D4E6A365D5B8B03`.
- Native Unicode and multiline insertion was separately verified against Sotto's own test textbox: `.test-data/run-1792161026335/smoke.json`. The report confirms Ctrl+V, no Enter key, clipboard restoration and focus protection. Subsequent smoke runs skip that foreground-dependent check.

## Original v0.1.0 verification limits

No real Gemini key or Google account was supplied. Real microphone recognition accuracy, provider latency, billing and Google account eligibility/audio support have not been verified. The Google account connection remains experimental. The app keeps uncertain or focus-blocked results ready to copy rather than inserting them automatically.
