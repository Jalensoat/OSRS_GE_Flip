/**
 * Brand assets — swap files under /public and paths here to rebrand.
 * Home-screen / PWA icons are generated from the same art in public/.
 */
export const BRAND = {
  /** App name shown in header, title, and home-screen shortcut */
  name: "OSRS Flip Lab",
  shortName: "Flip Lab",
  tagline: "Capital-aware GE flips · live Wiki + RuneLite",

  /**
   * Primary logo used in the header / settings.
   * Replace `/logo.png` in public/ (and regenerate apple-touch-icon.png,
   * icon-192.png, icon-512.png, favicon-32.png) to change branding.
   */
  logoSrc: "/logo.png",
  /** Square mark for compact UI (same file by default) */
  markSrc: "/logo.png",

  /** PWA / Safari home-screen icons (absolute public paths) */
  icons: {
    favicon: "/favicon-32.png",
    faviconSvg: "/favicon.svg",
    appleTouch: "/apple-touch-icon.png",
    pwa192: "/icon-192.png",
    pwa512: "/icon-512.png",
  },
} as const;

export type BrandConfig = typeof BRAND;
