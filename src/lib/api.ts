const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? "/api" : "http://127.0.0.1:8000");

export const api = {
    auth: {
        login: () => {
            window.location.href = `${API_URL}/auth/login`;
        },
        me: async (token: string) => {
            // In a real session-based auth, we might just call /auth/me with credentials: include
            // But here we are passing the token via query param (temporary migration step)
            // or we can use the token to init firebase client.
            // However, the goal is to MOVE AWAY from client SDK.
            // So, let's assume valid session or token.
            return fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => res.json());
        }
    },
    students: {
        getProfile: async (uid: string) => {
            const res = await fetch(`${API_URL}/students/profile/${uid}`);
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
        createProfile: async (uid: string, data: any) => {
            const res = await fetch(`${API_URL}/students/profile/${uid}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to create profile");
            return res.json();
        },
        getAttendance: async (uid: string) => {
            const res = await fetch(`${API_URL}/students/${uid}/attendance`);
            if (!res.ok) throw new Error("Failed to fetch attendance");
            return res.json();
        },
        markAttendance: async (uid: string, data: { subjectCode: string, status: string | null, classDate: string, timeStart?: string }) => {
            const res = await fetch(`${API_URL}/students/${uid}/attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Failed to mark attendance");
            return res.json();
        }
    },
    schedule: {
        get: async () => {
            const res = await fetch(`${API_URL}/schedule`);
            if (!res.ok) throw new Error("Failed to fetch schedule");
            return res.json();
        }
    },
    admin: {
        getUsers: async (adminEmail: string) => {
            const res = await fetch(`${API_URL}/admin/users?admin_email=${adminEmail}`);
            if (!res.ok) throw new Error("Failed to fetch users");
            return res.json();
        },
        getStats: async (adminEmail: string) => {
            const res = await fetch(`${API_URL}/admin/stats?admin_email=${adminEmail}`);
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        },
        updateSchedule: async (adminEmail: string, scheduleData: any) => {
            const res = await fetch(`${API_URL}/admin/schedule?admin_email=${adminEmail}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(scheduleData)
            });
            if (!res.ok) throw new Error("Failed to update schedule");
            return res.json();
        }
    }
};
