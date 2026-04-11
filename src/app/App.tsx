import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Journal } from './components/Journal';
import { AICoach } from './components/AICoach';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';

function AppContent() {
  const { token } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'journal' | 'coach'>('dashboard');

  if (!token) return <AuthPage />;

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at top, var(--accent) 0%, var(--background) 50%)',
      }}
    >
      <Navigation activeView={activeView} onNavigate={setActiveView} />

      <main>
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'journal' && <Journal />}
        {activeView === 'coach' && <AICoach />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
