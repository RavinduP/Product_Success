document.addEventListener('DOMContentLoaded', function() {
    loadSidebar();
    initSidebar();
});

function loadSidebar() {
    if (!document.querySelector('.sidebar-container')) {
        const sidebarContainer = document.createElement('div');
        sidebarContainer.className = 'sidebar-container';
        document.body.insertBefore(sidebarContainer, document.body.firstChild);
    }
    
    fetch('../templates/sidebar.html')
        .then(response => response.text())
        .then(html => {
            document.querySelector('.sidebar-container').innerHTML = html;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './sidebar.css';
            document.head.appendChild(link);
            initSidebar();
        })
        .catch(error => console.error('Error loading sidebar:', error));
}

function initSidebar() {
    highlightCurrentTab();
    
    // Handle dropdown items
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (sessionStorage.getItem('authenticated') !== 'true') {
                e.preventDefault();
                window.location.href = `auth.html?redirect=${encodeURIComponent(this.getAttribute('href'))}`;
            }
        });
    });

    // Main tabs
    const tabs = document.querySelectorAll('.nav-tab:not(.dropdown-btn)');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            const tabName = this.dataset.tab;
            if (tabName === 'about') {
                e.preventDefault();
                // Will implement later
                return;
            }
            
            if (sessionStorage.getItem('authenticated') !== 'true') {
                e.preventDefault();
                window.location.href = `auth.html?redirect=${encodeURIComponent(this.getAttribute('onclick')?.match(/'(.*?)'/)?.[1] || 'dashboard.html')}`;
                return;
            }
            
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function highlightCurrentTab() {
    try {
        let currentPage = window.location.pathname.split('/').pop();
        if (currentPage === '' || currentPage === 'index.html') {
            currentPage = 'dashboard';
        } else {
            currentPage = currentPage.replace('.html', '');
        }

        const pageToTabMap = {
            'production': 'functions',
            'market': 'functions',
            'campaign': 'functions', 
            'sentiment': 'functions',
            'dashboard': 'dashboard',
            'about': 'about'
        };

        const tabs = document.querySelectorAll('.nav-tab:not(.dropdown-btn)');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        const tabName = pageToTabMap[currentPage];
        if (tabName) {
            const currentTab = document.querySelector(`.nav-tab[data-tab="${tabName}"]`);
            if (currentTab) currentTab.classList.add('active');
        }
    } catch (error) {
        console.error('Error in highlightCurrentTab:', error);
    }
}

function logout() {
    sessionStorage.removeItem('authenticated');
    window.location.href = '../templates/auth.html';
}