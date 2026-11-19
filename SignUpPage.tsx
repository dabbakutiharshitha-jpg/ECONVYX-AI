// ECONVYX AI — Sign Up Page
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/brand/Logo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const passwordStrength = (() => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 8) return { level: 1, label: 'Too short', color: 'bg-red-500' };
    if (password.length < 12 && !/[^a-zA-Z0-9]/.test(password)) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return { level: 4, label: 'Strong', color: 'bg-green-500' };
    return { level: 3, label: 'Good', color: 'bg-[#12B8A6]' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      addToast({ type: 'warning', title: 'Required Fields', message: 'Please fill in all fields.' });
      return;
    }
    if (password.length < 8) {
      addToast({ type: 'warning', title: 'Weak Password', message: 'Password must be at least 8 characters.' });
      return;
    }
    try {
      setIsLoading(true);
      await register(email.trim(), fullName.trim(), password);
      addToast({ type: 'success', title: 'Account Created!', message: 'Welcome to ECONVYX AI. Let\'s set up your workspace.' });
      navigate('/onboarding');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: err.message || 'Could not create account.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050722] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Logo variant="transparent" size="lg" layout="stacked" />
        </div>
        <p className="text-sm text-[#69E0D0] font-medium tracking-wide mt-1">
          Turn financial complexity into clarity.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#101C2C] py-8 px-6 shadow-2xl rounded-2xl border border-[#17283D] sm:px-10 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">Create your free account</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Already have an account?{' '}
              <Link to="/signin" className="text-[#12B8A6] hover:text-[#69E0D0] font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Arjun Sharma"
                className="w-full px-3.5 py-2.5 text-sm bg-[#17283D] border border-[#1E3A56] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#12B8A6] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcompany.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#17283D] border border-[#1E3A56] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#12B8A6] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#17283D] border border-[#1E3A56] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#12B8A6] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.level >= n ? passwordStrength.color : 'bg-[#17283D]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">{passwordStrength.label}</p>
                </div>
              )}
            </div>

            <div className="bg-[#0d1726] rounded-xl p-3 space-y-1.5 border border-[#17283D]">
              {['No credit card required', 'Start free, upgrade when ready', 'Your data stays private & secure'].map((benefit) => (
                <div key={benefit} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#12B8A6] shrink-0" />
                  <span className="text-xs text-slate-400">{benefit}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#12B8A6] hover:bg-[#0ea596] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-150 active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
