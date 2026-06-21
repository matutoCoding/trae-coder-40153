import type { Crane } from './crane';

export interface RecommendRequest {
  siteName: string;
  siteAddress: string;
  requiredTonnage: number;
  preferredType?: string;
  startTime: string;
  endTime: string;
  distance?: number;
}

export interface RecommendItem {
  crane: Crane;
  score: number;
  scoreDetails: ScoreDetail[];
  rank: number;
  matchLevel: 'perfect' | 'good' | 'normal' | 'low';
}

export interface ScoreDetail {
  dimension: ScoreDimension;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  description: string;
}

export type ScoreDimension = 'tonnage' | 'model' | 'distance' | 'price' | 'availability' | 'rating';

export const scoreDimensionLabel: Record<ScoreDimension, string> = {
  tonnage: '吨位匹配',
  model: '机型匹配',
  distance: '距离因素',
  price: '价格优势',
  availability: '可用状态',
  rating: '历史评分'
};

export interface WeightConfig {
  tonnage: number;
  model: number;
  distance: number;
  price: number;
  availability: number;
  rating: number;
}

export const defaultWeightConfig: WeightConfig = {
  tonnage: 25,
  model: 20,
  distance: 20,
  price: 15,
  availability: 10,
  rating: 10
};

export const matchLevelLabel: Record<string, string> = {
  perfect: '极佳匹配',
  good: '良好匹配',
  normal: '一般匹配',
  low: '较低匹配'
};

export const matchLevelColor: Record<string, string> = {
  perfect: '#00B42A',
  good: '#1E5EFA',
  normal: '#FF7D00',
  low: '#86909C'
};
