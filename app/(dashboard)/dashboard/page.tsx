import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeBatchMetrics, simulateSale } from "@/lib/calculations";

const trafficLight = {
  green: { dot: "bg-green-500", text: "text-green-700", label: "Profitable (>15%)" },
  yellow: { dot: "bg-yellow-400", text: "text-yellow-700", label: "Break-even (0–15%)" },
  red: { dot: "bg-red-500", text: "text-red-700", label: "Loss" },
};

// Default simulation assumptions shown on dashboard (no market price available without user input)
// We show cost metrics only; traffic light requires actual sale price.

export default async function DashboardPage() {
  const batches = await prisma.batch.findMany({
    where: { status: "ACTIVE" },
    orderBy: { entryDate: "desc" },
    include: {
      weightRecords: true,
      feedRecords: true,
      expenses: true,
      _count: { select: { vaccinationSchedules: true } },
    },
  });

  const pendingSchedules = await prisma.vaccinationSchedule.count({
    where: { completed: false },
  });

  const allBatches = await prisma.batch.count();
  const soldBatches = await prisma.batch.count({ where: { status: "SOLD" } });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/batches/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New batch
        </Link>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard label="Active batches" value={String(batches.length)} />
        <SummaryCard label="Sold batches" value={String(soldBatches)} />
        <SummaryCard label="Total batches" value={String(allBatches)} />
        <SummaryCard
          label="Pending schedules"
          value={String(pendingSchedules)}
          accent={pendingSchedules > 0}
        />
      </div>

      {/* Active batch cards */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No active batches.{" "}
          <Link href="/batches/new" className="text-green-700 hover:underline font-medium">
            Create one
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Active batches</h2>
          <div className="grid grid-cols-1 gap-4">
            {batches.map((batch) => {
              const metrics = computeBatchMetrics({
                animalCount: batch.animalCount,
                initialWeightPerAnimal: batch.initialWeight,
                costPerAnimal: batch.costPerAnimal,
                feedRecords: batch.feedRecords,
                expenses: batch.expenses,
                weightRecords: batch.weightRecords,
              });

              // Estimate traffic light using a neutral simulation:
              // assumes same cost/kg as market price → break-even scenario
              // Real traffic light requires user to enter sale price in batch detail
              const pendingCount = batch._count.vaccinationSchedules;

              return (
                <Link
                  key={batch.id}
                  href={`/batches/${batch.id}`}
                  className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{batch.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {batch.animalCount} animals · entered {new Date(batch.entryDate).toLocaleDateString()}
                      </p>
                    </div>
                    {pendingCount > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                        {pendingCount} schedule{pendingCount > 1 ? "s" : ""} pending
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3 mt-4">
                    <Metric label="Total cost" value={`$${metrics.totalCost.toFixed(2)}`} />
                    <Metric label="Cost / animal" value={`$${metrics.costPerAnimal.toFixed(2)}`} />
                    <Metric
                      label="FCR"
                      value={metrics.fcr != null ? metrics.fcr.toFixed(2) : "—"}
                    />
                    <Metric
                      label="Avg weight"
                      value={metrics.avgCurrentWeight != null ? `${metrics.avgCurrentWeight.toFixed(1)} kg` : "—"}
                    />
                  </div>

                  {metrics.costPerKgProduced != null && (
                    <p className="text-xs text-gray-400 mt-3">
                      Cost / kg produced: ${metrics.costPerKgProduced.toFixed(2)} ·{" "}
                      Weight gain: {metrics.totalWeightGain?.toFixed(0)} kg ·{" "}
                      Feed: {metrics.totalFeedKg.toFixed(0)} kg
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ? "text-yellow-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
