import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import CraneCard from '@/components/CraneCard';
import type { RecommendItem, WeightConfig } from '@/types/recommend';
import { weightPresets } from '@/data/recommend';
import { getRecommendedCranes } from '@/utils/recommend';
import { getCranes, getWeightConfig } from '@/store/index';

const RecommendPage: React.FC = () => {
  const [siteName, setSiteName] = useState('光谷中心城项目');
  const [siteAddress, setSiteAddress] = useState('武汉市洪山区光谷大道');
  const [requiredTonnage, setRequiredTonnage] = useState('');
  const [preferredType, setPreferredType] = useState<string>('truck');
  const [weightConfig, setWeightConfig] = useState<WeightConfig>(getWeightConfig());
  const [recommendations, setRecommendations] = useState<RecommendItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const lastWeightRef = useRef<string>(JSON.stringify(getWeightConfig()));

  const doRecommend = useCallback(() => {
    const trimmed = requiredTonnage.trim();
    if (!trimmed) {
      Taro.showToast({ title: '请输入需求吨位', icon: 'none' });
      return;
    }
    const tonnage = Number(trimmed);
    if (!Number.isFinite(tonnage) || tonnage <= 0 || !Number.isInteger(tonnage)) {
      Taro.showToast({ title: '吨位必须为正整数，请重新输入', icon: 'none' });
      return;
    }

    console.log('[Recommend] 执行智能推荐，吨位:', tonnage);
    const craneList = getCranes();
    const currentWeight = getWeightConfig();
    setWeightConfig(currentWeight);
    lastWeightRef.current = JSON.stringify(currentWeight);

    const request = {
      siteName,
      siteAddress,
      requiredTonnage: tonnage,
      preferredType,
      startTime: '',
      endTime: '',
      distance: 0
    };

    const results = getRecommendedCranes(craneList, request, currentWeight, 5);
    setRecommendations(results);
    setHasSearched(true);
    console.log('[Recommend] 推荐结果数量:', results.length);
  }, [requiredTonnage, siteName, siteAddress, preferredType]);

  useDidShow(() => {
    const savedWeight = getWeightConfig();
    const savedStr = JSON.stringify(savedWeight);
    if (hasSearched && savedStr !== lastWeightRef.current) {
      console.log('[Recommend] 权重已变更，自动重算推荐');
      setWeightConfig(savedWeight);
      lastWeightRef.current = savedStr;

      const tonnage = Number(requiredTonnage.trim());
      if (tonnage > 0 && Number.isInteger(tonnage)) {
        const craneList = getCranes();
        const request = {
          siteName,
          siteAddress,
          requiredTonnage: tonnage,
          preferredType,
          startTime: '',
          endTime: '',
          distance: 0
        };
        const results = getRecommendedCranes(craneList, request, savedWeight, 5);
        setRecommendations(results);
      }
    } else {
      setWeightConfig(savedWeight);
      lastWeightRef.current = savedStr;
    }
  });

  const craneTypes = [
    { key: 'truck', label: '汽车吊' },
    { key: 'crawler', label: '履带吊' },
    { key: 'tower', label: '塔吊' },
    { key: 'roughTerrain', label: '越野吊' }
  ];

  const gotoWeightConfig = () => {
    Taro.navigateTo({
      url: '/pages/weight-config/index'
    });
  };

  const gotoRecommendDetail = (item: RecommendItem) => {
    const tonnage = Number(requiredTonnage.trim()) || 0;
    const params = [
      `craneId=${item.crane.id}`,
      `tonnage=${tonnage}`,
      `preferredType=${preferredType}`,
      `siteName=${encodeURIComponent(siteName)}`,
      `siteAddress=${encodeURIComponent(siteAddress)}`
    ].join('&');
    Taro.navigateTo({
      url: `/pages/recommend-detail/index?${params}`
    });
  };

  const applyPreset = (preset: typeof weightPresets[0]) => {
    setWeightConfig(preset.config);
    Taro.showToast({ title: `已应用「${preset.name}」`, icon: 'none' });
    if (hasSearched) {
      const tonnage = Number(requiredTonnage.trim());
      if (tonnage > 0 && Number.isInteger(tonnage)) {
        const craneList = getCranes();
        const request = {
          siteName,
          siteAddress,
          requiredTonnage: tonnage,
          preferredType,
          startTime: '',
          endTime: '',
          distance: 0
        };
        const results = getRecommendedCranes(craneList, request, preset.config, 5);
        setRecommendations(results);
      }
    }
  };

  const totalWeight = useMemo(() => {
    return Object.values(weightConfig).reduce((sum, w) => sum + w, 0);
  }, [weightConfig]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>智能推荐</Text>
        <Text className={styles.headerDesc}>多维度智能匹配，为您推荐最优吊车方案</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.configCard}>
          <View className={styles.configHeader}>
            <Text className={styles.configTitle}>需求配置</Text>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>工地名称</Text>
            <Input
              className={styles.formInput}
              placeholder="请输入工地名称"
              value={siteName}
              onInput={(e) => setSiteName(e.detail.value)}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>工地地址</Text>
            <Input
              className={styles.formInput}
              placeholder="请输入工地地址"
              value={siteAddress}
              onInput={(e) => setSiteAddress(e.detail.value)}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>需求吨位(吨)</Text>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="请输入正整数吨位，如 50"
              value={requiredTonnage}
              onInput={(e) => setRequiredTonnage(e.detail.value)}
            />
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>首选机型</Text>
            <View className={styles.typeSelector}>
              {craneTypes.map(type => (
                <View
                  key={type.key}
                  className={classnames(styles.typeOption, preferredType === type.key && styles.active)}
                  onClick={() => setPreferredType(type.key)}
                >
                  <Text>{type.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formGroup}>
            <View className={styles.configHeader}>
              <Text className={styles.configTitle}>权重配置</Text>
              <View className={styles.configBtn} onClick={gotoWeightConfig}>
                <Text>调整权重</Text>
              </View>
            </View>
            <View className={styles.weightSummary}>
              {Object.entries(weightConfig).map(([key, value]) => {
                const labels: Record<string, string> = {
                  tonnage: '吨位',
                  model: '机型',
                  distance: '距离',
                  price: '价格',
                  availability: '可用性',
                  rating: '评分'
                };
                return (
                  <Text key={key} className={styles.weightTag}>
                    {labels[key]}: {value}%
                  </Text>
                );
              })}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>快速预设</Text>
            <View className={styles.typeSelector}>
              {weightPresets.map(preset => (
                <View
                  key={preset.name}
                  className={styles.typeOption}
                  onClick={() => applyPreset(preset)}
                >
                  <Text>{preset.name}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.recommendBtn} onClick={doRecommend}>
          <Text>开始智能推荐</Text>
        </View>

        {hasSearched && (
          <View className={styles.recommendSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>推荐结果</Text>
              <Text className={styles.resultCount}>共 {recommendations.length} 个推荐</Text>
            </View>

            {recommendations.length === 0 ? (
              <View className={styles.emptyState}>
                <Text className={styles.emptyText}>暂无匹配的吊车</Text>
              </View>
            ) : (
              <View className={styles.recommendList}>
                {recommendations.map(item => (
                  <View key={item.crane.id} onClick={() => gotoRecommendDetail(item)}>
                    <CraneCard
                      crane={item.crane}
                      showScore
                      score={item.score}
                      rank={item.rank}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RecommendPage;
