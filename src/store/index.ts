import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import type { Crane } from '@/types/crane';
import type { ScheduleItem, ScheduleConflict } from '@/types/schedule';
import type { Order, SettlementRecord, RecommendTrace } from '@/types/order';
import type { WeightConfig } from '@/types/recommend';
import { defaultWeightConfig } from '@/data/recommend';
import { detectScheduleConflicts } from '@/utils/schedule';

let _cranes: Crane[] = [];
let _schedules: ScheduleItem[] = [];
let _orders: Order[] = [];
let _craneIdCounter = 100;
let _scheduleIdCounter = 100;
let _orderIdCounter = 100;

const _imageIds = [1074, 1071, 1072, 1076, 1081, 1080, 1067, 1059, 1062, 1068];

let _settlementIdCounter = 100;
let _conflicts: ScheduleConflict[] = [];
let _conflictInitialized = false;

const _ensureConflicts = () => {
  if (!_conflictInitialized) {
    _conflicts = detectScheduleConflicts(
      _schedules.filter(s => s.status !== 'completed' && s.status !== 'cancelled'),
      _cranes
    );
    _conflictInitialized = true;
  }
};

const _refreshConflicts = () => {
  const existingMap = new Map(_conflicts.map(c => [c.id, c]));
  const fresh = detectScheduleConflicts(
    _schedules.filter(s => s.status !== 'completed' && s.status !== 'cancelled'),
    _cranes
  );
  _conflicts = fresh.map(f => {
    const existing = _conflicts.find(e =>
      e.type === f.type &&
      e.craneId === f.craneId &&
      e.scheduleIds.length === f.scheduleIds.length &&
      e.scheduleIds.every(sid => f.scheduleIds.includes(sid))
    );
    if (existing) {
      return { ...f, status: existing.status, handleTime: existing.handleTime, handleRemark: existing.handleRemark };
    }
    return f;
  });
};

export const initStore = (cranes: Crane[], schedules: ScheduleItem[], orders: Order[]) => {
  _cranes = [...cranes];
  _schedules = [...schedules];
  _orders = [...orders.map(o => ({ ...o, settlementRecords: o.settlementRecords || [], settledAmount: o.settledAmount || 0 }))];
  _conflictInitialized = false;
  _conflicts = [];
};

export const getCranes = (): Crane[] => [..._cranes];
export const getSchedules = (): ScheduleItem[] => [..._schedules];
export const getOrders = (): Order[] => [..._orders];

export const getCraneById = (id: string): Crane | undefined => {
  return _cranes.find(c => c.id === id);
};

export const getOrderById = (id: string): Order | undefined => {
  return _orders.find(o => o.id === id);
};

export const getSchedulesByCrane = (craneId: string): ScheduleItem[] => {
  return _schedules.filter(s => s.craneId === craneId);
};

export const addCrane = (data: {
  name: string;
  tonnage: number;
  type: string;
  location: string;
  dailyRate: number;
  operator: string;
  phone: string;
  model?: string;
  plateNumber?: string;
}): Crane => {
  _craneIdCounter++;
  const id = `crane${String(_craneIdCounter).padStart(3, '0')}`;
  const imgId = _imageIds[_craneIdCounter % _imageIds.length];
  const crane: Crane = {
    id,
    name: data.name,
    plateNumber: data.plateNumber || `鄂A·${_craneIdCounter}`,
    tonnage: data.tonnage,
    model: data.model || data.name,
    type: data.type as any,
    status: 'available',
    location: data.location,
    distance: Math.round(Math.random() * 50 * 10) / 10,
    dailyRate: data.dailyRate,
    operator: data.operator,
    phone: data.phone,
    imageUrl: `https://picsum.photos/id/${imgId}/400/300`,
    description: `${data.name}，新增入库`,
    buyDate: dayjs().format('YYYY-MM-DD'),
    lastMaintenance: dayjs().format('YYYY-MM-DD')
  };
  _cranes.push(crane);
  return crane;
};

