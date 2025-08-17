// app/actions/rules.ts
'use server';

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/db";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export async function getUserRules() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME);
  const ruleSet = await db.collection('ruleSets').findOne({ userId: new ObjectId(session.user.id) });
  
  return ruleSet?.rules || []; // Return rules array or an empty array
}

export async function saveUserRules(rules: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME);
  
  // Basic validation/sanitization
  const sanitizedRules = rules.map(rule => rule.trim()).filter(Boolean);

  await db.collection('ruleSets').updateOne(
    { userId: new ObjectId(session.user.id) },
    { $set: { userId: new ObjectId(session.user.id), rules: sanitizedRules } },
    { upsert: true } // Creates the document if it doesn't exist
  );

  revalidatePath('/settings'); // Invalidate cache for the settings page to show updated data

  return { success: true, message: "Rules saved successfully." };
}