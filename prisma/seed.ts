import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  try {
    const users = await prisma.$queryRaw<Array<{ id: string }>>`
      select id::text as id
      from auth.users
      order by created_at asc
      limit 1
    `;

    if (users.length === 0) {
      console.log("No auth.users found. Sign up once, then run seed again.");
      return;
    }

    const userId = users[0].id;

    await prisma.$executeRaw`
      insert into public.profiles (id, plan)
      values (${userId}::uuid, 'free'::public.plan_type)
      on conflict (id) do nothing
    `;

    const mealRows = await prisma.$queryRaw<Array<{ id: string }>>`
      insert into public.meals (
        user_id,
        eaten_at,
        total_calories,
        protein,
        fat,
        carbs,
        ai_confidence,
        memo
      )
      values (
        ${userId}::uuid,
        now(),
        560,
        36.0,
        18.0,
        68.0,
        0.84,
        'Seed sample meal'
      )
      returning id::text as id
    `;
    const mealId = mealRows[0]?.id;
    if (!mealId) {
      throw new Error("Failed to create seed meal.");
    }

    await prisma.$executeRaw`
      insert into public.meal_items (
        meal_id,
        name,
        estimated_amount,
        calories,
        protein,
        fat,
        carbs,
        confidence
      ) values
      (${mealId}::uuid, '鶏むねサラダ', '1皿', 220, 30.0, 7.0, 10.0, 0.87),
      (${mealId}::uuid, '白ごはん', '150g', 340, 6.0, 11.0, 58.0, 0.81)
    `;

    console.log(`Seeded profile and sample meal for user ${userId}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
