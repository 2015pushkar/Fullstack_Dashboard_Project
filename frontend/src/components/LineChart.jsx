import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/** Line chart of PRESCRIPTION_VOLUME over DATE */
export default function LineChart({ rows }) {
  const ref = useRef();

  useEffect(() => {
    const parse = d3.timeParse('%Y-%m-%d');
    const data  = rows.map(d => ({
      date: parse(d.DATE),
      vol : +d.PRESCRIPTION_VOLUME
    }));

    const w=600, h=300, m=40;
    const svg = d3.select(ref.current)
      .attr('width',w).attr('height',h)
      .style('font','10px sans-serif');
    svg.selectAll('*').remove();

    const x = d3.scaleTime()
      .domain(d3.extent(data,d=>d.date))
      .range([m, w-m]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data,d=>d.vol)]).nice()
      .range([h-m, m]);

    svg.append('path')
      .datum(data)
      .attr('fill','none')
      .attr('stroke','#2563eb')
      .attr('stroke-width',2)
      .attr('d',d3.line()
                  .x(d=>x(d.date))
                  .y(d=>y(d.vol)));

    svg.append('g')
      .attr('transform',`translate(0,${h-m})`)
      .call(d3.axisBottom(x).ticks(6));

    svg.append('g')
      .attr('transform',`translate(${m},0)`)
      .call(d3.axisLeft(y));

    svg.append('text')
      .attr('x',w/2).attr('y',m-10)
      .attr('text-anchor','middle')
      .attr('font-weight',600)
      .text('Prescription Volume');
  },[rows]);

  return <svg ref={ref}></svg>;
}
