// =========================================
// ai.js - AI Consultant & Pro Verification
// =========================================

const workerURL = "https://vizbix-api.vizbixhq.workers.dev";
const PRICE = 49900; // ₹499
const KEY = "rzp_live_SCvIqUMzTNsXgq"; 

window.askAI = async function() {
    if(!window.isProUser || !window.userEmail) return alert("Please Login (Pro Feature)");
    
    const btn = document.getElementById("aiBtn"); 
    const box = document.getElementById("aiResult");
    if(!btn || !box) return;

    btn.innerHTML = "✨ Strategizing..."; 
    btn.disabled = true; 
    btn.classList.add("ai-thinking");
    
    // Scrape current data from the UI to ensure AI gets latest numbers
    let currentProducts = [];
    document.querySelectorAll('#items .data-row').forEach(row => {
        const name = row.querySelector('.input-name').value;
        const sell = row.querySelector('.input-sell').value;
        const cost = row.querySelector('.input-cost').value;
        const qty = row.querySelector('.input-qty').value;
        if(name || sell || cost || qty) currentProducts.push({ name, sell, cost, qty });
    });

    let aiPayload = { 
        email: window.userEmail, 
        currency: window.currentCurrency || 'INR',
        products: currentProducts, 
        mode: 'product' 
    }; 
    
    try {
        const r = await fetch(workerURL + "/ai-analyze", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(aiPayload) 
        });
        const d = await r.json(); 
        btn.classList.remove("ai-thinking");
        
        if(d.ok) { 
            btn.style.display = "none"; 
            box.style.display = "block"; 
            box.innerHTML = "<strong>🤖 AI Consultant Strategy:</strong><br><br>" + d.response.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); 
        } else { 
            alert(d.error); 
            btn.innerHTML = "✨ Retry"; 
            btn.disabled = false; 
        }
    } catch(e) { 
        btn.classList.remove("ai-thinking"); 
        alert("Error connecting to AI"); 
        btn.disabled = false; 
    }
};

window.verify = async function(email){
    const targetEmail = email || window.userEmail;
    if(!targetEmail) return;

    try {
        const r = await fetch(workerURL+"/check?email="+targetEmail); 
        const d = await r.json();
        
        if(d.valid) {
            window.isProUser = true; 
            
            // Calculate exact days left
            if(d.expiry) { 
                const diff = d.expiry - Date.now();
                if(diff > 0) {
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    window.proDaysLeft = days + " Days Left";
                } else {
                    window.isProUser = false; // Plan Expired
                    window.proDaysLeft = "Expired";
                }
            }
        } else { 
            window.isProUser = false;
        }
    } catch(e) { console.log(e); }
};

window.pay = function(){
    if(!window.userEmail) return alert("Please log in first to purchase.");
    
    const options = {
        key: KEY, 
        amount: PRICE, 
        currency: "INR", 
        name: "Vizbix Pro", 
        description: "30 Days Access",
        prefill: { email: window.userEmail }, 
        theme: { color: "#0F172A" },
        handler: async function(response){ 
            const btn = document.getElementById("upgradeBtn"); 
            if(btn) { btn.innerText = "Verifying Payment..."; btn.disabled = true; }
            
            try {
                const verifyReq = await fetch(workerURL + "/verify-payment", { 
                    method: "POST", 
                    headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ payment_id: response.razorpay_payment_id, email: window.userEmail }) 
                });
                const verifyData = await verifyReq.json();
                
                if (verifyData.ok) { 
                    alert("Payment Successful! Welcome to Pro."); 
                    window.verify(window.userEmail); 
                } else { 
                    alert("Verification Failed."); 
                    if(btn) { btn.innerText = "Upgrade to PRO (₹499)"; btn.disabled = false; }
                }
            } catch (e) { 
                alert("Network error during verification."); 
                if(btn) { btn.innerText = "Upgrade to PRO (₹499)"; btn.disabled = false; }
            }
        }
    };
    const rzp1 = new Razorpay(options); 
    rzp1.open();
};

window.saveToCloud = async function() {
    if(!window.isProUser) return alert("Pro Plan required to save data to cloud."); 
    const btn = document.getElementById("saveCloudBtn");
    
    // Scrape UI data
    let dataToSave = [];
    document.querySelectorAll('#items .data-row').forEach(row => {
        const name = row.querySelector('.input-name').value;
        const sell = row.querySelector('.input-sell').value;
        const cost = row.querySelector('.input-cost').value;
        const qty = row.querySelector('.input-qty').value;
        if(name || sell || cost || qty) dataToSave.push({ name, sell, cost, qty });
    });
    
    if(dataToSave.length === 0) return alert("Nothing to save!");
    
    btn.innerHTML = "⏳";
    try { 
        await fetch(workerURL + "/save", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ email: window.userEmail, data: dataToSave, mode: 'product', date: new Date().toISOString() }) 
        }); 
        btn.innerHTML = "✅ Saved"; 
        setTimeout(() => btn.innerHTML = "💾 Save", 2000); 
    } catch(e) { 
        btn.innerHTML = "💾 Save"; 
    }
};

window.fetchHistory = async function() {
    const list = document.getElementById("historyList"); 
    if(!window.isProUser) {
        list.innerHTML = "<p style='text-align:center; color:#64748B;'>Unlock Pro to view your saved history.</p>";
        return;
    }

    list.innerHTML = "Loading...";
    try {
        const r = await fetch(workerURL + "/history?email=" + window.userEmail); 
        const d = await r.json();
        
        if(d.length === 0) { 
            list.innerHTML = "<p style='color:#64748B; text-align:center'>No history found.</p>"; 
            return; 
        }
        list.innerHTML = "";
        
        d.forEach(item => {
            const dateStr = new Date(item.date).toLocaleDateString(); 
            const div = document.createElement("div"); 
            div.className = "history-item";
            // Map the history UI exactly to your app.css
            div.innerHTML = `
                <div>
                    <div style="font-weight:600; font-size:14px; color: var(--dark);">${dateStr}</div>
                    <div style="font-size:12px; color: var(--text-muted);">${item.data.length} Rows Saved</div>
                </div>
                <button class="btn btn-secondary" style="font-size:12px; padding:8px 12px;">Load Data</button>
            `;
            // Add click event to load data
            div.onclick = () => window.loadHistoryItem(item.data);
            list.appendChild(div);
        });
    } catch(e) { 
        list.innerHTML = "Error fetching history."; 
    }
};

// Rebuilt to match the new UI architecture
window.loadHistoryItem = function(data) {
    const container = document.getElementById("items"); 
    container.innerHTML = ""; // Clear current table
    
    data.forEach(row => { 
        // Support both old and new data structures
        const n = row.name || row.n || '';
        const s = row.sell || row.v1 || '';
        const c = row.cost || row.v2 || '';
        const q = row.qty || row.v3 || '';
        window.addNewRow(n, s, c, q); 
    });
    
    alert("History loaded! Click Generate to view dashboard.");
    // Switch UI back to Data view
    if(typeof window.switchView === 'function') {
        window.switchView('data', document.querySelectorAll('.nav-item')[3]);
    }
};
