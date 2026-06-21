import type { ScheduleItem } from '@/types/schedule';
import { craneList } from './cranes';

const today = new Date();
const getDateStr = (daysOffset: number, hour = 8, minute = 0): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().slice(0, 16).replace('T', ' ');
};

export const scheduleList: ScheduleItem[] = [
  {
    id: 'sch001',
    craneId: 'crane001',
    siteName: '光谷中心城项目',
    siteAddress: '武汉市洪山区光谷大道',
    startTime: getDateStr(-3, 8, 0),
    endTime: getDateStr(-2, 18, 0),
    status: 'completed',
    orderId: 'order001',
    remark: '主体结构吊装'
  },
  {
    id: 'sch002',
    craneId: 'crane001',
    siteName: '光谷中心城项目',
    siteAddress: '武汉市洪山区光谷大道',
    startTime: getDateStr(-1, 8, 0),
    endTime: getDateStr(1, 18, 0),
    status: 'confirmed',
    isMerged: true,
    mergedFrom: ['sch002', 'sch003'],
    orderId: 'order001',
    remark: '连续作业，已合并3天'
  },
  {
    id: 'sch004',
    craneId: 'crane002',
    siteName: '长江新区建设',
    siteAddress: '武汉市武昌区和平大道',
    startTime: getDateStr(0, 9, 0),
    endTime: getDateStr(2, 17, 0),
    status: 'confirmed',
    orderId: 'order002',
    remark: '钢结构吊装作业'
  },
  {
    id: 'sch005',
    craneId: 'crane003',
    siteName: '东湖科技园项目',
    siteAddress: '武汉市东湖高新区',
    startTime: getDateStr(3, 8, 0),
    endTime: getDateStr(7, 18, 0),
    status: 'pending',
    orderId: 'order003',
    remark: '重型设备吊装'
  },
  {
    id: 'sch006',
    craneId: 'crane004',
    siteName: '青山船厂改造',
    siteAddress: '武汉市青山区',
    startTime: getDateStr(1, 8, 0),
    endTime: getDateStr(1, 17, 0),
    status: 'confirmed',
    orderId: 'order004',
    remark: '单日吊装作业'
  },
  {
    id: 'sch007',
    craneId: 'crane004',
    siteName: '青山船厂改造',
    siteAddress: '武汉市青山区',
    startTime: getDateStr(2, 8, 0),
    endTime: getDateStr(2, 17, 0),
    status: 'confirmed',
    orderId: 'order004',
    remark: '连续第二天'
  },
  {
    id: 'sch008',
    craneId: 'crane004',
    siteName: '青山船厂改造',
    siteAddress: '武汉市青山区',
    startTime: getDateStr(3, 8, 0),
    endTime: getDateStr(3, 17, 0),
    status: 'pending',
    orderId: 'order004',
    remark: '连续第三天'
  },
  {
    id: 'sch009',
    craneId: 'crane006',
    siteName: '江夏产业园',
    siteAddress: '武汉市江夏区',
    startTime: getDateStr(5, 8, 0),
    endTime: getDateStr(6, 18, 0),
    status: 'pending',
    remark: '场地平整辅助吊装'
  },
  {
    id: 'sch010',
    craneId: 'crane007',
    siteName: '黄陂物流中心',
    siteAddress: '武汉市黄陂区',
    startTime: getDateStr(10, 8, 0),
    endTime: getDateStr(15, 18, 0),
    status: 'pending',
    remark: '大型设备安装'
  },
  {
    id: 'sch011',
    craneId: 'crane008',
    siteName: '硚口商务楼',
    siteAddress: '武汉市硚口区',
    startTime: getDateStr(-5, 8, 0),
    endTime: getDateStr(-1, 18, 0),
    status: 'completed',
    orderId: 'order005',
    remark: '商务楼建设吊装'
  },
  {
    id: 'sch012',
    craneId: 'crane010',
    siteName: '东西湖仓库',
    siteAddress: '武汉市东西湖区',
    startTime: getDateStr(2, 8, 0),
    endTime: getDateStr(4, 17, 0),
    status: 'confirmed',
    orderId: 'order006',
    remark: '仓库改造吊装'
  }
];

export const getSchedulesByCrane = (craneId: string): ScheduleItem[] => {
  return scheduleList.filter(s => s.craneId === craneId);
};

export const getSchedulesByDate = (date: string): ScheduleItem[] => {
  return scheduleList.filter(s => {
    const startDate = s.startTime.slice(0, 10);
    const endDate = s.endTime.slice(0, 10);
    return date >= startDate && date <= endDate;
  });
};

export const getSchedulesBySite = (siteName: string): ScheduleItem[] => {
  return scheduleList.filter(s => s.siteName === siteName);
};
