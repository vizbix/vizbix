// =========================================
// auth.js - Firebase Authentication & State
// =========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBta1q-faAPdH23pUUwbpViDgTjARnkT6c",
  authDomain: "vizbix.firebaseapp.com",
  projectId: "vizbix",
  storageBucket: "vizbix.firebasestorage.app",
  messagingSenderId: "411791241138",
  appId: "1:411791241138:web:850b987b66ec65a2d3feab",
  measurementId: "G-9TN8W27X0X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const workerURL = "https://vizbix-api.vizbixhq.workers.dev";

// --- AUTH STATE LISTENER ---
// This runs automatically whenever login state changes (login, logout, page load)
onAuthStateChanged(auth, async (user) => {
    
    // Elements that exist on both pages
    const headerLoginBtn = document.getElementById("headerLoginBtn");
    const drawerProfile = document.getElementById("drawerProfile");
    const drawerEmailDisplay = document.getElementById("drawerEmailDisplay");
    
    // Check if we are inside the App (Profit Optimizer)
    const isAppPage = window.location.pathname.includes('profit-optimizer');

    if (user) {
        // === USER IS LOGGED IN ===
        window.userEmail = user.email; // Sync with HTML AppState if present
        
        // 1. Update Header Button
        if(headerLoginBtn) {
            headerLoginBtn.innerText = "Dashboard →";
            headerLoginBtn.onclick = () => {
                if (!isAppPage) window.location.href = "/app/profit-optimizer.html";
            };
            headerLoginBtn.className = "btn btn-primary";
        }
        
        // 2. Update Drawer UI
        if(drawerProfile) drawerProfile.style.display = "block";
        if(drawerEmailDisplay) drawerEmailDisplay.innerText = user.email;
        
        // 3. Logic for App Page vs Landing Page
        if(isAppPage) {
            // We are already in the app: Unlock features immediately without reload
            if (window.closeLogin) window.closeLogin(); // Close modal if open
            if (window.verify) window.verify(user.email); // Re-run verification check
        } else {
            // We are on landing page: Just fetch plan info
            fetchPlanDetails(user.email);
        }

    } else {
        // === USER IS NOT LOGGED IN ===
        window.userEmail = null;
        
        // 1. Reset Header
        if(headerLoginBtn) {
            headerLoginBtn.innerText = "Log in";
            // If function exists (in app), open modal. Else (landing page), redirect.
            // NEW (Fix): Opens modal if on the app page, otherwise redirects
headerLoginBtn.onclick = () => window.openLogin ? window.openLogin() : (window.location.href='/index.html');
            headerLoginBtn.className = "btn btn-secondary";
        }
        if(drawerProfile) drawerProfile.style.display = "none";
        
        // 2. If inside App, show locked state
        if(isAppPage) {
            const payBtn = document.getElementById("upgradeBtn"); // Matches your HTML ID
            if(payBtn) {
                payBtn.innerText = "Log in to Upgrade";
                payBtn.onclick = () => window.openLogin(); 
            }
        }
    }
});

// Helper to fetch plan details (Drawer only)
async function fetchPlanDetails(email) {
    try {
        const r = await fetch(workerURL + "/check?email=" + email);
        const d = await r.json();
        const planDisplay = document.getElementById("drawerPlanDisplay");
        const expiryDisplay = document.getElementById("drawerExpiryDisplay");
        
        if(!planDisplay || !expiryDisplay) return;

        if (d.valid && d.expiry) {
            const daysLeft = Math.ceil((Number(d.expiry) - Date.now()) / (1000 * 60 * 60 * 24));
            planDisplay.innerText = "Active Plan: Pro";
            planDisplay.style.color = "#10B981";
            expiryDisplay.innerText = daysLeft > 0 ? `Next Renewal: ${daysLeft} days` : "Expires today";
        } else {
            planDisplay.innerText = "Active Plan: Free";
            planDisplay.style.color = "#0F172A";
            expiryDisplay.innerText = "Upgrade to unlock AI";
        }
    } catch(e) { console.error("Plan check failed"); }
}

// --- GLOBAL EXPORTS FOR HTML BUTTONS ---

// Handles routing after login success
function handleLoginSuccess() {
    // If on landing page, go to app. If on app, just close modal.
    if (!window.location.pathname.includes('profit-optimizer')) {
        window.location.href = "/app/profit-optimizer.html";
    } else if (window.closeLogin) {
        window.closeLogin();
    }
}

window.handleLogout = function() {
    if(confirm("Are you sure you want to log out?")) {
        signOut(auth).then(() => { 
            if (window.location.pathname.includes('profit-optimizer')) {
                window.location.reload(); // Reload app to reset state
            } else {
                window.location.href = "/index.html"; 
            }
        });
    }
};

window.handleGoogleLogin = async function() {
    try {
        await signInWithPopup(auth, googleProvider);
        handleLoginSuccess();
    } catch (error) { alert("Google Login Failed: " + error.message); }
};

window.handleEmailLogin = async function() {
    const e = document.getElementById('emailInput').value;
    const p = document.getElementById('passwordInput').value;
    if(!e || !p) return alert("Please enter both email and password.");
    
    const btn = document.querySelector("button[onclick='window.handleEmailLogin()']");
    const originalText = btn.innerText;
    btn.innerText = "Logging in...";
    
    try {
        await signInWithEmailAndPassword(auth, e, p);
        handleLoginSuccess();
    } catch (error) { 
        alert("Login failed. Check your password or sign up.");
    } finally {
        btn.innerText = originalText;
    }
};

window.handleEmailSignUp = async function() {
    const e = document.getElementById('emailInput').value;
    const p = document.getElementById('passwordInput').value;
    if(!e || !p) return alert("Please enter both email and password.");
    if(p.length < 6) return alert("Password must be at least 6 characters.");
    
    const btn = document.querySelector("button[onclick='window.handleEmailSignUp()']");
    const originalText = btn.innerText;
    btn.innerText = "Creating account...";
    
    try {
        await createUserWithEmailAndPassword(auth, e, p);
        handleLoginSuccess();
    } catch (error) { 
        alert("Sign Up failed: " + error.message); 
    } finally {
        btn.innerText = originalText;
    }
};


