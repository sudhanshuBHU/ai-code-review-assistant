// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Define a type for our analytics data for type safety
interface AnalyticsData {
  severityDistribution: { name: string; value: number }[];
  recentIssues: {
    id: string;
    repo: string;
    file: string;
    description: string;
    severity: string;
    line: number;
    createdAt: string;
  }[];
  totalReviews: number;
}

const getSeverityVariant = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'default';
  }
};

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result: AnalyticsData = await response.json();
        console.log("in dashboard page from api/analytics: ",result);
        setData(result);
      } catch (err) {
        console.log("error in dashboard page from api/analytics: ",err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!data) return <p>No data available.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalReviews}</div>
            <p className="text-xs text-muted-foreground">Total pull requests analyzed</p>
          </CardContent>
        </Card>
        {/* Placeholder for a chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Issues by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {/* You would integrate a charting library like Recharts here */}
            <div className="flex justify-around items-end h-40 bg-gray-100 p-4 rounded-lg">
              {data.severityDistribution.map(item => (
                <div key={item.name} className="text-center">
                  <div className="font-bold">{item.value}</div>
                  <div>{item.name}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">Severity Distribution Chart</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentIssues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.repo}</TableCell>
                  <TableCell>{issue.file}:{issue.line}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityVariant(issue.severity)}>
                      {issue.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{issue.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}