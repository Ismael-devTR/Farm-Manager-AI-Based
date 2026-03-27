import {PrismaClient} from '../app/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {hash} from 'bcryptjs';
import dotenv from 'dotenv';
import {existsSync} from 'fs';

dotenv.config();
if (existsSync('.env.development')) {
  dotenv.config({path: '.env.development', override: true});
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value) return value;
  throw new Error(`Missing required env var ${key}. Set it in .env or secrets file.`);
}

const SEED_USERS = [
  {
    name: 'Admin',
    email: requireEnv('FM_SEED_ADMIN_EMAIL'),
    password: requireEnv('FM_SEED_ADMIN_PASSWORD'),
  },
  {
    name: 'Operator',
    email: requireEnv('FM_SEED_OPERATOR_EMAIL'),
    password: requireEnv('FM_SEED_OPERATOR_PASSWORD'),
  },
];

async function main() {
  const adapter = new PrismaPg({connectionString: process.env.FM_DATABASE_URL!});
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
