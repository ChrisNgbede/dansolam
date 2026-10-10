import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Users, User, Mail, Phone, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLiveValidation } from '../../hooks/useLiveValidation';
import { FieldMessage, PasswordStrength } from '../../components/ui/FieldMessage';
import * as rules from '../../utils/validators';

export default function BookFittingSessionModal({ isOpen, onClose }) {
  // Lock body scroll when BookFittingSessionModal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferred_date: todayStr,
    preferred_time: '10:00 AM',
    guests_count: 1,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const v = useLiveValidation(formData, {
    name: [rules.required('Enter your name.'), rules.maxLength(255)],
    email: [rules.required('Enter your email so we can confirm your booking.'), rules.email()],
    phone: [rules.required('Enter a phone number we can call to confirm.'), rules.phone()],
    preferred_date: [rules.required('Choose a date.'), rules.notInPast()],
    guests_count: [rules.numberBetween(1, 20, 'Choose between 1 and 20 guests.')],
    notes: [rules.maxLength(1000)],
  });

  const timeSlots = [
    '10:00 AM',
    '11:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM',
    '05:30 PM',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!v.validateAll()) return;
    setLoading(true);

    try {
      const res = await axios.post('/api/fitting-sessions', formData);
      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Your fitting session request has been submitted successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          preferred_date: todayStr,
          preferred_time: '10:00 AM',
          guests_count: 1,
          notes: '',
        });
        v.reset();
      }
    } catch (err) {
      if (err.response?.status === 422 && v.applyServerErrors(err.response.data?.errors)) return;
      setError(err.response?.data?.message || 'Failed to submit fitting session request. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain bg-black/75 backdrop-blur-md animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop Click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div onClick={e => e.stopPropagation()} className="relative z-10 w-full max-w-lg bg-white dark:bg-[#141414] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden border border-gray-100 dark:border-gray-800 my-auto">
        {/* Header bar */}
        <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-black p-6 text-white overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="font-serif text-2xl font-bold text-white">Book Skin & Spa Consultation</h3>
          <p className="text-xs text-gray-300 mt-1">Reserve a personalized skincare consultation or facial session with our expert aestheticians.</p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {successMsg ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif font-bold text-xl text-gray-900 dark:text-white">Request Confirmed!</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">{successMsg}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-bold text-xs rounded-full hover:bg-[#5D3E85] transition-all cursor-pointer shadow-md"
              >
                Close & Return
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" /> Full Name *
                </label>
                <input
                  {...v.bind('name')}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${v.stateClass('name')}`}
                />
                <FieldMessage className="mt-1.5" {...v.message('name')} />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address *
                  </label>
                  <input
                    {...v.bind('email')}
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="sarah@example.com"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${v.stateClass('email')}`}
                  />
                  <FieldMessage className="mt-1.5" {...v.message('email')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number *
                  </label>
                  <input
                    {...v.bind('phone')}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+44 7700 900123"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${v.stateClass('phone')}`}
                  />
                  <FieldMessage className="mt-1.5" {...v.message('phone')} />
                </div>
              </div>

              {/* Preferred Date & Guests */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Preferred Date *
                  </label>
                  <input
                    {...v.bind('preferred_date')}
                    type="date"
                    name="preferred_date"
                    min={todayStr}
                    value={formData.preferred_date}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${v.stateClass('preferred_date')}`}
                  />
                  <FieldMessage className="mt-1.5" {...v.message('preferred_date')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" /> Number of Guests
                  </label>
                  <input
                    {...v.bind('guests_count')}
                    type="number"
                    name="guests_count"
                    min="1"
                    max="10"
                    value={formData.guests_count}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${v.stateClass('guests_count')}`}
                  />
                  <FieldMessage className="mt-1.5" {...v.message('guests_count')} />
                </div>
              </div>

              {/* Preferred Time Slot */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> Preferred Time Slot *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setFormData((prev) => ({ ...prev, preferred_time: slot }))}
                      className={`py-2 text-[11px] font-semibold rounded-xl border transition-all cursor-pointer ${formData.preferred_time === slot
                          ? 'bg-[#5D3E85] border-[#5D3E85] text-white font-bold shadow-xs'
                          : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Requests / Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Skin Concerns & Routine Goals (Optional)
                </label>
                <textarea
                  {...v.bind('notes')}
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Tell us about your skin goals, specific concerns (e.g. acne, glow, hyperpigmentation), or desired spa rituals..."
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors ${v.stateClass('notes')}`}
                />
                <FieldMessage className="mt-1.5" {...v.message('notes', `${formData.notes.length}/1000`)} />
              </div>

              {/* Submit button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#5D3E85] hover:bg-[#EC268F] text-white font-extrabold text-xs rounded-full transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Consultation Booking
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
