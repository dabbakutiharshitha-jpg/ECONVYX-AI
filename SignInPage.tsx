// ECONVYX AI — Sign In Page
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/brand/Logo.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast({ type: 'warning', title: 'Required Fields', message: 'Please enter your email and password.' });
      return;
    }
    try {
      setIsLoading(true);
      await login(email.trim(), password);
      addToast({ type: 'success', title: 'Welcome back!', message: 'Signed in to ECONVYX AI.' });
      navigate('/');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Sign In Failed', message: err.message || 'Invalid email or password.' });
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
            <h2 className="text-lg font-bold text-white">Sign in to your workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#12B8A6] hover:text-[#69E0D0] font-semibold transition-colors">
                Create one free
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#12B8A6] hover:bg-[#0ea596] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-150 active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
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
