const padding = 80;
const width = 700; 
const height = 500;

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const margin = { top: 20, right: 20, bottom: 40, left: 50 };

d3.csv("atl_weather_20to22.csv").then(data => {
    data = data.map(d => ({
        City: d.City,
        Date: new Date(d.Date),
        Precip: +d.Precip,
        Weather: d.Weather,
        Dewpoint: +d.Dewpoint,
        Pressure: +d.Pressure,
        Visibility: +d.Visibility,
        Windspeed: +d.Windspeed,
        MaxSpeed: +d.MaxSpeed,
        TempMax: +d.TempMax,
        TempMin: +d.TempMin
    }));

    drawBarChart(data);
    drawScatterplot(data);
    drawLineGraph(data);
    drawCalendar(data);
});