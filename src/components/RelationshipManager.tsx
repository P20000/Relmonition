'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, UserPlus, X, Loader2, User,
  RefreshCw, CheckCircle, Copy, Trash2, LogOut,
} from 'lucide-react';
import {
  getUserTenants, createTenant, joinTenant,
  regenerateConnectionCode, leaveTenant, deleteTenant,
  type TenantWithMembers,
} from '../../lib/tenants';

interface RelationshipManagerProps {
  userId: string;
  activeTenantId: string | null;
  onTenantChange: (tenantId: string | null) => void;
}

export function RelationshipManager({ userId, activeTenantId, onTenantChange }: RelationshipManagerProps) {
  const [tenants, setTenants] = useState<TenantWithMembers[]>([]);
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showJoinTenant, setShowJoinTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantLabel, setNewTenantLabel] = useState('Self');
  const [joinCode, setJoinCode] = useState('');
  const [joinLabel, setJoinLabel] = useState('Partner');
  const [tenantError, setTenantError] = useState('');
  const [tenantLoading, setTenantLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (userId) loadTenants();
  }, [userId]);

  const loadTenants = async () => {
    const data = await getUserTenants(userId);
    setTenants(data);
    if (!activeTenantId && data.length > 0) {
      onTenantChange(data[0].id);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) return setTenantError('Please enter a relationship name');
    setTenantLoading(true);
    setTenantError('');
    try {
      const result = await createTenant(userId, newTenantName, newTenantLabel);
      if (result) {
        await loadTenants();
        setShowCreateTenant(false);
        setNewTenantName('');
        onTenantChange(result.tenant.id);
      }
    } catch (error: any) {
      setTenantError(error.message);
    } finally {
      setTenantLoading(false);
    }
  };

  const handleJoinTenant = async () => {
    if (!joinCode.trim()) return setTenantError('Please enter a connection code');
    setTenantLoading(true);
    setTenantError('');
    try {
      const tenant = await joinTenant(userId, joinCode.toUpperCase(), joinLabel);
      if (tenant) {
        await loadTenants();
        setShowJoinTenant(false);
        setJoinCode('');
        onTenantChange(tenant.id);
      }
    } catch (error: any) {
      setTenantError(error.message);
    } finally {
      setTenantLoading(false);
    }
  };

  const handleRegenerateCode = async (tenantId: string) => {
    try {
      await regenerateConnectionCode(tenantId, userId);
      await loadTenants();
    } catch (error: any) {
      setTenantError(error.message);
    }
  };

  const handleLeave = async (tenantId: string) => {
    if (!confirm('Are you sure you want to leave this relationship?')) return;
    try {
      await leaveTenant(tenantId, userId);
      await loadTenants();
      onTenantChange(null);
    } catch (error: any) {
      setTenantError(error.message);
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Permanently delete this relationship and all its data? This cannot be undone.')) return;
    try {
      await deleteTenant(tenantId, userId);
      await loadTenants();
      onTenantChange(null);
    } catch (error: any) {
      setTenantError(error.message);
    }
  };

  const copyConnectionCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  const glassStyle = {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  };

  return (
    <div className="p-6 rounded-2xl" style={glassStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Relationships</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCreateTenant(true); setShowJoinTenant(false); setTenantError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
          <button
            onClick={() => { setShowJoinTenant(true); setShowCreateTenant(false); setTenantError(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" /> Join
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Manage your relationship spaces with isolated data for each connection.
      </p>

      {/* Error Banner */}
      {tenantError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-between">
          <p className="text-sm text-destructive">{tenantError}</p>
          <button onClick={() => setTenantError('')}><X className="w-4 h-4 text-destructive" /></button>
        </div>
      )}

      {/* Create Tenant Form */}
      {showCreateTenant && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">New Relationship</h3>
            <button onClick={() => setShowCreateTenant(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Relationship Name</label>
              <input
                type="text"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                placeholder="e.g. Pranav & Neha"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTenant()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Label</label>
              <input
                type="text"
                value={newTenantLabel}
                onChange={(e) => setNewTenantLabel(e.target.value)}
                placeholder="e.g. Self, Partner 1"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
            <button
              onClick={handleCreateTenant}
              disabled={tenantLoading}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {tenantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Relationship
            </button>
          </div>
        </div>
      )}

      {/* Join Tenant Form */}
      {showJoinTenant && (
        <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Join a Relationship</h3>
            <button onClick={() => setShowJoinTenant(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Connection Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB3C9D"
                maxLength={6}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm font-mono tracking-wider uppercase"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinTenant()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Label</label>
              <input
                type="text"
                value={joinLabel}
                onChange={(e) => setJoinLabel(e.target.value)}
                placeholder="e.g. Partner, Neha"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
              />
            </div>
            <button
              onClick={handleJoinTenant}
              disabled={tenantLoading}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {tenantLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Join Relationship
            </button>
          </div>
        </div>
      )}

      {/* Active Relationship Selector */}
      {tenants.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Active Relationship</label>
          <select
            value={activeTenantId || ''}
            onChange={(e) => onTenantChange(e.target.value || null)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name || 'Unnamed'} ({tenant.role === 'owner' ? 'Owner' : 'Member'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Active Tenant Details */}
      {activeTenant ? (
        <div className="p-4 rounded-xl border border-border bg-card/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-lg">{activeTenant.name || 'Unnamed Relationship'}</h3>
              <p className="text-sm text-muted-foreground">
                Your role: <span className="text-primary capitalize">{activeTenant.role}</span>
              </p>
            </div>
            {/* Actions */}
            <div className="flex gap-2">
              {activeTenant.role !== 'owner' && (
                <button
                  onClick={() => handleLeave(activeTenant.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Leave relationship"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
              {activeTenant.role === 'owner' && (
                <button
                  onClick={() => handleDelete(activeTenant.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Delete relationship"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Members ({activeTenant.members.length})</h4>
            <div className="space-y-2">
              {activeTenant.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{member.relationship_label || 'Member'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Code — Owner only */}
          {activeTenant.role === 'owner' && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2 text-sm font-medium">
                <span>Connection Code</span>
                <button
                  onClick={() => handleRegenerateCode(activeTenant.id)}
                  className="text-xs text-primary flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded bg-background border border-border font-mono text-lg tracking-widest text-center">
                  {activeTenant.connection_code || activeTenant.connectionCode}
                </code>
                <button
                  onClick={() => copyConnectionCode(activeTenant.connection_code || activeTenant.connectionCode)}
                  className="p-2 rounded hover:bg-accent transition-colors"
                  title="Copy code"
                >
                  {copiedCode
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with your partner so they can join this relationship space.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm opacity-50">No relationships yet. Create or join one above.</p>
        </div>
      )}
    </div>
  );
}
