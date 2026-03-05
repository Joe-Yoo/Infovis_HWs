function drawCalendar(data) {
    const calendar_svg = d3.select("#calendar")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding);
}
// idea: calendar from 2020 -> 2022 displaying average temperature for each day.
// blue to red depending on tempurature.