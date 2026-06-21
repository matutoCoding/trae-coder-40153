import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusTag from '../StatusTag';
import type { Order } from '@/types/order';
import { orderStatusLabel, settlementStatusLabel } from '@/types/order';
import { formatDate } from '@/utils/date';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/order-detail/index?id=${order.id}`
      });
    }
  };

  const orderStatusTypeMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    pending: 'warning',
    confirmed: 'primary',
    inProgress: 'info',
    completed: 'success',
    cancelled: 'error'
  };

  const settlementTypeMap: Record<string, 'success' | 'error' | 'warning'> = {
    unsettled: 'error',
    partial: 'warning',
    settled: 'success'
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.orderNo}>{order.orderNo}</Text>
        <StatusTag
          text={orderStatusLabel[order.status]}
          type={orderStatusTypeMap[order.status] || 'info'}
          size="small"
        />
      </View>

      <View className={styles.body}>
        <Text className={styles.siteName}>{order.siteName}</Text>
        <Text className={styles.siteAddress}>{order.siteAddress}</Text>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>作业时间</Text>
            <Text className={styles.infoValue}>
              {formatDate(order.startTime, 'MM-DD')} ~ {formatDate(order.endTime, 'MM-DD')}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>共{order.days}台班</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>联系人</Text>
            <Text className={styles.infoValue}>{order.contactPerson}</Text>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.settlementBox}>
          <StatusTag
            text={settlementStatusLabel[order.settlementStatus]}
            type={settlementTypeMap[order.settlementStatus] || 'warning'}
            size="small"
          />
        </View>
        <View className={styles.priceBox}>
          <Text className={styles.priceLabel}>合计</Text>
          <Text className={styles.priceSymbol}>¥</Text>
          <Text className={styles.priceValue}>{order.totalAmount}</Text>
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
