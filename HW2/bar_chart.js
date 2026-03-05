const monthlyPrecipData = {};

function processMonthlyPrecipData(data) {
    [2020, 2021, 2022, "all"].forEach(year => {
        const yearData = year === "all" ? data : data.filter(d => d.Date.getFullYear() === year);
        monthlyPrecipData[year] = d3.rollups(
            yearData,
            v => d3.mean(v, d => d.Precip),
            d => d.Date.getMonth()
        ).map(([month, precip]) => ({ month: months[month], precip }))
         .sort((a, b) => a.month - b.month);
    });
}

function updateBarChart(year) {
    d3.select("#bar-chart-svg").selectAll("*").remove(); //  reset

    const bar_svg = d3.select("#bar-chart-svg")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand()
        .domain(months)
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 0.5])
        .range([height, 0]);

    bar_svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    bar_svg.append("g")
        .call(d3.axisLeft(y));

    bar_svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom + height)
        .attr("text-anchor", "middle")
        .text("Month")
        .attr("font-size", "12px");

    bar_svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .text("Avg Monthly Precipitation (inches)")
        .attr("font-size", "12px");

    bar_svg.selectAll("rect")
        .data(monthlyPrecipData[year])
        .join("rect")
        .attr("x", d => x(d.month))
        .attr("y", d => y(d.precip))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.precip))
        .attr("fill", "steelblue");
}

function drawBarChart(data, year = 'all') {
    processMonthlyPrecipData(data);
    updateBarChart(year);
}

d3.select("#year-select").on("change", function() {
    const year = this.value === "all" ? "all" : +this.value;
    updateBarChart(year);
});