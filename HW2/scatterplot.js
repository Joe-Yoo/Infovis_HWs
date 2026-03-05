var dewpointPressureData = {}

var dewMax = 80;
var pressureMin = 1000;
var pressureMax = 1035;

var currYear = "all";
var currMonth = "all";

const legendItems = [
    { label: "Sun", color: "orange" },
    { label: "Rain", color: "steelblue" },
    { label: "Drizzle", color: "lightblue" },
    { label: "Snow", color: "white" }
];

function getWeatherColor(weather) {
    if (!weather) return "orange";
    const w = weather.toLowerCase();
    if (w.includes("snow")) return "white";
    if (w.includes("rain")) return "steelblue";
    if (w.includes("drizzle")) return "lightblue";
    return "orange";
}

function updateScatterplot(year, month) {
    d3.select("#scatterplot-svg").selectAll("*").remove(); //  reset
    const scatter_svg = d3.select("#scatterplot-svg")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // x axis is dewpoint
    const x = d3.scaleLinear()
        .domain([0, dewMax])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([pressureMin, pressureMax])
        .range([height, 0]);

    scatter_svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    scatter_svg.append("g")
        .call(d3.axisLeft(y));

    var data = [];
    if (year === "all" && month === "all") {
        dewpointPressureData.forEach((monthsMap, y) => {
            monthsMap.forEach((monthData, m) => {
                data = data.concat(monthData);
            });
        });
    } else if (year === "all") {
        dewpointPressureData.forEach((monthsMap, y) => {
            if (monthsMap.has(month)) {
                data = data.concat(monthsMap.get(month));
            }
        });
    } else if (month === "all") {
        if (dewpointPressureData.has(year)) {
            dewpointPressureData.get(year).forEach((monthData, m) => {
                data = data.concat(monthData);
            });
        }
    } else {
        data = dewpointPressureData.get(year).get(month);
    }


    // Tooltip from lab 7
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");

    const HOVER_SLICE_HEIGHT = 15;
    const ANIMATION_DURATION = 200;

    let selected_data = null;

    scatter_svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", d => x(d.Dewpoint))
        .attr("cy", d => y(d.Pressure))
        .attr("r", 4)
        .style("fill", d => getWeatherColor(d.Weather))
        .style("stroke", "black")
        .style("stroke-width", "0.5px")
        .on("mouseover", function(event, d) {
            // console.log(d.Dewpoint + " " + d.Pressure + " " + d.Weather);
            tooltip
                .html(`<strong>${d.Dewpoint}</strong><br>Value: ${d.Pressure}%`)
                .classed("visible", true);
        })
        .on("mousemove", (event) => {
            const pad = 15;

            // Move the tooltip as we move our mouse
            tooltip
                .style("left", (event.pageX + pad) + "px")
                .style("top", (event.pageY + pad) + "px");
        })
        .on("mouseout", function(event, d) {
            // console.log("test left");
            tooltip.classed("visible", false);
        });


    scatter_svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.bottom + height)
        .attr("text-anchor", "middle")
        .text("Dewpoint (°F)")
        .attr("font-size", "12px");

    scatter_svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .text("Pressure (mmHg)")
        .attr("font-size", "12px");

    const legend = scatter_svg.append("g")
        .attr("transform", `translate(${width - 80}, 20)`);

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

function drawScatterplot(data) {
    dewpointPressureData = d3.group(data, d => d.Date.getFullYear(), d => d.Date.getMonth());
    updateScatterplot("all", "all");
    console.log([...new Set(data.map(d => d.Weather))]);
}


d3.select("#year-select-scatter").on("change", function() {
    var year = this.value === "all" ? "all" : +this.value;
    var monthValue = d3.select("#month-select-scatter").property("value");
    var month = monthValue === "all" ? "all" : +monthValue;
    updateScatterplot(year, month);
});

d3.select("#month-select-scatter").on("change", function() {
    var month = this.value === "all" ? "all" : +this.value;
    var yearValue = d3.select("#year-select-scatter").property("value");
    var year = yearValue === "all" ? "all" : +yearValue;
    updateScatterplot(year, month);
});
