// Custom sizing variables for our treemap
const treePadding = 80;
const treeWidth = 700; 
const treeHeight = 600;

// We need to create a separate SVG for our treemap and attach it to its specific div in the HTML file
const treemapsvg = d3.select("#treemap")
    .append("svg")
    .attr("width", treeWidth)
    .attr("height", treeHeight + treePadding );

// Let's load our data!
d3.csv("students.csv").then(data => {
    // First we need to transform our data into the correct format for a treemap. We start with D3's rollup() method, which is
    // a good way to quickly group things hierarchically and do some sort of aggregation. In this case, we are saying that we
    // want to first group our data by Current_College, then by Current_Major, and lastly keep a count of how many data points
    // fall into that grouping
    const grouping = d3.rollup(data, v => d3.sum(v, d => +d.Count), d => d.Current_College, d=> d.Current_Major);

    // Next we need one root variable that has all of our data together in a hierarchy. We can use D3's hierarchy() method to do
    // this. This method will take our nested grouping from the rollup() method and convert it into the format that a treemap needs
    const root = d3.hierarchy(grouping)
        // The sum() method tells our treemap how we want to size the rectangles, in our case we want to do so by d[1] (which is
        // the count of students in each grouping)
        .sum(d => d[1])
        // The sort() method just makes our treemap look nicer by sorting the rectangles from largest to smallest
        .sort((a, b) => b.value - a.value);

    // We can now use D3's treemap() method to computer those x0, y0, x1, and y1 properties that are needed!
    const treemap = d3.treemap()
        .size([treeWidth, treeHeight])
        .padding(1)
        (root);

    // In some of our examples, we have been hardcoding the categories for our color scales, but since our hierarchy already
    // has the colleges listed as the first level of children, we can just extract that information!
    const colleges = Array.from(grouping.keys());

    // We're going to use an ordinal scale (remember this from last week?) because we have discrete categories (colleges)
    // that we want to map to specific colors. Luckily D3 has some built in colors for us so we don't have to pick them all!
    const colorScale = d3.scaleOrdinal()
        .domain(colleges)
        .range(d3.schemeTableau10);

    // Now we need to create each individual node of data in our treemap! We start by selecting all of the smallest nodes
    // (i.g. the leaves) and append a group element to each so we can have both the rectangle and the label together.
    const nodes = treemapsvg.selectAll("g")
        .data(root.leaves())
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Now we append our rectangle
    nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        // The leaves of our hierarchy are the Majors, so the parent node to them would be the Colleges themselves, which
        // we can use to access our color scale and make sure that all majors within the same college have the same color!
        .attr("fill", d => colorScale(d.parent.data[0])) 
        .attr("stroke", "white");

    // To make our text labels more dynamic, we append a foreignObject instead of a normal text element. This allows us to put
    // HTML elements inside of our SVG and gives us more control over the styling and positioning of our labels
    nodes.append("foreignObject")
        .attr("width", d => d.x1 - d.x0 - 5) 
        .attr("height", d => d.y1 - d.y0 - 5)
        .append("xhtml:div")
        .style("color", "white")
        .style("font-size", "10px")
        .style("padding", "5px")
        // If the text is too big for the box, just hide it! This is our last case resort to make sure our diagram doesn't look too messy
        .style("overflow", "hidden") 
        .style("word-wrap", "break-word")
        // We can dynamically adjust the font size based on the size of the box!
        .style("font-size", d => {
            const boxWidth = d.x1 - d.x0;
            // Map the box width to a font size between 8px and 16px (boxWidth / 10) is a good starting ratio, but we wrap it 
            // in Math.min/max to keep it legible
            const fontSize = Math.min(16, Math.max(8, boxWidth / 12));
            return fontSize + "px";
        })
        // If the box is just way too small for any text, we give up and just hide the text completely and hope nobody needs to see it!
        .style("display", d => (d.x1 - d.x0 < 30 || d.y1 - d.y0 < 20) ? "none" : "block")
        .text(d => d.data[0]);
        
    // How will people know what the colors mean? We need a legend!
    const legend = treemapsvg.append("g")
        // We need to make sure we position it just below our treemap
        .attr("transform", `translate(10, ${treeHeight + 20})`); 

    // We need to get the colors that we have assigned to each of our colleges 
    const collegeColors = colorScale.domain();

    // Now we create a legend item for each college that will contain a colored square and the label for that college
    const legendItems = legend.selectAll(".legend-item")
        .data(collegeColors)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(${i * 100}, 0)`);

    // Now we add our colored squares and fill it with the appropriate color for each college
    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colorScale(d));

    // Next we add our text labels and position them to the right of the colored squares
    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 12) 
        .text(d => d)
        .style("font-size", "12px")
        .attr("fill", "#333");
    
    // Lastly, we need our hover interaction! When we hover over a box:
    nodes.on("mouseover", function() {
        // We want to decrease the visiblity of ALL of the boxes in the diagram first
        nodes.style("opacity", 0.2);
        // Then we want to select THIS box that we're hovering over and increase its visibility so it stands out
        d3.select(this).style("opacity", 1);
    })
    // When we're done hovering
    .on("mouseout", function() {
        // We can restore the visiblity for all of the boxes!
        nodes.style("opacity", 1);
    });
});


