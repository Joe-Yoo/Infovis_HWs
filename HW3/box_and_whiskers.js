var boxData = {};

function processBoxData(data) {
    const byYear = d3.group(data, d => d.Date.getFullYear());
    byYear.forEach((yearData, year) => {
        boxData[year] = {};
        const byMonth = d3.group(yearData, d => d.Date.getMonth());
        byMonth.forEach((monthData, month) => {
            const highs = monthData.map(d => d.TempMax).sort(d3.ascending);
            const lows  = monthData.map(d => d.TempMin).sort(d3.ascending);

            function stats(arr) {
                const q1  = d3.quantile(arr, 0.25);
                const med = d3.quantile(arr, 0.5);
                const q3  = d3.quantile(arr, 0.75);
                const iqr = q3 - q1;
                const min = d3.max([d3.min(arr), q1 - 1.5 * iqr]);
                const max = d3.min([d3.max(arr), q3 + 1.5 * iqr]);
                return { q1, med, q3, min, max };
            }

            boxData[year][month] = {
                month,
                high: stats(highs),
                low:  stats(lows)
            };
        });
    });
}

function updateBoxPlot(year) {
    d3.select("#box-svg").selectAll("*").remove();

    const box_svg = d3.select("#box-svg")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const yearData = Object.values(boxData[year]);

    const x = d3.scaleBand()
        .domain(months)
        .range([0, width])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, 105])
        .range([height, 0]);

    box_svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    box_svg.append("g")
        .call(d3.axisLeft(y));

    box_svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom + height)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Month");

    box_svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Temperature (°F)");

    const boxWidth = x.bandwidth() / 2 - 2;

    const series = [
        { key: "high", color: "red",       offset: -x.bandwidth() / 4 },
        { key: "low",  color: "steelblue", offset:  x.bandwidth() / 4 }
    ];

    yearData.forEach(d => {
        const xBase = x(months[d.month]);
        series.forEach(({ key, color, offset }) => {
            const s = d[key];
            const cx = xBase + x.bandwidth() / 2 + offset;

            box_svg.append("line")
                .attr("x1", cx).attr("x2", cx)
                .attr("y1", y(s.min)).attr("y2", y(s.q1))
                .attr("stroke", color).attr("stroke-width", 1.5);

            box_svg.append("line")
                .attr("x1", cx).attr("x2", cx)
                .attr("y1", y(s.q3)).attr("y2", y(s.max))
                .attr("stroke", color).attr("stroke-width", 1.5);

            box_svg.append("line")
                .attr("x1", cx - boxWidth / 2).attr("x2", cx + boxWidth / 2)
                .attr("y1", y(s.min)).attr("y2", y(s.min))
                .attr("stroke", color).attr("stroke-width", 1.5);

            box_svg.append("line")
                .attr("x1", cx - boxWidth / 2).attr("x2", cx + boxWidth / 2)
                .attr("y1", y(s.max)).attr("y2", y(s.max))
                .attr("stroke", color).attr("stroke-width", 1.5);

            box_svg.append("rect")
                .attr("x", cx - boxWidth / 2)
                .attr("y", y(s.q3))
                .attr("width", boxWidth)
                .attr("height", y(s.q1) - y(s.q3))
                .attr("fill", color)
                .attr("opacity", 0.3)
                .attr("stroke", color)
                .attr("stroke-width", 1.5);

            box_svg.append("line")
                .attr("x1", cx - boxWidth / 2).attr("x2", cx + boxWidth / 2)
                .attr("y1", y(s.med)).attr("y2", y(s.med))
                .attr("stroke", color).attr("stroke-width", 2);
        });
    });

    const legendItems = [
        { label: "High Temp", color: "red" },
        { label: "Low Temp",  color: "steelblue" }
    ];

    const legend = box_svg.append("g")
        .attr("transform", `translate(${width - 100}, 10)`);

    legendItems.forEach((item, i) => {
        legend.append("rect")
            .attr("x", 0).attr("y", i * 20 - 6)
            .attr("width", 14).attr("height", 14)
            .attr("fill", item.color).attr("opacity", 0.5)
            .attr("stroke", item.color);

        legend.append("text")
            .attr("x", 20).attr("y", i * 20)
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .text(item.label);
    });
}

function drawBoxPlot(data) {
    processBoxData(data);
    updateBoxPlot(2020);
}

d3.select("#box-year-select").on("change", function() {
    updateBoxPlot(+this.value);
});
