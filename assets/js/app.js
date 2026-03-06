// =========================================
// app.js - Core UI and Calculation Logic
// =========================================

// --- GLOBAL STATE ---
window.currentData = [];
window.monthlyStats = null;
window.currentMode = 'product';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Slight delay ensures the HTML from drawer.js has settled
    setTimeout(() => {
        if(document.getElementById("items")) {
            window.loadDrafts();
        }
    }, 100);
});

window.setMode = function(mode) {
    window.currentMode = mode;
    document.getElementById('btnProduct').className = mode === 'product' ? 'mode-btn active' : 'mode-btn';
    document.getElementById('btnMonthly').className = mode === 'monthly' ? 'mode-btn active' : 'mode-btn';
    document.getElementById('productInputs').style.display = mode === 'product' ? 'block' : 'none';
    document.getElementById('monthlyInputs').style.display = mode === 'monthly' ? 'block' : 'none';
    
    const demoBtn = document.querySelector(".input-label[onclick='window.sample()']");
    if(demoBtn) demoBtn.style.display = mode === 'product' ? 'block' : 'none';
    
    const resultsDiv = document.getElementById('results');
    if (mode === 'monthly' && window.monthlyStats) {
        resultsDiv.style.display = 'block'; 
        window.analyzeMonthly();
    } else if (mode === 'product' && window.currentData.length > 0) {
        resultsDiv.style.display = 'block'; 
        window.analyzeProduct();
    } else {
        resultsDiv.style.display = 'none';
    }
};

window.createRow = function(container, name="", val1="", val2="", val3="", isMonth=false){
  const d = document.createElement("div"); d.className = "grid-row";
  const p1 = isMonth ? "Month (e.g. Jan)" : "Product Name";
  const p2 = isMonth ? "Sales ₹" : "Sell Price";
  const p3 = isMonth ? "Expenses ₹" : "Cost Price";
  const p4 = isMonth ? "Orders" : "Quantity";
  d.innerHTML = `
    <input type="text" placeholder="${p1}" value="${name}">
    <input type="number" placeholder="${p2}" value="${val1}">
    <input type="number" placeholder="${p3}" value="${val2}">
    <input type="number" placeholder="${p4}" value="${val3}">
    <button class="btn-ghost" onclick="this.parentElement.remove(); window.saveDraft()">✕</button>
  `;
  container.appendChild(d);
};

window.addRow = function(){ 
    window.createRow(document.getElementById("items")); 
    window.saveDraft(); 
};

window.addMonthRow = function(){ 
    window.createRow(document.getElementById("monthItems"), "", "", "", "", true); 
    window.saveDraft(); 
};

window.saveDraft = function() {
    window.localStorage.setItem("vizbix_draft", JSON.stringify(window.scrapeRows(document.getElementById("items"))));
    window.localStorage.setItem("vizbix_draft_month", JSON.stringify(window.scrapeRows(document.getElementById("monthItems"))));
};

window.loadDrafts = function() {
    const itemsContainer = document.getElementById("items");
    const monthContainer = document.getElementById("monthItems");
    if(!itemsContainer || !monthContainer) return;

    const prodSaved = JSON.parse(window.localStorage.getItem("vizbix_draft") || "[]");
    const monthSaved = JSON.parse(window.localStorage.getItem("vizbix_draft_month") || "[]");
    
    itemsContainer.innerHTML = ""; 
    monthContainer.innerHTML = "";
    
    if(prodSaved.length > 0) prodSaved.forEach(x => window.createRow(itemsContainer, x.n, x.v1, x.v2, x.v3)); 
    else { window.addRow(); window.addRow(); }
    
    if(monthSaved.length > 0) monthSaved.forEach(x => window.createRow(monthContainer, x.n, x.v1, x.v2, x.v3, true)); 
    else { window.addMonthRow(); window.addMonthRow(); }
};

window.scrapeRows = function(container) {
    if(!container) return [];
    let data = [];
    container.querySelectorAll(".grid-row").forEach(r => {
        const i = r.querySelectorAll("input");
        data.push({ n: i[0].value, v1: i[1].value, v2: i[2].value, v3: i[3].value });
    });
    return data;
};

