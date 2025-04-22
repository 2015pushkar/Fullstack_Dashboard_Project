// src/components/RepVisitsVsVolumeChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function RepVisitsVsVolumeChart({
  data,
  width = 800,
  height = 300,
  title = 'Rep Visits vs Prescription Volume'
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // clear previous
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 60, bottom: 50, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // parse your incoming rows
    const parsed = data.map(d => ({
      date: new Date(d.DATE),
      volume: +d.PRESCRIPTIONVOLUME,
      reps: +d.REPVISITS
    }));

    // x axis is date
    const x = d3.scaleTime()
      .domain(d3.extent(parsed, d => d.date))
      .range([0, w]);

    // volume on left y
    const yLeft = d3.scaleLinear()
      .domain([0, d3.max(parsed, d => d.volume) * 1.1])
      .nice()
      .range([h, 0]);

    // reps on right y
    const yRight = d3.scaleLinear()
      .domain([0, d3.max(parsed, d => d.reps) * 1.1])
      .nice()
      .range([h, 0]);

    // container
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // title
    svg.append('text')
      .attr('x', width/2)
      .attr('y', margin.top/2)
      .attr('text-anchor', 'middle')
      .attr('class', 'h6')
      .text(title);

    // line for volume
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#007bff')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.date))
        .y(d => yLeft(d.volume))
      );

    // line for rep visits
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#dc3545')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 2')
      .attr('d', d3.line()
        .x(d => x(d.date))
        .y(d => yRight(d.reps))
      );

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

    // Right Y axis (rep visits)
    g.append('g')
      .attr('transform', `translate(${w},0)`)
      .call(d3.axisRight(yRight))
      .append('text')
        .attr('transform','rotate(-90)')
        .attr('y', 40)
        .attr('x', -h/2)
        .attr('fill','#dc3545')
        .attr('dy','1em')
        .attr('text-anchor','middle')
        .attr('class','small text-muted')
        .text('Rep Visits');

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
