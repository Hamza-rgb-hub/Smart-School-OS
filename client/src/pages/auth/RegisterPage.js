import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff, Loader2, Building2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const initialForm = {
  name: '', email: '', password: '', confirmPassword: '',
  schoolName: '', schoolEmail: '', schoolPhone: '',
  street: '', city: '', state: '', country: ''
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = e => {
    setError('');
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const validateStep1 = () => {
    if (!form.name.trim()) { setError('Your name is required'); return false; }
    if (!form.email.trim()) { setError('Email is required'); return false; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return false; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.schoolName.trim()) { setError('School name is required'); return false; }
    if (!form.schoolEmail.trim()) { setError('School email is required'); return false; }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password,
        schoolName: form.schoolName, schoolEmail: form.schoolEmail, schoolPhone: form.schoolPhone,
        schoolAddress: { street: form.street, city: form.city, state: form.state, country: form.country }
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-5">
        <CheckCircle size={32} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-2">Registration Submitted!</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Your school registration is <strong>pending approval</strong>. You'll be able to log in once a Super Admin approves your application.
      </p>
      <Link to="/login" className="btn-primary">Go to Login</Link>
    </div>
  );

  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-glow mb-4">
          <Building2 size={26} className="text-white" />
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Register Your School</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create your school's account on Smart School OS</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step >= s ? 'bg-primary-600 text-white' : 'bg-surface-200 dark:bg-surface-700 text-slate-400'}`}>{s}</div>
            {s < 2 && <div className={`h-px w-12 transition-all ${step >= 2 ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="card p-6 shadow-card-md">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Admin Account Details</h3>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="admin@yourschool.com" />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} className="input pr-10" placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Confirm Password</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="input" placeholder="Repeat password" />
            </div>
            <button type="button" onClick={handleNext} className="btn-primary w-full py-2.5">Next: School Details →</button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">School Information</h3>
            <div className="form-group">
              <label className="label">School Name *</label>
              <input name="schoolName" value={form.schoolName} onChange={handleChange} className="input" placeholder="Greenwood International School" />
            </div>
            <div className="form-group">
              <label className="label">School Email *</label>
              <input type="email" name="schoolEmail" value={form.schoolEmail} onChange={handleChange} className="input" placeholder="info@yourschool.com" />
            </div>
            <div className="form-group">
              <label className="label">Phone Number</label>
              <input name="schoolPhone" value={form.schoolPhone} onChange={handleChange} className="input" placeholder="+1 234 567 8900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">City</label>
                <input name="city" value={form.city} onChange={handleChange} className="input" placeholder="City" />
              </div>
              <div className="form-group">
                <label className="label">Country</label>
                <input name="country" value={form.country} onChange={handleChange} className="input" placeholder="Country" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setStep(1); setError(''); }} className="btn-secondary flex-1">← Back</button>
              <button type="submit" className="btn-primary flex-1 py-2.5" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
      </p>
    </div>
  );
}
