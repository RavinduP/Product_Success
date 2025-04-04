// static/script.js

// Main DOM Ready Handler
// After loader completes, redirect to dashboard
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        window.location.href = 'dashboard.html';
    }, 3500); // Matches loader animation duration
});


// Landing Page Functions
function initLandingPage() {
    // Typing animation
    const phrases = [
        "Real-time manufacturing insights",
        "Predictive analytics engine",
        "Optimizing production workflows",
        "Data-driven decision making"
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    const typewriterEl = document.getElementById('typewriter');
    
    // Add cursor styling
    typewriterEl.style.borderRight = '2px solid white';
    typewriterEl.style.paddingRight = '2px';
    typewriterEl.style.display = 'inline-block';

    function typeWriter() {
        const currentPhrase = phrases[phraseIndex];
        
        // Update text content
        typewriterEl.textContent = currentPhrase.substring(0, charIndex);
        
        if (!isDeleting && charIndex < currentPhrase.length) {
            // Typing forward
            charIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else if (isDeleting && charIndex > 0) {
            // Deleting
            charIndex--;
            setTimeout(typeWriter, typingSpeed/2);
        } else {
            // Switch between typing and deleting
            isDeleting = !isDeleting;
            if (!isDeleting) {
                phraseIndex = (phraseIndex + 1) % phrases.length;
            }
            setTimeout(typeWriter, isDeleting ? 1200 : 300);
        }
    }

    // Start the animation after a short delay
    setTimeout(typeWriter, 500);
    
    // Navigation and other landing page code...
    function navigateToDashboard() {
        document.querySelector('.landing-content').style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);
    }

    document.getElementById('enterBtn').addEventListener('click', navigateToDashboard);
    
    // Auto-redirect after 8 seconds
    let redirectTimer = setTimeout(navigateToDashboard, 8000);
    
    // Cancel auto-redirect if user interacts
    document.getElementById('enterBtn').addEventListener('mouseenter', () => {
        clearTimeout(redirectTimer);
    });
}

// Dashboard Page Functions
// Update the initDashboardPages function in script.js
function initDashboardPages() {
    try {
        // Initialize tab highlighting
        highlightCurrentTab();
        
        // Add click handlers for all tabs (now works with dynamically loaded sidebar)
        document.addEventListener('click', function(e) {
            if (e.target.closest('.tab')) {
                const tab = e.target.closest('.tab');
                console.log('Tab clicked:', tab.dataset.tab);
                
                // Check authentication for protected routes
                const tabName = tab.dataset.tab;
                const protectedTabs = ['defect', 'campaign', 'Sales', 'Sentiment'];
                
                if (protectedTabs.includes(tabName) && sessionStorage.getItem('authenticated') !== 'true') {
                    e.preventDefault();
                    const redirectPage = tab.getAttribute('onclick').match(/'(.*?)'/)[1];
                    window.location.href = `auth.html?redirect=${encodeURIComponent(redirectPage)}`;
                    return;
                }
                
                // Update active tab visually
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error in tab initialization:', error);
    }
}

function highlightCurrentTab() {
    try {
        // Get current page filename
        let currentPage = window.location.pathname.split('/').pop();
        console.log('Current page:', currentPage);
        
        // Handle index.html or root case
        if (currentPage === '' || currentPage === 'index.html') {
            currentPage = 'dashboard';
        } else {
            currentPage = currentPage.replace('.html', '');
        }

        // Map page names to tab data-tab values
        const pageToTabMap = {
            'production': 'defect',
            'campaign': 'campaign',
            'market': 'Sales',
            'sentiment': 'Sentiment',
            'dashboard': 'dashboard'
        };

        const tabName = pageToTabMap[currentPage];
        console.log('Matching tab:', tabName);
        
        // Find and highlight the current tab
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        if (tabName) {
            const currentTab = document.querySelector(`.tab[data-tab="${tabName}"]`);
            if (currentTab) {
                currentTab.classList.add('active');
                console.log('Active tab set:', tabName);
                return;
            }
        }
        
        console.warn(`Tab not found for page: ${currentPage}`);
        // Fallback: activate first tab if none found
        if (tabs.length > 0) {
            tabs[0].classList.add('active');
        }
    } catch (error) {
        console.error('Error in highlightCurrentTab:', error);
    }
}