"use server";
import clientPromise from "@/lib/db";


export interface ReviewInput {
  repo: string;
  owner: string;
  body: string;
}

export async function pushReviewToDB(review: ReviewInput) {

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);
    const reviews = db.collection("reviews");

    const result = await reviews.insertOne(review);
    return { insertedId: result.insertedId.toString() };
  } catch (error) {
    console.error("Error inserting review into DB:", error);
    throw new Error("Failed to insert review into database.");
  }
}


