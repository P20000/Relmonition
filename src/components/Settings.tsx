import { useState, useEffect } from 'react';
import { User, LogOut, Bell, Moon, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { RelationshipManager } from './RelationshipManager';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../../api-client';

// Stubs for currently unimplemented lib imports to avoid build errors
const isTursoConfigured = true;
const turso: any = null;

type SettingsProps = {
    userEmail: string;
    userId: string;
    accountType: string | null;
    activeTenantId: string | null;
    onTenantChange: (tenantId: string | null) => void;
    onLogout: () => void;
};

export function Settings({ userEmail, userId, accountType, activeTenantId, onTenantChange, onLogout }: SettingsProps) {
    const { name, setName } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [displayName, setDisplayName] = useState(name || '');
    const [isSavingName, setIsSavingName] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Initialize local dark mode state from DOM/localStorage
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
        setDarkMode(isDark);
    }, []);

    useEffect(() => {
        setDisplayName(name || '');
    }, [name]);


    // Load user preferences
    useEffect(() => {
        if (isTursoConfigured && turso) {
            loadPreferences();
        }
    }, [userId]);
    const loadUploadHistory = async () => {}; // Stub for deletion safety if used elsewhere

    const loadPreferences = async () => {
        if (!turso || !isTursoConfigured) return;

        try {
            const result = await turso.execute({
                sql: 'SELECT * FROM user_preferences WHERE user_id = ?',
                args: [userId],
            });

            if (result.rows.length > 0) {
                const prefs = result.rows[0];
                setNotifications(Boolean(prefs.notifications));
                setDarkMode(Boolean(prefs.dark_mode));
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };

    const handleSaveName = async () => {
        if (!displayName.trim() || displayName === name) return;
        
        setIsSavingName(true);
        setSaveSuccess(false);
        try {
            await apiClient.updateProfile(userId, displayName);
            setName(displayName);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error('Error updating name:', error);
        } finally {
            setIsSavingName(false);
        }
    };


    const updatePreference = async (field: string, value: boolean) => {
        if (!turso || !isTursoConfigured) return;

        try {
            await turso.execute({
                sql: `UPDATE user_preferences SET ${field} = ?, updated_at = datetime('now') WHERE user_id = ?`,
                args: [value ? 1 : 0, userId],
            });
        } catch (error) {
            console.error('Error updating preference:', error);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and preferences</p>
                </header>

                <div className="space-y-6">
                    {/* Account Section */}
                    <div
                        className="p-6 rounded-2xl"
                        style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <User className="w-6 h-6 text-primary" />
                            <h2>Account</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Display Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={isSavingName || displayName === name || !displayName.trim()}
                                        className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : 'Save'}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={userEmail}
                                    disabled
                                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Account Type</label>
                                <div className="px-4 py-3 rounded-xl border border-border bg-background">
                                    <span className="text-sm">
                                        {accountType ? accountType.charAt(0).toUpperCase() + accountType.slice(1) : 'Standard'} Account
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Full features enabled with Turso database
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Relationship Manager Section */}
                    <RelationshipManager
                        userId={userId}
                        activeTenantId={activeTenantId}
                        onTenantChange={onTenantChange}
                    />


                    {/* Preferences Section */}
                    <div
                        className="p-6 rounded-2xl"
                        style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="w-6 h-6 text-primary" />
                            <h2>Preferences</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Notifications</p>
                                        <p className="text-xs text-muted-foreground">
                                            Receive relationship insights and reminders
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setNotifications(!notifications);
                                        updatePreference('notifications', !notifications);
                                    }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-primary' : 'bg-muted'
                                        }`}
                                    aria-label={`Turn notifications ${notifications ? 'off' : 'on'}`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <Moon className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Dark Mode</p>
                                        <p className="text-xs text-muted-foreground">
                                            Use dark theme
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const newDark = !darkMode;
                                        setDarkMode(newDark);
                                        // Update the app globally
                                        document.documentElement.classList.toggle('dark', newDark);
                                        localStorage.setItem('theme', newDark ? 'dark' : 'light');
                                        
                                        updatePreference('dark_mode', newDark);
                                    }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-muted'
                                        }`}
                                    aria-label={`Turn dark mode ${darkMode ? 'off' : 'on'}`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Data & Privacy */}
                    <div
                        className="p-6 rounded-2xl"
                        style={{
                            background: 'var(--glass-bg)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <h3 className="mb-4">Data & Privacy</h3>
                        <div className="space-y-3 text-sm">
                            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-accent transition-colors">
                                Export My Data
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-accent transition-colors">
                                Privacy Policy
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-accent transition-colors">
                                Terms of Service
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
