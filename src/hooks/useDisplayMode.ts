import { useSyncExternalStore } from "react";

export type DisplayMode = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  isTouch: boolean;
  width: number;
};

const DESKTOP_MIN = 1024;
const TABLET_MIN = 768;

/** Stable SSR snapshot — must be referentially equal across calls */
const SERVER_SNAPSHOT: DisplayMode = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isStandalone: false,
  isTouch: false,
  width: 1280,
};

let cached: DisplayMode = SERVER_SNAPSHOT;

function compute(): DisplayMode {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;

  const width = window.innerWidth;
  const isDesktop = width >= DESKTOP_MIN;
  const isTablet = !isDesktop && width >= TABLET_MIN;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  const isTouch =
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0;

  return {
    isMobile: !isDesktop,
    isTablet,
    isDesktop,
    isStandalone,
    isTouch,
    width,
  };
}

function same(a: DisplayMode, b: DisplayMode): boolean {
  return (
    a.isMobile === b.isMobile &&
    a.isTablet === b.isTablet &&
    a.isDesktop === b.isDesktop &&
    a.isStandalone === b.isStandalone &&
    a.isTouch === b.isTouch &&
    a.width === b.width
  );
}

function getSnapshot(): DisplayMode {
  const next = compute();
  if (same(cached, next)) return cached;
  cached = next;
  return cached;
}

function getServerSnapshot(): DisplayMode {
  return SERVER_SNAPSHOT;
}

function subscribe(onStoreChange: () => void) {
  const fire = () => onStoreChange();
  window.addEventListener("resize", fire);
  window.addEventListener("orientationchange", fire);
  const mqStandalone = window.matchMedia("(display-mode: standalone)");
  const mqDesktop = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
  mqStandalone.addEventListener("change", fire);
  mqDesktop.addEventListener("change", fire);
  return () => {
    window.removeEventListener("resize", fire);
    window.removeEventListener("orientationchange", fire);
    mqStandalone.removeEventListener("change", fire);
    mqDesktop.removeEventListener("change", fire);
  };
}

/** Live layout mode: desktop browser vs phone / Home Screen. */
export function useDisplayMode(): DisplayMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Imperative check for click handlers. */
export function isPhoneLayout(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < DESKTOP_MIN;
}
