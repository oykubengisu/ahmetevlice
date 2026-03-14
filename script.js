/**
 * Prof. Dr. Ahmet Evlice - Website Scripts
 * Modern, Elegant & Professional Design
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initPreloader();
    initNavigation();
    initScrollEffects();
    initMobileMenu();
    initCounterAnimation();
    initAOSAnimation();
    initContactForm();
    initSmoothScroll();
    initDarkMode();
});

/**
 * Dark Mode Toggle
 */
function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Add animation class
            this.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
        });
    }
    
    // Listen for system preference changes
    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

/**
 * Preloader
 */
function initPreloader() {
    const preloader = document.querySelector('.preloader');
    
    window.addEventListener('load', function() {
        // İçerik yüklenir yüklenmez preloader'ı hızlıca gizle
        setTimeout(function() {
            preloader.classList.add('hidden');
        }, 50);
    });
}

/**
 * Navigation Scroll Effect
 */
function initNavigation() {
    const header = document.getElementById('header');
    const scrollThreshold = 50;
    
    function handleScroll() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on load
}

/**
 * Scroll Effects (Back to Top, Active Nav)
 */
function initScrollEffects() {
    const backToTop = document.getElementById('back-to-top');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function handleScroll() {
        const scrollY = window.scrollY;
        
        // Back to Top Button
        if (scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
        
        // Active Navigation Link
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    window.addEventListener('scroll', handleScroll);
}

/**
 * Mobile Menu
 */
function initMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Open Menu
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.add('show-menu');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close Menu
    if (navClose) {
        navClose.addEventListener('click', function() {
            navMenu.classList.remove('show-menu');
            document.body.style.overflow = '';
        });
    }
    
    // Close Menu on Link Click
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('show-menu');
            document.body.style.overflow = '';
        });
    });
    
    // Close Menu on Outside Click
    document.addEventListener('click', function(e) {
        if (navMenu.classList.contains('show-menu') && 
            !navMenu.contains(e.target) && 
            !navToggle.contains(e.target)) {
            navMenu.classList.remove('show-menu');
            document.body.style.overflow = '';
        }
    });
}

/**
 * Counter Animation
 */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    const speed = 200;
    let animated = false;
    
    function animateCounters() {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-count');
            const count = +counter.innerText;
            const increment = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(() => animateCounters(), 1);
            } else {
                counter.innerText = formatNumber(target);
            }
        });
    }
    
    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'K';
        }
        return num;
    }
    
    // Trigger animation when in viewport
    const statsSection = document.querySelector('.hero-stats');
    
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animated) {
                    animated = true;
                    animateCounters();
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }
}

/**
 * AOS-like Animation (Custom Implementation)
 */
function initAOSAnimation() {
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-aos-delay') || 0;
                
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, delay);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Contact Form Handling
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Simple validation
            if (!data.name || !data.email || !data.phone || !data.subject || !data.message) {
                showNotification('Lütfen tüm alanları doldurunuz.', 'error');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('Geçerli bir e-posta adresi giriniz.', 'error');
                return;
            }
            
            // Show success (in real app, send to server)
            showNotification('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.', 'success');
            form.reset();
        });
    }
}

/**
 * Show Notification
 */
function showNotification(message, type) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 20px 30px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;
    
    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/**
 * Smooth Scroll
 */
function initSmoothScroll() {
    // Select only internal navigation links, exclude WhatsApp button and external links
    const links = document.querySelectorAll('a[href^="#"]:not(#whatsapp-btn):not(.whatsapp-btn)');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only handle internal page links
            if (href === '#' || href.length <= 1) return;
            
            // Skip if it's not a valid page anchor (like #home, #about, etc.)
            const targetId = href.substring(1); // Remove #
            if (!targetId || targetId.includes('/') || targetId.includes('http')) {
                return;
            }
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            
            if (target) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Parallax Effect for Hero Background (only on larger screens)
 */
(function() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    function onScroll() {
        const scrolled = window.scrollY;
        const heroPattern = document.querySelector('.hero-pattern');
        
        if (heroPattern && scrolled < window.innerHeight) {
            heroPattern.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    }
    
    function initParallax() {
        if (window.innerWidth > 768 && !prefersReducedMotion.matches) {
            window.addEventListener('scroll', onScroll);
        }
    }
    
    initParallax();
    window.addEventListener('resize', initParallax);
})();

/**
 * Image Placeholder Hover Effect
 */
document.querySelectorAll('.image-placeholder, .gallery-placeholder').forEach(placeholder => {
    placeholder.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
        this.style.transition = 'transform 0.3s ease';
    });
    
    placeholder.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

/**
 * Typing Effect for Hero Title (Optional Enhancement)
 */
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

/**
 * Lazy Loading Images
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

/**
 * Form Input Focus Effects
 */
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});

