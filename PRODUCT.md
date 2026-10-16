# Sotto

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Electron on Windows, HTML/CSS and JavaScript. Electron was specified in the conversation; a self-contained desktop executable is the delivery target. No separate OmniRoute service.

## Users
People dictating in Bangla, English, or mixed languages into the active desktop textbox.

## Product Purpose
Record with a global shortcut, accurately rewrite speech, and paste the result at the typing cursor. Let people find their previous dictations locally.

## Operating Context
Windows desktop; browser forms, editors and chats; a tray app and nonactivating recording indicator. Ctrl+P is the requested default and must be configurable.

## Capabilities and Constraints
User-owned API connections, local searchable history, original transcript alongside final text, observable connection and recording states. Audio capability differs by provider. Network access and user credentials are required for cloud processing. v0.1.1 has verified real Google account discovery and a short synthetic English audio sample; credentials stay local and are not bundled. Google OAuth account access must be represented honestly and tested before showing Ready. The Connections model picker uses the account's live catalog and saves an explicit selection. No accuracy or latency guarantees.

## Brand Commitments
Black and white, classy, capsule buttons, a clear account of what the app is doing. Working name Sotto is an implementation assumption; no existing brand assets.

## Open Decisions
Default output is polished English. Confirmed: Ctrl+P starts/stops; B selects Bangla and E selects English while recording. Spoken language instructions are enabled by default and have a setting to disable them. Antigravity access depends on the user's account and availability of a usable OAuth client. The user selected E:/Sotto as the app workspace.

## Product Principles
- Keep the meaning, names, numbers and negations intact.
- Treat dictations independently by default.
- Preserve failed work and offer recovery.
- Reveal the current operation clearly.
- Keep credentials out of the renderer and history.
