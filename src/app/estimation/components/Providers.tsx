"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface Provider {
  id: string;
  name: string;
}

interface Props {
  selectedProviders: Provider[];
  onToggleProvider: (provider: Provider) => void;
}

export default function Providers({
  selectedProviders,
  onToggleProvider,
}: Props) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/providers");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.data) {
        setProviders(result.data);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card gap-3">
      <CardHeader>
        <CardTitle className="text-lg">1. Cloud Providers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        {loading ? (
          <div className="flex w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
        ) : (
          providers.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 shadow-xs transition-colors hover:bg-muted data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
              data-selected={selectedProviders.includes(p)}
            >
              <Checkbox
                checked={selectedProviders.includes(p)}
                onCheckedChange={() => onToggleProvider(p)}
              />
              <span className="font-medium">{p.name}</span>
            </label>
          ))
        )}
      </CardContent>
    </Card>
  );
}