window.sample = function(){
  const itemsContainer = document.getElementById("items");
  itemsContainer.innerHTML="";
  [["Wireless Earbuds", 2500, 1200, 140], ["Smart Watch", 4500, 2800, 85], ["USB-C Cable", 499, 150, 400]].forEach(x => window.createRow(itemsContainer, x[0], x[1], x[2], x[3]));
  window.saveDraft(); 
  window.analyze();
};

window.analyze = function(){ 
    if(window.currentMode === 'monthly') window.analyzeMonthly(); 
    else window.analyzeProduct(); 
};

window.analyzeMonthly = function() {
    const monthItems = document.getElementById("monthItems");
    let totalSales=0, totalExp=0, totalOrders=0, count=0;
    
    monthItems.querySelectorAll(".grid-row").forEach(r => {
        const i = r.querySelectorAll("input");
        const s = Number(i[1].value)||0, e = Number(i[2].value)||0, o = Number(i[3].value)||0;
        if(s>0 || e>0) { totalSales+=s; totalExp+=e; totalOrders+=o; count++; }
    });
    
    if(count === 0) return alert("Please enter data for at least one month.");
    
    const avgSales = totalSales / count; 
    const avgExp = totalExp / count; 
    const avgProfit = avgSales - avgExp;
    const avgOrders = totalOrders > 0 ? (totalOrders / count) : 0; 
    const avgAOV = avgOrders > 0 ? (avgSales / avgOrders) : 0;
    const margin = avgSales > 0 ? (avgProfit / avgSales * 100) : 0;
    
    window.monthlyStats = { avgSales, avgExp, avgProfit, avgOrders, avgAOV, margin, count };
    
    window.showResults();
    
    document.getElementById("kpiRevLabel").innerText = "AVG MONTHLY SALES"; 
    document.getElementById("kpiCostLabel").innerText = "AVG MONTHLY EXPENSES"; 
    document.getElementById("kpiProfitLabel").innerText = "AVG MONTHLY PROFIT";
    document.getElementById("dispRevenue").innerText = "₹ " + avgSales.toLocaleString(undefined, {maximumFractionDigits:0});
    document.getElementById("dispCost").innerText = "₹ " + avgExp.toLocaleString(undefined, {maximumFractionDigits:0});
    document.getElementById("dispProfit").innerText = "₹ " + avgProfit.toLocaleString(undefined, {maximumFractionDigits:0});
    document.getElementById("monthlyMetrics").style.display = "flex"; 
    document.getElementById("dispAOV").innerText = "₹ " + avgAOV.toFixed(0); 
    document.getElementById("dispOrders").innerText = avgOrders.toFixed(1);
    document.getElementById("tableContainer").style.display = "none";
    
    window.generateMonthlyInsights(margin, avgOrders, avgAOV, count);
    
    // Safety check: only draw chart if chart.js is loaded
    if(window.drawChart) {
        window.drawChart('pie', ['Expenses', 'Net Profit'], [avgExp, avgProfit], ['#F97316', '#10B981']);
    }
};

