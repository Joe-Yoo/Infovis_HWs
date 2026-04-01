// Margins, Width, and Height
const margin = 
    {
        top: 30, 
        right: 30, 
        bottom: 60, 
        left: 70
    },
      width = 460 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

// Let's load our data!
d3.csv("drinks.csv").then(data => {
    // For this lab we're just going to keep a hardcoded array of the CSV columns
    const cols = ["Caffeine", "Sugar", "Calories", "Price", "VitaminB12"];
    // Iterate through all of the columns and clean them (turn the strings into numbers)
    data.forEach(d => {
        cols.forEach(col => d[col] = +d[col]);
    });

    // Establish our color scale to use for our Category variable
    const colorScale = d3.scaleOrdinal()
        .domain(["Normal", "Sugar-Free"])
        .range(["#e67e22", "#27ae60"]);


    // Our default axes
    let currentX = "Caffeine";
    let currentY = "Sugar";
    let currentBar = "Calories";

    // Select all of the dropdown menus and get the values
    d3.select("#select-x-scatter")
        .selectAll("option")
        .data(cols)
        .enter()
        .append("option")
        .text(d => d)
        .property("selected", d => d === currentX);
    d3.select("#select-y-scatter")
        .selectAll("option")
        .data(cols)
        .enter()
        .append("option")
        .text(d => d)
        .property("selected", d => d === currentY);
    d3.select("#select-x-bar")
        .selectAll("option")
        .data(cols)
        .enter()
        .append("option")
        .text(d => d)
        .property("selected", d => d === currentBar);

    // Set the axes scales for the scatterplot
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[currentX])])
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[currentY])])
        .range([height, 0]);

    // Select our scatterplot div
    const scatterSvg = d3.select("#scatterplot").append("svg")
        // Set the height, width, and margins based on our earlier properties
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Group the axes (necessary for when we swap them out!)
    const xAxisG = scatterSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
    const yAxisG = scatterSvg.append("g")
        .call(d3.axisLeft(yScale));

    // Let's add our dots!
    const dots = scatterSvg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        // Set the x and y coordinate based on the current axes we're using
        .attr("cx", d => xScale(d[currentX]))
        .attr("cy", d => yScale(d[currentY]))
        .attr("r", 6)
        // Color according to its category
        .attr("fill", d => colorScale(d.Category));

    // Set the axes scales for the barchart
    const xBarScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[currentBar])])
        .range([0, 300]);
    // Our y axis for this chart is always going to be the brand!
    const yBarScale = d3.scaleBand()
        .domain(data.map(d => d.Brand))
        .range([0, height])
        .padding(0.2);

    // Select our barchart div and set the width, height, and margins like before
    const barSvg = d3.select("#barchart")
        .append("svg")
        .attr("width", 550)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(160,${margin.top})`);

    // Group the x axes for when it gets switched out later
    const xBarAxisG = barSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xBarScale));
    barSvg.append("g")
        .call(d3.axisLeft(yBarScale));

    // Let's add our bars!
    const bars = barSvg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => yBarScale(d.Brand))
        .attr("width", d => xBarScale(d[currentBar])).attr("height", yBarScale.bandwidth())
        .attr("fill", d => colorScale(d.Category));

    // Method to update our scatterplot when the axes change
    function updateScatter() {
        // Set the scale based on the current variable on each axes
        xScale.domain([0, d3.max(data, d => d[currentX])]);
        yScale.domain([0, d3.max(data, d => d[currentY])]);

        // Simple transition to make the change between axes smooth
        xAxisG.transition()
            .duration(800)
            .call(d3.axisBottom(xScale));
        yAxisG.transition()
            .duration(800)
            .call(d3.axisLeft(yScale));
        dots.transition().duration(800)
            .attr("cx", d => xScale(d[currentX]))
            .attr("cy", d => yScale(d[currentY]));
    }

    // Method to update our barchart when the axis changes
    function updateBar() {
        // Set the scale based on the current variable on the axis
        xBarScale.domain([0, d3.max(data, d => d[currentBar])]);

        // Simple transition to make the axis change smooth
        xBarAxisG.transition()
            .duration(800)
            .call(d3.axisBottom(xBarScale));
        bars.transition()
            .duration(800)
            .attr("width", d => xBarScale(d[currentBar]));
    }

    // Select all of the dropdowns, and add an event listener for when they change
    d3.select("#select-x-scatter")
        .on("change", (e) => { 
            // Get the new axis label and update the scatterplot
            currentX = e.target.value; updateScatter(); 
        });
    d3.select("#select-y-scatter")
        .on("change", (e) => { 
            // Get the new axis label and update the scatterplot
            currentY = e.target.value; updateScatter(); 
        });
    d3.select("#select-x-bar")
        .on("change", (e) => { 
            // Get the new axis label and update the barchart
            currentBar = e.target.value; updateBar(); 
        });

    // Our brush!!
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        // When we're done brushing
        .on("brush end", (e) => {
            // Get all of the things that were selected
            const s = e.selection;
            // If they don't select anything (i.e., they're just clicking the background)
            if (!s) { 
                // "Reset" the dots and the bars to max opacity
                dots.style("opacity", 1); 
                bars.style("opacity", 1); 
            }
            // Otherwise, if they do make a selection
            else {
                // Get the box of the selection
                const [[x0, y0], [x1, y1]] = s;
                // If there are any dots in the selection, leave them at full opacity, hide the others a little
                dots.style("opacity", function(d) {
                    const cx = +d3.select(this).attr("cx");
                    const cy = +d3.select(this).attr("cy");
                    const isSelected = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                    // Look for the bars that corresponds to the selected dots and leave them at full opacity, hide the others a little
                    d3.select(bars.nodes()[data.indexOf(d)]).style("opacity", isSelected ? 1 : 0.1);
                    return isSelected ? 1 : 0.15;
                });
            }
        });
    scatterSvg.append("g").attr("class", "brush").call(brush);

    // Select the search div, on text input
    d3.select("#search").on("input", (e) => {
        // Get the query and turn the values to all lowercase
        const q = e.target.value.toLowerCase();
        // For any dots that have corresponding brand names that include the query, increase their size and add a white circle to differentiate
        dots.attr("r", d => d.Brand.toLowerCase().includes(q) && q !== "" ? 12 : 6)
            .attr("stroke", d => d.Brand.toLowerCase().includes(q) && q !== "" ? "black" : "#fff");
    });
});


// CLASS ACTIVITY!!! (These generally get a little harder as you go down the list)

// 1) Throwback to the axes lab, try adding a legend and an additional Ordinal Scale to differentiate by Category

// 2) Try adding some dropdowns to swap the X and Y axes for the scatterplot (and/or the Y axis for the barchart)!

// 3) Add a search bar! Let users type in the name of an energy drink and have it highlight on the scatterplot
