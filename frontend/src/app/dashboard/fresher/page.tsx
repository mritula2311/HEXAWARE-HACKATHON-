'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Brain, Calendar, CheckCircle2, Clock, BookOpen, Target, TrendingUp,
  Award, Play, ChevronRight, AlertTriangle, Zap, BarChart3, User, LogOut,
  Menu, X, FileText, GraduationCap, RefreshCw, CheckCheck, ChevronDown,
  Plus, Pencil, Trash2, Save, Database
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api-service';
import { cn } from '@/lib/utils';

interface ScheduleItem { id: string; title: string; item_type: string; duration_minutes: number; status: string; topic: string; }
interface Assessment { id: string; title: string; assessment_type: string; fresher_id: string; status: string; max_score: number; passing_score: number; due_date: string | null; }
interface Achievement { id: string; title: string; icon: string; earned_at: string; }
interface BadgeItem { id: string; name: string; description: string; skill_name: string; color: string; icon_url: string; score_achieved: number; earned_at: string; }
interface Skill { id: string; name: string; category: string; level: number; trend: string; assessments_count: number; }
interface TodoItem { id: string; title: string; item_type: string; duration_minutes: number; status: string; }
interface ScheduleEditItem { id: string; title: string; topic: string; duration_minutes: number; status: string; item_type: string; }

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
  badges: [] as BadgeItem[],
  skills: [] as Skill[],
  workflow_status: {
    profile_updated: false, daily_quiz_completed: false,
    assignment_submitted: false, certification_completed: false, last_updated: new Date().toISOString()
  },
  training_status: {
    quiz_status: 'pending', quiz_score: 0, quiz_id: '1', quiz_title: 'SQL Basics Quiz',
    assignment_status: 'pending', assignment_score: 0, assignment_id: '5', assignment_title: 'Software Architecture Report',
    certification_status: 'pending', certification_name: 'AWS Cloud Practitioner', certification_progress: 45,
  },
});