window.generateMonthlyInsights = function(margin, orders, aov, count) {
    const div = document.getElementById("insights"); 
    let statusTitle = ""; let statusColor = ""; let strategies = [];
    
    if (margin <= 0) { 
        statusTitle = "🚨 CRITICAL: You are losing money on every sale."; statusColor = "insight-orange"; 
        strategies = [`<strong>Stop Ads Immediately:</strong> You are burning cash. Pause all paid marketing until you fix your unit economics.`, `<strong>Price Audit:</strong> You need to raise prices by at least ${Math.abs(margin).toFixed(0)}% just to break even.`, `<strong>Cost Cutting:</strong> Negotiate with your supplier or switch to cheaper packaging immediately.`]; 
    } 
    else if (orders > 30 && margin < 15) { 
        statusTitle = "⚠ High Activity, Low Profit (The 'Busy Trap')"; statusColor = "insight-orange"; 
        strategies = [`<strong>Price Hike Test:</strong> You have volume leverage. Increase prices by 5-10%. You might lose a few customers, but total profit will likely go <i>up</i>.`, `<strong>Kill Low-Margin Best Sellers:</strong> If your most popular item has low margin, it is dragging you down. Bundle it with a high-margin accessory.`, `<strong>Supplier Negotiation:</strong> Since you are ordering ${orders.toFixed(0)} times a month, demand a bulk discount from your vendor.`]; 
    }
    else if (margin > 25 && orders < 10) { 
        statusTitle = "💎 Hidden Gem: Great Product, Needs Eyes"; statusColor = "insight-blue"; 
        strategies = [`<strong>Aggressive Marketing:</strong> Your margins are healthy (${margin.toFixed(0)}%). You can afford to spend more on ads to acquire customers.`, `<strong>Collect Social Proof:</strong> Email your ${orders.toFixed(0)} past customers personally. Ask for a photo review in exchange for a discount code.`, `<strong>Micro-Influencers:</strong> Send free samples to small influencers. Your high margin covers the cost, and you need the visibility.`]; 
    }
    else if (margin >= 20 && orders >= 10) { 
        statusTitle = "✅ Healthy Business: Time to Maximize"; statusColor = "insight-green"; 
        strategies = [`<strong>Increase AOV:</strong> Your flow is steady. Add a "One-Click Upsell" at checkout (e.g., a ₹299 accessory) to boost revenue by 15% without new customers.`, `<strong>Email Marketing:</strong> Don't just sell once. Send a "VIP Restock" or "New Arrival" email to your list this week.`, `<strong>Loyalty Loop:</strong> Insert a "Thank You" card with a 10% off coupon for their <i>next</i> order inside the box.`]; 
    }
    else { 
        statusTitle = "⚖️ Stable but Stagnant"; statusColor = "insight-blue"; 
        strategies = [`<strong>Bundle Builder:</strong> Create a "Starter Kit" or "Gift Bundle" priced at ₹${(aov * 1.5).toFixed(0)}. This forces AOV up.`, `<strong>Shipping Threshold:</strong> Set "Free Shipping" at ₹${(aov + 200).toFixed(0)} to encourage adding one more small item.`, `<strong>Follow Up:</strong> Send a WhatsApp message 7 days after delivery asking "How was it?" to build trust for repeat sales.`]; 
    }
    
    div.innerHTML = `<div class="insight-item ${statusColor}"><div><div style="font-size:14px; font-weight:800; margin-bottom:8px;">${statusTitle}</div><div style="margin-bottom:12px;">Based on your average of <strong>${orders.toFixed(1)} orders/mo</strong> and <strong>${margin.toFixed(0)}% margin</strong>:</div><ul style="margin:0; padding-left:18px; line-height:1.6;"><li style="margin-bottom:6px;">${strategies[0]}</li><li style="margin-bottom:6px;">${strategies[1]}</li><li>${strategies[2]}</li></ul></div></div>${window.getAiButtonHtml ? window.getAiButtonHtml() : ''}`;
};

window.analyzeProduct = function(){
  const itemsContainer = document.getElementById("items");
  let data = []; let totalRevenue = 0, totalCost = 0, totalProfit = 0;
  
  itemsContainer.querySelectorAll(".grid-row").forEach(r => {
    const i = r.querySelectorAll("input"); 
    const name=i[0].value||"Item", sell=+i[1].value||0, cost=+i[2].value||0, qty=+i[3].value||0;
    if(sell===0 && cost===0) return; 
    const rev=sell*qty, pc=cost*qty, prof=rev-pc; 
    totalRevenue+=rev; totalCost+=pc; totalProfit+=prof;
    data.push({name, sell, cost, qty, profit:prof, margin: sell>0?((sell-cost)/sell):0});
  });
  
  if(data.length===0) return alert("Please enter at least one product.");
  
  window.currentData = data; 
  window.showResults();
  
  document.getElementById("kpiRevLabel").innerText = "TOTAL REVENUE"; 
  document.getElementById("kpiCostLabel").innerText = "TOTAL COST"; 
  document.getElementById("kpiProfitLabel").innerText = "NET PROFIT";
  document.getElementById("monthlyMetrics").style.display = "none"; 
  document.getElementById("tableContainer").style.display = "block";
  document.getElementById("dispRevenue").innerText = "₹ "+totalRevenue.toLocaleString(); 
  document.getElementById("dispCost").innerText = "₹ "+totalCost.toLocaleString(); 
  document.getElementById("dispProfit").innerText = "₹ "+totalProfit.toLocaleString();
  
  window.generateTable(data); 
  window.generateInsights(data); 
  
  // Safety check for charts
  if(window.drawChart) {
    window.drawChart('bar', data.map(x=>x.name), data.map(x=>x.profit), '#0F172A');
  }
};

