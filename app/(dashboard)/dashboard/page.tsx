// app/(dashboard)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
import SettingsPage from '@/components/updateRules';


interface Irepos{
  repo:string;
  owner:string;
  body:string;
}
// Define a type for our analytics data for type safety
interface AnalyticsData {
  repos: Irepos[];
  totalReviews: number;
}

// const getSeverityVariant = (severity: string) => {
//   switch (severity.toLowerCase()) {
//     case 'high': return 'destructive';
//     case 'medium': return 'secondary';
//     case 'low': return 'outline';
//     default: return 'default';
//   }
// };

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
        console.log("in dashboard page from api/analytics: ", result);
        setData(result);
      } catch (err) {
        console.log("error in dashboard page from api/analytics: ", err);
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

        {/* Component for updating rules */}
        <Card className='lg:col-span-2'>
          <SettingsPage />
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
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.repos.map((issue, id) => (
                <div key={id}>
                  <TableRow>
                    <TableCell className="font-medium">{issue.repo}</TableCell>
                    <TableCell>{issue.owner}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className="whitespace-pre-line">
                      {issue.body}
                    </TableCell>
                  </TableRow>
                </div>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}