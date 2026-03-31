// static calendar
function drawCalendar(data) {
    const cellSize = 15;
    const yearHeight = cellSize * 7 + 30;
    const years = [2020, 2021, 2022];

    // data processed here, taking the average of the temperatures
    const avgTemp = d3.rollup(data, v => d3.mean(v, d => (d.TempMax + d.TempMin) / 2), d => d3.timeFormat("%Y-%m-%d")(d.Date));

    const color = d3.scaleSequential()  
        .domain([20, 95])
        .interpolator(t => d3.interpolateRdYlBu(1 - t))
        .clamp(true);

    const svg = d3.select("#calendar-svg")
        .append("svg")
        .attr("width", 53 * cellSize + 50)
        .attr("height", years.length * (yearHeight + 20) + 60)

    const yearGroups = svg.selectAll("g.year")
        .data(years)
        .join("g")
        .attr("class", "year")
        .attr("transform", (d, i) => `translate(40, ${i * (yearHeight + 20) + 20})`);

    yearGroups.append("text")
        .attr("x", -5)
        .attr("y", cellSize * 3.5)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("dominant-baseline", "middle")
        .text(d => d);

    yearGroups.each(function(year) {
        const g = d3.select(this);
        const days = d3.timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1));

        g.selectAll("rect")
            .data(days)
            .join("rect")
            .attr("width", cellSize - 1)
            .attr("height", cellSize - 1)
            .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * cellSize)
            .attr("y", d => d.getDay() * cellSize)
            .attr("fill", d => {
                const key = d3.timeFormat("%Y-%m-%d")(d);
                const val = avgTemp.get(key);
                return val !== undefined ? color(val) : "#eee";
            })
            .attr("rx", 2);
    });

    const firstGroup = svg.select("g.year");
    const months = d3.timeMonths(new Date(2020, 0, 1), new Date(2021, 0, 1));
    firstGroup.selectAll("text.month")
        .data(months)
        .join("text")
        .attr("class", "month")
        .attr("x", d => d3.timeWeek.count(d3.timeYear(d), d) * cellSize)
        .attr("y", -5)
        .attr("font-size", "10px")
        .text(d => d3.timeFormat("%b")(d));

    const legend_width = 200;
    const legend_heatmap = svg.append("g")
        .attr("transform", `translate(40, ${years.length * (yearHeight + 20) + 10})`);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient").attr("id", "temp-gradient");
    gradient.selectAll("stop")
        .data(d3.range(0, 1.01, 0.1))
        .join("stop")
        .attr("offset", d => `${d * 100}%`)
        .attr("stop-color", d => color(20 + d * 75));

    legend_heatmap.append("rect")
        .attr("width", legend_width)
        .attr("height", 10)
        .style("fill", "url(#temp-gradient)");

    legend_heatmap.append("text")
        .attr("x", 0)
        .attr("y", 22)
        .attr("font-size", "10px")
        .text("20°F");

    legend_heatmap.append("text")
        .attr("x", legendWidth)
        .attr("y", 22)
        .attr("font-size", "10px")
        .attr("text-anchor", "end")
        .text("95°F");
}

// idea: calendar from 2020 -> 2022 displaying average temperature for each day. --> Heatmap!!
// blue to red depending on tempurature.
// https://observablehq.com/@d3/calendar/2 as a reference, but it was also confusing to read