'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain, Users, TrendingUp, AlertTriangle, BarChart3, Calendar, Award, Target, ChevronRight, Bell, Settings, LogOut, Menu, X, ArrowUp, ArrowDown, Minus, CheckCircle2, Clock, XCircle, Search, Filter, FileText, Download, RefreshCw, Cpu, Activity, Layers, Play, Pause, CheckCheck
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn, getRiskColor } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api-service';

const getDemoData = () => ({
  summary: { totalFreshers: 0, activeFreshers: 0, atRiskCount: 0, completedCount: 0, averageProgress: 0, averageRiskScore: 0 },
  alerts: [] as any[],
  progressTrend: [] as any[],
  riskDistribution: [{ name: 'Low Risk', value: 0, color: '#22c55e' }, { name: 'Medium Risk', value: 0, color: '#eab308' }, { name: 'High Risk', value: 0, color: '#f97316' }, { name: 'Critical', value: 0, color: '#ef4444' }],
  topPerformers: [] as any[],
  departmentStats: [] as any[],
  recentActivity: [] as any[],
  freshers: [] as any[],
  agentMetrics: [
    { name: 'Onboarding Agent', status: 'active', queue: 0, processed: 0, avgTime: '0s', successRate: 0 },
    { name: 'Assessment Agent', status: 'active', queue: 0, processed: 0, avgTime: '0s', successRate: 0 },
    { name: 'Profile Agent', status: 'active', queue: 0, processed: 0, avgTime: '0s', successRate: 0 },
    { name: 'Reporting Agent', status: 'idle', queue: 0, processed: 0, avgTime: '0s', successRate: 0 },
  ],
  reports: [] as any[],
});

