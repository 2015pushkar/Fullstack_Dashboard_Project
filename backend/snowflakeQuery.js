/**
 * Simple Snowflake query demo (CommonJS).
 * node snowflakeQuery.js
 */
require('dotenv').config();             // loads .env
const snowflake = require('snowflake-sdk');

const {
  SNOWFLAKE_ACCOUNT:   account,
  SNOWFLAKE_USER:      username,
  SNOWFLAKE_PASSWORD:  password,
  SNOWFLAKE_DATABASE:  database,
  SNOWFLAKE_SCHEMA:    schema,
  SNOWFLAKE_WAREHOUSE: warehouse
} = process.env;

// 1️⃣ Connect --------------------------------------------------------------
const connection = snowflake.createConnection({
  account, username, password, database, schema, warehouse
});

connection.connect((err, conn) => {
  if (err) {
    console.error('❌  Snowflake connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅  Connected, connection ID:', conn.getId());

  // 2️⃣ Query -------------------------------------------------------------
  connection.execute({
    sqlText: 'SELECT * FROM healthcare_kpis;',
    complete(err, stmt, rows) {
      if (err) {
        console.error('❌  Query error:', err.message);
      } else {
        console.log(`✔️  ${rows.length} rows returned`);
        console.table(rows.slice(0, 5));     // show first 5 like df.head()
      }

      // 3️⃣ Clean‑up -------------------------------------------------------
      connection.destroy(() => process.exit());
    }
  });
});
