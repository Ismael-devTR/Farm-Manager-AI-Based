import {PrismaClient} from '../app/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {hash} from 'bcryptjs';
import 'dotenv/config';

const SEED_USERS = [
  {
    name: 'Admin',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@farm.local',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
  },
  {
    name: 'Operator',
    email: process.env.SEED_OPERATOR_EMAIL ?? 'operator@farm.local',
    password: process.env.SEED_OPERATOR_PASSWORD ?? 'operator123',
  },
];

async function main() {
  const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
  const prisma = new PrismaClient({adapter});

  try {
    for (const u of SEED_USERS) {
      const passwordHash = await hash(u.password, 10);
      const existing = await prisma.user.findUnique({
        where: {email: u.email},
      });

      if (existing) {
        console.log(`  ⏭  ${u.name} (${u.email}) — already exists, skipped`);
        continue;
      }

      await prisma.user.create({
        data: {name: u.name, email: u.email, passwordHash},
      });
      console.log(`  ✅ ${u.name} (${u.email}) — created`);
    }

    console.log('\nSeed completed.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
