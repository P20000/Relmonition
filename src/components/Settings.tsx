import { useState, useEffect } from 'react';
import { User, LogOut, Upload, FileText, CheckCircle, AlertCircle, Bell, Moon, Shield, Loader2 } from 'lucide-react';
import { RelationshipManager } from './RelationshipManager';
// Stubs for currently unimplemented lib imports to avoid build errors
const isTursoConfigured = true;
const turso: any = null;
const analyzeChatData = async (userId: string, content: string) => { return {}; };


type SettingsProps = {
    userEmail: string;
    userId: string;
    accountType: string | null;
    activeTenantId: string | null;
    onTenantChange: (tenantId: string | null) => void;
    onLogout: () => void;
};

export function Settings({ userEmail, userId, accountType, activeTenantId, onTenantChange, onLogout }: SettingsProps) {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadError, setUploadError] = useState('');
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [dataSharing, setDataSharing] = useState(false);
    const [uploadHistory, setUploadHistory] = useState<any[]>([]);

    // Initialize local dark mode state from DOM/localStorage
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
        setDarkMode(isDark);
    }, []);

    // Generate unique ID
    function generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Load user preferences
    useEffect(() => {
        if (isTursoConfigured && turso) {
            loadPreferences();
            loadUploadHistory();
        }
    }, [userId]);

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
                setDataSharing(Boolean(prefs.data_sharing));
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    };

    const loadUploadHistory = async () => {
        if (!turso || !isTursoConfigured) return;

        try {
            const result = await turso.execute({
                sql: 'SELECT id, file_name, file_size, uploaded_at, processed FROM chat_uploads WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 5',
                args: [userId],
            });

            setUploadHistory(result.rows as any[]);
        } catch (error) {
            console.error('Error loading upload history:', error);
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size must be less than 10MB');
            setUploadStatus('error');
            return;
        }

        // Validate file type
        const allowedTypes = ['text/plain', 'application/json', 'text/csv'];
        if (!allowedTypes.includes(file.type)) {
            setUploadError('Only TXT, JSON, and CSV files are supported');
            setUploadStatus('error');
            return;
        }

        setUploadedFile(file);
        setUploadStatus('uploading');
        setUploadError('');

        // Demo mode - simulate upload
        if (!turso || !isTursoConfigured) {
            setTimeout(() => {
                setUploadStatus('success');
                setTimeout(() => {
                    setUploadStatus('idle');
                    setUploadedFile(null);
                }, 3000);
            }, 1000);
            return;
        }

        // Real Turso upload
        try {
            // Read file content
            const fileContent = await file.text();

            // Save upload record to database
            await turso.execute({
                sql: 'INSERT INTO chat_uploads (id, user_id, file_name, file_content, file_size, processed) VALUES (?, ?, ?, ?, ?, 0)',
                args: [generateId(), userId, file.name, fileContent, file.size],
            });

            // Analyze chat data with AI (async)
            analyzeChatData(userId, fileContent).then((analysis) => {
                console.log('Chat analysis complete:', analysis);
                // Mark as processed
                turso.execute({
                    sql: 'UPDATE chat_uploads SET processed = 1 WHERE user_id = ? AND file_name = ?',
                    args: [userId, file.name],
                });
            });

            setUploadStatus('success');
            loadUploadHistory();

            // Reset after 3 seconds
            setTimeout(() => {
                setUploadStatus('idle');
                setUploadedFile(null);
            }, 3000);
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed');
            setUploadStatus('error');
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
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
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

                    {/* Chat Upload Section */}
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
                            <Upload className="w-6 h-6 text-primary" />
                            <h2>Upload Chat History</h2>
                        </div>

                        <p className="text-sm text-muted-foreground mb-6">
                            Upload your previous chat conversations to help our AI analyze your communication patterns and generate personalized insights.
                        </p>

                        <div
                            className="border-2 border-dashed border-border rounded-xl p-8 text-center mb-4 hover:border-primary transition-colors cursor-pointer"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="mb-2">
                                Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supports TXT, JSON, CSV files (Max 10MB)
                            </p>
                            <input
                                id="file-upload"
                                type="file"
                                accept=".txt,.json,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        {uploadStatus !== 'idle' && (
                            <div
                                className="p-4 rounded-xl flex items-center gap-3"
                                style={{
                                    background: uploadStatus === 'success' ? 'var(--accent)' : uploadStatus === 'error' ? 'var(--destructive)' : 'var(--muted)',
                                    border: '1px solid var(--border)',
                                }}
                            >
                                {uploadStatus === 'uploading' && (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                )}
                                {uploadStatus === 'success' && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                                {uploadStatus === 'error' && (
                                    <AlertCircle className="w-5 h-5 text-destructive" />
                                )}
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        {uploadedFile?.name || 'Uploading...'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {uploadStatus === 'uploading' && 'Uploading to Supabase...'}
                                        {uploadStatus === 'success' && 'Upload complete - AI will analyze this data'}
                                        {uploadStatus === 'error' && uploadError}
                                    </p>
                                </div>
                            </div>
                        )}


                        {isTursoConfigured && uploadHistory.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-sm font-medium mb-3">Upload History</h4>
                                <div className="space-y-2">
                                    {uploadHistory.map((upload) => (
                                        <div
                                            key={upload.id}
                                            className="p-3 rounded-lg"
                                            style={{
                                                background: 'var(--card)',
                                                border: '1px solid var(--border)',
                                            }}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-medium">{upload.file_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(upload.uploaded_at).toLocaleDateString()} • {(upload.file_size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                                <div
                                                    className={`text-xs px-2 py-1 rounded ${upload.processed
                                                            ? 'bg-green-500/10 text-green-500'
                                                            : 'bg-yellow-500/10 text-yellow-500'
                                                        }`}
                                                >
                                                    {upload.processed ? 'Processed' : 'Pending'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

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

                            <div className="flex items-center justify-between py-3 border-b border-border">
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

                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">Data Sharing</p>
                                        <p className="text-xs text-muted-foreground">
                                            Share anonymous data to improve AI models
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setDataSharing(!dataSharing);
                                        updatePreference('data_sharing', !dataSharing);
                                    }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${dataSharing ? 'bg-primary' : 'bg-muted'
                                        }`}
                                    aria-label={`Turn data sharing ${dataSharing ? 'off' : 'on'}`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${dataSharing ? 'translate-x-6' : 'translate-x-0'
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
