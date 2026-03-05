// Data that we will use for our bar charts
const data = 
[
  { name: "A", value: 12, value2: 6 },
  { name: "B", value: 28, value2: 7 },
  { name: "C", value: 7,  value2: 36 },
  { name: "D", value: 35, value2: 42 },
  { name: "E", value: 19, value2: 44 },
  { name: "F", value: 42, value2: 13 }
];

// Establish the margin convention for our visualization
const margin = { top: 20, right: 20, bottom: 40, left: 50 };

const outerWidth = 900;
const outerHeight = 420;

const width = outerWidth - margin.left - margin.right;
const height = outerHeight - margin.top - margin.bottom;

// Select the body and add a div that we can use
const container = d3.select("body")
  .append("div")
  .attr("id", "chart");

d3.select("body")
  .insert("div", "#chart");

// Set a viewbox for our svg
const svg = container.append("svg")
  .attr("width", width)
  .attr("viewBox", `0 0 ${outerWidth} ${outerHeight}`);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Create a scale band for each name that exists in our data (add a little padding and stuff as well)
const x = d3.scaleBand()
  .domain(data.map(d => d.name))
  .range([0, width])
  .padding(0.2)
  .paddingOuter(0.3);

// Add a linear scale for the value of our data
const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .nice()
  .range([height, 0]);

// Add a color scale for our data based on value 2
const color = d3.scaleSequential()
  .domain(d3.extent(data, d => d.value2))
  .interpolator(d3.interpolateReds);

// Add the bottom axis for our graph
g.append("g")
  .attr("class", "axis x-axis")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x));

// Add the left axis for our bottom graph
g.append("g")
  .attr("class", "axis y-axis")
  .call(d3.axisLeft(y).ticks(6));

// Use this to handle selection of bars
let selectedName = null;

// Create the marks for each bar using our scales
const bars = g.selectAll("rect")
  .data(data, d => d.name)
  .join("rect")
  .attr("class", "bar")
  .attr("x", d => x(d.name))
  .attr("y", d => y(d.value))
  .attr("width", x.bandwidth())
  .attr("height", d => height - y(d.value))
  .attr("fill", d => color(d.value2));

bars
  .on("mouseover", (event, d) => 
  {
    // When we hover over an item with our mouse show the tool tip that we made
    d3.select(event.currentTarget)
      .attr("stroke", "black")
      .attr("stroke-width", 1.5);

    showTooltip(event, d);
  })
  .on("mousemove", (event) => 
  {
    // When we move in our item move the tool tip
    moveTooltip(event);
  })
  .on("mouseout", (event) => 
  {
    // When we leave the item then leave the tooltip
    d3.select(event.currentTarget)
      .attr("stroke", null)
      .attr("stroke-width", null);

    hideTooltip();
  })
  .on("click", (event, d) => 
  {
    // When we click on an item select that item then have the other items dim
    selectedName = (selectedName === d.name) ? null : d.name;

    bars.classed(
      "dimmed",
      b => selectedName !== null && b.name !== selectedName
    );

    bars.attr(
      "opacity",
      b => (selectedName === null || b.name === selectedName) ? 1 : 0.45
    );
  });

// Create out tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

// Helper function to show our tool tip
function showTooltip(event, d) 
{
  tooltip
    .html(`<p>${d.name}</p><div>Value: ${d.value}</div>`)
    .classed("visible", true);

  moveTooltip(event);
}

// Helper function to move our tooltip
function moveTooltip(event) 
{
  const pad = 12;
  tooltip
    .style("left", (event.clientX + pad) + "px")
    .style("top", (event.clientY + pad) + "px");
}

// Helper function to hide our tool tip
function hideTooltip() 
{
  tooltip.classed("visible", false);
}

// Extra Challenges!!!
// 1) Add a button that changes your linear scaling to logarithmic
// 2) Make the bars increase in size when a user hover over them
// 3) Made a scatterplot using value as the x and value2 as the y and use the categories as some sort of visual encoding
