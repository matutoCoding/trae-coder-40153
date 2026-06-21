export interface Crane {
  id: string;
  name: string;
  plateNumber: string;
  tonnage: number;
  model: string;
  type: CraneType;
  status: CraneStatus;
  location: string;
  distance?: number;
  dailyRate: number;
  operator: string;
  phone: string;
  imageUrl: string;
  description?: string;
  buyDate?: string;
  lastMaintenance?: string;
}

export type CraneType = 'truck' | 'crawler' | 'tower' | 'roughTerrain';

export type CraneStatus = 'available' | 'occupied' | 'maintenance' | 'offline';

export const craneTypeLabel: Record<CraneType, string> = {
  truck: '汽车吊',
  crawler: '履带吊',
  tower: '塔吊',
  roughTerrain: '越野吊'
};

export const craneStatusLabel: Record<CraneStatus, string> = {
  available: '空闲',
  occupied: '占用',
  maintenance: '维保',
  offline: '离线'
};

export const craneStatusColor: Record<CraneStatus, string> = {
  available: '#00B42A',
  occupied: '#F53F3F',
  maintenance: '#FF7D00',
  offline: '#86909C'
};
