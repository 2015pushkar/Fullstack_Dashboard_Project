HEALTHCARE_DATA.PUBLICHEALTHCARE_DATA.PUBLIC.DETECTED_ANOMALIES// Create a training view
CREATE OR REPLACE VIEW training_view_anomaly AS
SELECT "DATE", "prescription volume"
FROM PRESCRIPTION_SALES
WHERE "DATE" < DATEADD(month, -1, CURRENT_DATE);


// Train the anomaly detection model
CREATE OR REPLACE SNOWFLAKE.ML.ANOMALY_DETECTION prescription_anomaly_model(
  INPUT_DATA => TABLE(training_view_anomaly),
  TIMESTAMP_COLNAME => '"DATE"',
  TARGET_COLNAME => '"prescription volume"',
  LABEL_COLNAME => ''
);

//Create test view (recent data)
CREATE OR REPLACE VIEW test_view_anomaly AS
SELECT "DATE", "prescription volume"
FROM "PRESCRIPTION_SALES"
WHERE "DATE" >= DATEADD(month, -1, CURRENT_DATE);


// test model
CALL PRESCRIPTION_ANOMALY_MODEL!DETECT_ANOMALIES(
  INPUT_DATA => TABLE(test_view_anomaly),
  TIMESTAMP_COLNAME => '"DATE"',
  TARGET_COLNAME => '"prescription volume"'
);

// store model output in db
CREATE OR REPLACE TABLE detected_anomalies AS
SELECT *
FROM TABLE(
  PRESCRIPTION_ANOMALY_MODEL!DETECT_ANOMALIES(
    INPUT_DATA => TABLE(test_view_anomaly),
    TIMESTAMP_COLNAME => '"DATE"',
    TARGET_COLNAME => '"prescription volume"'
  )
);







