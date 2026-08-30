import dotenv from 'dotenv';
dotenv.config();

import { fetchDailyRatesFromAPI } from './src/backend/metalRatesScheduler';

async function runNow() {
  console.log("🚀 Manually triggering the 5:00 AM Pricing Job...");
  await fetchDailyRatesFromAPI();
  console.log("✅ Job triggered successfully. Check logs above.");
}

runNow().catch(console.error);
