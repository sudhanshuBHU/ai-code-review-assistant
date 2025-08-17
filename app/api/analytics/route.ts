// app/api/analytics/route.ts

import clientPromise from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DATABASE_NAME);
    const reviewsCollection = db.collection('reviews');

    // Example Aggregation: Count issues by severity
    const severityDistribution = await reviewsCollection.aggregate([
      // In a multi-tenant app, you'd match by userId or repoId connected to the user
      // { $match: { userId: new ObjectId(session.user.id) } },
      {
        $group: {
          _id: "$severity", // Group by the severity field
          count: { $sum: 1 } // Count the documents in each group
        }
      },
      {
        $project: {
          name: "$_id", // Rename _id to name for charting libraries
          value: "$count",
          _id: 0
        }
      }
    ]).toArray();

     // Example Aggregation: Get the 5 most recent issues
    const recentIssues = await reviewsCollection.find(
      // Again, you would filter by the current user
    ).sort({ createdAt: -1 }).limit(5).toArray();


    const data = {
      severityDistribution,
      recentIssues: recentIssues.map(issue => ({ // Sanitize data for the client
        id: issue._id.toString(),
        repo: issue.repo,
        file: issue.filename,
        description: issue.description,
        severity: issue.severity,
        line: issue.line,
        createdAt: issue.createdAt,
      })),
      totalReviews: await reviewsCollection.countDocuments(),
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}