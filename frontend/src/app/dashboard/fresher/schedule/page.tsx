'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-service';
import { cn } from '@/lib/utils';

export default function SchedulePage() {
    const router = useRouter();
    const { user, token, isLoading: authLoading } = useAuth();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!user?.id || !token) return;

            try {
                // Fetch weekly schedule
                const response = await api.schedule.getWeek(user.id, token);
                if (response.data) {
                    setSchedule(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                console.error("Failed to fetch schedule:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchSchedule();
        }
    }, [user, token, authLoading]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in_progress': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Training Schedule</h1>
                        <p className="mt-1 text-sm text-gray-500">Your upcoming learning sessions and tasks</p>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {schedule.length === 0 ? (
                    <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
                        No schedule found for this week.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {schedule.map((day: any) => (
                            <div key={day.id} className="bg-white shadow rounded-lg overflow-hidden">
                                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {new Date(day.schedule_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h2>
                                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", getStatusColor(day.status))}>
                                        {day.status?.replace('_', ' ') || 'Pending'}
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-200">
                                    {(!day.items || day.items.length === 0) ? (
                                        <div className="p-8 text-center text-gray-500 text-sm">
                                            No sessions scheduled for this day.
                                        </div>
                                    ) : (
                                        day.items.map((item: any) => (
                                            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-indigo-50 rounded-lg">
                                                            <Calendar className="w-6 h-6 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    {item.duration_minutes} min
                                                                </span>
                                                                <span>•</span>
                                                                <span>{item.topic}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", getStatusColor(item.status))}>
                                                        {item.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