/**
 * Expertise Card Hover Effect Enhancement
 */
document.querySelectorAll('.expertise-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.querySelector('.card-icon').style.transform = 'rotateY(180deg)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.querySelector('.card-icon').style.transform = 'rotateY(0)';
    });
});

// Add transition to card icons
document.querySelectorAll('.card-icon').forEach(icon => {
    icon.style.transition = 'transform 0.5s ease, background 0.3s ease';
});

/**
 * Dynamic Year in Footer
 */
const yearElement = document.querySelector('.footer-bottom p');
if (yearElement) {
    const currentYear = new Date().getFullYear();
    yearElement.innerHTML = yearElement.innerHTML.replace('2024', currentYear);
}

console.log('Prof. Dr. Ahmet Evlice Website - Loaded Successfully');

// API adresi (Render)
const API_BASE = ''; // Aynı domain (Vercel)

// ========================================
// Dynamic Blog Section
// ========================================
async function loadDynamicBlogs() {
    const blogGrid = document.querySelector('.blog-grid');
    if (!blogGrid) return;
    const moreCard = blogGrid.querySelector('.blog-more-card');
    let blogs = [];
    try {
        const r = await fetch(API_BASE + '/api/blogs');
        if (r.ok) blogs = await r.json();
        else throw new Error();
    } catch (e) {
        blogs = JSON.parse(localStorage.getItem('blog_posts') || '[]');
    }
    blogs = blogs
        .filter(blog => blog.status === 'published')
        // Türü 'blog' olan yazılar ana sayfa blog bölümünde gösterilsin
        .filter(blog => (blog.kind || 'makale') === 'blog')
        .slice(0, 2);
    
    // If no blogs in admin, sadece Daha Fazlası kartı kalsın
    if (blogs.length === 0) {
        if (moreCard) {
            blogGrid.innerHTML = moreCard.outerHTML;
        } else {
            blogGrid.innerHTML = '';
        }
        return;
    }
    
    // Category icons mapping
    const categoryIcons = {
        'migren': 'fas fa-head-side-virus',
        'alzheimer': 'fas fa-brain',
        'parkinson': 'fas fa-user-injured',
        'epilepsi': 'fas fa-bolt',
        'inme': 'fas fa-heartbeat',
        'uyku': 'fas fa-bed',
        'botoks': 'fas fa-syringe',
        'agri': 'fas fa-hand-holding-medical',
        'diger': 'fas fa-stethoscope',
        'genel': 'fas fa-notes-medical'
    };
    
    // Category labels
    const categoryLabels = {
        'migren': 'Migren',
        'alzheimer': 'Alzheimer',
        'parkinson': 'Parkinson',
        'epilepsi': 'Epilepsi',
        'inme': 'İnme',
        'uyku': 'Uyku',
        'botoks': 'Botoks Uygulamaları',
        'agri': 'Ağrı Blokları',
        'diger': 'Diğer Nörolojik Hastalıklar',
        'genel': 'Genel'
    };
    
    // Format date
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    // Generate HTML for each blog
    const blogsHTML = blogs.map((blog, index) => {
        const id = blog.id != null ? blog.id : index;
        const icon = categoryIcons[blog.category] || 'fas fa-newspaper';
        const label = categoryLabels[blog.category] || blog.category;
        const delay = ((index % 3) + 1) * 100;
        const detailUrl = `/blog-yazisi.html?id=${encodeURIComponent(id)}`;
        const linkAttrs = `href="${detailUrl}"`;

        // Aynı kategori görsellerini blog.html ile eşleştirmek için arka plan renkleri
        const categoryColors = {
            'alzheimer': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'parkinson': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'migren': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'uyku': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'bas-agrisi': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            'hareket': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'epilepsi': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            'inme': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            'botoks': 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
            'agri': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            'diger': 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
            'genel': 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
        };
        const bgColor = categoryColors[blog.category] || 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)';

        return `
            <article class="blog-card" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="blog-image">
                    <div class="blog-image-placeholder" style="background: ${bgColor};">
                        <i class="${icon}"></i>
                    </div>
                    <div class="blog-category">${label}</div>
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span class="blog-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${formatDate(blog.date || blog.createdAt)}
                        </span>
                        <span class="blog-read-time">
                            <i class="fas fa-clock"></i>
                            ${blog.readTime || 5} dk okuma
                        </span>
                    </div>
                    <h3 class="blog-title">
                        <a ${linkAttrs}>${blog.title}</a>
                    </h3>
                    <p class="blog-excerpt">
                        ${blog.excerpt || blog.title}
                    </p>
                    <a ${linkAttrs} class="blog-link">
                        <span>Devamını Oku</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    }).join('');
    
    // Dinamik blog kartlarını ve en sonda Daha Fazlası kartını göster
    const moreCardHtml = moreCard ? moreCard.outerHTML : '';
    blogGrid.innerHTML = blogsHTML + moreCardHtml;
    
    // Re-initialize AOS for new elements
    initAOSAnimation();
}

// Update main page blogs (called from admin panel)
window.updateMainPageBlogs = function() {
    loadDynamicBlogs();
};

// Load dynamic blogs on page load
document.addEventListener('DOMContentLoaded', loadDynamicBlogs);

// ========================================
// Load Page Content from Admin Panel (API öncelikli)
// ========================================
document.addEventListener('DOMContentLoaded', async function() {
    await loadHeroContent();
    await loadAboutContent();
    await loadContactContent();
    await loadSocialLinks();
    initWhatsAppButton();
    
    // Hakkımda: Davetli konuşmalar & bildiriler "Daha fazlası"
    document.querySelectorAll('.about-more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const list = document.getElementById(targetId);
            if (!list) return;
            const expanded = list.classList.toggle('about-list-expanded');
            btn.textContent = expanded ? 'Daha az göster' : 'Daha fazlası';
        });
    });
});

/**
 * Initialize WhatsApp Button (contact verisi loadContactContent sonrası DOM'da)
 */
function initWhatsAppButton() {
    const whatsappBtn = document.getElementById('whatsapp-btn');
    if (!whatsappBtn) return;
    const contactContent = JSON.parse(localStorage.getItem('page_contact') || '{}');
    
    if (contactContent.whatsapp && contactContent.whatsapp.trim() !== '') {
        // Remove any spaces or special characters, keep only numbers
        const cleanNumber = contactContent.whatsapp.replace(/\D/g, '');
        
        if (cleanNumber.length > 0) {
            // wa.me format automatically opens WhatsApp app on mobile devices
            // and WhatsApp Web on desktop - this is the most reliable method
            whatsappBtn.href = `https://wa.me/${cleanNumber}`;
            whatsappBtn.removeAttribute('onclick');
            whatsappBtn.style.display = 'flex';
            whatsappBtn.style.opacity = '1';
            whatsappBtn.style.cursor = 'pointer';
            console.log('WhatsApp button configured with number:', cleanNumber);
        } else {
            whatsappBtn.href = '#';
            whatsappBtn.onclick = function(e) {
                e.preventDefault();
                alert('Lütfen admin panelinden geçerli bir WhatsApp numarası ekleyin.');
            };
        }
    } else {
        // No WhatsApp number set
        whatsappBtn.href = '#';
        whatsappBtn.onclick = function(e) {
            e.preventDefault();
            alert('WhatsApp numarası henüz ayarlanmamış. Lütfen admin panelinden WhatsApp numarasını ekleyin.');
        };
        whatsappBtn.style.display = 'flex';
        whatsappBtn.style.opacity = '0.7';
        whatsappBtn.style.cursor = 'not-allowed';
    }
}

