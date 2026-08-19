import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import appCss from "@/styles.css?url";
import { BRAND } from "@/lib/branding";
import { ThemeProvider } from "@/components/ge/ThemeProvider";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: `${BRAND.name} — Capital-aware GE flips & investments`,
      },
      {
        name: "description",
        content:
          "Find the most profitable OSRS Grand Exchange flips for your bankroll. Factor margin, volume, and buy limits. Track investments with live news and market trends.",
      },
      // Obsidian surface (tab bar chrome), not content bg — keep in sync with
      // THEMES[obsidian].vars.surface, public/site.webmanifest, and applyTheme()
      { name: "theme-color", content: "#12141a" },
      { name: "color-scheme", content: "dark" },
      { name: "format-detection", content: "telephone=no" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      // "black" (opaque) avoids translucent status-bar layout quirks on some iOS versions
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
      { name: "apple-mobile-web-app-title", content: BRAND.shortName },
      { name: "application-name", content: BRAND.shortName },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: BRAND.icons.favicon, type: "image/png", sizes: "32x32" },
      { rel: "icon", href: BRAND.icons.faviconSvg, type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: BRAND.icons.appleTouch, sizes: "180x180" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            gcTime: 5 * 60_000,
          },
        },
      }),
  );

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* No --app-height first-paint lock: height-locking races with fixed
            bottom-nav and paints a void under the tabs on iOS standalone. */}
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
