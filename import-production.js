const fs = require("fs");
const { Client } = require("pg");
const copyFrom = require("pg-copy-streams").from;
require("dotenv").config({ path: ".env.local" });

const file = "C:\\Users\\ashis\\Downloads\\flights_data.csv";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("C:\\Users\\ashis\\AppData\\Roaming\\postgresql\\root.crt")
  }
});

(async () => {
  try {
    await client.connect();
    console.log("Connected to CockroachDB");

    const copyStream = client.query(copyFrom(`
      COPY flight_data (
        date_of_scrap,
        date_of_flight,
        airline,
        flight_no,
        origin,
        destination,
        departure_time,
        arrival_time,
        price
      ) FROM STDIN WITH (FORMAT csv)
    `));

    const source = fs.createReadStream(file);

    let headerSkipped = false;
    let leftover = "";

    source.on("data", (chunk) => {
      let text = leftover + chunk.toString();
      leftover = "";

      if (!headerSkipped) {
        const newline = text.indexOf("\n");

        if (newline === -1) {
          leftover = text;
          return;
        }

        text = text.slice(newline + 1);
        headerSkipped = true;
      }

      copyStream.write(Buffer.from(text));
    });

    source.on("end", () => {
      if (leftover) {
        copyStream.write(Buffer.from(leftover));
      }
      copyStream.end();
    });

    copyStream.on("finish", async () => {
      console.log("COPY completed successfully.");
      const result = await client.query("SELECT COUNT(*) AS count FROM flight_data");
      console.log("Rows in flight_data:", result.rows[0].count);
      await client.end();
    });

    copyStream.on("error", async (err) => {
      console.error("COPY failed:", err.message);
      await client.end();
      process.exit(1);
    });

    source.on("error", async (err) => {
      console.error("File read failed:", err.message);
      copyStream.destroy(err);
      await client.end();
      process.exit(1);
    });

  } catch (err) {
    console.error("Connection failed:", err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
})();

