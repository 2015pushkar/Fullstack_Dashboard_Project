// src/components/ForecastChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function ForecastChart({ data, width = 800, height = 300 }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // clear out old contents
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // parse dates once
    const parsed = data.map(d => ({
      date: new Date(d.DATE),
      forecast: +d.FORECAST,
      lo: +d.LOWERBOUND,
      hi: +d.UPPERBOUND
    }));

    // x & y scales
    const x = d3.scaleTime()
      .domain(d3.extent(parsed, d => d.date))
      .range([0, w]);

    const y = d3.scaleLinear()
      .domain([
        d3.min(parsed, d => d.lo),
        d3.max(parsed, d => d.hi)
      ])
      .nice()
      .range([h, 0]);

    // container group
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .classed('w-100', true)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ribbon (area between lo & hi)
    const area = d3.area()
      .x(d => x(d.date))
      .y0(d => y(d.lo))
      .y1(d => y(d.hi));

    g.append('path')
      .datum(parsed)
      .attr('fill', '#cce5ff')
      .attr('d', area);

    // forecast line
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.forecast));

    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#0056b3')
      .attr('stroke-width', 2)
      .attr('d', line);

    // axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d")))
      .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    g.append('g')
      .call(d3.axisLeft(y));

    // axis labels
    svg.append('text')
      .attr('x', margin.left + w/2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .classed('small text-muted', true)
      .text('Date');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', - (margin.top + h/2))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .classed('small text-muted', true)
      .text('Prescription Volume');

  }, [data, width, height]);

  return (
    <div className="card mb-4">
      <div className="card-header">
        30‑Day Volume Forecast
      </div>
      <div className="card-body p-0">
        <svg ref={ref} style={{ display: 'block', width: '100%', height }} />
      </div>
    </div>
  );
}
