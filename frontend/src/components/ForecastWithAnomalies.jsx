// src/components/ForecastWithAnomalies.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function ForecastWithAnomalies({
  data,
  width = 800,
  height = 300,
  title = 'Actual vs Forecast with Anomalies'
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data || !data.length) return;

    // clear previous
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 20, bottom: 50, left: 60 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // parse and split
    const parsed = data.map(d => ({
      date: new Date(d.DATE),
      actual: +d.ACTUAL,
      forecast: +d.FORECAST,
      lo: +d.LOWERBOUND,
      hi: +d.UPPERBOUND,
      isAnomaly: !!d.ISANOMALY
    }));
    const anomalies = parsed.filter(d => d.isAnomaly);

    // x & y scales
    const x = d3.scaleTime()
      .domain(d3.extent(parsed, d => d.date))
      .range([0, w]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(parsed, d => Math.min(d.lo, d.actual)),
        d3.max(parsed, d => Math.max(d.hi, d.actual))
      ])
      .nice()
      .range([h, 0]);

    // container
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('class', 'h6')
      .text(title);

    // ribbon area
    const area = d3.area()
      .x(d => x(d.date))
      .y0(d => y(d.lo))
      .y1(d => y(d.hi));

    g.append('path')
      .datum(parsed)
      .attr('fill', '#cce5ff')
      .attr('d', area);

    // actual line
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#007bff')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.date))
        .y(d => y(d.actual))
      );

    // forecast line (optional dash)
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#0056b3')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 2')
      .attr('d', d3.line()
        .x(d => x(d.date))
        .y(d => y(d.forecast))
      );

    // anomalies
    g.selectAll('circle')
      .data(anomalies)
      .enter()
      .append('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.actual))
        .attr('r', 4)
        .attr('fill', 'red')
        .attr('stroke', 'white')
        .attr('stroke-width', 1);

    // axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    g.append('g').call(d3.axisLeft(y));

    // axis labels
    svg.append('text')
      .attr('x', margin.left + w / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .attr('class', 'small text-muted')
      .text('Date');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + h / 2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('class', 'small text-muted')
      .text('Prescription Volume');

  }, [data, width, height, title]);

  return (
    <div className="card mb-4">
      {/* <div className="card-header">{title}</div> */}
      <div className="card-body p-1">
        <svg ref={ref} style={{ width: "100%", height: `${height}px`, display: "block" }} />
      </div>
    </div>
  );
}
