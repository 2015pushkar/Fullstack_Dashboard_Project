import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function BarLineMoM({ rows }) {
  const wrapRef = useRef();
  const svgRef  = useRef();

  useEffect(() => {
    if (!rows.length) return;

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);

    function draw() {
      const w = wrapRef.current.clientWidth;
      const h = 450;
      const m = { t: 60, r: 60, b: 80, l: 60 };

      // 1. parse dates
      const parseDay = d3.timeParse('%Y-%m-%d');
      rows.forEach(r => { r._date = parseDay(r.DATE); });

      // 2. aggregate to months
      const monthFormatter = d3.timeFormat('%Y-%m'); // "2024-02"
      const monthParser    = d3.timeParse('%Y-%m');  // now can parse "2024-02" → Date(2024‑02‑01)


      const roll = d3.rollups(
        rows,
        vals => ({
          spend: d3.sum(vals, d => +d.DIGITAL_MARKETING_SPEND),
          vol  : d3.sum(vals, d => +d.PRESCRIPTION_VOLUME)
        }),
        d => monthFormatter(d._date)
      );

      const dataByMonth = roll
        .map(([month, { spend, vol }]) => ({
          month,
          date: monthParser(month),
          spend,
          vol
        }))
        .sort((a, b) => a.date - b.date);

      // 3. compute MoM percentage change
      const data = dataByMonth
        .map((d, i, arr) => {
          if (i === 0) return null;
          const prev = arr[i - 1];
          return {
            month  : d.month,
            date   : d.date,
            spendMoM: 100 * (d.spend - prev.spend) / prev.spend,
            volMoM  : 100 * (d.vol   - prev.vol)   / prev.vol
          };
        })
        .filter(Boolean);

      // 4. scales
      const xBand = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([m.l, w - m.r])
        .padding(0.3);

      const yLeft = d3.scaleLinear()
        .domain(d3.extent(data, d => d.spendMoM)).nice()
        .range([h - m.b, m.t]);

      const yRight = d3.scaleLinear()
        .domain(d3.extent(data, d => d.volMoM)).nice()
        .range([h - m.b, m.t]);

      // 5. draw
      const svg = d3.select(svgRef.current)
        .attr('width', w)
        .attr('height', h)
        .style('font', '11px sans-serif');
      svg.selectAll('*').remove();

      // bars: spend MoM
      svg.append('g')
        .selectAll('rect')
        .data(data)
        .join('rect')
          .attr('x', d => xBand(d.month))
          .attr('width', xBand.bandwidth())
          .attr('y', d => yLeft(Math.max(0, d.spendMoM)))
          .attr('height', d => Math.abs(yLeft(d.spendMoM) - yLeft(0)))
          .attr('fill', d => d.spendMoM >= 0 ? '#10b981' : '#f87171');

      // line: volume MoM
      const line = d3.line()
        .x(d => xBand(d.month) + xBand.bandwidth() / 2)
        .y(d => yRight(d.volMoM));

      svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#2563eb')
        .attr('stroke-width', 2)
        .attr('d', line);

      svg.append('g')
        .selectAll('circle')
        .data(data)
        .join('circle')
          .attr('cx', d => xBand(d.month) + xBand.bandwidth() / 2)
          .attr('cy', d => yRight(d.volMoM))
          .attr('r', 4)
          .attr('fill', '#2563eb');

      // axes
      svg.append('g')
        .attr('transform', `translate(0,${h - m.b})`)
        .call(
          d3.axisBottom(xBand)
            .tickFormat(d => d3.timeFormat('%b %Y')(monthParser(d)))
            .tickSizeOuter(0)
        )
        .selectAll('text')
          .attr('transform', 'rotate(-40)')
          .style('text-anchor', 'end');

      svg.append('g')
        .attr('transform', `translate(${m.l},0)`)
        .call(d3.axisLeft(yLeft).tickFormat(d => d + '%'))
        .call(g => g.select('.domain').remove())
        .append('text')
          .attr('x', -m.l + 6).attr('y', m.t - 30)
          .attr('fill', '#10b981').attr('font-weight', 600)
          .text('Spend % Δ MoM');

      svg.append('g')
        .attr('transform', `translate(${w - m.r},0)`)
        .call(d3.axisRight(yRight).tickFormat(d => d + '%'))
        .call(g => g.select('.domain').remove())
        .append('text')
          .attr('x', m.r - 6).attr('y', m.t - 30)
          .attr('text-anchor', 'end')
          .attr('fill', '#2563eb').attr('font-weight', 600)
          .text('Volume % Δ MoM');

      // title
      svg.append('text')
        .attr('x', w / 2).attr('y', m.t - 40)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 700).style('font-size', '16px')
        .text('Month‑over‑Month % Change: Spend vs Volume');
    }
  }, [rows]);

  return (
    <div ref={wrapRef} style={{ width: '100%' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