export const mergeSchedulesForCrane = (craneId: string, siteName?: string): ScheduleItem[] => {
  let craneSchedules = _schedules.filter(s => s.craneId === craneId && s.status !== 'completed' && s.status !== 'cancelled');
  const otherSchedules = _schedules.filter(s => s.craneId !== craneId || s.status === 'completed' || s.status === 'cancelled');

  if (siteName) {
    const sameSiteSchedules = craneSchedules.filter(s => s.siteName === siteName);
    const otherSiteSchedules = craneSchedules.filter(s => s.siteName !== siteName);

    if (sameSiteSchedules.length <= 1) {
      return _schedules;
    }

    const sorted = [...sameSiteSchedules].sort((a, b) =>
      dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
    );

    const merged: ScheduleItem[] = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const canMerge =
        current.siteName === next.siteName &&
        current.siteAddress === next.siteAddress &&
        current.status === next.status &&
        dayjs(next.startTime).diff(dayjs(current.endTime), 'hour') <= 24 &&
        dayjs(next.startTime).diff(dayjs(current.endTime), 'hour') >= 0;

      if (canMerge) {
        current = {
          ...current,
          endTime: next.endTime,
          isMerged: true,
          mergedFrom: [...(current.mergedFrom || [current.id]), next.id],
          remark: `连续作业，已合并${(current.mergedFrom?.length || 1) + 1}个时段`
        };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);

    _schedules = [...otherSchedules, ...otherSiteSchedules, ...merged];
  } else {
    const sorted = [...craneSchedules].sort((a, b) =>
      dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
    );

    const merged: ScheduleItem[] = [];
    let current = sorted[0];

    if (!current) {
      _schedules = [...otherSchedules];
      return _schedules;
    }

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const canMerge =
        current.siteName === next.siteName &&
        current.siteAddress === next.siteAddress &&
        current.status === next.status &&
        dayjs(next.startTime).diff(dayjs(current.endTime), 'hour') <= 24 &&
        dayjs(next.startTime).diff(dayjs(current.endTime), 'hour') >= 0;

      if (canMerge) {
        current = {
          ...current,
          endTime: next.endTime,
          isMerged: true,
          mergedFrom: [...(current.mergedFrom || [current.id]), next.id],
          remark: `连续作业，已合并${(current.mergedFrom?.length || 1) + 1}个时段`
        };
      } else {
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);

    _schedules = [...otherSchedules, ...merged];
  }

  return _schedules;
};

export const splitSchedule = (scheduleId: string, splitDateTime: string): ScheduleItem[] | null => {
  const idx = _schedules.findIndex(s => s.id === scheduleId);
  if (idx === -1) return null;

  const original = _schedules[idx];
  const splitMoment = dayjs(splitDateTime);
  const startMoment = dayjs(original.startTime);
  const endMoment = dayjs(original.endTime);

  if (splitMoment.isBefore(startMoment) || splitMoment.isAfter(endMoment) || splitMoment.isSame(startMoment) || splitMoment.isSame(endMoment)) {
    return null;
  }

  _scheduleIdCounter++;
  const id1 = `sch_split_${_scheduleIdCounter}_1`;
  _scheduleIdCounter++;
  const id2 = `sch_split_${_scheduleIdCounter}_2`;

  const firstPart: ScheduleItem = {
    ...original,
    id: id1,
    startTime: original.startTime,
    endTime: splitDateTime,
    isMerged: false,
    mergedFrom: undefined,
    remark: `${original.remark || ''} (前半段)`
  };

  const secondPart: ScheduleItem = {
    ...original,
    id: id2,
    startTime: splitDateTime,
    endTime: original.endTime,
    isMerged: false,
    mergedFrom: undefined,
    remark: `${original.remark || ''} (后半段)`
  };

  _schedules.splice(idx, 1, firstPart, secondPart);
  return [firstPart, secondPart];
};

