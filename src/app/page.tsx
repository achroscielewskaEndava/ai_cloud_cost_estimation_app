"use client";

import HeroSection from "./components/landing/HeroSection";
import FeaturesSection from "./components/landing/FeaturesSection";
import HowItWorksSection from "./components/landing/HowItWorksSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 AI Cloud Cost Estimation. All rights reserved.
      </footer>
    </main>
  );
}
