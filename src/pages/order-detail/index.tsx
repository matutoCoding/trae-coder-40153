import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import StatusTag from '@/components/StatusTag';
import type { Order } from '@/types/order';
import type { Crane } from '@/types/crane';
import { getOrderById } from '@/data/orders';
import { getCraneById } from '@/data/cranes';
import { orderStatusLabel, settlementStatusLabel } from '@/types/order';
import { formatDate, formatDateTime } from '@/utils/date';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [crane, setCrane] = useState<Crane | null>(null);

  useEffect(() => {
    const id = router.params.id as string;
    if (id) {
      loadOrderDetail(id);
    }
  }, [router.params.id]);

  const loadOrderDetail = (id: string) => {
    console.log('[OrderDetail] 加载订单详情:', id);
    const orderData = getOrderById(id);
    if (orderData) {
      setOrder(orderData);
      const craneData = getCraneById(orderData.craneId);
      if (craneData) {
        setCrane(craneData);
      }
    }
  };

  const handleSettle = () => {
    Taro.showModal({
      title: '确认结算',
      content: `确认结算该订单，金额 ¥${order?.totalAmount.toLocaleString()}？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '结算成功', icon: 'success' });
        }
      }
    });
  };

  const handleContact = () => {
    if (order?.contactPhone) {
      Taro.makePhoneCall({
        phoneNumber: order.contactPhone.replace(/\*/g, '0')
      }).catch(() => {
        Taro.showToast({ title: '拨号功能需真机测试', icon: 'none' });
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

  if (!order) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const showSettleBtn = order.settlementStatus !== 'settled' && order.status !== 'cancelled';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.orderStatus}>{orderStatusLabel[order.status]}</Text>
        <Text className={styles.orderNo}>订单号：{order.orderNo}</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>工地信息</Text>
          <View className={styles.siteInfo}>
            <Text className={styles.siteName}>{order.siteName}</Text>
            <Text className={styles.siteAddress}>{order.siteAddress}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>开始时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(order.startTime)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>结束时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(order.endTime)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>作业天数</Text>
            <Text className={styles.infoValue}>{order.days} 台班</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>联系人</Text>
            <Text className={styles.infoValue}>
              {order.contactPerson} · {order.contactPhone}
            </Text>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>吊车信息</Text>
          {crane && (
            <View className={styles.craneBox}>
              <Image
                className={styles.craneImage}
                src={crane.imageUrl}
                mode="aspectFill"
              />
              <View className={styles.craneInfo}>
                <View>
                  <Text className={styles.craneName}>{crane.name}</Text>
                  <Text className={styles.craneSpec}>
                    {crane.tonnage}吨 · {crane.plateNumber}
                  </Text>
                </View>
                <Text className={styles.cranePrice}>¥{crane.dailyRate}/台班</Text>
              </View>
            </View>
          )}
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>费用明细</Text>
          <View className={styles.priceDetail}>
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>台班单价</Text>
              <Text className={styles.priceValue}>¥{order.dailyRate.toLocaleString()}</Text>
            </View>
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>作业天数</Text>
              <Text className={styles.priceValue}>{order.days} 天</Text>
            </View>
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>订单总额</Text>
              <Text className={classnames(styles.priceValue, styles.highlight)}>
                ¥{order.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>结算状态</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>结算状态</Text>
            <StatusTag
              text={settlementStatusLabel[order.settlementStatus]}
              type={order.settlementStatus === 'settled' ? 'success' : order.settlementStatus === 'partial' ? 'warning' : 'error'}
              size="small"
            />
          </View>
          {order.settlementTime && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>结算时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(order.settlementTime)}</Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(order.createTime)}</Text>
          </View>
          {order.remark && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>备注</Text>
              <Text className={styles.infoValue}>{order.remark}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnSecondary} onClick={handleContact}>
          <Text>联系客户</Text>
        </View>
        {showSettleBtn ? (
          <View className={styles.btnSuccess} onClick={handleSettle}>
            <Text>确认结算</Text>
          </View>
        ) : (
          <View className={styles.btnPrimary}>
            <Text>查看详情</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default OrderDetailPage;
