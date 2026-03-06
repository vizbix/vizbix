// =========================================
// charts.js - Chart.js Visualization Logic
// =========================================

window.chartInstance = null;

// Register the datalabels plugin globally
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

window.drawChart = function(type, labels, data, colors){ 
    // Destroy the old chart if it exists so they don't overlap
    if(window.chartInstance) {
        window.chartInstance.destroy(); 
    }
    
    const canvas = document.getElementById("chart");
    if(!canvas) return;
    
    const ctx = canvas.getContext('2d'); 
    
    const options = { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
            legend: { 
                display: type === 'pie', 
                position: 'bottom' 
            }, 
            datalabels: { 
                color: type === 'pie' ? 'white' : '#64748B', 
                font: { weight: 'bold', size: 11 }, 
                formatter: (value) => '₹' + value.toLocaleString(undefined, {maximumFractionDigits:0}), 
                anchor: type === 'pie' ? 'center' : 'end', 
                align: type === 'pie' ? 'center' : 'top', 
                offset: 4 
            } 
        } 
    };
    
    if (type === 'bar') {
        options.scales = { 
            y: { beginAtZero: true }, 
            x: { grid: { display: false } } 
        };
    }
    
    window.chartInstance = new Chart(ctx, { 
        type: type, 
        data: { 
            labels: labels, 
            datasets: [{ 
                label: 'Profit', 
                data: data, 
                backgroundColor: colors, 
                borderRadius: 4, 
                borderWidth: 0 
            }] 
        }, 
        options: options, 
        plugins: [ChartDataLabels] 
    }); 
};