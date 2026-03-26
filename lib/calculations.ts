export type BatchInputs = {
  animalCount: number;
  initialWeightPerAnimal: number; // kg
  costPerAnimal: number;
  feedRecords: { quantityKg: number; costPerKg: number; date: Date }[];
  expenses: { amount: number }[];
  weightRecords: { totalWeight: number; animalCount: number; weekNumber: number }[];
};

export type FeedProjectionInputs = {
  feedRecords: { quantityKg: number; costPerKg: number; date: Date }[];
  entryDate: Date;
  animalCount: number;
  initialWeightPerAnimal: number;
  avgCurrentWeight: number | null;
  fcr: number | null;
  targetAvgWeight: number; // kg per animal — user-supplied
};

export type FeedProjection = {
  avgDailyKg: number | null;          // kg/day based on elapsed time
  projectedTotalFeedKg: number | null; // total feed to reach target
  remainingFeedKg: number | null;      // still to consume
  daysRemaining: number | null;
  estimatedFinishDate: Date | null;
  avgCostPerKg: number | null;
  projectedRemainingCost: number | null;
};

export function computeFeedProjection(p: FeedProjectionInputs): FeedProjection {
  const totalFeedKg = p.feedRecords.reduce((s, r) => s + r.quantityKg, 0);
  const totalFeedCost = p.feedRecords.reduce((s, r) => s + r.quantityKg * r.costPerKg, 0);

  const avgCostPerKg = totalFeedKg > 0 ? totalFeedCost / totalFeedKg : null;

  // Daily consumption rate: total kg divided by days since entry
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const elapsedDays = Math.max(1, (now.getTime() - p.entryDate.getTime()) / msPerDay);
  const avgDailyKg = totalFeedKg > 0 ? totalFeedKg / elapsedDays : null;

  // Use current FCR if available, otherwise fall back to 2.7 (typical for pigs)
  const effectiveFcr = p.fcr ?? 2.7;

  const currentAvgWeight = p.avgCurrentWeight ?? p.initialWeightPerAnimal;
  const targetGainPerAnimal = Math.max(0, p.targetAvgWeight - p.initialWeightPerAnimal);
  const currentGainPerAnimal = Math.max(0, currentAvgWeight - p.initialWeightPerAnimal);
  const remainingGainPerAnimal = Math.max(0, targetGainPerAnimal - currentGainPerAnimal);

  const projectedTotalFeedKg = targetGainPerAnimal * p.animalCount * effectiveFcr;
  const remainingFeedKg = remainingGainPerAnimal * p.animalCount * effectiveFcr;

  const daysRemaining =
    avgDailyKg && avgDailyKg > 0 ? remainingFeedKg / avgDailyKg : null;

  const estimatedFinishDate =
    daysRemaining != null
      ? new Date(now.getTime() + daysRemaining * msPerDay)
      : null;

  const projectedRemainingCost =
    avgCostPerKg != null ? remainingFeedKg * avgCostPerKg : null;

  return {
    avgDailyKg,
    projectedTotalFeedKg,
    remainingFeedKg,
    daysRemaining,
    estimatedFinishDate,
    avgCostPerKg,
    projectedRemainingCost,
  };
}

export type BatchMetrics = {
  // Costs
  animalCost: number;
  totalFeedCost: number;
  totalFeedKg: number;
  totalExpenseCost: number;
  totalCost: number;
  costPerAnimal: number;

  // Weight & production
  initialTotalWeight: number;
  currentTotalWeight: number | null;
  currentAnimalCount: number | null;
  avgCurrentWeight: number | null;
  totalWeightGain: number | null;

  // Efficiency
  fcr: number | null; // Feed Conversion Ratio: kg feed / kg gain (lower = better)
  costPerKgProduced: number | null;
};

export type SimulationInputs = {
  meatPricePerKg: number;
  avgSellingWeight: number; // kg per animal
  carcassYield: number; // 0–100 %
  animalCount: number;
};

export type SimulationResult = {
  revenue: number;
  profit: number;
  profitMargin: number; // %
  trafficLight: "green" | "yellow" | "red";
};

export function computeBatchMetrics(b: BatchInputs): BatchMetrics {
  const animalCost = b.animalCount * b.costPerAnimal;
  const totalFeedKg = b.feedRecords.reduce((s, r) => s + r.quantityKg, 0);
  const totalFeedCost = b.feedRecords.reduce((s, r) => s + r.quantityKg * r.costPerKg, 0);
  const totalExpenseCost = b.expenses.reduce((s, e) => s + e.amount, 0);
  const totalCost = animalCost + totalFeedCost + totalExpenseCost;
  const costPerAnimal = totalCost / b.animalCount;

  const initialTotalWeight = b.animalCount * b.initialWeightPerAnimal;

  const latest = b.weightRecords.reduce<BatchInputs["weightRecords"][0] | null>(
    (best, r) => (!best || r.weekNumber > best.weekNumber ? r : best),
    null
  );

  const currentTotalWeight = latest?.totalWeight ?? null;
  const currentAnimalCount = latest?.animalCount ?? null;
  const avgCurrentWeight =
    currentTotalWeight != null && currentAnimalCount
      ? currentTotalWeight / currentAnimalCount
      : null;

  const totalWeightGain =
    currentTotalWeight != null ? currentTotalWeight - initialTotalWeight : null;

  const fcr =
    totalWeightGain != null && totalWeightGain > 0
      ? totalFeedKg / totalWeightGain
      : null;

  const costPerKgProduced =
    totalWeightGain != null && totalWeightGain > 0
      ? totalCost / totalWeightGain
      : null;

  return {
    animalCost,
    totalFeedCost,
    totalFeedKg,
    totalExpenseCost,
    totalCost,
    costPerAnimal,
    initialTotalWeight,
    currentTotalWeight,
    currentAnimalCount,
    avgCurrentWeight,
    totalWeightGain,
    fcr,
    costPerKgProduced,
  };
}

export function simulateSale(
  totalCost: number,
  inputs: SimulationInputs
): SimulationResult {
  const carcassWeight = inputs.avgSellingWeight * (inputs.carcassYield / 100);
  const revenue = carcassWeight * inputs.meatPricePerKg * inputs.animalCount;
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : -Infinity;

  const trafficLight: SimulationResult["trafficLight"] =
    profitMargin > 15 ? "green" : profitMargin >= 0 ? "yellow" : "red";

  return { revenue, profit, profitMargin, trafficLight };
}
