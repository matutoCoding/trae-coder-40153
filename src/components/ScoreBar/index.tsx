import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface ScoreBarProps {
  score: number;
  label: string;
  maxScore?: number;
  color?: string;
  showValue?: boolean;
  height?: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  label,
  maxScore = 100,
  color = '#1E5EFA',
  showValue = true,
  height = 12
}) => {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        {showValue && (
          <Text className={styles.score} style={{ color }}>
            {score}分
          </Text>
        )}
      </View>
      <View className={styles.barBg} style={{ height: `${height}rpx` }}>
        <View
          className={styles.barFill}
          style={{
            width: `${percentage}%`,
            height: `${height}rpx`,
            backgroundColor: color
          }}
        />
      </View>
    </View>
  );
};

export default ScoreBar;
