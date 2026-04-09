import { supabase } from "@/lib/supabase/server";
import NextAuth, { type AuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

const ALLOWED_DOMAINS = ["endava.com"];

type UserRole = "user" | "admin" | "superadmin";

async function getRoleFromDb(params: {
  provider?: string;
  providerId?: string;
  email?: string | null;
}): Promise<UserRole> {
  const { provider, providerId, email } = params;
  const normalizedEmail = email?.toLowerCase() ?? null;

  // 1) prefer: provider + provider_id
  if (provider && providerId) {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("provider", provider)
      .eq("provider_id", providerId)
      .maybeSingle();

    if (error) throw error;
    if (data?.role) return data.role as UserRole;
  }

  // 2) fallback: email
  if (normalizedEmail) {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) throw error;
    if (data?.role) return data.role as UserRole;
  }

  return "user";
}

export const authOptions: AuthOptions = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ user, account }) {
      // Email bywa null (zależy od providera i ustawień), więc traktujemy ostrożnie
      const email = user.email ?? null;
      const name = user.name ?? null;
      const image = user.image ?? null;

      if (!account) return false;
      if (typeof email !== "string") return false;

      const normalizedEmail = email.toLowerCase();
      const hasAllowedDomain = ALLOWED_DOMAINS.some((domain) =>
        normalizedEmail.endsWith(`@${domain}`),
      );

      if (!hasAllowedDomain) {
        console.warn(
          "Sign-in blocked for contact with system administrator:",
          normalizedEmail,
        );
        return false;
      }

      try {
        const provider = account.provider; // "github" | "google"
        const providerId = account.providerAccountId; // string id od providera

        // 1) Spróbuj znaleźć po (provider, provider_id)
        const { data: existingByProvider, error: findByProviderError } =
          await supabase
            .from("users")
            .select("id, role")
            .eq("provider", provider)
            .eq("provider_id", providerId)
            .maybeSingle();

        if (findByProviderError) {
          // jeśli masz logowanie serwerowe, warto zostawić log w konsoli
          console.error("Find user by provider failed:", findByProviderError);
          return false;
        }

        if (existingByProvider) {
          // Odśwież profil przy każdym logowaniu tego providera
          const { error: refreshError } = await supabase
            .from("users")
            .update({
              name,
              image,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingByProvider.id);

          if (refreshError) {
            console.error("Refresh user profile failed:", refreshError);
            return false;
          }

          return true;
        }

        // 2) (Opcjonalnie) fallback: jeśli jest email, sprawdź czy istnieje konto po email
        //    Przydatne gdy user zaloguje się innym providerem z tym samym emailem.
        let existingByEmail: { id: string; role: string } | null = null;

        const { data: byEmail, error: findByEmailError } = await supabase
          .from("users")
          .select("id, role")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (findByEmailError) {
          console.error("Find user by email failed:", findByEmailError);
          return false;
        }

        existingByEmail = byEmail;

        if (existingByEmail) {
          // podpinamy provider do istniejącego usera
          const { error: updateError } = await supabase
            .from("users")
            .update({
              provider,
              provider_id: providerId,
              name,
              image,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingByEmail.id);

          if (updateError) {
            console.error(
              "Attach provider to existing user failed:",
              updateError,
            );
            return false;
          }

          return true;
        }

        // 3) Jeśli nie znaleziono -> insert z domyślną rolą 'user'
        const { error: insertError } = await supabase.from("users").insert({
          email: normalizedEmail, // trzymaj email w spójnym formacie
          name,
          image,
          provider,
          provider_id: providerId,
          role: "user", // enum public.user_role
        });

        if (insertError) {
          console.error("Insert user failed:", insertError);
          return false;
        }
        return true;
      } catch (e) {
        console.error("signIn callback failed:", e);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Pierwsze logowanie: mamy account
      // Późniejsze requesty: account zwykle undefined, token już istnieje
      const provider = account?.provider;
      const providerId = account?.providerAccountId;

      // Zapisz identyfikatory w tokenie, żeby potem nie zgadywać
      if (provider) token.provider = provider;
      if (providerId) token.providerId = providerId;

      // Email może przyjść z user (pierwsze logowanie) albo z tokena
      const email = (user?.email ?? token.email ?? null) as string | null;

      // Jeśli role już jest w tokenie, nie musisz pytać DB co request
      if (!token.role) {
        const role = await getRoleFromDb({
          provider: (token.provider as string | undefined) ?? provider,
          providerId: (token.providerId as string | undefined) ?? providerId,
          email,
        });
        token.role = role;
      }

      return token;
    },

    async session({ session, token }) {
      // przerzuć role do session.user
      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.sub ?? undefined; // opcjonalnie
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
