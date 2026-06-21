import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatusTagProps {
  text: string;
  color?: string;
  bgColor?: string;
  size?: 'small' | 'medium' | 'large';
  type?: 'success' | 'warning' | 'error' | 'info' | 'primary';
}

const colorMap = {
  success: { color: '#00B42A', bg: 'rgba(0, 180, 42, 0.1)' },
  warning: { color: '#FF7D00', bg: 'rgba(255, 125, 0, 0.1)' },
  error: { color: '#F53F3F', bg: 'rgba(245, 63, 63, 0.1)' },
  info: { color: '#1E5EFA', bg: 'rgba(30, 94, 250, 0.1)' },
  primary: { color: '#1E5EFA', bg: 'rgba(30, 94, 250, 0.1)' }
};

const StatusTag: React.FC<StatusTagProps> = ({
  text,
  color,
  bgColor,
  size = 'medium',
  type = 'info'
}) => {
  const colors = type ? colorMap[type] : { color, bg: bgColor };

  return (
    <View
      className={classnames(styles.tag, styles[size])}
      style={{
        color: colors.color,
        backgroundColor: colors.bg
      }}
    >
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default StatusTag;
