"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={null}>
      <AuthErrorContent />
    </Suspense>
  );
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";

  return (
    <main className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Failed to log in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">code: {error}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/auth/signin">
          <Button size="lg">Try again</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="lg">
            Go back to Homepage
          </Button>
        </Link>
      </div>
    </main>
  );
}
