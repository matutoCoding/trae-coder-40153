import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';
import CraneCard from '@/components/CraneCard';
import type { Crane } from '@/types/crane';
import { getCranes, addCrane } from '@/store/index';

const CranesPage: React.FC = () => {
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formTonnage, setFormTonnage] = useState('');
  const [formType, setFormType] = useState<string>('truck');
  const [formLocation, setFormLocation] = useState('');
  const [formDailyRate, setFormDailyRate] = useState('');
  const [formOperator, setFormOperator] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPlateNumber, setFormPlateNumber] = useState('');

  const loadCranes = useCallback(() => {
    console.log('[Cranes] 加载吊车数据');
    setCranes(getCranes());
  }, []);

  useDidShow(() => {
    loadCranes();
  });

  const craneTypeOptions = [
    { key: 'truck', label: '汽车吊' },
    { key: 'crawler', label: '履带吊' },
    { key: 'tower', label: '塔吊' },
    { key: 'roughTerrain', label: '越野吊' }
  ];

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
    setShowForm(true);
    setFormName('');
    setFormTonnage('');
    setFormType('truck');
    setFormLocation('');
    setFormDailyRate('');
    setFormOperator('');
    setFormPhone('');
    setFormPlateNumber('');
  };

  const handleSaveCrane = () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入吊车名称', icon: 'none' });
      return;
    }
    const tonnage = parseFloat(formTonnage);
    if (!tonnage || tonnage <= 0) {
      Taro.showToast({ title: '请输入有效的吨位', icon: 'none' });
      return;
    }
    const dailyRate = parseFloat(formDailyRate);
    if (!dailyRate || dailyRate <= 0) {
      Taro.showToast({ title: '请输入有效的台班费', icon: 'none' });
      return;
    }
    if (!formLocation.trim()) {
      Taro.showToast({ title: '请输入所在位置', icon: 'none' });
      return;
    }
    if (!formOperator.trim()) {
      Taro.showToast({ title: '请输入司机姓名', icon: 'none' });
      return;
    }
    if (!formPhone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }

    addCrane({
      name: formName.trim(),
      tonnage,
      type: formType,
      location: formLocation.trim(),
      dailyRate,
      operator: formOperator.trim(),
      phone: formPhone.trim(),
      plateNumber: formPlateNumber.trim()
    });

    setShowForm(false);
    loadCranes();
    Taro.showToast({ title: '建档成功', icon: 'success' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  return (
    <View className={styles.page}>
      {!showForm ? (
        <ScrollView className={styles.scrollView} scrollY>
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
      ) : (
        <ScrollView className={styles.scrollView} scrollY>
          <View className={styles.formCard}>
            <View className={styles.formHeader}>
              <Text className={styles.formTitle}>新增吊车建档</Text>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>吊车名称 *</Text>
              <Input className={styles.formInput} placeholder="如：徐工QY50K" value={formName} onInput={(e) => setFormName(e.detail.value)} />
            </View>
            <View className={styles.formRow}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>吨位(吨) *</Text>
                <Input className={styles.formInput} type="digit" placeholder="如：50" value={formTonnage} onInput={(e) => setFormTonnage(e.detail.value)} />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>台班费(元) *</Text>
                <Input className={styles.formInput} type="digit" placeholder="如：3500" value={formDailyRate} onInput={(e) => setFormDailyRate(e.detail.value)} />
              </View>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>机型 *</Text>
              <View className={styles.typeSelector}>
                {craneTypeOptions.map(opt => (
                  <View key={opt.key} className={classnames(styles.typeOption, formType === opt.key && styles.activeType)} onClick={() => setFormType(opt.key)}>
                    <Text>{opt.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>所在位置 *</Text>
              <Input className={styles.formInput} placeholder="如：武汉市洪山区" value={formLocation} onInput={(e) => setFormLocation(e.detail.value)} />
            </View>
            <View className={styles.formRow}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>司机姓名 *</Text>
                <Input className={styles.formInput} placeholder="如：张师傅" value={formOperator} onInput={(e) => setFormOperator(e.detail.value)} />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>联系电话 *</Text>
                <Input className={styles.formInput} type="number" placeholder="如：138xxxx1234" value={formPhone} onInput={(e) => setFormPhone(e.detail.value)} />
              </View>
            </View>
            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>车牌号</Text>
              <Input className={styles.formInput} placeholder="如：鄂A·12345（选填）" value={formPlateNumber} onInput={(e) => setFormPlateNumber(e.detail.value)} />
            </View>
            <View className={styles.formActions}>
              <View className={styles.cancelBtn} onClick={handleCancelForm}>
                <Text>取消</Text>
              </View>
              <View className={styles.saveBtn} onClick={handleSaveCrane}>
                <Text>保存建档</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default CranesPage;
