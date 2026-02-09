import type { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { parseUserIdBigInt } from "@/lib/user-id";
import crypto from "crypto";

// Spatie stores the PHP class name as a single-backslash namespace string.
// In JS source we escape backslashes, so this results in: App\Models\User
const MODEL_TYPE_USER = "App\\Models\\User";

async function getRoleIdByName(roleName: string): Promise<bigint | null> {
  const rows = await prisma.$queryRaw<Array<{ id: bigint }>>`
    SELECT id FROM roles WHERE name = ${roleName} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function userHasRole(userId: bigint, roleName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ ok: number }>>`
    SELECT 1 as ok
    FROM model_has_roles m
    INNER JOIN roles r ON r.id = m.role_id
    WHERE m.model_id = ${userId}
      AND m.model_type = ${MODEL_TYPE_USER}
      AND r.name = ${roleName}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function ensureUserRole(userId: bigint, roleName: string): Promise<void> {
  const roleId = await getRoleIdByName(roleName);
  if (!roleId) return;
  await prisma.$executeRaw`
    INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id)
    VALUES (${roleId}, ${MODEL_TYPE_USER}, ${userId})
  `;
}

function normalizeAdapterUser(user: any) {
  if (!user) return null;
  return { ...user, id: user.id?.toString?.() ?? String(user.id) };
}

const panelPrismaAdapter = (): Adapter => {
  const base = PrismaAdapter(prisma) as Adapter;

  return {
    ...base,

    async createUser(data: Omit<AdapterUser, "id">) {
      // OAuth sign-in path. Panel requires non-null name/type/password/fcm_id.
      const email = (data.email ?? "").toLowerCase();
      const name = data.name ?? email.split("@")[0] ?? "user";
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      const created = await prisma.user.create({
        data: {
          name,
          email,
          emailVerified: data.emailVerified ?? null,
          image: data.image ?? null,
          type: "google",
          passwordHash,
          fcmId: "",
          notification: true,
        },
      });

      await ensureUserRole(created.id, "User");
      return normalizeAdapterUser(created) as any;
    },

    async getUser(id) {
      const userId = parseUserIdBigInt(String(id));
      if (!userId) return null;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return normalizeAdapterUser(user) as any;
    },

    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email } });
      return normalizeAdapterUser(user) as any;
    },

    async getUserByAccount(provider_providerAccountId) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId },
        include: { user: true },
      });
      return normalizeAdapterUser(account?.user ?? null) as any;
    },

    async updateUser({ id, ...data }: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      const userId = parseUserIdBigInt(String(id));
      if (!userId) {
        throw new Error("Invalid user id");
      }
      const updated = await prisma.user.update({
        where: { id: userId },
        data: data as any,
      });
      return normalizeAdapterUser(updated) as any;
    },

    async deleteUser(id: string) {
      const userId = parseUserIdBigInt(String(id));
      if (!userId) {
        throw new Error("Invalid user id");
      }
      await prisma.user.delete({ where: { id: userId } });
    },

    async linkAccount(data: AdapterAccount) {
      // Convert userId to BIGINT for the DB.
      const userId = parseUserIdBigInt(String((data as any).userId));
      if (!userId) {
        throw new Error("Invalid user id");
      }

      const created = await prisma.account.create({
        data: {
          ...(data as any),
          userId,
        },
      });

      // Keep Panel-compatible social identity on the shared users table.
      if (data.provider === "google") {
        await prisma.user.update({
          where: { id: userId },
          data: {
            type: "google",
            firebaseId: data.providerAccountId,
          },
        });
      }

      return created as any;
    },

    async createSession(data: AdapterSession) {
      const userId = parseUserIdBigInt(String((data as any).userId));
      if (!userId) {
        throw new Error("Invalid user id");
      }
      return prisma.session.create({
        data: {
          ...(data as any),
          userId,
        },
      }) as any;
    },

    async getSessionAndUser(sessionToken: string) {
      const userAndSession = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!userAndSession) return null;
      const { user, ...session } = userAndSession as any;
      return { user: normalizeAdapterUser(user), session } as any;
    },
  };
};

export const authOptions: NextAuthOptions = {
  adapter: panelPrismaAdapter(),
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

        if (!user || user.deletedAt) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Only allow website/customer users to sign into the website.
        if (!(await userHasRole(user.id, "User"))) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          subscription: "free",
          subscriptionPlanId: null,
          hasPassword: true,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }: any) {
      // For OAuth flows, `user.id` can be the provider id (e.g. Google `sub`), not the DB id.
      // Always resolve the DB user by email, then enforce role-gating.
      const email = typeof user?.email === "string" ? user.email.toLowerCase() : null;
      if (!email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, deletedAt: true },
      });
      // If this is a first-time OAuth sign-in, NextAuth may not have created the DB user yet.
      // Allow the sign-in and let our adapter create the user + assign the `User` role.
      if (!dbUser) return true;
      if (dbUser.deletedAt) return false;

      return userHasRole(dbUser.id, "User");
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        // Ensure token.id is the DB user id (BIGINT), not the OAuth provider subject id.
        let dbUserId = parseUserIdBigInt((user as any)?.id);
        if (!dbUserId) {
          const email = typeof (user as any)?.email === "string" ? (user as any).email.toLowerCase() : null;
          if (email) {
            const dbUser = await prisma.user.findUnique({
              where: { email },
              select: { id: true },
            });
            dbUserId = dbUser?.id ?? null;
          }
        }
        if (dbUserId) {
          token.id = dbUserId.toString();
        }
        if (typeof (user as any)?.email === "string") {
          token.email = (user as any).email.toLowerCase();
        }
        token.subscription = user.subscription ?? "free";
        token.subscriptionPlanId = user.subscriptionPlanId ?? null;
        token.hasPassword = user.hasPassword ?? true;
      }
      
      // Repair legacy tokens where id is missing, non-numeric, or not a real DB user id.
      const tokenEmail =
        typeof (token as any)?.email === "string" ? (token as any).email.toLowerCase() : null;
      const parsedTokenId = parseUserIdBigInt((token as any)?.id);
      if (parsedTokenId) {
        const existing = await prisma.user.findUnique({
          where: { id: parsedTokenId },
          select: { id: true, email: true },
        });
        if (!existing && tokenEmail) {
          const dbUser = await prisma.user.findUnique({
            where: { email: tokenEmail },
            select: { id: true },
          });
          if (dbUser?.id) {
            token.id = dbUser.id.toString();
          }
        } else if (existing && !tokenEmail && existing.email) {
          token.email = existing.email.toLowerCase();
        }
      } else if (tokenEmail) {
        const dbUser = await prisma.user.findUnique({
          where: { email: tokenEmail },
          select: { id: true },
        });
        if (dbUser?.id) {
          token.id = dbUser.id.toString();
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
        if (token.email) session.user.email = token.email;
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
