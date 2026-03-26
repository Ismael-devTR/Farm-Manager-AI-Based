import Link from "next/link";
import { prisma } from "@/lib/prisma";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

export default async function BatchesPage() {
  const batches = await prisma.batch.findMany({
    orderBy: { entryDate: "desc" },
    include: { _count: { select: { weightRecords: true, feedRecords: true, expenses: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
        <Link
          href="/batches/new"
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New batch
        </Link>
      </div>

      {batches.length === 0 ? (
        <p className="text-gray-500 text-sm">No batches yet. Create your first one.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Entry date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Animals</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Initial weight</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/batches/${b.id}`} className="font-medium text-green-700 hover:underline">
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.entryDate.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{b.animalCount}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{b.initialWeight} kg</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
