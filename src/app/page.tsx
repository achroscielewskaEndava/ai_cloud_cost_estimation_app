"use client";

import HeroSection from "./components/landing/hero-section";
import FeaturesSection from "./components/landing/features-section";
import HowItWorksSection from "./components/landing/how-it-works-section";
import { tracker } from "@openreplay/tracker/cjs";
import { useEffect } from "react";

tracker.configure({
  projectKey: "fKkLHVCGkQy0Hsp7PfiT",
});

export default function Home() {
  useEffect(() => {
    // use componentDidMount in case of React Class Component
    tracker.start();
  }, []);

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
