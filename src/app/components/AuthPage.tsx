import { useState } from 'react';
import { Heart, Mail, Lock, User, AlertCircle, Key } from 'lucide-react';
import { apiClient } from '../../../api-client';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [coupleId, setCoupleId] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use the auth context directly
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        const data = await apiClient.signup({ email, password, coupleId });
        login(data.token || 'demo-token', coupleId);
      } else {
        const data = await apiClient.login({ email, password, coupleId });
        login(data.token, coupleId);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at top, var(--accent) 0%, var(--background) 50%)',
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-3xl"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div className="flex items-center justify-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center"
            aria-hidden="true"
          >
            <Heart className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="mb-2">Welcome to Relmonition</h1>
          <p className="text-muted-foreground">
            {isSignup ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div
            className="mb-6 p-4 rounded-xl flex items-center gap-3"
            style={{
              background: 'var(--destructive)',
              border: '1px solid var(--border)',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your name"
                  required={isSignup}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="coupleId" className="block text-sm font-medium mb-2">Couple ID</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="coupleId"
                type="text"
                value={coupleId}
                onChange={(e) => setCoupleId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your shared ID"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
