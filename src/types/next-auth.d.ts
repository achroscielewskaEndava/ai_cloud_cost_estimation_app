import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "user" | "admin" | "superadmin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin" | "superadmin";
    provider?: string;
    providerId?: string;
  }
}
