// prisma/seed.js (ESM)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const exercises = [
  // Strength - Chest
  { name: 'Bench Press', type: 'Strength' },
  { name: 'Dumbbell Press', type: 'Strength' },
  { name: 'Incline Bench Press', type: 'Strength' },
  { name: 'Push-up', type: 'Strength' },
  { name: 'Cable Crossover', type: 'Strength' },
  { name: 'Dips', type: 'Strength' },

  // Strength - Back
  { name: 'Pull-up', type: 'Strength' },
  { name: 'Deadlift', type: 'Strength' },
  { name: 'Bent-over Row', type: 'Strength' },
  { name: 'Lat Pulldown', type: 'Strength' },
  { name: 'T-Bar Row', type: 'Strength' },

  // Strength - Legs
  { name: 'Squat', type: 'Strength' },
  { name: 'Leg Press', type: 'Strength' },
  { name: 'Lunge', type: 'Strength' },
  { name: 'Leg Extension', type: 'Strength' },
  { name: 'Leg Curl', type: 'Strength' },
  { name: 'Calf Raise', type: 'Strength' },

  // Strength - Shoulders
  { name: 'Overhead Press', type: 'Strength' },
  { name: 'Lateral Raise', type: 'Strength' },
  { name: 'Front Raise', type: 'Strength' },
  { name: 'Shrugs', type: 'Strength' },
  
  // Strength - Arms
  { name: 'Bicep Curl', type: 'Strength' },
  { name: 'Tricep Extension', type: 'Strength' },
  { name: 'Hammer Curl', type: 'Strength' },
  { name: 'Skull Crusher', type: 'Strength' },

  // Cardio
  { name: 'Running', type: 'Cardio' },
  { name: 'Cycling', type: 'Cardio' },
  { name: 'Jump Rope', type: 'Cardio' },
  { name: 'Rowing', type: 'Cardio' },
  { name: 'StairMaster', type: 'Cardio' },
  { name: 'Elliptical Trainer', type: 'Cardio' },

  // Stretching
  { name: 'Hamstring Stretch', type: 'Stretching' },
  { name: 'Quad Stretch', type: 'Stretching' },
  { name: 'Chest Stretch', type: 'Stretching' },
  { name: 'Triceps Stretch', type: 'Stretching' },
];

async function seedAdmin() {
  const email = 'admin@flexi.com';
  const password = 'admin123';
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
      provider: 'email',
      role: 'ADMIN',
      isAdmin: true,
    },
  });
  console.log(`Seeded admin -> ${email} / ${password}`);
}

async function main() {
  console.log('Start seeding...');
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    });
  }
  await seedAdmin();
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });