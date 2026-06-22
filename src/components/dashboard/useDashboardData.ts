"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBaseUrl } from '../../../api-client';

export interface DashboardData {
  partnerDeparted?: boolean;
  lastMood?: number | null;
  insights?: Array<{ content: string }>;
  recentInteractions?: any[];
  history?: any[];
  journals?: any[];
  computedMetrics?: {
    gottmanRatio?: number;
    sampleWarning?: boolean;
    healthScore?: number;
    trend?: number;
    trendStatus?: 'INSUFFICIENT_DATA' | 'STABLE' | 'GROWING' | 'DECLINING';
  };
  greeting?: string;
}

export function useDashboardData() {
  const { userId, activeTenantId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!activeTenantId) {
          setData({ lastMood: null, insights: [], recentInteractions: [], history: [] });
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const API_URL = getBaseUrl(activeTenantId);
        const url = new URL(`${API_URL}/dashboard/${activeTenantId}`);
        if (userId) {
          url.searchParams.append('userId', userId);
        }
        
        const response = await fetch(url.toString(), {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, activeTenantId]);

  const {
    partnerDeparted = false,
    lastMood = null,
    insights = [],
    recentInteractions = [],
    history = [],
    journals = [],
    computedMetrics = {},
    greeting = ''
  } = data || {};

  const hasInteractions = Array.isArray(recentInteractions) && recentInteractions.length > 0;
  const hasMood = lastMood != null;
  const isEmpty = !hasInteractions && !hasMood;

  const sortedInteractions = hasInteractions
    ? [...recentInteractions].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const totalBids = sortedInteractions.reduce((s: number, i: any) => s + (i.bidsCount || 0), 0);
  const totalRepairs = sortedInteractions.reduce((s: number, i: any) => s + (i.repairsCount || 0), 0);

  const { gottmanRatio = null, sampleWarning = false, healthScore = null, trend = null, trendStatus = 'INSUFFICIENT_DATA' } = computedMetrics;
  const isPositiveTrend = trend != null && trend >= 0;

  return {
    loading,
    error,
    partnerDeparted,
    lastMood,
    insights,
    recentInteractions,
    history,
    journals,
    greeting,
    hasInteractions,
    hasMood,
    isEmpty,
    sortedInteractions,
    totalBids,
    totalRepairs,
    gottmanRatio,
    sampleWarning,
    healthScore,
    trend,
    trendStatus,
    isPositiveTrend
  };
}