/**
 * Load Hero Section Content (API öncelikli)
 */
async function loadHeroContent() {
    let heroContent = {};
    try {
        const r = await fetch(API_BASE + '/api/pages/hero');
        if (r.ok) heroContent = await r.json();
        else throw new Error();
    } catch (e) {
        heroContent = JSON.parse(localStorage.getItem('page_hero') || '{}');
    }
    if (Object.keys(heroContent).length) localStorage.setItem('page_hero', JSON.stringify(heroContent));
    
    // Update subtitle
    const subtitleEl = document.querySelector('.hero-title .title-small');
    if (subtitleEl && heroContent.subtitle) {
        subtitleEl.textContent = heroContent.subtitle;
    }
    
    // Update main title
    const titleEl = document.querySelector('.hero-title .title-main');
    if (titleEl && heroContent.title) {
        titleEl.textContent = heroContent.title;
    }
    
    // Update description
    const descEl = document.querySelector('.hero-description');
    if (descEl && heroContent.description) {
        descEl.textContent = heroContent.description;
    }
    
    // Update statistics
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    const statLabels = document.querySelectorAll('.stat-label');
    
    if (heroContent.stat1Number && statNumbers[0]) {
        statNumbers[0].setAttribute('data-count', heroContent.stat1Number);
    }
    if (heroContent.stat1Label && statLabels[0]) {
        statLabels[0].textContent = heroContent.stat1Label;
    }
    
    if (heroContent.stat2Number && statNumbers[1]) {
        statNumbers[1].setAttribute('data-count', heroContent.stat2Number);
    }
    if (heroContent.stat2Label && statLabels[1]) {
        statLabels[1].textContent = heroContent.stat2Label;
    }
    
    if (heroContent.stat3Number && statNumbers[2]) {
        statNumbers[2].setAttribute('data-count', heroContent.stat3Number);
    }
    if (heroContent.stat3Label && statLabels[2]) {
        statLabels[2].textContent = heroContent.stat3Label;
    }
    
    // Update hero image
    if (heroContent.image) {
        const heroPlaceholder = document.querySelector('.hero-image .image-placeholder');
        if (heroPlaceholder) {
            const img = document.createElement('img');
            img.src = heroContent.image;
            img.alt = 'Prof. Dr. Ahmet Evlice';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg);';
            img.onerror = function() {
                console.warn('Hero image failed to load:', heroContent.image);
                this.style.display = 'none';
            };
            heroPlaceholder.innerHTML = '';
            heroPlaceholder.appendChild(img);
        }
    }
}

