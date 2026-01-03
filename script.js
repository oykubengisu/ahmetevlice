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
        setTimeout(function() {
            preloader.classList.add('hidden');
        }, 500);
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
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#') return;
            
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
 * Parallax Effect for Hero Background
 */
window.addEventListener('scroll', function() {
    const scrolled = window.scrollY;
    const heroPattern = document.querySelector('.hero-pattern');
    
    if (heroPattern && scrolled < window.innerHeight) {
        heroPattern.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

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
 * WhatsApp Button Pulse Animation
 */
const whatsappBtn = document.querySelector('.whatsapp-btn');
if (whatsappBtn) {
    setInterval(() => {
        whatsappBtn.style.transform = 'translateY(-5px) scale(1.05)';
        setTimeout(() => {
            whatsappBtn.style.transform = 'translateY(0) scale(1)';
        }, 200);
    }, 3000);
}

/**
 * Dynamic Year in Footer
 */
const yearElement = document.querySelector('.footer-bottom p');
if (yearElement) {
    const currentYear = new Date().getFullYear();
    yearElement.innerHTML = yearElement.innerHTML.replace('2024', currentYear);
}

console.log('Prof. Dr. Ahmet Evlice Website - Loaded Successfully');

// ========================================
// Dynamic Blog Section
// ========================================
function loadDynamicBlogs() {
    const blogGrid = document.querySelector('.blog-grid');
    if (!blogGrid) return;
    
    // Get published blogs from localStorage
    const blogs = JSON.parse(localStorage.getItem('blog_posts') || '[]')
        .filter(blog => blog.status === 'published')
        .slice(0, 6);
    
    // If no blogs in admin, keep the static content
    if (blogs.length === 0) return;
    
    // Category icons mapping
    const categoryIcons = {
        'migren': 'fas fa-head-side-virus',
        'alzheimer': 'fas fa-brain',
        'parkinson': 'fas fa-user-injured',
        'epilepsi': 'fas fa-bolt',
        'inme': 'fas fa-heartbeat',
        'uyku': 'fas fa-bed',
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
        const icon = categoryIcons[blog.category] || 'fas fa-newspaper';
        const label = categoryLabels[blog.category] || blog.category;
        const delay = ((index % 3) + 1) * 100;
        
        return `
            <article class="blog-card" data-aos="fade-up" data-aos-delay="${delay}">
                <div class="blog-image">
                    ${blog.image ? 
                        `<img src="${blog.image}" alt="${blog.title}" style="width:100%;height:100%;object-fit:cover;">` :
                        `<div class="blog-image-placeholder"><i class="${icon}"></i></div>`
                    }
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
                        <a href="#">${blog.title}</a>
                    </h3>
                    <p class="blog-excerpt">
                        ${blog.excerpt || blog.title}
                    </p>
                    <a href="#" class="blog-link">
                        <span>Devamını Oku</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </article>
        `;
    }).join('');
    
    blogGrid.innerHTML = blogsHTML;
    
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
// Load Page Content from Admin Panel
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    loadHeroContent();
    loadAboutContent();
    loadContactContent();
    loadSocialLinks();
});

/**
 * Load Hero Section Content
 */
function loadHeroContent() {
    const heroContent = JSON.parse(localStorage.getItem('page_hero') || '{}');
    
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
            heroPlaceholder.innerHTML = `<img src="${heroContent.image}" alt="Prof. Dr. Ahmet Evlice" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg);">`;
        }
    }
}

/**
 * Load About Section Content
 */
function loadAboutContent() {
    const aboutContent = JSON.parse(localStorage.getItem('page_about') || '{}');
    
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
            aboutPlaceholder.innerHTML = `<img src="${aboutContent.image}" alt="Prof. Dr. Ahmet Evlice" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }
}

/**
 * Load Contact Section Content
 */
function loadContactContent() {
    const contactContent = JSON.parse(localStorage.getItem('page_contact') || '{}');
    
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
    
    // Update contact info cards
    const phoneCard = document.querySelector('.info-card:nth-child(2) .info-content');
    if (phoneCard && contactContent.phone1) {
        let phoneHTML = `<h4>Telefon</h4>`;
        phoneHTML += `<p><a href="tel:${contactContent.phone1.replace(/\s/g, '')}">${contactContent.phone1}</a></p>`;
        if (contactContent.phone2) {
            phoneHTML += `<p><a href="tel:${contactContent.phone2.replace(/\s/g, '')}">${contactContent.phone2}</a></p>`;
        }
        phoneCard.innerHTML = phoneHTML;
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
    if (whatsappBtn && contactContent.whatsapp) {
        whatsappBtn.href = `https://wa.me/${contactContent.whatsapp}`;
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
 * Load Social Media Links
 */
function loadSocialLinks() {
    const socialContent = JSON.parse(localStorage.getItem('page_social') || '{}');
    
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
window.refreshPageContent = function() {
    loadHeroContent();
    loadAboutContent();
    loadContactContent();
    loadSocialLinks();
    loadDynamicBlogs();
};

