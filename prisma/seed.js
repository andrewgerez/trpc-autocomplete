// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";

const prisma = new PrismaClient();
const BATCH_SIZE = 200;

async function main() {
  console.log("🌱 Starting CSV seed...");

  const filePath = path.join(process.cwd(), "public/cities/worldcities.csv");

  if (!fs.existsSync(filePath)) {
    console.error(`❌ CSV file not found: ${filePath}`);
    console.log("📁 Make sure the worldcities.csv file is in public/cities/");
    process.exit(1);
  }

  console.log(`📄 Reading CSV from: ${filePath}`);

  const parser = fs
    .createReadStream(filePath)
    .pipe(parse({ columns: true, skip_empty_lines: true, delimiter: "," }));

  let batch = [];
  let count = 0;
  let processed = 0;

  for await (const row of parser) {
    batch.push(row);

    if (batch.length === BATCH_SIZE) {
      await upsertBatch(batch);
      count += batch.length;
      processed += batch.length;
      console.log(`✅ Processed ${processed} cities...`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(batch);
    count += batch.length;
    processed += batch.length;
  }

  console.log(`🎉 Finished! Total cities processed: ${count}`);

  const totalInDb = await prisma.city.count();
  console.log(`📊 Total cities in database: ${totalInDb}`);

  await prisma.$disconnect();
}

async function upsertBatch(batch) {
  await Promise.all(
    batch.map(async (r) => {
      try {
        await prisma.city.upsert({
          where: { id: BigInt(r.id) },
          create: {
            id: BigInt(r.id),
            city: r.city,
            cityAscii: r.city_ascii,
            latitude: parseFloat(r.lat),
            longitude: parseFloat(r.lng),
            country: r.country,
            iso2: r.iso2,
            iso3: r.iso3,
            adminName: r.admin_name,
            capital: r.capital === "" ? null : r.capital,
            population: r.population
              ? BigInt(Math.trunc(Number(r.population)))
              : BigInt(0),
          },
          update: {
            city: r.city,
            cityAscii: r.city_ascii,
            latitude: parseFloat(r.lat),
            longitude: parseFloat(r.lng),
            country: r.country,
            iso2: r.iso2,
            iso3: r.iso3,
            adminName: r.admin_name,
            capital: r.capital === "" ? null : r.capital,
            population: r.population
              ? BigInt(Math.trunc(Number(r.population)))
              : BigInt(0),
          },
        });
      } catch (e) {
        console.error(`❌ Error while upserting ${r.id} (${r.city}):`, e);
      }
    }),
  );
}

main().catch((e) => {
  console.error("💥 Seed failed:", e);
  process.exit(1);
});
