'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FresherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, token } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) {
      return;
    }

    // Redirect to login if not authenticated or wrong role
    if (!token || !user || user.role !== 'fresher') {
      console.log('[FRESHER-LAYOUT] Not authenticated or wrong role, redirecting to login');
      router.push('/login');
      return;
    }

    // Auth is valid, allow rendering
    console.log('[FRESHER-LAYOUT] Auth verified for user:', user.email);
    setIsReady(true);
  }, [isLoading, token, user, router]);

  // Show loading while auth is initializing or redirecting
  if (isLoading || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return children;
}
