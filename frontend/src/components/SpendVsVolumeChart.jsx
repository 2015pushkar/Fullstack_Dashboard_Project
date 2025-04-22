// src/components/SpendVsVolumeChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function SpendVsVolumeChart({
  data,
  width = 800,
  height = 300,
  title = 'Marketing Spend vs Prescription Volume'
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear old
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    // Margins
    const margin = { top: 30, right: 60, bottom: 50, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Parse
    const parsed = data.map(d => ({
      date: new Date(d.DATE),
      volume: +d.PRESCRIPTIONVOLUME,
      spend: +d.MARKETINGSPENDUSD
    }));

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(parsed, d => d.date))
      .range([0, w]);

    const yLeft = d3.scaleLinear()
      .domain([0, d3.max(parsed, d => d.volume) * 1.1])
      .nice()
      .range([h, 0]);

    const yRight = d3.scaleLinear()
      .domain([0, d3.max(parsed, d => d.spend) * 1.1])
      .nice()
      .range([h, 0]);

    // Container
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Title
    svg.append('text')
      .attr('x', width/2)
      .attr('y', margin.top/2)
      .attr('text-anchor', 'middle')
      .attr('class', 'h6')
      .text(title);

    // Volume line (left axis)
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#007bff')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.date))
        .y(d => yLeft(d.volume))
      );

    // Spend line (right axis)
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#28a745')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 2')
      .attr('d', d3.line()
        .x(d => x(d.date))
        .y(d => yRight(d.spend))
      );

    // Axes
    // X axis
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
        .attr('transform','rotate(-45)')
        .style('text-anchor','end');

    // Left Y axis (volume)
    g.append('g')
      .call(d3.axisLeft(yLeft))
      .append('text')
        .attr('transform','rotate(-90)')
        .attr('y', -40)
        .attr('x', -h/2)
        .attr('fill','#007bff')
        .attr('dy','1em')
        .attr('text-anchor','middle')
        .attr('class','small text-muted')
        .text('Prescription Volume');

    // Right Y axis (spend)
    g.append('g')
      .attr('transform', `translate(${w},0)`)
      .call(d3.axisRight(yRight))
      .append('text')
        .attr('transform','rotate(-90)')
        .attr('y', 40)
        .attr('x', -h/2)
        .attr('fill','#28a745')
        .attr('dy','1em')
        .attr('text-anchor','middle')
        .attr('class','small text-muted')
        .text('Marketing Spend (USD)');

  }, [data, width, height, title]);

  return (
    <div className="card mb-4">
      <div className="card-header">{title}</div>
      <div className="card-body p-0">
        <svg ref={ref} style={{ display:'block', width:'100%', height }} />
      </div>
    </div>
  );
}
