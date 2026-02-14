import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getPasswordPolicyError, normalizeName } from "@/lib/auth-validation";
import { panelInternalPatch, PanelInternalApiError } from "@/lib/panel-internal-api";
import { getSessionUserId } from "@/lib/session-user";

const updateSchema = z.object({
  name: z
    .string()
    .transform((value) => normalizeName(value))
    .pipe(z.string().min(2).max(80))
    .optional(),
  image: z.string().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().optional(),
}).superRefine((payload, ctx) => {
  if (!payload.newPassword) return;
  if (!payload.currentPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currentPassword"],
      message: "Current password is required to set a new password.",
    });
  }

  const passwordError = getPasswordPolicyError(payload.newPassword);
  if (passwordError) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["newPassword"],
      message: passwordError,
    });
  }
});

type UpdatePayload = z.infer<typeof updateSchema>;

type InternalUpdateResponse = {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid input", details: result.error.flatten() }, { status: 400 });
    }

    const data = await panelInternalPatch<InternalUpdateResponse>("user/profile", {
      userId,
      body: result.data as UpdatePayload,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof PanelInternalApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
