---
name: "Sotto"
description: "A quiet monochrome writing instrument for Windows dictation."
colors:
  ink: "#191919"
  paper: "#f8f8f8"
  white: "#fff"
  muted: "#6b6b6b"
  secondary-text: "#666"
  line: "#dfdfdf"
  sidebar: "#181818"
  nav-text: "#b2b2b2"
  nav-selected: "#f5f5f5"
  nav-hover: "#262626"
  instrument: "#1c1c1c"
  recording: "#151515"
  inverse-action: "#f7f7f7"
  inverse-hover: "#e1e1e1"
  primary-hover: "#3c3c3c"
  secondary-stroke: "#d2d2d2"
  secondary-hover: "#ebebeb"
  status-surface: "#eaeaea"
  status-text: "#595959"
  focus: "#777"
  field-stroke: "#d9d9d9"
  field-placeholder: "#707070"
  instrument-secondary: "#aeaeae"
  hud: "#161616"
  hud-text: "#f6f6f6"
  hud-secondary: "#b8b8b8"
  hud-hairline: "#393939"
  hud-primary: "#f2f2f2"
  hud-primary-hover: "#d7d7d7"
typography:
  display:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "44px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "31px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-.035em"
  title:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-.035em"
  section-title:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.6
    letterSpacing: "-.02em"
  body:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  reading:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  small-label:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
  navigation:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.6
  field:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  status:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.6
  operation-label:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "10px"
    fontWeight: 550
    lineHeight: 1.6
    letterSpacing: ".12em"
  hud-title:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-.015em"
  hud-meta:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  hud-language:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "14px"
  hud-timer:
    fontFamily: "Manrope, 'Segoe UI', 'Nirmala UI', sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: ".01em"
  hud-key:
    fontFamily: "Manrope, sans-serif"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: "15px"
rounded:
  panel: "14px"
  capsule: "999px"
  field: "9px"
  message: "10px"
  history-row: "7px"
  shortcut: "6px"
  circle: "50%"
spacing:
  compact: "4px"
  close: "8px"
  control-gap: "9px"
  small: "12px"
  medium: "16px"
  inset: "18px"
  action-inline: "22px"
  large: "24px"
  section: "30px"
  workspace-inline: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.capsule}"
    padding: "12px 22px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.capsule}"
    padding: "12px 22px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  button-record:
    backgroundColor: "{colors.inverse-action}"
    textColor: "{colors.sidebar}"
    typography: "{typography.label}"
    rounded: "{rounded.capsule}"
    padding: "12px 22px"
    height: "47px"
  button-record-hover:
    backgroundColor: "{colors.inverse-hover}"
  button-dark-outline:
    backgroundColor: "transparent"
    textColor: "#e8e8e8"
    typography: "{typography.label}"
    rounded: "{rounded.capsule}"
    padding: "12px 22px"
    height: "44px"
  button-small:
    typography: "{typography.small-label}"
    padding: "10px 17px"
    height: "40px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.field}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
    height: "40px"
  navigation:
    backgroundColor: "transparent"
    textColor: "{colors.nav-text}"
    typography: "{typography.navigation}"
    rounded: "{rounded.capsule}"
    padding: "13px 17px"
  navigation-selected:
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.ink}"
  writing-mode:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.capsule}"
    padding: "9px 17px"
    height: "40px"
  writing-mode-hover:
    backgroundColor: "{colors.secondary-hover}"
  writing-mode-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
  writing-mode-selected-hover:
    backgroundColor: "{colors.primary-hover}"
  status-pill:
    backgroundColor: "{colors.status-surface}"
    textColor: "{colors.status-text}"
    typography: "{typography.status}"
    rounded: "{rounded.capsule}"
    padding: "7px 12px"
  recording-instrument:
    backgroundColor: "{colors.instrument}"
    textColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "22px 27px 18px"
    height: "312px"
  recording-instrument-recording:
    backgroundColor: "{colors.recording}"
  hud:
    backgroundColor: "{colors.hud}"
    textColor: "{colors.hud-text}"
    rounded: "{rounded.capsule}"
    padding: "10px 13px 10px 17px"
    height: "64px"
    width: "398px"
  hud-primary:
    backgroundColor: "{colors.hud-primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    padding: "0"
    height: "36px"
    width: "36px"
  hud-primary-hover:
    backgroundColor: "{colors.hud-primary-hover}"
  hud-dismiss:
    backgroundColor: "transparent"
    textColor: "#bdbdbd"
    rounded: "{rounded.circle}"
    padding: "0"
    height: "30px"
    width: "30px"
