import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import OrderCard from '@/components/OrderCard';
import type { Order, SettlementRecord } from '@/types/order';
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

    const unsettledOrders = orders.filter(o => o.settlementStatus === 'unsettled');
    const partialOrders = orders.filter(o => o.settlementStatus === 'partial');
    const settledOrders = orders.filter(o => o.settlementStatus === 'settled');

    const unsettledStatusAmount = unsettledOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const partialStatusAmount = partialOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const settledStatusAmount = settledOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const totalCollected = orders.reduce((sum, o) => sum + (o.settledAmount || 0), 0);
    const totalUncollected = orders
      .filter(o => o.settlementStatus !== 'settled')
      .reduce((sum, o) => sum + (o.totalAmount - (o.settledAmount || 0)), 0);

    const allRecords = orders
      .flatMap(o => (o.settlementRecords || []).map(r => ({ ...r, orderNo: o.orderNo })))
      .sort((a, b) => b.payTime.localeCompare(a.payTime));

    return {
      total,
      pending,
      inProgress,
      completed,
      totalAmount,
      unsettledAmount: totalUncollected,
      unsettledStatusAmount,
      partialStatusAmount,
      settledStatusAmount,
      totalCollected,
      totalUncollected,
      recentRecords: allRecords.slice(0, 3)
    };
  }, [orders]);

  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toString();
  };

  const settlementTypeLabel: Record<string, string> = {
    deposit: '定金',
    progress: '进度款',
    final: '尾款'
  };

  const gotoOrder = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
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
          <Text className={styles.summaryTitle}>结算进度</Text>

          <View className={styles.progressBarRow}>
            {stats.totalAmount > 0 ? (
              <>
                <View className={styles.progressBar}>
                  {stats.unsettledStatusAmount > 0 && (
                    <View
                      className={styles.progressSegment}
                      style={{
                        width: `${(stats.unsettledStatusAmount / stats.totalAmount * 100).toFixed(1)}%`,
                        backgroundColor: '#F53F3F'
                      }}
                    />
                  )}
                  {stats.partialStatusAmount > 0 && (
                    <View
                      className={styles.progressSegment}
                      style={{
                        width: `${(stats.partialStatusAmount / stats.totalAmount * 100).toFixed(1)}%`,
                        backgroundColor: '#FF7D00'
                      }}
                    />
                  )}
                  {stats.settledStatusAmount > 0 && (
                    <View
                      className={styles.progressSegment}
                      style={{
                        width: `${(stats.settledStatusAmount / stats.totalAmount * 100).toFixed(1)}%`,
                        backgroundColor: '#00B42A'
                      }}
                    />
                  )}
                </View>
                <View className={styles.progressLegend}>
                  <View className={styles.legendItem}>
                    <View className={styles.legendDot} style={{ backgroundColor: '#F53F3F' }} />
                    <Text className={styles.legendText}>未结清 ¥{stats.unsettledStatusAmount.toLocaleString()} ({stats.totalAmount > 0 ? (stats.unsettledStatusAmount / stats.totalAmount * 100).toFixed(0) : 0}%)</Text>
                  </View>
                  <View className={styles.legendItem}>
                    <View className={styles.legendDot} style={{ backgroundColor: '#FF7D00' }} />
                    <Text className={styles.legendText}>部分结清 ¥{stats.partialStatusAmount.toLocaleString()} ({stats.totalAmount > 0 ? (stats.partialStatusAmount / stats.totalAmount * 100).toFixed(0) : 0}%)</Text>
                  </View>
                  <View className={styles.legendItem}>
                    <View className={styles.legendDot} style={{ backgroundColor: '#00B42A' }} />
                    <Text className={styles.legendText}>已结清 ¥{stats.settledStatusAmount.toLocaleString()} ({stats.totalAmount > 0 ? (stats.settledStatusAmount / stats.totalAmount * 100).toFixed(0) : 0}%)</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text className={styles.emptyText}>暂无结算数据</Text>
            )}
          </View>

          {stats.recentRecords.length > 0 && (
            <View className={styles.recentRecords}>
              <Text className={styles.recentTitle}>最近收款记录</Text>
              {stats.recentRecords.map((record: SettlementRecord & { orderNo: string }) => (
                <View
                  key={record.id}
                  className={styles.recentItem}
                  onClick={() => gotoOrder(record.orderId)}
                >
                  <View className={styles.recentLeft}>
                    <View className={styles.recentTypeTag}>
                      <Text>{settlementTypeLabel[record.type] || '结算'}</Text>
                    </View>
                    <View>
                      <Text className={styles.recentOrderNo}>{record.orderNo}</Text>
                      <Text className={styles.recentTime}>{record.payTime}</Text>
                    </View>
                  </View>
                  <View className={styles.recentRight}>
                    <Text className={styles.recentAmount}>+¥{record.amount.toLocaleString()}</Text>
                    {record.remark && (
                      <Text className={styles.recentRemark}>{record.remark}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

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