/**
 * Load About Section Content (API öncelikli)
 */
async function loadAboutContent() {
    let aboutContent = {};
    try {
        const r = await fetch(API_BASE + '/api/pages/about');
        if (r.ok) aboutContent = await r.json();
        else throw new Error();
    } catch (e) {
        aboutContent = JSON.parse(localStorage.getItem('page_about') || '{}');
    }
    if (Object.keys(aboutContent).length) localStorage.setItem('page_about', JSON.stringify(aboutContent));
    
    // Update title
    const titleEl = document.querySelector('.about .section-title');
    if (titleEl && aboutContent.title) {
        titleEl.textContent = aboutContent.title;
    }
    
    // Update paragraphs
    const textEls = document.querySelectorAll('.about-text');
    if (textEls[0] && aboutContent.text1) {
        textEls[0].textContent = aboutContent.text1;
    }
    if (textEls[1] && aboutContent.text2) {
        textEls[1].textContent = aboutContent.text2;
    }
    
    // Update about image
    if (aboutContent.image) {
        const aboutPlaceholder = document.querySelector('.about-image .image-placeholder');
        if (aboutPlaceholder) {
            const img = document.createElement('img');
            img.src = aboutContent.image;
            img.alt = 'Prof. Dr. Ahmet Evlice';
            img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
            img.onerror = function() {
                console.warn('About image failed to load:', aboutContent.image);
                this.style.display = 'none';
            };
            aboutPlaceholder.innerHTML = '';
            aboutPlaceholder.appendChild(img);
        }
    }
}

/**
 * Load Contact Section Content (API öncelikli)
 */