---

# Design System: Sotto

## Overview

**Creative North Star: "The Quiet Writing Instrument"**

Sotto is a restrained Windows writing tool: ink-black navigation, a paper-white workspace, Manrope lettering, capsule controls, and fine grayscale dividers. The confirmed direction is black and white, classy, and clear about the current operation. Contrast, type, and spacing supply hierarchy; the interface stays calm around the user's words.

This is a snapshot of the built HTML/CSS interface inside its Electron desktop wrapper, drawn from the design contract in `src/index.html`, the complete CSS cascade in `src/styles.css`, the recording HUD, and the renderer's real states. The desktop and narrow screenshots in `.test-data/run-1792160889245/screenshots/` are implementation evidence. The refined floating recorder is captured in `.impeccable/review/floating/final-1.png` through `final-7.png`. There is no approved visual comp. The North Star names the existing contract rather than proposing another visual direction.

**Key Characteristics:**

- Monochrome contrast with an inky navigation rail and recording surface.
- Capsule actions, rounded fields, and thin dividers.
- One visible dictation action with explicit operation labels and recovery.
- Self-hosted Manrope with Windows and multilingual fallbacks.
- Real history, real connection status, and microphone-driven recording feedback.

## Colors

The palette uses achromatic surfaces and readable gray text; it has no separate secondary or tertiary brand accent. The frontmatter records the reused source values without converting their CSS notation. The sidecar's generated neutral tonal ramps are swatch previews, not additional application tokens.

### Primary

- **Ink:** primary actions and normal workspace text. On white or paper, it gives the main action a definite silhouette.
- **Primary Hover:** the softer dark fill used when the primary button is hovered.

### Neutral

- **Paper / White:** paper is the workspace and sticky settings-save background; white is the field surface and inverse text.
- **Sidebar / Nav Text / Nav Selected / Nav Hover:** the persistent dark rail, inactive navigation, pale selected capsule, and dark hover fill.
- **Instrument / Recording:** the dark dictation panel and its slightly deeper listening state.
- **Inverse Action / Inverse Hover:** the light recording action inside the dark panel.
- **Muted / Secondary Text:** explanatory text. The final accessibility overrides use Secondary Text for quiet labels, text actions, result metadata, result tabs, and the footer; do not copy their earlier, lighter declarations.
- **Line / Secondary Stroke / Field Stroke:** separators, outlined actions, and form boundaries.
- **Status Surface / Status Text:** neutral connection-state capsule. Read the state from its words as well as the small dot.
- **Field Placeholder / Focus:** legible placeholder gray and the visible keyboard outline.
- **Instrument Secondary:** supporting copy on the recording panel.
- **HUD / HUD Text / HUD Secondary:** the floating recorder's deeper dark surface, primary text, and readable metadata.
- **HUD Hairline / HUD Primary / HUD Primary Hover:** the recorder's action separator and high-contrast circular primary action.

**The Monochrome State Rule.** Distinguish operations with explicit text, control state, and restrained motion. Do not introduce color as the only state signal.

## Typography

**Display Font:** self-hosted Manrope variable font (`src/assets/manrope.woff2`, weights 200–800).
**Body Font:** the same Manrope family, followed by Segoe UI, Nirmala UI, and sans-serif in the main window.
**Label/Mono Font:** labels remain Manrope. Timers use tabular numerals; shortcuts use Manrope rather than an added monospace family. The HUD also includes Nirmala UI in its fallback stack.

The type is compact, clear, and slightly editorial. Large headings use tight tracking, while the recording status uses spaced capitals. The softened second line of the dictation heading uses weight 450 and the Field Placeholder gray.

### Hierarchy

- **Display:** the two-line dictation heading; its narrow-preview size is (35px).
- **Headline:** compact page headings for History, Connections, and Settings; size becomes (27px) at the medium breakpoint.
- **Title:** centered recording-panel title; narrow-preview size is (23px).
- **Section Title:** short workspace and settings section headings.
- **Body / Reading:** base text and the more spacious transcript/result text. Results preserve line breaks, wrap long content, and use automatic text direction.
- **Label / Small Label / Navigation:** capsule actions, compact actions, and navigation. These are the effective values after the final readability overrides.
- **Field / Status / Operation Label:** form content, connection capsules, and uppercase panel operation text. Supporting page copy is (13px), or (12px) in the narrow preview; most field help is (12px).

