import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusTag from '../StatusTag';
import type { Crane } from '@/types/crane';
import { craneTypeLabel, craneStatusLabel } from '@/types/crane';

interface CraneCardProps {
  crane: Crane;
  showScore?: boolean;
  score?: number;
  rank?: number;
  onClick?: () => void;
}

const CraneCard: React.FC<CraneCardProps> = ({
  crane,
  showScore = false,
  score = 0,
  rank,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/crane-detail/index?id=${crane.id}`
      });
    }
  };

  const statusTypeMap: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
    available: 'success',
    occupied: 'error',
    maintenance: 'warning',
    offline: 'info'
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      {rank && rank <= 3 && (
        <View className={styles.rankBadge} style={{ backgroundColor: rank === 1 ? '#FF7D00' : rank === 2 ? '#1E5EFA' : '#00B42A' }}>
          <Text className={styles.rankText}>TOP{rank}</Text>
        </View>
      )}

      <Image
        className={styles.image}
        src={crane.imageUrl}
        mode="aspectFill"
      />

      <View className={styles.content}>
        <View className={styles.header}>
          <Text className={styles.name}>{crane.name}</Text>
          <StatusTag
            text={craneStatusLabel[crane.status]}
            type={statusTypeMap[crane.status] || 'info'}
            size="small"
          />
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>吨位</Text>
          <Text className={styles.infoValue}>{crane.tonnage}吨</Text>
          <Text className={styles.infoLabel}>机型</Text>
          <Text className={styles.infoValue}>{craneTypeLabel[crane.type]}</Text>
        </View>

        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>位置</Text>
          <Text className={styles.infoValue}>{crane.location}</Text>
        </View>

        <View className={styles.footer}>
          <View className={styles.priceBox}>
            <Text className={styles.priceSymbol}>¥</Text>
            <Text className={styles.priceValue}>{crane.dailyRate}</Text>
            <Text className={styles.priceUnit}>/台班</Text>
          </View>
          {showScore && (
            <View className={styles.scoreBox}>
              <Text className={styles.scoreLabel}>综合评分</Text>
              <Text className={styles.scoreValue}>{score}</Text>
            </View>
          )}
          {crane.distance !== undefined && (
            <Text className={styles.distance}>{crane.distance}km</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default CraneCard;
