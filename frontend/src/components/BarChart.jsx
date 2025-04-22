import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function BarChart({ rows }) {
  const ref = useRef();

  useEffect(() => {
    const parse = d3.timeParse('%Y-%m-%d');
    const quarterKey = d =>
      `${d.getFullYear()}‑Q${Math.floor(d.getMonth()/3)+1}`;

    /* 1️⃣  Parse & roll up */
    const rolled = d3.rollups(
      rows,
      v => d3.sum(v, r => +r.DIGITAL_MARKETING_SPEND),
      r => quarterKey(parse(r.DATE))
    )
    .sort((a,b) => d3.ascending(a[0], b[0]));       // chrono order

    /* rolled = [ ['2022-Q1', 28_000], … ] */

    /* 2️⃣  Scales */
    const w=600, h=300, m=40;
    const x = d3.scaleBand()
      .domain(rolled.map(d => d[0]))
      .range([m, w-m])
      .padding(0.25);

    const y = d3.scaleLinear()
      .domain([0, d3.max(rolled, d => d[1])]).nice()
      .range([h-m, m]);

    /* 3️⃣  Draw */
    const svg = d3.select(ref.current)
      .attr('width', w).attr('height', h)
      .style('font','10px sans-serif');
    svg.selectAll('*').remove();

    svg.append('g')
      .selectAll('rect')
      .data(rolled)
      .join('rect')
        .attr('x', d => x(d[0]))
        .attr('y', d => y(d[1]))
        .attr('width', x.bandwidth())
        .attr('height', d => y(0)-y(d[1]))
        .attr('fill', '#0ea5e9');          // sky‑500

    svg.append('g')
      .attr('transform', `translate(0,${h-m})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('transform', 'rotate(-40)')
        .style('text-anchor', 'end');

    svg.append('g')
      .attr('transform', `translate(${m},0)`)
      .call(d3.axisLeft(y).tickFormat(d3.format('$~s')));

    svg.append('text')
      .attr('x', w/2).attr('y', m-10)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 600)
      .text('Digital Marketing Spend per Quarter');
  }, [rows]);

  return <svg ref={ref}></svg>;
}