**The Final Cascade Rule.** Treat the final accessibility overrides in the stylesheet as the typography and secondary-text authority. Earlier 8–10px declarations are not the default for new desktop controls.

## Layout

The shipped surface is a Windows Electron app with a custom frameless window and HTML/CSS renderer. Its initial window is (1240×850px), with a native minimum of (900×670px). The narrow layout is a responsive interface preview, not evidence of a shipped mobile app.

At normal desktop widths, the shell has a fixed navigation rail (204px) and a flexible workspace. The custom titlebar is (38px) high. Main content scrolls independently, uses padding (37px 48px 38px), and is centered within a maximum page width (1100px). The footer stays outside the scrolling main area. Page headings align the title left and the connection state/actions right.

At widths up to (1050px), the rail becomes (178px), workspace padding becomes (30px), and dense history/connection layouts tighten. At widths up to (720px), the shell becomes a document flow: the dark navigation becomes a sticky horizontal bar, navigation is icon-only, the sidebar's lower content and titlebar are hidden, and main padding is (29px 22px). History and forms become single-column; connection actions wrap. The shortcut shown inside the recording button is hidden. Keep navigation labels available to assistive technology when their visible text is suppressed.

The main recording panel has a minimum height (312px), including in the current wide and narrow cascades. Its normal inner padding is (22px 27px 18px), and narrow padding is (19px 18px). At widths from (1450px), main top padding grows to (50px) and the waveform region grows to (80px); the final panel minimum-height declaration still wins.

The local-history layout uses two columns (`minmax(180px,.85fr)` and `minmax(240px,1.25fr)`) with a gap (30px), reduced to (20px) at the medium breakpoint. Form grids use two equal columns with a gap (19px). Use the small, repeated spacing steps in frontmatter within these established larger compositions.

## Elevation & Depth

The main window is mostly flat. Dark and pale surfaces, thin dividers, and selected fills define boundaries. Secondary buttons use an inset one-pixel stroke rather than a lifted card shadow. Avoid adding elevation to ordinary workspace sections.

### Shadow Vocabulary

- **Secondary action stroke** (`inset 0 0 0 1px #d2d2d2`): outlines a capsule on the paper workspace.
- **Dark outline action stroke** (`inset 0 0 0 1px #595959`): outlines Cancel on the recording surface.
- **Selected segment** (`0 2px 5px #25252510`): a small lift for the selected API-type segment.
- **Toast** (`0 6px 24px #0002`): separates a transient dark message from the workspace.
- **Recording HUD** (`0 6px 15px #00000038`): separates the floating capsule from other desktop windows.

**The Flat Workspace Rule.** Keep ordinary content flat; reserve ambient shadow for the floating HUD, toast, and the existing selected segment.

## Shapes

Capsules are the recurring control silhouette: action buttons, selected navigation, status pills, badges, segmented controls, and switches. The recording panel uses the panel radius; form fields use the field radius; history rows use the smaller history-row radius. These are different roles, not interchangeable rounding choices.

Provider marks, empty-state icons, and icon buttons are circular. Shortcuts are small outlined keycaps, with slightly softer corners in the sidebar than inside the instrument. General icons are simple inline SVG strokes with rounded caps and joins; the waveform mark is the recognizable brand signature.

## Components

### Buttons

Actions are quiet, compact capsules. Primary buttons are dark on the workspace; secondary buttons are transparent with the inset stroke; the recording action is pale on the dark instrument. Normal actions have a minimum height (44px), small actions (40px), and the recording action (47px). The frontmatter's component heights describe these implemented minimum heights, not fixed clipping boxes.

Hover changes the background. Pressed capsule actions scale to (.98). Focus-visible uses the Focus outline (2px) with an offset (4px); disabled buttons have opacity (.45) and a not-allowed cursor. Dark-outline Cancel retains its outline treatment. Small actions use less horizontal padding (14px) in the narrow preview.

