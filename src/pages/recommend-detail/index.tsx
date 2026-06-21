import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import type { Crane } from '@/types/crane';
import type { RecommendItem } from '@/types/recommend';
import { getCraneById } from '@/data/cranes';
import { defaultWeightConfig } from '@/data/recommend';
import { calculateRecommendScore } from '@/utils/recommend';
import { matchLevelLabel, matchLevelColor } from '@/types/recommend';
import { craneTypeLabel } from '@/types/crane';

const RecommendDetailPage: React.FC = () => {
  const router = useRouter();
  const [crane, setCrane] = useState<Crane | null>(null);
  const [recommendItem, setRecommendItem] = useState<RecommendItem | null>(null);

  useEffect(() => {
    const craneId = router.params.craneId as string;
    if (craneId) {
      loadData(craneId);
    }
  }, [router.params]);

  const loadData = (craneId: string) => {
    console.log('[RecommendDetail] 加载推荐详情:', craneId);
    const craneData = getCraneById(craneId);
    if (craneData) {
      setCrane(craneData);

      const request = {
        siteName: '光谷中心城项目',
        siteAddress: '武汉市洪山区光谷大道',
        requiredTonnage: 50,
        preferredType: 'truck',
        startTime: '',
        endTime: '',
        distance: 0
      };

      const avgRate = 5000;
      const result = calculateRecommendScore(craneData, request, defaultWeightConfig, avgRate);
      setRecommendItem(result);
    }
  };

  const handleMatch = () => {
    Taro.showModal({
      title: '确认撮合',
      content: '确认将该吊车与工地进行撮合？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '撮合成功', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
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
          {recommendItem.scoreDetails.map((detail, index) => (
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
    </ScrollView>
  );
};

export default RecommendDetailPage;
