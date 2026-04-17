export type CorrectionMethod = 'no-correction' | 'parallel' | 'perpendicular';

export interface CalculationResults {
  measuredVelocity: number;
  correctedVelocity: number;
  quality: string;
  gamma?: number;
  kFactor?: number;
  influenceMsg?: string;
  influencePresent?: boolean;
}

export interface ConcreteCriteria {
  velocity: string;
  quality: string;
}

export interface BatchReading {
  id: string;
  location: string;
  method: CorrectionMethod;
  pathLength: number;
  pulseTime: number;
  offsetDistance?: number;
  barDiameter?: number;
  results?: CalculationResults;
}
