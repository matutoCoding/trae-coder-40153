import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import CraneCard from '@/components/CraneCard';
import type { Crane, CraneStatus, CraneType } from '@/types/crane';
import { craneList } from '@/data/cranes';

const CranesPage: React.FC = () => {
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    loadCranes();
  }, []);

  const loadCranes = () => {
    console.log('[Cranes] 加载吊车数据');
    setCranes(craneList);
  };

  const filterOptions = [
    { key: 'all', label: '全部' },
    { key: 'available', label: '空闲' },
    { key: 'occupied', label: '占用' },
    { key: 'maintenance', label: '维保' }
  ];

  const filteredCranes = useMemo(() => {
    let result = [...cranes];

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(keyword) ||
        c.plateNumber.toLowerCase().includes(keyword) ||
        c.location.toLowerCase().includes(keyword)
      );
    }

    if (activeFilter !== 'all') {
      result = result.filter(c => c.status === activeFilter);
    }

    return result;
  }, [cranes, searchKeyword, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: cranes.length,
      available: cranes.filter(c => c.status === 'available').length,
      occupied: cranes.filter(c => c.status === 'occupied').length,
      maintenance: cranes.filter(c => c.status === 'maintenance').length
    };
  }, [cranes]);

  const handleAddCrane = () => {
    Taro.showToast({ title: '新增功能开发中', icon: 'none' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <View className={styles.searchBox}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder="搜索吊车名称/牌号/位置"
            value={searchKeyword}
            onInput={(e) => setSearchKeyword(e.detail.value)}
          />
        </View>

        <View className={styles.filterTabs}>
          {filterOptions.map(option => (
            <View
              key={option.key}
              className={classnames(styles.filterTab, activeFilter === option.key && styles.active)}
              onClick={() => setActiveFilter(option.key)}
            >
              <Text>{option.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.statsCard}>
          <View className={styles.statsGrid}>
            <View className={styles.statItem}>
              <Text className={styles.statNum}>{stats.total}</Text>
              <Text className={styles.statLabel}>总台数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNum, styles.available)}>{stats.available}</Text>
              <Text className={styles.statLabel}>空闲</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNum, styles.occupied)}>{stats.occupied}</Text>
              <Text className={styles.statLabel}>占用</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={classnames(styles.statNum, styles.maintenance)}>{stats.maintenance}</Text>
              <Text className={styles.statLabel}>维保</Text>
            </View>
          </View>
        </View>

        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>吊车列表</Text>
          <View className={styles.addBtn} onClick={handleAddCrane}>
            <Text>+ 新增吊车</Text>
          </View>
        </View>

        {filteredCranes.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无匹配的吊车</Text>
          </View>
        ) : (
          <View className={styles.craneList}>
            {filteredCranes.map(crane => (
              <CraneCard key={crane.id} crane={crane} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default CranesPage;
