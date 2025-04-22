// backend/app.js
// ------------------------------------------------------------
//  Express API  –  Drug X dashboard (latest schema)
//  • /api/kpis      -> all daily KPI rows
//  • /api/forecast  -> 30‑day point‑forecast rows
//  • /api/anomalies -> recent anomaly rows
//  • /api/drivers   -> top‐driver segments
//  • /api/narratives-> generated smart narratives (single row)
// ------------------------------------------------------------

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const snowflake = require('snowflake-sdk');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// helper: fresh Snowflake connection
function getConnection() {
  return snowflake.createConnection({
    account   : process.env.SNOWFLAKE_ACCOUNT,
    username  : process.env.SNOWFLAKE_USER,
    password  : process.env.SNOWFLAKE_PASSWORD,
    warehouse : process.env.SNOWFLAKE_WAREHOUSE,
    database  : process.env.SNOWFLAKE_DATABASE,
    schema    : process.env.SNOWFLAKE_SCHEMA
  });
}

// helper: run any SELECT or CALL
function runQuery(sqlText) {
  return new Promise((resolve, reject) => {
    const conn = getConnection();
    conn.connect(err => {
      if (err) return reject(err);
      conn.execute({
        sqlText,
        complete: (err, _stmt, rows) => {
          conn.destroy();  // auto‑suspend warehouse
          if (err) return reject(err);
          resolve(rows);
        }
      });
    });
  });
}

// 1) daily KPIs
app.get('/api/kpis', async (_req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        DATE,
        "prescription volume"        AS prescriptionVolume,
        "marketing spend (usd)"      AS marketingSpendUsd,
        "rep visits"                 AS repVisits,
        "patient satisfaction score" AS satisfactionScore
      FROM PRESCRIPTION_SALES
      ORDER BY DATE
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2) 30‑day forecast
app.get('/api/forecast', async (_req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        TS           AS date,
        FORECAST     AS forecast,
        LOWER_BOUND  AS lowerBound,
        UPPER_BOUND  AS upperBound
      FROM PRESCRIPTION_FORECAST_30DAYS
      ORDER BY TS
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3) recent anomalies (last 30 days)
app.get('/api/anomalies', async (_req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        TS           AS date,
        Y            AS actual,
        FORECAST     AS forecast,
        LOWER_BOUND  AS lowerBound,
        UPPER_BOUND  AS upperBound,
        IS_ANOMALY   AS isAnomaly,
        PERCENTILE,
        DISTANCE
      FROM DETECTED_ANOMALIES
      WHERE TS >= DATEADD(month, -1, CURRENT_DATE())
      ORDER BY TS
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4) top‐driver segments
app.get('/api/drivers', async (_req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        CONTRIBUTOR,
        METRIC_CONTROL        AS metricControl,
        METRIC_TEST           AS metricTest,
        CONTRIBUTION,
        RELATIVE_CONTRIBUTION AS relativeContribution,
        GROWTH_RATE           AS growthRate
      FROM HEALTHCARE_INSIGHT_DRIVERS
      ORDER BY RELATIVE_CONTRIBUTION DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5) smart narratives (single row from DASHBOARD_NARRATIVES)
app.get('/api/narratives', async (_req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        KPI_SUMMARY        AS kpiNarrative,
        FORECAST_OVERVIEW  AS forecastNarrative,
        ANOMALY_SUMMARY    AS anomalyNarrative,
        TOP_DRIVERS_INSIGHT AS insightNarrative
      FROM PUBLIC.DASHBOARD_NARRATIVES
      LIMIT 1
    `);
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// start server
app.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
});
