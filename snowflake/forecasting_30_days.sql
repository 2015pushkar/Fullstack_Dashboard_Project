CREATE OR REPLACE VIEW prescription_forecast_training_view AS
SELECT 
  "DATE" AS date,
  "prescription volume" AS volume
FROM PRESCRIPTION_SALES;

CREATE OR REPLACE SNOWFLAKE.ML.FORECAST prescription_forecast_model(
  INPUT_DATA => TABLE(prescription_forecast_training_view),
  TIMESTAMP_COLNAME => 'date',
  TARGET_COLNAME => 'volume'
);

SELECT * FROM TABLE(prescription_forecast_model!FORECAST(
  FORECASTING_PERIODS => 30
));

CREATE OR REPLACE TABLE prescription_forecast_30days AS
SELECT * FROM TABLE(prescription_forecast_model!FORECAST(
  FORECASTING_PERIODS => 30
));



