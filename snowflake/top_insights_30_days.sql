CREATE OR REPLACE VIEW healthcare_insight_view AS
SELECT 
  "DATE",
  "prescription volume" AS metric,
  "marketing spend (usd)",
  "rep visits",
  "patient satisfaction score",
  "DATE" >= DATEADD(month, -1, CURRENT_DATE) AS label
FROM PRESCRIPTION_SALES
WHERE 
  "marketing spend (usd)" IS NOT NULL
  AND "rep visits" IS NOT NULL
  AND "patient satisfaction score" IS NOT NULL;


CREATE OR REPLACE SNOWFLAKE.ML.TOP_INSIGHTS healthcare_insights();

CALL healthcare_insights!GET_DRIVERS(
  INPUT_DATA => TABLE(healthcare_insight_view),
  LABEL_COLNAME => 'label',
  METRIC_COLNAME => 'metric'
);

CREATE OR REPLACE TABLE healthcare_insight_drivers AS
SELECT * FROM TABLE(
  healthcare_insights!GET_DRIVERS(
    INPUT_DATA => TABLE(healthcare_insight_view),
    LABEL_COLNAME => 'label',
    METRIC_COLNAME => 'metric'
  )
);



