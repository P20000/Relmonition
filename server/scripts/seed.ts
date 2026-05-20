import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as dotenv from 'dotenv';
import * as schema from '../src/db/schema';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

const DB_URL  = process.env.TURSO_API_URL  || '';
const DB_TOKEN = process.env.TURSO_API_TOKEN || '';

if (!DB_URL) {
  console.error('❌  TURSO_API_URL not set in .env');
  process.exit(1);
}

const client = createClient({ url: DB_URL, authToken: DB_TOKEN });
const db = drizzle(client, { schema });

const USER_ID = 'b79956a7-5e49-460c-a881-a708291eaf12';
const PARTNER_ID = 'a69956a7-5e49-460c-a881-a708291eaf34';
const TENANT_ID = 'efead550-b2ec-44f2-a381-1e9401367f89';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const uuid = () => crypto.randomUUID();

// ─────────────────────────────────────────────────────────────────────────────
// Seed Runner
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱  Checking / seeding multi-tenant infrastructure...');

  // 1. Seed User
  const passwordHash = await bcrypt.hash('password123', 10);
  await db.insert(schema.users).values({
    id: USER_ID,
    email: 'pranav@example.com',
    name: 'Pranav',
    passwordHash,
    billingStatus: 'premium',
    createdAt: daysAgo(60)
  }).onConflictDoNothing();

  await db.insert(schema.users).values({
    id: PARTNER_ID,
    email: 'partner@example.com',
    name: 'Alex',
    passwordHash,
    billingStatus: 'premium',
    createdAt: daysAgo(60)
  }).onConflictDoNothing();

  // 2. Seed Tenant
  await db.insert(schema.tenants).values({
    id: TENANT_ID,
    name: 'Pranav & Alex',
    connectionCode: 'PRNVALX',
    createdAt: daysAgo(60)
  }).onConflictDoNothing();

  // 3. Seed Tenant Members
  await db.insert(schema.tenantMembers).values({
    id: uuid(),
    userId: USER_ID,
    tenantId: TENANT_ID,
    role: 'owner',
    label: 'Pranav',
    status: 'active',
    joinedAt: daysAgo(60)
  }).onConflictDoNothing();

  await db.insert(schema.tenantMembers).values({
    id: uuid(),
    userId: PARTNER_ID,
    tenantId: TENANT_ID,
    role: 'partner',
    label: 'Alex',
    status: 'active',
    joinedAt: daysAgo(60)
  }).onConflictDoNothing();

  // 4. Seed User Preferences
  await db.insert(schema.userPreferences).values({
    userId: USER_ID,
    darkMode: true,
    notifications: true,
    dataSharing: false,
    updatedAt: new Date()
  }).onConflictDoNothing();

  await db.insert(schema.userPreferences).values({
    userId: PARTNER_ID,
    darkMode: true,
    notifications: true,
    dataSharing: false,
    updatedAt: new Date()
  }).onConflictDoNothing();

  // 5. Seed Journal Entries
  const journals = [
    {
      id: uuid(), tenantId: TENANT_ID, userId: USER_ID,
      content: "We had a late night conversation about our future plans. Alex wants to move to Bangalore next year and I feel uncertain — not because I don't want to, but because I'm scared of leaving Hyderabad. We didn't fight, but there was this quiet tension. I journaled to process before sleeping.",
      sentimentScore: -1, category: 'conflict', createdAt: daysAgo(30), date: '2026-04-19'
    },
    {
      id: uuid(), tenantId: TENANT_ID, userId: PARTNER_ID,
      content: "Alex surprised me with breakfast in bed and we talked for two hours without our phones. It reminded me why I fell in love. We laughed about our first date where Alex spilled chai on my white shirt. Feeling so grateful today.",
      sentimentScore: 9, category: 'appreciation', createdAt: daysAgo(25), date: '2026-04-24'
    },
    {
      id: uuid(), tenantId: TENANT_ID, userId: USER_ID,
      content: "Fight about money again. Alex thinks I spend too much on experiences and I think Alex is overly anxious about savings. The real issue is that we haven't sat down and actually made a shared budget. We apologized but didn't solve the root problem.",
      sentimentScore: -3, category: 'conflict', createdAt: daysAgo(18), date: '2026-05-01'
    },
    {
      id: uuid(), tenantId: TENANT_ID, userId: PARTNER_ID,
      content: "We finally made a budget together! Used a shared spreadsheet and both felt heard. Alex appreciated that I took the initiative. The financial anxiety has been sitting between us for months — it felt like a weight lifted just naming it out loud.",
      sentimentScore: 8, category: 'repair', createdAt: daysAgo(14), date: '2026-05-05'
    },
    {
      id: uuid(), tenantId: TENANT_ID, userId: USER_ID,
      content: "Had a hard week at work and Alex was incredibly supportive — made dinner, ran a bath, held space without trying to fix everything. I shared that I've been feeling overwhelmed and Alex just listened. Moments like this make me feel completely safe.",
      sentimentScore: 9, category: 'appreciation', createdAt: daysAgo(10), date: '2026-05-09'
    },
    {
      id: uuid(), tenantId: TENANT_ID, userId: PARTNER_ID,
      content: "Alex got frustrated that I forgot our weekly check-in again. I've been distracted with the project deadline and I keep deprioritising us. I feel guilty. I need to set phone reminders because good intentions aren't enough.",
      sentimentScore: -2, category: 'conflict', createdAt: daysAgo(6), date: '2026-05-13'
    },
    {
      id: uuid(), tenantId: TENANT_ID, userId: USER_ID,
      content: "We did our first proper relationship check-in using the app. Alex gave me 3 appreciations and I gave 2 back. We identified one area of growth: I need to be more present during evenings. Optimistic about building this habit together.",
      sentimentScore: 7, category: 'repair', createdAt: daysAgo(3), date: '2026-05-16'
    },
    {
      id: uuid(), tenantId: TENANT_ID, userId: PARTNER_ID,
      content: "Cooked a new recipe together — total disaster, burned the paneer, laughed so hard we cried. Then ordered pizza and watched our favourite show. Simple evening but I feel so connected today. Love this person.",
      sentimentScore: 10, category: 'appreciation', createdAt: daysAgo(1), date: '2026-05-18'
    },
  ];

  console.log('📝  Inserting journal entries...');
  for (const entry of journals) {
    await db.insert(schema.journalEntries).values(entry).onConflictDoNothing();
  }
  console.log(`   ↳ ${journals.length} journal entries seeded.`);

  // 6. Seed Mood Logs
  const moods = [
    { id: uuid(), tenantId: TENANT_ID, moodValue: 4, label: 'anxious',  createdAt: daysAgo(30) },
    { id: uuid(), tenantId: TENANT_ID, moodValue: 9, label: 'happy',    createdAt: daysAgo(25) },
    { id: uuid(), tenantId: TENANT_ID, moodValue: 3, label: 'stressed', createdAt: daysAgo(18) },
    { id: uuid(), tenantId: TENANT_ID, moodValue: 7, label: 'relieved', createdAt: daysAgo(14) },
    { id: uuid(), tenantId: TENANT_ID, moodValue: 8, label: 'grateful', createdAt: daysAgo(10) },
    { id: uuid(), tenantId: TENANT_ID, moodValue: 5, label: 'guilty',   createdAt: daysAgo(6)  },
    { id: uuid(), tenantId: TENANT_ID, moodValue: 7, label: 'hopeful',  createdAt: daysAgo(3)  },
    { id: uuid(), tenantId: TENANT_ID, moodValue: 10, label: 'joyful',  createdAt: daysAgo(1)  },
  ];

  console.log('😊  Inserting mood logs...');
  for (const mood of moods) {
    await db.insert(schema.moodLogs).values(mood).onConflictDoNothing();
  }
  console.log(`   ↳ ${moods.length} mood logs seeded.`);

  // 7. Seed Interaction Metrics
  const interactions = [
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 3, negativeCount: 5, date: daysAgo(30) },
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 8, negativeCount: 1, date: daysAgo(25) },
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 2, negativeCount: 6, date: daysAgo(18) },
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 7, negativeCount: 2, date: daysAgo(14) },
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 9, negativeCount: 1, date: daysAgo(10) },
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 4, negativeCount: 4, date: daysAgo(6)  },
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 6, negativeCount: 2, date: daysAgo(3)  },
    { id: uuid(), tenantId: TENANT_ID, positiveCount: 10, negativeCount: 0, date: daysAgo(1) },
  ];

  console.log('📊  Inserting interaction metrics...');
  for (const metric of interactions) {
    await db.insert(schema.interactionMetrics).values(metric).onConflictDoNothing();
  }
  console.log(`   ↳ ${interactions.length} interaction metrics seeded.`);

  // 8. Seed AI Insights
  const insights = [
    {
      id: uuid(), tenantId: TENANT_ID, type: 'conflict_summary',
      content: "Over the past month, your recurring conflict theme is **financial anxiety**. One partner tends toward experience-focused spending while the other prioritises savings security. The good news: you've already taken the repair step of building a shared budget. The next milestone is scheduling a 15-minute monthly financial sync to maintain alignment.",
      createdAt: daysAgo(5),
    },
    {
      id: uuid(), tenantId: TENANT_ID, type: 'growth_suggestion',
      content: "Your Gottman Connection Meter shows a strong positive-to-negative ratio this week (16:3). This is well within the Gottman 5:1 ratio for relationship health. To sustain this, try introducing one small new ritual — like a 2-minute check-in question each evening before sleep.",
      createdAt: daysAgo(3),
    },
    {
      id: uuid(), tenantId: TENANT_ID, type: 'conflict_summary',
      content: "Presence and prioritisation have been flagged in two recent entries. One partner has acknowledged difficulty being present during evenings. This is a growth area, not a crisis. Setting a no-phones-after-9pm boundary together could be a low-friction starting point.",
      createdAt: daysAgo(1),
    },
  ];

  console.log('🤖  Inserting AI insights...');
  for (const insight of insights) {
    await db.insert(schema.aiInsights).values(insight).onConflictDoNothing();
  }
  console.log(`   ↳ ${insights.length} AI insights seeded.`);

  console.log('\n🎉  Database seeded successfully!');
  console.log(`    Default User ID: "${USER_ID}" (Email: pranav@example.com, Password: password123)`);
  console.log(`    Default Partner ID: "${PARTNER_ID}" (Email: partner@example.com, Password: password123)`);
  console.log(`    Default Tenant ID: "${TENANT_ID}"`);
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
