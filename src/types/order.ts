import type { Crane } from './crane';
import type { ScheduleItem } from './schedule';
import type { WeightConfig, RecommendItem } from './recommend';

export interface RecommendTrace {
  score: number;
  matchLevel: 'perfect' | 'good' | 'normal' | 'low';
  requiredTonnage: number;
  preferredType: string;
  weightConfig: WeightConfig;
  rank?: number;
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
}

export interface Order {
  id: string;
  orderNo: string;
  craneId: string;
  crane?: Crane;
  siteName: string;
  siteAddress: string;
  startTime: string;
  endTime: string;
  days: number;
  dailyRate: number;
  totalAmount: number;
  status: OrderStatus;
  scheduleIds?: string[];
  schedules?: ScheduleItem[];
  contactPerson: string;
  contactPhone: string;
  createTime: string;
  confirmTime?: string;
  completeTime?: string;
  remark?: string;
  settlementStatus: SettlementStatus;
  settlementTime?: string;
  settlementRecords?: SettlementRecord[];
  settledAmount?: number;
  recommendTrace?: RecommendTrace;
}

export type OrderStatus = 'pending' | 'confirmed' | 'inProgress' | 'completed' | 'cancelled';

export type SettlementStatus = 'unsettled' | 'partial' | 'settled';

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  inProgress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
};

export const orderStatusColor: Record<OrderStatus, string> = {
  pending: '#FF7D00',
  confirmed: '#1E5EFA',
  inProgress: '#722ED1',
  completed: '#00B42A',
  cancelled: '#86909C'
};

export const settlementStatusLabel: Record<SettlementStatus, string> = {
  unsettled: '未结算',
  partial: '部分结算',
  settled: '已结算'
};

export const settlementStatusColor: Record<SettlementStatus, string> = {
  unsettled: '#F53F3F',
  partial: '#FF7D00',
  settled: '#00B42A'
};

export interface SettlementRecord {
  id: string;
  orderId: string;
  amount: number;
  type: 'deposit' | 'progress' | 'final';
  payTime: string;
  payMethod: string;
  remark?: string;
}
