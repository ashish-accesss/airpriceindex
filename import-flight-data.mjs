import fs from "fs";
import csv from "csv-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
});

const csvFile = "C:\\Users\\ashis\\Downloads\\flights_data.csv";

async function main() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  const stream = fs.createReadStream(csvFile).pipe(csv());

  let count = 0;
  let batch = [];

  for await (const row of stream) {
    batch.push([
      row.route_id,
      row.date_of_scrap,
      row.date_of_flight,
      row.airline,
      row.flight_no,
      row.origin,
      row.destination,
      row.departure_time,
      row.arrival_time,
      row.price,
    ]);

    if (batch.length >= 5000) {
      await insertBatch(batch);
      count += batch.length;
      console.log(`Imported: ${count}`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await insertBatch(batch);
    count += batch.length;
  }

  console.log(`DONE — Total imported: ${count}`);

  await client.end();
}

async function insertBatch(rows) {
  const values = [];
  const placeholders = [];

  rows.forEach((row, i) => {
    const offset = i * 10;

    placeholders.push(
      `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10})`
    );

    values.push(...row);
  });

  await client.query(
    `
    INSERT INTO flight_data
    (
      route_id,
      date_of_scrap,
      date_of_flight,
      airline,
      flight_no,
      origin,
      destination,
      departure_time,
      arrival_time,
      price
    )
    VALUES ${placeholders.join(",")}
    `,
    values
  );
}

main().catch(async (error) => {
  console.error("IMPORT FAILED:");
  console.error(error);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});