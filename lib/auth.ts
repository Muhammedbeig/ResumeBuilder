import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          subscription: (user.subscription as "free" | "pro" | "business") ?? "free",
          subscriptionPlanId: user.subscriptionPlanId ?? null,
          hasPassword: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.subscription = user.subscription;
        token.subscriptionPlanId = user.subscriptionPlanId ?? null;
        // Check if user has password (for OAuth users who haven't set one yet)
        if (user.hasPassword !== undefined) {
          token.hasPassword = user.hasPassword;
        } else {
          // For initial OAuth login, we need to check the DB or assume false
          // But 'user' here comes from the adapter on first sign in
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          token.hasPassword = !!dbUser?.passwordHash;
        }
      }
      
      // Handle session update (e.g. name change)
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.subscription) token.subscription = session.subscription;
        if (session.subscriptionPlanId) token.subscriptionPlanId = session.subscriptionPlanId;
        if (session.user?.subscription) token.subscription = session.user.subscription;
      }
      
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.subscription = token.subscription ?? "free";
        session.user.subscriptionPlanId = token.subscriptionPlanId ?? null;
        session.user.hasPassword = token.hasPassword;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
