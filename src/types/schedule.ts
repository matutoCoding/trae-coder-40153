import type { Crane } from './crane';

export interface ScheduleItem {
  id: string;
  craneId: string;
  crane?: Crane;
  siteName: string;
  siteAddress: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  isMerged?: boolean;
  mergedFrom?: string[];
  orderId?: string;
  remark?: string;
}

export type ScheduleStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export const scheduleStatusLabel: Record<ScheduleStatus, string> = {
  confirmed: '已确认',
  pending: '待确认',
  completed: '已完成',
  cancelled: '已取消'
};

export const scheduleStatusColor: Record<ScheduleStatus, string> = {
  confirmed: '#1E5EFA',
  pending: '#FF7D00',
  completed: '#00B42A',
  cancelled: '#86909C'
};

export interface DaySchedule {
  date: string;
  items: ScheduleItem[];
}

export interface MergeResult {
  merged: ScheduleItem[];
  originalCount: number;
  mergedCount: number;
}

export interface SplitResult {
  split: ScheduleItem[];
  original: ScheduleItem;
}