Text actions have no filled surface, use secondary text, and darken on hover; their minimum height is (28px). Circular icon actions are (33px) square with a pale hover fill. Do not enlarge these facts into a claim that every existing target is 44px.

### Writing Modes

Five visible capsules sit between the language controls and recording instrument, in this order: Constructive, Precise, Professional, Prompting, Casual. They extend the existing monochrome capsule language without adding a surrounding card or selection shadow. The desktop and compact specimens are recorded in `.impeccable/review/modes/desktop.png` and `compact.png`.

Unselected modes use White, Ink, and a thin Secondary Stroke border (1px). The selected mode reverses to Ink with White text and an Ink border; hover uses the corresponding frontmatter variant. Labels use Manrope (12px, weight 550). The component height is a minimum (40px). Focus-visible uses the shared Focus outline (2px) with an offset (3px); disabled modes use opacity (.55) and a not-allowed cursor. Background and text transitions take (.15s, ease), removed for reduced-motion preference.

The section heading is compact (13px, weight 650), paired with the quiet note “For your next dictation or rework” (11px). The controls use a wrapping row with the Close gap. A single Secondary Text helper sentence (12px, line-height 1.6) sits below, with top spacing (10px) and a reserved minimum line (1.6em). The heading can wrap as well. At the narrow breakpoint (720px), horizontal capsule padding becomes (13px), the note becomes (10px), and the section's bottom space becomes (20px), from Large on desktop. Keep all five choices visible as they wrap; the compact specimen shows three capsules followed by two.

The group is named by “Writing mode” and described by its helper. Each real button exposes `aria-pressed`; selection updates the helper as a polite status message. Use the shipped descriptions:

- **Constructive:** Helpful, considerate wording that makes feedback easier to act on.
- **Precise:** Direct, concise wording with every important detail intact.
- **Professional:** Clear, respectful language for work and formal conversations.
- **Prompting:** Turn your thought into a clear instruction for another AI.
- **Casual:** Relaxed, natural wording for everyday messages.

Precise is the default; choosing a mode saves it for the next dictation, typed-text polish, or history rework. Capsules are disabled while saving a selection and throughout opening the microphone, recording, transcribing, polishing, and inserting, so a running job retains its mode. Finished-result metadata displays the saved mode as a badge alongside language. The floating recorder's polishing note reads “[Mode] writing”; its language tooltip also includes the mode. Prompting produces the prompt itself without answering or executing it, and all modes preserve a faithful original transcript.

### Status Pills / Badges

Connection status is a neutral capsule with a small dot and plain-language text: disconnected, saved but untested, or text verified. Badges use a small pale capsule for actual output language, selected connection, or Experimental status. Neither pattern is a decorative success badge.

### Recording Instrument

A dark, gently rounded panel contains the operation label and timer above the waveform, then a centered title, supporting line, main action, and shortcut/language hints. Its waveform has (49) slim bars, alternating light and darker gray. In the narrow preview, five bars at each edge are hidden.

While recording, bar transforms follow actual microphone level updates; the timer advances and the main action becomes Finish dictation. Opening the microphone, transcribing, polishing, and inserting are separate processing stages. The main action is disabled while those stages run, and Cancel remains available. Done, error, and cancelled states each have their own copy. Error messages offer the applicable recovery action.

The listening dot breathes over (1.7s); the processing waveform fades and narrows over (1.8s). Bar transforms respond over (.12s). General action transitions take (.2s) with the source easing for transforms, and the panel's background transition takes (.3s). Reduced-motion preference removes animation and transitions.

**The Observable Operation Rule.** Keep the current stage, language, timer, disabled action, and recovery copy synchronized with real state. Never substitute a looping idle animation for microphone evidence.

### Inputs / Fields

White fields have a thin Field Stroke border, the field radius, internal padding (11px 12px), and minimum height (40px). Textareas resize vertically, use line-height (1.8), and have a minimum height (80px). Placeholders use the final readable gray. Apply the shared focus outline; retain labels above the field.

Search is a specific low-chrome variant with an underline and transparent input, not a second general form style. Password fields include an inset circular visibility button. API discovery and save actions expose busy labels and disabled states; explanatory messages remain adjacent to the form.

Google connections expose a visible **Models** capsule action. Its inline picker shares the API form layout, with a full-width native select (14px, minimum height 42px), an adjacent discovery/recovery message and **Find models** / **Use model** actions. The list comes from live account discovery; loading, empty and error states disable saving. Using a model saves that exact ID and selects its connection for dictation. The form scrolls into view when opened and remains available for retry after a failed request.

