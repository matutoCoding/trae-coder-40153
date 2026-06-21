import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { initStore } from '@/store/index';
import { craneList } from '@/data/cranes';
import { scheduleList } from '@/data/schedules';
import { orderList } from '@/data/orders';
import './app.scss';

function App(props) {
  useEffect(() => {
    initStore(craneList, scheduleList, orderList);
  }, []);

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;
