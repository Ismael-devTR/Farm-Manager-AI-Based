import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.FM_DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientSingleton };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