/* ─── SQL Quiz Widget shown directly on dashboard ─── */
function SQLQuizWidget() {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = [
    { q: 'Which SQL statement is used to retrieve data from a database?', options: ['GET', 'SELECT', 'FETCH', 'RETRIEVE'], answer: 'SELECT' },
    { q: 'Which SQL clause is used to filter records based on a condition?', options: ['WHERE', 'FILTER', 'HAVING', 'LIMIT'], answer: 'WHERE' },
    { q: 'Which JOIN returns rows only when there is a match in both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'], answer: 'INNER JOIN' },
    { q: 'What does the GROUP BY clause do in SQL?', options: ['Sorts data ascending', 'Groups rows sharing same column values', 'Joins two tables', 'Limits returned rows'], answer: 'Groups rows sharing same column values' },
    { q: 'Which aggregate function returns the number of rows?', options: ['SUM()', 'COUNT()', 'AVG()', 'MAX()'], answer: 'COUNT()' },
  ];

  const score = Object.entries(selected).filter(([i, a]) => questions[Number(i)].answer === a).length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900">SQL Quick Quiz</h2>
        {submitted && (
          <span className="ml-auto text-sm font-bold text-indigo-600">{score}/{questions.length}</span>
        )}
      </div>

      {!submitted ? (
        <>
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Question {currentQ + 1} of {questions.length}</p>
            <p className="text-sm font-medium text-gray-900">{questions[currentQ].q}</p>
          </div>
          <div className="space-y-2 mb-4">
            {questions[currentQ].options.map((opt) => (
              <button key={opt} onClick={() => setSelected({ ...selected, [currentQ]: opt })}
                className={cn("w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors",
                  selected[currentQ] === opt ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-medium' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')}>
                {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button disabled={currentQ === 0} onClick={() => setCurrentQ(currentQ - 1)}
              className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200">Prev</button>
            {currentQ < questions.length - 1 ? (
              <button onClick={() => setCurrentQ(currentQ + 1)} disabled={selected[currentQ] === undefined}
                className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg disabled:opacity-40 hover:bg-indigo-700">Next</button>
            ) : (
              <button onClick={() => setSubmitted(true)} disabled={Object.keys(selected).length < questions.length}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg disabled:opacity-40 hover:bg-green-700">Submit</button>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div key={i} className={cn("p-2 rounded-lg text-xs", selected[i] === q.answer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
              <p className="font-medium">{q.q}</p>
              <p>Your answer: {selected[i]} {selected[i] === q.answer ? '✓' : `✗ (Correct: ${q.answer})`}</p>
            </div>
          ))}
          <button onClick={() => { setSubmitted(false); setSelected({}); setCurrentQ(0); }}
            className="mt-2 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry Quiz</button>
        </div>
      )}
    </div>
  );
}

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  /* ─── Editable Certification State ─── */
  const [certEditing, setCertEditing] = useState(false);
  const [certName, setCertName] = useState('AWS Cloud Practitioner');
  const [certProgress, setCertProgress] = useState(45);
  const [certStatus, setCertStatus] = useState('pending');

  /* ─── Editable Todo State ─── */
  const [editableTodos, setEditableTodos] = useState<TodoItem[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDuration, setNewTodoDuration] = useState(30);
  const [showAddTodo, setShowAddTodo] = useState(false);

  /* ─── Editable Schedule State ─── */
  const [editableSchedule, setEditableSchedule] = useState<ScheduleEditItem[]>([]);
  const [newSchedTitle, setNewSchedTitle] = useState('');
  const [newSchedTopic, setNewSchedTopic] = useState('');
  const [newSchedDuration, setNewSchedDuration] = useState(30);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editSchedTitle, setEditSchedTitle] = useState('');
  const [editSchedTopic, setEditSchedTopic] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(getEmptyData());
    setTrainingStatus(getEmptyData().training_status);
    if (!token || !user) { setIsLoading(false); return; }

    setIsLoading(true);
    try {
      const dashboardResult = await api.workflow.getFresherDashboard(token);
      if (dashboardResult.data) {
        setDashboardData(dashboardResult.data);
        setTrainingStatus(dashboardResult.data.training_status || getEmptyData().training_status);
        const schedule = (dashboardResult.data.today_schedule || []) as ScheduleItem[];
        setEditableTodos(schedule.filter((i: ScheduleItem) => i.status !== 'completed').slice(0, 4).map((i: ScheduleItem) => ({
          id: i.id, title: i.title, item_type: i.item_type, duration_minutes: i.duration_minutes, status: i.status,
        })));
        setEditableSchedule(schedule.slice(0, 5).map((i: ScheduleItem) => ({
          id: i.id, title: i.title, topic: i.topic, duration_minutes: i.duration_minutes, status: i.status, item_type: i.item_type,
        })));

        const ts = dashboardResult.data.training_status;
        if (ts) {
          setCertName(ts.certification_name || 'AWS Cloud Practitioner');
          setCertStatus(ts.certification_status || 'pending');
          setCertProgress(ts.certification_progress || 45);
        }

        const fresherId = dashboardResult.data.fresher?.id;
        if (fresherId) {
          const evalResult = await api.fresher.getAssessmentEvaluations(fresherId, token);
          if (evalResult.data) { setAssessmentEvaluations(evalResult.data); setLastRefreshTime(new Date()); }
        }
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      setDashboardData(getEmptyData());
    } finally { setIsLoading(false); }
  }, [token, user]);

  useEffect(() => { if (!authLoading) fetchDashboardData(); }, [authLoading, fetchDashboardData]);
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

  const attemptedAssessments = assessmentEvaluations.filter((e: any) => {
    const hasValidScore = e.score !== null && e.score !== undefined && e.score !== 'N/A' && typeof e.score === 'number' && !isNaN(e.score) && e.score > 0;
    const isCompleted = ['completed', 'graded', 'evaluated'].includes(e.status);
    return hasValidScore && isCompleted;
  });

  const userName = user ? `${user.first_name} ${user.last_name}` : `${safeUser.first_name} ${safeUser.last_name}`;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'text-green-600 bg-green-50', in_progress: 'text-blue-600 bg-blue-50',
      submitted: 'text-purple-600 bg-purple-50', pending: 'text-gray-600 bg-gray-50', not_started: 'text-gray-600 bg-gray-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      reading: <BookOpen className="w-4 h-4" />, video: <Play className="w-4 h-4" />,
      assessment: <Award className="w-4 h-4" />, quiz: <Award className="w-4 h-4" />,
    };
    return icons[type] || <BookOpen className="w-4 h-4" />;
  };

  /* ─── Todo Helpers ─── */
  const addTodo = () => {
    if (!newTodoTitle.trim()) return;
    setEditableTodos([...editableTodos, { id: `todo-${Date.now()}`, title: newTodoTitle, item_type: 'reading', duration_minutes: newTodoDuration, status: 'pending' }]);
    setNewTodoTitle(''); setNewTodoDuration(30); setShowAddTodo(false);
  };
  const removeTodo = (id: string) => setEditableTodos(editableTodos.filter(t => t.id !== id));
  const toggleTodoStatus = (id: string) => {
    setEditableTodos(editableTodos.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
  };

  /* ─── Schedule Helpers ─── */
  const addScheduleItem = () => {
    if (!newSchedTitle.trim()) return;
    setEditableSchedule([...editableSchedule, { id: `sched-${Date.now()}`, title: newSchedTitle, topic: newSchedTopic || 'General', duration_minutes: newSchedDuration, status: 'pending', item_type: 'reading' }]);
    setNewSchedTitle(''); setNewSchedTopic(''); setNewSchedDuration(30); setShowAddSchedule(false);
  };
  const removeScheduleItem = (id: string) => setEditableSchedule(editableSchedule.filter(s => s.id !== id));
  const startEditSchedule = (item: ScheduleEditItem) => { setEditingScheduleId(item.id); setEditSchedTitle(item.title); setEditSchedTopic(item.topic); };
  const saveEditSchedule = () => {
    setEditableSchedule(editableSchedule.map(s => s.id === editingScheduleId ? { ...s, title: editSchedTitle, topic: editSchedTopic } : s));
    setEditingScheduleId(null);
  };

  return (
    <div className="dashboard-shell">
      <div className="blob-amber" aria-hidden />
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4 shadow-sm">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg"><Menu className="w-6 h-6 text-gray-700" /></button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">MaverickAI</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 w-72 bg-white border-r z-50 transform transition-transform lg:translate-x-0 shadow-xl", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center space-x-3 px-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg"><Brain className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">MaverickAI</span>
            <button className="lg:hidden ml-auto p-2 hover:bg-white/50 rounded-lg" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">{userName.charAt(0)}</div>
              <div>
                <p className="font-semibold text-gray-900">{userName}</p>
                <p className="text-sm text-gray-500">{user?.department || safeUser.department}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-6 space-y-2">
            <Link href="/dashboard/fresher" className={cn("w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all", pathname === '/dashboard/fresher' ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg" : "text-gray-600 hover:bg-gray-100")}>
              <BarChart3 className="w-5 h-5" /><span className="font-medium">Dashboard</span>
            </Link>
            <Link href="/dashboard/fresher/assessments" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-100 hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-600 hover:text-white">
              <Award className="w-5 h-5" /><span className="font-medium">Assessments</span>
            </Link>
            <Link href="/dashboard/fresher/profile" className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all text-gray-600 hover:bg-gray-100">
              <User className="w-5 h-5" /><span className="font-medium">My Profile</span>
            </Link>
          </nav>

          <div className="p-4 border-t">
            <button onClick={() => { logout(); router.push('/login'); }} className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
              <LogOut className="w-5 h-5" /><span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen relative">
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome back, {user?.first_name || safeUser.first_name}!</h1>
            <p className="text-gray-600 mt-1">Track your learning progress and complete today&apos;s tasks</p>
          </div>

          {/* Training Status Cards — Coding card REMOVED */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Daily Quiz */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><FileText className="w-6 h-6 text-purple-600" /></div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(training.quiz_status))}>{training.quiz_status === 'completed' ? 'Completed' : 'Pending'}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Daily Quiz</h3>
              <p className="text-sm text-gray-500 mb-3">{training.quiz_title || 'SQL Basics Quiz'}</p>
              {training.quiz_status === 'completed' && training.quiz_score !== null && (
                <div className="flex items-center mb-3"><span className="text-2xl font-bold text-purple-600">{training.quiz_score}%</span><span className="text-sm text-gray-500 ml-2">Score</span></div>
              )}
              {training.quiz_status !== 'completed' ? (
                <Link href={`/dashboard/fresher/assessments/${training.quiz_id || '1'}/quiz`} className="mt-3 w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center justify-center transition-colors">Start Quiz</Link>
              ) : (
                <Link href={`/dashboard/fresher/assessments/${training.quiz_id || '1'}/results`} className="mt-3 w-full py-2 px-4 border border-purple-600 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-50 flex items-center justify-center transition-colors">View Results</Link>
              )}
            </div>

            {/* Assignment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center"><Target className="w-6 h-6 text-green-600" /></div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(training.assignment_status))}>
                  {training.assignment_status === 'submitted' || training.assignment_status === 'completed' ? 'Submitted' : 'Pending'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Assignment</h3>
              <p className="text-sm text-gray-500 mb-3">{training.assignment_title || 'Software Architecture Report'}</p>
              {training.assignment_status !== 'submitted' && training.assignment_status !== 'completed' ? (
                <>
                  <p className="text-xs text-gray-400 mb-3">Due: Tomorrow, 5:00 PM</p>
                  <Link href={`/dashboard/fresher/assessments/${training.assignment_id || '5'}/assignment`} className="mt-3 w-full py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center transition-colors">Submit Assignment</Link>
                </>
              ) : (
                <Link href={`/dashboard/fresher/assessments/${training.assignment_id || '5'}/results`} className="mt-3 w-full py-2 px-4 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center justify-center transition-colors">View Review</Link>
              )}
            </div>

            {/* Certification — EDITABLE */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow relative">
              <button onClick={() => setCertEditing(!certEditing)} className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Edit Certification">
                <Pencil className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-amber-600" /></div>
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getStatusColor(certStatus))}>{certStatus === 'completed' ? 'Completed' : 'In Progress'}</span>
              </div>
              {certEditing ? (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600">Certification Name</label>
                  <input value={certName} onChange={e => setCertName(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none" />
                  <label className="block text-xs font-medium text-gray-600">Progress (%)</label>
                  <input type="number" min={0} max={100} value={certProgress} onChange={e => setCertProgress(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none" />
                  <label className="block text-xs font-medium text-gray-600">Status</label>
                  <select value={certStatus} onChange={e => setCertStatus(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none">
                    <option value="pending">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button onClick={() => setCertEditing(false)} className="w-full py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Save</button>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-gray-900 mb-1">Certification</h3>
                  <p className="text-sm text-gray-500 mb-3">{certName}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${certProgress}%` }}></div></div>
                  <p className="text-xs text-gray-500">{certProgress}% Complete</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Work Summary + Editable Todo + Editable Schedule + SQL Quiz */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8 px-4 lg:px-8">
          {/* Work Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-indigo-600" /><h2 className="text-lg font-semibold text-gray-900">Work Summary</h2></div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Overall Progress</span><span className="font-semibold text-gray-900">{safeProgress.overall}%</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full" style={{ width: `${safeProgress.overall}%` }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-2xl font-bold text-purple-600">{safeProgress.topics_completed}</p><p className="text-xs text-gray-500">Topics Done</p></div>
                <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-2xl font-bold text-green-600">{safeProgress.assessments_passed}</p><p className="text-xs text-gray-500">Assessments</p></div>
                <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-2xl font-bold text-blue-600">{safeProgress.learning_hours_today}h</p><p className="text-xs text-gray-500">Today</p></div>
                <div className="text-center p-3 bg-gray-50 rounded-xl"><p className="text-2xl font-bold text-amber-600">{safeProgress.streak}</p><p className="text-xs text-gray-500">Day Streak</p></div>
              </div>
            </div>
          </div>

          {/* Editable Today To-Do */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><h2 className="text-lg font-semibold text-gray-900">Today To-Do</h2></div>
              <button onClick={() => setShowAddTodo(!showAddTodo)} className="p-1 rounded-lg hover:bg-green-50 text-green-600" title="Add Todo"><Plus className="w-4 h-4" /></button>
            </div>
            {showAddTodo && (
              <div className="mb-3 p-3 bg-green-50 rounded-xl space-y-2">
                <input placeholder="Task title..." value={newTodoTitle} onChange={e => setNewTodoTitle(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400" />
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={newTodoDuration} onChange={e => setNewTodoDuration(Number(e.target.value))} className="w-20 px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-400" />
                  <button onClick={addTodo} className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">Add</button>
                </div>
              </div>
            )}
            {editableTodos.length === 0 ? (
              <div className="text-sm text-gray-500">All caught up for today! Click + to add tasks.</div>
            ) : (
              <div className="space-y-2">
                {editableTodos.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTodoStatus(item.id)} className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors", item.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400')}>
                        {item.status === 'completed' && <CheckCheck className="w-3 h-3" />}
                      </button>
                      <div>
                        <p className={cn("text-sm font-medium", item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900')}>{item.title}</p>
                        <p className="text-xs text-gray-500">{item.duration_minutes} min</p>
                      </div>
                    </div>
                    <button onClick={() => removeTodo(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editable Schedule Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" /><h2 className="text-lg font-semibold text-gray-900">Schedule Preview</h2></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAddSchedule(!showAddSchedule)} className="p-1 rounded-lg hover:bg-indigo-50 text-indigo-600" title="Add Item"><Plus className="w-4 h-4" /></button>
                <Link href="/dashboard/fresher/schedule" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
              </div>
            </div>
            {showAddSchedule && (
              <div className="mb-3 p-3 bg-indigo-50 rounded-xl space-y-2">
                <input placeholder="Title..." value={newSchedTitle} onChange={e => setNewSchedTitle(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <input placeholder="Topic..." value={newSchedTopic} onChange={e => setNewSchedTopic(e.target.value)} className="w-full px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={newSchedDuration} onChange={e => setNewSchedDuration(Number(e.target.value))} className="w-20 px-2 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
                  <button onClick={addScheduleItem} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">Add</button>
                </div>
              </div>
            )}
            {editableSchedule.length === 0 ? (
              <div className="text-sm text-gray-500">No schedule items yet. Click + to add.</div>
            ) : (
              <div className="space-y-2">
                {editableSchedule.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                    {editingScheduleId === item.id ? (
                      <div className="flex-1 space-y-1 mr-2">
                        <input value={editSchedTitle} onChange={e => setEditSchedTitle(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                        <input value={editSchedTopic} onChange={e => setEditSchedTopic(e.target.value)} className="w-full px-2 py-1 border rounded text-xs" />
                        <button onClick={saveEditSchedule} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"><Save className="w-3 h-3 inline mr-1" />Save</button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.topic} &bull; {item.duration_minutes} min</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", getStatusColor(item.status))}>{item.status.replace('_', ' ')}</span>
                          <button onClick={() => startEditSchedule(item)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-indigo-50 text-indigo-400 transition-opacity"><Pencil className="w-3 h-3" /></button>
                          <button onClick={() => removeScheduleItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SQL Quiz Widget */}
          <SQLQuizWidget />
        </div>

        {/* Earned Badges */}
        {data.badges && data.badges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-8 mx-4 lg:mx-8 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Earned Badges</h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{data.badges.length} earned</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {data.badges.map((badge: BadgeItem) => {
                const colorMap: Record<string, string> = {
                  blue: 'from-blue-500 to-blue-600 border-blue-200 bg-blue-50',
                  indigo: 'from-indigo-500 to-indigo-600 border-indigo-200 bg-indigo-50',
                  purple: 'from-purple-500 to-purple-600 border-purple-200 bg-purple-50',
                  violet: 'from-violet-500 to-violet-600 border-violet-200 bg-violet-50',
                  green: 'from-green-500 to-green-600 border-green-200 bg-green-50',
                  teal: 'from-teal-500 to-teal-600 border-teal-200 bg-teal-50',
                };
                const colors = colorMap[badge.color] || colorMap.blue;
                const bgColor = colors.split(' ').find(c => c.startsWith('bg-')) || 'bg-blue-50';
                const borderColor = colors.split(' ').find(c => c.startsWith('border-')) || 'border-blue-200';
                const gradientFrom = colors.split(' ').find(c => c.startsWith('from-')) || 'from-blue-500';
                const gradientTo = colors.split(' ').find(c => c.startsWith('to-')) || 'to-blue-600';
                return (
                  <div key={badge.id} className={cn("relative flex flex-col items-center p-4 rounded-xl border-2 transition-transform hover:scale-105", borderColor, bgColor)} title={badge.description}>
                    <div className={cn("w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-lg font-bold shadow-lg mb-2", gradientFrom, gradientTo)}>
                      <Award className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 text-center leading-tight">{badge.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{badge.skill_name}</p>
                    <p className="text-[10px] font-medium text-gray-600 mt-0.5">{Math.round(badge.score_achieved)}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assessment History Log */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden mb-8 mx-4 lg:mx-8">
          <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full px-6 py-4 border-b flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Assessment History</h2>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">{attemptedAssessments.length} Attempted</span>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-gray-500 transition-transform", isHistoryOpen ? "rotate-180" : "")} />
          </button>
          {isHistoryOpen && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                  <tr><th className="px-6 py-3">Assessment</th><th className="px-6 py-3">Date</th><th className="px-6 py-3 text-center">Score</th><th className="px-6 py-3 text-right">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attemptedAssessments.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No assessments attempted yet.</td></tr>
                  ) : (
                    attemptedAssessments.map((assessment: any) => (
                      <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", assessment.assessment_type === 'quiz' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600')}>
                            {assessment.assessment_type === 'quiz' && <FileText className="w-4 h-4" />}
                            {assessment.assessment_type === 'assignment' && <Target className="w-4 h-4" />}
                          </div>
                          <div><p>{assessment.assessment_title}</p><p className="text-xs text-gray-400 capitalize">{assessment.assessment_type}</p></div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{assessment.time_ago}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", assessment.score >= 80 ? 'bg-green-500' : assessment.score >= 60 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${assessment.score}%` }} />
                            </div>
                            <span className="font-semibold">{Math.round(assessment.score)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn("inline-flex px-2 py-1 text-xs font-semibold rounded-full", assessment.pass_status === 'pass' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
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

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 py-4 border-t mx-4 lg:mx-8">
          <p>&copy; 2023 Hexaware Technologies Limited. All rights reserved <a href="https://www.hexaware.com" className="hover:text-purple-600 font-medium">www.Hexaware.com</a></p>
          <p className="mt-1">Training Dashboard for Mavericks Onboarding</p>
        </div>
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
