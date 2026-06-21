import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import dayjs from 'dayjs';
import type { ScheduleItem } from '@/types/schedule';
import { isToday } from '@/utils/date';
import { scheduleStatusColor } from '@/types/schedule';

interface ScheduleCalendarProps {
  schedules?: ScheduleItem[];
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  schedules = [],
  selectedDate,
  onDateSelect,
  onMonthChange
}) => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const year = currentDate.year();
  const month = currentDate.month() + 1;

  const calendarData = useMemo(() => {
    const firstDay = dayjs(`${year}-${month}-01`);
    const daysInMonth = firstDay.daysInMonth();
    const firstDayOfWeek = firstDay.day();

    const days: { date: string; day: number; isCurrentMonth: boolean; schedules: ScheduleItem[] }[] = [];

    const prevMonth = firstDay.subtract(1, 'month');
    const prevMonthDays = prevMonth.daysInMonth();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dateStr = prevMonth.date(day).format('YYYY-MM-DD');
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        schedules: getSchedulesForDate(dateStr)
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = dayjs(`${year}-${month}-${i}`).format('YYYY-MM-DD');
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: true,
        schedules: getSchedulesForDate(dateStr)
      });
    }

    const remaining = 42 - days.length;
    const nextMonth = firstDay.add(1, 'month');
    for (let i = 1; i <= remaining; i++) {
      const dateStr = nextMonth.date(i).format('YYYY-MM-DD');
      days.push({
        date: dateStr,
        day: i,
        isCurrentMonth: false,
        schedules: getSchedulesForDate(dateStr)
      });
    }

    return days;
  }, [year, month, schedules]);

  function getSchedulesForDate(date: string): ScheduleItem[] {
    return schedules.filter(s => {
      const startDate = s.startTime.slice(0, 10);
      const endDate = s.endTime.slice(0, 10);
      return date >= startDate && date <= endDate;
    });
  }

  const handlePrevMonth = () => {
    const newDate = currentDate.subtract(1, 'month');
    setCurrentDate(newDate);
    onMonthChange?.(newDate.year(), newDate.month() + 1);
  };

  const handleNextMonth = () => {
    const newDate = currentDate.add(1, 'month');
    setCurrentDate(newDate);
    onMonthChange?.(newDate.year(), newDate.month() + 1);
  };

  const handleDateClick = (date: string) => {
    onDateSelect?.(date);
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <View className={styles.calendar}>
      <View className={styles.header}>
        <View className={styles.navBtn} onClick={handlePrevMonth}>
          <Text className={styles.navText}>‹</Text>
        </View>
        <Text className={styles.title}>{year}年{month}月</Text>
        <View className={styles.navBtn} onClick={handleNextMonth}>
          <Text className={styles.navText}>›</Text>
        </View>
      </View>

      <View className={styles.weekDays}>
        {weekDays.map((day, index) => (
          <View key={index} className={styles.weekDay}>
            <Text className={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View className={styles.daysGrid}>
        {calendarData.map((item, index) => {
          const isSelected = selectedDate === item.date;
          const hasSchedule = item.schedules.length > 0;
          const todayFlag = isToday(item.date);

          return (
            <View
              key={index}
              className={[
                styles.dayCell,
                !item.isCurrentMonth && styles.otherMonth,
                isSelected && styles.selected,
                todayFlag && styles.today
              ].join(' ')}
              onClick={() => handleDateClick(item.date)}
            >
              <Text className={[
                styles.dayText,
                !item.isCurrentMonth && styles.otherMonthText,
                isSelected && styles.selectedText,
                todayFlag && styles.todayText
              ].join(' ')}>
                {item.day}
              </Text>
              {hasSchedule && item.isCurrentMonth && (
                <View className={styles.scheduleDots}>
                  {item.schedules.slice(0, 3).map((s, i) => (
                    <View
                      key={i}
                      className={styles.dot}
                      style={{ backgroundColor: scheduleStatusColor[s.status] }}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ScheduleCalendar;
