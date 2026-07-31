import { useEffect } from "react";

/**
 * Lock --app-height to window.innerHeight (layout viewport).
 * Do NOT use visualViewport.height — on iOS Home Screen that value is
 * often shorter than the display and leaves a black band under the tabs.
 *
 * Also resets residual scroll after the keyboard dismisses.
 */
export function useIosKeyboardReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    const setHeight = () => {
      // Prefer the larger of innerHeight / clientHeight so we never shrink
      // below the real layout viewport on iOS standalone.
      const h = Math.max(
        window.innerHeight || 0,
        document.documentElement.clientHeight || 0,
      );
      if (h > 0) {
        root.style.setProperty("--app-height", `${h}px`);
      }
    };

    const resetScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    setHeight();
    resetScroll();

    window.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", () => {
      setTimeout(setHeight, 50);
      setTimeout(setHeight, 300);
      resetScroll();
    });

    const onFocusOut = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setHeight();
          resetScroll();
        }, 50);
        setTimeout(() => {
          setHeight();
          resetScroll();
        }, 350);
      });
    };
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);
}

/** @deprecated */
export const useVisualViewportPin = useIosKeyboardReset;
