import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import OrderCard from '@/components/OrderCard';
import type { Order } from '@/types/order';
import { getOrders } from '@/store/index';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');

  const loadOrders = useCallback(() => {
    console.log('[Orders] 加载订单数据');
    setOrders(getOrders());
  }, []);

  useDidShow(() => {
    loadOrders();
  });

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待确认' },
    { key: 'inProgress', label: '进行中' },
    { key: 'completed', label: '已完成' }
  ];

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProgress = orders.filter(o => o.status === 'inProgress').length;
    const completed = orders.filter(o => o.status === 'completed').length;

    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const unsettledAmount = orders
      .filter(o => o.settlementStatus !== 'settled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      total,
      pending,
      inProgress,
      completed,
      totalAmount,
      unsettledAmount
    };
  }, [orders]);

  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toString();
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>全部订单</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.inProgress}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>

        <View className={styles.amountBox}>
          <Text className={styles.amountLabel}>待结算金额</Text>
          <View>
            <Text className={styles.amountSymbol}>¥</Text>
            <Text className={styles.amountValue}>{formatAmount(stats.unsettledAmount)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.filterTabs}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={classnames(styles.filterTab, activeTab === tab.key && styles.active)}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.summaryCard}>
          <Text className={styles.summaryTitle}>本月结算概览</Text>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>订单总额</Text>
            <Text className={classnames(styles.summaryValue, styles.highlight)}>
              ¥{stats.totalAmount.toLocaleString()}
            </Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>已结算</Text>
            <Text className={styles.summaryValue}>
              ¥{(stats.totalAmount - stats.unsettledAmount).toLocaleString()}
            </Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>待结算</Text>
            <Text className={classnames(styles.summaryValue, styles.highlight)}>
              ¥{stats.unsettledAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>订单列表</Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无相关订单</Text>
          </View>
        ) : (
          <View className={styles.orderList}>
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default OrdersPage;
