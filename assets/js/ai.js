const workerURL = "https://vizbix-api.vizbixhq.workers.dev";
const PRICE = 49900; 
const KEY = "rzp_live_SCvIqUMzTNsXgq"; 

window.chatConversation = [];

// NEW FIX: Always scrape the inputs directly from the screen at the exact moment of clicking.
function getFreshData() {
    let data = [];
    document.querySelectorAll('#items .data-row').forEach(row => {
        const name = row.querySelector('.input-name')?.value;
        const sell = row.querySelector('.input-sell')?.value;
        const cost = row.querySelector('.input-cost')?.value;
        const qty = row.querySelector('.input-qty')?.value;
        if(name || sell || cost || qty) data.push({ name, sell, cost, qty });
    });
    return data;
}

window.startAIAnalysis = async function() {
    if(!window.isProUser || !window.userEmail) return alert("Please Login (Pro Feature)");
    
    const freshData = getFreshData();
    if(freshData.length === 0) return alert("Please enter data in the Data Input tab first!");

    document.getElementById("aiSplashScreen").style.display = "none";
    document.getElementById("aiChatContainer").style.display = "flex";

    const promptMsg = `Analyze my catalog. Identify my hero product, spot any profit leaks, and give me a clear 3-step action plan to increase my net margin. Use ${window.currencySymbol}.`;
    
    document.getElementById("chatHistory").innerHTML = `<div class="chat-msg msg-ai" id="loadingAi">Analyzing your data in ${window.currencySymbol}...</div>`;
    window.chatConversation = []; 
    
    await executeAIRequest(promptMsg, freshData);
};

window.sendChatMessage = async function() {
    if(!window.isProUser) return;
    const inputField = document.getElementById("aiChatInput");
    const msg = inputField.value.trim();
    if(!msg) return;

    document.getElementById("aiSplashScreen").style.display = "none";
    document.getElementById("aiChatContainer").style.display = "flex";

    appendChatBubble(msg, 'user');
    inputField.value = '';
    
    await executeAIRequest(msg, getFreshData());
};

async function executeAIRequest(userMessage, freshData) {
    const typingIndicator = document.getElementById("typingIndicator");
    const sendBtn = document.getElementById("chatSendBtn");
    
    typingIndicator.style.display = "block";
    sendBtn.disabled = true;

    // FIX: 'products' is now guaranteed to have your data.
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
            method: "POST", headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify(aiPayload) 
        });
        const d = await r.json(); 
        
        typingIndicator.style.display = "none";
        sendBtn.disabled = false;
        
        const loadingElement = document.getElementById("loadingAi");
        if(loadingElement) loadingElement.remove();

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
        appendChatBubble("⚠️ Connection error.", 'ai'); 
    }
}

function appendChatBubble(text, sender) {
    const historyBox = document.getElementById("chatHistory");
    const div = document.createElement("div");
    div.className = `chat-msg msg-${sender}`;
    div.innerHTML = text;
    historyBox.appendChild(div);
    historyBox.scrollTop = historyBox.scrollHeight;
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
    const freshData = getFreshData();
    if(freshData.length === 0) return alert("Nothing to save!");
    btn.innerHTML = "⏳";
    try { 
        await fetch(workerURL + "/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: window.userEmail, data: freshData, mode: 'product', date: new Date().toISOString() }) }); 
        btn.innerHTML = "✅ Saved"; setTimeout(() => btn.innerHTML = "💾 Save to Cloud", 2000); 
    } catch(e) { btn.innerHTML = "💾 Save to Cloud"; }
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
