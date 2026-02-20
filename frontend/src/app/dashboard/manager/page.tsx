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
  summary: { totalFreshers: 48, activeFreshers: 42, atRiskCount: 7, completedCount: 3, averageProgress: 52, averageRiskScore: 35 },
  alerts: [
    { id: 1, fresherName: 'John Smith', riskLevel: 'critical', riskScore: 85, reason: 'Missed 5 consecutive sessions', createdAt: '2024-01-20T10:30:00Z' },
    { id: 2, fresherName: 'Sarah Chen', riskLevel: 'high', riskScore: 72, reason: 'Failed 3 assessments in a row', createdAt: '2024-01-20T09:15:00Z' },
    { id: 3, fresherName: 'Mike Wilson', riskLevel: 'high', riskScore: 68, reason: 'Engagement dropped 40% this week', createdAt: '2024-01-19T16:45:00Z' },
    { id: 4, fresherName: 'Emily Davis', riskLevel: 'medium', riskScore: 55, reason: 'Behind schedule by 2 days', createdAt: '2024-01-19T14:20:00Z' },
  ],
  progressTrend: [
    { day: 'Mon', avgProgress: 45, completions: 12 }, { day: 'Tue', avgProgress: 47, completions: 15 }, { day: 'Wed', avgProgress: 48, completions: 18 }, { day: 'Thu', avgProgress: 50, completions: 14 }, { day: 'Fri', avgProgress: 52, completions: 20 }, { day: 'Sat', avgProgress: 52, completions: 8 }, { day: 'Sun', avgProgress: 53, completions: 5 },
  ],
  riskDistribution: [{ name: 'Low Risk', value: 28, color: '#22c55e' }, { name: 'Medium Risk', value: 13, color: '#eab308' }, { name: 'High Risk', value: 5, color: '#f97316' }, { name: 'Critical', value: 2, color: '#ef4444' }],
  topPerformers: [
    { name: 'Alice Thompson', progress: 78, trend: 'up', assessmentScore: 92 }, { name: 'Bob Martinez', progress: 75, trend: 'up', assessmentScore: 88 }, { name: 'Carol White', progress: 72, trend: 'stable', assessmentScore: 85 }, { name: 'David Lee', progress: 70, trend: 'up', assessmentScore: 82 }, { name: 'Eva Brown', progress: 68, trend: 'stable', assessmentScore: 80 },
  ],
  departmentStats: [{ name: 'Engineering', freshers: 20, avgProgress: 55, atRisk: 3 }, { name: 'Data Science', freshers: 12, avgProgress: 48, atRisk: 2 }, { name: 'DevOps', freshers: 8, avgProgress: 62, atRisk: 1 }, { name: 'QA', freshers: 8, avgProgress: 50, atRisk: 1 }],
  recentActivity: [
    { type: 'assessment', fresher: 'Alice Thompson', action: 'Completed React Advanced Quiz', score: '92%', time: '10 mins ago' },
    { type: 'schedule', fresher: 'System', action: 'Generated schedules for tomorrow', count: 42, time: '30 mins ago' },
    { type: 'alert', fresher: 'John Smith', action: 'Risk level escalated to Critical', time: '1 hour ago' },
    { type: 'curriculum', fresher: 'Sarah Chen', action: 'Curriculum adapted - added remediation', time: '2 hours ago' },
    { type: 'assessment', fresher: 'Bob Martinez', action: 'Submitted API Integration Challenge', score: '88%', time: '3 hours ago' },
  ],
  freshers: [
    { id: '1', name: 'Alice Thompson', department: 'Engineering', week: 4, progress: 78, riskLevel: 'low', status: 'active', skill: 'React' },
    { id: '2', name: 'Bob Martinez', department: 'Engineering', week: 3, progress: 75, riskLevel: 'low', status: 'active', skill: 'Node.js' },
    { id: '3', name: 'John Smith', department: 'Data Science', week: 2, progress: 35, riskLevel: 'critical', status: 'at_risk', skill: 'Python' },
    { id: '4', name: 'Sarah Chen', department: 'DevOps', week: 3, progress: 42, riskLevel: 'high', status: 'at_risk', skill: 'Docker' },
    { id: '5', name: 'Mike Wilson', department: 'QA', week: 4, progress: 58, riskLevel: 'medium', status: 'active', skill: 'JavaScript' },
    { id: '6', name: 'Emily Davis', department: 'Engineering', week: 2, progress: 48, riskLevel: 'medium', status: 'active', skill: 'TypeScript' },
    { id: '7', name: 'Carol White', department: 'Data Science', week: 5, progress: 72, riskLevel: 'low', status: 'completed', skill: 'Python' },
    { id: '8', name: 'David Lee', department: 'DevOps', week: 4, progress: 70, riskLevel: 'low', status: 'active', skill: 'AWS' },
  ],
  agentMetrics: [
    { name: 'Onboarding Agent', status: 'active', queue: 3, processed: 127, avgTime: '2.3s', successRate: 98 },
    { name: 'Assessment Agent', status: 'active', queue: 5, processed: 245, avgTime: '1.8s', successRate: 99 },
    { name: 'Profile Agent', status: 'active', queue: 2, processed: 89, avgTime: '3.1s', successRate: 97 },
    { name: 'Reporting Agent', status: 'processing', queue: 1, processed: 42, avgTime: '8.5s', successRate: 100 },
  ],
  reports: [
    { id: '1', title: 'Example Department Report', type: 'department', generated_at: new Date().toISOString() },
  ],
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
      await new Promise(r => setTimeout(r, 500)); // Visual completion

      // 2. Download Report
      if (reportId) {
        try {
          console.log(`[Manager] Starting download for report ${reportId}, token length: ${token.length}`);
          const blob = await api.report.download(reportId, token);

          console.log(`[Manager] Got blob: ${blob.size} bytes, type: ${blob.type}`);

          // Check for JSON error response disguised as blob
          if (blob.type.includes('application/json') || blob.size < 200) {
            const text = await blob.text();
            try {
              const json = JSON.parse(text);
              if (json.message || json.detail) {
                throw new Error(json.message || json.detail || "Server returned an error");
              }
            } catch (e) {
              // Not valid JSON, or no error message, proceed checking type
              if (blob.type.includes('application/json')) {
                throw new Error(`Server returned JSON instead of PDF: ${text.substring(0, 100)}`);
              }
            }
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          // Default filename based on type
          const isPdf = blob.type === 'application/pdf';
          const ext = isPdf ? 'pdf' : 'json';
          a.download = `maverick_${type}_${reportId}.${ext}`;
          document.body.appendChild(a);
          a.click();

          // Cleanup with delay for browser compat
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 2000);

        } catch (e: any) {
          console.error("[Manager] Download error details:", e);
          alert(`Download failed: ${e.message || "Unknown error"}`);
        }
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
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
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
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              const ext = 'pdf'; // defaulting to pdf since we know it is
                              const filename = `maverick_${report.type}_${lastGeneratedReportId}.${ext}`;
                              fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/reports/${lastGeneratedReportId}/download`, {
                                headers: { Authorization: `Bearer ${token}` },
                              }).then(r => {
                                if (!r.ok) throw new Error(`Server returned ${r.status}`);
                                return r.blob();
                              }).then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                              }).catch(err => {
                                console.error(err);
                                alert(`Download failed: ${err.message}. Please check console.`);
                              });
                            }}
                            className="block mt-2 text-xs text-center text-purple-600 underline hover:text-purple-800"
                          >
                            Click here if download didn't start
                          </a>
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
                        <button className="px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg">Take Action</button>
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
    </div>
  );
}
