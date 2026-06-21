import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Slider } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { WeightConfig } from '@/types/recommend';
import { defaultWeightConfig, weightPresets } from '@/data/recommend';

const WeightConfigPage: React.FC = () => {
  const [weightConfig, setWeightConfig] = useState<WeightConfig>(defaultWeightConfig);
  const [activePreset, setActivePreset] = useState<string>('综合平衡');

  useEffect(() => {
    const saved = Taro.getStorageSync('weightConfig');
    if (saved) {
      try {
        setWeightConfig(JSON.parse(saved));
      } catch (e) {
        console.error('[WeightConfig] 解析存储的配置失败:', e);
      }
    }
  }, []);

  const totalWeight = Object.values(weightConfig).reduce((sum, w) => sum + w, 0);

  const handleWeightChange = (key: keyof WeightConfig, value: number) => {
    setWeightConfig(prev => ({
      ...prev,
      [key]: value
    }));
    setActivePreset('');
  };

  const applyPreset = (preset: typeof weightPresets[0]) => {
    setWeightConfig(preset.config);
    setActivePreset(preset.name);
    Taro.showToast({ title: `已应用「${preset.name}」`, icon: 'none' });
  };

  const handleSave = () => {
    try {
      Taro.setStorageSync('weightConfig', JSON.stringify(weightConfig));
      Taro.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (e) {
      console.error('[WeightConfig] 保存配置失败:', e);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const handleReset = () => {
    Taro.showModal({
      title: '重置配置',
      content: '确定要重置为默认权重配置吗？',
      success: (res) => {
        if (res.confirm) {
          setWeightConfig(defaultWeightConfig);
          setActivePreset('综合平衡');
          Taro.showToast({ title: '已重置', icon: 'none' });
        }
      }
    });
  };

  const weightItems = [
    { key: 'tonnage' as const, label: '吨位匹配', desc: '吊车载重能力与需求的匹配程度' },
    { key: 'model' as const, label: '机型匹配', desc: '吊车类型与作业场景的适配性' },
    { key: 'distance' as const, label: '距离因素', desc: '吊车位置与工地的距离影响' },
    { key: 'price' as const, label: '价格优势', desc: '台班费用的性价比考量' },
    { key: 'availability' as const, label: '可用状态', desc: '吊车当前是否可立即调度' },
    { key: 'rating' as const, label: '历史评分', desc: '过往服务质量评价记录' }
  ];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>权重配置</Text>
        <Text className={styles.headerDesc}>调整各维度权重，定制专属推荐算法</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.presetCard}>
          <Text className={styles.cardTitle}>快速预设</Text>
          <View className={styles.presetGrid}>
            {weightPresets.map(preset => (
              <View
                key={preset.name}
                className={classnames(styles.presetItem, activePreset === preset.name && styles.active)}
                onClick={() => applyPreset(preset)}
              >
                <Text className={styles.presetName}>{preset.name}</Text>
                <Text className={styles.presetDesc}>一键应用</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.weightCard}>
          <View className={styles.cardTitle}>
            <Text>权重明细</Text>
            <Text className={styles.totalWeight}>
              总计 <Text className={styles.value}>{totalWeight}%</Text>
            </Text>
          </View>

          {weightItems.map(item => (
            <View key={item.key} className={styles.weightItem}>
              <View className={styles.weightHeader}>
                <Text className={styles.weightLabel}>{item.label}</Text>
                <Text className={styles.weightValue}>{weightConfig[item.key]}%</Text>
              </View>
              <Text className={styles.weightDesc}>{item.desc}</Text>
              <View className={styles.weightSlider}>
                <Slider
                  min={0}
                  max={50}
                  step={5}
                  value={weightConfig[item.key]}
                  activeColor="#1E5EFA"
                  backgroundColor="#E5E6EB"
                  blockSize={24}
                  blockColor="#1E5EFA"
                  onChange={(e) => handleWeightChange(item.key, e.detail.value)}
                />
              </View>
            </View>
          ))}
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>💡 配置说明</Text>
          <Text className={styles.tipContent}>
            {`权重值越高，该维度在推荐算法中的影响力越大。\n`}
            {`建议总权重保持在 100% 左右，系统会自动按比例计算。\n`}
            {`可根据实际业务场景灵活调整，比如短途运输可降低距离权重。`}
          </Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnSecondary} onClick={handleReset}>
          <Text>重置默认</Text>
        </View>
        <View className={styles.btnPrimary} onClick={handleSave}>
          <Text>保存配置</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default WeightConfigPage;
