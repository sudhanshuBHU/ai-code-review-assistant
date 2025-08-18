// app/(dashboard)/settings/page.tsx
'use client';

import { useEffect, useState, useTransition } from "react";
import { getUserRules, saveUserRules } from "@/app/actions/rules";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export default function SettingsPage() {
    const [rules, setRules] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition(); // For form submission state

    useEffect(() => {
        getUserRules().then(data => {
            setRules(data.join('\n'));
        }).catch(error => {
            console.error("Error fetching rules:", error);
            toast.error("Failed to fetch rules.");
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        startTransition(async () => {
            const rulesArray = rules.split('\n').filter(Boolean);
            const result = await saveUserRules(rulesArray);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error("Failed to save rules.");
            }
        });
    };

    if (isLoading) {
        return <CardHeader>
            <CardTitle>Loading settings...</CardTitle>
        </CardHeader>
    }

    return (
        <>
            <CardHeader>
                <CardTitle>Custom Rule Sets</CardTitle>
                <CardDescription>
                    Define your own coding standards. Enter one rule per line. These will be used by the AI during code analysis.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        value={rules}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRules(e.target.value)}
                        placeholder="e.g., All API functions must handle errors gracefully."
                        className="min-h-[200px]"
                        disabled={isPending}
                    />
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Rules"}
                    </Button>
                </form>
            </CardContent>
        </>
    );
}