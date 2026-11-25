import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PrivacyBand } from "@/components/landing/privacy-band";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <PrivacyBand />
      </main>
    </div>
  );
}
