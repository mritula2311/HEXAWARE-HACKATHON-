'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Building2, Calendar, ArrowLeft, Save, Edit2,
  GraduationCap, Briefcase, Code2, Award, BookOpen
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  employee_id: string;
  join_date: string;
  education: string;
  degree: string;
  university: string;
  graduation_year: number;
  certifications: string[];
  preferred_learning_style: string;
  daily_capacity_hours: number;
  skills: { name: string; level: number }[];
}

const getDemoProfile = (): ProfileData => ({
  first_name: 'Arun',
  last_name: 'Kumar',
  email: 'fresher1@maverick.ai',
  department: 'Engineering',
  employee_id: 'HEX2025-001',
  join_date: '2025-01-06',
  education: 'B.Tech',
  degree: 'Computer Science',
  university: 'Anna University',
  graduation_year: 2024,
  certifications: ['AWS Cloud Practitioner', 'Python Certified'],
  preferred_learning_style: 'hands-on',
  daily_capacity_hours: 6,
  skills: [
    { name: 'Python', level: 72 },
    { name: 'JavaScript', level: 58 },
    { name: 'SQL', level: 65 },
    { name: 'Docker', level: 35 },
    { name: 'REST API', level: 55 },
    { name: 'Git', level: 70 },
  ],
});

export default function FresherProfilePage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(getDemoProfile());
  const [editForm, setEditForm] = useState<ProfileData>(getDemoProfile());
  const [showSkillsFeedback, setShowSkillsFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      const merged = {
        ...getDemoProfile(),
        first_name: user.first_name || getDemoProfile().first_name,
        last_name: user.last_name || getDemoProfile().last_name,
        email: user.email || getDemoProfile().email,
        department: user.department || getDemoProfile().department,
      };
      setProfile(merged);
      setEditForm(merged);
    }
  }, [user, token]);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const getSkillColor = (level: number) => {
    if (level >= 70) return 'bg-green-500';
    if (level >= 50) return 'bg-blue-500';
    if (level >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">View and manage your information</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Avatar & Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">First Name</label>
                    <input value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Last Name</label>
                    <input value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">{profile.first_name} {profile.last_name}</h2>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {profile.email}</span>
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {profile.department}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {profile.employee_id}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {profile.join_date}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Education */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-indigo-600" /> Education
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Degree</label>
                  <input value={editForm.degree} onChange={e => setEditForm({ ...editForm, degree: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">University</label>
                  <input value={editForm.university} onChange={e => setEditForm({ ...editForm, university: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Graduation Year</label>
                  <input type="number" value={editForm.graduation_year} onChange={e => setEditForm({ ...editForm, graduation_year: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Qualification</span><span className="font-medium">{profile.education} - {profile.degree}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">University</span><span className="font-medium">{profile.university}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Graduation Year</span><span className="font-medium">{profile.graduation_year}</span></div>
              </div>
            )}
          </div>

          {/* Learning Preferences */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Learning Preferences
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Learning Style</label>
                  <select value={editForm.preferred_learning_style} onChange={e => setEditForm({ ...editForm, preferred_learning_style: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option value="visual">Visual</option>
                    <option value="reading">Reading/Writing</option>
                    <option value="hands-on">Hands-on</option>
                    <option value="auditory">Auditory</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Daily Capacity (hours)</label>
                  <input type="number" min="1" max="10" value={editForm.daily_capacity_hours} onChange={e => setEditForm({ ...editForm, daily_capacity_hours: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Learning Style</span><span className="font-medium capitalize">{profile.preferred_learning_style}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Daily Capacity</span><span className="font-medium">{profile.daily_capacity_hours} hours</span></div>
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-indigo-600" /> Certifications
            </h3>
            <div className="space-y-2">
              {profile.certifications.map((cert, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-800">{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Code2 className="w-5 h-5 text-indigo-600" /> Skills
            </h3>
            <div className="space-y-3">
              {profile.skills.map((skill, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{skill.name}</span>
                    <span className="text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={cn('h-2 rounded-full transition-all', getSkillColor(skill.level))} style={{ width: `${skill.level}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Skills Development Section - Collapsible */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white">Skill Development</h2>
              </div>
              <span className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">LIVE AGENTS</span>
            </div>
          </div>

          {!showSkillsFeedback ? (
            // Compact View
            <div className="border-l-4 border-purple-600 bg-purple-50 p-6">
              <p className="text-sm text-gray-600 italic mb-4">"Excellent progress! Python and React skills are improving rapidly. Keep practicing DSA."</p>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-2xl font-bold text-purple-600">18</p>
                  <p className="text-xs text-gray-600">Skills</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">12</p>
                  <p className="text-xs text-gray-600">Improving</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">3</p>
                  <p className="text-xs text-gray-600">Focus Area</p>
                </div>
              </div>
              <button
                onClick={() => setShowSkillsFeedback(true)}
                className="w-full mt-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
              >
                More Details
              </button>
            </div>
          ) : (
            // Expanded View
            <div className="border-l-4 border-purple-600 bg-purple-50 p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Skill Development Analysis</h3>
                  <p className="text-sm text-gray-600 italic">"Excellent progress! Python and React skills are improving rapidly. Keep practicing DSA."</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center py-4 border-y border-purple-200">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">18</p>
                    <p className="text-xs text-gray-600">Total Skills</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">12</p>
                    <p className="text-xs text-gray-600">Improving</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                    <p className="text-xs text-gray-600">Focus Areas</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">✓ Strengths:</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Strong Python fundamentals and clean code practices</li>
                    <li>• Excellent React component architecture knowledge</li>
                    <li>• Quick learner with consistent improvement trajectory</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2">⚡ AI Suggestions:</h4>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Focus on Data Structures & Algorithms for next 2 weeks</li>
                    <li>• Practice system design interview questions</li>
                    <li>• Consider advanced JavaScript patterns and optimization techniques</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => setShowSkillsFeedback(false)}
                className="w-full mt-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition"
              >
                Collapse
              </button>
            </div>
          )}
        </div>

        {/* Profile Insights Section */}
        <div className="lg:col-span-2">
        </div>
      </main>
    </div>
  );
}
