// scripts/db/reset.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { reset } from 'drizzle-seed';
import postgres from 'postgres';
import 'dotenv/config';
// Import your schema here
import * as schema from '@/database/schema';

const resetDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log('🗑️  Resetting database...');

  // Use drizzle-seed reset instead of raw SQL
  await reset(db, schema);

  console.log('✅ Database reset completed!');
  process.exit(0);
};

resetDatabase().catch((err) => {
  console.error('❌ Database reset failed!');
  console.error(err);
  process.exit(1);
});