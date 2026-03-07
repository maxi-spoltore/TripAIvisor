import { Map, MapPin, Ticket, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { Activity, ActivityCategory } from '@/types/database';

type ActivityCategoryConfig = {
  icon: LucideIcon;
  iconClassName: string;
  borderClassName: string;
  previewField: string;
};

export const ACTIVITY_CATEGORIES: ActivityCategory[] = ['meal', 'tour', 'ticketed', 'general'];

export const ACTIVITY_CATEGORY_CONFIG: Record<ActivityCategory, ActivityCategoryConfig> = {
  meal: {
    icon: UtensilsCrossed,
    iconClassName: 'text-warning',
    borderClassName: 'border-l-warning',
    previewField: 'restaurant_name'
  },
  tour: {
    icon: Map,
    iconClassName: 'text-route',
    borderClassName: 'border-l-route',
    previewField: 'tour_company'
  },
  ticketed: {
    icon: Ticket,
    iconClassName: 'text-brand-accent',
    borderClassName: 'border-l-brand-accent',
    previewField: 'venue'
  },
  general: {
    icon: MapPin,
    iconClassName: 'text-foreground-secondary',
    borderClassName: 'border-l-border-strong',
    previewField: 'location'
  }
};

function getStringDetail(details: Record<string, unknown>, key: string): string | null {
  const value = details[key];
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function getActivityPreviewField(activity: Activity): string | null {
  const config = ACTIVITY_CATEGORY_CONFIG[activity.category];
  return getStringDetail(activity.details, config.previewField);
}

export function formatActivityTime(time: string): string {
  const [hours = '00', minutes = '00'] = time.split(':');
  return `${hours}:${minutes}`;
}

export function parseActivityTimeToMinutes(time: string): number {
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return Number.NaN;
  }

  return (hours * 60) + minutes;
}
