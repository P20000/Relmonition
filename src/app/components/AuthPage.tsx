import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../../../api-client';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coupleId, setCoupleId] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { token, coupleId: cid } = await apiClient.login({ email, password, coupleId });
        login(token, cid);
      } else {
        await apiClient.signup({ email, password, coupleId });
        setIsLogin(true); // Switch to login after signup
      }
    } catch (err) {
      alert(isLogin ? 'Login failed' : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <form onSubmit={handleSubmit} className="p-8 border border-border rounded-xl bg-card w-full max-w-sm">
        <h2 className="mb-6 text-2xl font-bold">{isLogin ? 'Login' : 'Signup'}</h2>
        <input className="w-full mb-4 p-2 border border-input rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="w-full mb-4 p-2 border border-input rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <input className="w-full mb-6 p-2 border border-input rounded" type="text" placeholder="Couple ID" value={coupleId} onChange={e => setCoupleId(e.target.value)} required />
        <button className="w-full p-2 bg-primary text-primary-foreground rounded" type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Signup')}
        </button>
        <button type="button" className="w-full mt-4 text-sm text-muted-foreground" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Signup' : 'Already have an account? Login'}
        </button>
      </form>
    </div>
  );
}
