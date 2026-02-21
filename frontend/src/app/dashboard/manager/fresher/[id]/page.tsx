'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Building2, Calendar, TrendingUp,
  AlertTriangle, Award, BookOpen, Code2, CheckCircle2, Clock, Target
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api-service';
import { cn } from '@/lib/utils';

interface FresherDetail {
  id: string;
  name: string;
  email: string;
  department: string;
  employee_id: string;
  join_date: string;
  current_week: number;
  overall_progress: number;
  risk_level: string;
  risk_score: number;
  training: {
    quiz: { status: string; score: number | null; title: string };
    coding: { status: string; score: number | null; title: string };
    assignment: { status: string; score: number | null; title: string };
    certification: { status: string; progress: number; name: string };
  };
  workflow: { profile: boolean; quiz: boolean; coding: boolean; assignment: boolean; certification: boolean };
  skills: { name: string; level: number }[];
}

const getDemoFresher = (id: string): FresherDetail => ({
  id,
  name: '',
  email: '',
  department: '',
  employee_id: '',
  join_date: '',
  current_week: 1,
  overall_progress: 0,
  risk_level: 'low',
  risk_score: 0,
  training: {
    quiz: { status: 'pending', score: null, title: '' },
    coding: { status: 'pending', score: null, title: '' },
    assignment: { status: 'pending', score: null, title: '' },
    certification: { status: 'pending', progress: 0, name: '' },
  },
  workflow: { profile: false, quiz: false, coding: false, assignment: false, certification: false },
  skills: [],
});

export default function FresherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const fresherId = params.id as string;
  const [data, setData] = useState<FresherDetail>(getDemoFresher(fresherId));

  useEffect(() => {
    if (token && fresherId) {
      api.fresher.getProfile(fresherId, token).then(res => {
        if (res.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = res.data as any;
          setData(prev => ({
            ...prev,
            ...d,
            name: `${d.first_name || ''} ${d.last_name || ''}`.trim() || prev.name,
          }));
        }
      }).catch(() => {});
    }
  }, [token, fresherId]);

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = {
      completed: 'bg-green-100 text-green-700', in_progress: 'bg-blue-100 text-blue-700',
      pending: 'bg-gray-100 text-gray-700', not_started: 'bg-gray-100 text-gray-500',
    };
    return m[status] || 'bg-gray-100 text-gray-700';
  };

  const getRiskColor = (level: string) => {
    const m: Record<string, string> = { low: 'text-green-600', medium: 'text-yellow-600', high: 'text-orange-600', critical: 'text-red-600' };
    return m[level] || 'text-gray-600';
  };

  const workflowSteps = [
    { label: 'Profile Updated', done: data.workflow.profile },
    { label: 'Daily Quiz', done: data.workflow.quiz },
    { label: 'Coding Challenge', done: data.workflow.coding },
    { label: 'Assignment', done: data.workflow.assignment },
    { label: 'Certification', done: data.workflow.certification },
  ];
  const completedSteps = workflowSteps.filter(s => s.done).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/manager')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
            <p className="text-sm text-gray-500">{data.employee_id} &middot; {data.department}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", data.risk_level === 'low' ? 'bg-green-100 text-green-700' : data.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
              {data.risk_level} risk
            </span>
            <span className="text-sm text-gray-600">Week {data.current_week}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Overall Progress</span>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{data.overall_progress}%</div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-3">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" style={{ width: `${data.overall_progress}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Risk Score</span>
              <AlertTriangle className={cn("w-5 h-5", getRiskColor(data.risk_level))} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{data.risk_score}</div>
            <p className={cn("text-sm mt-1 capitalize font-medium", getRiskColor(data.risk_level))}>{data.risk_level} risk level</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Workflow Progress</span>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{completedSteps}/{workflowSteps.length}</div>
            <p className="text-sm text-gray-500 mt-1">steps completed today</p>
          </div>
        </div>

        {/* Training Status */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-600" /> Training Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Quiz', icon: Award, status: data.training.quiz.status, score: data.training.quiz.score, title: data.training.quiz.title },
              { label: 'Coding Challenge', icon: Code2, status: data.training.coding.status, score: data.training.coding.score, title: data.training.coding.title },
              { label: 'Assignment', icon: BookOpen, status: data.training.assignment.status, score: data.training.assignment.score, title: data.training.assignment.title },
              { label: 'Certification', icon: Award, status: data.training.certification.status, score: null, title: data.training.certification.name },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="p-4 border rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(item.status || 'pending'))}>{(item.status || 'pending').replace('_', ' ')}</span>
                  {item.score !== null && <p className="mt-2 text-2xl font-bold text-gray-900">{item.score}%</p>}
                  <p className="text-xs text-gray-500 mt-1">{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Progress Bar */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-blue-600" /> Real-Time Workflow Progress</h2>
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, i) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center text-center">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2", step.done ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 text-gray-400")}>
                    {step.done ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <span className={cn("text-xs font-medium", step.done ? "text-green-700" : "text-gray-500")}>{step.label}</span>
                </div>
                {i < workflowSteps.length - 1 && (
                  <div className={cn("flex-1 h-1 mx-2 rounded", step.done ? "bg-green-400" : "bg-gray-200")} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Code2 className="w-5 h-5 text-purple-600" /> Skills</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.skills.map((skill) => (
              <div key={skill.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{skill.name}</span>
                    <span className="text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={cn("h-2 rounded-full", skill.level >= 70 ? "bg-green-500" : skill.level >= 50 ? "bg-blue-500" : "bg-yellow-500")} style={{ width: `${skill.level}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
