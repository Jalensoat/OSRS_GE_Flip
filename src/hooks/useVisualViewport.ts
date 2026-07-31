import { useEffect } from "react";

/**
 * Reset residual document scroll after keyboard dismiss / orientation change.
 * Do NOT set --app-height (or any layout size) — dual height racing with a
 * fixed bottom-nav leaves a void strip under the tabs on iOS Home Screen PWA.
 */
export function useIosKeyboardReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const onOrientation = () => {
      setTimeout(resetScroll, 50);
      setTimeout(resetScroll, 300);
    };

    window.addEventListener("resize", resetScroll);
    window.addEventListener("orientationchange", onOrientation);

    const onFocusOut = () => {
      requestAnimationFrame(() => {
        setTimeout(resetScroll, 50);
        setTimeout(resetScroll, 350);
      });
    };
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.removeEventListener("resize", resetScroll);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
}

/** @deprecated */
export const useVisualViewportPin = useIosKeyboardReset;
