"use client";

import { useActionState } from "react";
import { addExpense } from "@/lib/actions/expense";
import { useDict } from "@/components/LocaleProvider";

export default function ExpenseForm({ batchId }: { batchId: string }) {
  const dict = useDict();
  const t = dict.expenseForm;
  const action = addExpense.bind(null, batchId);
  const [state, formAction, pending] = useActionState(action, {});
  const today = new Date().toISOString().split("T")[0];

  const cls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500";

  const categories = [
    { value: "VACCINE", label: t.catVaccine },
    { value: "DEWORMER", label: t.catDewormer },
    { value: "VITAMIN", label: t.catVitamin },
    { value: "OTHER", label: t.catOther },
  ];

  return (
    <form action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.date} *</label>
        <input name="date" type="date" required defaultValue={today} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.category} *</label>
        <select name="category" required className={cls}>
          {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.description} *</label>
        <input name="description" type="text" required placeholder={t.descriptionPlaceholder} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{t.amount} *</label>
        <input name="amount" type="number" required step="0.01" min="0" placeholder={t.amountPlaceholder} className={cls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{dict.common.notes}</label>
        <input name="notes" type="text" placeholder={dict.common.optional} className={cls} />
      </div>
      {state?.error && <p className="col-span-2 text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending}
        className="col-span-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors">
        {pending ? dict.common.saving : t.add}
      </button>
    </form>
  );
}
