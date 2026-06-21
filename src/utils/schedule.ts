import dayjs from 'dayjs';
import type { ScheduleItem, MergeResult, SplitResult } from '@/types/schedule';

export const canMergeSchedules = (
  item1: ScheduleItem, item2: ScheduleItem): boolean => {
  if (item1.craneId !== item2.craneId) return false;
  if (item1.siteName !== item2.siteName) return false;
  if (item1.status !== item2.status) return false;

  const end1 = dayjs(item1.endTime);
  const start2 = dayjs(item2.startTime);
  const diffHours = start2.diff(end1, 'hour');

  return diffHours <= 24 && diffHours >= 0;
};

export const mergeAdjacentSchedules = (schedules: ScheduleItem[]): MergeResult => {
  if (schedules.length <= 1) {
    return { merged: [...schedules], originalCount: schedules.length, mergedCount: schedules.length };
  }

  const sorted = [...schedules].sort((a, b) => 
    dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
  );

  const merged: ScheduleItem[] = [];
  let current = sorted[0];
  let mergedIds = [sorted[0].id];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (canMergeSchedules(current, next)) {
      current = {
        ...current,
        endTime: next.endTime,
        isMerged: true,
        mergedFrom: [...(current.mergedFrom || [current.id]), next.id],
        id: `merged_${current.id}_${next.id}`
      };
      mergedIds.push(next.id);
    } else {
      merged.push(current);
      current = next;
      mergedIds = [next.id];
    }
  }
  merged.push(current);

  return {
    merged,
    originalCount: schedules.length,
    mergedCount: merged.length
  };
};

export const splitSchedule = (
  schedule: ScheduleItem,
  splitDate: string,
  splitTime: string = '18:00'
): SplitResult => {
  const splitDateTime = `${splitDate} ${splitTime}`;
  const splitMoment = dayjs(splitDateTime);
  const startMoment = dayjs(schedule.startTime);
  const endMoment = dayjs(schedule.endTime);

  if (splitMoment.isBefore(startMoment) || splitMoment.isAfter(endMoment)) {
    return { split: [schedule], original: schedule };
  }

  const firstPart: ScheduleItem = {
    ...schedule,
    id: `${schedule.id}_1`,
    startTime: schedule.startTime,
    endTime: splitDateTime,
    isMerged: false,
    mergedFrom: undefined
  };

  const secondPart: ScheduleItem = {
    ...schedule,
    id: `${schedule.id}_2`,
    startTime: splitDateTime,
    endTime: schedule.endTime,
    isMerged: false,
    mergedFrom: undefined
  };

  return {
    split: [firstPart, secondPart],
    original: schedule
  };
};

export const getScheduleDurationDays = (schedule: ScheduleItem): number => {
  const start = dayjs(schedule.startTime);
  const end = dayjs(schedule.endTime);
  return end.diff(start, 'day', true);
};

export const groupSchedulesByDate = (schedules: ScheduleItem[]): Map<string, ScheduleItem[]> => {
  const map = new Map<string, ScheduleItem[]>();

  schedules.forEach(schedule => {
    const startDate = dayjs(schedule.startTime).format('YYYY-MM-DD');
    const endDate = dayjs(schedule.endTime).format('YYYY-MM-DD');
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
      const dateStr = d.format('YYYY-MM-DD');
      if (!map.has(dateStr)) {
        map.set(dateStr, []);
      }
      map.get(dateStr)!.push(schedule);
    }
  });

  return map;
};

export const checkScheduleOverlap = (
  schedule1: ScheduleItem,
  schedule2: ScheduleItem
): boolean => {
  const start1 = dayjs(schedule1.startTime);
  const end1 = dayjs(schedule1.endTime);
  const start2 = dayjs(schedule2.startTime);
  const end2 = dayjs(schedule2.endTime);

  return start1.isBefore(end2) && end1.isAfter(start2);
};
