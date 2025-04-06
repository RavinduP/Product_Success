document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar
    if (typeof initSidebar === 'function') {
        initSidebar();
    }

    // Animate cards with staggered delays
    const cards = document.querySelectorAll('.predictor-card');
    
    cards.forEach(card => {
        const delay = card.getAttribute('data-delay') || '0.1s';
        card.style.animationDelay = delay;
        
        // Add hover effect
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
            card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.05)';
        });
    });

    // Animate stats counting
    const stats = document.querySelectorAll('.stat-value');
    
    const animateStats = () => {
        stats.forEach(stat => {
            const target = parseInt(stat.textContent);
            const suffix = stat.textContent.match(/\D+$/) ? stat.textContent.match(/\D+$/)[0] : '';
            const duration = 1500;
            const start = 0;
            const increment = target / (duration / 16);
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    clearInterval(timer);
                    current = target;
                    stat.textContent = target + suffix;
                } else {
                    stat.textContent = Math.floor(current) + suffix;
                }
            }, 16);
        });
    };
    
    // Intersection Observer to trigger animations when scrolled into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.predictors-grid').forEach(grid => {
        observer.observe(grid);
    });
});