export const createOrderFromMatch = (data: {
  craneId: string;
  siteName: string;
  siteAddress: string;
  startTime: string;
  endTime: string;
  days: number;
  dailyRate: number;
  contactPerson: string;
  contactPhone: string;
  remark?: string;
  weightConfig: WeightConfig;
  requiredTonnage: number;
  preferredType: string;
  recommendScore: number;
  matchLevel: 'perfect' | 'good' | 'normal' | 'low';
  recommendRank?: number;
  recommendTime?: string;
  candidates?: Array<{
    craneId: string;
    craneName: string;
    tonnage: number;
    score: number;
    rank: number;
    matchLevel: 'perfect' | 'good' | 'normal' | 'low';
    dailyRate: number;
  }>;
  selectionReason?: string;
}): { order: Order; schedule: ScheduleItem } => {
  _orderIdCounter++;
  const orderId = `order_match_${_orderIdCounter}`;
  const orderNo = `DD${dayjs().format('YYYYMMDD')}${String(_orderIdCounter).padStart(3, '0')}`;

  const totalAmount = data.days * data.dailyRate;
  const now = dayjs().format('YYYY-MM-DD HH:mm');

  const recommendTrace: RecommendTrace = {
    score: data.recommendScore,
    matchLevel: data.matchLevel,
    requiredTonnage: data.requiredTonnage,
    preferredType: data.preferredType,
    weightConfig: data.weightConfig,
    rank: data.recommendRank,
    recommendTime: data.recommendTime || now,
    candidates: data.candidates,
    selectionReason: data.selectionReason
  };

  const order: Order = {
    id: orderId,
    orderNo,
    craneId: data.craneId,
    siteName: data.siteName,
    siteAddress: data.siteAddress,
    startTime: data.startTime,
    endTime: data.endTime,
    days: data.days,
    dailyRate: data.dailyRate,
    totalAmount,
    status: 'confirmed',
    contactPerson: data.contactPerson,
    contactPhone: data.contactPhone,
    createTime: now,
    confirmTime: now,
    remark: data.remark || '撮合订单',
    settlementStatus: 'unsettled',
    settlementRecords: [],
    settledAmount: 0,
    recommendTrace
  };

  _orders.unshift(order);

  _scheduleIdCounter++;
  const scheduleId = `sch_match_${_scheduleIdCounter}`;
  const schedule: ScheduleItem = {
    id: scheduleId,
    craneId: data.craneId,
    siteName: data.siteName,
    siteAddress: data.siteAddress,
    startTime: data.startTime,
    endTime: data.endTime,
    status: 'confirmed',
    orderId,
    remark: data.remark || '撮合排期'
  };

  _schedules.push(schedule);

  const craneIdx = _cranes.findIndex(c => c.id === data.craneId);
  if (craneIdx !== -1) {
    _cranes[craneIdx] = { ..._cranes[craneIdx], status: 'occupied' };
  }

  return { order, schedule };
};

export const settleOrder = (orderId: string): Order | null => {
  const idx = _orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;

  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const remaining = _orders[idx].totalAmount - (_orders[idx].settledAmount || 0);

  _settlementIdCounter++;
  const record: SettlementRecord = {
    id: `settle_${_settlementIdCounter}`,
    orderId,
    amount: remaining,
    type: 'final',
    payTime: now,
    payMethod: 'bank',
    remark: '尾款结算'
  };

  const records = [...(_orders[idx].settlementRecords || []), record];

  _orders[idx] = {
    ..._orders[idx],
    status: 'completed',
    settlementStatus: 'settled',
    settlementTime: now,
    completeTime: now,
    settlementRecords: records,
    settledAmount: _orders[idx].totalAmount
  };

  return _orders[idx];
};

export const partialSettleOrder = (orderId: string, amount: number, remark?: string): Order | null => {
  const idx = _orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;

  const order = _orders[idx];
  const currentSettled = order.settledAmount || 0;
  const remaining = order.totalAmount - currentSettled;

  if (amount <= 0) return null;
  if (amount > remaining) return null;

  const now = dayjs().format('YYYY-MM-DD HH:mm');

  _settlementIdCounter++;
  const record: SettlementRecord = {
    id: `settle_${_settlementIdCounter}`,
    orderId,
    amount,
    type: currentSettled === 0 ? 'deposit' : 'progress',
    payTime: now,
    payMethod: 'bank',
    remark
  };

  const newSettled = currentSettled + amount;
  const newStatus = newSettled >= order.totalAmount ? 'settled' : 'partial';

  const records = [...(order.settlementRecords || []), record];

  _orders[idx] = {
    ...order,
    settlementStatus: newStatus,
    settlementTime: newStatus === 'settled' ? now : order.settlementTime,
    completeTime: newStatus === 'settled' ? now : order.completeTime,
    status: newStatus === 'settled' ? 'completed' : order.status,
    settlementRecords: records,
    settledAmount: newSettled
  };

  return _orders[idx];
};

