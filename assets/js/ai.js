// =========================================
// ai.js - AI Chat Consultant & Pro Engine
// =========================================

const workerURL = "https://vizbix-api.vizbixhq.workers.dev";
const PRICE = 49900; 
const KEY = "rzp_live_SCvIqUMzTNsXgq"; 

window.chatConversation = [];

// 1. BULLETPROOF SCRAPER: Lives directly inside ai.js so it never fails.
window.scrapeCurrentData = function() {
    let data = [];
    const rows = document.querySelectorAll('#items .data-row');
    if (!rows) return data;

    rows.forEach(row => {
        const nameEl = row.querySelector('.input-name');
        const sellEl = row.querySelector('.input-sell');
        const costEl = row.querySelector('.input-cost');
        const qtyEl = row.querySelector('.input-qty');
        
        if (nameEl && sellEl && costEl && qtyEl) {
            const name = nameEl.value.trim();
            const sell = parseFloat(sellEl.value) || 0;
            const cost = parseFloat(costEl.value) || 0;
            const qty = parseFloat(qtyEl.value) || 0;
            
            // Only add rows that actually have data
            if (name !== '' || sell > 0 || cost > 0 || qty > 0) {
                data.push({ name, sell, cost, qty });
            }
        }
    });
    return data;
};

// 2. START AI ANALYSIS BUTTON
window.startAIAnalysis = async function() {
    if(!window.isProUser || !window.userEmail) {
        return alert("Please wait for authentication, or log in to use Pro Features.");
    }
    
    const freshData = window.scrapeCurrentData();
    if(!freshData || freshData.length === 0) {
        return alert("Please enter your product data in the Data Input tab first!");
    }

    // Switch UI
    const splash = document.getElementById("aiSplashScreen");
    const chat = document.getElementById("aiChatContainer");
    if(splash) splash.style.display = "none";
    if(chat) chat.style.display = "flex";

    const sym = window.currencySymbol || '₹';
    const promptMsg = `Analyze my catalog. Identify my hero product, spot any profit leaks, and give me a clear 3-step action plan to increase my net margin. Use ${sym}.`;
    
    const historyBox = document.getElementById("chatHistory");
    if(historyBox) {
        historyBox.innerHTML = `<div class="chat-msg msg-ai" id="loadingAi">Analyzing your data in ${sym}...</div>`;
    }
    
    window.chatConversation = []; 
    await window.executeAIRequest(promptMsg, freshData);
};

// 3. SEND CHAT MESSAGE BUTTON
window.sendChatMessage = async function() {
    if(!window.isProUser) return alert("Pro feature required.");
    
    const inputField = document.getElementById("aiChatInput");
    if(!inputField) return;

    const msg = inputField.value.trim();
    if(!msg) return;

    // Ensure chat UI is visible
    const splash = document.getElementById("aiSplashScreen");
    const chat = document.getElementById("aiChatContainer");
    if(splash) splash.style.display = "none";
    if(chat) chat.style.display = "flex";

    window.appendChatBubble(msg, 'user');
    inputField.value = '';
    
    const freshData = window.scrapeCurrentData();
    await window.executeAIRequest(msg, freshData);
};

// 4. CLOUDFLARE WORKER CONNECTION
window.executeAIRequest = async function(userMessage, freshData) {
    const typingIndicator = document.getElementById("typingIndicator");
    const sendBtn = document.getElementById("chatSendBtn");
    
    if(typingIndicator) typingIndicator.style.display = "block";
    if(sendBtn) sendBtn.disabled = true;

    let aiPayload = { 
        email: window.userEmail, 
        currency: window.currentCurrency || 'INR',
        symbol: window.currencySymbol || '₹',
        message: userMessage,
        history: window.chatConversation,
        products: freshData 
    }; 
    
    window.chatConversation.push({ role: "user", content: userMessage });

    try {
        const r = await fetch(workerURL + "/ai-analyze", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(aiPayload) 
        });
        const d = await r.json(); 
        
        if(typingIndicator) typingIndicator.style.display = "none";
        if(sendBtn) sendBtn.disabled = false;
        
        const loadingElement = document.getElementById("loadingAi");
        if(loadingElement) loadingElement.remove();

        if(d.ok) { 
            const formattedResponse = d.response.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            window.appendChatBubble(formattedResponse, 'ai');
            window.chatConversation.push({ role: "assistant", content: d.response });
        } else { 
            window.appendChatBubble("⚠️ " + (d.error || "AI Error"), 'ai'); 
        }
    } catch(e) { 
        if(typingIndicator) typingIndicator.style.display = "none"; 
        if(sendBtn) sendBtn.disabled = false; 
        window.appendChatBubble("⚠️ Connection error. Please try again.", 'ai'); 
    }
};

