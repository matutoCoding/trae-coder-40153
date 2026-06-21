import type { Order } from '@/types/order';

const today = new Date();
const getDateStr = (daysOffset: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 16).replace('T', ' ');
};

export const orderList: Order[] = [
  {
    id: 'order001',
    orderNo: 'DD20240215001',
    craneId: 'crane001',
    siteName: '光谷中心城项目',
    siteAddress: '武汉市洪山区光谷大道',
    startTime: getDateStr(-3),
    endTime: getDateStr(1),
    days: 5,
    dailyRate: 3500,
    totalAmount: 17500,
    status: 'inProgress',
    scheduleIds: ['sch001', 'sch002', 'sch003'],
    contactPerson: '王经理',
    contactPhone: '138****8888',
    createTime: getDateStr(-5),
    confirmTime: getDateStr(-4),
    remark: '主体结构吊装工程',
    settlementStatus: 'partial'
  },
  {
    id: 'order002',
    orderNo: 'DD20240216002',
    craneId: 'crane002',
    siteName: '长江新区建设',
    siteAddress: '武汉市武昌区和平大道',
    startTime: getDateStr(0),
    endTime: getDateStr(2),
    days: 3,
    dailyRate: 5200,
    totalAmount: 15600,
    status: 'inProgress',
    scheduleIds: ['sch004'],
    contactPerson: '李总',
    contactPhone: '139****6666',
    createTime: getDateStr(-2),
    confirmTime: getDateStr(-1),
    remark: '钢结构吊装作业',
    settlementStatus: 'unsettled'
  },
  {
    id: 'order003',
    orderNo: 'DD20240218003',
    craneId: 'crane003',
    siteName: '东湖科技园项目',
    siteAddress: '武汉市东湖高新区',
    startTime: getDateStr(3),
    endTime: getDateStr(7),
    days: 5,
    dailyRate: 12000,
    totalAmount: 60000,
    status: 'pending',
    scheduleIds: ['sch005'],
    contactPerson: '张工',
    contactPhone: '137****5555',
    createTime: getDateStr(-1),
    remark: '重型设备吊装',
    settlementStatus: 'unsettled'
  },
  {
    id: 'order004',
    orderNo: 'DD20240217004',
    craneId: 'crane004',
    siteName: '青山船厂改造',
    siteAddress: '武汉市青山区',
    startTime: getDateStr(1),
    endTime: getDateStr(3),
    days: 3,
    dailyRate: 2200,
    totalAmount: 6600,
    status: 'confirmed',
    scheduleIds: ['sch006', 'sch007', 'sch008'],
    contactPerson: '陈主任',
    contactPhone: '136****7777',
    createTime: getDateStr(-3),
    confirmTime: getDateStr(-2),
    remark: '船厂改造工程',
    settlementStatus: 'partial'
  },
  {
    id: 'order005',
    orderNo: 'DD20240210005',
    craneId: 'crane008',
    siteName: '硚口商务楼',
    siteAddress: '武汉市硚口区',
    startTime: getDateStr(-5),
    endTime: getDateStr(-1),
    days: 5,
    dailyRate: 7800,
    totalAmount: 39000,
    status: 'completed',
    scheduleIds: ['sch011'],
    contactPerson: '刘总',
    contactPhone: '132****9999',
    createTime: getDateStr(-7),
    confirmTime: getDateStr(-6),
    completeTime: getDateStr(-1),
    remark: '商务楼建设项目',
    settlementStatus: 'settled',
    settlementTime: getDateStr(-1)
  },
  {
    id: 'order006',
    orderNo: 'DD20240219006',
    craneId: 'crane010',
    siteName: '东西湖仓库',
    siteAddress: '武汉市东西湖区',
    startTime: getDateStr(2),
    endTime: getDateStr(4),
    days: 3,
    dailyRate: 2000,
    totalAmount: 6000,
    status: 'confirmed',
    scheduleIds: ['sch012'],
    contactPerson: '周经理',
    contactPhone: '130****3333',
    createTime: getDateStr(0),
    confirmTime: getDateStr(0),
    remark: '仓库改造工程',
    settlementStatus: 'unsettled'
  }
];

export const getOrderById = (id: string): Order | undefined => {
  return orderList.find(o => o.id === id);
};

export const getOrdersByStatus = (status: string): Order[] => {
  return orderList.filter(o => o.status === status);
};

export const getOrdersBySettlement = (status: string): Order[] => {
  return orderList.filter(o => o.settlementStatus === status);
};
