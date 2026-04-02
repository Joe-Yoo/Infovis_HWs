var weatherByMonth = {};

const legendItems = [
    { label: "Sun",     color: "orange" },
    { label: "Rain",    color: "steelblue" },
    { label: "Drizzle", color: "lightblue" },
    { label: "Snow",    color: "white" }
];

function getWeatherColor(weather) {
    if (!weather) return "orange";
    const w = weather.toLowerCase();
    if (w.includes("snow"))    return "white";
    if (w.includes("rain"))    return "steelblue";
    if (w.includes("drizzle")) return "lightblue";
    return "orange";
}

function processWeatherData(data) {
    const byYear = d3.group(data, d => d.Date.getFullYear());
    byYear.forEach((yearData, year) => {
        weatherByMonth[year] = {};
        const byMonth = d3.rollup(
            yearData,
            v => {
                const counts = d3.rollup(v, g => g.length, d => d.Weather || "Unknown");
                return Array.from(counts, ([weather, count]) => ({ weather, count }));
            },
            d => d.Date.getMonth()
        );
        byMonth.forEach((monthData, month) => {
            weatherByMonth[year][month] = monthData;
        });
    });
}

function updatePieChart(year, month) {
    d3.select("#pie-chart-svg").selectAll("*").remove();

    const data = (weatherByMonth[year] && weatherByMonth[year][month]) || [];

    const pieWidth = width + padding;
    const pieHeight = height + padding;
    const radius = Math.min(width, height) / 2;

    const pie_svg = d3.select("#pie-chart-svg")
        .append("svg")
        .attr("width", pieWidth)
        .attr("height", pieHeight)
        .append("g")
        .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);

    const pie = d3.pie()
        .value(d => d.count);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    pie_svg.selectAll("path")
        .data(pie(data))
        .join("path")
        .attr("d", arc)
        .attr("fill", d => getWeatherColor(d.data.weather))
        .attr("stroke", "black")
        .style("stroke-width", "0.5px");

    const legend = pie_svg.append("g")
        .attr("transform", `translate(${radius + 20}, ${-radius})`);

    legendItems.forEach((item, i) => {
        legend.append("circle")
            .attr("cx", 0)
            .attr("cy", i * 20)
            .attr("r", 5)
            .style("fill", item.color)
            .style("stroke", "black")
            .style("stroke-width", "0.5px");

        legend.append("text")
            .attr("x", 12)
            .attr("y", i * 20)
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .text(item.label);
    });
}

function drawPieChart(data) {
    processWeatherData(data);
    updatePieChart(2020, 0);
}

d3.select("#top-month-select").on("change.pie", function() {
    const month = +this.value;
    const year = +d3.select("#top-year-select").property("value");
    updatePieChart(year, month);
});

d3.select("#top-year-select").on("change.pie", function() {
    const year = +this.value;
    const month = +d3.select("#top-month-select").property("value");
    updatePieChart(year, month);
});
