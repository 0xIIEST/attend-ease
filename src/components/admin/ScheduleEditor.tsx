"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Props {
    adminEmail: string;
}

export function ScheduleEditor({ adminEmail }: Props) {
    const [jsonContent, setJsonContent] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        api.schedule.get().then(data => {
            setJsonContent(JSON.stringify(data, null, 2));
        });
    }, []);

    const handleSave = async () => {
        try {
            const parsed = JSON.parse(jsonContent);
            await api.admin.updateSchedule(adminEmail, parsed);
            toast({ title: "Success", description: "Schedule updated successfully" });
        } catch (e) {
            toast({ title: "Error", description: "Invalid JSON or Server Error", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Raw JSON Editor</h3>
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
            <Textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="font-mono h-[600px]"
            />
        </div>
    );
}
