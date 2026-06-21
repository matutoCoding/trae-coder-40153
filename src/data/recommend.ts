import type { WeightConfig, RecommendRequest } from '@/types/recommend';

export const defaultWeightConfig: WeightConfig = {
  tonnage: 25,
  model: 20,
  distance: 20,
  price: 15,
  availability: 10,
  rating: 10
};

export const weightPresets: { name: string; config: WeightConfig }[] = [
  {
    name: '综合平衡',
    config: {
      tonnage: 25,
      model: 20,
      distance: 20,
      price: 15,
      availability: 10,
      rating: 10
    }
  },
  {
    name: '性能优先',
    config: {
      tonnage: 35,
      model: 25,
      distance: 15,
      price: 10,
      availability: 10,
      rating: 5
    }
  },
  {
    name: '成本优先',
    config: {
      tonnage: 15,
      model: 10,
      distance: 15,
      price: 35,
      availability: 15,
      rating: 10
    }
  },
  {
    name: '时效优先',
    config: {
      tonnage: 20,
      model: 15,
      distance: 30,
      price: 10,
      availability: 20,
      rating: 5
    }
  }
];

export const defaultRecommendRequest: RecommendRequest = {
  siteName: '光谷中心城项目',
  siteAddress: '武汉市洪山区光谷大道',
  requiredTonnage: 50,
  preferredType: 'truck',
  startTime: '',
  endTime: '',
  distance: 0
};
