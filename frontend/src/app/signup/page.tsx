'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Sparkles, ShieldCheck } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import { useAuth } from '@/lib/auth-context';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });

export default function SignupPage() {
  const router = useRouter();
  const { register, user, isLoading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
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
    setError(null);

    if (formData.password !== formData.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
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

        <h1 className={`lp-heading ${playfair.className}`}>Create your account</h1>
        <p className="lp-subhead">
          AI-led onboarding with a calm, Sarvam-inspired surface.
        </p>

        <div className="lp-divider">
          <span><ShieldCheck size={16} /> Instant access</span>
        </div>

        {error && <div className="lp-error">{error}</div>}

        <form className="lp-form" onSubmit={handleSubmit}>
          <div className="lp-grid-2">
            <div>
              <label>First name</label>
              <div className="lp-input-wrap">
                <User className="lp-input-icon" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  placeholder="Alex"
                />
              </div>
            </div>
            <div>
              <label>Last name</label>
              <div className="lp-input-wrap">
                <User className="lp-input-icon" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          <div>
            <label>Email</label>
            <div className="lp-input-wrap">
              <Mail className="lp-input-icon" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="you@company.com"
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
                placeholder="••••••••"
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
          </div>

          <div>
            <label>Confirm password</label>
            <div className="lp-input-wrap">
              <Lock className="lp-input-icon" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={formData.confirm}
                onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                required
                placeholder="••••••••"
              />
              <button
                type="button"
                className="lp-eye"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="lp-forgot" style={{ justifyContent: 'flex-start' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <input type="checkbox" required />
              I agree to the terms & privacy policy
            </label>
          </div>

          <button type="submit" className="lp-btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
            {!isLoading && <ArrowRight className="lp-btn-icon" />}
          </button>
        </form>

        <p className="lp-bottom-text">
          Already have an account?{' '}
          <button type="button" onClick={() => router.push('/login')}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
