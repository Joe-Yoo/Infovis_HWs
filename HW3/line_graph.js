var dailyTempData = {};

function processDailyTempData(data) {
    const map = d3.group(data, d => d.Date.getFullYear());
    
    const result = {};
    map.forEach((yearData, year) => {
        result[year] = yearData.map(d => ({
            date: d.Date,
            high: d.TempMax,
            low: d.TempMin
        })).sort((a, b) => a.date - b.date);
    });

    return result;
}

function updateLineGraph(year) {
    d3.select("#line-graph-svg").selectAll("*").remove();

    const line_svg = d3.select("#line-graph-svg")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const data = dailyTempData[year];

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.low) - 5, d3.max(data, d => d.high) + 5])
        .range([height, 0]);

    line_svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%B")));

    line_svg.append("g")
        .call(d3.axisLeft(y));

    const highLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.high));

    const lowLine = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.low));

    line_svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", highLine);

    line_svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", lowLine);

    const legendItems = [
        { label: "High", color: "red" },
        { label: "Low", color: "steelblue" }
    ];

    const legend = line_svg.append("g")
        .attr("transform", `translate(${width - 80}, 20)`);

    legendItems.forEach((item, i) => {
        legend.append("line")
            .attr("x1", 0).attr("x2", 20)
            .attr("y1", i * 20).attr("y2", i * 20)
            .attr("stroke", item.color)
            .attr("stroke-width", 2);

        legend.append("text")
            .attr("x", 25)
            .attr("y", i * 20)
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .text(item.label);
    });

    
    line_svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom + height)
        .attr("text-anchor", "middle")
        .text("Month")
        .attr("font-size", "12px");

    line_svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .text("Temperature (°F)")
        .attr("font-size", "12px");
}

function drawLineGraph(data) {
    dailyTempData = processDailyTempData(data);
    updateLineGraph(2020);
}

d3.select("#year-select-line").on("change", function() {
    const year = +this.value;
    updateLineGraph(year);
});

// I think it'll be cool to display avg monthly max and min temperatures per month in this graph.