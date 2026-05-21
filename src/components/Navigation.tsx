"use client";
import { LayoutDashboard, BookOpen, Brain, Menu, X, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import { LogoIcon } from './ui/LogoIcon';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

type NavigationProps = {
  activeView: 'dashboard' | 'journal' | 'coach' | 'settings' | 'personality';
  onNavigate: (view: 'dashboard' | 'journal' | 'coach' | 'settings' | 'personality') => void;
};

export function Navigation({ activeView, onNavigate }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal' as const, label: 'Journal', icon: BookOpen },
    { id: 'coach' as const, label: 'AI Coach', icon: Brain },
    { id: 'personality' as const, label: 'Personality', icon: User },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },

  ];

  return (
    <nav
      className="sticky top-0 z-50 mb-4 md:mb-8"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center" aria-hidden="true">
              <LogoIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl">Relmonition</h1>
              <p className="text-xs text-muted-foreground hidden md:block">
                Relationship Wellness Platform
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-6 py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${activeView === item.id
                    ? 'text-primary-foreground'
                    : 'text-foreground hover:bg-accent/50'
                    }`}
                  aria-current={activeView === item.id ? 'page' : undefined}
                >
                  <AnimatePresence>
                    {activeView === item.id && (
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0.8, scaleY: 0.95, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scaleX: 1, scaleY: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scaleX: 0.8, scaleY: 0.95, filter: 'blur(4px)' }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-primary rounded-xl shadow-lg -z-10"
                      />
                    )}
                  </AnimatePresence>
                  <div className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
            <div className="flex items-center gap-2 ml-2">
              {/* premitive logout button */}
              {/* <button
                onClick={logout}
                className="p-3 rounded-xl hover:bg-accent/50 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5 text-muted-foreground" />
              </button> */}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`relative w-full px-4 py-3 rounded-xl transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${activeView === item.id
                    ? 'text-primary-foreground'
                    : 'text-foreground hover:bg-accent/50'
                    }`}
                  aria-current={activeView === item.id ? 'page' : undefined}
                >
                  <AnimatePresence>
                    {activeView === item.id && (
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0.8, scaleY: 0.95, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scaleX: 1, scaleY: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scaleX: 0.8, scaleY: 0.95, filter: 'blur(4px)' }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-primary rounded-xl shadow-lg -z-10"
                      />
                    )}
                  </AnimatePresence>
                  <div className="relative z-10 flex items-center gap-3">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}

            {/* premitive logout button */}
            {/* <button
              onClick={logout}
              className="w-full px-4 py-3 rounded-xl transition-all text-left hover:bg-accent/50 flex items-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button> */}
          </div>
        )}
      </div>
    </nav>
  );
}
