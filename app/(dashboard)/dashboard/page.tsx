import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeBatchMetrics } from "@/lib/calculations";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { getSession } from "@/lib/session";
import { canWrite } from "@/lib/authorization";

export default async function DashboardPage() {
  const session = await getSession();
  const writable = session ? canWrite(session.role) : false;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.dashboard;

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

  const pendingSchedules = await prisma.vaccinationSchedule.count({ where: { completed: false } });
  const allBatches = await prisma.batch.count();
  const soldBatches = await prisma.batch.count({ where: { status: "SOLD" } });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        {writable && (
          <Link href="/batches/new" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {t.newBatch}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label={t.activeBatches} value={String(batches.length)} />
        <SummaryCard label={t.soldBatches} value={String(soldBatches)} />
        <SummaryCard label={t.totalBatches} value={String(allBatches)} />
        <SummaryCard label={t.pendingSchedules} value={String(pendingSchedules)} accent={pendingSchedules > 0} />
      </div>

      {batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          {t.noBatches}
          {writable && <>{" "}<Link href="/batches/new" className="text-green-700 hover:underline font-medium">{t.createOne}</Link></>}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">{t.activeBatchesSection}</h2>
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
              const pendingCount = batch._count.vaccinationSchedules;

              return (
                <Link key={batch.id} href={`/batches/${batch.id}`}
                  className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-green-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{batch.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {batch.animalCount} {t.activeBatches === "Active batches" ? "animals" : dict.batches.animalsSuffix} · {new Date(batch.entryDate).toLocaleDateString()}
                      </p>
                    </div>
                    {pendingCount > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                        {pendingCount} {pendingCount > 1 ? t.schedules : t.schedule} {t.pending}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <Metric label={t.totalCost} value={`$${metrics.totalCost.toFixed(2)}`} />
                    <Metric label={t.costPerAnimal} value={`$${metrics.costPerAnimal.toFixed(2)}`} />
                    <Metric label={t.fcr} value={metrics.fcr != null ? metrics.fcr.toFixed(2) : "—"} />
                    <Metric label={t.avgWeight} value={metrics.avgCurrentWeight != null ? `${metrics.avgCurrentWeight.toFixed(1)} kg` : "—"} />
                  </div>
                  {metrics.costPerKgProduced != null && (
                    <p className="text-xs text-gray-400 mt-3">
                      {t.costPerKgProduced}: ${metrics.costPerKgProduced.toFixed(2)} · {t.weightGain}: {metrics.totalWeightGain?.toFixed(0)} kg · {t.feed}: {metrics.totalFeedKg.toFixed(0)} kg
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

function SummaryCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ? "text-yellow-600" : "text-gray-900"}`}>{value}</p>
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
