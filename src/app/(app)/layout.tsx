import { BottomTabs } from "@/components/layout/bottom-tabs";
import { TopNav } from "@/components/layout/top-nav";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

/**
 * Shell for the five core screens. The top nav is desktop-only; on mobile the
 * fixed tab bar gets extra bottom padding so content is never hidden behind it.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col">
        <Toaster position="bottom-right" closeButton />
        <TopNav />
        <main id="main-content" className="flex-1 pb-24 md:pb-12">
          {children}
        </main>
        <BottomTabs />
      </div>
    </ThemeProvider>
  );
}
