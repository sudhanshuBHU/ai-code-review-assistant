// app/api/analytics/route.ts

import clientPromise from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);
    const reviewsCollection = db.collection('reviews');

     // Example Aggregation: Get the 5 most recent issues
    const recentIssues = await reviewsCollection.find(
      // Again, you would filter by the current user
    ).sort({ createdAt: -1 }).limit(5).toArray();


    const data = {
      totalReviews: await reviewsCollection.countDocuments(),
      repos: recentIssues
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}