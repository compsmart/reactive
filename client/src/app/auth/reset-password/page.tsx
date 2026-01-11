'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PublicLayout from '@/components/public/PublicLayout';
import api from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  // Validate token exists
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <PublicLayout>
        <section className="relative bg-slate-800 pb-16">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-900/30 pointer-events-none" />
          
          <div className="flex items-center justify-center min-h-[70vh] py-12 relative z-10">
            <Card className="w-[450px]">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Password Reset Complete</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Link href="/auth/login">
                  <Button className="w-full">
                    Sign In
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (!token) {
    return (
      <PublicLayout>
        <section className="relative bg-slate-800 pb-16">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-900/30 pointer-events-none" />
          
          <div className="flex items-center justify-center min-h-[70vh] py-12 relative z-10">
            <Card className="w-[450px]">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center mb-6">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <Link href="/auth/forgot-password">
                  <Button className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="relative bg-slate-800 pb-16">
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-900/30 pointer-events-none" />
        
        <div className="flex items-center justify-center min-h-[70vh] py-12 relative z-10">
          <Card className="w-[450px]">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create New Password</CardTitle>
              <p className="text-slate-500 text-sm mt-1">
                Enter your new password below
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    autoFocus
                  />
                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div 
                            key={i} 
                            className={`h-1 flex-1 rounded transition-colors ${
                              i < strength ? strengthColors[Math.min(strength - 1, 4)] : 'bg-slate-200'
                            }`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">
                        {strengthLabels[Math.min(strength, 5)]}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Must include uppercase, lowercase, and a number
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Passwords match
                    </p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !password || !confirmPassword || password !== confirmPassword}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <PublicLayout>
        <section className="relative bg-slate-800 pb-16">
          <div className="flex items-center justify-center min-h-[70vh] py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </section>
      </PublicLayout>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