// Interfaces for type safety
interface DepartmentStat { name: string; freshers: number; avgProgress: number; atRisk: number; }
interface TopPerformer { name: string; progress: number; trend: string; assessmentScore: number; }
interface AlertItem { id: number; fresherName: string; riskLevel: string; riskScore: number; reason: string; createdAt: string; }
interface AgentMetric { name: string; status: string; queue: number; processed: number; avgTime: string; successRate: number; }

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeReportType, setActiveReportType] = useState<string | null>(null);
  const [reportProgress, setReportProgress] = useState(0);

  // Take Action modal state
  const [actionModal, setActionModal] = useState<{ open: boolean; fresherName: string; alertId: number | null }>({ open: false, fresherName: '', alertId: null });
  const [actionType, setActionType] = useState<'warn' | 'fired' | 'appreciate' | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionSent, setActionSent] = useState(false);

  const normalizeDashboardData = useCallback((apiData: any) => {
    const demo = getDemoData();
    if (!apiData || typeof apiData !== 'object') return demo;

    // Already in UI shape (returned by updated backend)
    if (apiData.summary && typeof apiData.summary.totalFreshers === 'number') {
      // Merge with demo defaults so nothing is missing
      return {
        ...demo,
        ...apiData,
        agentMetrics: Array.isArray(apiData.agentMetrics) && apiData.agentMetrics.length ? apiData.agentMetrics : demo.agentMetrics,
        recentActivity: Array.isArray(apiData.recentActivity) && apiData.recentActivity.length ? apiData.recentActivity : demo.recentActivity,
        freshers: Array.isArray(apiData.freshers) && apiData.freshers.length ? apiData.freshers : demo.freshers,
        reports: Array.isArray(apiData.reports) ? apiData.reports : [],
      };
    }

    // Backend shape (DashboardStats) - check for summary.total_freshers
    if (apiData.summary && typeof apiData.summary.total_freshers === 'number') {
      const averageRiskScore = Array.isArray(apiData.alerts) && apiData.alerts.length
        ? Math.round(
          apiData.alerts.reduce((acc: number, a: any) => acc + (Number(a?.risk_score) || 0), 0) /
          apiData.alerts.length
        )
        : Number(apiData.summary.average_risk_score) || demo.summary.averageRiskScore;

      const riskColors: Record<string, string> = {
        low: '#22c55e',
        medium: '#eab308',
        high: '#f97316',
        critical: '#ef4444',
      };

      const riskDistribution = Array.isArray(apiData.risk_distribution)
        ? apiData.risk_distribution.map((rd: any) => ({
          name: String(rd.name),
          value: Number(rd.value) || 0,
          color: rd.color || '#94a3b8',
        }))
        : demo.riskDistribution;

      const departmentStats = Array.isArray(apiData.department_stats)
        ? apiData.department_stats.map((dept: any) => ({
          name: String(dept.name),
          freshers: Number(dept.freshers) || 0,
          avgProgress: Math.round(Number(dept.avg_progress) || 0),
          atRisk: Number(dept.at_risk) || 0,
        }))
        : demo.departmentStats;

      const progressTrend = Array.isArray(apiData.progress_trend)
        ? apiData.progress_trend.slice(-7).map((p: any) => {
          const date = p?.date ? new Date(p.date) : null;
          const day = date && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString('en-US', { weekday: 'short' })
            : (p.date || 'Day');
          return {
            day,
            avgProgress: Math.round(Number(p?.avg_progress) || 0),
            completions: Number(p?.completions) || 0,
          };
        })
        : demo.progressTrend;

      const alerts = Array.isArray(apiData.alerts)
        ? apiData.alerts.map((a: any, idx: number) => ({
          id: a?.id ?? idx + 1,
          fresherName: a?.fresher_name || `Fresher #${a?.fresher_id}`,
          riskLevel: String(a?.risk_level ?? 'medium').toLowerCase(),
          riskScore: Number(a?.risk_score) || 0,
          reason: String(a?.reason || 'Risk alert'),
          createdAt: a?.created_at ?? new Date().toISOString(),
        }))
        : demo.alerts;

      const topPerformers = Array.isArray(apiData.top_performers)
        ? apiData.top_performers.slice(0, 5).map((tp: any) => ({
          name: String(tp?.name || 'Top Performer'),
          progress: Math.round(Number(tp?.progress || 0)),
          trend: String(tp?.trend || 'stable'),
          assessmentScore: Math.round(Number(tp?.assessment_score || 0)),
        }))
        : demo.topPerformers;

      return {
        ...demo,
        summary: {
          totalFreshers: Number(apiData.summary.total_freshers) || demo.summary.totalFreshers,
          activeFreshers: Number(apiData.summary.active_freshers) || demo.summary.activeFreshers,
          atRiskCount: Number(apiData.summary.at_risk_count) || demo.summary.atRiskCount,
          completedCount: Number(apiData.summary.completed_count) || demo.summary.completedCount,
          averageProgress: Math.round(Number(apiData.summary.average_progress) || demo.summary.averageProgress),
          averageRiskScore,
        },
        alerts,
        progressTrend,
        riskDistribution,
        topPerformers,
        departmentStats,
        agentMetrics: apiData.agent_metrics ? Object.values(apiData.agent_metrics).map((m: any) => ({
          name: m.name,
          status: m.status,
          queue: m.tasks_pending || 0,
          processed: m.tasks_completed || 0,
          avgTime: `${(m.avg_latency_ms / 1000).toFixed(1)}s`,
          successRate: Math.round((1 - (m.error_rate || 0)) * 100),
        })) : demo.agentMetrics,
        reports: Array.isArray(apiData.reports) ? apiData.reports : [],
        freshers: Array.isArray(apiData.freshers)
          ? apiData.freshers.map((f: any) => ({
            id: String(f.id),
            name: String(f.name || 'Fresher'),
            department: String(f.department || 'General'),
            week: Number(f.week) || 1,
            progress: Number(f.progress) || 0,
            riskLevel: String(f.riskLevel || f.risk_level || 'low'),
            status: String(f.status || 'active'),
            skill: String(f.skill || ''),
          }))
          : demo.freshers,
        recentActivity: Array.isArray(apiData.recent_activity)
          ? apiData.recent_activity.map((a: any) => ({
            type: a.type || 'assessment',
            fresher: a.fresher_name || a.fresher || 'System',
            action: a.action || '',
            score: a.details || '',
            time: a.timestamp ? new Date(a.timestamp).toLocaleString() : '',
          }))
          : demo.recentActivity,
      };
    }

    return demo;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(getDemoData());
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const result = await api.workflow.getManagerDashboard(token);
      setDashboardData(normalizeDashboardData(result.data));
    } catch (err: any) {
      console.error('[Dashboard] Fetch failed:', err);
      // alert('Dashboard load failed: ' + (err.message || 'Unknown error'));
      setDashboardData(getDemoData());
    }
    finally { setIsLoading(false); }
  }, [token, normalizeDashboardData]);

  useEffect(() => { if (!authLoading) fetchDashboardData(); }, [authLoading, fetchDashboardData]);
  // Allow admins to view manager dashboard (via "Switch to Manager view" link)
  // useEffect(() => {
  //   if (!authLoading && user && (user.role || '').toLowerCase() === 'admin') {
  //     router.replace('/dashboard/admin');
  //   }
  // }, [authLoading, user, router]);

  const data = dashboardData || getDemoData();

  interface FresherItem { id: string; name: string; department: string; week: number; progress: number; riskLevel: string; status: string; skill?: string; }
  const filteredFreshers = (data.freshers as FresherItem[] | undefined)?.filter((f: FresherItem) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.department.toLowerCase().includes(searchQuery.toLowerCase()) || (f.skill && f.skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRisk = filterRisk === 'all' || f.riskLevel === filterRisk;
    const matchesDept = filterDepartment === 'all' || f.department === filterDepartment;
    const matchesSkill = filterSkill === 'all' || f.skill === filterSkill;
    const matchesStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchesSearch && matchesRisk && matchesDept && matchesSkill && matchesStatus;
  }) || [];

  const departments = Array.from(new Set((data.freshers as FresherItem[] | undefined)?.map((f: FresherItem) => f.department) || []));
  const skills = Array.from(new Set((data.freshers as FresherItem[] | undefined)?.map((f: FresherItem) => f.skill).filter(Boolean) || []));

  const [selectedReportDept, setSelectedReportDept] = useState<string>('all');
  const [lastGeneratedReportId, setLastGeneratedReportId] = useState<string | null>(null);
  const [lastGeneratedType, setLastGeneratedType] = useState<string | null>(null);
  const [aiTopic, setAiTopic] = useState('React Hooks');
  const [aiType, setAiType] = useState('quiz');
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: 'password123',
    first_name: '',
    last_name: '',
    role: 'fresher',
    department: '',
  });
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const generateReport = async (type: string, filters?: any) => {
    if (!token) { alert("Authentication error. Please login again."); return; }
    setIsGeneratingReport(true);
    setActiveReportType(type);
    setReportProgress(0);

    // Smooth progress simulation
    const interval = setInterval(() => {
      setReportProgress(p => { if (p >= 90) { return 90; } return p + 10; });
    }, 300);

    try {
      let reportId: string | null = null;

      // 1. Generate Report
      setLastGeneratedReportId(null);
      setLastGeneratedType(null);

      const result = await api.report.generate(type, token, filters);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        reportId = result.data.id;
        setLastGeneratedReportId(result.data.id);
        setLastGeneratedType(type);
        // Background refresh - don't await blocking
        fetchDashboardData();
      }

      // Complete bar
      clearInterval(interval);
      setReportProgress(100);
      await new Promise(r => setTimeout(r, 400)); // Visual completion

      // 2. Download Report via direct browser navigation (most reliable)
      if (reportId) {
        try {
          console.log(`[Manager] Starting download for report ${reportId}`);
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
          const downloadUrl = `${apiUrl}/reports/${reportId}/download?token=${encodeURIComponent(token)}`;

          // Use window.open for most reliable download across all browsers
          const downloadWindow = window.open(downloadUrl, '_blank');
          
          // Fallback: if popup was blocked, try iframe approach
          if (!downloadWindow) {
            console.log('[Manager] Popup blocked, using iframe fallback');
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = downloadUrl;
            document.body.appendChild(iframe);
            setTimeout(() => {
              try { document.body.removeChild(iframe); } catch(e) {}
            }, 10000);
          }

          console.log(`[Manager] Download triggered for report ${reportId}`);
        } catch (e: any) {
          console.error("[Manager] Download error:", e);
          alert(`Download failed: ${e.message || "Unknown error"}. Use the Download PDF button below to retry.`);
        }
      } else {
        alert('Report generated but no report ID returned. Please try again.');
      }
    } catch (err: any) {
      console.error('Report generation failed', err);
      alert(`Failed to generate report: ${err.message || "Unknown error"}`);
    } finally {
      setIsGeneratingReport(false);
      setActiveReportType(null);
      setReportProgress(0);
      clearInterval(interval);
    }
  };

  const handleAiGenerate = async () => {
    if (!token) { alert('Authentication error. Please login again.'); return; }
    setAiLoading(true);
    setAiStatus(null);
    try {
      const res = await api.assessment.aiGenerate({ topic: aiTopic, assessment_type: aiType }, token);
      if (res.error) throw new Error(res.error);
      setAiStatus(`Created assessment: ${res.data?.title || 'Untitled'} (ID ${res.data?.id})`);
    } catch (e: any) {
      setAiStatus(`Failed: ${e.message || 'Unknown error'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!token) { alert('Authentication error. Please login again.'); return; }
    setUserStatus(null);
    try {
      const res = await api.admin.createUser(newUser, token);
      if (res.error) throw new Error(res.error);
      setUserStatus(`Created ${res.data?.email}`);
    } catch (e: any) {
      setUserStatus(`Failed: ${e.message || 'Unknown error'}`);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };
  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = { assessment: <Award className="w-5 h-5 text-purple-500" />, schedule: <Calendar className="w-5 h-5 text-blue-500" />, alert: <AlertTriangle className="w-5 h-5 text-red-500" />, curriculum: <Target className="w-5 h-5 text-green-500" /> };
    return icons[type] || <Bell className="w-5 h-5 text-gray-500" />;
  };
  const getAgentStatusColor = (status: string) => {
    const colors: Record<string, string> = { active: 'text-green-600 bg-green-50', idle: 'text-gray-600 bg-gray-50', processing: 'text-blue-600 bg-blue-50', error: 'text-red-600 bg-red-50' };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };
  const getRiskBadgeColor = (risk: string) => {
    const colors: Record<string, string> = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
    return colors[risk] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="dashboard-shell">
      <div className="blob-amber" aria-hidden />
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center justify-between px-4">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu className="w-6 h-6" /></button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
          <span className="font-bold">MaverickAI</span>
        </div>
        <button className="p-2 relative"><Bell className="w-6 h-6" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /></button>
      </div>

      {/* Sidebar */}
      <aside className={cn("fixed inset-y-0 left-0 w-64 bg-white border-r z-50 transform transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center space-x-2 px-4 border-b">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center"><Brain className="w-6 h-6 text-white" /></div>
            <span className="text-xl font-bold">MaverickAI</span>
            <button className="lg:hidden ml-auto p-2" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
          </div>
          <div className="p-4 border-b"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Console</span></div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'freshers', label: 'Freshers', icon: Users },
              { id: 'agents', label: 'Agent Queue', icon: Cpu },
              { id: 'reports', label: 'Reports', icon: FileText },
              { id: 'ai', label: 'AI Assessments', icon: Layers },
              ...(isAdmin ? [{ id: 'admin', label: 'Admin Users', icon: Settings }] : []),
              { id: 'alerts', label: 'Risk Alerts', icon: AlertTriangle, badge: data.alerts?.length },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors", activeTab === item.id ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50")}>
                  <span className="flex items-center space-x-3"><Icon className="w-5 h-5" /><span className="font-medium">{item.label}</span></span>
                  {item.badge && <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">{item.badge}</span>}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <button onClick={() => { logout(); router.push('/login'); }} className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 border rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" /><span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome back, {user?.first_name || 'Admin'}</p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <button onClick={fetchDashboardData} className="p-2 hover:bg-gray-100 rounded-lg" title="Refresh"><RefreshCw className={cn("w-5 h-5 text-gray-600", isLoading && "animate-spin")} /></button>
              <button className="p-2 relative hover:bg-gray-100 rounded-lg"><Bell className="w-6 h-6 text-gray-600" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" /></button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border p-6"><div className="flex items-center justify-between mb-2"><span className="text-gray-500 text-sm">Total Freshers</span><Users className="w-5 h-5 text-purple-500" /></div><div className="text-3xl font-bold text-gray-900">{data.summary.totalFreshers}</div><p className="text-sm text-green-600 mt-1 flex items-center"><ArrowUp className="w-4 h-4 mr-1" />{data.summary.activeFreshers} active</p></div>
                <div className="bg-white rounded-xl border p-6"><div className="flex items-center justify-between mb-2"><span className="text-gray-500 text-sm">At Risk</span><AlertTriangle className="w-5 h-5 text-red-500" /></div><div className="text-3xl font-bold text-red-600">{data.summary.atRiskCount}</div><p className="text-sm text-gray-500 mt-1">Requires attention</p></div>
                <div className="bg-white rounded-xl border p-6"><div className="flex items-center justify-between mb-2"><span className="text-gray-500 text-sm">Avg Progress</span><TrendingUp className="w-5 h-5 text-green-500" /></div><div className="text-3xl font-bold text-gray-900">{data.summary.averageProgress}%</div><p className="text-sm text-green-600 mt-1 flex items-center"><ArrowUp className="w-4 h-4 mr-1" />+3% from last week</p></div>
                <div className="bg-white rounded-xl border p-6"><div className="flex items-center justify-between mb-2"><span className="text-gray-500 text-sm">Completed</span><CheckCircle2 className="w-5 h-5 text-green-500" /></div><div className="text-3xl font-bold text-green-600">{data.summary.completedCount}</div><p className="text-sm text-gray-500 mt-1">Finished training</p></div>
              </div>

              {/* Main Grid */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Progress Trend */}
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Weekly Progress Trend</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.progressTrend}>
                          <defs><linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="day" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                          <Area type="monotone" dataKey="avgProgress" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProgress)" name="Avg Progress %" />
                          <Line type="monotone" dataKey="completions" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Completions" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Department Stats */}
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Department Overview</h2>
                    <table className="w-full"><thead><tr className="text-left border-b"><th className="pb-3 font-medium text-gray-500">Department</th><th className="pb-3 font-medium text-gray-500">Freshers</th><th className="pb-3 font-medium text-gray-500">Avg Progress</th><th className="pb-3 font-medium text-gray-500">At Risk</th></tr></thead><tbody>
                      {(data.departmentStats as DepartmentStat[]).map((dept: DepartmentStat) => (<tr key={dept.name} className="border-b border-gray-50 last:border-0"><td className="py-3 font-medium text-gray-900">{dept.name}</td><td className="py-3 text-gray-600">{dept.freshers}</td><td className="py-3"><div className="flex items-center"><div className="w-24 h-2 bg-gray-100 rounded-full mr-2"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${dept.avgProgress}%` }} /></div><span className="text-gray-600">{dept.avgProgress}%</span></div></td><td className="py-3"><span className={cn("px-2 py-1 rounded-full text-xs font-medium", dept.atRisk === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{dept.atRisk}</span></td></tr>))}
                    </tbody></table>
                  </div>
                </div>
                {/* Right Column */}
                <div className="space-y-6">
                  {/* Risk Distribution */}
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Risk Distribution</h2>
                    <div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.riskDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">{(data.riskDistribution as { name: string; value: number; color: string }[]).map((entry: { name: string; value: number; color: string }, index: number) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
                    <div className="grid grid-cols-2 gap-2 mt-4">{(data.riskDistribution as { name: string; value: number; color: string }[]).map((item: { name: string; value: number; color: string }) => (<div key={item.name} className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-sm text-gray-600">{item.name}: {item.value}</span></div>))}</div>
                  </div>
                  {/* Top Performers */}
                  <div className="bg-white rounded-xl border p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Top Performers</h2>
                    <div className="space-y-3">{(data.topPerformers as TopPerformer[]).map((performer: TopPerformer, idx: number) => (<div key={performer.name} className="flex items-center space-x-3"><div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", idx === 0 && "bg-yellow-100 text-yellow-700", idx === 1 && "bg-gray-100 text-gray-700", idx === 2 && "bg-orange-100 text-orange-700", idx > 2 && "bg-gray-50 text-gray-500")}>{idx + 1}</div><div className="flex-1"><p className="font-medium text-gray-900 text-sm">{performer.name}</p><p className="text-xs text-gray-500">{performer.progress}% progress</p></div>{getTrendIcon(performer.trend)}</div>))}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'freshers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Fresher Search & Filters</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search by name or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
                  <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="all">All Risk Levels</option><option value="low">Low Risk</option><option value="medium">Medium Risk</option><option value="high">High Risk</option><option value="critical">Critical</option></select>
                  <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="all">All Departments</option>{departments.map(d => <option key={d} value={d}>{d}</option>)}</select>
                  <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="all">All Skills</option>{skills.map(s => <option key={s} value={s}>{s}</option>)}</select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="all">All Statuses</option><option value="active">Active</option><option value="at_risk">At Risk</option><option value="completed">Completed</option></select>
                </div>
              </div>
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Skill</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Week</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Progress</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Risk Level</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th></tr></thead><tbody>
                  {filteredFreshers.map((fresher) => (<tr key={fresher.id} className="border-t hover:bg-gray-50"><td className="px-6 py-4"><p className="font-medium text-gray-900">{fresher.name}</p></td><td className="px-6 py-4 text-gray-600">{fresher.department}</td><td className="px-6 py-4"><span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">{fresher.skill || 'N/A'}</span></td><td className="px-6 py-4 text-gray-600">Week {fresher.week}</td><td className="px-6 py-4"><div className="flex items-center"><div className="w-20 h-2 bg-gray-200 rounded-full mr-2"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${fresher.progress}%` }} /></div><span className="text-sm text-gray-600">{fresher.progress}%</span></div></td><td className="px-6 py-4"><span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize", getRiskBadgeColor(fresher.riskLevel))}>{fresher.riskLevel}</span></td><td className="px-6 py-4"><span className={cn("px-3 py-1 rounded-full text-xs font-medium capitalize", fresher.status === 'active' ? 'bg-green-100 text-green-700' : fresher.status === 'at_risk' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>{fresher.status.replace('_', ' ')}</span></td><td className="px-6 py-4"><button onClick={() => router.push(`/dashboard/manager/fresher/${fresher.id}`)} className="text-purple-600 hover:text-purple-800 text-sm font-medium">View Details</button></td></tr>))}
                </tbody></table>
                {filteredFreshers.length === 0 && <div className="p-8 text-center text-gray-500">No freshers found matching your criteria</div>}
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Agent Queue Monitoring</h2>
                  <div className="flex items-center space-x-2"><Activity className="w-5 h-5 text-green-500 animate-pulse" /><span className="text-sm text-gray-600">Live</span></div>
                </div>
                <div className="grid gap-4">
                  {(data.agentMetrics as AgentMetric[]).map((agent: AgentMetric) => (
                    <div key={agent.name} className="p-4 border rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Cpu className="w-5 h-5 text-purple-600" /></div><div><h3 className="font-semibold text-gray-900">{agent.name}</h3><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", getAgentStatusColor(agent.status))}>{agent.status}</span></div></div>
                        <div className="flex items-center space-x-2">{agent.status === 'processing' && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}{agent.status === 'active' && <Play className="w-4 h-4 text-green-500" />}{agent.status === 'idle' && <Pause className="w-4 h-4 text-gray-400" />}</div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div><p className="text-2xl font-bold text-purple-600">{agent.queue}</p><p className="text-xs text-gray-500">In Queue</p></div>
                        <div><p className="text-2xl font-bold text-gray-900">{agent.processed}</p><p className="text-xs text-gray-500">Processed</p></div>
                        <div><p className="text-2xl font-bold text-blue-600">{agent.avgTime}</p><p className="text-xs text-gray-500">Avg Time</p></div>
                        <div><p className="text-2xl font-bold text-green-600">{agent.successRate}%</p><p className="text-xs text-gray-500">Success</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Report Generation</h2>
                {isGeneratingReport && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-purple-700">Generating report...</span><span className="text-sm text-purple-600">{reportProgress}%</span></div>
                    <div className="w-full h-2 bg-purple-200 rounded-full"><div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${reportProgress}%` }} /></div>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { type: 'weekly', title: 'Weekly Progress Report', desc: 'Overview of all freshers progress this week', icon: Calendar },
                    { type: 'risk', title: 'Risk Analysis Report', desc: 'Detailed risk assessment for at-risk freshers', icon: AlertTriangle },
                    { type: 'performance', title: 'Performance Report', desc: 'Top performers and areas of improvement', icon: TrendingUp },
                    { type: 'department', title: 'Department Report', desc: 'Progress breakdown by department', icon: Layers },
                    { type: 'assessment', title: 'Assessment Report', desc: 'Quiz and coding challenge analytics', icon: Award },
                  ].map((report) => {
                    const Icon = report.icon;
                    return (
                      <div key={report.type} className="p-6 border rounded-xl hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-purple-600" /></div>
                        <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{report.desc}</p>

                        {report.type === 'department' && (
                          <div className="mb-4">
                            <select
                              className="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                              value={selectedReportDept}
                              onChange={(e) => setSelectedReportDept(e.target.value)}
                            >
                              <option value="all">All Departments</option>
                              {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        )}

                        <button
                          onClick={() => generateReport(report.type, report.type === 'department' ? { department: selectedReportDept } : undefined)}
                          disabled={isGeneratingReport}
                          className={cn(
                            "w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                            isGeneratingReport
                              ? (activeReportType === report.type ? "bg-purple-100 text-purple-700 cursor-wait" : "bg-gray-100 text-gray-400 cursor-not-allowed")
                              : "bg-purple-600 text-white hover:bg-purple-700"
                          )}
                        >
                          {isGeneratingReport && activeReportType === report.type ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>{isGeneratingReport && activeReportType === report.type ? 'Generating...' : 'Generate'}</span>
                        </button>

                        {/* Manual Download Link if just generated */}
                        {lastGeneratedReportId && lastGeneratedType === report.type && !isGeneratingReport && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs text-green-700 font-medium text-center mb-1">✓ Report generated successfully!</p>
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reports/${lastGeneratedReportId}/download?token=${encodeURIComponent(token || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download PDF</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Reports List */}
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center justify-between">
                  Recent Reports
                  <button onClick={fetchDashboardData} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <RefreshCw className={cn("w-4 h-4 text-gray-400", isLoading && "animate-spin")} />
                  </button>
                </h2>
                <div className="overflow-hidden border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">Report Title</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">Type</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">Date</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(!data.reports || data.reports.length === 0) && (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No reports generated yet</td></tr>
                      )}
                      {(data.reports || []).map((report: any) => (
                        <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{report.title}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">{report.type}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{report.generated_at ? new Date(report.generated_at).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                const reportId = report.id;
                                fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reports/${reportId}/download`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                }).then(r => {
                                  if (!r.ok) throw new Error('Download failed');
                                  return r.blob().then(blob => ({ blob, headers: r.headers }));
                                }).then(({ blob, headers }) => {
                                  const contentType = headers.get('Content-Type');
                                  const ext = contentType && contentType.includes('application/pdf') ? 'pdf' : 'json';
                                  const filename = `maverick_${report.type}_${reportId}.${ext}`;

                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = filename;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  window.URL.revokeObjectURL(url);
                                }).catch(err => alert(err.message));
                              }}
                              className="inline-flex items-center text-purple-600 hover:text-purple-800 font-bold"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">AI Assessment Generator</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Topic</label>
                    <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="e.g., React Hooks" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Type</label>
                    <select value={aiType} onChange={(e) => setAiType(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2">
                      <option value="quiz">Quiz</option>
                      <option value="code">Code</option>
                      <option value="assignment">Assignment</option>
                    </select>
                  </div>
                  <button onClick={handleAiGenerate} disabled={aiLoading} className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center justify-center gap-2">
                    {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Generate Assessment
                  </button>
                  {aiStatus && <p className="text-sm text-gray-700">{aiStatus}</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Create User</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="Email" />
                  <input value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="Password" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="First name" />
                    <input value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="Last name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="border rounded-lg px-3 py-2">
                      <option value="fresher">Fresher</option>
                      <option value="mentor">Mentor</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <input value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="Department" />
                  </div>
                  <button onClick={handleCreateUser} className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Create User
                  </button>
                  {userStatus && <p className="text-sm text-gray-700">{userStatus}</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Risk Alerts ({data.alerts.length})</h2>
                <div className="space-y-4">
                  {(data.alerts as AlertItem[]).map((alert: AlertItem) => (
                    <div key={alert.id} className={cn("p-4 rounded-xl border-l-4", alert.riskLevel === 'critical' ? "bg-red-50 border-red-500" : alert.riskLevel === 'high' ? "bg-orange-50 border-orange-500" : "bg-yellow-50 border-yellow-500")}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-2"><AlertTriangle className={cn("w-5 h-5", alert.riskLevel === 'critical' ? "text-red-500" : alert.riskLevel === 'high' ? "text-orange-500" : "text-yellow-500")} /><span className="font-semibold text-gray-900">{alert.fresherName}</span><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", getRiskBadgeColor(alert.riskLevel))}>{alert.riskLevel} - {alert.riskScore}%</span></div>
                          <p className="text-gray-600 mb-2">{alert.reason}</p>
                          <p className="text-sm text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                        <button onClick={() => { setActionModal({ open: true, fresherName: alert.fresherName, alertId: alert.id }); setActionType(null); setActionMessage(''); setActionSent(false); }} className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition">Take Action</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hexaware Footer */}
          <div className="mt-12 text-center text-xs text-gray-500 py-4 border-t">
            <p>© 2023 Hexaware Technologies Limited. All rights reserved <a href="https://www.hexaware.com" className="hover:text-purple-600">www.Hexaware.com</a></p>
            <p className="mt-1">Training Dashboard for Mavericks Onboarding - Admin Console</p>
          </div>
        </div>
      </main>

      {/* Take Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setActionModal({ open: false, fresherName: '', alertId: null })}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Take Action</h3>
                <button onClick={() => setActionModal({ open: false, fresherName: '', alertId: null })} className="text-white/80 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-purple-100 text-sm mt-1">Action for <span className="font-medium text-white">{actionModal.fresherName}</span></p>
            </div>

            {!actionSent ? (
              <div className="p-6 space-y-5">
                {/* Action Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Action Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setActionType('warn')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                        actionType === 'warn'
                          ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-100"
                          : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                      )}
                    >
                      <AlertTriangle className={cn("w-7 h-7", actionType === 'warn' ? "text-amber-600" : "text-amber-400")} />
                      <span className={cn("text-sm font-semibold", actionType === 'warn' ? "text-amber-700" : "text-gray-600")}>Warn</span>
                    </button>
                    <button
                      onClick={() => setActionType('fired')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                        actionType === 'fired'
                          ? "border-red-500 bg-red-50 shadow-md shadow-red-100"
                          : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"
                      )}
                    >
                      <XCircle className={cn("w-7 h-7", actionType === 'fired' ? "text-red-600" : "text-red-400")} />
                      <span className={cn("text-sm font-semibold", actionType === 'fired' ? "text-red-700" : "text-gray-600")}>Fired</span>
                    </button>
                    <button
                      onClick={() => setActionType('appreciate')}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                        actionType === 'appreciate'
                          ? "border-green-500 bg-green-50 shadow-md shadow-green-100"
                          : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                      )}
                    >
                      <Award className={cn("w-7 h-7", actionType === 'appreciate' ? "text-green-600" : "text-green-400")} />
                      <span className={cn("text-sm font-semibold", actionType === 'appreciate' ? "text-green-700" : "text-gray-600")}>Appreciate</span>
                    </button>
                  </div>
                </div>

                {/* Message Box */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={actionMessage}
                    onChange={e => setActionMessage(e.target.value)}
                    placeholder={actionType === 'warn' ? 'Describe the warning reason...' : actionType === 'fired' ? 'Provide termination details...' : actionType === 'appreciate' ? 'Write your appreciation note...' : 'Select an action type first...'}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm text-gray-800 placeholder-gray-400 transition"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setActionModal({ open: false, fresherName: '', alertId: null })}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!actionType || !actionMessage.trim()}
                    onClick={() => setActionSent(true)}
                    className={cn(
                      "px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition shadow-sm",
                      !actionType || !actionMessage.trim()
                        ? "bg-gray-300 cursor-not-allowed"
                        : actionType === 'warn'
                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                        : actionType === 'fired'
                        ? "bg-red-500 hover:bg-red-600 shadow-red-200"
                        : "bg-green-500 hover:bg-green-600 shadow-green-200"
                    )}
                  >
                    {actionType === 'warn' ? 'Send Warning' : actionType === 'fired' ? 'Confirm Termination' : actionType === 'appreciate' ? 'Send Appreciation' : 'Submit'}
                  </button>
                </div>
              </div>
            ) : (
              /* Success Confirmation */
              <div className="p-8 text-center space-y-4">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto",
                  actionType === 'warn' ? "bg-amber-100" : actionType === 'fired' ? "bg-red-100" : "bg-green-100"
                )}>
                  <CheckCircle2 className={cn(
                    "w-8 h-8",
                    actionType === 'warn' ? "text-amber-600" : actionType === 'fired' ? "text-red-600" : "text-green-600"
                  )} />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {actionType === 'warn' ? 'Warning Sent' : actionType === 'fired' ? 'Termination Recorded' : 'Appreciation Sent'}
                </h4>
                <p className="text-sm text-gray-500">
                  Action has been recorded for <span className="font-medium text-gray-700">{actionModal.fresherName}</span>
                </p>
                <button
                  onClick={() => setActionModal({ open: false, fresherName: '', alertId: null })}
                  className="mt-2 px-6 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
