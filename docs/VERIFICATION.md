# Sotto 0.1.0 verification

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

## Limits of verification

No real Gemini key or Google account was supplied. Real microphone recognition accuracy, provider latency, billing and Google account eligibility/audio support have not been verified. The Google account connection remains experimental. The app keeps uncertain or focus-blocked results ready to copy rather than inserting them automatically.
