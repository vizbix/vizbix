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
// This runs automatically on every page load to check if the user is logged in
onAuthStateChanged(auth, async (user) => {
    
    // Elements that exist on both pages (injected by drawer.js)
    const headerLoginBtn = document.getElementById("headerLoginBtn");
    const drawerProfile = document.getElementById("drawerProfile");
    const drawerEmailDisplay = document.getElementById("drawerEmailDisplay");
    
    if (user) {
        // === USER IS LOGGED IN ===
        window.userEmail = user.email; // Save globally for app.js to use
        
        // 1. Update Header Button
        if(headerLoginBtn) {
            headerLoginBtn.innerText = "Dashboard →";
            headerLoginBtn.onclick = () => window.location.href = "/app/profit-optimizer.html";
            headerLoginBtn.className = "btn btn-primary";
        }
        
        // 2. Update Drawer UI
        if(drawerProfile) drawerProfile.style.display = "block";
        if(drawerEmailDisplay) drawerEmailDisplay.innerText = user.email;
        
        // 3. If on the SaaS page, check Pro Status & unlock UI
        if(window.location.pathname.includes('profit-optimizer')) {
            document.getElementById("emailInput").value = user.email;
            document.getElementById("emailInput").style.display = "none";
            window.verify(user.email); // Calls the verify function from app.js
        } else {
            // If on landing page, just fetch plan text for the drawer
            fetchPlanDetails(user.email);
        }

    } else {
        // === USER IS NOT LOGGED IN ===
        window.userEmail = null;
        window.isProUser = false;
        
        // 1. Reset Header & Drawer
        if(headerLoginBtn) {
            headerLoginBtn.innerText = "Log in";
            headerLoginBtn.onclick = () => window.openLogin ? window.openLogin() : (window.location.href='/index.html');
            headerLoginBtn.className = "btn btn-secondary";
        }
        if(drawerProfile) drawerProfile.style.display = "none";
        
        // 2. If on the SaaS page, lock the UI
        if(window.location.pathname.includes('profit-optimizer')) {
            const proContainer = document.getElementById("proContainer");
            const lockOverlay = document.getElementById("lockOverlay");
            if(proContainer) proContainer.classList.add("locked-container");
            if(lockOverlay) lockOverlay.style.display = "flex";
            
            const payBtn = document.querySelector("button[onclick='window.pay()']");
            if(payBtn) {
                payBtn.innerText = "Log in to unlock Pro";
                payBtn.onclick = () => window.location.href = "/index.html"; 
            }
        }
    }
});

// Helper to fetch plan details just for the drawer text
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

// --- GLOBAL EXPORTS FOR HTML ONCLICK BUTTONS ---
window.handleLogout = function() {
    if(confirm("Are you sure you want to log out?")) {
        signOut(auth).then(() => { window.location.href = "/index.html"; });
    }
};

window.handleGoogleLogin = async function() {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = "/app/profit-optimizer.html"; 
    } catch (error) { alert("Google Login Failed: " + error.message); }
};

window.handleEmailLogin = async function() {
    const e = document.getElementById('emailInput').value;
    const p = document.getElementById('passwordInput').value;
    if(!e || !p) return alert("Please enter both email and password.");
    try {
        const btn = document.querySelector("button[onclick='window.handleEmailLogin()']");
        btn.innerText = "Logging in...";
        await signInWithEmailAndPassword(auth, e, p);
        window.location.href = "/app/profit-optimizer.html";
    } catch (error) { 
        alert("Login failed. Check your password or sign up.");
        document.querySelector("button[onclick='window.handleEmailLogin()']").innerText = "Log In";
    }
};

window.handleEmailSignUp = async function() {
    const e = document.getElementById('emailInput').value;
    const p = document.getElementById('passwordInput').value;
    if(!e || !p) return alert("Please enter both email and password.");
    if(p.length < 6) return alert("Password must be at least 6 characters.");
    try {
        const btn = document.querySelector("button[onclick='window.handleEmailSignUp()']");
        btn.innerText = "Creating account...";
        await createUserWithEmailAndPassword(auth, e, p);
        window.location.href = "/app/profit-optimizer.html";
    } catch (error) { 
        alert("Sign Up failed: " + error.message); 
        document.querySelector("button[onclick='window.handleEmailSignUp()']").innerText = "Sign Up";
    }
};
