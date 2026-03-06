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
    
    let aiPayload = {};
    if (window.currentMode === 'monthly') {
        if(!window.monthlyStats) return alert("Run analysis first."); 
        const s = window.monthlyStats;
        aiPayload = { 
            email: window.userEmail, 
            mode: 'monthly', 
            summary: `Based on ${s.count} months average:\nAvg Monthly Sales: ₹${s.avgSales.toFixed(0)}, Avg Expenses: ₹${s.avgExp.toFixed(0)}, Avg Orders: ${s.avgOrders.toFixed(1)}, Gross Margin: ${s.margin.toFixed(1)}%.` 
        };
    } else { 
        aiPayload = { 
            email: window.userEmail, 
            products: window.currentData.map(x => ({ name: x.name, cost: x.cost, sell: x.sell, qty: x.qty })), 
            mode: 'product' 
        }; 
    }
    
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
            
            // Unlock UI
            const lockOverlay = document.getElementById("lockOverlay");
            const proContainer = document.getElementById("proContainer");
            if(lockOverlay) lockOverlay.style.display = "none"; 
            if(proContainer) proContainer.classList.remove("locked-container");
            
            let dateStr = "";
            if(d.expiry) { 
                const date = new Date(parseInt(d.expiry)); 
                dateStr = date.toLocaleDateString(undefined, {day:'numeric', month:'short', year:'numeric'}); 
            }
            
            const headerEmail = document.getElementById("userEmailHeader");
            if(headerEmail) headerEmail.innerHTML = `<div>${targetEmail}</div><div style="font-size:10px; opacity:0.8; margin-top:2px;">Pro Active</div>`;
            
            const drawerExpiry = document.getElementById("drawerExpiryDisplay");
            if(drawerExpiry) drawerExpiry.innerText = "Plan expires: " + dateStr;
            
            const historyBtn = document.getElementById("historyBtn");
            const saveCloudBtn = document.getElementById("saveCloudBtn");
            if(historyBtn) historyBtn.style.display = "inline-flex"; 
            if(saveCloudBtn) saveCloudBtn.style.display = "flex";
            
            if(window.chartInstance) window.chartInstance.resize();
        } else { 
            // Logged in, but NOT a Pro user. Keep UI locked.
            window.isProUser = false;
            const btn = document.querySelector("button[onclick='window.pay()']");
            if(btn) {
                btn.innerText = `Unlock Pro for ₹499`;
                btn.onclick = window.pay; 
            }
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
            const btn = document.querySelector("button[onclick='window.pay()']"); 
            const originalText = btn.innerText;
            btn.innerText = "Verifying Payment..."; 
            btn.disabled = true;
            
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
                    alert("Verification Failed: " + (verifyData.error || "Unknown error")); 
                    btn.innerText = originalText; 
                    btn.disabled = false; 
                }
            } catch (e) { 
                alert("Network error during verification."); 
                btn.innerText = originalText; 
                btn.disabled = false; 
            }
        }
    };
    const rzp1 = new Razorpay(options); 
    rzp1.open();
};

// --- CLOUD HISTORY & SAVING (Append to ai.js) ---

window.saveToCloud = async function() {
    if(!window.isProUser) return alert("Login required"); 
    const btn = document.getElementById("saveCloudBtn");
    let dataToSave = window.currentMode === 'monthly' ? window.scrapeRows(document.getElementById("monthItems")) : window.scrapeRows(document.getElementById("items"));
    
    if(dataToSave.length === 0) return alert("Nothing to save!");
    
    btn.innerHTML = "<span style='animation:spin 1s linear infinite'>⏳</span>";
    try { 
        await fetch(workerURL + "/save", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ email: window.userEmail, data: dataToSave, mode: window.currentMode, date: new Date().toISOString() }) 
        }); 
        btn.innerHTML = "✅"; 
        setTimeout(() => btn.innerHTML = "<span style='font-size:18px'>💾</span>", 1500); 
    } catch(e) { 
        btn.innerHTML = "💾"; 
    }
};

window.fetchHistory = async function() {
    const list = document.getElementById("historyList"); 
    list.innerHTML = "Loading...";
    try {
        const r = await fetch(workerURL + "/history?email=" + window.userEmail); 
        const d = await r.json();
        
        if(d.length === 0) { 
            list.innerHTML = "<p style='color:#64748B; text-align:center'>No history.</p>"; 
            return; 
        }
        list.innerHTML = "";
        
        d.forEach(item => {
            const dateStr = new Date(item.date).toLocaleDateString(); 
            const modeLabel = item.mode === 'monthly' ? 'Monthly' : 'Product';
            const div = document.createElement("div"); 
            div.className = "history-item";
            div.innerHTML = `<div><div style="font-weight:600; font-size:14px;">${dateStr}</div><div style="font-size:12px; color:#64748B">${item.data.length} Rows • ${modeLabel}</div></div><button class="btn-secondary" style="font-size:11px; padding:6px 10px;">Load</button>`;
            div.onclick = () => window.loadHistoryItem(item.data, item.mode);
            list.appendChild(div);
        });
    } catch(e) { 
        list.innerHTML = "Error fetching history."; 
    }
};

window.loadHistoryItem = function(data, savedMode) {
    const targetMode = savedMode || 'product'; 
    window.setMode(targetMode);
    
    const container = targetMode === 'monthly' ? document.getElementById("monthItems") : document.getElementById("items"); 
    container.innerHTML = "";
    
    data.forEach(x => { 
        if(Array.isArray(x)) window.createRow(container, x[0], x[1], x[2], x[3], targetMode==='monthly'); 
        else window.createRow(container, x.n, x.v1, x.v2, x.v3, targetMode==='monthly'); 
    });
    
    window.toggleHistory(false); 
    window.saveDraft(); 
    window.analyze();
};