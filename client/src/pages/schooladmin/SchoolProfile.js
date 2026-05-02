import React, { useState, useEffect } from 'react';
import { Save, Loader2, School, Upload, Globe, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/LoadingSpinner';

export default function SchoolProfilePage() {
  const { user, updateUser } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', website: '', description: '',
    street: '', city: '', state: '', country: '', zipCode: ''
  });

  useEffect(() => {
    api.get('/schools/me')
      .then(r => {
        const s = r.data.data;
        setSchool(s);
        setForm({
          name: s.name || '', email: s.email || '', phone: s.phone || '',
          website: s.website || '', description: s.description || '',
          street: s.address?.street || '', city: s.address?.city || '',
          state: s.address?.state || '', country: s.address?.country || '',
          zipCode: s.address?.zipCode || ''
        });
        setLogoPreview(s.logo || '');
      })
      .catch(() => toast.error('Failed to load school profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('website', form.website);
      fd.append('description', form.description);
      fd.append('address[street]', form.street);
      fd.append('address[city]', form.city);
      fd.append('address[state]', form.state);
      fd.append('address[country]', form.country);
      fd.append('address[zipCode]', form.zipCode);
      if (logoFile) fd.append('logo', logoFile);

      const { data } = await api.put('/schools/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSchool(data.data);
      toast.success('School profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const F = (k) => ({ value: form[k], onChange: e => setForm(f => ({ ...f, [k]: e.target.value })) });

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-primary-500" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">School Profile</h1>
          <p className="page-subtitle">Manage your school's information and settings</p>
        </div>
        {school && <StatusBadge status={school.status} />}
      </div>

      {/* Status banner */}
      {school?.status === 'pending' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Approval</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Your school is awaiting review from the Super Admin. You'll be notified once approved.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo + basic info */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <School size={18} className="text-primary-500" /> Basic Information
          </h2>

          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            {/* Logo upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-600 overflow-hidden flex items-center justify-center bg-surface-50 dark:bg-surface-800">
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                  : <School size={32} className="text-slate-300 dark:text-slate-600" />
                }
              </div>
              <label className="btn-secondary cursor-pointer text-xs">
                <Upload size={13} /> Upload Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              <p className="text-[10px] text-slate-400 text-center">PNG, JPG, WebP<br />Max 5MB</p>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group sm:col-span-2">
                <label className="label">School Name *</label>
                <input className="input" placeholder="Greenwood International School" required {...F('name')} />
              </div>
              <div className="form-group">
                <label className="label">School Email *</label>
                <input type="email" className="input" placeholder="info@school.com" required {...F('email')} />
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input className="input" placeholder="+1 234 567 8900" {...F('phone')} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label flex items-center gap-1"><Globe size={13} /> Website</label>
              <input className="input" placeholder="https://yourschool.com" {...F('website')} />
            </div>
            <div className="form-group sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Brief description of your school..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                maxLength={500}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{form.description.length}/500</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <MapPin size={18} className="text-primary-500" /> Address
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="label">Street Address</label>
              <input className="input" placeholder="123 Education Lane" {...F('street')} />
            </div>
            <div className="form-group">
              <label className="label">City</label>
              <input className="input" placeholder="New York" {...F('city')} />
            </div>
            <div className="form-group">
              <label className="label">State / Province</label>
              <input className="input" placeholder="New York" {...F('state')} />
            </div>
            <div className="form-group">
              <label className="label">Country</label>
              <input className="input" placeholder="United States" {...F('country')} />
            </div>
            <div className="form-group">
              <label className="label">ZIP / Postal Code</label>
              <input className="input" placeholder="10001" {...F('zipCode')} />
            </div>
          </div>
        </div>

        {/* Admin info (read-only) */}
        {school?.adminId && (
          <div className="card p-6">
            <h2 className="font-display font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Mail size={18} className="text-primary-500" /> Admin Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Admin Name</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{school.adminId.name}</p>
              </div>
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Admin Email</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{school.adminId.email}</p>
              </div>
              <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Last Login</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {school.adminId.lastLogin
                    ? new Date(school.adminId.lastLogin).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary px-8" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
