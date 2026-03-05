
function getCategoryTotals() {
    const categories = ["FAANG", "Finance", "Aerospace", "AI Startups", "Enterprise"];
    const totals = categories.map(category => {
        const companies = rejectionData.filter(d => d.Category === category);
        const totalRejections = companies.reduce ((sum, company) => sum + company.Rejections, 0);
        return { Category: category, Company: category, Rejection: totalRejections }
    });
    return totals;
}

function updateChart(data) {
    for (let i = 0; i < 5; i++) {
        const bar = document.getElementsById(`bar-${i+1}`);

        const rect = document.getElementsByTagName('rect')[0];
        const label = document.getElementsByTagName('text')[0];

        label.textContent = data[i].Company;
        const barHeight = data[i].Rejections;
        rect.setAttribute('height', barHeight);
        rect.setAttribute('transform', `translate(0, ${-barHeight}`);
    }
}

const categorySelector = document.getElementById('category-select');

categorySelector.addEventListener('change', (e) => {
    const category = e.target.value;

    // Code for how to handle category selection goes here!
    if (category === 'all') {
        const totals = getCategoryTotals();
        updateChart(totals);
    } else {
        const values = rejectionData.filter(d => d.Catgeory === category);
        updateChart(values);
    }
});
