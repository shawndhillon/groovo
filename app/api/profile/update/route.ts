import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio } = body;

    const database = await db();
    const users = database.collection("users");

    // Find the current user first
    const currentUser = await users.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Construct an update object, preserving existing fields if empty
    const updateFields: Record<string, any> = {};

    if (typeof name === "string" && name.trim() !== "") {
      updateFields.name = name.trim();
    } else {
      updateFields.name = currentUser.name;
    }

    if (typeof bio === "string" && bio.trim() !== "") {
      updateFields.bio = bio.trim();
    } else {
      updateFields.bio = currentUser.bio || ""; // keep existing or default to empty string
    }

    await users.updateOne(
      { email: session.user.email },
      { $set: updateFields }
    );

    // Return updated user data (merged)
    const updatedUser = { ...currentUser, ...updateFields };
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}