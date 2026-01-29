import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      subscription?: "free" | "pro" | "business";
      hasPassword?: boolean;
    };
  }

  interface User {
    subscription?: "free" | "pro" | "business";
  }
}
