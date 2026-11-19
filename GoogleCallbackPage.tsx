// Google OAuth Callback Handler — processes token from server redirect
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/brand/Logo.js';
import { Loader2 } from 'lucide-react';

export const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirectTo = params.get('redirectTo') || '/';

    if (token) {
      localStorage.setItem('econvyx_token', token);
      window.location.href = redirectTo;
    } else {
      navigate('/signin?error=google_failed', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#050722] flex flex-col items-center justify-center gap-6">
      <Logo variant="transparent" size="lg" layout="stacked" />
      <div className="flex items-center gap-3 text-slate-300 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-[#12B8A6]" />
        Completing Google Sign-In…
      </div>
    </div>
  );
};
