class MonteCarloSimulation {
    constructor() {
        this.chart = null;
        this.simulationData = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('runSimulation').addEventListener('click', () => this.runSimulation());
        document.getElementById('showUnlikelyOutcomes').addEventListener('change', () => this.updateChart());
        
        // CSV upload
        document.getElementById('csvFile').addEventListener('change', (event) => this.handleCSVUpload(event));
        
        // Google Sheets button
        document.getElementById('googleSheetsBtn').addEventListener('click', () => this.handleGoogleSheetsConnection());
        
        // Use calculated stats button
        document.getElementById('useCalculatedStats').addEventListener('click', () => this.useCalculatedStats());
        
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.clearError(input.id));
        });
    }

    validateInputs() {
        const inputs = {
            startingBankroll: document.getElementById('startingBankroll').value,
            hourlyWinRate: document.getElementById('hourlyWinRate').value,
            standardDeviation: document.getElementById('standardDeviation').value,
            hoursToSimulate: document.getElementById('hoursToSimulate').value,
            numberOfSimulations: document.getElementById('numberOfSimulations').value
        };

        let isValid = true;

        Object.entries(inputs).forEach(([key, value]) => {
            const errorElement = document.getElementById(key + 'Error');
            
            if (value === '' || isNaN(value)) {
                errorElement.textContent = 'Please enter a valid number';
                isValid = false;
            } else {
                const numValue = parseFloat(value);
                
                if (key === 'startingBankroll' && numValue <= 0) {
                    errorElement.textContent = 'Starting bankroll must be positive';
                    isValid = false;
                } else if (key === 'standardDeviation' && numValue < 0) {
                    errorElement.textContent = 'Standard deviation cannot be negative';
                    isValid = false;
                } else if (key === 'hoursToSimulate' && (numValue < 1 || numValue > 2000)) {
                    errorElement.textContent = 'Hours must be between 1 and 2000';
                    isValid = false;
                } else if (key === 'numberOfSimulations' && (numValue < 1 || numValue > 1000)) {
                    errorElement.textContent = 'Simulations must be between 1 and 1000';
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    clearError(inputId) {
        document.getElementById(inputId + 'Error').textContent = '';
    }

    clearAllErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => element.textContent = '');
    }

    getParameters() {
        return {
            startingBankroll: parseFloat(document.getElementById('startingBankroll').value),
            hourlyWinRate: parseFloat(document.getElementById('hourlyWinRate').value),
            standardDeviation: parseFloat(document.getElementById('standardDeviation').value),
            hoursToSimulate: parseInt(document.getElementById('hoursToSimulate').value),
            numberOfSimulations: parseInt(document.getElementById('numberOfSimulations').value)
        };
    }

    normalRandom() {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    runSingleSimulation(params) {
        const { startingBankroll, hourlyWinRate, standardDeviation, hoursToSimulate } = params;
        const bankrollHistory = [startingBankroll];
        let currentBankroll = startingBankroll;

        for (let hour = 1; hour <= hoursToSimulate; hour++) {
            const randomComponent = this.normalRandom() * standardDeviation;
            const hourlyResult = hourlyWinRate + randomComponent;
            currentBankroll += hourlyResult;
            
            if (currentBankroll <= 0) {
                currentBankroll = 0;
                for (let remainingHour = hour; remainingHour <= hoursToSimulate; remainingHour++) {
                    bankrollHistory.push(0);
                }
                break;
            }
            
            bankrollHistory.push(currentBankroll);
        }

        return bankrollHistory;
    }

    calculatePercentiles(allSimulations, hoursToSimulate) {
        const percentiles = {
            p2_5: [],
            p97_5: []
        };

        for (let hour = 0; hour <= hoursToSimulate; hour++) {
            const valuesAtHour = allSimulations.map(sim => sim[hour]).sort((a, b) => a - b);
            
            const p2_5_index = Math.floor(valuesAtHour.length * 0.025);
            const p97_5_index = Math.floor(valuesAtHour.length * 0.975);
            
            percentiles.p2_5.push(valuesAtHour[p2_5_index]);
            percentiles.p97_5.push(valuesAtHour[p97_5_index]);
        }

        return percentiles;
    }

    isOutsidePercentile(simulation, percentiles) {
        const finalValue = simulation[simulation.length - 1];
        const finalP2_5 = percentiles.p2_5[percentiles.p2_5.length - 1];
        const finalP97_5 = percentiles.p97_5[percentiles.p97_5.length - 1];
        
        return finalValue < finalP2_5 || finalValue > finalP97_5;
    }

    async runSimulation() {
        if (!this.validateInputs()) {
            return;
        }

        const params = this.getParameters();
        
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';

        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const allSimulations = [];
            
            for (let i = 0; i < params.numberOfSimulations; i++) {
                const simulation = this.runSingleSimulation(params);
                allSimulations.push(simulation);
            }

            const percentiles = this.calculatePercentiles(allSimulations, params.hoursToSimulate);

            this.simulationData = {
                simulations: allSimulations,
                percentiles: percentiles,
                parameters: params
            };

            this.displayResults();
            
        } catch (error) {
            console.error('Simulation error:', error);
            alert('An error occurred during simulation. Please try again.');
        } finally {
            document.getElementById('loadingIndicator').style.display = 'none';
        }
    }

    displayResults() {
        const { parameters } = this.simulationData;
        
        document.getElementById('currentParameters').innerHTML = `
            <div class="parameter-display">
                <div class="parameter-item">
                    <div class="parameter-label">Starting Bankroll</div>
                    <div class="parameter-value">${this.formatCurrency(parameters.startingBankroll)}</div>
                </div>
                <div class="parameter-item">
                    <div class="parameter-label">Hourly Win Rate</div>
                    <div class="parameter-value">${this.formatCurrency(parameters.hourlyWinRate)}</div>
                </div>
                <div class="parameter-item">
                    <div class="parameter-label">Standard Deviation</div>
                    <div class="parameter-value">${this.formatCurrency(parameters.standardDeviation)}</div>
                </div>
                <div class="parameter-item">
                    <div class="parameter-label">Hours Simulated</div>
                    <div class="parameter-value">${parameters.hoursToSimulate.toLocaleString()}</div>
                </div>
                <div class="parameter-item">
                    <div class="parameter-label">Number of Simulations</div>
                    <div class="parameter-value">${parameters.numberOfSimulations.toLocaleString()}</div>
                </div>
            </div>
        `;

        this.createChart();
        this.displayInterpretation();
        document.getElementById('resultsSection').style.display = 'block';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    createChart() {
        const ctx = document.getElementById('simulationChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: this.getChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monte Carlo Bankroll Simulation',
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Hours',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Bankroll Amount',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat(undefined, {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value);
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 1
                    },
                    point: {
                        radius: 0
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }

    getChartData() {
        const { simulations, percentiles, parameters } = this.simulationData;
        const showUnlikelyOutcomes = document.getElementById('showUnlikelyOutcomes').checked;
        
        const hours = Array.from({length: parameters.hoursToSimulate + 1}, (_, i) => i);
        
        const datasets = [];

        datasets.push({
            label: '95th Percentile Range',
            data: percentiles.p97_5,
            fill: '+1',
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            borderColor: 'rgba(255, 215, 0, 0.5)',
            borderWidth: 1,
            pointRadius: 0,
            order: 1
        });

        datasets.push({
            label: '5th Percentile',
            data: percentiles.p2_5,
            fill: false,
            backgroundColor: 'rgba(255, 215, 0, 0.2)',
            borderColor: 'rgba(255, 215, 0, 0.5)',
            borderWidth: 1,
            pointRadius: 0,
            order: 2
        });

        const simulationsToShow = showUnlikelyOutcomes ? 
            simulations : 
            simulations.filter(sim => !this.isOutsidePercentile(sim, percentiles));

        simulationsToShow.forEach((simulation, index) => {
            const isUnlikely = this.isOutsidePercentile(simulation, percentiles);
            
            datasets.push({
                label: `Simulation ${index + 1}`,
                data: simulation,
                borderColor: isUnlikely ? 'rgba(255, 99, 132, 0.3)' : 'rgba(54, 162, 235, 0.3)',
                backgroundColor: 'transparent',
                borderWidth: 1,
                pointRadius: 0,
                order: 3
            });
        });

        return {
            labels: hours,
            datasets: datasets
        };
    }

    updateChart() {
        if (this.chart && this.simulationData) {
            this.chart.data = this.getChartData();
            this.chart.update();
        }
    }

    displayInterpretation() {
        const { simulations, parameters } = this.simulationData;
        
        const finalValues = simulations.map(sim => sim[sim.length - 1]);
        const sortedFinalValues = [...finalValues].sort((a, b) => a - b);
        
        const bestCase = Math.max(...finalValues);
        const worstCase = Math.min(...finalValues);
        const medianValue = sortedFinalValues[Math.floor(sortedFinalValues.length / 2)];
        
        const bankruptcyCount = finalValues.filter(value => value === 0).length;
        const bankruptcyProbability = (bankruptcyCount / simulations.length) * 100;
        
        const expectedFinalValue = parameters.startingBankroll + (parameters.hourlyWinRate * parameters.hoursToSimulate);
        
        document.getElementById('mostLikelyOutcome').innerHTML = `
            <p>Based on your expected hourly win rate, you would most likely end with:</p>
            <div class="outcome-value">${this.formatCurrency(expectedFinalValue)}</div>
            <p>The median result from all simulations was:</p>
            <div class="outcome-value">${this.formatCurrency(medianValue)}</div>
        `;
        
        document.getElementById('bestCaseScenario').innerHTML = `
            <p>In the best simulation, your bankroll grew to:</p>
            <div class="outcome-value">${this.formatCurrency(bestCase)}</div>
            <p>This represents a gain of ${this.formatCurrency(bestCase - parameters.startingBankroll)} over ${parameters.hoursToSimulate} hours.</p>
        `;
        
        if (worstCase === 0) {
            document.getElementById('worstCaseScenario').innerHTML = `
                <p>In the worst simulation, you went broke (bankroll reached $0).</p>
                <div class="outcome-value">$0</div>
                <p>This represents a complete loss of your ${this.formatCurrency(parameters.startingBankroll)} starting bankroll.</p>
            `;
        } else {
            document.getElementById('worstCaseScenario').innerHTML = `
                <p>In the worst simulation, your bankroll dropped to:</p>
                <div class="outcome-value">${this.formatCurrency(worstCase)}</div>
                <p>This represents a loss of ${this.formatCurrency(parameters.startingBankroll - worstCase)} from your starting bankroll.</p>
            `;
        }
        
        let riskClass = 'risk-low';
        let riskDescription = 'Low Risk';
        let riskExplanation = 'You have a very low chance of going broke with this bankroll.';
        
        if (bankruptcyProbability > 20) {
            riskClass = 'risk-high';
            riskDescription = 'High Risk';
            riskExplanation = 'Your bankroll may be too small for this level of play.';
        } else if (bankruptcyProbability > 5) {
            riskClass = 'risk-medium';
            riskDescription = 'Medium Risk';
            riskExplanation = 'Consider increasing your bankroll or playing lower stakes.';
        }
        
        document.getElementById('riskAssessment').innerHTML = `
            <p><span class="${riskClass}">${riskDescription}</span></p>
            ${bankruptcyProbability > 0 ? 
                `<div class="outcome-value ${riskClass}">${bankruptcyProbability.toFixed(1)}%</div>
                <p>chance of going broke</p>` :
                `<div class="outcome-value ${riskClass}">0%</div>
                <p>chance of going broke</p>`
            }
            <p>${riskExplanation}</p>
        `;
    }

    // CSV Upload and Processing Methods
    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvData = this.parseCSV(e.target.result);
                const stats = this.calculateStatsFromData(csvData);
                this.displayCalculatedStats(stats);
            } catch (error) {
                alert('Error parsing CSV file. Please check the format and try again.');
                console.error('CSV parsing error:', error);
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Find column indices
        const dateIndex = this.findColumnIndex(headers, ['date']);
        const hoursIndex = this.findColumnIndex(headers, ['hours', 'time']);
        const winLossIndex = this.findColumnIndex(headers, ['win/loss', 'win/lose', 'result', 'profit']);
        const buyInIndex = this.findColumnIndex(headers, ['buy in', 'buyin', 'buy-in']);
        const cashOutIndex = this.findColumnIndex(headers, ['cash out', 'cashout', 'cash-out']);
        
        if (hoursIndex === -1) {
            throw new Error('Hours column not found');
        }
        
        // Need either win/loss column OR both buy-in and cash-out
        if (winLossIndex === -1 && (buyInIndex === -1 || cashOutIndex === -1)) {
            throw new Error('Win/Loss column or Buy-in/Cash-out columns not found');
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',').map(cell => cell.trim());
            if (row.length < headers.length) continue;
            
            const hours = parseFloat(row[hoursIndex]);
            if (isNaN(hours) || hours <= 0) continue;
            
            let winLoss;
            if (winLossIndex !== -1) {
                winLoss = parseFloat(row[winLossIndex].replace(/[$,]/g, ''));
            } else {
                const buyIn = parseFloat(row[buyInIndex].replace(/[$,]/g, ''));
                const cashOut = parseFloat(row[cashOutIndex].replace(/[$,]/g, ''));
                winLoss = cashOut - buyIn;
            }
            
            if (isNaN(winLoss)) continue;
            
            const hourlyRate = winLoss / hours;
            data.push({
                date: dateIndex !== -1 ? row[dateIndex] : null,
                hours: hours,
                winLoss: winLoss,
                hourlyRate: hourlyRate
            });
        }
        
        if (data.length === 0) {
            throw new Error('No valid data rows found');
        }
        
        return data;
    }

    findColumnIndex(headers, possibleNames) {
        for (let name of possibleNames) {
            const index = headers.findIndex(h => h.includes(name));
            if (index !== -1) return index;
        }
        return -1;
    }

    calculateStatsFromData(data) {
        const totalHours = data.reduce((sum, row) => sum + row.hours, 0);
        const totalWinLoss = data.reduce((sum, row) => sum + row.winLoss, 0);
        const hourlyWinRate = totalWinLoss / totalHours;
        
        // Calculate standard deviation of hourly rates
        const hourlyRates = data.map(row => row.hourlyRate);
        const mean = hourlyRates.reduce((sum, rate) => sum + rate, 0) / hourlyRates.length;
        const variance = hourlyRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / hourlyRates.length;
        const standardDeviation = Math.sqrt(variance);
        
        return {
            totalSessions: data.length,
            totalHours: totalHours,
            totalWinLoss: totalWinLoss,
            hourlyWinRate: hourlyWinRate,
            standardDeviation: standardDeviation,
            winningSessionsPercent: (data.filter(row => row.winLoss > 0).length / data.length) * 100
        };
    }

    displayCalculatedStats(stats) {
        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Total Sessions</div>
                <div class="stat-value">${stats.totalSessions}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Hours</div>
                <div class="stat-value">${stats.totalHours.toFixed(1)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Win/Loss</div>
                <div class="stat-value">${this.formatCurrency(stats.totalWinLoss)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Hourly Win Rate</div>
                <div class="stat-value">${this.formatCurrency(stats.hourlyWinRate)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Standard Deviation</div>
                <div class="stat-value">${this.formatCurrency(stats.standardDeviation)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Winning Sessions</div>
                <div class="stat-value">${stats.winningSessionsPercent.toFixed(1)}%</div>
            </div>
        `;
        
        // Store calculated stats for use
        this.calculatedStats = stats;
        
        // Show results section
        document.getElementById('uploadResults').style.display = 'block';
    }

    useCalculatedStats() {
        if (!this.calculatedStats) return;
        
        const stats = this.calculatedStats;
        document.getElementById('hourlyWinRate').value = stats.hourlyWinRate.toFixed(2);
        document.getElementById('standardDeviation').value = stats.standardDeviation.toFixed(2);
        
        // Scroll to parameters section
        document.querySelector('.parameters-section').scrollIntoView({ behavior: 'smooth' });
        
        // Clear any existing errors
        this.clearAllErrors();
        
        alert('Parameters updated with your calculated statistics!');
    }

    handleGoogleSheetsConnection() {
        // For now, show instructions for Google Sheets integration
        alert(`Google Sheets Integration Instructions:

1. Export your Google Sheet as CSV:
   - Open your Google Sheet
   - Go to File → Download → Comma-separated values (.csv)
   - Save the file to your computer

2. Use the "Upload CSV File" button above to upload the downloaded file

Note: Direct Google Sheets integration requires API setup and authentication. For now, please use the CSV export method.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MonteCarloSimulation();
});