import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = [
    { name: "Admin", email: "admin@farm.local", password: "admin123" },
    { name: "Operator", email: "operator@farm.local", password: "operator123" },
  ];

  for (const u of users) {
    const passwordHash = await hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash },
    });
  }

  console.log("Seeded 2 users:");
  users.forEach((u) => console.log(`  ${u.email} / ${u.password}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
