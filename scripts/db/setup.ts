// scripts/db/setup.ts
import { execSync } from 'child_process';
import 'dotenv/config';

const setupDatabase = async () => {
  console.log('🚀 Setting up database...');
  
  try {
    // Exécuter les migrations
    console.log('📦 Running migrations...');
    execSync('npm run db:migrate', { stdio: 'inherit' });
    
    // Exécuter le seeding
    console.log('🌱 Seeding database...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    
    console.log('✅ Database setup completed!');
  } catch (error) {
    console.error('❌ Database setup failed!');
    console.error(error);
    process.exit(1);
  }
};

setupDatabase();