async function loadContactContent() {
    let contactContent = {};
    try {
        const r = await fetch(API_BASE + '/api/pages/contact');
        if (r.ok) contactContent = await r.json();
        else throw new Error();
    } catch (e) {
        contactContent = JSON.parse(localStorage.getItem('page_contact') || '{}');
    }
    if (Object.keys(contactContent).length) localStorage.setItem('page_contact', JSON.stringify(contactContent));
    
    // Update phone numbers in header
    const navPhone = document.querySelector('.nav-phone span');
    if (navPhone && contactContent.phone1) {
        navPhone.textContent = contactContent.phone1;
    }
    
    // Update phone link in header
    const navPhoneLink = document.querySelector('.nav-phone');
    if (navPhoneLink && contactContent.phone1) {
        navPhoneLink.href = `tel:${contactContent.phone1.replace(/\s/g, '')}`;
    }
    
    // Update contact info cards - Phone
    const phoneCard = document.getElementById('contact-phone-card');
    const phoneLink = document.getElementById('contact-phone-link');
    if (phoneCard && phoneLink) {
        if (contactContent.phone1) {
            let phoneHTML = `<h4>Telefon</h4>`;
            phoneHTML += `<p><a href="tel:${contactContent.phone1.replace(/\s/g, '')}">${contactContent.phone1}</a></p>`;
            if (contactContent.phone2) {
                phoneHTML += `<p><a href="tel:${contactContent.phone2.replace(/\s/g, '')}">${contactContent.phone2}</a></p>`;
            }
            phoneCard.innerHTML = phoneHTML;
        } else {
            phoneCard.innerHTML = `<h4>Telefon</h4><p>Telefon numarası eklenmemiş</p>`;
        }
    }
    
    // Update email
    const emailCard = document.querySelector('.info-card:nth-child(3) .info-content');
    if (emailCard && contactContent.email) {
        emailCard.innerHTML = `<h4>E-posta</h4><p><a href="mailto:${contactContent.email}">${contactContent.email}</a></p>`;
    }
    
    // Update address
    const addressCard = document.querySelector('.info-card:nth-child(1) .info-content');
    if (addressCard && contactContent.address) {
        addressCard.innerHTML = `<h4>Adres</h4><p>${contactContent.address}</p>`;
    }
    
    // Update working hours
    const hoursCard = document.querySelector('.info-card:nth-child(4) .info-content');
    if (hoursCard && (contactContent.hoursWeekday || contactContent.hoursSaturday)) {
        let hoursHTML = `<h4>Çalışma Saatleri</h4>`;
        if (contactContent.hoursWeekday) {
            hoursHTML += `<p>Pazartesi - Cuma: ${contactContent.hoursWeekday}</p>`;
        }
        if (contactContent.hoursSaturday) {
            hoursHTML += `<p>Cumartesi: ${contactContent.hoursSaturday}</p>`;
        }
        hoursCard.innerHTML = hoursHTML;
    }
    
    // Update WhatsApp button
    const whatsappBtn = document.querySelector('.whatsapp-btn');
    if (whatsappBtn) {
        if (contactContent.whatsapp) {
            // Remove any spaces or special characters, keep only numbers
            const cleanNumber = contactContent.whatsapp.replace(/\D/g, '');
            
            // wa.me format automatically opens WhatsApp app on mobile devices
            // and WhatsApp Web on desktop - this is the most reliable method
            whatsappBtn.href = `https://wa.me/${cleanNumber}`;
            whatsappBtn.style.display = 'flex';
            whatsappBtn.style.opacity = '1';
            whatsappBtn.style.cursor = 'pointer';
            whatsappBtn.onclick = null;
        } else {
            // Show button but disable it if no number is set
            whatsappBtn.style.display = 'flex';
            whatsappBtn.href = '#';
            whatsappBtn.style.opacity = '0.5';
            whatsappBtn.style.cursor = 'not-allowed';
            whatsappBtn.onclick = function(e) {
                e.preventDefault();
                alert('WhatsApp numarası henüz ayarlanmamış. Lütfen admin panelinden WhatsApp numarasını ekleyin.');
            };
        }
    }
    
    // Update footer contact
    const footerPhone = document.querySelector('.footer-contact a[href^="tel:"]');
    if (footerPhone && contactContent.phone1) {
        footerPhone.href = `tel:${contactContent.phone1.replace(/\s/g, '')}`;
        footerPhone.textContent = contactContent.phone1;
    }
    
    const footerEmail = document.querySelector('.footer-contact a[href^="mailto:"]');
    if (footerEmail && contactContent.email) {
        footerEmail.href = `mailto:${contactContent.email}`;
        footerEmail.textContent = contactContent.email;
    }
    
    const footerAddress = document.querySelector('.footer-address');
    if (footerAddress && contactContent.address) {
        footerAddress.textContent = contactContent.address;
    }
}

/**
 * Load Social Media Links (API öncelikli)
 */
async function loadSocialLinks() {
    let socialContent = {};
    try {
        const r = await fetch(API_BASE + '/api/pages/social');
        if (r.ok) socialContent = await r.json();
        else throw new Error();
    } catch (e) {
        socialContent = JSON.parse(localStorage.getItem('page_social') || '{}');
    }
    if (Object.keys(socialContent).length) localStorage.setItem('page_social', JSON.stringify(socialContent));
    
    // Header social links
    const headerSocial = document.querySelectorAll('.nav-social .social-link');
    if (headerSocial.length >= 3) {
        if (socialContent.facebook) headerSocial[0].href = socialContent.facebook;
        if (socialContent.instagram) headerSocial[1].href = socialContent.instagram;
        if (socialContent.youtube) headerSocial[2].href = socialContent.youtube;
    }
    
    // Footer social links
    const footerSocial = document.querySelectorAll('.footer-social .social-link');
    if (footerSocial.length >= 4) {
        if (socialContent.facebook) footerSocial[0].href = socialContent.facebook;
        if (socialContent.instagram) footerSocial[1].href = socialContent.instagram;
        if (socialContent.youtube) footerSocial[2].href = socialContent.youtube;
        if (socialContent.linkedin) footerSocial[3].href = socialContent.linkedin;
    }
}

/**
 * Refresh page content (can be called from admin panel)
 */
window.refreshPageContent = async function() {
    await loadHeroContent();
    await loadAboutContent();
    await loadContactContent();
    await loadSocialLinks();
    await loadDynamicBlogs();
    initWhatsAppButton();
};

