require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const { Client } = require('pg');
const { parse } = require('csv-parse');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca: fs.readFileSync(
      process.env.APPDATA + '\\postgresql\\root.crt'
    ).toString()
  }
});

async function main() {
  await client.connect();

  const parser = fs
    .createReadStream('C:\\Users\\ashis\\Downloads\\routes.csv')
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    }));

  let count = 0;

  for await (const row of parser) {
    await client.query(
      'INSERT INTO routes (id, origin, destination) VALUES ($1, $2, $3)',
      [Number(row.id), row.origin, row.destination]
    );

    count++;
  }

  console.log(`Imported ${count} routes.`);

  await client.end();
}

main().catch(async (err) => {
  console.error('IMPORT FAILED:', err.message);
  try {
    await client.end();
  } catch {}
  process.exit(1);
});