/**
 * Prisma verification seed for Vinayak Plant against Supabase.
 * Applies after drizzle migrations. Does not print secrets.
 *
 *   pnpm --filter @stamped/l6-api prisma:seed-vinayak
 */
import { loadDotEnv } from "../src/db/load-dotenv.js";
import { prisma } from "../src/db/prisma.js";

loadDotEnv();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    create: { slug: "acme", name: "Acme" },
    update: { name: "Acme" },
  });

  const existing = await prisma.plant.findFirst({
    where: { orgId: org.id, externalPlantId: "plant_vinayak_1" },
  });

  const plant =
    existing ??
    (await prisma.plant.create({
      data: {
        orgId: org.id,
        externalPlantId: "plant_vinayak_1",
        name: "Vinayak Plant",
        timezone: "Asia/Kolkata",
      },
    }));

  console.log(
    JSON.stringify(
      {
        ok: true,
        org: { id: org.id, slug: org.slug },
        plant: {
          id: plant.id,
          externalPlantId: plant.externalPlantId,
          name: plant.name,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
