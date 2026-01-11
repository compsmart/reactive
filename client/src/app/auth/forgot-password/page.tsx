'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PublicLayout from '@/components/public/PublicLayout';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PublicLayout>
        <section className="relative bg-slate-800 pb-16">
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-900/30 pointer-events-none" />
          
          <div className="flex items-center justify-center min-h-[70vh] py-12 relative z-10">
            <Card className="w-[450px]">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-center mb-6">
                  If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                </p>
                <p className="text-slate-500 text-sm text-center mb-6">
                  The link will expire in 1 hour. If you don't see the email, check your spam folder.
                </p>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSubmitted(false);
                      setEmail('');
                    }}
                  >
                    Try a Different Email
                  </Button>
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
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
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <p className="text-slate-500 text-sm mt-1">
                Enter your email and we'll send you a reset link
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
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
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

