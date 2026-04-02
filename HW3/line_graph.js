var windData = {};
var windYMax = 0;

function processWindData(data) {
    windYMax = d3.max(data, d => d.MaxSpeed) + 2;

    const byYear = d3.group(data, d => d.Date.getFullYear());
    byYear.forEach((yearData, year) => {
        windData[year] = {};
        const byMonth = d3.group(yearData, d => d.Date.getMonth());
        byMonth.forEach((monthData, month) => {
            windData[year][month] = monthData.map(d => ({
                day: d.Date.getDate(),
                windspeed: d.Windspeed,
                maxSpeed: d.MaxSpeed
            })).sort((a, b) => a.day - b.day);
        });
    });
}

function updateLineGraph(year, month) {
    d3.select("#line-graph-svg").selectAll("*").remove();

    const outerSvg = d3.select("#line-graph-svg")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding);

    const line_svg = outerSvg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const data = (windData[year] && windData[year][month]) || [];

    const x = d3.scaleLinear()
        .domain([1, 31])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, windYMax])
        .range([height, 0]);

    line_svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Day ${d}`).ticks(8));

    line_svg.append("g")
        .call(d3.axisLeft(y));

    const windLine = d3.line()
        .x(d => x(d.day))
        .y(d => y(d.windspeed));

    const maxWindLine = d3.line()
        .x(d => x(d.day))
        .y(d => y(d.maxSpeed));

    const area = d3.area()
        .x(d => x(d.day))
        .y0(d => y(d.windspeed))
        .y1(d => y(d.maxSpeed));

    const maxDiff = d3.max(data, d => d.maxSpeed - d.windspeed);

    const defs = line_svg.append("defs");
    const areaGradient = defs.append("linearGradient")
        .attr("id", "area-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", x(data[0].day))
        .attr("x2", x(data[data.length - 1].day));

    areaGradient.selectAll("stop")
        .data(data)
        .join("stop")
        .attr("offset", d => `${(x(d.day) / width) * 100}%`)
        .attr("stop-color", "steelblue")
        .attr("stop-opacity", d => 0.3 + 0.7 * ((d.maxSpeed - d.windspeed) / maxDiff));

    line_svg.append("path")
        .datum(data)
        .attr("fill", "url(#area-gradient)")
        .attr("d", area);

    line_svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", windLine);

    line_svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,4")
        .attr("d", maxWindLine);

    const lineLegendItems = [
        { label: "Windspeed", dasharray: null },
        { label: "Max Windspeed", dasharray: "5,4" }
    ];

    const legendX = margin.left + width - 300;
    const legend = outerSvg.append("g")
        .attr("transform", `translate(${legendX}, ${margin.top - 12})`);

    lineLegendItems.forEach((item, i) => {
        legend.append("line")
            .attr("x1", 0).attr("x2", 20)
            .attr("y1", i * 18).attr("y2", i * 18)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", item.dasharray || "0");

        legend.append("text")
            .attr("x", 25)
            .attr("y", i * 18)
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .text(item.label);
    });

    const gradLegendWidth = 150;
    const gradLegendHeight = 10;
    const gradLegend = outerSvg.append("g")
        .attr("transform", `translate(${legendX + 145}, ${margin.top - 16})`);

    const gradLegendDef = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("x2", "100%");

    gradLegendDef.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "steelblue")
        .attr("stop-opacity", 0.3);

    gradLegendDef.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "steelblue")
        .attr("stop-opacity", 1.0);

    gradLegend.append("rect")
        .attr("width", gradLegendWidth)
        .attr("height", gradLegendHeight)
        .style("fill", "url(#legend-gradient)");

    gradLegend.append("text")
        .attr("x", 0)
        .attr("y", gradLegendHeight + 12)
        .attr("font-size", "10px")
        .text("Small gap");

    gradLegend.append("text")
        .attr("x", gradLegendWidth)
        .attr("y", gradLegendHeight + 12)
        .attr("font-size", "10px")
        .attr("text-anchor", "end")
        .text("Large gap");

    line_svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom + height)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Day");

    line_svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Wind Speed (mph)");
}

function drawLineGraph(data) {
    processWindData(data);
    updateLineGraph(2020, 0); // default to Jan 2020
}

d3.select("#top-month-select").on("change.line", function() {
    const month = +this.value;
    const year = +d3.select("#top-year-select").property("value");
    updateLineGraph(year, month);
});

d3.select("#top-year-select").on("change.line", function() {
    const year = +this.value;
    const month = +d3.select("#top-month-select").property("value");
    updateLineGraph(year, month);
});
