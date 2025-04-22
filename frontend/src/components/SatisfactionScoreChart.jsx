// src/components/SatisfactionScoreChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function SatisfactionScoreChart({
  data,
  width = 800,
  height = 300,
  title = 'Patient Satisfaction Score Trend'
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data || !data.length) return;

    // clear out previous render
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 20, bottom: 40, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // parse and map
    const parsed = data.map(d => ({
      date: new Date(d.DATE),
      score: +d.SATISFACTIONSCORE
    }));

    // x scale (time)
    const x = d3.scaleTime()
      .domain(d3.extent(parsed, d => d.date))
      .range([0, w]);

    // y scale (0–100)
    const y = d3.scaleLinear()
      .domain([0, 100])            // fixed 0–100 for percentage
      .nice()
      .range([h, 0]);

    // root group
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // chart title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('class', 'h6')
      .text(title);

    // line generator
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.score));

    // draw line
    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#28a745')
      .attr('stroke-width', 2)
      .attr('d', line);

    // bottom axis
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%b %d')))
      .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // left axis
    g.append('g')
      .call(d3.axisLeft(y))
      .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -h / 2)
        .attr('fill', '#28a745')
        .attr('dy', '1em')
        .attr('text-anchor', 'middle')
        .attr('class', 'small text-muted')
        .text('Satisfaction Score');

  }, [data, width, height, title]);

  return (
    <div className="card mb-4">
      <div className="card-header">{title}</div>
      <div className="card-body p-0">
        <svg ref={ref} style={{ width: '100%', height }} />
      </div>
    </div>
  );
}
