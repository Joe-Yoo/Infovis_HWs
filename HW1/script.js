// JavaScript starter file
console.log('Webpage loaded successfully!');

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    fetch('hw2-papers.csv')
        .then(response => response.text())
        .then(data => {
            const papers = parseCSV(data);
            console.log('Parsed papers:', papers);

            populatePapersTable(papers);
        })
        .catch(error => {
            console.error('Error loading CSV:', error);
        });
    
});

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
        });
        return obj;
    });
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

function populatePapersTable(papers) {
    const table = document.querySelector('.paper-table tbody');
    if (!table) {
        const paperTable = document.querySelector('.paper-table');
        const tbody = document.createElement('tbody');
        paperTable.appendChild(tbody);
    }
    
    const tbody = document.querySelector('.paper-table tbody');
    
    const groups = {};
    papers.forEach(paper => {
        const key = `${paper.Week}|${paper.Date}|${paper.Topic}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(paper);
    });
    
    Object.keys(groups).forEach(key => {
        const [week, date, topic] = key.split('|');
        const groupPapers = groups[key];
        
        groupPapers.forEach((paper, index) => {
            const row = document.createElement('tr');
            
            if (index === 0) {
                const weekCell = document.createElement('td');
                weekCell.textContent = week;
                weekCell.rowSpan = groupPapers.length;
                row.appendChild(weekCell);
                
                const dateCell = document.createElement('td');
                dateCell.textContent = date;
                dateCell.rowSpan = groupPapers.length;
                row.appendChild(dateCell);
                
                const topicCell = document.createElement('td');
                topicCell.textContent = topic;
                topicCell.rowSpan = groupPapers.length;
                row.appendChild(topicCell);
            }
            
            const paperCell = document.createElement('td');
            paperCell.textContent = paper.Paper || '';
            row.appendChild(paperCell);
            
            const linkCell = document.createElement('td');
            if (paper.Link) {
                const link = document.createElement('a');
                link.href = paper.Link;
                link.textContent = 'Link';
                link.target = '_blank';
                linkCell.appendChild(link);
            }
            row.appendChild(linkCell);
            
            tbody.appendChild(row);
        });
    });
}
