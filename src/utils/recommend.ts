import type { Crane } from '@/types/crane';
import type {
  RecommendItem, RecommendRequest, ScoreDetail,
  WeightConfig, ScoreDimension
} from '@/types/recommend';

const normalizeScore = (value: number, max: number, invert: boolean = false): number => {
  let score = Math.min(100, Math.max(0, (value / max) * 100));
  if (invert) score = 100 - score;
  return score;
};

export const calculateTonnageScore = (crane: Crane, requiredTonnage: number): ScoreDetail => {
  const tonnage = crane.tonnage;
  let score = 0;
  let description = '';

  if (tonnage >= requiredTonnage && tonnage <= requiredTonnage * 1.2) {
    score = 100;
    description = '吨位完美匹配';
  } else if (tonnage > requiredTonnage * 1.2 && tonnage <= requiredTonnage * 1.5) {
    score = 80;
    description = '吨位略大，可用';
  } else if (tonnage > requiredTonnage * 1.5) {
    score = 60;
    description = '吨位偏大，成本较高';
  } else if (tonnage >= requiredTonnage * 0.8) {
    score = 40;
    description = '吨位略小，需评估';
  } else {
    score = 10;
    description = '吨位不足';
  }

  return {
    dimension: 'tonnage',
    label: '吨位匹配',
    score,
    weight: 0,
    weightedScore: 0,
    description
  };
};

export const calculateModelScore = (crane: Crane, preferredType?: string): ScoreDetail => {
  let score = 70;
  let description = '机型通用';

  if (preferredType && crane.type === preferredType) {
    score = 100;
    description = '机型完全匹配';
  } else if (crane.type === 'truck') {
    score = 80;
    description = '汽车吊通用性强';
  } else if (crane.type === 'crawler') {
    score = 70;
    description = '履带吊适合重型作业';
  } else if (crane.type === 'tower') {
    score = 60;
    description = '塔吊适合高层建筑';
  } else if (crane.type === 'roughTerrain') {
    score = 75;
    description = '越野吊适合复杂地形';
  }

  return {
    dimension: 'model',
    label: '机型匹配',
    score,
    weight: 0,
    weightedScore: 0,
    description
  };
};

export const calculateDistanceScore = (distance?: number): ScoreDetail => {
  let score = 70;
  let description = '距离适中';

  if (distance === undefined || distance === null) {
    score = 60;
    description = '距离未知';
  } else if (distance <= 10) {
    score = 100;
    description = '10公里以内，交通便利';
  } else if (distance <= 30) {
    score = 85;
    description = '30公里以内，通勤方便';
  } else if (distance <= 50) {
    score = 70;
    description = '50公里以内，可接受';
  } else if (distance <= 100) {
    score = 50;
    description = '100公里以内，需考虑运输';
  } else {
    score = 30;
    description = '距离较远，运输成本高';
  }

  return {
    dimension: 'distance',
    label: '距离因素',
    score,
    weight: 0,
    weightedScore: 0,
    description
  };
};

export const calculatePriceScore = (dailyRate: number, avgRate: number): ScoreDetail => {
  const ratio = dailyRate / avgRate;
  let score = 70;
  let description = '价格适中';

  if (ratio <= 0.8) {
    score = 100;
    description = '价格极具竞争力';
  } else if (ratio <= 0.95) {
    score = 85;
    description = '价格低于平均';
  } else if (ratio <= 1.05) {
    score = 70;
    description = '价格与市场持平';
  } else if (ratio <= 1.2) {
    score = 55;
    description = '价格略高于市场';
  } else {
    score = 40;
    description = '价格偏高';
  }

  return {
    dimension: 'price',
    label: '价格优势',
    score,
    weight: 0,
    weightedScore: 0,
    description
  };
};

export const calculateAvailabilityScore = (status: string): ScoreDetail => {
  let score = 50;
  let description = '状态未知';

  if (status === 'available') {
    score = 100;
    description = '立即可用';
  } else if (status === 'occupied') {
    score = 30;
    description = '当前占用中';
  } else if (status === 'maintenance') {
    score = 50;
    description = '维保中，需确认时间';
  } else if (status === 'offline') {
    score = 0;
    description = '离线，不可用';
  }

  return {
    dimension: 'availability',
    label: '可用状态',
    score,
    weight: 0,
    weightedScore: 0,
    description
  };
};

export const calculateRatingScore = (): ScoreDetail => {
  return {
    dimension: 'rating',
    label: '历史评分',
    score: 85,
    weight: 0,
    weightedScore: 0,
    description: '历史服务评价良好'
  };
};

export const calculateRecommendScore = (
  crane: Crane, request: RecommendRequest,
  weightConfig: WeightConfig, avgDailyRate: number
): RecommendItem => {
  const details: ScoreDetail[] = [];
  const totalWeight = Object.values(weightConfig).reduce((sum, w) => sum + w, 0);

  const tonnageDetail = calculateTonnageScore(crane, request.requiredTonnage);
  tonnageDetail.weight = weightConfig.tonnage / totalWeight;
  tonnageDetail.weightedScore = tonnageDetail.score * tonnageDetail.weight;
  details.push(tonnageDetail);

  const modelDetail = calculateModelScore(crane, request.preferredType);
  modelDetail.weight = weightConfig.model / totalWeight;
  modelDetail.weightedScore = modelDetail.score * modelDetail.weight;
  details.push(modelDetail);

  const distanceDetail = calculateDistanceScore(crane.distance);
  distanceDetail.weight = weightConfig.distance / totalWeight;
  distanceDetail.weightedScore = distanceDetail.score * distanceDetail.weight;
  details.push(distanceDetail);

  const priceDetail = calculatePriceScore(crane.dailyRate, avgDailyRate);
  priceDetail.weight = weightConfig.price / totalWeight;
  priceDetail.weightedScore = priceDetail.score * priceDetail.weight;
  details.push(priceDetail);

  const availabilityDetail = calculateAvailabilityScore(crane.status);
  availabilityDetail.weight = weightConfig.availability / totalWeight;
  availabilityDetail.weightedScore = availabilityDetail.score * availabilityDetail.weight;
  details.push(availabilityDetail);

  const ratingDetail = calculateRatingScore();
  ratingDetail.weight = weightConfig.rating / totalWeight;
  ratingDetail.weightedScore = ratingDetail.score * ratingDetail.weight;
  details.push(ratingDetail);

  const totalScore = details.reduce((sum, d) => sum + d.weightedScore, 0);

  let matchLevel: 'perfect' | 'good' | 'normal' | 'low' = 'normal';
  if (totalScore >= 85) matchLevel = 'perfect';
  else if (totalScore >= 70) matchLevel = 'good';
  else if (totalScore >= 50) matchLevel = 'normal';
  else matchLevel = 'low';

  return {
    crane,
    score: Math.round(totalScore),
    scoreDetails: details,
    rank: 0,
    matchLevel
  };
};

export const getRecommendedCranes = (
  cranes: Crane[],
  request: RecommendRequest,
  weightConfig: WeightConfig,
  topN: number = 5
): RecommendItem[] => {
  const avgDailyRate = cranes.reduce((sum, c) => sum + c.dailyRate, 0) / cranes.length;

  const results = cranes
    .map(crane => calculateRecommendScore(crane, request, weightConfig, avgDailyRate))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return results;
};
