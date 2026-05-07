import 'dotenv/config';
import { db } from './index';
import { users, listings } from './schema';

async function seed() {
  console.log('🌱 Clearing existing data...');
  await db.delete(listings);
  await db.delete(users);

  console.log('🌱 Creating users (PLAIN TEXT passwords — baseline only)...');

  const [admin] = await db.insert(users).values({
    email: 'admin@nextmarket.test',
    name: 'Administrator',
    passwordHash: 'Admin123!', // SECURITY (baseline): plain text.
    role: 'admin',
  }).returning();

  const [jan] = await db.insert(users).values({
    email: 'jan@nextmarket.test',
    name: 'Jan Kowalski',
    passwordHash: 'User123!',
    role: 'user',
  }).returning();

  const [anna] = await db.insert(users).values({
    email: 'anna@nextmarket.test',
    name: 'Anna Nowak',
    passwordHash: 'User123!',
    role: 'user',
  }).returning();

  void admin;

  await db.insert(listings).values([
    {
      title: 'MacBook Pro 14" M3 Pro',
      description: '<p>Stan idealny, używany 6 miesięcy. Pełny zestaw z pudełkiem i ładowarką.</p><p>RAM 18GB, SSD 512GB, Space Black.</p>',
      price: '8500.00', currency: 'PLN', status: 'active', authorId: jan.id,
      imageUrl: 'https://picsum.photos/seed/macbook/600/400',
    },
    {
      title: 'Rower górski Trek Marlin 7',
      description: '<p>Rower w dobrym stanie, rama aluminiowa rozmiar M.</p><p>Hamulce hydrauliczne, 2x9 biegów.</p>',
      price: '2200.00', currency: 'PLN', status: 'active', authorId: anna.id,
      imageUrl: 'https://picsum.photos/seed/bike/600/400',
    },
    {
      title: 'Test XSS Listing — DO NOT REMOVE',
      description: '<p>Normalny opis ogłoszenia.</p><img src=x onerror="document.title=\'PWNED-T01\'"><script>console.error(\'XSS-T01-fired\')</script>',
      price: '1.00', currency: 'PLN', status: 'active', authorId: jan.id,
      imageUrl: 'https://picsum.photos/seed/xss/600/400',
    },
    {
      title: 'Konsola PS5 + 2 pady',
      description: '<p>Wersja z napędem, firmware aktualny. Dwa pady DualSense w zestawie.</p>',
      price: '1800.00', currency: 'PLN', status: 'pending', authorId: anna.id,
      imageUrl: 'https://picsum.photos/seed/ps5/600/400',
    },
  ]);

  console.log('✅ Seed complete (BASELINE — passwords stored in plain text)');
  process.exit(0);
}

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
