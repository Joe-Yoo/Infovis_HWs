var weatherByMonth = {};
var pieChartState = null;

const legendItems = [
    { label: "Sun", color: "orange" },
    { label: "Rain", color: "steelblue" },
    { label: "Drizzle", color: "lightblue" },
    { label: "Snow", color: "white" }
];

const weatherOrder = ["Sun", "Rain", "Drizzle", "Snow"];

function getWeatherColor(weather) {
    if (!weather) {
        return "orange";
    }
    const w = weather.toLowerCase();
    if (w.includes("snow")) {
        return "white";
    }
    if (w.includes("rain")) {
        return "steelblue";
    }
    if (w.includes("drizzle")) {
        return "lightblue";
    }
    return "orange";
}

function getWeatherLabel(weather) {
    if (!weather) {
        return "Sun";
    }
    const w = weather.toLowerCase();
    if (w.includes("snow")) {
        return "Snow";
    }
    if (w.includes("rain")) {
        return "Rain";
    }
    if (w.includes("drizzle")) {
        return "Drizzle";
    }
    return "Sun";
}

function normalizeData(raw) {
    const counts = { Sun: 0, Rain: 0, Drizzle: 0, Snow: 0 };
    raw.forEach(d => {
        counts[getWeatherLabel(d.weather)] += d.count;
    });
    return weatherOrder.map(label => ({
        weather: label, count: counts[label]
    }));
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

function initPieChart() {
    const pieWidth = width + padding;
    const pieHeight = height + padding;
    const radius = Math.min(width, height) / 2;

    const pie_svg = d3.select("#pie-chart-svg")
        .append("svg")
        .attr("width", pieWidth)
        .attr("height", pieHeight)
        .append("g")
        .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);

    const pie = d3.pie().value(d => d.count).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const tooltip = d3.select("#pie-chart")
        .append("div")
        .attr("class", "tooltip");

    const legend = pie_svg.append("g")
        .attr("transform", `translate(${radius + 20}, ${-radius})`);
    legendItems.forEach((item, i) => {
        legend.append("circle")
            .attr("cx", 0).attr("cy", i * 20).attr("r", 5)
            .style("fill", item.color)
            .style("stroke", "black").style("stroke-width", "0.5px");
        legend.append("text")
            .attr("x", 12).attr("y", i * 20)
            .attr("dominant-baseline", "middle").attr("font-size", "12px")
            .text(item.label);
    });

    pieChartState = { pie_svg, pie, arc, tooltip };
}

function updatePieChart(year, month) {
    if (!pieChartState) {
        initPieChart();
    }

    const { pie_svg, pie, arc, tooltip } = pieChartState;

    const raw = (weatherByMonth[year] && weatherByMonth[year][month]) || [];
    const data = normalizeData(raw);
    const total = d3.sum(data, d => d.count);
    const t = d3.transition().duration(600).ease(d3.easeCubicInOut);

    pie_svg.selectAll("path")
        .data(pie(data), d => d.data.weather)
        .join(enter => enter.append("path")
            .attr("fill", d => getWeatherColor(d.data.weather))
            .attr("stroke", "black")
            .style("stroke-width", "0.5px")
            .each(function(d) { this._current = { startAngle: d.startAngle, endAngle: d.startAngle }; })
        )
        .on("mouseover", (_, d) => {
            if (d.data.count === 0) return;
            tooltip
                .html(`<strong>${d.data.weather}</strong><br>${((d.data.count / total) * 100).toFixed(1)}%`)
                .classed("visible", true);
        })
        .on("mousemove", (event) => {
            tooltip
                .style("left", (event.offsetX + 12) + "px")
                .style("top", (event.offsetY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.classed("visible", false);
        })
        .transition(t)
        .attrTween("d", function(d) {
            const i = d3.interpolate(this._current, d);
            return t => { this._current = i(t); return arc(this._current); };
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