### Navigation

The dark rail uses full-width capsule items with a line icon and text. The selected item has a pale fill and dark text; hover stays within grayscale. Current-page semantics are updated with navigation. Preserve the main navigation's accessible name and keyboard focus behavior when adding destinations.

The custom titlebar includes minimize, maximize, and close-to-tray controls. Its draggable area and the sidebar's draggable regions exclude interactive controls. Keep these native wrapper behaviors distinct from ordinary page navigation.

### Containers / Local History

Latest words, connections, and settings are divided by fine horizontal rules rather than stacks of elevated cards. Empty history and latest-result states provide a real next action. History entries are compact selectable rows; hover and selected states share a pale fill. The detail area offers original and polished tabs, copy, and available recovery/listen actions. Do not fabricate entries, connection latency, verification, or provider availability to populate a screen.

### Segmented Controls / Switches

API type is a pale capsule track with a white selected segment and the small selection shadow. Selected text is dark; unselected text uses the final Secondary Text value. Settings switches are small capsules (36×21px) with a white circular thumb (15px) that travels (15px); checked uses Ink. These controls retain their actual checked/selected state.

### Floating Recording HUD

The separate transparent Electron window is (438×104px), centered above the bottom of the active display. Transparent outer padding (20px) surrounds a visible capsule (398×64px). It remains nonactivating, nonresizable, always on top, and omitted from the taskbar, so the destination textbox keeps focus.

The capsule has a fine dark border and a compact grid: a signal area (34px), a flexible text column, a thin separator (1px), and controls (76px), separated by gaps (12px). Its primary status type is (14px, weight 600); supporting metadata and the tabular timer are (11px), and shortcut keycaps are (10px). The language is a small dark capsule. The timer appears while recording; language-switch hints appear only when enabled. Long language names and notes truncate within their allotted space.

Nine narrow waveform bars remain bounded inside the signal area (34×28px), with displayed heights from (3px) to at most (26px). Their transforms respond to actual microphone levels over (110ms), and level updates apply only while recording. Getting ready, transcribing, polishing, and inserting replace the bars with a rotating spinner (1s). Terminal states replace it with check, attention, or pause symbols. Reduced-motion preference removes spinner animation and all transitions.

The primary circular action is white (36px) and changes by stage: Finish dictation while listening, Copy your words when done, and Open Sotto on error. It is hidden during preparation and processing. The secondary action is smaller (30px), showing Cancel dictation during work and Dismiss recorder for terminal states. Inserting hides the cancel action. Hover softens the primary fill or reveals the secondary dark fill; pressed actions scale to (.92). Keyboard focus uses a white outline (2px) with an offset (3px).

Status and supporting copy distinguish Getting ready, Listening, Transcribing, Polishing, Inserting, Inserted or Ready to copy, Needs attention, and Cancelled. A successful copy changes the label to Copied and tells the user to paste wherever they are writing. Error notes identify provider limits, microphone trouble, saved retry work, or the need to open Sotto. Terminal dismissal hides the recorder without activating the main window; Open Sotto is the explicit route to its details. Completion remains visible for (3.5s), errors for (7s), and cancellation for (1.8s), unless a new active operation takes over.

## Do's and Don'ts

### Do:

- **Do** preserve the confirmed black-and-white direction, capsule controls, and clear operation states.
- **Do** use the final stylesheet cascade when taking type and secondary-text values.
- **Do** keep keyboard focus visible and respect reduced-motion preference.
- **Do** expose real recording, processing, verification, cancellation, and recovery states with words.
- **Do** use self-hosted Manrope and preserve Windows and multilingual fallbacks.
- **Do** keep actual user text readable, line-break preserving, and direction-aware.

### Don't:

- **Don't** add a chromatic accent as a required state signal.
- **Don't** add shadows to ordinary workspace sections or turn every region into a card.
- **Don't** invent history, account readiness, measured latency, or microphone activity.
- **Don't** describe a saved API connection or successful text test as proven audio access.
- **Don't** treat the narrow preview as a released mobile product or bypass the desktop minimum size.
- **Don't** use the older tiny label declarations as the new desktop typography scale.
