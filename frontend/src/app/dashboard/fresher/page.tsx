'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Calendar, CheckCircle2, Clock, BookOpen, Target, TrendingUp,
  Award, Play, ChevronRight, AlertTriangle, Zap, BarChart3, User, LogOut,
  Menu, X, FileText, Code2, GraduationCap, RefreshCw, CheckCheck, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api-service';
import { cn } from '@/lib/utils';
interface ScheduleItem { id: string; title: string; item_type: string; duration_minutes: number; status: string; topic: string; }
interface Assessment { id: string; title: string; assessment_type: string; fresher_id: string; status: string; max_score: number; passing_score: number; due_date: string | null; }
interface Achievement { id: string; title: string; icon: string; earned_at: string; }
interface Skill { id: string; name: string; category: string; level: number; trend: string; assessments_count: number; }

const getEmptyData = () => ({
  fresher: {
    id: '', user_id: '', employee_id: '', join_date: new Date().toISOString(),
    current_week: 1, overall_progress: 0, risk_level: 'low', risk_score: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  user: {
    id: '', email: '', first_name: 'Fresher', last_name: '',
    role: 'fresher', department: 'Engineering', is_active: true,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  progress: {
    overall: 0, current_week: 1, topics_completed: 0, topics_total: 0,
    assessments_passed: 0, assessments_total: 0, learning_hours_today: 0,
    learning_hours_week: 0, streak: 0
  },
  today_schedule: [] as ScheduleItem[],
  upcoming_assessments: [] as Assessment[],
  recent_achievements: [] as Achievement[],
  skills: [] as Skill[],
  workflow_status: {
    profile_updated: false, daily_quiz_completed: false, coding_challenge_submitted: false,
    assignment_submitted: false, certification_completed: false, last_updated: new Date().toISOString()
  },
  training_status: {
    quiz_status: 'pending', quiz_score: 0, quiz_id: '1', quiz_title: 'Python Basics Quiz',
    coding_challenge_status: 'pending', coding_score: 0, coding_id: '2', coding_title: 'FizzBuzz Coding Challenge',
    assignment_status: 'pending', assignment_score: 0, assignment_id: '5', assignment_title: 'Software Architecture Report',
    certification_status: 'pending', certification_name: 'AWS Cloud Practitioner'
  },
});

export default function FresherDashboardPage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentEvaluations, setAssessmentEvaluations] = useState<any[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [showSystemIntelligence, setShowSystemIntelligence] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Collapsible status

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(getEmptyData());
    setTrainingStatus(getEmptyData().training_status);
    if (!token || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const dashboardResult = await api.workflow.getFresherDashboard(token);

      if (dashboardResult.data) {
        setDashboardData(dashboardResult.data);
        setTrainingStatus(dashboardResult.data.training_status || getEmptyData().training_status);

        // Fetch AI assessment evaluations using fresher ID
        const fresherId = dashboardResult.data.fresher?.id;

        if (fresherId) {
          const evalResult = await api.fresher.getAssessmentEvaluations(fresherId, token);

          if (evalResult.data) {
            setAssessmentEvaluations(evalResult.data);
            setLastRefreshTime(new Date());
          } else if (evalResult.error) {
            console.error('Failed to load AI evaluations:', evalResult.error);
          }
        }
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      setDashboardData(getEmptyData());
    }
    finally { setIsLoading(false); }
  }, [token, user]);

  useEffect(() => { if (!authLoading) fetchDashboardData(); }, [authLoading, fetchDashboardData]);

  // Auto-refresh when window gains focus (user returns from assessment)
  useEffect(() => {
    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchDashboardData]);

  const data = dashboardData || getEmptyData();
  const fallbackData = getEmptyData();
  const training = trainingStatus || fallbackData.training_status;
  const safeUser = data.user || fallbackData.user;
  const safeProgress = data.progress || fallbackData.progress;

  // Filter to only show ATTEMPTED assessments (those with actual scores)
  const attemptedAssessments = assessmentEvaluations.filter(
    (e: any) => {
      // Check if score is a valid number (not null, undefined, or "N/A")
      const hasValidScore = e.score !== null &&
        e.score !== undefined &&
        e.score !== 'N/A' &&
        typeof e.score === 'number' &&
        !isNaN(e.score) &&
        e.score > 0; // Exclude 0 scores as requested

      // Check if status indicates completion
      const isCompleted = ['completed', 'graded', 'evaluated'].includes(e.status);

      return hasValidScore && isCompleted;
    }
  );
  const safeUpcomingAssessments = data.upcoming_assessments || [];
  const userName = user ? `${user.first_name} ${user.last_name}` : `${safeUser.first_name} ${safeUser.last_name}`;



  const assessmentIcons = {
    quiz: <Brain className="w-5 h-5 text-purple-600" />,
    code: <Code2 className="w-5 h-5 text-blue-600" />,
    assignment: <Target className="w-5 h-5 text-green-600" />
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'text-green-600 bg-green-50', in_progress: 'text-blue-600 bg-blue-50',
      submitted: 'text-purple-600 bg-purple-50', pending: 'text-gray-600 bg-gray-50', not_started: 'text-gray-600 bg-gray-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      reading: <BookOpen className="w-4 h-4" />, video: <Play className="w-4 h-4" />,
      coding: <Code2 className="w-4 h-4" />, assessment: <Award className="w-4 h-4" />, quiz: <Award className="w-4 h-4" />
    };
    return icons[type] || <BookOpen className="w-4 h-4" />;
  };

  const todayItems = (data?.today_schedule ?? []) as ScheduleItem[];
  const todoItems = todayItems.filter(item => item.status !== 'completed').slice(0, 4);
  const schedulePreview = todayItems.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">MaverickAI</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 w-72 bg-white border-r z-50 transform transition-transform lg:translate-x-0 shadow-xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center space-x-3 px-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">MaverickAI</span>
            <button className="lg:hidden ml-auto p-2 hover:bg-white/50 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {userName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{userName}</p>
                <p className="text-sm text-gray-500">{user?.department || safeUser.department}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            <Link href="/dashboard/fresher"
              className={cn("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all",
                pathname === '/dashboard/fresher' ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100")}>
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/dashboard/fresher/assessments"
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-100 hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-600 hover:text-white">
              <Award className="w-5 h-5" />
              <span className="font-medium">Assessments</span>
            </Link>
            <Link href="/dashboard/fresher/profile"
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-100">
              <User className="w-5 h-5" />
              <span className="font-medium">My Profile</span>
            </Link>
          </nav>

          <div className="p-4 border-t">
            <button onClick={() => { logout(); router.push('/login'); }}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome back, {user?.first_name || safeUser.first_name}! </h1>
            <p className="text-gray-600 mt-1">Track your learning progress and complete todays tasks</p>
          </div>

          {/* Training Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Daily Quiz */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(training.quiz_status))}>
                  {training.quiz_status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Daily Quiz</h3>
              <p className="text-sm text-gray-500 mb-3">{training.quiz_title || "State Management Quiz"}</p>
              {training.quiz_status === 'completed' && training.quiz_score !== null && (
                <div className="flex items-center mb-3">
                  <span className="text-2xl font-bold text-purple-600">{training.quiz_score}%</span>
                  <span className="text-sm text-gray-500 ml-2">Score</span>
                </div>
              )}
              {training.quiz_status !== 'completed' && (
                <Link
                  href={`/dashboard/fresher/assessments/${training.quiz_id || '1'}/quiz`}
                  className="mt-3 w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center transition-colors"
                >
                  Start Quiz
                </Link>
              )}
              {training.quiz_status === 'completed' && (
                <Link
                  href={`/dashboard/fresher/assessments/${training.quiz_id || '1'}/results`}
                  className="mt-3 w-full py-2 px-4 border border-purple-600 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 flex items-center justify-center transition-colors"
                >
                  View Results
                </Link>
              )}
            </div>

            {/* Coding Challenge */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Code2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(training.coding_challenge_status))}>
                  {training.coding_challenge_status === 'completed' ? 'Completed' : training.coding_challenge_status === 'in_progress' ? 'In Progress' : 'Not Started'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Coding Challenge</h3>
              <p className="text-sm text-gray-500 mb-3">{training.coding_title || "Build a Custom Hook"}</p>
              {training.coding_challenge_status === 'completed' && training.coding_score !== null && (
                <div className="flex items-center mb-3">
                  <span className="text-2xl font-bold text-blue-600">{training.coding_score}%</span>
                  <span className="text-sm text-gray-500 ml-2">Score</span>
                </div>
              )}
              {training.coding_challenge_status !== 'completed' && (
                <Link
                  href={`/dashboard/fresher/assessments/${training.coding_id || '2'}/code`}
                  className="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center transition-colors"
                >
                  {training.coding_challenge_status === 'in_progress' ? 'Continue' : 'Start Challenge'}
                </Link>
              )}
              {training.coding_challenge_status === 'completed' && (
                <Link
                  href={`/dashboard/fresher/assessments/${training.coding_id || '2'}/results`}
                  className="mt-3 w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 flex items-center justify-center transition-colors"
                >
                  View Results
                </Link>
              )}
            </div>

            {/* Assignment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(training.assignment_status))}>
                  {training.assignment_status === 'submitted' || training.assignment_status === 'completed' ? 'Submitted' : 'Pending'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Assignment</h3>
              <p className="text-sm text-gray-500 mb-3">{training.assignment_title || "Todo App Project"}</p>
              {training.assignment_status !== 'submitted' && training.assignment_status !== 'completed' ? (
                <>
                  <p className="text-xs text-gray-400 mb-3">Due: Tomorrow, 5:00 PM</p>
                  <Link
                    href={`/dashboard/fresher/assessments/${training.assignment_id || '5'}/assignment`}
                    className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center transition-colors"
                  >
                    Submit Assignment
                  </Link>
                </>
              ) : (
                <Link
                  href={`/dashboard/fresher/assessments/${training.assignment_id || '5'}/results`}
                  className="mt-3 w-full py-2 px-4 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center justify-center transition-colors"
                >
                  View Review
                </Link>
              )}
            </div>

            {/* Certification */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-amber-600" />
                </div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(training.certification_status))}>
                  {training.certification_status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Certification</h3>
              <p className="text-sm text-gray-500 mb-3">{training.certification_name || 'AWS Cloud Practitioner'}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
              <p className="text-xs text-gray-500">45% Complete</p>
            </div>
          </div>

        </div>

        {/* Work Summary + Todo + Schedule Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Work Summary</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">{safeProgress.overall}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full" style={{ width: `${safeProgress.overall}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">{safeProgress.topics_completed}</p>
                  <p className="text-xs text-gray-500">Topics Done</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{safeProgress.assessments_passed}</p>
                  <p className="text-xs text-gray-500">Assessments</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{safeProgress.learning_hours_today}h</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{safeProgress.streak}</p>
                  <p className="text-xs text-gray-500">Day Streak</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Today To-Do</h2>
            </div>
            {todoItems.length === 0 ? (
              <div className="text-sm text-gray-500">All caught up for today.</div>
            ) : (
              <div className="space-y-3">
                {todoItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border">
                        {getTypeIcon(item.item_type)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.duration_minutes} min</p>
                      </div>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", getStatusColor(item.status))}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Schedule Preview</h2>
              </div>
              <Link href="/dashboard/fresher/schedule" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </Link>
            </div>
            {schedulePreview.length === 0 ? (
              <div className="text-sm text-gray-500">No schedule items yet.</div>
            ) : (
              <div className="space-y-3">
                {schedulePreview.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.topic} • {item.duration_minutes} min</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", getStatusColor(item.status))}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assessment History Log */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-8">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full px-6 py-4 border-b flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Assessment History</h2>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                {attemptedAssessments.length} Attempted
              </span>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", isHistoryOpen ? "rotate-180" : "")} />
          </button>

          {isHistoryOpen && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <tr>
                    <th className="px-6 py-3">Assessment</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3 text-center">Score</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attemptedAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        No assessments attempted yet.
                      </td>
                    </tr>
                  ) : (
                    attemptedAssessments.map((assessment: any) => (
                      <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg",
                            assessment.assessment_type === 'quiz' ? 'bg-purple-100 text-purple-600' :
                              assessment.assessment_type === 'code' ? 'bg-blue-100 text-blue-600' :
                                'bg-green-100 text-green-600'
                          )}>
                            {assessment.assessment_type === 'quiz' && <FileText className="w-4 h-4" />}
                            {assessment.assessment_type === 'code' && <Code2 className="w-4 h-4" />}
                            {assessment.assessment_type === 'assignment' && <Target className="w-4 h-4" />}
                          </div>
                          <div>
                            <p>{assessment.assessment_title}</p>
                            <p className="text-xs text-gray-400 capitalize">{assessment.assessment_type}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {assessment.time_ago}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full",
                                  assessment.score >= 80 ? 'bg-green-500' :
                                    assessment.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                )}
                                style={{ width: `${assessment.score}%` }}
                              />
                            </div>
                            <span className="font-semibold">{Math.round(assessment.score)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn("inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                            assessment.pass_status === 'pass'
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          )}>
                            {assessment.pass_status === 'pass' ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Hexaware Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 py-4 border-t">
          <p>© 2023 Hexaware Technologies Limited. All rights reserved <a href="https://www.hexaware.com" className="hover:text-purple-600 font-medium">www.Hexaware.com</a></p>
          <p className="mt-1">Training Dashboard for Mavericks Onboarding</p>
        </div>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}
