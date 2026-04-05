import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Journal } from './components/Journal';
import { AICoach } from './components/AICoach';

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'journal' | 'coach'>('dashboard');

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