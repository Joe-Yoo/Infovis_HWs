var windData = {};
var windYMax = 0;
var lineGraphState = null;

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

function initLineGraph() {
    const outerSvg = d3.select("#line-graph-svg")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding);

    const line_svg = outerSvg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear().domain([1, 31]).range([0, width]);
    const y = d3.scaleLinear().domain([0, windYMax]).range([height, 0]);

    line_svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `Day ${d}`).ticks(8));

    line_svg.append("g").call(d3.axisLeft(y));

    const windLine   = d3.line().x(d => x(d.day)).y(d => y(d.windspeed));
    const maxWindLine = d3.line().x(d => x(d.day)).y(d => y(d.maxSpeed));
    const area = d3.area().x(d => x(d.day)).y0(d => y(d.windspeed)).y1(d => y(d.maxSpeed));

    const defs = line_svg.append("defs");
    const areaGradient = defs.append("linearGradient")
        .attr("id", "area-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", x(1))
        .attr("x2", x(31));

    const areaPath = line_svg.append("path").attr("fill", "url(#area-gradient)");
    const windPath = line_svg.append("path")
        .attr("fill", "none").attr("stroke", "black").attr("stroke-width", 1.5);
    const maxPath  = line_svg.append("path")
        .attr("fill", "none").attr("stroke", "black").attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,4");

    // Legend (static)
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
            .attr("stroke", "black").attr("stroke-width", 2)
            .attr("stroke-dasharray", item.dasharray || "0");
        legend.append("text")
            .attr("x", 25).attr("y", i * 18)
            .attr("dominant-baseline", "middle").attr("font-size", "12px")
            .text(item.label);
    });

    const gradLegendWidth = 150;
    const gradLegendHeight = 10;
    const gradLegend = outerSvg.append("g")
        .attr("transform", `translate(${legendX + 145}, ${margin.top - 16})`);
    const gradLegendDef = defs.append("linearGradient")
        .attr("id", "legend-gradient").attr("x1", "0%").attr("x2", "100%");
    gradLegendDef.append("stop").attr("offset", "0%")
        .attr("stop-color", "steelblue").attr("stop-opacity", 0.3);
    gradLegendDef.append("stop").attr("offset", "100%")
        .attr("stop-color", "steelblue").attr("stop-opacity", 1.0);
    gradLegend.append("rect")
        .attr("width", gradLegendWidth).attr("height", gradLegendHeight)
        .style("fill", "url(#legend-gradient)");
    gradLegend.append("text").attr("x", 0).attr("y", gradLegendHeight + 12)
        .attr("font-size", "10px").text("Small gap");
    gradLegend.append("text").attr("x", gradLegendWidth).attr("y", gradLegendHeight + 12)
        .attr("font-size", "10px").attr("text-anchor", "end").text("Large gap");

    line_svg.append("text")
        .attr("x", width / 2).attr("y", margin.bottom + height)
        .attr("text-anchor", "middle").attr("font-size", "12px").text("Day");
    line_svg.append("text")
        .attr("transform", "rotate(-90)").attr("x", -height / 2)
        .attr("y", -margin.left + 10).attr("text-anchor", "middle")
        .attr("font-size", "12px").text("Wind Speed (mph)");

    const tooltip = d3.select("#line-graph")
        .append("div").attr("class", "tooltip");
    const container = document.getElementById("line-graph");

    const dotWind = line_svg.append("circle").attr("r", 4).attr("fill", "black").attr("opacity", 0);
    const dotMax  = line_svg.append("circle").attr("r", 4).attr("fill", "black").attr("opacity", 0);

    function showDots(d) {
        dotWind.attr("cx", x(d.day)).attr("cy", y(d.windspeed)).attr("opacity", 1);
        dotMax.attr("cx", x(d.day)).attr("cy", y(d.maxSpeed)).attr("opacity", 1);
    }
    function hideDots() {
        dotWind.attr("opacity", 0);
        dotMax.attr("opacity", 0);
    }

    areaPath
        .on("mouseover", () => tooltip.classed("visible", true))
        .on("mousemove", (event) => {
            const [mx] = d3.pointer(event, line_svg.node());
            const day = Math.round(x.invert(mx));
            const d = lineGraphState.currentData.find(p => p.day === day);
            if (!d) return;
            showDots(d);
            const rect = container.getBoundingClientRect();
            tooltip
                .html(`<strong>Day ${d.day}</strong><br>Max Wind Speed: ${d.maxSpeed} mph<br>Wind Speed: ${d.windspeed} mph<br>Diff: ${(d.maxSpeed - d.windspeed).toFixed(1)} mph`)
                .style("left", (event.clientX - rect.left + 12) + "px")
                .style("top", (event.clientY - rect.top - 28) + "px");
        })
        .on("mouseout", () => { hideDots(); tooltip.classed("visible", false); });

    lineGraphState = {
        line_svg, x, y, windLine, maxWindLine, area,
        areaGradient, areaPath, windPath, maxPath,
        tooltip, container, showDots, hideDots,
        currentData: []
    };
}

function updateLineGraph(year, month) {
    if (!lineGraphState) initLineGraph();

    const { line_svg, x, y, windLine, maxWindLine, area,
            areaGradient, areaPath, windPath, maxPath,
            tooltip, container, showDots, hideDots } = lineGraphState;

    const data = (windData[year] && windData[year][month]) || [];
    lineGraphState.currentData = data;

    const maxDiff = d3.max(data, d => d.maxSpeed - d.windspeed);
    const t = d3.transition().duration(600).ease(d3.easeCubicInOut);

    areaGradient.selectAll("stop")
        .data(data)
        .join("stop")
        .attr("offset", d => `${(x(d.day) / width) * 100}%`)
        .attr("stop-color", "steelblue")
        .transition(t)
        .attr("stop-opacity", d => 0.3 + 0.7 * ((d.maxSpeed - d.windspeed) / maxDiff));

    areaPath.datum(data).transition(t).attr("d", area);
    windPath.datum(data).transition(t).attr("d", windLine);
    maxPath.datum(data).transition(t).attr("d", maxWindLine);

    line_svg.selectAll("circle.hit")
        .data(data)
        .join("circle")
        .attr("class", "hit")
        .attr("cx", d => x(d.day))
        .attr("cy", d => y(d.windspeed))
        .attr("r", 8)
        .attr("fill", "black")
        .attr("opacity", 0)
        .on("mouseover", (_, d) => {
            showDots(d);
            tooltip
                .html(`<strong>Day ${d.day}</strong><br>Max Wind Speed: ${d.maxSpeed} mph<br>Wind Speed: ${d.windspeed} mph<br>Diff: ${(d.maxSpeed - d.windspeed).toFixed(1)} mph`)
                .classed("visible", true);
        })
        .on("mousemove", (event) => {
            const rect = container.getBoundingClientRect();
            tooltip
                .style("left", (event.clientX - rect.left + 12) + "px")
                .style("top", (event.clientY - rect.top - 28) + "px");
        })
        .on("mouseout", () => { hideDots(); tooltip.classed("visible", false); });
}

function drawLineGraph(data) {
    processWindData(data);
    updateLineGraph(2020, 0);
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
