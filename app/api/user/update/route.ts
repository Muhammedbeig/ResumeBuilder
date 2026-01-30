import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().optional(), // Base64 or URL
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, image, currentPassword, newPassword } = result.data;
    const userEmail = session.user.email;

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    // Handle Name Update
    if (name) {
      updateData.name = name;
    }

    // Handle Image Update
    if (image) {
      updateData.image = image;
    }

    // Handle Password Update
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }

      // If user has a password, verify it
      if (user.passwordHash) {
        const isValid = await verifyPassword(currentPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { error: "Incorrect current password" },
            { status: 400 }
          );
        }
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    // Perform Update
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        // Don't return passwordHash
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
