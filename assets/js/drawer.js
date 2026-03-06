document.addEventListener("DOMContentLoaded", () => {
    // 1. Define the HTML and inject a specific <style> tag to bypass CSS caching
    const drawerHTML = `
      <style>
        /* Force mobile header fix - Bypasses CSS caching issues */
        @media (max-width: 850px) {
          .nav-links { display: none !important; }
          .nav-actions { gap: 8px !important; }
          .nav-container { padding: 12px 16px !important; }
          .logo { font-size: 20px !important; }
        }
      </style>

      <div class="drawer-overlay" id="drawerOverlay"></div>
      
      <aside class="drawer" id="drawer">
        <div class="drawer-head">
          <div class="drawer-title">Menu</div>
          <button class="drawer-close" id="drawerClose">✕</button>
        </div>
        
        <div class="drawer-body" style="display: flex; flex-direction: column; flex: 1;">
          <div class="drawer-links">
            <a href="/index.html">Home <span>Start here</span></a>
            <a href="/app/profit-optimizer.html" style="background: #eff6ff; border-color: #bfdbfe;">
              Profit Optimizer <span style="background:#2563eb; color:white; padding:4px 8px; border-radius:6px; font-size:10px;">PRO</span>
            </a>
            <a href="/tools/index.html">Free Calculators <span>Single-use tools</span></a>
            <a href="/templates/index.html">Free Templates <span>Excel Templates</span></a>
            <a href="/pages/blogs.html">Blogs <span>Tips & Guides</span></a>
            <a href="/pages/about.html">About <span>Why Vizbix</span></a>
          </div>

          <div id="drawerProfile" style="display:none; margin-top: auto; background: #f8fafc; border: 1px solid var(--border); padding: 16px; border-radius: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Signed in as</div>
            <div id="drawerEmailDisplay" style="font-size: 14px; font-weight: 700; color: var(--dark); word-break: break-all; margin-bottom: 12px;"></div>
            
            <div style="background: white; border: 1px solid var(--border); padding: 10px; border-radius: 8px; margin-bottom: 12px;">
                <div id="drawerPlanDisplay" style="font-size:13px; font-weight:800;">Loading Plan...</div>
                <div id="drawerExpiryDisplay" style="font-size:12px; color:var(--text-muted); margin-top:2px;"></div>
            </div>

            <button onclick="window.handleLogout()" class="btn btn-secondary" style="width:100%; padding:8px; font-size:13px;">Log out</button>
          </div>
        </div>
      </aside>

      <header>
        <div class="nav-container">
          <a href="/index.html" class="logo">
            <div class="logo-dot"></div>Vizbix
          </a>
          
          <nav class="nav-links">
            <a href="/index.html#features">Features</a>
            <a href="/index.html#use-cases">Use Cases</a>
            <a href="/tools/index.html">Free Tools</a>
            <a href="/app/profit-optimizer.html">Pro</a>
          </nav>

          <div class="nav-actions">
            <button id="headerLoginBtn" class="btn btn-secondary" onclick="window.openLogin ? window.openLogin() : (window.location.href='/index.html')">Log in</button>
            
            <button class="menu-btn" id="menuBtn" aria-label="Open menu">
              <div class="menu-icon" aria-hidden="true">
                <span></span><span></span><span></span>
              </div>
            </button>
          </div>
        </div>
      </header>
    `;

    // 2. Inject it into the placeholder div
    const container = document.getElementById("vizbix-nav-container");
    if (container) {
        container.innerHTML = drawerHTML;
        
        // 3. Attach Event Listeners *after* the HTML exists
        const menuBtn = document.getElementById("menuBtn");
        const drawer = document.getElementById("drawer");
        const overlay = document.getElementById("drawerOverlay");
        const closeBtn = document.getElementById("drawerClose");

        function openDrawer() { 
            drawer.classList.add("open"); 
            overlay.classList.add("open"); 
            document.body.style.overflow = "hidden"; 
        }
        function closeDrawer() { 
            drawer.classList.remove("open"); 
            overlay.classList.remove("open"); 
            document.body.style.overflow = ""; 
        }

        if (menuBtn) menuBtn.addEventListener("click", openDrawer);
        if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
        if (overlay) overlay.addEventListener("click", closeDrawer);
    } else {
        console.warn("Vizbix Drawer: No <div id='vizbix-nav-container'> found on this page.");
    }
});
