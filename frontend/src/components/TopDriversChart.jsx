// src/components/TopDriversChart.js
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function TopDriversChart({
  data,              // your array of driver objects
  width = 800,
  height = 300,
  title = 'Key Drivers of Prescription Change'
}) {
  const ref = useRef();

  useEffect(() => {
    if (!data || !data.length) return;

    // clear previous
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    // margins
    const margin = { top: 40, right: 20, bottom: 30, left: 200 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // prepare & sort top 5
    const prepared = data
      .map(d => ({
        label: (() => {
          try { return JSON.parse(d.CONTRIBUTOR).join(', '); }
          catch { return d.CONTRIBUTOR; }
        })(),
        value: +d.RELATIVECONTRIBUTION
      }))
      .sort((a, b) => d3.descending(a.value, b.value))
      .slice(0, 5);

    // scales
    const y = d3.scaleBand()
      .domain(prepared.map(d => d.label))
      .range([0, h])
      .padding(0.1);

    const x = d3.scaleLinear()
      .domain([0, d3.max(prepared, d => d.value)])
      .nice()
      .range([0, w]);

    // root group
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

    // bars
    g.selectAll('.bar')
      .data(prepared)
      .enter()
      .append('rect')
        .attr('class', 'bar bg-primary')
        .attr('y', d => y(d.label))
        .attr('height', y.bandwidth())
        .attr('x', 0)
        .attr('width', d => x(d.value));

    // x‑axis (as percent)
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('.0%')));

    // y‑axis (labels)
    g.append('g')
      .call(d3.axisLeft(y));

    // value labels
    g.selectAll('.label')
      .data(prepared)
      .enter()
      .append('text')
        .attr('class', 'small text-white')
        .attr('x', d => x(d.value) - 5)
        .attr('y', d => y(d.label) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .text(d => d3.format('.0%')(d.value));

  }, [data, width, height, title]);

  return (
    <div className="card mb-4">
      <div className="card-body p-0">
        <svg ref={ref} style={{ width: "100%", height: `${height}px`, display: "block" }} />
      </div>
    </div>
  );
}
