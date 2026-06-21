import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import StatusTag from '@/components/StatusTag';
import type { Order } from '@/types/order';
import type { Crane } from '@/types/crane';
import { getOrderById, getCraneById, settleOrder, partialSettleOrder } from '@/store/index';
import { orderStatusLabel, settlementStatusLabel } from '@/types/order';
import { matchLevelLabel as recMatchLevelLabel, matchLevelColor as recMatchLevelColor } from '@/types/recommend';
import { formatDate, formatDateTime } from '@/utils/date';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [crane, setCrane] = useState<Crane | null>(null);
  const [showSettle, setShowSettle] = useState(false);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleRemark, setSettleRemark] = useState('');

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

  useEffect(() => {
    const id = router.params.id as string;
    if (id) {
      loadOrderDetail(id);
    }
  }, [router.params.id]);

  useDidShow(() => {
    const id = router.params.id as string;
    if (id) {
      loadOrderDetail(id);
    }
  });

  const remainingAmount = useMemo(() => {
    if (!order) return 0;
    return order.totalAmount - (order.settledAmount || 0);
  }, [order]);

  const handleSettle = () => {
    setSettleAmount(String(remainingAmount || ''));
    setSettleRemark('');
    setShowSettle(true);
  };

  const handleConfirmSettle = () => {
    if (!order) return;
    const amount = Number(settleAmount);
    if (!amount || amount <= 0) {
      Taro.showToast({ title: '请输入正确的结算金额', icon: 'none' });
      return;
    }
    if (amount > remainingAmount) {
      Taro.showToast({ title: `金额不能超过剩余 ¥${remainingAmount}`, icon: 'none' });
      return;
    }

    let updated;
    if (amount >= remainingAmount - 0.01) {
      updated = settleOrder(order.id);
    } else {
      updated = partialSettleOrder(order.id, amount, settleRemark.trim());
    }

    if (updated) {
      setOrder(updated);
      setShowSettle(false);
      Taro.showToast({ title: '结算成功', icon: 'success' });
    } else {
      Taro.showToast({ title: '结算失败', icon: 'error' });
    }
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

  const settlementTypeLabel: Record<string, string> = {
    deposit: '定金',
    progress: '进度款',
    final: '尾款'
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const showSettleBtn = order.settlementStatus !== 'settled' && order.status !== 'cancelled';
  const records = order.settlementRecords || [];

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
            {order.settledAmount && order.settledAmount > 0 && (
              <View className={styles.priceRow}>
                <Text className={styles.priceLabel}>已结算</Text>
                <Text className={styles.priceValue} style={{ color: '#00B42A' }}>
                  ¥{order.settledAmount.toLocaleString()}
                </Text>
              </View>
            )}
            {remainingAmount > 0 && (
              <View className={styles.priceRow}>
                <Text className={styles.priceLabel}>待结算</Text>
                <Text className={classnames(styles.priceValue, styles.warning)}>
                  ¥{remainingAmount.toLocaleString()}
                </Text>
              </View>
            )}
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

        {records.length > 0 && (
          <View className={styles.infoCard}>
            <Text className={styles.cardTitle}>结算记录</Text>
            <View className={styles.recordList}>
              {records.map((record, index) => (
                <View key={record.id} className={styles.recordItem}>
                  <View className={styles.recordHeader}>
                    <View className={styles.recordTypeTag}>
                      <Text>{settlementTypeLabel[record.type] || '结算'}</Text>
                    </View>
                    <Text className={styles.recordAmount}>+¥{record.amount.toLocaleString()}</Text>
                  </View>
                  <View className={styles.recordBody}>
                    <Text className={styles.recordTime}>{formatDateTime(record.payTime)}</Text>
                    {record.remark && (
                      <Text className={styles.recordRemark}>备注：{record.remark}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {order.recommendTrace && (
          <View className={styles.infoCard}>
            <Text className={styles.cardTitle}>推荐追溯信息</Text>
            <View className={styles.traceHeader}>
              <View className={styles.traceScoreBox}>
                <Text className={styles.traceScoreValue}>{order.recommendTrace.score}</Text>
                <Text className={styles.traceScoreLabel}>分</Text>
              </View>
              <View
                className={styles.traceLevelTag}
                style={{ backgroundColor: recMatchLevelColor[order.recommendTrace.matchLevel] }}
              >
                <Text style={{ color: '#fff' }}>{recMatchLevelLabel[order.recommendTrace.matchLevel]}</Text>
              </View>
              {order.recommendTrace.rank && (
                <View className={styles.traceRank}>
                  <Text className={styles.traceRankText}>推荐第 {order.recommendTrace.rank} 名</Text>
                </View>
              )}
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>需求吨位</Text>
              <Text className={styles.infoValue}>{order.recommendTrace.requiredTonnage} 吨</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>首选机型</Text>
              <Text className={styles.infoValue}>{order.recommendTrace.preferredType}</Text>
            </View>
            <View className={styles.traceWeights}>
              <Text className={styles.traceWeightsLabel}>当时权重配置</Text>
              <View className={styles.traceWeightList}>
                {Object.entries(order.recommendTrace.weightConfig).map(([key, value]) => {
                  const labels: Record<string, string> = {
                    tonnage: '吨位',
                    model: '机型',
                    distance: '距离',
                    price: '价格',
                    availability: '可用性',
                    rating: '评分'
                  };
                  return (
                    <Text key={key} className={styles.traceWeightTag}>
                      {labels[key]}: {value}%
                    </Text>
                  );
                })}
              </View>
            </View>
          </View>
        )}
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

      {showSettle && (
        <View className={styles.settleOverlay}>
          <View className={styles.settleCard}>
            <Text className={styles.settleTitle}>结算确认</Text>
            <View className={styles.settleSummary}>
              <Text className={styles.settleLabel}>订单总额</Text>
              <Text className={styles.settleTotal}>¥{order.totalAmount.toLocaleString()}</Text>
            </View>
            <View className={styles.settleSummary}>
              <Text className={styles.settleLabel}>已结算</Text>
              <Text className={styles.settleSettled}>¥{(order.settledAmount || 0).toLocaleString()}</Text>
            </View>
            <View className={styles.settleSummary}>
              <Text className={styles.settleLabel}>待结算</Text>
              <Text className={styles.settleRemaining}>¥{remainingAmount.toLocaleString()}</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>本次结算金额(元)</Text>
              <Input
                className={styles.formInput}
                type="digit"
                placeholder="请输入结算金额"
                value={settleAmount}
                onInput={(e) => setSettleAmount(e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注</Text>
              <Input
                className={styles.formInput}
                placeholder="选填，如：定金、进度款等"
                value={settleRemark}
                onInput={(e) => setSettleRemark(e.detail.value)}
              />
            </View>

            <View className={styles.settleActions}>
              <View className={styles.settleCancel} onClick={() => setShowSettle(false)}>
                <Text>取消</Text>
              </View>
              <View className={styles.settleOk} onClick={handleConfirmSettle}>
                <Text>确认结算</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default OrderDetailPage;
