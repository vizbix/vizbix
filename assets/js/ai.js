// =========================================
// ai.js - AI Chat Consultant & Pro Engine
// =========================================

const workerURL = "https://vizbix-api.vizbixhq.workers.dev";
const PRICE = 49900; // ₹499
const KEY = "rzp_live_SCvIqUMzTNsXgq"; 

window.chatConversation = []; // Holds the chat history

window.startAIAnalysis = async function() {
    if(!window.isProUser || !window.userEmail) return alert("Please Login (Pro Feature)");
    
    // Scrape latest data
    let currentProducts = [];
    document.querySelectorAll('#items .data-row').forEach(row => {
        const name = row.querySelector('.input-name').value;
        const sell = row.querySelector('.input-sell').value;
        const cost = row.querySelector('.input-cost').value;
        const qty = row.querySelector('.input-qty').value;
        if(name || sell || cost || qty) currentProducts.push({ name, sell, cost, qty });
    });

    if(currentProducts.length === 0) return alert("Enter data in the Data Input tab first!");

    const promptMsg = `Analyze my product data using ${window.currentCurrency} (${window.currencySymbol}). Spot profit leaks, suggest pricing strategies, and tell me where to focus. Data: ${JSON.stringify(currentProducts)}`;
    
    // Reset Chat UI
    document.getElementById("chatHistory").innerHTML = `<div class="chat-msg msg-ai">Analyzing your data in ${window.currencySymbol}...</div>`;
    window.chatConversation = []; // Clear previous chat
    
    await executeAIRequest(promptMsg, "Initial Analysis");
};

window.sendChatMessage = async function() {
    if(!window.isProUser) return alert("Pro feature locked.");
    const inputField = document.getElementById("aiChatInput");
    const msg = inputField.value.trim();
    if(!msg) return;

    // Add user message to UI
    appendChatBubble(msg, 'user');
    inputField.value = '';
    
    await executeAIRequest(msg, "Chat");
};

async function executeAIRequest(userMessage, contextType) {
    const historyBox = document.getElementById("chatHistory");
    const typingIndicator = document.getElementById("typingIndicator");
    const sendBtn = document.getElementById("chatSendBtn");
    
    typingIndicator.style.display = "block";
    sendBtn.disabled = true;

    // Add to internal conversation history
    window.chatConversation.push({ role: "user", content: userMessage });

    let aiPayload = { 
        email: window.userEmail, 
        currency: window.currentCurrency || 'INR',
        symbol: window.currencySymbol || '₹',
        message: userMessage,
        history: window.chatConversation, // Send full context to worker
        type: contextType 
    }; 
    
    try {
        const r = await fetch(workerURL + "/ai-analyze", { 
            method: "POST", headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(aiPayload) 
        });
        const d = await r.json(); 
        
        typingIndicator.style.display = "none";
        sendBtn.disabled = false;
        
        if(d.ok) { 
            const formattedResponse = d.response.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            appendChatBubble(formattedResponse, 'ai');
            window.chatConversation.push({ role: "assistant", content: d.response });
        } else { 
            appendChatBubble("⚠️ " + d.error, 'ai'); 
        }
    } catch(e) { 
        typingIndicator.style.display = "none"; 
        sendBtn.disabled = false; 
        appendChatBubble("⚠️ Connection error. Please try again.", 'ai'); 
    }
}

function appendChatBubble(text, sender) {
    const historyBox = document.getElementById("chatHistory");
    const div = document.createElement("div");
    div.className = `chat-msg msg-${sender}`;
    div.innerHTML = text;
    // Clear the "Analyzing..." placeholder if it's the first real AI message
    if(sender === 'ai' && historyBox.innerHTML.includes("Analyzing your data")) {
        historyBox.innerHTML = '';
    }
    historyBox.appendChild(div);
    historyBox.scrollTop = historyBox.scrollHeight; // Auto-scroll to bottom
}

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
        await fetch(workerURL + "/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: window.userEmail, data: dataToSave, mode: 'product', date: new Date().toISOString() }) }); 
        btn.innerHTML = "✅ Saved"; setTimeout(() => btn.innerHTML = "💾 Save", 2000); 
    } catch(e) { btn.innerHTML = "💾 Save"; }
};

window.fetchHistory = async function() {
    const list = document.getElementById("historyList"); 
    if(!window.isProUser) { list.innerHTML = "<p style='text-align:center; color:#64748B;'>Unlock Pro to view history.</p>"; return; }
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
    } catch(e) {}
};

window.loadHistoryItem = function(data) {
    const container = document.getElementById("items"); 
    container.innerHTML = "";
    data.forEach(row => { window.addNewRow(row.name||row.n||'', row.sell||row.v1||'', row.cost||row.v2||'', row.qty||row.v3||''); });
    alert("History loaded!");
    if(typeof window.switchView === 'function') window.switchView('data', document.querySelectorAll('.nav-item')[3]);
};
