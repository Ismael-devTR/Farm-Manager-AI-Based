import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteBatch, updateBatchStatus } from "@/lib/actions/batch";
import { deleteWeightRecord } from "@/lib/actions/weight";
import { deleteFeedRecord } from "@/lib/actions/feed";
import { deleteExpense } from "@/lib/actions/expense";
import { deleteSchedule, toggleScheduleComplete } from "@/lib/actions/schedule";
import WeightForm from "@/components/WeightForm";
import FeedForm from "@/components/FeedForm";
import ExpenseForm from "@/components/ExpenseForm";
import ScheduleForm from "@/components/ScheduleForm";
import SalePriceSimulator from "@/components/SalePriceSimulator";
import WeightChart from "@/components/charts/WeightChart";
import FeedChart from "@/components/charts/FeedChart";
import CostBreakdownChart from "@/components/charts/CostBreakdownChart";
import AccumulatedCostChart from "@/components/charts/AccumulatedCostChart";
import { computeBatchMetrics } from "@/lib/calculations";
import { BatchStatus } from "@/app/generated/prisma/enums";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";

type Props = { params: Promise<{ id: string }> };

export default async function BatchDetailPage({ params }: Props) {
  const { id } = await params;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.batches;
  const wt = dict.weightForm;
  const ft = dict.feedForm;
  const et = dict.expenseForm;
  const st = dict.scheduleForm;

  const batch = await prisma.batch.findUnique({
    where: { id },
    include: {
      weightRecords: { orderBy: { weekNumber: "asc" } },
      feedRecords: { orderBy: { date: "asc" } },
      expenses: { orderBy: { date: "asc" } },
      vaccinationSchedules: { orderBy: { scheduledDate: "asc" } },
    },
  });

  if (!batch) notFound();

  const metrics = computeBatchMetrics({
    animalCount: batch.animalCount,
    initialWeightPerAnimal: batch.initialWeight,
    costPerAnimal: batch.costPerAnimal,
    feedRecords: batch.feedRecords,
    expenses: batch.expenses,
    weightRecords: batch.weightRecords,
  });

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/batches" className="text-sm text-gray-500 hover:text-gray-700">{dict.common.back}</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{batch.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {batch.entryDate.toLocaleDateString()} · {batch.animalCount} {t.animalsSuffix} · {batch.birthWeeks}w {t.oldAtEntry}
          </p>
        </div>
        <div className="flex gap-2">
          {batch.status === "ACTIVE" && (
            <form action={async () => { "use server"; await updateBatchStatus(id, BatchStatus.SOLD); }}>
              <button type="submit" className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                {t.markAsSold}
              </button>
            </form>
          )}
          <form action={async () => { "use server"; await deleteBatch(id); }}>
            <button type="submit" className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              {dict.common.delete}
            </button>
          </form>
        </div>
      </div>

      {/* Cost summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t.totalCost} value={`$${metrics.totalCost.toFixed(2)}`} />
        <StatCard label={t.costPerAnimal} value={`$${metrics.costPerAnimal.toFixed(2)}`} />
        <StatCard label={t.costPerKgProduced} value={metrics.costPerKgProduced != null ? `$${metrics.costPerKgProduced.toFixed(2)}` : "—"} />
        <StatCard label={t.fcr} value={metrics.fcr != null ? metrics.fcr.toFixed(2) : "—"} hint={metrics.fcr != null ? t.fcrHint : undefined} />
      </div>

      {/* Weight summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t.initialTotalWeight} value={`${metrics.initialTotalWeight.toFixed(0)} kg`} />
        <StatCard label={t.currentTotalWeight} value={metrics.currentTotalWeight != null ? `${metrics.currentTotalWeight.toFixed(0)} kg` : "—"} />
        <StatCard label={t.totalWeightGain} value={metrics.totalWeightGain != null ? `${metrics.totalWeightGain.toFixed(0)} kg` : "—"} />
        <StatCard label={t.avgWeightPerAnimal} value={metrics.avgCurrentWeight != null ? `${metrics.avgCurrentWeight.toFixed(1)} kg` : "—"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Section title={t.chartsWeight}><WeightChart records={batch.weightRecords} /></Section>
        <Section title={t.chartsFeed}><FeedChart records={batch.feedRecords} /></Section>
        <Section title={t.chartsAccCost}>
          <AccumulatedCostChart animalCost={metrics.animalCost} feedRecords={batch.feedRecords} expenses={batch.expenses} />
        </Section>
        <Section title={t.chartsBreakdown}>
          <CostBreakdownChart animalCost={metrics.animalCost} feedCost={metrics.totalFeedCost} expenseCost={metrics.totalExpenseCost} />
        </Section>
      </div>

      {/* Sale simulator */}
      <Section title={t.simulatorSection}>
        <SalePriceSimulator totalCost={metrics.totalCost} animalCount={batch.animalCount} avgCurrentWeight={metrics.avgCurrentWeight} />
      </Section>

      {/* Weekly weights */}
      <Section title={t.weeklyWeights}>
        <WeightForm batchId={id} />
        {batch.weightRecords.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{wt.weekCol}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{wt.dateCol}</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">{wt.totalCol}</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">{wt.animalsCol}</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">{wt.avgCol}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batch.weightRecords.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium">W{r.weekNumber}</td>
                  <td className="px-3 py-2 text-gray-600">{r.recordDate.toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">{r.totalWeight}</td>
                  <td className="px-3 py-2 text-right">{r.animalCount}</td>
                  <td className="px-3 py-2 text-right">{(r.totalWeight / r.animalCount).toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={async () => { "use server"; await deleteWeightRecord(r.id, id); }}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">{dict.common.delete}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Feed records */}
      <Section title={`${t.feedConsumption} — ${metrics.totalFeedKg.toFixed(0)} kg ${t.totalSuffix} · $${metrics.totalFeedCost.toFixed(2)}`}>
        <FeedForm batchId={id} />
        {batch.feedRecords.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{ft.dateCol}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{ft.typeCol}</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">{ft.qtyCol}</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">{ft.costCol}</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">{ft.totalCol}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batch.feedRecords.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-gray-600">{r.date.toLocaleDateString()}</td>
                  <td className="px-3 py-2">{r.feedType}</td>
                  <td className="px-3 py-2 text-right">{r.quantityKg}</td>
                  <td className="px-3 py-2 text-right">{r.costPerKg.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-medium">${(r.quantityKg * r.costPerKg).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={async () => { "use server"; await deleteFeedRecord(r.id, id); }}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">{dict.common.delete}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Expenses */}
      <Section title={`${t.expensesSection} — $${metrics.totalExpenseCost.toFixed(2)} ${t.totalSuffix}`}>
        <ExpenseForm batchId={id} />
        {batch.expenses.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{et.dateCol}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{et.categoryCol}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{et.descriptionCol}</th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">{et.amountCol}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batch.expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-gray-600">{e.date.toLocaleDateString()}</td>
                  <td className="px-3 py-2"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{e.category}</span></td>
                  <td className="px-3 py-2">{e.description}</td>
                  <td className="px-3 py-2 text-right font-medium">${e.amount.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <form action={async () => { "use server"; await deleteExpense(e.id, id); }}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">{dict.common.delete}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Schedules */}
      <Section title={t.scheduleSection}>
        <ScheduleForm batchId={id} />
        {batch.vaccinationSchedules.length > 0 && (
          <table className="w-full text-sm mt-4">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{st.dateCol}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{st.typeCol}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{st.productCol}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">{st.statusCol}</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batch.vaccinationSchedules.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 text-gray-600">{s.scheduledDate.toLocaleDateString()}</td>
                  <td className="px-3 py-2"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{s.type}</span></td>
                  <td className="px-3 py-2">{s.product}</td>
                  <td className="px-3 py-2">
                    <form action={async () => { "use server"; await toggleScheduleComplete(s.id, id, !s.completed); }}>
                      <button type="submit" className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {s.completed ? st.done : st.pending}
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <form action={async () => { "use server"; await deleteSchedule(s.id, id); }}>
                      <button type="submit" className="text-xs text-red-500 hover:underline">{dict.common.delete}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}
