'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  Sparkles,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Users,
  Award,
  Calendar,
  BarChart3,
  Code,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Play,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [stats, setStats] = useState({
    freshers: 0,
    accuracy: 0,
    timeSaved: 0,
    satisfaction: 0,
  });

  // Animated stats counter
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      freshers: 500,
      accuracy: 95,
      timeSaved: 60,
      satisfaction: 92,
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setStats({
        freshers: Math.round((targets.freshers * step) / steps),
        accuracy: Math.round((targets.accuracy * step) / steps),
        timeSaved: Math.round((targets.timeSaved * step) / steps),
        satisfaction: Math.round((targets.satisfaction * step) / steps),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized curricula adapted in real-time based on individual progress and learning patterns',
      color: 'from-purple-500 to-pink-500',
      stats: '95% accuracy',
    },
    {
      icon: Calendar,
      title: 'Autonomous Scheduling',
      description: 'Intelligent task scheduling optimized for each fresher\'s capacity and learning velocity',
      color: 'from-blue-500 to-cyan-500',
      stats: '24/7 automation',
    },
    {
      icon: BarChart3,
      title: 'Predictive Analytics',
      description: 'Early risk detection with ML-powered insights to prevent fresher dropout',
      color: 'from-green-500 to-emerald-500',
      stats: '85% risk prediction',
    },
    {
      icon: Code,
      title: 'Automated Grading',
      description: 'Instant code assessment with detailed feedback using AST analysis and rubrics',
      color: 'from-orange-500 to-red-500',
      stats: 'Instant feedback',
    },
    {
      icon: Target,
      title: 'Adaptive Curriculum',
      description: 'Dynamic content adjustment based on real-time performance and skill gaps',
      color: 'from-indigo-500 to-purple-500',
      stats: 'Real-time updates',
    },
  ];

  const agentShowcase = [
    { name: 'Onboarding Agent', role: 'Creates personalized 90-day plans', icon: Rocket, color: 'text-blue-600' },
    { name: 'Assessment Agent', role: 'Grades code & provides feedback', icon: CheckCircle2, color: 'text-green-600' },
    { name: 'Analytics Agent', role: 'Predicts risks & trends', icon: TrendingUp, color: 'text-purple-600' },
    { name: 'Profile Agent', role: 'Builds skill embeddings', icon: Users, color: 'text-orange-600' },
    { name: 'Reporting Agent', role: 'Generates insights', icon: Award, color: 'text-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center group-hover:animate-glow transition-all">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-maverick-600 to-maverick-800 bg-clip-text text-transparent">
                MaverickAI
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-maverick-600 font-medium transition-colors">Features</a>
              <a href="#agents" className="text-gray-600 hover:text-maverick-600 font-medium transition-colors">AI Agents</a>
              <a href="#stats" className="text-gray-600 hover:text-maverick-600 font-medium transition-colors">Impact</a>
              <Link href="/login" className="btn-primary">
                Get Started
                <ChevronRight className="w-4 h-4 ml-1 inline" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-maverick-200 rounded-full blur-3xl animate-float opacity-50"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-200 rounded-full blur-3xl animate-float opacity-50" style={{animationDelay: '1s'}}></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-maverick-50 to-purple-50 rounded-full text-maverick-700 text-sm font-semibold mb-8 animate-fade-in-up border border-maverick-200">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Onboarding Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 animate-fade-in-up">
            Transform Fresher
            <br />
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-maverick-500 via-purple-500 to-cyan-500 animate-gradient">
              Onboarding with AI
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-fade-in-up leading-relaxed">
            Autonomous scheduling, intelligent grading, predictive analytics, and adaptive learning
            — all powered by our <span className="font-semibold text-maverick-600">5-agent AI system</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up">
            <Link href="/login" className="btn-primary group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="btn-secondary group">
              <Play className="w-5 h-5 mr-2 inline" />
              Watch Demo
            </button>
          </div>

          {/* Live Stats */}
          <div id="stats" className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: 'Freshers Trained', value: stats.freshers, suffix: '+', icon: Users },
              { label: 'Accuracy', value: stats.accuracy, suffix: '%', icon: Target },
              { label: 'Time Saved', value: stats.timeSaved, suffix: '%', icon: Zap },
              { label: 'Satisfaction', value: stats.satisfaction, suffix: '%', icon: Award },
            ].map((stat, idx) => (
              <div key={idx} className="stat-card group" style={{animationDelay: `${idx * 100}ms`}}>
                <stat.icon className="w-8 h-8 text-maverick-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced Interactive */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features, <span className="text-maverick-600">Zero Effort</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              AI that works 24/7 so your team doesn't have to
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Feature list */}
            <div className="space-y-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveFeature(idx)}
                    className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                      activeFeature === idx
                        ? 'border-maverick-500 bg-maverick-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-maverick-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                          <span className="badge-primary">{feature.stats}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Feature visual */}
            <div className="relative">
              <div className="glass-card p-8 rounded-2xl">
                <div className="aspect-square bg-gradient-to-br from-maverick-100 to-purple-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${features[activeFeature].color} opacity-20`}></div>
                  {React.createElement(features[activeFeature].icon, {
                    className: 'w-32 h-32 text-maverick-600 relative z-10 animate-float',
                  })}
                </div>
                <div className="mt-6 text-center">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">{features[activeFeature].title}</h4>
                  <p className="text-gray-600">{features[activeFeature].description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section id="agents" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-maverick-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Your <span className="text-maverick-600">AI Workforce</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              5 specialized agents working in harmony to deliver exceptional onboarding
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {agentShowcase.map((agent, idx) => {
              const Icon = agent.icon;
              return (
                <div key={idx} className="card-hover text-center group" style={{animationDelay: `${idx * 100}ms`}}>
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white flex items-center justify-center border-2 border-gray-100 group-hover:border-maverick-200 transition-all group-hover:scale-110`}>
                    <Icon className={`w-8 h-8 ${agent.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-bg rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Onboarding?</h2>
              <p className="text-xl mb-8 text-white/90">
                Join leading companies using AI to train the next generation
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/login" className="bg-white text-maverick-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all hover:shadow-xl hover:-translate-y-1">
                  Start Free Trial
                </Link>
                <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all">
                  Schedule Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="w-8 h-8 text-maverick-400" />
            <span className="text-2xl font-bold">MaverickAI</span>
          </div>
          <p className="text-gray-400 mb-6">AI-Powered Onboarding Platform for the Future</p>
          <p className="text-gray-500 text-sm">
            © 2024 MaverickAI. Built for Panimalar Hackathon with ❤️
          </p>
        </div>
      </footer>
    </div>
  );
}
