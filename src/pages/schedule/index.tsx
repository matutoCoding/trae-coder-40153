import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import StatusTag from '@/components/StatusTag';
import type { ScheduleItem } from '@/types/schedule';
import { scheduleList } from '@/data/schedules';
import { craneList, getCraneById } from '@/data/cranes';
import { scheduleStatusLabel } from '@/types/schedule';
import { formatDate, formatTime, isToday } from '@/utils/date';
import dayjs from 'dayjs';

const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>({
    year: dayjs().year(),
    month: dayjs().month() + 1
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    console.log('[Schedule] 加载排期数据');
    setSchedules(scheduleList);
  };

  const selectedDateSchedules = useMemo(() => {
    return schedules.filter(s => {
      const startDate = s.startTime.slice(0, 10);
      const endDate = s.endTime.slice(0, 10);
      return selectedDate >= startDate && selectedDate <= endDate;
    });
  }, [schedules, selectedDate]);

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todaySchedules = schedules.filter(s => {
      const start = s.startTime.slice(0, 10);
      const end = s.endTime.slice(0, 10);
      return today >= start && today <= end;
    });

    const occupiedCount = craneList.filter(c => c.status === 'occupied').length;
    const availableCount = craneList.filter(c => c.status === 'available').length;

    return {
      todayTasks: todaySchedules.length,
      totalSchedules: schedules.length,
      occupiedCranes: occupiedCount,
      availableCranes: availableCount
    };
  }, [schedules]);

  const handleDateSelect = (date: string) => {
    console.log('[Schedule] 选择日期:', date);
    setSelectedDate(date);
  };

  const handleMonthChange = (year: number, month: number) => {
    setCurrentMonth({ year, month });
  };

  const handleMergeDemo = () => {
    Taro.showToast({ title: '合并功能演示', icon: 'none' });
  };

  const handleSplitDemo = () => {
    Taro.showToast({ title: '拆分功能演示', icon: 'none' });
  };

  const gotoCrane = (craneId: string) => {
    Taro.navigateTo({
      url: `/pages/crane-detail/index?id=${craneId}`
    });
  };

  const statusTypeMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    confirmed: 'primary',
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerBg}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.todayTasks}</Text>
            <Text className={styles.statLabel}>今日任务</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.availableCranes}</Text>
            <Text className={styles.statLabel}>空闲吊车</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.occupiedCranes}</Text>
            <Text className={styles.statLabel}>作业中</Text>
          </View>
        </View>

        <View className={styles.quickActions}>
          <View className={styles.quickBtn} onClick={handleMergeDemo}>
            <Text>合并排期</Text>
          </View>
          <View className={styles.quickBtn} onClick={handleSplitDemo}>
            <Text>拆分排期</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <ScheduleCalendar
            schedules={schedules}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />

          <View className={styles.legendRow}>
            <View className={styles.legendItem}>
              <View className={styles.legendDot} style={{ backgroundColor: '#1E5EFA' }} />
              <Text className={styles.legendText}>已确认</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={styles.legendDot} style={{ backgroundColor: '#FF7D00' }} />
              <Text className={styles.legendText}>待确认</Text>
            </View>
            <View className={styles.legendItem}>
              <View className={styles.legendDot} style={{ backgroundColor: '#00B42A' }} />
              <Text className={styles.legendText}>已完成</Text>
            </View>
          </View>
        </View>

        <View className={styles.selectedDateInfo}>
          <Text className={styles.selectedDateText}>
            {formatDate(selectedDate, 'YYYY年MM月DD日')} {isToday(selectedDate) ? '(今天)' : ''}
            共 {selectedDateSchedules.length} 条排期
          </Text>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>当日排期详情</Text>
          </View>

          {selectedDateSchedules.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>当日暂无排期</Text>
            </View>
          ) : (
            <View className={styles.scheduleList}>
              {selectedDateSchedules.map(schedule => {
                const crane = getCraneById(schedule.craneId);
                return (
                  <View key={schedule.id} className={styles.scheduleItem}>
                    <View className={styles.scheduleHeader}>
                      <Text className={styles.siteName}>{schedule.siteName}</Text>
                      <StatusTag
                        text={scheduleStatusLabel[schedule.status]}
                        type={statusTypeMap[schedule.status]}
                        size="small"
                      />
                    </View>

                    <View className={styles.scheduleBody}>
                      <View className={styles.scheduleRow}>
                        <Text className={styles.scheduleLabel}>时间</Text>
                        <Text className={styles.scheduleValue}>
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </Text>
                      </View>
                      <View className={styles.scheduleRow}>
                        <Text className={styles.scheduleLabel}>地点</Text>
                        <Text className={styles.scheduleValue}>{schedule.siteAddress}</Text>
                      </View>
                      {schedule.isMerged && (
                        <View className={styles.scheduleRow}>
                          <Text className={styles.scheduleLabel}>合并</Text>
                          <Text className={styles.scheduleValue} style={{ color: '#722ED1' }}>
                            已合并 {schedule.mergedFrom?.length || 0} 个时段
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className={styles.scheduleFooter}>
                      <View className={styles.craneInfo} onClick={() => gotoCrane(schedule.craneId)}>
                        <Text className={styles.craneName}>{crane?.name || '未知吊车'}</Text>
                      </View>
                      <View className={styles.actionBtn} onClick={() => gotoCrane(schedule.craneId)}>
                        <Text>查看详情</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default SchedulePage;
