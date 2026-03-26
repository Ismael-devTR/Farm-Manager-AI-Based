export type BatchInputs = {
  animalCount: number;
  initialWeightPerAnimal: number; // kg
  costPerAnimal: number;
  feedRecords: { quantityKg: number; costPerKg: number }[];
  expenses: { amount: number }[];
  weightRecords: { totalWeight: number; animalCount: number; weekNumber: number }[];
};

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
