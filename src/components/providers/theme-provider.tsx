"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps the app in `next-themes`.
 *
 * `next-themes` injects a tiny blocking script into the document head that sets
 * `.dark` before first paint, so the saved theme (or the system preference) is
 * applied without a flash of the wrong colours.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="snackers-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
