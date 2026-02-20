'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft, BookOpen, Clock, ChevronRight, Play,
    CheckCircle2, AlertCircle, FileText, Code2,
    ExternalLink, MessageSquare, Download, Share2, Target
} from 'lucide-react';
import { api } from '@/lib/api-service';
import { cn } from '@/lib/utils';

export default function LearningPage() {
    const params = useParams();
    const router = useRouter();
    const itemId = params.id as string;

    const [item, setItem] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            const token = localStorage.getItem('maverick_token');
            if (!token) {
                router.push('/login');
                return;
            }

            setIsLoading(true);
            const result = await api.schedule.getItem(itemId, token);
            if (result.error) {
                setError(result.error);
            } else {
                setItem(result.data);
            }
            setIsLoading(false);
        };

        if (itemId) fetchItem();
    }, [itemId, router]);

    const handleComplete = async () => {
        const token = localStorage.getItem('maverick_token');
        if (!token) return;

        setIsCompleting(true);
        // In a real app, this would update the item status in the DB
        await api.schedule.completeItem(itemId, token);

        // Simulate updating UI
        setItem({ ...item, status: 'completed' });
        setIsCompleting(false);

        // Show success state then go back
        setTimeout(() => {
            router.push('/dashboard/fresher');
        }, 1500);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your learning material...</p>
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-red-500">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
                    <p className="text-gray-600 mb-8">{error || 'Learning item not found.'}</p>
                    <button
                        onClick={() => router.push('/dashboard/fresher')}
                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isCompleted = item.status === 'completed';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-30 px-4 lg:px-8 py-4 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="h-6 w-px bg-gray-200" />
                        <div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{item.item_type}</span>
                                {isCompleted && (
                                    <span className="flex items-center text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">
                                        <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                                    </span>
                                )}
                            </div>
                            <h1 className="font-bold text-gray-900 truncate max-w-[200px] md:max-w-md">{item.title}</h1>
                        </div>
                    </div>

                    <button
                        onClick={handleComplete}
                        disabled={isCompleted || isCompleting}
                        className={cn(
                            "flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95",
                            isCompleted
                                ? "bg-green-100 text-green-700 cursor-default"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90"
                        )}
                    >
                        {isCompleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Completing...</span>
                            </>
                        ) : isCompleted ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Done!</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Mark as Complete</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Content Layout */}
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12 flex flex-col lg:flex-row gap-8">
                {/* Left Side: Main Content Area */}
                <div className="flex-1 space-y-8">
                    {/* Content Card */}
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 transition-all hover:shadow-2xl">
                        {/* Type Specific Visual */}
                        {item.item_type === 'video' && item.external_url ? (
                            <div className="aspect-video bg-black relative group">
                                <iframe
                                    src={item.external_url}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={item.title}
                                />
                            </div>
                        ) : item.item_type === 'reading' ? (
                            <div className="h-48 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border-b border-purple-100">
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-purple-600">
                                    <BookOpen className="w-10 h-10" />
                                </div>
                            </div>
                        ) : (
                            <div className="h-48 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center border-b border-blue-100">
                                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600">
                                    <FileText className="w-10 h-10" />
                                </div>
                            </div>
                        )}

                        {/* Title & Description Area */}
                        <div className="p-8 lg:p-12">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="flex items-center text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    <Clock className="w-4 h-4 mr-2" />
                                    {item.duration_minutes} Minutes
                                </div>
                                <div className="flex items-center text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full capitalize">
                                    {item.topic}
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-gray-900 mb-6 leading-tight">
                                {item.title}
                            </h2>

                            <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed text-lg">
                                <p className="mb-6">{item.description}</p>
                                {item.content && (
                                    <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-200 whitespace-pre-wrap font-sans text-gray-800">
                                        {item.content}
                                    </div>
                                )}
                            </div>

                            {item.external_url && item.item_type !== 'video' && (
                                <div className="mt-10">
                                    <a
                                        href={item.external_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg hover:-translate-y-1"
                                    >
                                        <span>Open External Resource</span>
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Actions Bar */}
                        <div className="bg-gray-50 border-t p-6 flex items-center justify-between">
                            <div className="flex space-x-2">
                                <button className="p-2.5 hover:bg-white rounded-xl shadow-sm transition-all" title="Add Note">
                                    <MessageSquare className="w-5 h-5 text-gray-600" />
                                </button>
                                <button className="p-2.5 hover:bg-white rounded-xl shadow-sm transition-all" title="Download Material">
                                    <Download className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <button className="p-2.5 hover:bg-white rounded-xl shadow-sm transition-all" title="Share">
                                <Share2 className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Discussion / Notes Placeholder */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-3 text-purple-600" />
                            Discussion Panel
                        </h3>
                        <div className="flex space-x-4 items-start">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                                Y
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-2xl p-1 border border-gray-200">
                                <textarea
                                    placeholder="Ask a question or share your thoughts..."
                                    className="w-full bg-transparent border-none focus:ring-0 p-4 min-h-[100px] text-gray-800 placeholder:text-gray-400"
                                />
                                <div className="p-2 flex justify-end">
                                    <button className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-sm">
                                        Post Comment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Sidebar Info */}
                <aside className="w-full lg:w-80 space-y-6">
                    {/* Progress Card */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Your Progress</h3>
                            <p className="text-purple-100 text-sm mb-6">You're doing great! Keep it up to stay on track.</p>

                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-80">
                                    <span>Completion</span>
                                    <span>{isCompleted ? '100%' : '75%'}</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2.5">
                                    <div
                                        className="bg-white h-2.5 rounded-full transition-all duration-1000"
                                        style={{ width: isCompleted ? '100%' : '75%' }}
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50" />
                    </div>

                    {/* Task Summary Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-6">Task Summary</h3>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Time</p>
                                    <p className="font-bold text-gray-900">{item.duration_minutes} Minutes</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Topic Category</p>
                                    <p className="font-bold text-gray-900 capitalize">{item.topic}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                                    <p className={cn("font-bold capitalize", isCompleted ? "text-green-600" : "text-amber-600")}>
                                        {item.status.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Assessments */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Preparation For</h3>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <div className="flex items-center space-x-3 mb-2">
                                <Code2 className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700">Python Skills Assessment</span>
                            </div>
                            <p className="text-xs text-gray-500">Coming up in Week 3</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