window.appendChatBubble = function(text, sender) {
    const historyBox = document.getElementById("chatHistory");
    if(!historyBox) return;
    const div = document.createElement("div");
    div.className = `chat-msg msg-${sender}`;
    div.innerHTML = text;
    historyBox.appendChild(div);
    historyBox.scrollTop = historyBox.scrollHeight;
};

// =========================================
// ACCOUNT & CLOUD SETTINGS
// =========================================

window.verify = async function(email){
    const targetEmail = email || window.userEmail;
    if(!targetEmail) return;
    try {
        const r = await fetch(workerURL+"/check?email="+targetEmail); 
        const d = await r.json();
        if(d.valid) {
            window.isProUser = true; 
            if(d.expiry) { 
                const diff = d.expiry - Date.now();
                if(diff > 0) window.proDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24)) + " Days Left";
                else { window.isProUser = false; window.proDaysLeft = "Expired"; }
            }
        } else { window.isProUser = false; }
    } catch(e) {}
};

window.pay = function(){
    if(!window.userEmail) return alert("Please log in.");
    const options = {
        key: KEY, amount: PRICE, currency: "INR", name: "Vizbix Pro", description: "30 Days Access",
        prefill: { email: window.userEmail }, theme: { color: "#0F172A" },
        handler: async function(response){ 
            try {
                const req = await fetch(workerURL + "/verify-payment", { 
                    method: "POST", headers: { "Content-Type": "application/json" }, 
                    body: JSON.stringify({ payment_id: response.razorpay_payment_id, email: window.userEmail }) 
                });
                const d = await req.json();
                if (d.ok) { alert("Welcome to Pro."); window.verify(window.userEmail); } 
                else { alert("Verification Failed."); }
            } catch (e) { alert("Error."); }
        }
    };
    new Razorpay(options).open();
};

window.saveToCloud = async function() {
    if(!window.isProUser) return alert("Pro Plan required."); 
    const btn = document.getElementById("saveCloudBtn");
    
    const freshData = window.scrapeCurrentData();
    if(!freshData || freshData.length === 0) return alert("Nothing to save!");
    
    if(btn) btn.innerHTML = "⏳";
    try { 
        await fetch(workerURL + "/save", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ email: window.userEmail, data: freshData, mode: 'product', date: new Date().toISOString() }) 
        }); 
        if(btn) { btn.innerHTML = "✅ Saved"; setTimeout(() => btn.innerHTML = "💾 Save to Cloud", 2000); }
    } catch(e) { if(btn) btn.innerHTML = "💾 Save to Cloud"; }
};

window.fetchHistory = async function() {
    const list = document.getElementById("historyList"); 
    if(!list) return;

    if(!window.isProUser) { 
        list.innerHTML = "<p style='text-align:center; color:#64748B;'>Unlock Pro to view history.</p>"; 
        return; 
    }
    list.innerHTML = "Loading...";
    try {
        const r = await fetch(workerURL + "/history?email=" + window.userEmail); 
        const d = await r.json();
        if(d.length === 0) { list.innerHTML = "<p style='text-align:center'>No history.</p>"; return; }
        list.innerHTML = "";
        d.forEach(item => {
            const dateStr = new Date(item.date).toLocaleDateString(); 
            const div = document.createElement("div"); 
            div.className = "history-item";
            div.innerHTML = `<div><div style="font-weight:600; font-size:14px; color: var(--dark);">${dateStr}</div><div style="font-size:12px; color: var(--text-muted);">${item.data.length} Rows</div></div><button class="btn btn-secondary" style="font-size:12px; padding:8px 12px;">Load Data</button>`;
            div.onclick = () => window.loadHistoryItem(item.data);
            list.appendChild(div);
        });
    } catch(e) { list.innerHTML = "Error fetching history."; }
};

window.loadHistoryItem = function(data) {
    const container = document.getElementById("items"); 
    if(!container) return;
    
    container.innerHTML = "";
    data.forEach(row => { 
        if(typeof window.addNewRow === 'function') {
            window.addNewRow(row.name||row.n||'', row.sell||row.v1||'', row.cost||row.v2||'', row.qty||row.v3||''); 
        }
    });
    alert("History loaded! Generating Dashboard...");
    
    // Auto-generate the dashboard for them
    if(typeof window.processDataAndShowReport === 'function') {
        window.processDataAndShowReport();
    }
};
