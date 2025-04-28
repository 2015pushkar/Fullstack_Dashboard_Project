import snowflake.snowpark as snowpark
from snowflake.snowpark.functions import (
    col, dateadd, current_date,
    max as max_, min as min_, avg as avg_, lit
)

def main(session: snowpark.Session) -> dict:
    # —————————————————————————————————————————————————————————
    # 0) ensure the narratives table exists
    session.sql("""
      CREATE TABLE IF NOT EXISTS PUBLIC.PRESCRIPTION_NARRATIVES (
        RUN_DATE             DATE,
        KPI_NARRATIVE        STRING,
        FORECAST_NARRATIVE   STRING,
        ANOMALY_NARRATIVE    STRING,
        INSIGHT_NARRATIVE    STRING
      )
    """).collect()

    # —————————————————————————————————————————————————————————
    # 1) KPI Summary (last 30 days)
    kpi = (
        session.table("PUBLIC.PRESCRIPTION_SALES")
          .filter(col("DATE") >= dateadd("day", lit(-30), current_date()))
          .agg(
            max_(col('"prescription volume"')).alias("max_presc"),
            min_(col('"prescription volume"')).alias("min_presc"),
            avg_(col('"prescription volume"')).alias("avg_presc"),
            avg_(col('"marketing spend (usd)"')).alias("avg_spend"),
            avg_(col('"patient satisfaction score"')).alias("avg_sat")
          )
          .collect()[0]
    )
    prompt_kpi = (
        "No Placeholders: Write exactly one or two sentences describing the KPI summary, "
        "using no placeholders or suggestions, suitable for a non‑specialist audience. "
        f"Over the past 30 days, prescription volume ranged from {int(kpi['MAX_PRESC'])} down to "
        f"{int(kpi['MIN_PRESC'])}, averaging {kpi['AVG_PRESC']:.1f} per day, with daily marketing "
        f"spend around ${kpi['AVG_SPEND']:.0f} and an average satisfaction score of {kpi['AVG_SAT']:.1f}."
    )
    narrative_kpi = session.sql(
        "SELECT SNOWFLAKE.CORTEX.COMPLETE('llama3.1-8b', :1) AS text",
        [prompt_kpi]
    ).collect()[0]["TEXT"]

    # —————————————————————————————————————————————————————————
    # 2) Forecast Overview (next 30 days)
    fcst = (
        session.table("PUBLIC.PRESCRIPTION_FORECAST_30DAYS")
          .agg(
            avg_("FORECAST").alias("avg_fc"),
            min_("FORECAST").alias("min_fc"),
            max_("FORECAST").alias("max_fc"),
            avg_((col("UPPER_BOUND") - col("LOWER_BOUND"))).alias("avg_interval")
          )
          .collect()[0]
    )
    prompt_fc = (
        "No Placeholders: Write exactly three or four sentences describing the forecast overview, "
        "using no placeholders or suggestions, suitable for a non‑specialist audience. "
        f"Our 30‑day forecast projects daily prescriptions between {fcst['MIN_FC']:.0f} and "
        f"{fcst['MAX_FC']:.0f}, averaging {fcst['AVG_FC']:.1f}, with prediction intervals "
        f"about ±{fcst['AVG_INTERVAL'] / 2:.1f}."
    )
    narrative_fc = session.sql(
        "SELECT SNOWFLAKE.CORTEX.COMPLETE('llama3.1-8b', :1) AS text",
        [prompt_fc]
    ).collect()[0]["TEXT"]

    # —————————————————————————————————————————————————————————
    # 3) Anomaly Summary (recent month)
    anomalies = (
        session.table("PUBLIC.DETECTED_ANOMALIES")
          .filter(col("IS_ANOMALY") == True)
          .filter(col("TS") >= dateadd("month", lit(-1), current_date()))
          .select("TS", "Y", "FORECAST", "DISTANCE")
          .collect()
    )
    count_anom = len(anomalies)
    worst = max(anomalies, key=lambda r: abs(r["DISTANCE"])) if anomalies else None

    if worst:
        prompt_anom = (
            "No Placeholders: Write exactly three or four sentences describing the anomaly summary, "
            "using no placeholders or suggestions, suitable for a non‑specialist audience. "
            f"In the last month, {count_anom} days deviated from forecast; the largest outlier on "
            f"{worst['TS'].date()} saw actual {int(worst['Y'])} vs forecast {int(worst['FORECAST'])}."
        )
    else:
        prompt_anom = (
            "No Placeholders: Write exactly one or two sentences describing the anomaly summary, "
            "using no placeholders or suggestions, suitable for a non‑specialist audience. "
            "No anomalies were detected in the last month."
        )

    narrative_anom = session.sql(
        "SELECT SNOWFLAKE.CORTEX.COMPLETE('llama3.1-8b', :1) AS text",
        [prompt_anom]
    ).collect()[0]["TEXT"]

    # —————————————————————————————————————————————————————————
    # 4) Top‑Drivers Insight (latest analysis)
    top3 = (
        session.table("PUBLIC.HEALTHCARE_INSIGHT_DRIVERS")
          .order_by(col("RELATIVE_CONTRIBUTION").desc())
          .limit(3)
          .select("CONTRIBUTOR", "RELATIVE_CONTRIBUTION")
          .collect()
    )
    drv_texts = [
        f"{row['CONTRIBUTOR']} (+{row['RELATIVE_CONTRIBUTION']*100:.1f}%)"
        for row in top3
    ]
    prompt_insight = (
        "No Placeholders: Write exactly three or four sentences describing the top‑drivers insight, "
        "using no placeholders or suggestions, suitable for a non‑specialist audience. "
        f"The leading influences are: {drv_texts[0]}, {drv_texts[1]}, and {drv_texts[2]}, "
        "explaining shifts in overall prescription trends."
    )
    narrative_insight = session.sql(
        "SELECT SNOWFLAKE.CORTEX.COMPLETE('llama3.1-8b', :1) AS text",
        [prompt_insight]
    ).collect()[0]["TEXT"]

    # —————————————————————————————————————————————————————————
    # 5) persist into our narratives table
    session.sql(
      """
      INSERT INTO PUBLIC.PRESCRIPTION_NARRATIVES
        (RUN_DATE, KPI_NARRATIVE, FORECAST_NARRATIVE, ANOMALY_NARRATIVE, INSIGHT_NARRATIVE)
      VALUES
        (CURRENT_DATE(),
         :1, :2, :3, :4)
      """,
      [narrative_kpi, narrative_fc, narrative_anom, narrative_insight]
    ).collect()

    # 6) return for immediate use if you want
    return {
        "kpi_narrative":      narrative_kpi,
        "forecast_narrative": narrative_fc,
        "anomaly_narrative":  narrative_anom,
        "insight_narrative":  narrative_insight
    }
