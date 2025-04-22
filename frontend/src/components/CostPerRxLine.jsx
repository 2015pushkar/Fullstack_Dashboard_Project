import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function CostPerRxLine({ rows }) {
  const ref = useRef();

  useEffect(() => {
    if (!rows.length) return;

    /* 1️⃣  Aggregate daily rows → quarters */
    const parse = d3.timeParse('%Y-%m-%d');
    const qKey  = d => `${d.getFullYear()}‑Q${Math.floor(d.getMonth()/3)+1}`;

    const quarters = d3.rollups(
      rows,
      v => ({
        spend: d3.sum(v, r => +r.DIGITAL_MARKETING_SPEND),
        vol:   d3.sum(v, r => +r.PRESCRIPTION_VOLUME)
      }),
      r => qKey(parse(r.DATE))
    ).sort(d3.ascending)                     // chronological order
     .map(([q, { spend, vol }]) => ({
        q,
        cpx: spend / vol                    // Cost‑per‑Rx for that quarter
     }));

    /* 2️⃣  Scales & SVG */
    const w = 700, h = 380, m = 60;
    const x = d3.scalePoint()
      .domain(quarters.map(d => d.q))
      .range([m, w - m]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(quarters, d => d.cpx)]).nice()
      .range([h - m, m]);

    const svg = d3.select(ref.current)
      .attr('width', w)
      .attr('height', h)
      .style('font', '11px sans-serif');
    svg.selectAll('*').remove();

    /* 3️⃣  Line & dots */
    const line = d3.line()
      .x(d => x(d.q))
      .y(d => y(d.cpx));

    svg.append('path')
      .datum(quarters)
      .attr('fill', 'none')
      .attr('stroke', '#0ea5e9')          // sky‑500
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.append('g')
      .selectAll('circle')
      .data(quarters)
      .join('circle')
        .attr('cx', d => x(d.q))
        .attr('cy', d => y(d.cpx))
        .attr('r', 4)
        .attr('fill', '#0ea5e9')
      .append('title')
        .text(d => `${d.q}\nCost‑per‑Rx: $${d.cpx.toFixed(2)}`);

    /* 4️⃣  Axes */
    svg.append('g')
      .attr('transform', `translate(0,${h - m})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .attr('transform', `translate(${m},0)`)
      .call(d3.axisLeft(y).tickFormat(d3.format('$,.2f')))
      .call(g => g.select('.domain').remove());

    /* 5️⃣  Labels & title */
    svg.append('text')
      .attr('x', w / 2).attr('y', m - 30)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 700)
      .style('font-size', '15px')
      .text('Cost‑per‑Prescription (Quarterly)');

    svg.append('text')
      .attr('x', w / 2).attr('y', h - 15)
      .attr('text-anchor', 'middle')
      .text('Quarter');

    svg.append('text')
      .attr('x', -h / 2).attr('y', 20)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .text('Dollars per Rx');
  }, [rows]);

  return <svg ref={ref}></svg>;
}
