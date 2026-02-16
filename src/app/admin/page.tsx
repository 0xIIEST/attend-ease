"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { UserTable } from "@/components/admin/UserTable";
import { ScheduleEditor } from "@/components/admin/ScheduleEditor";

export default function AdminPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
            return;
        }

        if (user && user.email) {
            // Quick check
            api.admin.getStats(user.email)
                .then(data => {
                    setStats(data);
                    setAuthorized(true);
                })
                .catch(() => {
                    setAuthorized(false);
                });
        }
    }, [user, loading, router]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!authorized && !loading && user) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                <p>You are not authorized to view the admin panel.</p>
                <p className="text-sm text-muted-foreground">Your email: {user.email}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeSession || "N/A"}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule Editor</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="space-y-4">
                    {user?.email && <UserTable adminEmail={user.email} />}
                </TabsContent>
                <TabsContent value="schedule" className="space-y-4">
                    {user?.email && <ScheduleEditor adminEmail={user.email} />}
                </TabsContent>
            </Tabs>
        </div>
    );
}
