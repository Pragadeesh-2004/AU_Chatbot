
import { RateLimit } from '@/types/rate-limit.types';

export function calculateRateLimitUsage(
  current: number,
  limit: number
): { percentage: number; status: 'low' | 'medium' | 'high' | 'critical' } {
  const percentage = (current / limit) * 100;
  
  let status: 'low' | 'medium' | 'high' | 'critical';
  if (percentage < 50) status = 'low';
  else if (percentage < 75) status = 'medium';
  else if (percentage < 90) status = 'high';
  else status = 'critical';
  
  return { percentage, status };
}

export function formatRateLimit(rateLimit: RateLimit): string {
  return `${rateLimit.requestsPerMinute}/min, ${rateLimit.requestsPerHour}/hr, ${rateLimit.requestsPerDay}/day`;
}

export function validateRateLimitValues(
  perMinute: number,
  perHour: number,
  perDay: number
): string | null {
  if (perMinute < 0 || perHour < 0 || perDay < 0) {
    return 'Rate limit values cannot be negative';
  }
  
  if (perMinute * 60 > perHour) {
    return 'Per hour limit should be at least per minute limit × 60';
  }
  
  if (perHour * 24 > perDay) {
    return 'Per day limit should be at least per hour limit × 24';
  }
  
  return null;
}

export function getStatusColor(isActive: boolean): string {
  return isActive ? 'text-green-600' : 'text-red-600';
}

export function getUsageColor(percentage: number): string {
  if (percentage < 50) return 'text-green-600';
  if (percentage < 75) return 'text-yellow-600';
  if (percentage < 90) return 'text-orange-600';
  return 'text-red-600';
}