// Data for our pie chart
const data = 
[
    { label: "BIG Backing", value: 40 },
    { label: "Losing in Fortnite", value: 20 },
    { label: "Playing Pokemon Showdown", value: 15 },
    { label: "Sleeping", value: 14 },
    { label: "Sitting by Himself in Office Hours", value: 9.5},
    { label: "\"Teaching\" Labs", value: 1 },
    { label: "Grading Assignments", value: .5 }
];

// Standard margin convention that we will use to designate the outer and inner widths
const margin = { top: 70, right: 20, bottom: 20, left: 20 };
const outerWidth = 600; 
const outerHeight = 450;
const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom;

// Establish the pie are width and then get the radius for the pie chart
const pieAreaWidth = width - 250;
const radius = Math.min(pieAreaWidth, height) / 2;

// Create a container for the chart
const container = d3.select("body")
    .append("div")
    .attr("id", "chart");

// Create an SVG view box that we will use for our pie chart
const svg = container.append("svg")
    .attr("width", outerWidth)
    .attr("viewBox", `0 0 ${outerWidth} ${outerHeight}`);

// Add the title to the visualization
svg.append("text")
    .attr("x", margin.left)
    .attr("y", 30) 
    .text("How Jack Spends His Time")
    .style("font-family", "sans-serif")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#333");

const g = svg.append("g")
    .attr("transform", `translate(${margin.left + pieAreaWidth / 2},${margin.top + height / 2})`);

// Create a color scale for the pie chart
const color = d3.scaleOrdinal()
    .domain(data.map(d => d.label))
    .range(d3.schemeSet2);

// Create the pie chart visualization mapping our data values to the pie chart
const pie = d3.pie()
    .value(d => d.value)
    .sort(null); 

// Create the data for the pie chart
const pieData = pie(data);

// Creates the arc for the pie chart slice
const arcGenerator = d3.arc()
    .innerRadius(0) 
    .outerRadius(radius);

// Create the individual slices for the pie chart
const slices = g.selectAll("path")
    .data(pieData)
    .join("path")
    .attr('d', arcGenerator)
    .attr('fill', d => color(d.data.label))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 1)
    .attr("class", "slice");

// Create a grouping for the SVG
const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + pieAreaWidth + 40}, ${margin.top + 10})`);

// Create the legend items
const legendItems = legend.selectAll(".legend-item")
    .data(pieData)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 30})`); 

// Create the svg rectangles for the legend
legendItems.append("rect")
    .attr("width", 16)
    .attr("height", 16)
    .attr("rx", 4) 
    .attr("fill", d => color(d.data.label));

// Create the text for each of the rectangles for the legend
legendItems.append("text")
    .attr("x", 24) 
    .attr("y", 13) 
    .text(d => d.data.label)
    .style("font-family", "sans-serif")
    .style("font-size", "14px")
    .style("fill", "#555");

// Create a div for the tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// Some variables to use
const HOVER_SLICE_HEIGHT = 15;
const ANIMATION_DURATION = 200;

// Create the slightly larger arc for the pie chart slice
const arcHover = d3.arc()
    .innerRadius(0) 
    .outerRadius(radius + HOVER_SLICE_HEIGHT);

// Create a variable for what 
let selectedSlice = null;

slices
    // When the mouse goes over an item
    .on("mouseover", (event, d) => 
    {
        // Create the tooltip html to be the label and the value and set the class to be visible
        tooltip
            .html(`<strong>${d.data.label}</strong><br>Value: ${d.value}%`)
            .classed("visible", true);

        // If the slice is null or the selectedSlice is the data label set it as the current target
        if (selectedSlice === null || selectedSlice === d.data.label) 
        {
            d3.select(event.currentTarget)
                .transition().duration(ANIMATION_DURATION)
                .attr('d', arcHover);
        }
    })
    // When the mouse moves over the item
    .on("mousemove", (event) => 
    {
        const pad = 15;

        // Move the tooltip as we move our mouse
        tooltip
            .style("left", (event.pageX + pad) + "px")
            .style("top", (event.pageY + pad) + "px");
    })
    // When the mouse leaves the item
    .on("mouseout", (event, d) => 
    {
        // When we leave the element, 
        tooltip.classed("visible", false);

        // If the slice is not the data then just turn the arc into the original arc height
        if (selectedSlice !== d.data.label) 
        {
            d3.select(event.currentTarget)
                .transition().duration(ANIMATION_DURATION)
                .attr('d', arcGenerator);
        }
    })
    // When you click on the item
    .on("click", (event, d) => 
    {
        // If the slice is already selected unselect it otherwise select the label
        selectedSlice = (selectedSlice === d.data.label) ? null : d.data.label;

        // Change the opacity of all the slices
        slices.style("opacity", b => (selectedSlice === null || b.data.label === selectedSlice) ? 1 : 0.3);

        // Change the arc to either have the same arc length and height or if the item is selected make it the hover height
        slices.transition().duration(ANIMATION_DURATION)
            .attr("d", b => (b.data.label === selectedSlice) ? arcHover(b) : arcGenerator(b));
  });

// 1) Try turning the pie chart into a donut chart!
// 2) Sort the slices by largest to smallest or smallest to largest
// 3) Add functionality to multi-select items using command or control
// 4) Add a button that changes the color encoding for items (don't forget to change the legends items as well)