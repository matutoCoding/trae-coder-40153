import dayjs from 'dayjs';
import type { ScheduleItem, MergeResult, SplitResult, ScheduleConflict } from '@/types/schedule';
import type { Crane } from '@/types/crane';

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

export const canMergeSchedulesForSite = (
  item1: ScheduleItem,
  item2: ScheduleItem,
  siteName: string
): boolean => {
  if (item1.craneId !== item2.craneId) return false;
  if (item1.siteName !== siteName || item2.siteName !== siteName) return false;
  if (item1.status !== item2.status) return false;

  const end1 = dayjs(item1.endTime);
  const start2 = dayjs(item2.startTime);
  const diffHours = start2.diff(end1, 'hour');

  return diffHours <= 24 && diffHours >= 0;
};

export const mergeAdjacentSchedulesForSite = (
  schedules: ScheduleItem[],
  siteName: string
): MergeResult => {
  if (schedules.length <= 1) {
    return { merged: [...schedules], originalCount: schedules.length, mergedCount: schedules.length };
  }

  const targetSchedules = schedules.filter(s => s.siteName === siteName);
  const otherSchedules = schedules.filter(s => s.siteName !== siteName);

  if (targetSchedules.length <= 1) {
    return { merged: [...schedules], originalCount: schedules.length, mergedCount: schedules.length };
  }

  const sorted = [...targetSchedules].sort((a, b) =>
    dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
  );

  const merged: ScheduleItem[] = [];
  let current = sorted[0];
  let mergedIds = [sorted[0].id];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (canMergeSchedulesForSite(current, next, siteName)) {
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
    merged: [...merged, ...otherSchedules],
    originalCount: targetSchedules.length,
    mergedCount: merged.length
  };
};

export const detectScheduleConflicts = (
  schedules: ScheduleItem[],
  cranes: Crane[]
): ScheduleConflict[] => {
  const conflicts: ScheduleConflict[] = [];
  const MAX_DAILY_HOURS = 12;
  const MIN_INTERVAL_HOURS = 4;
  let conflictIdCounter = 1;

  const groupedByCrane = new Map<string, ScheduleItem[]>();
  schedules.forEach(s => {
    if (!groupedByCrane.has(s.craneId)) groupedByCrane.set(s.craneId, []);
    groupedByCrane.get(s.craneId)!.push(s);
  });

  groupedByCrane.forEach((craneSchedules, craneId) => {
    const crane = cranes.find(c => c.id === craneId);
    const craneName = crane?.name || `吊车#${craneId.slice(-4)}`;
    const sorted = [...craneSchedules].sort(
      (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
    );

    if (sorted.length >= 2) {
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const a = sorted[i];
          const b = sorted[j];
          if (checkScheduleOverlap(a, b)) {
            conflictIdCounter++;
            conflicts.push({
              id: `conflict_${conflictIdCounter}`,
              type: 'overlap',
              level: 'high',
              title: '时间重叠冲突',
              description: `「${a.siteName}」(${dayjs(a.startTime).format('MM-DD HH:mm')}~${dayjs(a.endTime).format('MM-DD HH:mm')}) 与 「${b.siteName}」(${dayjs(b.startTime).format('MM-DD HH:mm')}~${dayjs(b.endTime).format('MM-DD HH:mm')}) 时间重叠`,
              craneId,
              craneName,
              scheduleIds: [a.id, b.id],
              orderIds: [a.orderId, b.orderId].filter(Boolean) as string[],
              siteNames: [a.siteName, b.siteName],
              status: 'pending'
            });
          }
        }
      }

      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = sorted[i];
        const next = sorted[i + 1];
        if (curr.siteName !== next.siteName) {
          const gapHours = dayjs(next.startTime).diff(dayjs(curr.endTime), 'hour', true);
          if (gapHours < MIN_INTERVAL_HOURS && gapHours >= 0) {
            conflictIdCounter++;
            conflicts.push({
              id: `conflict_${conflictIdCounter}`,
              type: 'tightInterval',
              level: 'medium',
              title: '跨工地转场间隔过短',
              description: `从「${curr.siteName}」收工到「${next.siteName}」开工仅 ${gapHours.toFixed(1)} 小时，低于建议 ${MIN_INTERVAL_HOURS} 小时转场时间`,
              craneId,
              craneName,
              scheduleIds: [curr.id, next.id],
              orderIds: [curr.orderId, next.orderId].filter(Boolean) as string[],
              siteNames: [curr.siteName, next.siteName],
              status: 'pending'
            });
          }
        }
      }
    }

    for (let i = 0; i < sorted.length; i++) {
      const durationHours = dayjs(sorted[i].endTime).diff(dayjs(sorted[i].startTime), 'hour', true);
      if (durationHours > MAX_DAILY_HOURS) {
        conflictIdCounter++;
        conflicts.push({
          id: `conflict_${conflictIdCounter}`,
          type: 'overDuration',
          level: 'medium',
          title: '超出单班时长',
          description: `「${sorted[i].siteName}」作业时长 ${durationHours.toFixed(1)} 小时，超过单班 ${MAX_DAILY_HOURS} 小时上限`,
          craneId,
          craneName,
          scheduleIds: [sorted[i].id],
          orderIds: sorted[i].orderId ? [sorted[i].orderId] : undefined,
          siteNames: [sorted[i].siteName],
          status: 'pending'
        });
      }
    }
  });

  return conflicts;
};
