"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserProfile, getBranchName } from "@/lib/types";

interface Props {
    adminEmail: string;
}

export function UserTable({ adminEmail }: Props) {
    const [users, setUsers] = useState<UserProfile[]>([]);

    useEffect(() => {
        api.admin.getUsers(adminEmail).then(data => setUsers(data));
    }, [adminEmail]);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Group</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((u) => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.authEmail}</TableCell>
                            <TableCell>{getBranchName(u.branch)}</TableCell>
                            <TableCell>{u.year}</TableCell>
                            <TableCell>{u.rollNumber}</TableCell>
                            <TableCell>{u.group}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
