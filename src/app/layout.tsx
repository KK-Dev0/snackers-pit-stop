import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";

import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snackers Pit Stop",
  description:
    "Plan a week of affordable meals around your diet, calories and pantry — then shop once.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
