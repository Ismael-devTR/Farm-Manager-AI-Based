import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/locales";
import { getSession } from "@/lib/session";
import { canWrite } from "@/lib/authorization";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SOLD: "bg-blue-100 text-blue-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

export default async function BatchesPage() {
  const session = await getSession();
  const writable = session ? canWrite(session.role) : false;
  const locale = await getLocale();
  const t = getDictionary(locale).batches;

  const batches = await prisma.batch.findMany({
    orderBy: { entryDate: "desc" },
    include: { _count: { select: { weightRecords: true, feedRecords: true, expenses: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        {writable && (
          <Link href="/batches/new" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {t.newBatch}
          </Link>
        )}
      </div>

      {batches.length === 0 ? (
        <p className="text-gray-500 text-sm">{t.noBatches}</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">{t.entryDate}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{t.animals}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">{t.initialWeight}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/batches/${b.id}`} className="font-medium text-green-700 hover:underline">{b.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.entryDate.toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{b.animalCount}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{b.initialWeight} kg</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status]}`}>{b.status}</span>
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
