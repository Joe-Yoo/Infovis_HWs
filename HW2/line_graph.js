function drawLineGraph(data) {
    const line_svg = d3.select("#line-graph")
        .append("svg")
        .attr("width", width + padding)
        .attr("height", height + padding);
}
// I think it'll be cool to display avg monthly max and min temperatures per month in this graph.