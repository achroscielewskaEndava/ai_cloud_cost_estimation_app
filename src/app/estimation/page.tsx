"use client";
import AuthGuard from "../AuthGuard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, RotateCcw, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Usage from "@/app/estimation/components/Usage";
import Results from "@/app/estimation/components/Result;
import Providers, { Provider } from "@/app/estimation/components/Providers";
import { useStatistics } from "@/app/estimation/hooks/useStatistics";
import { useSendToAI } from "@/app/estimation/hooks/useSendToAi";

export default function EstimationPage() {
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const { saveStatistics } = useStatistics();
  const { sendToAI, loading, results, setResults } = useSendToAI();

  const toggleProvider = (provider: Provider) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider],
    );
  };

  const handleEstimation = async () => {
    await Promise.allSettled([
      sendToAI(
        selectedProviders.map((p) => p.name),
        answers,
        notes,
      ),
      saveStatistics(selectedProviders),
    ]);
  };

  const restart = () => {
    setSelectedProviders([]);
    setAnswers({});
    setNotes("");
    setResults(null);
  };

  return (
    <AuthGuard>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">
          Cloud Cost Estimation
        </h1>
        <p className="mt-2 text-muted-foreground">
          Fill in your infrastructure details to get AI-powered cost estimates.
        </p>

        <div className="mt-5 space-y-4">
          {/* Section 1 - Providers */}
          <Providers
            selectedProviders={selectedProviders}
            onToggleProvider={toggleProvider}
          />

          {/* Section 2 - Usage */}
          <Usage answers={answers} setAnswers={setAnswers} />

          {/* Section 3 - Notes */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>3. Custom Infrastructure Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add additional infrastructure details not covered above..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Section 4 - Submit */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => handleEstimation()}
              disabled={loading || selectedProviders.length === 0}
              className="px-8 py-6 text-base font-semibold rounded-xl"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              Get Estimates
            </Button>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {selectedProviders.map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          )}

          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Section 5 - Results */}
                <div className="print-area">
                  <Results results={results} />
                </div>

                {/* Section 6 - Actions */}
                <div className="mt-6 flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleEstimation()}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                  </Button>
                  <Button variant="outline" onClick={restart}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Start Over
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuthGuard>
  );
}
