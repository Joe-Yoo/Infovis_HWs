// Custom sizing variables for our chord diagram
const chordPadding = 80;
const chordWidth = 700; 
const chordHeight = 600;

// We need to create a separate SVG for our chord diagram and attach it to its specific div in the HTML file
const chordsvg = d3.select("#chord")
    .append("svg")
    .attr("width", chordWidth)
    .attr("height", chordHeight + chordPadding);

// For our color coordination, we just want a clear list of the colleges so we can make a color scale for them. You
// can do this dynamically but we don't have many colleges so we can just hardcode it here.
const colleges = ["Computing", "Engineering", "Sciences", "Design", "Business", "Liberal Arts"];
// We're going to use an ordinal scale (remember this from last week?) because we have discrete categories (colleges)
// that we want to map to specific colors. Luckily D3 has some built in colors for us so we don't have to pick them all!
const colorScale = d3.scaleOrdinal()
    .domain(colleges)
    .range(d3.schemeTableau10);

// Let's load our data!
d3.csv("students.csv").then(data => {

    // For our chord diagram, we will need an N x N matrix that shows the flow from each major to every other major. To do
    // this, we first map our data to get a list of all unique previous and current majors, and create an array for us to
    // reference when building the matrix
    const majors = Array.from(new Set([
        ...data.map(d => d.Previous_Major),
        ...data.map(d => d.Current_Major)
    ]));

    // Next we need to create the matrix, where N is the number of unique majors we have. We first create an empty matrix
    // of size num x num that is filled with zeroes
    const num = majors.length;
    const matrix = Array.from({length: num}, () => Array(num).fill(0));
    // We then create a map of major name and its corresponding index in the matrix for easier reference later
    const index = new Map(majors.map((name, i) => [name, i]));
    
    // Now we loop through our data and create a map of which majors belong to which college for easier reference later
    const majorToCollege = new Map();
    data.forEach(d => {
        majorToCollege.set(d.Current_Major, d.Current_College);
    });

    // Lastly, we loop through our data again and fill in the matrix with the count of students flowing from each previous
    // major to each current major. We are able to use our index map to easily know the correct row and column to update
    data.forEach(d => {
        matrix[index.get(d.Previous_Major)][index.get(d.Current_Major)] += +d.Count;
    });

    // Now we can use D3's chord() method to compute the necessary information for our chord diagram based on our matrix!
    const chord = d3.chord()
        .padAngle(0.05)
        // We are sorting the subgroups in descending order so that the largest flows are closest to the outer edge of the 
        // diagram and are easier to see
        .sortSubgroups(d3.descending);

    // We need some inner and outer radius parameters so we know how large to make our diagram
    const innerRadius = Math.min(chordWidth, chordHeight) * 0.3;
    const outerRadius = innerRadius + 20;
    const chords = chord(matrix);

    // Now we can start drawing our diagram. First we create a container group element that holds the rest of our diagram
    const container = chordsvg.append("g")
        .attr("transform", `translate(${chordWidth / 2}, ${(chordHeight / 2) + 50})`);

    // Next we generate our ribbons using D3's ribbon() method, which creates the curved paths between the arcs based on 
    // the parameters we use
    const ribbonGenerator = d3.ribbon().radius(innerRadius);

    // We draw all of our ribbons using paths, and use the ribbon generator to create the d attribute for us!
    const ribbons = container.append("g")
        .selectAll("path")
        .data(chords)
        .enter()
        .append("path")
        .attr("d", ribbonGenerator)
        // We want to color our links based on the college they are associated with. Since each major belongs to a college, 
        // we can just check the source or target major for each ribbon and use that to determine the color of the ribbon
        .attr("fill", d => {
            const college = majorToCollege.get(majors[d.source.index]);
            return colorScale(college);
        })
        .attr("opacity", 0.7)
        .attr("stroke", "none");

    // Now we need to draw our arcs (outer parts of the diagram), so first we need a generator so they look nice!
    const arcGenerator = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    // We create a group for each arc so that we can have the ribbon path and the arc label together (import for interaction!)
    const groups = container.append("g")
        .selectAll("g")
        .data(chords.groups)
        .enter()
        .append("g");
    
    // We then append our arc paths and use the arc generator to create the d attribute for us!
    groups.append("path")
        .attr("fill", d => colorScale(majorToCollege.get(majors[d.index])))
        .attr("stroke", "white")
        .attr("d", arcGenerator)
        // We can use the mouseover event here to trigger the start of our hover interaction
        .on("mouseover", function(event, d) {
            // First we need to dim all of the ribbons in the diagram
            ribbons.style("opacity", 0.05);

            // Next, we find all of the ribbons that have a source or target that matches THIS arc's index and make them visible
            ribbons.filter(r => r.source.index === d.index || r.target.index === d.index)
                .style("opacity", 1);

            // Lastly, we dim the other arcs in the diagram and select THIS one to keep fully visible
            groups.selectAll("path").style("opacity", 0.2);
            d3.select(this).style("opacity", 1);
        })
        // We can use the mouseout event to trigger the end of our hover interaction
        .on("mouseout", function() {
            // When our interaction is over, we want everything to return to normal visibility
            ribbons.style("opacity", 0.7);
            groups.selectAll("path").style("opacity", 1);
        });

    // Lastly, we need to add labels so people know what each arc represents!
    groups.append("text")
        // These are mostly just styling so that the labels stick out from the arcs and oriented nicely, you can adjust as needed
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 10})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
        .text(d => majors[d.index])
        .style("font-size", "10px")
        .style("font-family", "sans-serif");
});