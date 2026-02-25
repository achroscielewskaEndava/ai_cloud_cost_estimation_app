"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import type { ClientSafeProvider } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<
    string,
    ClientSafeProvider
  > | null>(null);

  useEffect(() => {
    getProviders().then((res) => setProviders(res));
  }, []);

  return (
    <main className="container mx-auto flex min-h-[calc(10vh)] max-w-xl flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your preferred sign in method to continue to the dashboard.
        </p>
      </div>
      {providers
        ? Object.values(providers).map((provider) => (
            <Button
              key={provider.id}
              size="lg"
              onClick={() => signIn(provider.id, { callbackUrl: "/" })}
            >
              Sign in with {provider.name}
            </Button>
          ))
        : null}
    </main>
  );
}
