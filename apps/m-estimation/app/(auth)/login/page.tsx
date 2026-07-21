'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, supabase } from '@kealee/auth/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/estimates';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await signIn(email, password);
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth/callback' },
      });
      if (error) throw error;
    } catch (err: any) { setError(err.message || 'Failed to sign in with Google'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-amber-800 to-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/kealee-logo-600w.png"
            alt="Kealee"
            className="h-28 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Estimation Portal</h1>
          <p className="text-amber-200">Sign in to manage your estimates</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>)}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" autoFocus required className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 transition-all">{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>
          <div className="my-6 flex items-center"><div className="flex-1 border-t border-gray-200" /><span className="px-4 text-sm text-gray-400">or</span><div className="flex-1 border-t border-gray-200" /></div>
          <button onClick={handleGoogleLogin} className="w-full py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3 text-gray-700 font-medium">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Continue with Google
          </button>
          <p className="mt-6 text-center text-sm text-gray-500">Don&apos;t have an account? <a href="/signup" className="text-amber-600 hover:text-amber-700 font-semibold">Sign up</a></p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-orange-900 via-amber-800 to-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
