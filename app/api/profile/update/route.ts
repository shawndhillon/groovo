/**
 * Purpose:
 *   API route for updating the current authenticated user's profile fields
 *
 * Scope:
 *   Used by profile edit forms and settings pages
 *   Endpoint: PUT /api/profile/update
 *
 * Role:
 *   Updates user's name and bio fields in the database
 *   Preserves existing values if new values are empty or invalid
 *   Returns updated user data after successful update
 *
 * Deps:
 *   next-auth for session management (getServerSession, authOptions)
 *   lib/mongodb for database connection
 *   MongoDB collection: users
 *
 * Notes:
 *   Requires authentication (returns 401 if no session)
 *   Only updates name and bio fields (other fields not modifiable via this endpoint)
 *   Trims whitespace from input values before saving
 *   Returns 404 if user not found in database
 *   Preserves existing field values if update value is empty string
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/mongodb";

/**
 * Updates the current authenticated user's profile (name and bio)
 *
 * @param {Request} req - Request object containing JSON body with name and/or bio
 * @returns {Promise<NextResponse>} JSON response with success flag and updated user data
 * @throws {401} If user is not authenticated
 * @throws {404} If user not found in database
 * @throws {500} If server error occurs
 */
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