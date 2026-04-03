var boxData = {};
var boxState = null;

function processBoxData(data) {
    const byYear = d3.group(data, d => d.Date.getFullYear());
    byYear.forEach((yearData, year) => {
        boxData[year] = {};
        const byMonth = d3.group(yearData, d => d.Date.getMonth());
        byMonth.forEach((monthData, month) => {
            const highs = monthData.map(d => d.TempMax).sort(d3.ascending);
            const lows  = monthData.map(d => d.TempMin).sort(d3.ascending);

            function stats(arr) {
                const q1 = d3.quantile(arr, 0.25);
                const med = d3.quantile(arr, 0.5);
                const q3 = d3.quantile(arr, 0.75);
                const iqr = q3 - q1;
                const min = d3.max([d3.min(arr), q1 - 1.5 * iqr]);
                const max = d3.min([d3.max(arr), q3 + 1.5 * iqr]);
                return { q1, med, q3, min, max };
            }

            boxData[year][month] = {
                month,
                high: stats(highs),
                low: stats(lows)
            };
        });
    });
}

function initBoxPlot() {
    const svg = d3.select("#box-svg")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding);

    const box_svg = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand().domain(months).range([0, width]).padding(0.3);
    const y = d3.scaleLinear().domain([0, 105]).range([height, 0]);

    box_svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    box_svg.append("g").call(d3.axisLeft(y));

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

    const boxGroup = box_svg.append("g").attr("class", "boxes");

    // lab 8!
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("brush end", (e) => {
            const s = e.selection;
            if (!s) {
                boxGroup.selectAll("g.box-group").style("opacity", 1);
                boxState.selectedMonths = null;
                updateCalendarHighlight(null, null);
                return;
            }
            const [[x0, y0], [x1, y1]] = s;
            const selectedMonths = new Set();
            boxGroup.selectAll("g.box-group").each(function(d) {
                const centerX = x(months[d.month]) + x.bandwidth() / 2 + d.offset;
                const topY = y(d.s.max);
                const bottomY = y(d.s.min);
                if (x0 <= centerX && centerX <= x1 && y0 <= bottomY && topY <= y1)
                    selectedMonths.add(d.month);
            });
            boxGroup.selectAll("g.box-group").style("opacity", d =>
                selectedMonths.has(d.month) ? 1 : 0.15
            );
            boxState.selectedMonths = selectedMonths;
            updateCalendarHighlight(selectedMonths, boxState.currentYear);
        });

    box_svg.append("g").attr("class", "brush").call(brush);

    boxState = { boxGroup, x, y, currentYear: 2020, selectedMonths: null };
}

function updateBoxPlot(year) {
    if (!boxState) {
        initBoxPlot();
    }

    const { boxGroup, x, y } = boxState;
    boxState.currentYear = year;

    if (boxState.selectedMonths !== null) {
        updateCalendarHighlight(boxState.selectedMonths, year);
    }

    const yearData = Object.values(boxData[year]);
    const t = d3.transition().duration(600).ease(d3.easeCubicInOut);

    const series = [
        { key: "high", color: "red", offset: -x.bandwidth() / 4 },
        { key: "low", color: "steelblue", offset:  x.bandwidth() / 4 }
    ];
    const boxWidth = x.bandwidth() / 2 - 2;

    const flatData = [];
    yearData.forEach(d => {
        series.forEach(({ key, color, offset }) => {
            flatData.push({ month: d.month, key, color, offset, s: d[key] });
        });
    });

    const groups = boxGroup.selectAll("g.box-group")
        .data(flatData, d => `${d.month}-${d.key}`)
        .join("g")
        .attr("class", "box-group");

    const cx = d => x(months[d.month]) + x.bandwidth() / 2 + d.offset;

    groups.selectAll("line.lower-whisker")
        .data(d => [d])
        .join("line")
        .attr("class", "lower-whisker")
        .attr("stroke", d => d.color).attr("stroke-width", 1.5)
        .attr("x1", cx).attr("x2", cx)
        .transition(t)
        .attr("y1", d => y(d.s.min))
        .attr("y2", d => y(d.s.q1));

    groups.selectAll("line.upper-whisker")
        .data(d => [d])
        .join("line")
        .attr("class", "upper-whisker")
        .attr("stroke", d => d.color).attr("stroke-width", 1.5)
        .attr("x1", cx).attr("x2", cx)
        .transition(t)
        .attr("y1", d => y(d.s.q3))
        .attr("y2", d => y(d.s.max));

    groups.selectAll("line.cap-min")
        .data(d => [d])
        .join("line")
        .attr("class", "cap-min")
        .attr("stroke", d => d.color).attr("stroke-width", 1.5)
        .attr("x1", d => cx(d) - boxWidth / 2).attr("x2", d => cx(d) + boxWidth / 2)
        .transition(t)
        .attr("y1", d => y(d.s.min)).attr("y2", d => y(d.s.min));

    groups.selectAll("line.cap-max")
        .data(d => [d])
        .join("line")
        .attr("class", "cap-max")
        .attr("stroke", d => d.color).attr("stroke-width", 1.5)
        .attr("x1", d => cx(d) - boxWidth / 2).attr("x2", d => cx(d) + boxWidth / 2)
        .transition(t)
        .attr("y1", d => y(d.s.max)).attr("y2", d => y(d.s.max));

    groups.selectAll("rect.iqr-box")
        .data(d => [d])
        .join("rect")
        .attr("class", "iqr-box")
        .attr("fill", d => d.color).attr("opacity", 0.3)
        .attr("stroke", d => d.color).attr("stroke-width", 1.5)
        .attr("x", d => cx(d) - boxWidth / 2)
        .attr("width", boxWidth)
        .transition(t)
        .attr("y", d => y(d.s.q3))
        .attr("height", d => y(d.s.q1) - y(d.s.q3));

    groups.selectAll("line.median")
        .data(d => [d])
        .join("line")
        .attr("class", "median")
        .attr("stroke", d => d.color).attr("stroke-width", 2)
        .attr("x1", d => cx(d) - boxWidth / 2).attr("x2", d => cx(d) + boxWidth / 2)
        .transition(t)
        .attr("y1", d => y(d.s.med)).attr("y2", d => y(d.s.med));

}

function drawBoxPlot(data) {
    processBoxData(data);
    updateBoxPlot(2020);
}

d3.select("#box-year-select").on("change", function() {
    updateBoxPlot(+this.value);
});
