'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PublicLayout from '@/components/public/PublicLayout';
import api from '@/lib/api';
import Link from 'next/link';

type Role = 'CUST_RESIDENTIAL' | 'CUST_COMMERCIAL' | 'SUBCONTRACTOR';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  skills: string;
  hourlyRate: string;
  address: string;
}

export default function RegisterPage() {
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('CUST_RESIDENTIAL');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    skills: '',
    hourlyRate: '',
    address: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.email) {
      newErrors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push('Please enter a valid email address');
    }

    if (!formData.password) {
      newErrors.push('Password is required');
    } else if (formData.password.length < 8) {
      newErrors.push('Password must be at least 8 characters');
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.push('Password must contain at least one uppercase letter');
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.push('Password must contain at least one lowercase letter');
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.push('Password must contain at least one number');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }

    if (role === 'SUBCONTRACTOR') {
      if (!formData.skills.trim()) {
        newErrors.push('Please enter at least one skill');
      }
      if (formData.hourlyRate && parseFloat(formData.hourlyRate) <= 0) {
        newErrors.push('Hourly rate must be a positive number');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        role,
      };

      if (role === 'SUBCONTRACTOR') {
        payload.skills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        if (formData.hourlyRate) {
          payload.hourlyRate = parseFloat(formData.hourlyRate);
        }
        // Note: In production, use geolocation API or address autocomplete
        payload.latitude = 51.5074;
        payload.longitude = -0.1278;
      } else {
        payload.address = formData.address;
      }

      const res = await api.post('/auth/register', payload);
      login(res.data.token, res.data.user);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      const serverErrors = err.response?.data?.errors || [];
      setErrors(serverErrors.length > 0 ? serverErrors : [message]);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  return (
    <PublicLayout>
      <section className="relative bg-slate-800 pb-16">
        {/* Subtle bottom gradient for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-slate-900/30 pointer-events-none" />
        
        <div className="flex items-center justify-center min-h-[70vh] py-12 relative z-10">
        <Card className="w-[450px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-slate-500 text-sm mt-1">Join Reactive today</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <ul className="text-red-700 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Account Type
              </label>
              <select
                id="role"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={loading}
              >
                <option value="CUST_RESIDENTIAL">Residential Customer</option>
                <option value="CUST_COMMERCIAL">Commercial Customer</option>
                <option value="SUBCONTRACTOR">Contractor</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Min. 8 characters"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {/* Password strength meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className={`h-1.5 flex-1 rounded transition-colors ${
                          i < passwordStrength ? strengthColors[Math.min(passwordStrength - 1, 4)] : 'bg-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className={`text-xs ${
                    passwordStrength <= 2 ? 'text-red-500' : 
                    passwordStrength <= 4 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {strengthLabels[Math.min(passwordStrength, 5)]}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Must include uppercase, lowercase, and a number
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className={formData.confirmPassword ? (
                    formData.password === formData.confirmPassword 
                      ? 'pr-10 border-green-500 focus:border-green-500' 
                      : 'pr-10 border-red-300 focus:border-red-400'
                  ) : ''}
                />
                {formData.confirmPassword && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {formData.password === formData.confirmPassword ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {role === 'SUBCONTRACTOR' && (
              <>
                <div className="space-y-2">
                  <label htmlFor="skills" className="text-sm font-medium">
                    Skills <span className="text-slate-400">(comma separated)</span>
                  </label>
                  <Input
                    id="skills"
                    placeholder="Plumbing, Electrical, Carpentry"
                    value={formData.skills}
                    onChange={(e) => updateField('skills', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="hourlyRate" className="text-sm font-medium">
                    Hourly Rate ($) <span className="text-slate-400">(optional)</span>
                  </label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => updateField('hourlyRate', e.target.value)}
                    placeholder="50.00"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {role.startsWith('CUST') && (
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address <span className="text-slate-400">(optional)</span>
                </label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Main St, City"
                  disabled={loading}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
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
