import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { getDashboardStats, getScheduleConflicts } from '@/store/index';
import type { ScheduleConflict } from '@/types/schedule';

const DashboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [stats, setStats] = useState<any>(null);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);

  const loadData = useCallback(() => {
    const s = getDashboardStats(period);
    setStats(s);
    setConflicts(getScheduleConflicts());
  }, [period]);

  useDidShow(() => {
    loadData();
  });

  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toString();
  };

  const gotoOrders = (type: 'unsettled' | 'partial' | 'settled' | 'all') => {
    Taro.switchTab({ url: '/pages/orders/index' });
  };

  const gotoSchedule = () => {
    Taro.switchTab({ url: '/pages/schedule/index' });
  };

  const gotoCranes = () => {
    Taro.switchTab({ url: '/pages/cranes/index' });
  };

  if (!stats) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const pendingConflicts = conflicts.filter(c => c.status === 'pending');
  const highRiskConflicts = pendingConflicts.filter(c => c.level === 'high');

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>运营看板</Text>
        <View className={styles.periodToggle}>
          <View
            className={`${styles.periodBtn} ${period === 'week' ? styles.periodActive : ''}`}
            onClick={() => setPeriod('week')}
          >
            <Text>本周</Text>
          </View>
          <View
            className={`${styles.periodBtn} ${period === 'month' ? styles.periodActive : ''}`}
            onClick={() => setPeriod('month')}
          >
            <Text>本月</Text>
          </View>
        </View>
        <Text className={styles.periodRange}>{stats.startDate} ~ {stats.endDate}</Text>
      </View>

      <ScrollView className={styles.scrollView} scrollY>
        <View className={styles.statsGrid}>
          <View className={styles.statCard} onClick={gotoOrders}>
            <View className={styles.statIcon} style={{ backgroundColor: '#1E5EFA' }}>
              <Text className={styles.statIconText}>订</Text>
            </View>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.totalOrders}</Text>
              <Text className={styles.statLabel}>订单总数</Text>
            </View>
          </View>

          <View className={styles.statCard} onClick={gotoCranes}>
            <View className={styles.statIcon} style={{ backgroundColor: '#00B42A' }}>
              <Text className={styles.statIconText}>车</Text>
            </View>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>{stats.utilizationRate}%</Text>
              <Text className={styles.statLabel}>吊车利用率</Text>
            </View>
          </View>

          <View className={styles.statCard} onClick={() => gotoOrders('settled')}>
            <View className={styles.statIcon} style={{ backgroundColor: '#FF7D00' }}>
              <Text className={styles.statIconText}>收</Text>
            </View>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>¥{formatAmount(stats.settledAmount)}</Text>
              <Text className={styles.statLabel}>已收款</Text>
            </View>
          </View>

          <View className={styles.statCard} onClick={() => gotoOrders('unsettled')}>
            <View className={styles.statIcon} style={{ backgroundColor: '#F53F3F' }}>
              <Text className={styles.statIconText}>待</Text>
            </View>
            <View className={styles.statContent}>
              <Text className={styles.statValue}>¥{formatAmount(stats.unsettledAmount)}</Text>
              <Text className={styles.statLabel}>待收款</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>营收概览</Text>
            <Text className={styles.sectionSubtitle}>{stats.periodLabel}总订单额 ¥{stats.totalAmount.toLocaleString()}</Text>
          </View>

          <View className={styles.amountBar}>
            {stats.totalAmount > 0 ? (
              <>
                <View className={styles.amountTrack}>
                  <View
                    className={styles.amountFill}
                    style={{ width: `${(stats.settledAmount / stats.totalAmount * 100).toFixed(1)}%` }}
                  />
                </View>
                <View className={styles.amountLegend}>
                  <View className={styles.legendItem}>
                    <View className={styles.legendDot} style={{ backgroundColor: '#00B42A' }} />
                    <Text className={styles.legendText}>已收 ¥{stats.settledAmount.toLocaleString()}</Text>
                  </View>
                  <View className={styles.legendItem}>
                    <View className={styles.legendDot} style={{ backgroundColor: '#F53F3F' }} />
                    <Text className={styles.legendText}>待收 ¥{stats.unsettledAmount.toLocaleString()}</Text>
                  </View>
                </View>
                <Text className={styles.collectionRate}>
                  回款率 {stats.totalAmount > 0 ? (stats.settledAmount / stats.totalAmount * 100).toFixed(1) : 0}%
                </Text>
              </>
            ) : (
              <Text className={styles.emptyText}>暂无数据</Text>
            )}
          </View>
        </View>

        <View className={styles.sectionCard} onClick={gotoSchedule}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>排期风险</Text>
            <Text className={styles.sectionArrow}>查看全部 ›</Text>
          </View>

          <View className={styles.riskRow}>
            <View className={styles.riskItem}>
              <Text className={styles.riskValue} style={{ color: '#F53F3F' }}>{highRiskConflicts.length}</Text>
              <Text className={styles.riskLabel}>高风险</Text>
            </View>
            <View className={styles.riskItem}>
              <Text className={styles.riskValue} style={{ color: '#FF7D00' }}>{pendingConflicts.filter(c => c.level === 'medium').length}</Text>
              <Text className={styles.riskLabel}>中风险</Text>
            </View>
            <View className={styles.riskItem}>
              <Text className={styles.riskValue} style={{ color: '#FFAA00' }}>{pendingConflicts.filter(c => c.level === 'low').length}</Text>
              <Text className={styles.riskLabel}>低风险</Text>
            </View>
            <View className={styles.riskItem}>
              <Text className={styles.riskValue} style={{ color: '#86909C' }}>{conflicts.length - pendingConflicts.length}</Text>
              <Text className={styles.riskLabel}>已处理</Text>
            </View>
          </View>

          {pendingConflicts.length > 0 && (
            <View className={styles.riskList}>
              {pendingConflicts.slice(0, 3).map(c => (
                <View key={c.id} className={styles.riskCard}>
                  <View
                    className={styles.riskLevelTag}
                    style={{ backgroundColor: c.level === 'high' ? '#F53F3F' : c.level === 'medium' ? '#FF7D00' : '#FFAA00' }}
                  >
                    <Text>{c.level === 'high' ? '高危' : c.level === 'medium' ? '中危' : '低危'}</Text>
                  </View>
                  <View className={styles.riskInfo}>
                    <Text className={styles.riskTitle}>{c.title}</Text>
                    <Text className={styles.riskDesc}>{c.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className={styles.sectionCard} onClick={gotoCranes}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>吊车运营</Text>
            <Text className={styles.sectionArrow}>查看全部 ›</Text>
          </View>

          <View className={styles.craneStats}>
            <View className={styles.craneStatItem}>
              <Text className={styles.craneStatValue}>{stats.totalCranes}</Text>
              <Text className={styles.craneStatLabel}>总吊车数</Text>
            </View>
            <View className={styles.craneStatItem}>
              <Text className={styles.craneStatValue}>{stats.occupiedCranes}</Text>
              <Text className={styles.craneStatLabel}>作业中</Text>
            </View>
            <View className={styles.craneStatItem}>
              <Text className={styles.craneStatValue}>{stats.totalCranes - stats.occupiedCranes}</Text>
              <Text className={styles.craneStatLabel}>空闲</Text>
            </View>
            <View className={styles.craneStatItem}>
              <Text className={styles.craneStatValue}>{stats.periodScheduleCount}</Text>
              <Text className={styles.craneStatLabel}>本期排期</Text>
            </View>
          </View>

          <View className={styles.utilizationBar}>
            <Text className={styles.utilizationLabel}>整体利用率</Text>
            <View className={styles.utilizationTrack}>
              <View
                className={styles.utilizationFill}
                style={{ width: `${stats.utilizationRate}%` }}
              />
            </View>
            <Text className={styles.utilizationValue}>{stats.utilizationRate}%</Text>
          </View>
        </View>

        <View className={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
};

export default DashboardPage;
