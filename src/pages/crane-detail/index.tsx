import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import type { Crane } from '@/types/crane';
import type { ScheduleItem } from '@/types/schedule';
import { getCraneById } from '@/data/cranes';
import { getSchedulesByCrane } from '@/data/schedules';
import { craneTypeLabel, craneStatusLabel } from '@/types/crane';
import { scheduleStatusLabel } from '@/types/schedule';
import { formatDateTime } from '@/utils/date';

const CraneDetailPage: React.FC = () => {
  const router = useRouter();
  const [crane, setCrane] = useState<Crane | null>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    const id = router.params.id as string;
    if (id) {
      loadCraneDetail(id);
    }
  }, [router.params.id]);

  const loadCraneDetail = (id: string) => {
    console.log('[CraneDetail] 加载吊车详情:', id);
    const craneData = getCraneById(id);
    if (craneData) {
      setCrane(craneData);
      const scheduleData = getSchedulesByCrane(id);
      setSchedules(scheduleData);
    }
  };

  const handleBook = () => {
    Taro.showToast({ title: '预约功能开发中', icon: 'none' });
  };

  const handleContact = () => {
    if (crane?.phone) {
      Taro.makePhoneCall({
        phoneNumber: crane.phone.replace(/\*/g, '0')
      }).catch(() => {
        Taro.showToast({ title: '拨号功能需真机测试', icon: 'none' });
      });
    }
  };

  const statusTypeMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    available: 'success',
    occupied: 'error',
    maintenance: 'warning',
    offline: 'info'
  };

  if (!crane) {
    return (
      <View className={styles.page}>
        <View className={styles.emptyState}>
          <Text className={styles.emptyText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerImage}>
        <Image
          className={styles.image}
          src={crane.imageUrl}
          mode="aspectFill"
        />
        <View className={styles.headerOverlay}>
          <Text className={styles.craneName}>{crane.name}</Text>
          <Text className={styles.craneModel}>{crane.model} · {crane.plateNumber}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>基本信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>吨位</Text>
              <Text className={styles.infoValue}>{crane.tonnage}吨</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>机型</Text>
              <Text className={styles.infoValue}>{craneTypeLabel[crane.type]}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>状态</Text>
              <StatusTag
                text={craneStatusLabel[crane.status]}
                type={statusTypeMap[crane.status]}
                size="small"
              />
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>位置</Text>
              <Text className={styles.infoValue}>{crane.location}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>司机</Text>
              <Text className={styles.infoValue}>{crane.operator}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>联系电话</Text>
              <Text className={styles.infoValue}>{crane.phone}</Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>台班价格</Text>
          <View className={styles.priceRow}>
            <Text className={styles.priceSymbol}>¥</Text>
            <Text className={styles.priceValue}>{crane.dailyRate}</Text>
            <Text className={styles.priceUnit}>/ 台班</Text>
          </View>
          {crane.description && (
            <Text className={styles.infoLabel}>{crane.description}</Text>
          )}
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>排期记录</Text>
          {schedules.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>暂无排期记录</Text>
            </View>
          ) : (
            <View className={styles.scheduleList}>
              {schedules.map(schedule => (
                <View key={schedule.id} className={styles.scheduleItem}>
                  <Text className={styles.scheduleSite}>{schedule.siteName}</Text>
                  <Text className={styles.scheduleTime}>
                    {formatDateTime(schedule.startTime)} ~ {formatDateTime(schedule.endTime)}
                  </Text>
                  <Text className={styles.scheduleStatus}>
                    {scheduleStatusLabel[schedule.status]}
                    {schedule.isMerged && ' · 已合并'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>设备信息</Text>
          <View className={styles.infoGrid}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>购置日期</Text>
              <Text className={styles.infoValue}>{crane.buyDate || '-'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>上次维保</Text>
              <Text className={styles.infoValue}>{crane.lastMaintenance || '-'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnSecondary} onClick={handleContact}>
          <Text>联系司机</Text>
        </View>
        <View className={styles.btnPrimary} onClick={handleBook}>
          <Text>立即预约</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default CraneDetailPage;
