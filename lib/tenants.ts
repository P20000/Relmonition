const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-001.relmonition.dpdns.org/api/v1';

export type TenantMember = {
  id: string; // userId
  role: string;
  relationship_label: string | null;
};

export type TenantWithMembers = {
  id: string;
  name: string | null;
  connectionCode: string;
  connection_code: string; // alias for template use
  tenantDbUrl: string | null;
  createdAt: Date;
  role: string; // the current user's role
  members: TenantMember[];
};

export async function getUserTenants(userId: string): Promise<TenantWithMembers[]> {
  const res = await fetch(`${API_URL}/tenant/user/${userId}`);
  if (!res.ok) return [];
  const data: any[] = await res.json();
  // Normalize the connectionCode field so components can use either alias
  return data.map((t) => ({ ...t, connection_code: t.connectionCode }));
}

export async function createTenant(
  userId: string,
  tenantName: string,
  label: string
): Promise<{ tenant: { id: string }; connectionCode: string } | null> {
  const res = await fetch(`${API_URL}/tenant/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, tenantName, label }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create relationship');
  }
  const data = await res.json();
  return { tenant: { id: data.tenantId }, connectionCode: data.connectionCode };
}

export async function joinTenant(
  userId: string,
  connectionCode: string,
  label: string
): Promise<{ id: string } | null> {
  const res = await fetch(`${API_URL}/tenant/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, connectionCode, label }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Invalid connection code');
  }
  const data = await res.json();
  return { id: data.tenantId };
}

export async function regenerateConnectionCode(
  tenantId: string,
  userId: string
): Promise<string | null> {
  const res = await fetch(`${API_URL}/tenant/${tenantId}/regenerate-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to regenerate code');
  }
  const data = await res.json();
  return data.connectionCode;
}

export async function leaveTenant(tenantId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tenant/${tenantId}/leave`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to leave relationship');
  }
}

export async function deleteTenant(tenantId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tenant/${tenantId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete relationship');
  }
}
