import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/landing/hero";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Hero />
      </main>
    </div>
  );
}
