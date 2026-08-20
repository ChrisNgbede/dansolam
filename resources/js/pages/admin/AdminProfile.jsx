import React, { useState, useEffect } from 'react';
import { toast as systemToast } from '../../components/ui/ToastProvider';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../hooks/useAuth';
import { Loader2, Check, User, Mail, Lock, Shield } from 'lucide-react';

export default function AdminProfile() {
  const { admin, setAdmin } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Populate state on load
  useEffect(() => {
    if (admin) {
      setName(admin.name || '');
      setEmail(admin.email || '');
    }
  }, [admin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    if (password && password !== passwordConfirmation) {
      setErrorMsg('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          password_confirmation: password ? passwordConfirmation : undefined,
        })
      });
      
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        const message = data.message || 'Profile updated successfully!';
        setSuccessMsg(message);
        systemToast.success(message);
        setAdmin(data.data);
        // Reset password fields
        setPassword('');
        setPasswordConfirmation('');
      } else {
        const message = data.message || 'Failed to update profile.';
        setErrorMsg(message);
        systemToast.error(message);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Network error updating your profile details.');
      systemToast.error('Network error updating your profile details.');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
      {/* Title block */}
      <div>
        <h1 className="font-serif font-bold text-2xl text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Profile Settings
        </h1>
        <p className="text-xs text-gray-400 mt-1 dark:text-gray-400">
          Modify your authorized administrator details, security credentials, and login email.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-gray-750 shadow-xs flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Status Message Banners */}
          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-255 dark:border-emerald-900 text-emerald-700 dark:text-emerald-450 rounded-2xl p-4 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-255 dark:border-red-900 text-red-700 dark:text-red-450 rounded-2xl p-4 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider dark:text-gray-400">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3.5 py-2.5 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g. Fatima Lawal"
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider dark:text-gray-400">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3.5 py-2.5 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g. admin@dansolam.com"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Role Pill - Display Only */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider dark:text-gray-400">
              Access Permission Level (Role)
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-gray-850 dark:text-gray-200 capitalize">
                {admin?.role?.name || "Owner"}
              </span>
              <span className="text-[9px] text-gray-400 font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15 ml-auto">
                System Authorized
              </span>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-700 my-1" />

          {/* Password Settings Section */}
          <div>
            <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-white">Security Update (Optional)</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-555 mt-0.5">Leave password fields empty to retain your current credentials.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider dark:text-gray-400">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3.5 py-2.5 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Min. 6 characters"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider dark:text-gray-400">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="px-3.5 py-2.5 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:border-primary text-xs bg-[#FAF9F6] text-gray-800 shadow-3xs w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Repeat new password"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all duration-300 uppercase tracking-wider cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
