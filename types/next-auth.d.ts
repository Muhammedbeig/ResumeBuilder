import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      subscription?: "free" | "pro" | "business";
    };
  }

  interface User {
    subscription?: "free" | "pro" | "business";
  }
}
