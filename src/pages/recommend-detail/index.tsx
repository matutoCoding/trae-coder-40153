import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import type { Crane } from '@/types/crane';
import type { RecommendItem } from '@/types/recommend';
import { matchLevelLabel, matchLevelColor } from '@/types/recommend';
import { craneTypeLabel } from '@/types/crane';
import { calculateRecommendScore, getRecommendedCranes } from '@/utils/recommend';
import { getCraneById, getWeightConfig, getCranes, createOrderFromMatch } from '@/store/index';
import dayjs from 'dayjs';

const RecommendDetailPage: React.FC = () => {
  const router = useRouter();
  const [crane, setCrane] = useState<Crane | null>(null);
  const [recommendItem, setRecommendItem] = useState<RecommendItem | null>(null);
  const [topCandidates, setTopCandidates] = useState<Array<{
    craneId: string;
    craneName: string;
    tonnage: number;
    score: number;
    rank: number;
    matchLevel: 'perfect' | 'good' | 'normal' | 'low';
    dailyRate: number;
  }>>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formDays, setFormDays] = useState('3');
  const [formContact, setFormContact] = useState('张工');
  const [formPhone, setFormPhone] = useState('13888888888');
  const [formRemark, setFormRemark] = useState('');

  const requestParams = useMemo(() => {
    const tonnage = Number(router.params.tonnage) || 0;
    const preferredType = (router.params.preferredType as string) || 'truck';
    const siteName = decodeURIComponent(router.params.siteName as string || '未指定工地');
    const siteAddress = decodeURIComponent(router.params.siteAddress as string || '未指定地址');
    const initialRank = Number(router.params.rank) || 1;
    const initialScore = Number(router.params.score) || 0;
    const initialMatchLevel = (router.params.matchLevel as any) || 'normal';
    return { siteName, siteAddress, requiredTonnage: tonnage, preferredType, initialRank, initialScore, initialMatchLevel };
  }, [router.params]);

  useEffect(() => {
    const craneId = router.params.craneId as string;
    if (craneId) {
      loadData(craneId, requestParams.requiredTonnage, requestParams.preferredType);
    }
  }, [router.params.craneId]);

  const loadData = (craneId: string, tonnage: number, preferredType: string) => {
    console.log('[RecommendDetail] 加载推荐详情:', craneId);
    const craneData = getCraneById(craneId);
    if (craneData) {
      setCrane(craneData);

      const weightConfig = getWeightConfig();
      const craneList = getCranes();
      const avgRate = craneList.reduce((sum, c) => sum + c.dailyRate, 0) / craneList.length;

      const request = {
        siteName: '',
        siteAddress: '',
        requiredTonnage: tonnage,
        preferredType,
        startTime: '',
        endTime: '',
        distance: 0
      };

      const result = calculateRecommendScore(craneData, request, weightConfig, avgRate);

      // 按当前权重在全量推荐中的真实排名
      const allResults = getRecommendedCranes(craneList, request, weightConfig, 999);
      const currentIdx = allResults.findIndex(r => r.crane.id === craneId);
      const realRank = currentIdx >= 0 ? currentIdx + 1 : requestParams.initialRank;

      const top5 = allResults.slice(0, 5).map((r, i) => ({
        craneId: r.crane.id,
        craneName: r.crane.name,
        tonnage: r.crane.tonnage,
        score: r.score,
        rank: i + 1,
        matchLevel: r.matchLevel,
        dailyRate: r.crane.dailyRate
      }));
      setTopCandidates(top5);

      setRecommendItem({
        ...result,
        rank: realRank
      });
    }
  };

  const totalAmount = useMemo(() => {
    const days = Number(formDays) || 0;
    return (crane?.dailyRate || 0) * days;
  }, [formDays, crane]);

  const handleMatch = () => {
    if (!crane) return;
    setShowConfirm(true);
  };

  const handleConfirmMatch = () => {
    if (!crane) return;

    const days = Number(formDays);
    if (!days || days <= 0 || !Number.isInteger(days)) {
      Taro.showToast({ title: '请输入正确的台班数', icon: 'none' });
      return;
    }
    if (!formContact.trim()) {
      Taro.showToast({ title: '请输入联系人', icon: 'none' });
      return;
    }
    if (!formPhone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }

    const now = dayjs();
    const endDate = now.add(days - 1, 'day').hour(18).minute(0);

    const selectionReason = `综合评分第 ${recommendItem?.rank || 1} 名，${matchLevelLabel[recommendItem?.matchLevel || 'normal']}，${requestParams.requiredTonnage}吨需求匹配度高`;

    const result = createOrderFromMatch({
      craneId: crane.id,
      siteName: requestParams.siteName,
      siteAddress: requestParams.siteAddress,
      startTime: now.format('YYYY-MM-DD HH:mm'),
      endTime: endDate.format('YYYY-MM-DD HH:mm'),
      days,
      dailyRate: crane.dailyRate,
      contactPerson: formContact.trim(),
      contactPhone: formPhone.trim(),
      remark: formRemark.trim() || '智能推荐撮合',
      weightConfig: getWeightConfig(),
      requiredTonnage: requestParams.requiredTonnage,
      preferredType: requestParams.preferredType,
      recommendScore: recommendItem?.score || 0,
      matchLevel: recommendItem?.matchLevel || 'normal',
      recommendRank: recommendItem?.rank,
      recommendTime: now.format('YYYY-MM-DD HH:mm'),
      candidates: topCandidates,
      selectionReason
    });

    Taro.showToast({ title: '撮合成功', icon: 'success' });
    setTimeout(() => {
      Taro.redirectTo({
        url: `/pages/order-detail/index?id=${result.order.id}`
      });
    }, 1500);
  };

  const handleViewCrane = () => {
    if (crane) {
      Taro.navigateTo({
        url: `/pages/crane-detail/index?id=${crane.id}`
      });
    }
  };

  if (!crane || !recommendItem) {
    return (
      <View className={styles.page}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const matchLevel = recommendItem.matchLevel;

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.rankBadge}>
          <Text className={styles.rankText}>{recommendItem.rank || 1}</Text>
        </View>
        <View className={styles.scoreBox}>
          <Text className={styles.scoreValue}>{recommendItem.score}</Text>
          <Text className={styles.scoreLabel}>分</Text>
        </View>
        <View className={styles.matchLevel} style={{ backgroundColor: matchLevelColor[matchLevel] }}>
          <Text style={{ color: '#fff' }}>{matchLevelLabel[matchLevel]}</Text>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.craneCard} onClick={handleViewCrane}>
          <Image
            className={styles.craneImage}
            src={crane.imageUrl}
            mode="aspectFill"
          />
          <View className={styles.craneInfo}>
            <View>
              <Text className={styles.craneName}>{crane.name}</Text>
              <Text className={styles.craneDesc}>
                {crane.tonnage}吨 · {craneTypeLabel[crane.type]} · {crane.location}
              </Text>
            </View>
            <View className={styles.cranePrice}>
              <Text className={styles.priceSymbol}>¥</Text>
              <Text className={styles.priceValue}>{crane.dailyRate}</Text>
              <Text className={styles.priceUnit}>/台班</Text>
            </View>
          </View>
        </View>

        <View className={styles.scoreCard}>
          <Text className={styles.cardTitle}>多维度打分明细</Text>
          {recommendItem.scoreDetails.map((detail) => (
            <View key={detail.dimension} className={styles.scoreItem}>
              <View className={styles.scoreHeader}>
                <Text className={styles.scoreName}>
                  {detail.label}
                  <Text className={styles.weightTag}>
                    (权重 {(detail.weight * 100).toFixed(0)}%)
                  </Text>
                </Text>
                <Text className={styles.scoreNumber}>
                  {detail.score}分
                </Text>
              </View>
              <Text className={styles.scoreDesc}>{detail.description}</Text>
              <View className={styles.scoreBar}>
                <View
                  className={styles.scoreFill}
                  style={{ width: `${detail.score}%` }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnSecondary} onClick={handleViewCrane}>
          <Text>查看吊车</Text>
        </View>
        <View className={styles.btnPrimary} onClick={handleMatch}>
          <Text>立即撮合</Text>
        </View>
      </View>

      {showConfirm && (
        <View className={styles.confirmOverlay}>
          <View className={styles.confirmCard}>
            <Text className={styles.confirmTitle}>撮合确认</Text>
            <View className={styles.confirmSummary}>
              <Text className={styles.confirmCrane}>{crane.name}</Text>
              <Text className={styles.confirmSite}>{requestParams.siteName}</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>预计台班数(天)</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="请输入台班数"
                value={formDays}
                onInput={(e) => setFormDays(e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>联系人</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入联系人姓名"
                value={formContact}
                onInput={(e) => setFormContact(e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>联系电话</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="请输入联系电话"
                value={formPhone}
                onInput={(e) => setFormPhone(e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注</Text>
              <Input
                className={styles.formInput}
                placeholder="选填"
                value={formRemark}
                onInput={(e) => setFormRemark(e.detail.value)}
              />
            </View>

            <View className={styles.confirmAmount}>
              <Text className={styles.amountLabel}>预计总金额</Text>
              <Text className={styles.amountValue}>¥{totalAmount.toLocaleString()}</Text>
            </View>

            <View className={styles.confirmActions}>
              <View className={styles.confirmCancel} onClick={() => setShowConfirm(false)}>
                <Text>取消</Text>
              </View>
              <View className={styles.confirmOk} onClick={handleConfirmMatch}>
                <Text>确认撮合</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RecommendDetailPage;
