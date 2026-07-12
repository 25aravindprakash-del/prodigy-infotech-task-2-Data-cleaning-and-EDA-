// Global Variables for App Data and Chart References
let appData = null;
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    loadDashboardData();
    initCalculator();
});

// 1. Tab Navigation System
function initTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Toggle buttons
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle panes
            tabPanes.forEach(pane => {
                if (pane.id === targetTab) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
}

// 2. Fetch and Load Stats
async function loadDashboardData() {
    try {
        const response = await fetch('cleaned_data.json');
        appData = await response.json();
        
        populateOverviewStats(appData);
        populateCleaningTable(appData);
        renderCharts(appData);
        populatePassengerTable(appData.passengers);
        initPassengerSearch();
    } catch (error) {
        console.error('Error loading dataset stats:', error);
    }
}

// 3. Populate Overview KPIs
function populateOverviewStats(data) {
    document.getElementById('stat-total').innerText = data.overall.total.toLocaleString();
    document.getElementById('stat-survived').innerText = data.overall.survived.toLocaleString();
    document.getElementById('stat-died').innerText = data.overall.died.toLocaleString();
    document.getElementById('stat-rate').innerText = data.overall.rate.toFixed(1) + '%';
}

// 4. Populate Cleaning Steps Table
function populateCleaningTable(data) {
    const tableBody = document.getElementById('cleaning-table-body');
    tableBody.innerHTML = '';

    const resolutionMap = {
        'Age': 'Restored with Median Age (28.0)',
        'Cabin': 'Assigned to Deck (Extracted prefix)',
        'Embarked': 'Reconciled with Southampton mode ("S")',
        'PassengerId': 'Retained',
        'Survived': 'Survival Status',
        'Pclass': 'Retained',
        'Name': 'Retained',
        'Sex': 'Retained',
        'SibSp': 'Used for FamilySize calculation',
        'Parch': 'Used for FamilySize calculation',
        'Ticket': 'Retained',
        'Fare': 'Retained'
    };

    Object.keys(data.missing_before).forEach(col => {
        const before = data.missing_before[col];
        const after = data.missing_after[col] || 0;
        if (before > 0 || col === 'Age' || col === 'Cabin' || col === 'Embarked') {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${col}</strong></td>
                <td style="color: var(--theme-red); font-weight: bold;">${before}</td>
                <td style="color: var(--theme-green); font-weight: bold;">${after}</td>
                <td>${resolutionMap[col] || 'Retained'}</td>
            `;
            tableBody.appendChild(tr);
        }
    });
}

// 5. Render Chart.js Visualizations
function renderCharts(data) {
    // Shared Chart.js Options
    Chart.defaults.color = '#6e5e54';
    Chart.defaults.font.family = 'Playfair Display, Georgia, serif';

    // A. Pie Chart
    const pieCtx = document.getElementById('overviewPieChart').getContext('2d');
    charts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Deceased', 'Survived'],
            datasets: [{
                data: [data.overall.died, data.overall.survived],
                backgroundColor: ['#9e2a2b', '#2b5c3f'],
                borderColor: '#fdfbf7',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // B. Gender Survival rate
    const genderCtx = document.getElementById('genderBarChart').getContext('2d');
    charts.gender = new Chart(genderCtx, {
        type: 'bar',
        data: {
            labels: data.by_sex.map(x => x.Sex.charAt(0).toUpperCase() + x.Sex.slice(1)),
            datasets: [{
                label: 'Survival Rate (%)',
                data: data.by_sex.map(x => x.SurvivalRate),
                backgroundColor: ['#9e2a2b', '#2b5c3f'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100 }
            }
        }
    });

    // C. Pclass Survival rate
    const classCtx = document.getElementById('classBarChart').getContext('2d');
    charts.class = new Chart(classCtx, {
        type: 'bar',
        data: {
            labels: data.by_class.map(x => 'Class ' + x.Pclass),
            datasets: [{
                label: 'Survival Rate (%)',
                data: data.by_class.map(x => x.SurvivalRate),
                backgroundColor: ['#2b5c3f', '#cfc2a9', '#9e2a2b'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100 }
            }
        }
    });

    // D. Age Group Survival rate
    const ageCtx = document.getElementById('ageGroupChart').getContext('2d');
    charts.age = new Chart(ageCtx, {
        type: 'bar',
        data: {
            labels: data.by_age.map(x => x.AgeGroup),
            datasets: [{
                label: 'Survival Rate (%)',
                data: data.by_age.map(x => x.SurvivalRate),
                backgroundColor: '#2b5c3f',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100 }
            }
        }
    });

    // E. Correlation Heatmap
    const corrCtx = document.getElementById('correlationHeatmap').getContext('2d');
    const labels = data.corr_matrix.columns;
    const values = data.corr_matrix.values;

    charts.corr = new Chart(corrCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: labels.map((col, idx) => {
                return {
                    label: col,
                    data: values[idx],
                    backgroundColor: values[idx].map(val => {
                        if (val > 0) return `rgba(43, 92, 63, ${val})`; // antique green gradient
                        if (val < 0) return `rgba(158, 42, 43, ${Math.abs(val)})`; // antique red gradient
                        return 'rgba(207, 194, 169, 0.2)'; // neutral antique paper color
                    })
                };
            })
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: -1, max: 1 }
            }
        }
    });
}

// 6. Passengers Data Table Rendering
function populatePassengerTable(passengers) {
    const tbody = document.getElementById('passengers-table-body');
    tbody.innerHTML = '';

    passengers.forEach(p => {
        const tr = document.createElement('tr');
        const survivedLabel = p.Survived === 1 ? '<span style="color: var(--theme-green); font-weight: bold;">Survived</span>' : '<span style="color: var(--theme-red); font-weight: bold;">Deceased</span>';
        
        tr.innerHTML = `
            <td>${p.Pclass}</td>
            <td>${p.Name}</td>
            <td>${p.Sex}</td>
            <td>${Math.round(p.Age)}</td>
            <td>${p.SibSp}</td>
            <td>${p.Parch}</td>
            <td>$${p.Fare.toFixed(2)}</td>
            <td>${p.Embarked}</td>
            <td>${survivedLabel}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 7. Passengers Filter/Search
function initPassengerSearch() {
    const searchInput = document.getElementById('table-search');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = appData.passengers.filter(p => {
            return p.Name.toLowerCase().includes(query) || 
                   p.Sex.toLowerCase().includes(query) ||
                   p.Cabin.toLowerCase().includes(query);
        });
        populatePassengerTable(filtered);
    });
}

// 8. Interactive Survival Prediction Calculator
function initCalculator() {
    const form = document.getElementById('calculator-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const sex = document.getElementById('calc-sex').value;
        const pclass = parseInt(document.getElementById('calc-class').value);
        const age = parseInt(document.getElementById('calc-age').value);
        const family = parseInt(document.getElementById('calc-family').value);
        const embarked = document.getElementById('calc-embarked').value;

        // Model Prediction Logic (Titanic heuristics)
        let prob = 0.0;

        // 1. Gender Bias
        if (sex === 'female') {
            prob = 0.74; // Female baseline
            if (pclass === 3) prob -= 0.24; // 3rd class penalty
            if (pclass === 1) prob += 0.20; // 1st class boost
        } else {
            prob = 0.18; // Male baseline
            if (pclass === 1) prob += 0.22; // 1st class male boost
            if (age < 12) prob += 0.35;    // Young boys survival boost
        }

        // 2. Family influence
        if (family >= 1 && family <= 3) {
            prob += 0.10; // Medium families survival bonus
        } else if (family > 4) {
            prob -= 0.15; // Large families penalty
        }

        // 3. Port of Embarkation
        if (embarked === 'C') prob += 0.05; // Cherbourg passenger advantage

        // Clamp prob between 2% and 98%
        prob = Math.max(0.02, Math.min(0.98, prob)) * 100;

        // Display results
        const resultBox = document.getElementById('calc-result-box');
        const resultStatus = document.getElementById('result-status');
        const resultPercent = document.getElementById('result-percent');
        const resultDetails = document.getElementById('result-details');

        resultPercent.innerText = prob.toFixed(0) + '%';
        
        if (prob >= 50) {
            resultBox.className = 'result-box survived-result';
            resultStatus.innerText = 'HIGH PROBABILITY OF SURVIVAL';
            resultDetails.innerText = `Archival logs show that travelers fitting this demographic profile had a high survival rate (${prob.toFixed(0)}%). Prioritized boarding and life-raft access for upper decks significantly favored these travelers.`;
            resultBox.querySelector('.result-icon').innerText = '💚';
        } else {
            resultBox.className = 'result-box deceased-result';
            resultStatus.innerText = 'LOW PROBABILITY OF SURVIVAL';
            resultDetails.innerText = `Archival records show that passengers fitting these parameters faced a high rate of casualty (${(100 - prob).toFixed(0)}%). Access restrictions on lower decks and evacuation orders for adult males resulted in low survival rates.`;
            resultBox.querySelector('.result-icon').innerText = '💀';
        }
    });
}
