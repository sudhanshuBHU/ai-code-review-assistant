// app/actions/rules.ts
'use server';

import clientPromise from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export async function getUserRules() {
  const userId = process.env.USER_ID_DEFAULT;

  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME);
  let ruleSet;
  try {
    ruleSet = await db.collection('ruleSets').findOne({ userId: new ObjectId(userId) });
  } catch (error) {
    console.error("Error fetching user rules:", error);
    throw new Error("Failed to fetch user rules.");
  }

  return ruleSet?.rules || []; // Return rules array or an empty array
}

export async function saveUserRules(rules: string[]) {

  const userId = process.env.USER_ID_DEFAULT;

  const client = await clientPromise;
  const db = client.db(process.env.DATABASE_NAME);

  // Basic validation/sanitization
  const sanitizedRules = rules.map(rule => rule.trim()).filter(Boolean);


  try {
    await db.collection('ruleSets').updateOne(
      { userId: new ObjectId(userId) },
      { $set: { userId: new ObjectId(userId), rules: sanitizedRules } },
      { upsert: true } // Creates the document if it doesn't exist
    );

  } catch (error) {
    console.log("error at update rules", error);
    return { success: false, message: "Failed to save rules.", error: error instanceof Error ? error.message : String(error) };
  }

  revalidatePath('/settings'); // Invalidate cache for the settings page to show updated data

  return { success: true, message: "Rules saved successfully." };
}