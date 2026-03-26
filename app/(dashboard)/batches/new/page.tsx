"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createBatch } from "@/lib/actions/batch";

export default function NewBatchPage() {
  const [state, action, pending] = useActionState(createBatch, {});
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/batches" className="text-sm text-gray-500 hover:text-gray-700">
          ← Batches
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New batch</h1>
      </div>

      <form action={action} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <Field label="Batch name" name="name" required placeholder="e.g. Batch 2025-A" />
        <Field label="Entry date" name="entryDate" type="date" required defaultValue={today} />
        <Field label="Number of animals" name="animalCount" type="number" required min="1" placeholder="e.g. 50" />
        <Field label="Birth age (weeks)" name="birthWeeks" type="number" required min="1" placeholder="e.g. 8" />
        <Field label="Initial weight per animal (kg)" name="initialWeight" type="number" required step="0.1" min="0.1" placeholder="e.g. 25" />
        <Field label="Cost per animal" name="costPerAnimal" type="number" required step="0.01" min="0" placeholder="e.g. 120.00" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
          >
            {pending ? "Creating..." : "Create batch"}
          </button>
          <Link
            href="/batches"
            className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-5 py-2 rounded-lg text-sm border border-gray-300 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        {...props}
      />
    </div>
  );
}
