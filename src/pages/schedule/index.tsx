import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import StatusTag from '@/components/StatusTag';
import type { ScheduleItem, ScheduleConflict } from '@/types/schedule';
import { scheduleStatusLabel } from '@/types/schedule';
import { getSchedules, getCraneById, getCranes, mergeSchedulesForCrane, splitSchedule, getScheduleConflicts, getOrderById } from '@/store/index';
import { formatDate, formatTime, isToday } from '@/utils/date';
import dayjs from 'dayjs';

const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [showMergePicker, setShowMergePicker] = useState(false);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [filterCraneIdx, setFilterCraneIdx] = useState(0);
  const [filterSiteIdx, setFilterSiteIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'crane' | 'site'>('all');
  const [mergeCraneIdx, setMergeCraneIdx] = useState(0);
  const [splitScheduleIdx, setSplitScheduleIdx] = useState(0);
  const [splitTimeIdx, setSplitTimeIdx] = useState(0);

  const loadSchedules = useCallback(() => {
    console.log('[Schedule] 加载排期数据');
    setSchedules(getSchedules());
    setConflicts(getScheduleConflicts());
  }, []);

  useDidShow(() => {
    loadSchedules();
  });

  const allCranes = useMemo(() => {
    return [{ id: '', name: '全部吊车' }, ...getCranes()];
  }, [schedules]);

  const allSites = useMemo(() => {
    const siteSet = new Set<string>();
    schedules.forEach(s => siteSet.add(s.siteName));
    return ['全部工地', ...Array.from(siteSet)];
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    let result = schedules;
    if (activeFilter === 'crane' && filterCraneIdx > 0) {
      const crane = allCranes[filterCraneIdx];
      if (crane && crane.id) {
        result = result.filter(s => s.craneId === crane.id);
      }
    } else if (activeFilter === 'site' && filterSiteIdx > 0) {
      const siteName = allSites[filterSiteIdx];
      if (siteName && siteName !== '全部工地') {
        result = result.filter(s => s.siteName === siteName);
      }
    }
    return result;
  }, [schedules, activeFilter, filterCraneIdx, filterSiteIdx, allCranes, allSites]);

  const availableCranesForMerge = useMemo(() => {
    if (activeFilter === 'crane' && filterCraneIdx > 0) {
      const crane = allCranes[filterCraneIdx];
      if (crane && crane.id) {
        return [`${crane.name}(${crane.id})`];
      }
    }
    const cranes = getCranes();
    return cranes.map(c => `${c.name}(${c.id})`);
  }, [schedules, activeFilter, filterCraneIdx, allCranes]);

  const splitableSchedules = useMemo(() => {
    return filteredSchedules.filter(s => {
      const start = dayjs(s.startTime);
      const end = dayjs(s.endTime);
      return end.diff(start, 'hour') >= 4;
    }).map(s => {
      const crane = getCraneById(s.craneId);
      return `${s.siteName} - ${crane?.name || '未知'} (${s.id.slice(0, 12)}...)`;
    });
  }, [filteredSchedules]);

  const splitTimeOptions = useMemo(() => {
    if (splitScheduleIdx >= splitableSchedules.length) return ['12:00'];
    const splitable = filteredSchedules.filter(s => {
      const start = dayjs(s.startTime);
      const end = dayjs(s.endTime);
      return end.diff(start, 'hour') >= 4;
    });
    const target = splitable[splitScheduleIdx];
    if (!target) return ['12:00'];
    const start = dayjs(target.startTime);
    const end = dayjs(target.endTime);
    const midPoint = start.add(end.diff(start, 'minute') / 2, 'minute');
    const midHour = midPoint.hour();
    const times: string[] = [];
    for (let h = start.hour() + 1; h < end.hour(); h++) {
      times.push(`${String(h).padStart(2, '0')}:00`);
    }
    if (times.length === 0) times.push(`${String(midHour).padStart(2, '0')}:00`);
    return times;
  }, [filteredSchedules, splitScheduleIdx]);

  const selectedDateSchedules = useMemo(() => {
    return filteredSchedules.filter(s => {
      const startDate = s.startTime.slice(0, 10);
      const endDate = s.endTime.slice(0, 10);
      return selectedDate >= startDate && selectedDate <= endDate;
    });
  }, [filteredSchedules, selectedDate]);

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todaySchedules = filteredSchedules.filter(s => {
      const start = s.startTime.slice(0, 10);
      const end = s.endTime.slice(0, 10);
      return today >= start && today <= end;
    });
    const cranes = getCranes();
    const occupiedCount = cranes.filter(c => c.status === 'occupied').length;
    const availableCount = cranes.filter(c => c.status === 'available').length;
    return { todayTasks: todaySchedules.length, totalSchedules: filteredSchedules.length, occupiedCranes: occupiedCount, availableCranes: availableCount };
  }, [filteredSchedules]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (year: number, month: number) => {};

  const handleFilterClick = () => {
    setShowFilter(true);
  };

  const handleFilterConfirm = () => {
    setShowFilter(false);
    Taro.showToast({ title: '筛选已应用', icon: 'none' });
  };

  const handleResetFilter = () => {
    setActiveFilter('all');
    setFilterCraneIdx(0);
    setFilterSiteIdx(0);
    setShowFilter(false);
  };

  const handleMergeClick = () => {
    if (availableCranesForMerge.length === 0) {
      Taro.showToast({ title: '暂无可合并的吊车', icon: 'none' });
      return;
    }
    setMergeCraneIdx(0);
    setShowMergePicker(true);
  };

  const handleMergeConfirm = () => {
    let targetCraneId = '';
    let siteFilterName: string | undefined = undefined;

    if (activeFilter === 'crane' && filterCraneIdx > 0) {
      targetCraneId = allCranes[filterCraneIdx].id;
    } else {
      const cranes = getCranes();
      if (mergeCraneIdx >= cranes.length) {
        Taro.showToast({ title: '请选择吊车', icon: 'none' });
        return;
      }
      targetCraneId = cranes[mergeCraneIdx].id;
    }

    if (activeFilter === 'site' && filterSiteIdx > 0) {
      const siteName = allSites[filterSiteIdx];
      if (siteName && siteName !== '全部工地') {
        siteFilterName = siteName;
      }
    }

    mergeSchedulesForCrane(targetCraneId, siteFilterName);
    loadSchedules();
    setShowMergePicker(false);
    if (siteFilterName) {
      Taro.showToast({ title: `已合并「${siteFilterName}」的排期`, icon: 'success' });
    } else {
      Taro.showToast({ title: '合并完成', icon: 'success' });
    }
  };

  const handleSplitClick = () => {
    if (splitableSchedules.length === 0) {
      Taro.showToast({ title: '暂无可拆分的排期', icon: 'none' });
      return;
    }
    setSplitScheduleIdx(0);
    setSplitTimeIdx(0);
    setShowSplitPicker(true);
  };

  const handleSplitConfirm = () => {
    const splitable = filteredSchedules.filter(s => {
      const start = dayjs(s.startTime);
      const end = dayjs(s.endTime);
      return end.diff(start, 'hour') >= 4;
    });
    if (splitScheduleIdx >= splitable.length) {
      Taro.showToast({ title: '请选择排期', icon: 'none' });
      return;
    }
    const target = splitable[splitScheduleIdx];
    const splitDate = target.startTime.slice(0, 10);
    const timeStr = splitTimeOptions[splitTimeIdx] || '12:00';
    const splitDateTime = `${splitDate} ${timeStr}`;

    const result = splitSchedule(target.id, splitDateTime);
    if (result) {
      loadSchedules();
      setShowSplitPicker(false);
      Taro.showToast({ title: '拆分完成', icon: 'success' });
    } else {
      Taro.showToast({ title: '拆分时间无效，请在排期中间选择', icon: 'none' });
    }
  };

  const gotoCrane = (craneId: string) => {
    Taro.navigateTo({ url: `/pages/crane-detail/index?id=${craneId}` });
  };

  const gotoOrder = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const handleConflictClick = () => {
    if (conflicts.length === 0) {
      Taro.showToast({ title: '暂无排期冲突', icon: 'none' });
      return;
    }
    setShowConflicts(true);
  };

  const conflictTypeLabel: Record<string, string> = {
    overlap: '时间重叠',
    tightInterval: '间隔过短',
    overDuration: '超时长'
  };

  const conflictLevelColor: Record<string, string> = {
    high: '#F53F3F',
    medium: '#FF7D00',
    low: '#FFAA00'
  };

  const statusTypeMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
    confirmed: 'primary', pending: 'warning', completed: 'success', cancelled: 'info'
  };

  const filterLabel = useMemo(() => {
    if (activeFilter === 'all') return '全部';
    if (activeFilter === 'crane' && filterCraneIdx > 0) {
      return allCranes[filterCraneIdx]?.name || '全部';
    }
    if (activeFilter === 'site' && filterSiteIdx > 0) {
      return allSites[filterSiteIdx] || '全部';
    }
    return '全部';
  }, [activeFilter, filterCraneIdx, filterSiteIdx, allCranes, allSites]);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerBg}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.todayTasks}</Text>
            <Text className={styles.statLabel}>今日任务</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.availableCranes}</Text>
            <Text className={styles.statLabel}>空闲吊车</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.occupiedCranes}</Text>
            <Text className={styles.statLabel}>作业中</Text>
          </View>
        </View>
        <View className={styles.filterRow}>
          <View className={styles.filterBtn} onClick={handleFilterClick}>
            <Text>筛选: {filterLabel}</Text>
          </View>
          <View className={styles.conflictBtn} onClick={handleConflictClick}>
            <Text>冲突提醒{conflicts.length > 0 ? ` (${conflicts.length})` : ''}</Text>
          </View>
        </View>
        <View className={styles.quickActions}>
          <View className={styles.quickBtn} onClick={handleMergeClick}>
            <Text>合并排期</Text>
          </View>
          <View className={styles.quickBtn} onClick={handleSplitClick}>
            <Text>拆分排期</Text>
          </View>
        </View>
      </View>

      {showFilter && (
        <View className={styles.pickerOverlay}>
          <View className={styles.pickerCard}>
            <Text className={styles.pickerTitle}>排期筛选</Text>
            <Text className={styles.pickerDesc}>按吊车或工地筛选排期，合并拆分仅作用于筛选范围</Text>

            <Text className={styles.pickerLabel}>筛选方式</Text>
            <View className={styles.filterTypeRow}>
              <View
                className={activeFilter === 'all' ? styles.filterTypeActive : styles.filterTypeItem}
                onClick={() => setActiveFilter('all')}
              ><Text>全部</Text></View>
              <View
                className={activeFilter === 'crane' ? styles.filterTypeActive : styles.filterTypeItem}
                onClick={() => setActiveFilter('crane')}
              ><Text>按吊车</Text></View>
              <View
                className={activeFilter === 'site' ? styles.filterTypeActive : styles.filterTypeItem}
                onClick={() => setActiveFilter('site')}
              ><Text>按工地</Text></View>
            </View>

            {activeFilter === 'crane' && (
              <>
                <Text className={styles.pickerLabel}>选择吊车</Text>
                <Picker mode="selector" range={allCranes.map(c => c.name)} value={filterCraneIdx} onChange={(e) => setFilterCraneIdx(Number(e.detail.value))}>
                  <View className={styles.pickerValue}><Text>{allCranes[filterCraneIdx]?.name || '请选择'}</Text></View>
                </Picker>
              </>
            )}

            {activeFilter === 'site' && (
              <>
                <Text className={styles.pickerLabel}>选择工地</Text>
                <Picker mode="selector" range={allSites} value={filterSiteIdx} onChange={(e) => setFilterSiteIdx(Number(e.detail.value))}>
                  <View className={styles.pickerValue}><Text>{allSites[filterSiteIdx] || '请选择'}</Text></View>
                </Picker>
              </>
            )}

            <View className={styles.pickerActions}>
              <View className={styles.pickerCancel} onClick={handleResetFilter}><Text>重置</Text></View>
              <View className={styles.pickerConfirm} onClick={handleFilterConfirm}><Text>确定</Text></View>
            </View>
          </View>
        </View>
      )}

      {showMergePicker && (
        <View className={styles.pickerOverlay}>
          <View className={styles.pickerCard}>
            <Text className={styles.pickerTitle}>选择吊车合并排期</Text>
            <Text className={styles.pickerDesc}>将同一吊车、同一工地的连续时段合并为一段</Text>
            <Picker mode="selector" range={availableCranesForMerge} value={mergeCraneIdx} onChange={(e) => setMergeCraneIdx(Number(e.detail.value))}>
              <View className={styles.pickerValue}>
                <Text>{availableCranesForMerge[mergeCraneIdx] || '请选择'}</Text>
              </View>
            </Picker>
            <View className={styles.pickerActions}>
              <View className={styles.pickerCancel} onClick={() => setShowMergePicker(false)}><Text>取消</Text></View>
              <View className={styles.pickerConfirm} onClick={handleMergeConfirm}><Text>确认合并</Text></View>
            </View>
          </View>
        </View>
      )}

      {showSplitPicker && (
        <View className={styles.pickerOverlay}>
          <View className={styles.pickerCard}>
            <Text className={styles.pickerTitle}>选择排期拆分</Text>
            <Text className={styles.pickerDesc}>选择排期和收工时间，将排期拆成前后两段</Text>
            <Text className={styles.pickerLabel}>选择排期</Text>
            <Picker mode="selector" range={splitableSchedules} value={splitScheduleIdx} onChange={(e) => { setSplitScheduleIdx(Number(e.detail.value)); setSplitTimeIdx(0); }}>
              <View className={styles.pickerValue}><Text>{splitableSchedules[splitScheduleIdx] || '请选择'}</Text></View>
            </Picker>
            <Text className={styles.pickerLabel}>收工时间</Text>
            <Picker mode="selector" range={splitTimeOptions} value={splitTimeIdx} onChange={(e) => setSplitTimeIdx(Number(e.detail.value))}>
              <View className={styles.pickerValue}><Text>{splitTimeOptions[splitTimeIdx] || '请选择'}</Text></View>
            </Picker>
            <View className={styles.pickerActions}>
              <View className={styles.pickerCancel} onClick={() => setShowSplitPicker(false)}><Text>取消</Text></View>
              <View className={styles.pickerConfirm} onClick={handleSplitConfirm}><Text>确认拆分</Text></View>
            </View>
          </View>
        </View>
      )}

      {showConflicts && (
        <View className={styles.pickerOverlay}>
          <View className={styles.pickerCard}>
            <Text className={styles.pickerTitle}>排期冲突提醒</Text>
            <Text className={styles.pickerDesc}>共发现 {conflicts.length} 条风险，请及时处理</Text>

            <ScrollView className={styles.conflictScroll} scrollY>
              {conflicts.map((c, idx) => (
                <View key={idx} className={styles.conflictItem}>
                  <View className={styles.conflictHeader}>
                    <View
                      className={styles.conflictTypeTag}
                      style={{ backgroundColor: conflictLevelColor[c.level] }}
                    >
                      <Text>{conflictTypeLabel[c.type]}</Text>
                    </View>
                    <Text className={styles.conflictTitle}>{c.title}</Text>
                  </View>
                  <Text className={styles.conflictDesc}>{c.description}</Text>
                  <View className={styles.conflictMeta}>
                    <Text className={styles.conflictMetaItem}>吊车: {c.craneName}</Text>
                    {c.siteNames && c.siteNames.length > 0 && (
                      <Text className={styles.conflictMetaItem}>工地: {c.siteNames.join(' / ')}</Text>
                    )}
                  </View>
                  {c.orderIds && c.orderIds.length > 0 && (
                    <View className={styles.conflictActions}>
                      {c.orderIds.map(oid => {
                        const o = getOrderById(oid);
                        return (
                          <View
                            key={oid}
                            className={styles.conflictActionBtn}
                            onClick={() => gotoOrder(oid)}
                          >
                            <Text>查看订单{o ? ` ${o.orderNo}` : ''}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <View className={styles.pickerActions}>
              <View className={styles.pickerConfirm} onClick={() => setShowConflicts(false)}>
                <Text>我知道了</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className={styles.content}>
        <View className={styles.section}>
          <ScheduleCalendar schedules={filteredSchedules} selectedDate={selectedDate} onDateSelect={handleDateSelect} onMonthChange={handleMonthChange} />
          <View className={styles.legendRow}>
            <View className={styles.legendItem}><View className={styles.legendDot} style={{ backgroundColor: '#1E5EFA' }} /><Text className={styles.legendText}>已确认</Text></View>
            <View className={styles.legendItem}><View className={styles.legendDot} style={{ backgroundColor: '#FF7D00' }} /><Text className={styles.legendText}>待确认</Text></View>
            <View className={styles.legendItem}><View className={styles.legendDot} style={{ backgroundColor: '#00B42A' }} /><Text className={styles.legendText}>已完成</Text></View>
            <View className={styles.legendItem}><View className={styles.legendDot} style={{ backgroundColor: '#722ED1' }} /><Text className={styles.legendText}>已合并</Text></View>
          </View>
        </View>
        <View className={styles.selectedDateInfo}>
          <Text className={styles.selectedDateText}>
            {formatDate(selectedDate, 'YYYY年MM月DD日')} {isToday(selectedDate) ? '(今天)' : ''} 共 {selectedDateSchedules.length} 条排期
          </Text>
        </View>
        <View className={styles.section}>
          <View className={styles.sectionHeader}><Text className={styles.sectionTitle}>当日排期详情</Text></View>
          {selectedDateSchedules.length === 0 ? (
            <View className={styles.emptyState}><Text className={styles.emptyText}>当日暂无排期</Text></View>
          ) : (
            <View className={styles.scheduleList}>
              {selectedDateSchedules.map(schedule => {
                const crane = getCraneById(schedule.craneId);
                return (
                  <View key={schedule.id} className={styles.scheduleItem}>
                    <View className={styles.scheduleHeader}>
                      <Text className={styles.siteName}>{schedule.siteName}</Text>
                      <StatusTag text={scheduleStatusLabel[schedule.status]} type={statusTypeMap[schedule.status]} size="small" />
                    </View>
                    <View className={styles.scheduleBody}>
                      <View className={styles.scheduleRow}>
                        <Text className={styles.scheduleLabel}>时间</Text>
                        <Text className={styles.scheduleValue}>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</Text>
                      </View>
                      <View className={styles.scheduleRow}>
                        <Text className={styles.scheduleLabel}>地点</Text>
                        <Text className={styles.scheduleValue}>{schedule.siteAddress}</Text>
                      </View>
                      {schedule.isMerged && (
                        <View className={styles.scheduleRow}>
                          <Text className={styles.scheduleLabel}>合并</Text>
                          <Text className={styles.scheduleValue} style={{ color: '#722ED1' }}>已合并 {schedule.mergedFrom?.length || 0} 个时段</Text>
                        </View>
                      )}
                    </View>
                    <View className={styles.scheduleFooter}>
                      <View className={styles.craneInfo} onClick={() => gotoCrane(schedule.craneId)}>
                        <Text className={styles.craneName}>{crane?.name || '未知吊车'}</Text>
                      </View>
                      <View className={styles.actionBtn} onClick={() => gotoCrane(schedule.craneId)}><Text>查看详情</Text></View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default SchedulePage;
