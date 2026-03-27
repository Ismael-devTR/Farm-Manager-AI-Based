import { prisma } from "@/lib/prisma";
import { computeBatchMetrics } from "@/lib/calculations";

/**
 * Builds a system-prompt context string with current farm data.
 * All queries are read-only.
 */
export async function buildFarmContext(): Promise<string> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [batches, upcomingSchedules, recentExpenses] = await Promise.all([
    prisma.batch.findMany({
      where: { status: "ACTIVE" },
      include: {
        weightRecords: { orderBy: { weekNumber: "desc" }, take: 3 },
        feedRecords: { orderBy: { date: "desc" }, take: 10 },
        expenses: true,
      },
    }),
    prisma.vaccinationSchedule.findMany({
      where: {
        completed: false,
        scheduledDate: { gte: now, lte: sevenDaysFromNow },
      },
      include: { batch: { select: { name: true } } },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      include: { batch: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const parts: string[] = [];

  parts.push("=== ACTIVE BATCHES ===");
  if (batches.length === 0) {
    parts.push("No active batches.");
  }
  for (const batch of batches) {
    const metrics = computeBatchMetrics({
      animalCount: batch.animalCount,
      initialWeightPerAnimal: batch.initialWeight,
      costPerAnimal: batch.costPerAnimal,
      feedRecords: batch.feedRecords.map((f) => ({
        quantityKg: f.quantityKg,
        costPerKg: f.costPerKg,
        date: f.date,
      })),
      expenses: batch.expenses.map((e) => ({ amount: e.amount })),
      weightRecords: batch.weightRecords.map((w) => ({
        totalWeight: w.totalWeight,
        animalCount: w.animalCount,
        weekNumber: w.weekNumber,
      })),
    });

    parts.push(`Batch: ${batch.name}`);
    parts.push(`  Animals: ${batch.animalCount}, Entry: ${batch.entryDate.toISOString().slice(0, 10)}`);
    parts.push(`  Avg weight/animal: ${metrics.avgCurrentWeight?.toFixed(1) ?? "N/A"} kg`);
    parts.push(`  Total cost: $${metrics.totalCost.toFixed(2)}, Cost/animal: $${metrics.costPerAnimal.toFixed(2)}`);
    parts.push(`  FCR: ${metrics.fcr?.toFixed(2) ?? "N/A"}, Cost/kg produced: $${metrics.costPerKgProduced?.toFixed(2) ?? "N/A"}`);
    parts.push(`  Total feed: ${metrics.totalFeedKg.toFixed(0)} kg ($${metrics.totalFeedCost.toFixed(2)})`);
    parts.push(`  Total weight gain: ${metrics.totalWeightGain?.toFixed(0) ?? "N/A"} kg`);
  }

  parts.push("\n=== UPCOMING SCHEDULES (next 7 days) ===");
  if (upcomingSchedules.length === 0) {
    parts.push("None.");
  }
  for (const s of upcomingSchedules) {
    parts.push(`  ${s.scheduledDate.toISOString().slice(0, 10)} — ${s.type} — ${s.product} (Batch: ${s.batch.name})`);
  }

  parts.push("\n=== RECENT EXPENSES (last 30 days) ===");
  if (recentExpenses.length === 0) {
    parts.push("None.");
  }
  for (const e of recentExpenses) {
    parts.push(`  ${e.date.toISOString().slice(0, 10)} — ${e.category} — ${e.description}: $${e.amount.toFixed(2)} (Batch: ${e.batch.name})`);
  }

  return parts.join("\n");
}

export const SYSTEM_PROMPT = `You are a helpful farm management assistant for a pig fattening operation.
You have read-only access to the farm's current data, which is provided below.
You also have access to web search results which may contain relevant public information such as market prices, veterinary guidelines, or feed recommendations.
Answer questions about batches, feed, costs, schedules, and production efficiency.
You can help with sale simulations and proactive insights.
Be concise and practical. Use the data provided — do not make up numbers.
When using web search results, mention that the information comes from public sources. When using farm data, make it clear you are referencing the farm's own records.
If you don't have enough data to answer, say so.
IMPORTANT: Always reply in the same language the user writes in. Never include translations or parenthetical text in other languages. If the user writes in Spanish, reply entirely in Spanish. If the user writes in English, reply entirely in English.

--- FARM DATA ---
`;
