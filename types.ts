
export type InsightType = 'MIGRATION' | 'WELFARE' | 'CHILD';

export interface AadhaarRecord {
  date: string;
  state: string;
  district: string;
  pincode: string;
  age_0_5: number;
  age_5_17: number;
  age_18_greater: number;
  total: number;
  adult_ratio: number;
  child_ratio: number;
}

export interface AgeDistribution {
  infants: number; // 0-5
  students: number; // 5-17
  adults: number; // 18+
}

export interface MonthlyTrend {
  month: string;
  total: number;
}

export interface DistrictSummary {
  district: string;
  totalEnrolments: number;
  ageDist: AgeDistribution;
  pincodes: Record<string, number>;
}

export interface StateSummary {
  state: string;
  totalEnrolments: number;
  status: 'RED' | 'GREEN';
  hasMigrationRisk: boolean;
  hasWelfareRisk: boolean;
  hasChildRisk: boolean;
  ageDist: AgeDistribution;
  monthlyTrends: MonthlyTrend[];
  districts: Record<string, DistrictSummary>;
}

export interface InsightData {
  problem: string;
  impact: string;
  solution: string[];
}