export const getWeightConfig = (): WeightConfig => {
  try {
    const saved = Taro.getStorageSync('weightConfig');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[Store] 读取权重配置失败:', e);
  }
  return { ...defaultWeightConfig };
};

export const saveWeightConfig = (config: WeightConfig): void => {
  try {
    Taro.setStorageSync('weightConfig', JSON.stringify(config));
  } catch (e) {
    console.error('[Store] 保存权重配置失败:', e);
  }
};

export const getScheduleConflicts = (): ScheduleConflict[] => {
  _ensureConflicts();
  _refreshConflicts();
  return [..._conflicts];
};

export const markConflictStatus = (
  conflictId: string,
  status: 'confirmed' | 'resolved' | 'ignored',
  remark?: string
): ScheduleConflict | null => {
  _ensureConflicts();
  const idx = _conflicts.findIndex(c => c.id === conflictId);
  if (idx === -1) return null;

  _conflicts[idx] = {
    ..._conflicts[idx],
    status,
    handleTime: dayjs().format('YYYY-MM-DD HH:mm'),
    handleRemark: remark
  };
  return _conflicts[idx];
};

export const settleOrder = (orderId: string, remark?: string): Order | null => {
  const idx = _orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;

  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const remaining = _orders[idx].totalAmount - (_orders[idx].settledAmount || 0);

  _settlementIdCounter++;
  const record: SettlementRecord = {
    id: `settle_${_settlementIdCounter}`,
    orderId,
    amount: remaining,
    type: 'final',
    payTime: now,
    payMethod: 'bank',
    remark: remark || '尾款结算'
  };

  const records = [...(_orders[idx].settlementRecords || []), record];

  _orders[idx] = {
    ..._orders[idx],
    status: 'completed',
    settlementStatus: 'settled',
    settlementTime: now,
    completeTime: now,
    settlementRecords: records,
    settledAmount: _orders[idx].totalAmount
  };

  return _orders[idx];
};

export const getDashboardStats = (period: 'week' | 'month' = 'week') => {
  const now = dayjs();
  const startOfPeriod = period === 'week' ? now.startOf('week') : now.startOf('month');
  const endOfPeriod = period === 'week' ? now.endOf('week') : now.endOf('month');

  const periodOrders = _orders.filter(o => {
    const createTime = dayjs(o.createTime);
    return createTime.isAfter(startOfPeriod) && createTime.isBefore(endOfPeriod);
  });

  const totalOrders = periodOrders.length;
  const totalAmount = periodOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const settledAmount = periodOrders.reduce((sum, o) => sum + (o.settledAmount || 0), 0);
  const unsettledAmount = totalAmount - settledAmount;

  const allSchedules = _schedules.filter(s => s.status !== 'completed' && s.status !== 'cancelled');
  const periodSchedules = allSchedules.filter(s => {
    const start = dayjs(s.startTime);
    const end = dayjs(s.endTime);
    return start.isBefore(endOfPeriod) && end.isAfter(startOfPeriod);
  });

  const totalCranes = _cranes.length;
  const occupiedCranes = _cranes.filter(c => c.status === 'occupied').length;
  const utilizationRate = totalCranes > 0 ? Math.round(occupiedCranes / totalCranes * 100) : 0;

  _ensureConflicts();
  _refreshConflicts();
  const pendingConflicts = _conflicts.filter(c => c.status === 'pending');
  const highRiskConflicts = pendingConflicts.filter(c => c.level === 'high');

  return {
    period,
    periodLabel: period === 'week' ? '本周' : '本月',
    startDate: startOfPeriod.format('YYYY-MM-DD'),
    endDate: endOfPeriod.format('YYYY-MM-DD'),
    totalOrders,
    totalAmount,
    settledAmount,
    unsettledAmount,
    periodScheduleCount: periodSchedules.length,
    totalCranes,
    occupiedCranes,
    utilizationRate,
    pendingConflictCount: pendingConflicts.length,
    highRiskCount: highRiskConflicts.length,
    allConflictCount: _conflicts.length
  };
};
