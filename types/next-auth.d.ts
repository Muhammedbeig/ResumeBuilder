import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      subscription?: "free" | "pro" | "business";
      subscriptionPlanId?: string | null;
      hasPassword?: boolean;
      authProvider?: "credentials" | "google";
    };
  }

  interface User {
    subscription?: "free" | "pro" | "business";
    subscriptionPlanId?: string | null;
    hasPassword?: boolean;
    authProvider?: "credentials" | "google";
  }
}
