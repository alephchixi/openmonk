# Accessibility

## Audio Control

- No autoplay. Sound begins only after explicit user action.
- Stop button is always visible during an active session.
- Escape key stops all audio and sets status to `Stopped.`
- Mute toggle is always available.
- Volume slider is always available.
- Audio lasting more than a few seconds always has pause/stop or volume control.

## Keyboard Navigation

- All controls are reachable with keyboard.
- Tab order follows visual layout.
- Focus-visible styles are provided for all interactive elements.
- Escape is a global stop shortcut.

## Screen Readers

- Status phrases are announced via a hidden live region (`aria-live="polite"`).
- Decorative glyphs are marked `aria-hidden="true"`.
- Timer displays include `aria-label` with remaining time.
- Mode selector uses `role="radiogroup"` with `aria-checked`.
- Mode selector supports left/right arrow navigation.
- Info modal uses dialog semantics, focus entry, focus return, and Escape close.

## Reduced Motion

- `@media (prefers-reduced-motion: reduce)` disables all CSS animations.
- Glyphs remain visible but static.
- Functionality is unaffected.

## Visual Design

- Text does not overlap at mobile widths.
- Controls remain reachable at all viewport sizes.
- Sufficient color contrast between text and background.
- No reliance on color alone for state indication.

## Visual-Only Operation

- OpenMonk can be operated without audio through Zen mode.
- Timer is the primary visual feedback during silent modes.
- Status phrases provide text confirmation of all state changes.