window.showResults = function() { 
    const res = document.getElementById("results");
    res.style.display = "block"; 
    res.scrollIntoView({behavior: "smooth"}); 
};

window.generateInsights = function(d){
  const div = document.getElementById("insights"); 
  let html = "", cnt = 0;
  const bestProfit = [...d].sort((a,b)=>b.profit - a.profit)[0]; 
  
  if(bestProfit) { html += `<div class="insight-item insight-green"><div><strong>★ Star Product:</strong> ${bestProfit.name} generates the most profit (₹${bestProfit.profit.toLocaleString()}). Focus ad spend here.</div></div>`; cnt++; }
  const bestQty = [...d].sort((a,b)=>b.qty - a.qty)[0]; 
  if(bestQty && bestQty.name !== bestProfit?.name) { html += `<div class="insight-item insight-blue"><div><strong>📦 Volume Leader:</strong> ${bestQty.name} is your most popular item (${bestQty.qty} units). Consider bundling it with slower items.</div></div>`; cnt++; }
  
  d.filter(x => x.margin < 0.20).forEach(x => { 
      if(cnt < 4) { html += `<div class="insight-item insight-orange"><div><strong>⚠ Low Margin:</strong> ${x.name} is only ${(x.margin*100).toFixed(0)}%. Raise price or lower cost to improve health.</div></div>`; cnt++; }
  });
  
  if(cnt < 3 && d.length > 0) html += `<div class="insight-item insight-gray"><div><strong>💡 Growth Tip:</strong> You have a healthy catalog. Consider testing a 10% price increase on your top sellers to boost net profit.</div></div>`;
  
  html += (window.getAiButtonHtml ? window.getAiButtonHtml() : ''); 
  div.innerHTML = html;
};

window.getAiButtonHtml = function() { 
    return `<div id="aiContainer" style="margin-top:15px; border-top:1px dashed var(--border); padding-top:15px;"><button id="aiBtn" class="btn-secondary" style="width:100%; border-color:#818cf8; color:#4f46e5; background:#eef2ff;" onclick="window.askAI()">✨ Ask AI Consultant for Strategy</button><div id="aiResult" style="margin-top:15px; font-size:14px; line-height:1.6; color:#334155; display:none; background:white; padding:15px; border-radius:12px; border:1px solid #e2e8f0;"></div></div>`; 
};

window.generateTable = function(d){ 
    const t = document.getElementById("table"); 
    t.innerHTML = "<tr><th>Product</th><th>Profit</th><th>Margin</th><th>Status</th></tr>"; 
    d.forEach(x => { 
        t.innerHTML += `<tr><td><b>${x.name}</b><br><small style='color:#64748B'>Sold: ${x.qty}</small></td><td>₹${x.profit.toLocaleString()}</td><td>${(x.margin*100).toFixed(1)}%</td><td>${x.margin>0.3?"<span style='color:green'>Healthy</span>":"<span style='color:orange'>Review</span>"}</td></tr>`; 
    }); 
};

window.downloadPDF = async function() {
  if(!window.jspdf) return alert("PDF Library not loaded.");
  const { jsPDF } = window.jspdf; 
  const element = document.getElementById("results");
  const btn = document.querySelector("button[onclick='window.downloadPDF()']"); 
  const originalText = btn.innerText;
  btn.innerText = "Generating...";
  
  try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL('image/png'); 
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const imgHeight = canvas.height * imgWidth / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight); 
      pdf.save('Vizbix-Profit-Report.pdf');
  } catch (err) {
      alert("Failed to generate PDF");
  }
  btn.innerText = originalText;
};

// Modals
window.toggleHistory = function(show) { 
    document.getElementById("historyModal").style.display = show ? "flex" : "none"; 
    if(show && window.userEmail) window.fetchHistory(); 
};