'use client';

import { useState, useEffect, useCallback } from 'react';
import { rateLimitService } from '@/services/rate-limit.service';
import {
  RateLimit,
  OrganizationRateLimit,
  AssistantRateLimit,
  PaginationParams,
  RateLimitStats,
} from '@/types/rate-limit.types';

export function useRateLimits(initialParams: PaginationParams) {
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchRateLimits = useCallback(async (params: PaginationParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await rateLimitService.getRateLimits(params);
      setRateLimits(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to fetch rate limits');
      console.error('Error fetching rate limits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRateLimits(initialParams);
  }, [fetchRateLimits, initialParams]);

  const refetch = useCallback(() => {
    fetchRateLimits(initialParams);
  }, [fetchRateLimits, initialParams]);

  return {
    rateLimits,
    loading,
    error,
    pagination,
    refetch,
    fetchRateLimits,
  };
}

export function useOrganizationRateLimits(initialParams: PaginationParams) {
  const [rateLimits, setRateLimits] = useState<OrganizationRateLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchRateLimits = useCallback(async (params: PaginationParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await rateLimitService.getOrganizationRateLimits(params);
      setRateLimits(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to fetch organization rate limits');
      console.error('Error fetching organization rate limits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRateLimits(initialParams);
  }, [fetchRateLimits, initialParams]);

  const refetch = useCallback(() => {
    fetchRateLimits(initialParams);
  }, [fetchRateLimits, initialParams]);

  return {
    rateLimits,
    loading,
    error,
    pagination,
    refetch,
    fetchRateLimits,
  };
}

export function useAssistantRateLimits(initialParams: PaginationParams) {
  const [rateLimits, setRateLimits] = useState<AssistantRateLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchRateLimits = useCallback(async (params: PaginationParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await rateLimitService.getAssistantRateLimits(params);
      setRateLimits(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to fetch assistant rate limits');
      console.error('Error fetching assistant rate limits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRateLimits(initialParams);
  }, [fetchRateLimits, initialParams]);

  const refetch = useCallback(() => {
    fetchRateLimits(initialParams);
  }, [fetchRateLimits, initialParams]);

  return {
    rateLimits,
    loading,
    error,
    pagination,
    refetch,
    fetchRateLimits,
  };
}

export function useRateLimitStats() {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await rateLimitService.getRateLimitStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch rate limit statistics');
      console.error('Error fetching rate limit stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}