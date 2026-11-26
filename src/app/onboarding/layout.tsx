import { ThemeProvider } from "@/components/providers/theme-provider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
