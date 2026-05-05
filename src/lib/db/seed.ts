import 'dotenv/config';
import { db } from './index';
import { users, listings } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Clearing existing data...');
  await db.delete(listings);
  await db.delete(users);

  console.log('🌱 Creating users...');
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const userHash = await bcrypt.hash('User123!', 12);

  const [admin] = await db.insert(users).values({
    email: 'admin@nextmarket.test',
    name: 'Administrator',
    passwordHash: adminHash,
    role: 'admin',
  }).returning();

  const [jan] = await db.insert(users).values({
    email: 'jan@nextmarket.test',
    name: 'Jan Kowalski',
    passwordHash: userHash,
    role: 'user',
  }).returning();

  const [anna] = await db.insert(users).values({
    email: 'anna@nextmarket.test',
    name: 'Anna Nowak',
    passwordHash: userHash,
    role: 'user',
  }).returning();

  console.log('🌱 Creating listings...');
  await db.insert(listings).values([
    {
      title: 'MacBook Pro 14" M3 Pro',
      description: '<p>Stan idealny, używany 6 miesięcy. Pełny zestaw z pudełkiem i ładowarką.</p><p>RAM 18GB, SSD 512GB, Space Black.</p>',
      price: '8500.00',
      currency: 'PLN',
      status: 'active',
      authorId: jan.id,
      imageUrl: 'https://picsum.photos/seed/macbook/600/400',
    },
    {
      title: 'Rower górski Trek Marlin 7',
      description: '<p>Rower w dobrym stanie, rama aluminiowa rozmiar M.</p><p>Hamulce hydrauliczne, 2x9 biegów.</p>',
      price: '2200.00',
      currency: 'PLN',
      status: 'active',
      authorId: anna.id,
      imageUrl: 'https://picsum.photos/seed/bike/600/400',
    },
    {
      title: 'Test XSS Listing — DO NOT REMOVE',
      // SECURITY (test data): celowy payload XSS używany w scenariuszu T1.
      // Wariant baseline/typical: payload wykonuje się przy renderowaniu (Stored XSS).
      // Wariant hardened: DOMPurify usuwa <script> i atrybuty event handler.
      description: '<p>Normalny opis ogłoszenia.</p><img src=x onerror="document.title=\'PWNED-T01\'"><script>console.error(\'XSS-T01-fired\')</script>',
      price: '1.00',
      currency: 'PLN',
      status: 'active',
      authorId: jan.id,
      imageUrl: 'https://picsum.photos/seed/xss/600/400',
    },
    {
      title: 'Konsola PS5 + 2 pady',
      description: '<p>Wersja z napędem, firmware aktualny. Dwa pady DualSense w zestawie.</p>',
      price: '1800.00',
      currency: 'PLN',
      status: 'pending',
      authorId: anna.id,
      imageUrl: 'https://picsum.photos/seed/ps5/600/400',
    },
  ]);

  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
