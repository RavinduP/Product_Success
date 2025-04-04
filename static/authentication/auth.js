// Authentication functions
function logout() {
    sessionStorage.removeItem('authenticated');
    window.location.href = '/templates/auth.html';
}

// Password check function (for auth.html)
function checkAuth() {
    const password = document.getElementById('password').value;
    if (password === "admin123") {
        sessionStorage.setItem('authenticated', 'true');
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/templates/dashboard.html';
        window.location.href = redirect;
    } else {
        document.getElementById('errorMsg').textContent = "Incorrect password!";
    }
    return false;
}

// Protect routes
document.addEventListener('DOMContentLoaded', function() {
    const protectedPages = [
        'production.html',
        'campaign.html',
        'market.html',
        'sentiment.html'
    ];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        if (sessionStorage.getItem('authenticated') !== 'true') {
            window.location.href = `/templates/auth.html?redirect=${encodeURIComponent(currentPage)}`;
        }
    }
    
    // Setup auth form if exists
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.onsubmit = function() { return checkAuth(); };
    }
});