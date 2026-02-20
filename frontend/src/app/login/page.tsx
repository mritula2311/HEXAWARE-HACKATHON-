'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, register, user, isLoading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'fresher',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      const redirectPath = user.role === 'fresher' ? '/dashboard/fresher' : '/dashboard/manager';
      router.push(redirectPath);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        // Login with API
        const result = await login(formData.email, formData.password);
        if (result.success && result.user) {
          // Redirect based on role
          const redirectPath = result.user.role === 'fresher' ? '/dashboard/fresher' : '/dashboard/manager';
          router.push(redirectPath);
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      } else {
        // Register with API
        const result = await register({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role as 'fresher' | 'manager' | 'admin',
          department: 'Engineering',
        });
        if (result.success) {
          router.push('/dashboard/fresher');
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Left Side - Form - Enhanced */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link href="/" className="flex items-center space-x-3 mb-8 group">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-maverick-600 to-maverick-800 bg-clip-text text-transparent">MaverickAI</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </h1>
          <p className="text-gray-600 mb-8 text-base sm:text-lg">
            {isLogin 
              ? 'Enter your credentials to access your dashboard'
              : 'Start your AI-powered learning journey'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Demo accounts: admin@maverick.ai/admin123 or fresher1@maverick.ai/fresher123
                  </p>
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in-right">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="input-field pl-10"
                      placeholder="John"
                      required={!isLogin}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="input-field pl-10"
                      placeholder="Doe"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-maverick-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Login as
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'fresher', label: 'Fresher', icon: '🎓' },
                    { value: 'manager', label: 'Manager', icon: '💼' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: option.value })}
                      className={cn(
                        "py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm flex flex-col items-center space-y-1 relative overflow-hidden group",
                        formData.role === option.value
                          ? "border-maverick-500 bg-gradient-to-br from-maverick-50 to-purple-50 text-maverick-700 shadow-lg scale-105"
                          : "border-gray-200 text-gray-600 hover:border-maverick-300 hover:shadow-md hover:scale-102"
                      )}
                    >
                      {formData.role === option.value && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                      )}
                      <span className="text-2xl">{option.icon}</span>
                      <span className="relative z-10">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-lg transition-all text-base",
                isLoading 
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed" 
                  : "btn-primary group"
              )}
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Please wait...</span>
                </div>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-maverick-600 font-semibold hover:text-maverick-700 hover:underline transition-all"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm font-semibold text-gray-500 mb-4">⚡ Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/dashboard/fresher"
                className="py-3 px-4 text-center text-sm font-medium border-2 border-gray-200 rounded-xl hover:border-maverick-300 hover:bg-maverick-50 hover:text-maverick-700 transition-all hover:shadow-md group"
              >
                <span>🎓 Fresher Demo</span>
              </Link>
              <Link
                href="/dashboard/manager"
                className="py-3 px-4 text-center text-sm font-medium border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all hover:shadow-md group"
              >
                <span>💼 Manager Demo</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Decorative - Enhanced */}
      <div className="hidden lg:flex w-1/2 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
        
        {/* Floating animated elements */}
        <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 right-20 w-32 h-32 bg-purple-300/20 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}} />
        
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white w-full">
          <div className="max-w-lg text-center">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center mx-auto mb-8 shadow-2xl animate-glow">
              <Brain className="w-14 h-14 text-white animate-float" />
            </div>
            <h2 className="text-4xl font-bold mb-4 animate-fade-in-up">
              AI-Powered Onboarding
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed animate-fade-in-up" style={{animationDelay: '200ms'}}>
              Experience personalized learning schedules, real-time progress tracking, 
              and intelligent risk prediction — all driven by multi-agent AI.
            </p>
            <div className="grid grid-cols-3 gap-4 animate-fade-in-up" style={{animationDelay: '400ms'}}>
              {[
                { value: '5', label: 'AI Agents', icon: '🤖' },
                { value: '24/7', label: 'Automation', icon: '⚡' },
                { value: '85%', label: 'Satisfaction', icon: '⭐' },
              ].map((stat, idx) => (
                <div key={idx} className="glass-card rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer group" style={{animationDelay: `${500 + idx * 100}ms`}}>
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-white/80 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
