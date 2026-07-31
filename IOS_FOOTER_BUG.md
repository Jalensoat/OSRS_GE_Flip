# iOS Home Screen — black gap under bottom tabs

## Priority

**P0 layout bug.** User reinstalled Home Screen icon multiple times. Desktop Safari and Grok live preview look OK; standalone PWA does not.

## Reproduce

1. Open the deployed app in iPhone Safari  
2. Share → Add to Home Screen (Open as Web App = on)  
3. Open from the home icon  
4. Observe large black band under Best / Hot / Invest / Watch / Volume tabs  

## Expected

Tab bar flush to bottom of the display; only home-indicator safe-area padding under the icons (same feel as native / user’s Houseries todo app).

## Actual

~50–80 CSS px (measured ~70px on IMG_9102) of empty black (`#0a0b0d`) **below** the entire tab bar. Tab bar floats above the gap.

## Key files

- `src/styles.css` — `.app`, `.bottom-nav`, `.app-main`, `.pad-top-safe`  
- `src/components/ge/GeApp.tsx` — shell markup, `<nav className="bottom-nav">`  
- `src/hooks/useVisualViewport.ts` — `--app-height` from `innerHeight`  
- `src/routes/__root.tsx` — viewport / apple-mobile meta + first-paint height script  
- `public/site.webmanifest`  

## Do not regress

- Desktop top tabs still work (`lg:` breakpoints)  
- 16px inputs on mobile (prevents focus zoom)  
- Flip math, polls, detail drawer width  

## Suggested fix directions

1. Real-device Web Inspector on the Home Screen webview: measure `window.innerHeight`, `visualViewport.height`, `screen.height`, `getBoundingClientRect()` of `.app` and `.bottom-nav`, `env(safe-area-inset-bottom)`.  
2. Try painting an always-on full-width footer layer with `bottom: 0; min-height: calc(tab + max(safe-area, 0))` and `background` that cannot collapse.  
3. Test without `position: fixed` on `.app` (document flow only).  
4. Test `height: 100svh` / `100lvh` / `100dvh` stack carefully — avoid visualViewport height pins (already proven harmful).  
5. Align with Houseries / a minimal known-good iOS PWA tab bar.  
