'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Mail, Lock, Sparkles } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import { useAuth } from '@/lib/auth-context';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });

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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      const redirectPath = user.role === 'fresher'
        ? '/dashboard/fresher'
        : user.role === 'admin'
          ? '/dashboard/admin'
          : '/dashboard/manager';
      router.push(redirectPath);
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success || !result.user) {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      } else {
        const result = await register({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'fresher',
          department: 'Engineering',
        });
        if (!result.success) {
          setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-login-wrapper">
      <div className="lp-login-blob" aria-hidden />

      <div className="lp-login-card">
        <div className="lp-logo-mark">
          <Sparkles className="lp-logo-icon" />
        </div>
        <div className="lp-logo-text">MaverickAI</div>
        <div className="lp-decor" aria-hidden />

        <h1 className={`lp-heading ${playfair.className}`}>
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="lp-subhead">
          A calm, elegant workspace for AI-led onboarding.
        </p>

        {error && (
          <div className="lp-error">{error}</div>
        )}

        <form className="lp-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="lp-grid-2">
              <div>
                <label>First name</label>
                <div className="lp-input-wrap">
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label>Last name</label>
                <div className="lp-input-wrap">
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label>Email</label>
            <div className="lp-input-wrap">
              <Mail className="lp-input-icon" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label>Password</label>
            <div className="lp-input-wrap">
              <Lock className="lp-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="lp-eye"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="lp-forgot">
              <button type="button">Forgot password?</button>
            </div>
          </div>

          <button type="submit" className="lp-btn-primary" disabled={isLoading}>
            {isLoading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
            {!isLoading && <ArrowRight className="lp-btn-icon" />}
          </button>

          <div className="lp-divider">
            <span>or</span>
          </div>

          <div className="lp-social">
            <button type="button">Continue with Google</button>
            <button type="button">Continue with GitHub</button>
          </div>
        </form>

        <p className="lp-bottom-text">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <style jsx global>{`
        .lp-login-wrapper {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, #F0EFF8, #E8E8F5);
          position: relative;
          padding: 24px;
          color: #4A4A4A;
        }
        .lp-login-blob {
          position: absolute;
          inset: 0;
          background: radial-gradient(65% 60% at 70% 0%, rgba(232,168,87,0.55), rgba(201,125,58,0));
          filter: blur(70px);
          pointer-events: none;
        }
        .lp-login-card {
          position: relative;
          width: min(480px, 100%);
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.08);
          padding: 32px 32px 28px;
          z-index: 1;
          overflow: hidden;
        }
        .lp-logo-mark {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #E8A857, #C97D3A);
          display: grid;
          place-items: center;
          color: #fff;
          margin-bottom: 10px;
        }
        .lp-logo-icon { width: 22px; height: 22px; }
        .lp-logo-text {
          font-weight: 800;
          font-size: 18px;
          color: #1A1A1A;
          letter-spacing: -0.01em;
        }
        .lp-decor {
          width: 64px;
          height: 6px;
          margin: 12px 0 18px;
          background: linear-gradient(90deg, #D4893A, #E8A857);
          border-radius: 999px;
        }
        .lp-heading {
          color: #1A1A1A;
          font-size: 32px;
          line-height: 1.2;
          margin: 4px 0 10px;
        }
        .lp-subhead {
          color: #4A4A4A;
          margin-bottom: 20px;
        }
        .lp-error {
          background: #fff2f2;
          color: #b42318;
          border: 1px solid #f5c2c0;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 16px;
          font-weight: 600;
        }
        .lp-form { display: grid; gap: 14px; }
        .lp-grid-2 { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        label {
          display: block;
          color: #4A4A4A;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .lp-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: #F2F2F7;
          border: 1px solid #DDDDE8;
          border-radius: 12px;
          padding: 10px 12px;
          transition: all 0.2s ease;
        }
        .lp-input-wrap:focus-within {
          border-color: #6B6BCC;
          box-shadow: 0 0 0 3px rgba(107,107,204,0.18);
        }
        .lp-input-wrap input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #1A1A1A;
          font-size: 15px;
        }
        .lp-input-icon {
          width: 18px;
          height: 18px;
          color: #6B6BCC;
          margin-right: 10px;
        }
        .lp-eye {
          background: none;
          border: none;
          color: #4A4A4A;
          display: grid;
          place-items: center;
          padding: 6px;
        }
        .lp-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: 6px;
        }
        .lp-forgot button {
          color: #6B6BCC;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .lp-btn-primary {
          width: 100%;
          background: #1C1C1E;
          color: #fff;
          border: 1px solid #1C1C1E;
          padding: 14px 16px;
          border-radius: 999px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 16px 30px rgba(28,28,30,0.22);
        }
        .lp-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .lp-btn-primary:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 18px 34px rgba(28,28,30,0.26); }
        .lp-btn-icon { width: 18px; height: 18px; }

        .lp-divider {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          color: #4A4A4A;
          gap: 12px;
          margin: 6px 0;
        }
        .lp-divider::before,
        .lp-divider::after {
          content: '';
          height: 1px;
          background: #E0E0EA;
        }

        .lp-social {
          display: grid;
          gap: 10px;
        }
        .lp-social button {
          width: 100%;
          background: #FFFFFF;
          border: 1px solid #DDDDE8;
          border-radius: 12px;
          padding: 12px;
          font-weight: 700;
          color: #1A1A1A;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lp-social button:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(0,0,0,0.08); }

        .lp-bottom-text {
          margin-top: 14px;
          text-align: center;
          color: #4A4A4A;
        }
        .lp-bottom-text button {
          color: #6B6BCC;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        @media (max-width: 600px) {
          .lp-login-card { padding: 26px; }
          .lp-nav-links, .lp-actions { display: none; }
        }
      `}</style>
    </div>
  );
}
