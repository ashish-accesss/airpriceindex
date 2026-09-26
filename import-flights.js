require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const readline = require("readline");
const { Client } = require("pg");
const { from: copyFrom } = require("pg-copy-streams");

const FILE = "C:\\Users\\ashis\\Downloads\\flights_data.csv";

const SKIP_ROWS = 4330189;
const BATCH_SIZE = 20000;

async function importBatch(client, rows) {
  if (!rows.length) return;

  const copyStream = client.query(
    copyFrom(`
      COPY flight_data (
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
      FROM STDIN
      WITH (FORMAT csv)
    `)
  );

  return new Promise((resolve, reject) => {
    let i = 0;

    copyStream.on("error", reject);
    copyStream.on("finish", resolve);

    function write() {
      while (i < rows.length) {
        if (!copyStream.write(rows[i] + "\n")) {
          copyStream.once("drain", write);
          return;
        }
        i++;
      }

      copyStream.end();
    }

    write();
  });
}

async function main() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  console.log("Connected to Supabase");
  console.log(`Skipping first ${SKIP_ROWS.toLocaleString()} rows...`);
  console.log(`Batch size: ${BATCH_SIZE.toLocaleString()}\n`);

  const fileSize = fs.statSync(FILE).size;
  const startTime = Date.now();

  const input = fs.createReadStream(FILE);

  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  });

  let headerSkipped = false;
  let fileRows = 0;
  let imported = SKIP_ROWS;
  let batch = [];

  for await (const line of rl) {
    if (!headerSkipped) {
      headerSkipped = true;
      continue;
    }

    fileRows++;

    // Already imported rows ko skip karo
    if (fileRows <= SKIP_ROWS) {
      continue;
    }

    if (!line.trim()) continue;

    batch.push(line);

    if (batch.length >= BATCH_SIZE) {
      await importBatch(client, batch);

      imported += batch.length;
      batch = [];

      const elapsed = (Date.now() - startTime) / 1000;
      const bytesRead = input.bytesRead;
      const percent = (bytesRead / fileSize) * 100;
      const speed = imported / elapsed;

      const remainingTime =
        bytesRead > 0
          ? ((fileSize - bytesRead) / bytesRead) * elapsed
          : 0;

      console.log(
        `Progress: ${percent.toFixed(1)}% | ` +
        `Rows: ${imported.toLocaleString()} | ` +
        `Speed: ${Math.round(speed).toLocaleString()} rows/s | ` +
        `ETA: ${Math.floor(remainingTime / 60)}m ${Math.round(
          remainingTime % 60
        )}s`
      );
    }
  }

  if (batch.length > 0) {
    await importBatch(client, batch);
    imported += batch.length;
  }

  await client.end();

  console.log("\n=================================");
  console.log("IMPORT COMPLETED");
  console.log("Total rows:", imported.toLocaleString());
  console.log("=================================");
}

main().catch((err) => {
  console.error("\nIMPORT FAILED:");
  console.error(err);
  process.exit(1);
});