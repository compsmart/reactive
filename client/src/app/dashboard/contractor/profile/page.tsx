'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardLayout, ContractorSidebar } from '@/components/dashboard';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ContractorProfile {
  skills: string[];
  hourlyRate: number | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  isVerified: boolean;
}

interface UserProfile {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  mobile: string | null;
  role: string;
  contractorProfile: ContractorProfile | null;
}

export default function ContractorProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'SUBCONTRACTOR') {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/users/${user?.id}`);
      const data = res.data as UserProfile;
      setProfile(data);
      
      // Populate form
      setFirstName(data.firstName || '');
      setLastName(data.lastName || '');
      setPhone(data.phone || '');
      setMobile(data.mobile || '');
      setSkills(data.contractorProfile?.skills || []);
      setHourlyRate(data.contractorProfile?.hourlyRate?.toString() || '');
      setBio(data.contractorProfile?.bio || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${user?.id}`, {
        firstName,
        lastName,
        phone,
        mobile,
        contractorProfile: {
          skills,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          bio: bio || null
        }
      });
      alert('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      alert('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout sidebar={<ContractorSidebar />} allowedRoles={['SUBCONTRACTOR']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E86A33]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<ContractorSidebar />} allowedRoles={['SUBCONTRACTOR']}>
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-500">Manage your contractor profile and settings.</p>
          </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {(firstName?.[0] || user?.email?.[0] || '?').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {firstName} {lastName || profile?.email}
                  </h2>
                  <p className="text-slate-500">{profile?.email}</p>
                </div>
              </div>
              <div className="text-right">
                {profile?.contractorProfile?.isVerified ? (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    Pending Verification
                  </span>
                )}
                {(profile?.contractorProfile?.rating ?? 0) > 0 && (
                  <p className="mt-2 text-yellow-600">
                    ⭐ {profile?.contractorProfile?.rating?.toFixed(1)} rating
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="020 7946 0958"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mobile Number</label>
                <Input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="07700 000000"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={profile?.email || ''}
                disabled
                className="bg-slate-100"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Hourly Rate ($)</label>
              <Input
                type="number"
                min="0"
                step="0.50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g., 45.00"
              />
              <p className="text-xs text-slate-500 mt-1">Your standard hourly rate for jobs</p>
            </div>

            <div>
              <label className="text-sm font-medium">Skills</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill (e.g., Plumbing)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" onClick={handleAddSkill}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {skills.length === 0 && (
                  <span className="text-slate-400 text-sm">No skills added yet</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Bio / About Me</label>
              <textarea
                className="w-full p-2 border rounded-md min-h-[120px]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about yourself, your experience, and what makes you stand out..."
              />
              <p className="text-xs text-slate-500 mt-1">
                {bio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/contractor')}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

