import React, { useState } from 'react';
import { View, Text, Slider } from '@tarojs/components';
import styles from './index.module.scss';

interface WeightSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  color?: string;
  onChange?: (value: number) => void;
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 5,
  color = '#1E5EFA',
  onChange
}) => {
  const [internalValue, setInternalValue] = useState(value);

  const handleChange = (e: any) => {
    const val = e.detail.value;
    setInternalValue(val);
    onChange?.(val);
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        <Text className={styles.value} style={{ color }}>
          {internalValue}%
        </Text>
      </View>
      <View className={styles.sliderWrapper}>
        <Slider
          min={min}
          max={max}
          step={step}
          value={internalValue}
          activeColor={color}
          backgroundColor="#E5E6EB"
          blockSize={20}
          blockColor={color}
          onChange={handleChange}
        />
      </View>
    </View>
  );
};

export default WeightSlider;
