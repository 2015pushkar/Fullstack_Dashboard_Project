// src/components/KpiChartWithForecast.js
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function KpiChartWithForecast({
  data,
  forecastData,
  width = 800,
  height = 300,
  title = "Daily Prescription Volume & 30‑Day Forecast",
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data.length || !forecastData.length) return;

    // clear previous render
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 20, bottom: 50, left: 60 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // parse dates
    const hist = data.map((d) => ({
      date: new Date(d.DATE),
      value: +d.PRESCRIPTIONVOLUME,
    }));
    const fcst = forecastData.map((d) => ({
      date: new Date(d.DATE),
      forecast: +d.FORECAST,
      lo: +d.LOWERBOUND,
      hi: +d.UPPERBOUND,
    }));

    // x scale spans both history and forecast
    const x = d3
      .scaleTime()
      .domain(d3.extent([...hist, ...fcst], (d) => d.date))
      .range([0, w]);

    // y scale covers full range
    const y = d3
      .scaleLinear()
      .domain([
        d3.min([...hist, ...fcst], (d) => (d.lo != null ? d.lo : d.value)),
        d3.max([...hist, ...fcst], (d) => (d.hi != null ? d.hi : d.value)),
      ])
      .nice()
      .range([h, 0]);

    // container group
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("font-weight", "600")
      .text(title);

    // 1) Forecast ribbon (area between lo & hi)
    const area = d3
      .area()
      .x((d) => x(d.date))
      .y0((d) => y(d.lo))
      .y1((d) => y(d.hi));

    g.append("path")
      .datum(fcst)
      .attr("fill", "#cce5ff")
      .attr("opacity", 0.6)
      .attr("d", area);

    // 2) Forecast line
    const lineFc = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.forecast));

    g.append("path")
      .datum(fcst)
      .attr("fill", "none")
      .attr("stroke", "#0056b3")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 2")
      .attr("d", lineFc);

    // 3) Historical line
    const lineHist = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    g.append("path")
      .datum(hist)
      .attr("fill", "none")
      .attr("stroke", "#007bff")
      .attr("stroke-width", 2)
      .attr("d", lineHist);

    // axes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8).tickFormat(d3.timeFormat("%b %d")));

    xAxis
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    xAxis
      .append("text")
      .attr("x", w / 2)
      .attr("y", margin.bottom - 10)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Date");

    const yAxis = g.append("g").call(d3.axisLeft(y));

    yAxis
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -margin.left + 15)
      .attr("fill", "#000")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Prescription Volume");

    // legend
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - margin.right - 150},${margin.top})`
      );

    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 140)
      .attr("height", 80)
      .attr("fill", "white")
      .attr("stroke", "#ccc");

    const legendItems = [
      { color: "#007bff", text: "Historical" },
      { color: "#0056b3", text: "Forecast" },
      { color: "#cce5ff", text: "Uncertainty" },
    ];

    legendItems.forEach((d, i) => {
      legend
        .append("line")
        .attr("x1", 10)
        .attr("y1", 20 + i * 20)
        .attr("x2", 30)
        .attr("y2", 20 + i * 20)
        .attr("stroke", d.color)
        .attr("stroke-width", d.text === "Uncertainty" ? 10 : 2)
        .attr("opacity", d.text === "Uncertainty" ? 0.6 : 1)
        .attr("stroke-dasharray", d.text === "Forecast" ? "4 2" : "0");

      legend
        .append("text")
        .attr("x", 40)
        .attr("y", 24 + i * 20)
        .attr("font-size", "12px")
        .text(d.text);
    });
  }, [data, forecastData, width, height, title]);

  return (
    <div className="card mb-4">
      {/* <div className="card-header">{title}</div> */}
      <div className="card-body p-1">
        <svg
          ref={ref}
          style={{ width: "100%", height: `${height}px`, display: "block" }}
        />
      </div>
    </div>
  );
}
