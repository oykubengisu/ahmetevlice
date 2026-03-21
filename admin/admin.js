/**
 * Admin Panel JavaScript
 * Prof. Dr. Ahmet Evlice
 */

// ========================================
// Configuration
// ========================================
const API_BASE = ''; // Aynı domain (Vercel)

const CONFIG = {
    storageKeys: {
        token: 'admin_token',
        blogs: 'blog_posts'
    }
};

// ========================================
// Utility Functions
// ========================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatDateInput(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

// Global state for PDF content
let currentPdfData = null;
let currentPdfName = '';
let currentPdfSize = '';

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.querySelector('.toast-message').textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function getCategoryLabel(category) {
    const labels = {
        'migren': 'Migren',
        'alzheimer': 'Demans, Alzheimer ve Parkinson',
        'parkinson': 'Nöropsikoloji',
        'bas-agrisi': 'Baş Ağrısı, Baş Dönmesi ve Ağrı Blokajları',
        'epilepsi': 'Epilepsi ve EEG',
        'inme': 'Serebrovasküler Hastalıklar',
        'botoks': 'Botoks Uygulamaları',
        'agri': 'Ağrı Blokları',
        'uyku': 'Uyku Bozuklukları',
        'emg': 'EMG',
        'bilgilendirme': 'Bilgilendirme',
        'diger': 'Diğer Nörolojik Hastalıklar',
        'genel': 'Genel'
    };
    return labels[category] || category;
}

// ========================================
// Storage / API Functions
// ========================================
// Render cold start için tekrar deneme (free tier 15 dk sonra uyur)
async function fetchWithRetry(url, options = {}, retries = 2) {
    for (let i = 0; i <= retries; i++) {
        try {
            const r = await fetch(url, options);
            return r;
        } catch (e) {
            if (i < retries) {
                await new Promise(r => setTimeout(r, 3000));
            } else {
                throw e;
            }
        }
    }
}

async function getBlogs() {
    try {
        const r = await fetchWithRetry(API_BASE + '/api/blogs');
        if (!r.ok) throw new Error();
        return await r.json();
    } catch (e) {
        const data = localStorage.getItem(CONFIG.storageKeys.blogs);
        return data ? JSON.parse(data) : [];
    }
}

function saveBlogsToLocal(blogs) {
    try {
        localStorage.setItem(CONFIG.storageKeys.blogs, JSON.stringify(blogs));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            const slimBlogs = blogs.map(b => ({ ...b, pdfData: null, pdfName: '', pdfSize: '' }));
            try {
                localStorage.setItem(CONFIG.storageKeys.blogs, JSON.stringify(slimBlogs));
                showToast('Depolama sınırı aşıldı. PDF içerikleri kaldırılarak kaydedildi.', 'error');
            } catch (err) {
                showToast('Depolama sınırı aşıldı.', 'error');
            }
        } else {
            showToast('Blog verileri kaydedilemedi.', 'error');
        }
    }
}

async function getBlog(id) {
    const blogs = await getBlogs();
    const idStr = id != null ? String(id) : '';
    return blogs.find(blog => String(blog.id) === idStr || blog.id === id);
}

async function saveBlog(blog) {
    try {
        const res = await fetchWithRetry(API_BASE + '/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
            body: JSON.stringify(blog)
        });
        if (res.status === 401) { logout(); return blog; }
        if (!res.ok) throw new Error();
        if (window.updateMainPageBlogs) window.updateMainPageBlogs();
        return blog;
    } catch (e) {
        showToast('Sunucuya bağlanılamadı. Değişiklikler kaydedilmedi. Lütfen tekrar deneyin.', 'error');
        throw e;
    }
}

async function deleteBlog(id) {
    try {
        const res = await fetchWithRetry(API_BASE + '/api/blogs/' + encodeURIComponent(id), {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) throw new Error();
    } catch (e) {
        showToast('Sunucuya bağlanılamadı. Silme işlemi yapılamadı. Lütfen tekrar deneyin.', 'error');
        throw e;
    }
}

// API isteklerinde kullanılacak auth header (yazma işlemleri için)
function getAuthHeader() {
    const token = sessionStorage.getItem(CONFIG.storageKeys.token);
    return token ? { 'Authorization': 'Bearer ' + token } : {};
}

function isLoggedIn() {
    return !!sessionStorage.getItem(CONFIG.storageKeys.token);
}

async function login(username, password) {
    try {
        const res = await fetchWithRetry(API_BASE + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.token) {
            sessionStorage.setItem(CONFIG.storageKeys.token, data.token);
            return { ok: true };
        }
        const msg = data.error || (res.status === 503 ? 'Sunucu yapılandırması eksik.' : res.status === 401 ? 'Kullanıcı adı veya şifre hatalı.' : 'Giriş başarısız.');
        return { ok: false, message: msg };
    } catch (e) {
        return { ok: false, message: 'API\'ye bağlanılamadı. Bağlantıyı kontrol edin.' };
    }
}

function logout() {
    const token = sessionStorage.getItem(CONFIG.storageKeys.token);
    if (token) {
        fetch(API_BASE + '/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        }).catch(() => {});
    }
    sessionStorage.removeItem(CONFIG.storageKeys.token);
    window.location.href = 'index.html';
}

// ========================================
// Login Page
// ========================================
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    
    if (!loginForm) return;
    
    // URL'de kullanıcı adı/şifre varsa kaldır (güvenlik)
    const url = new URL(window.location.href);
    if (url.searchParams.has('username') || url.searchParams.has('password')) {
        url.searchParams.delete('username');
        url.searchParams.delete('password');
        window.history.replaceState({}, '', url.pathname);
    }
    
    // Check if already logged in
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }
    
    // Login form submit (API üzerinden giriş)
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password) {
            loginError.querySelector('span').textContent = 'Kullanıcı adı ve şifre girin.';
            loginError.classList.add('show');
            setTimeout(() => loginError.classList.remove('show'), 4000);
            return;
        }
        const result = await login(username, password);
        if (result.ok) {
            window.location.href = 'dashboard.html';
        } else {
            loginError.querySelector('span').textContent = result.message || 'Kullanıcı adı veya şifre hatalı!';
            loginError.classList.add('show');
            setTimeout(() => loginError.classList.remove('show'), 5000);
        }
    });
}

// ========================================
// Dashboard Page
// ========================================
async function initDashboardPage() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
    // Token geçerli mi kontrol et
    try {
        const r = await fetchWithRetry(API_BASE + '/api/auth/me', { headers: getAuthHeader() });
        if (r.status === 401) {
            sessionStorage.removeItem(CONFIG.storageKeys.token);
            window.location.href = 'index.html';
            return;
        }
    } catch (e) {
        // Ağ hatası; yine de devam et, yazma sırasında 401 alırsa çıkış yapar
    }
    initSidebar();
    initNavigation();
    initUserDropdown();
    initDashboardStats();
    initRecentPosts();
    initQuickActions();
    initBlogsPage();
    initBlogForm();
    initPagesContent();
    initMediaGallery();
    initSettings();
    initDeleteModal();
    
    // Set default date for new blog
    const blogDate = document.getElementById('blog-date');
    if (blogDate) {
        blogDate.value = formatDateInput(new Date());
    }
}

// Sidebar Toggle
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('show');
        });
    }
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('show');
        });
    }
    
    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && 
            sidebar.classList.contains('show') && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
}

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const pages = document.querySelectorAll('.page');
    
    function showPage(pageName) {
        // Özel durumlar: aynı sayfa, farklı görünüm/tür
        let effectivePage = pageName;
        let blogScope = null;
        let newBlogKind = null;
        if (pageName === 'blogs-blog') {
            effectivePage = 'blogs';
            blogScope = 'blog';
        } else if (pageName === 'blogs') {
            blogScope = 'makale';
        } else if (pageName === 'new-blog-blog') {
            effectivePage = 'new-blog';
            newBlogKind = 'blog';
        } else if (pageName === 'new-blog') {
            newBlogKind = 'makale';
        }
        
        // Update nav
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // Show page
        pages.forEach(page => {
            page.classList.toggle('active', page.id === `${effectivePage}-page`);
        });
        
        // Blog scope'u ayarla
        if (blogScope && window.setBlogsScopeFromNav) {
            window.setBlogsScopeFromNav(blogScope);
        }
        // Yeni yazı türünü ayarla
        if (newBlogKind && window.setNewBlogKindFromNav) {
            window.setNewBlogKindFromNav(newBlogKind);
        }
        
        // Update URL hash
        window.location.hash = pageName;
        
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('show');
    }
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(item.dataset.page);
        });
    });
    
    // Handle hash on load
    const hash = window.location.hash.slice(1) || 'dashboard';
    showPage(hash);
    
    // Handle hash change
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        showPage(hash);
    });
}

// User Dropdown
function initUserDropdown() {
    const userBtn = document.getElementById('user-btn');
    const dropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (userBtn) {
        userBtn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (dropdown && !userBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// Dashboard Stats
async function initDashboardStats() {
    const blogs = await getBlogs();
    const totalBlogs = document.getElementById('total-blogs');
    const publishedBlogs = document.getElementById('published-blogs');
    const draftBlogs = document.getElementById('draft-blogs');
    const totalViews = document.getElementById('total-views');
    if (totalBlogs) totalBlogs.textContent = blogs.length;
    if (publishedBlogs) publishedBlogs.textContent = blogs.filter(b => b.status === 'published').length;
    if (draftBlogs) draftBlogs.textContent = blogs.filter(b => b.status === 'draft').length;
    if (totalViews) totalViews.textContent = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
}

// Recent Posts
async function initRecentPosts() {
    const container = document.getElementById('recent-posts-list');
    if (!container) return;
    const blogs = (await getBlogs()).slice(0, 5);
    if (blogs.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">Henüz yazı yok</p>';
        return;
    }
    container.innerHTML = blogs.map(blog => `
        <div class="recent-post-item">
            <div class="post-icon"><i class="fas fa-newspaper"></i></div>
            <div class="post-info">
                <div class="post-title">${blog.title}</div>
                <div class="post-meta">${formatDate(blog.date || blog.createdAt)}</div>
            </div>
            <span class="post-status ${blog.status}">${blog.status === 'published' ? 'Yayında' : 'Taslak'}</span>
        </div>
    `).join('');
}

// Quick Actions
function initQuickActions() {
    const buttons = document.querySelectorAll('.quick-action-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            
            switch(action) {
                case 'new-blog':
                    window.location.hash = 'new-blog';
                    break;
                case 'pages':
                    window.location.hash = 'pages';
                    break;
                case 'media':
                    window.location.hash = 'media';
                    break;
                case 'view-site':
                    window.open('../index.html', '_blank');
                    break;
                case 'settings':
                    window.location.hash = 'settings';
                    break;
            }
        });
    });
}

// ========================================
// Blogs Page
// ========================================
let currentBlogScope = 'makale'; // 'makale' veya 'blog'
function initBlogsPage() {
    const addBlogBtn = document.getElementById('add-blog-btn');
    const searchInput = document.getElementById('blog-search');
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');
    const scopeTabs = document.querySelectorAll('.blogs-tabs .tab-btn');
    
    if (addBlogBtn) {
        addBlogBtn.addEventListener('click', () => {
            resetBlogForm();
            window.location.hash = 'new-blog';
        });
    }
    
    // Filters
    if (searchInput) {
        searchInput.addEventListener('input', renderBlogsTable);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', renderBlogsTable);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', renderBlogsTable);
    }
    
    // Makale / Blog sekmeleri
    scopeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const scope = tab.getAttribute('data-blog-scope') || 'makale';
            if (window.setBlogsScopeFromNav) {
                window.setBlogsScopeFromNav(scope);
            }
        });
    });
    
    // Navigation'dan scope değiştirmek için global yardımcı
    window.setBlogsScopeFromNav = function(scope) {
        const targetScope = scope || 'makale';
        currentBlogScope = targetScope;
        const tabs = document.querySelectorAll('.blogs-tabs .tab-btn');
        tabs.forEach(t => {
            const tabScope = t.getAttribute('data-blog-scope') || 'makale';
            t.classList.toggle('active', tabScope === targetScope);
        });
        renderBlogsTable();
    };
    
    // İlk yüklemede, hash'e göre scope seç
    const hash = window.location.hash.slice(1);
    if (hash === 'blogs-blog' && window.setBlogsScopeFromNav) {
        window.setBlogsScopeFromNav('blog');
    } else if (window.setBlogsScopeFromNav) {
        window.setBlogsScopeFromNav('makale');
    }
}

async function renderBlogsTable() {
    const tbody = document.getElementById('blogs-table-body');
    const emptyState = document.getElementById('blogs-empty');
    const tableWrapper = document.querySelector('.blogs-table-wrapper');
    if (!tbody) return;
    let blogs = await getBlogs();
    const searchTerm = document.getElementById('blog-search')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('filter-category')?.value || '';
    const statusFilter = document.getElementById('filter-status')?.value || '';
    if (searchTerm) blogs = blogs.filter(b => b.title.toLowerCase().includes(searchTerm));
    if (categoryFilter) blogs = blogs.filter(b => b.category === categoryFilter);
    if (statusFilter) blogs = blogs.filter(b => b.status === statusFilter);
    
    // Tür filtresi (Makaleler / Blog Yazıları)
    blogs = blogs.filter(b => {
        const kind = b.kind || 'makale';
        if (currentBlogScope === 'blog') return kind === 'blog';
        // Varsayılan: makaleler görünür, blog yazıları hariç
        return kind !== 'blog';
    });
    if (blogs.length === 0) {
        tableWrapper.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    tableWrapper.style.display = 'block';
    emptyState.style.display = 'none';
    tbody.innerHTML = blogs.map(blog => `
        <tr>
            <td class="blog-title-cell">${blog.title}</td>
            <td><span class="category-badge">${getCategoryLabel(blog.category)}</span></td>
            <td><span class="status-badge ${blog.status}">${blog.status === 'published' ? 'Yayında' : 'Taslak'}</span></td>
            <td>${formatDate(blog.date || blog.createdAt)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-edit" onclick="editBlog('${blog.id}')" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="confirmDelete('${blog.id}')" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ========================================
// Blog Form
// ========================================
function initBlogForm() {
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const publishBtn = document.getElementById('publish-btn');
    const imageUpload = document.getElementById('featured-image-upload');
    const imageInput = document.getElementById('featured-image-input');
    const imagePreview = document.getElementById('featured-image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const removeImageBtn = document.getElementById('remove-image');
    // PDF upload elements
    const pdfUpload = document.getElementById('pdf-upload');
    const pdfInput = document.getElementById('pdf-file-input');
    const pdfPlaceholder = document.getElementById('pdf-upload-placeholder');
    const pdfInfo = document.getElementById('pdf-file-info');
    const pdfFileName = document.getElementById('pdf-file-name');
    const pdfFileSize = document.getElementById('pdf-file-size');
    const pdfUrlInput = document.getElementById('blog-pdf-url');
    const kindSelect = document.getElementById('blog-kind');
    
    // Editor toolbar
    initEditor();
    
    // Save draft
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => saveBlogPost('draft'));
    }
    
    // Publish
    if (publishBtn) {
        publishBtn.addEventListener('click', () => saveBlogPost('published'));
    }
    
    // Image upload
    if (uploadPlaceholder) {
        uploadPlaceholder.addEventListener('click', () => imageInput.click());
    }
    
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    removeImageBtn.style.display = 'flex';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imagePreview.src = '';
            imagePreview.style.display = 'none';
            uploadPlaceholder.style.display = 'block';
            removeImageBtn.style.display = 'none';
            imageInput.value = '';
        });
    }

    // PDF upload handlers
    if (pdfUpload && pdfInput) {
        pdfUpload.addEventListener('click', () => pdfInput.click());
        if (pdfPlaceholder) {
            pdfPlaceholder.addEventListener('click', (e) => {
                e.stopPropagation();
                pdfInput.click();
            });
        }
        pdfInput.addEventListener('change', function() {
            const file = this.files && this.files[0];
            if (!file) return;
            
            if (file.type !== 'application/pdf') {
                showToast('Lütfen PDF formatında bir dosya seçin.', 'error');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                currentPdfData = e.target.result;
                currentPdfName = file.name;
                currentPdfSize = formatFileSize(file.size);
                
                if (pdfFileName) pdfFileName.textContent = currentPdfName;
                if (pdfFileSize) pdfFileSize.textContent = currentPdfSize;
                
                if (pdfPlaceholder) pdfPlaceholder.style.display = 'none';
                if (pdfInfo) pdfInfo.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        });
    }
    
    const removePdfBtn = document.getElementById('remove-pdf');
    if (removePdfBtn) {
        removePdfBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentPdfData = null;
            currentPdfName = '';
            currentPdfSize = '';
            if (pdfInfo) pdfInfo.style.display = 'none';
            if (pdfPlaceholder) pdfPlaceholder.style.display = 'block';
            if (pdfInput) pdfInput.value = '';
        });
    }

    // Navigation'dan tür set etmek için yardımcı (Yeni Yazı / Yeni Blog Yazısı)
    window.setNewBlogKindFromNav = function(kind) {
        const targetKind = kind || 'makale';
        const blogIdEl = document.getElementById('blog-id');
        const isEditing = blogIdEl && blogIdEl.value && blogIdEl.value.trim() !== '';
        if (!isEditing && kindSelect) {
            kindSelect.value = targetKind;
        }
        const titleEl = document.getElementById('blog-form-title');
        if (titleEl) {
            titleEl.textContent = isEditing ? 'Yazıyı Düzenle' : (targetKind === 'blog' ? 'Yeni Blog Yazısı' : 'Yeni Makale');
        }
        if (!isEditing) {
            resetBlogForm();
            if (kindSelect) kindSelect.value = targetKind;
        }
    };
}

function initEditor() {
    const toolbar = document.querySelector('.editor-toolbar');
    const editor = document.getElementById('blog-content');
    
    if (!toolbar || !editor) return;
    
    toolbar.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            
            if (command.startsWith('formatBlock-')) {
                const tag = command.split('-')[1];
                document.execCommand('formatBlock', false, tag);
            } else if (command === 'createLink') {
                const url = prompt('Link URL:');
                if (url) document.execCommand('createLink', false, url);
            } else if (command === 'insertImage') {
                const url = prompt('Görsel URL:');
                if (url) document.execCommand('insertImage', false, url);
            } else {
                document.execCommand(command, false, null);
            }
            
            editor.focus();
        });
    });
}

async function saveBlogPost(status) {
    const id = document.getElementById('blog-id').value;
    const title = document.getElementById('blog-title').value;
    const excerpt = document.getElementById('blog-excerpt').value;
    const content = document.getElementById('blog-content').innerHTML;
    const category = document.getElementById('blog-category').value;
    const kindSelect = document.getElementById('blog-kind');
    const kind = kindSelect ? (kindSelect.value || 'makale') : 'makale';
    const date = document.getElementById('blog-date').value;
    const readTime = document.getElementById('blog-read-time').value;
    const metaTitle = document.getElementById('blog-meta-title')?.value.trim() || '';
    const metaDesc = document.getElementById('blog-meta-desc')?.value.trim() || '';
    const image = document.getElementById('featured-image-preview').src;
    const pdfUrl = document.getElementById('blog-pdf-url')?.value.trim() || '';
    
    if (!title || !category) {
        showToast('Başlık ve kategori zorunludur!', 'error');
        return;
    }
    
    const blog = {
        id: id || null,
        title,
        excerpt,
        content,
        category,
        kind,
        date: date || new Date().toISOString(),
        readTime: parseInt(readTime) || 5,
        metaTitle,
        // Yeni detay sayfası metaDescription bekliyor; geriye dönük uyum için metaDesc de saklanır
        metaDescription: metaDesc,
        metaDesc,
        image: image || '',
        // Eğer PDF URL girildiyse onu kullan, aksi halde (varsa) base64 PDF'i sakla
        pdfUrl: pdfUrl || '',
        pdfData: pdfUrl ? null : (currentPdfData || null),
        pdfName: pdfUrl ? '' : (currentPdfName || ''),
        pdfSize: pdfUrl ? '' : (currentPdfSize || ''),
        status
    };
    
    try {
        await saveBlog(blog);
        showToast(status === 'published' ? 'Yazı yayınlandı!' : 'Taslak kaydedildi!', 'success');
        initDashboardStats();
        initRecentPosts();
        renderBlogsTable();
        setTimeout(() => {
            window.location.hash = 'blogs';
            resetBlogForm();
        }, 1000);
    } catch (e) {
        // Hata saveBlog içinde gösterildi
    }
}

function resetBlogForm() {
    document.getElementById('blog-id').value = '';
    document.getElementById('blog-title').value = '';
    document.getElementById('blog-excerpt').value = '';
    document.getElementById('blog-content').innerHTML = '';
    document.getElementById('blog-category').value = '';
    const kindSelect = document.getElementById('blog-kind');
    if (kindSelect) {
        kindSelect.value = 'makale';
    }
    document.getElementById('blog-date').value = formatDateInput(new Date());
    document.getElementById('blog-read-time').value = '5';
    document.getElementById('blog-meta-title').value = '';
    document.getElementById('blog-meta-desc').value = '';
    const pdfUrlInput = document.getElementById('blog-pdf-url');
    
    const imagePreview = document.getElementById('featured-image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const removeImageBtn = document.getElementById('remove-image');
    
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    uploadPlaceholder.style.display = 'block';
    removeImageBtn.style.display = 'none';
    
    document.getElementById('blog-form-title').textContent = 'Yeni Blog Yazısı';
    
    // Reset PDF state
    currentPdfData = null;
    currentPdfName = '';
    currentPdfSize = '';
    const pdfPlaceholder = document.getElementById('pdf-upload-placeholder');
    const pdfInfo = document.getElementById('pdf-file-info');
    const pdfInput = document.getElementById('pdf-file-input');
    if (pdfPlaceholder) pdfPlaceholder.style.display = 'block';
    if (pdfInfo) pdfInfo.style.display = 'none';
    if (pdfInput) pdfInput.value = '';
    if (pdfUrlInput) pdfUrlInput.value = '';
}

window.editBlog = async function(id) {
    const blog = await getBlog(id);
    if (!blog) return;
    
    document.getElementById('blog-id').value = blog.id;
    document.getElementById('blog-title').value = blog.title;
    document.getElementById('blog-excerpt').value = blog.excerpt || '';
    document.getElementById('blog-content').innerHTML = blog.content || '';
    document.getElementById('blog-category').value = blog.category;
    document.getElementById('blog-date').value = formatDateInput(blog.date);
    document.getElementById('blog-read-time').value = blog.readTime || 5;
    document.getElementById('blog-meta-title').value = blog.metaTitle || '';
    document.getElementById('blog-meta-desc').value = blog.metaDescription || blog.metaDesc || '';
    
    if (blog.image) {
        const imagePreview = document.getElementById('featured-image-preview');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const removeImageBtn = document.getElementById('remove-image');
        
        imagePreview.src = blog.image;
        imagePreview.style.display = 'block';
        uploadPlaceholder.style.display = 'none';
        removeImageBtn.style.display = 'flex';
    }
    
    const kindSelect = document.getElementById('blog-kind');
    if (kindSelect) {
        kindSelect.value = blog.kind || 'makale';
    }
    
    document.getElementById('blog-form-title').textContent = 'Yazıyı Düzenle';
    
    // Load PDF URL / data if exists
    const pdfUrlInput = document.getElementById('blog-pdf-url');
    if (pdfUrlInput) {
        pdfUrlInput.value = blog.pdfUrl || '';
    }
    
    currentPdfData = blog.pdfData || null;
    currentPdfName = blog.pdfName || '';
    currentPdfSize = blog.pdfSize || '';
    const pdfPlaceholder = document.getElementById('pdf-upload-placeholder');
    const pdfInfo = document.getElementById('pdf-file-info');
    const pdfFileName = document.getElementById('pdf-file-name');
    const pdfFileSize = document.getElementById('pdf-file-size');
    
    if (currentPdfData && currentPdfName && pdfInfo && pdfPlaceholder && !blog.pdfUrl) {
        if (pdfFileName) pdfFileName.textContent = currentPdfName;
        if (pdfFileSize) pdfFileSize.textContent = currentPdfSize;
        pdfPlaceholder.style.display = 'none';
        pdfInfo.style.display = 'flex';
    } else {
        if (pdfPlaceholder) pdfPlaceholder.style.display = 'block';
        if (pdfInfo) pdfInfo.style.display = 'none';
    }
    window.location.hash = 'new-blog';
};

// ========================================
// Delete Modal
// ========================================
let blogToDelete = null;

function initDeleteModal() {
    const modal = document.getElementById('delete-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('cancel-delete');
    const confirmBtn = document.getElementById('confirm-delete');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal.classList.remove('show'));
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (blogToDelete) {
                try {
                    await deleteBlog(blogToDelete);
                    showToast('Yazı silindi!', 'success');
                    initDashboardStats();
                    initRecentPosts();
                    renderBlogsTable();
                    blogToDelete = null;
                    modal.classList.remove('show');
                } catch (e) {
                    // Hata zaten deleteBlog içinde gösterildi
                }
            } else {
                modal.classList.remove('show');
            }
        });
    }
    
    // Close on outside click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

window.confirmDelete = function(id) {
    blogToDelete = id;
    document.getElementById('delete-modal').classList.add('show');
};

// ========================================
// Pages Content Management
// ========================================
function initPagesContent() {
    initPagesTabs();
    loadPageContent();
    initPageForms();
    initPageImageUploads();
}

function initPagesTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

async function loadPageContent() {
    const pageKeys = ['hero', 'about', 'contact', 'social'];
    const fallback = (key) => JSON.parse(localStorage.getItem('page_' + key) || '{}');
    for (const key of pageKeys) {
        let content = {};
        try {
            const r = await fetch(API_BASE + '/api/pages/' + key);
            if (r.ok) content = await r.json();
            else content = fallback(key);
        } catch (e) {
            content = fallback(key);
        }
        if (key === 'hero') {
            if (content.subtitle) document.getElementById('hero-subtitle').value = content.subtitle;
            if (content.title) document.getElementById('hero-title').value = content.title;
            if (content.description) document.getElementById('hero-description').value = content.description;
            if (content.stat1Number) document.getElementById('hero-stat1-number').value = content.stat1Number;
            if (content.stat1Label) document.getElementById('hero-stat1-label').value = content.stat1Label;
            if (content.stat2Number) document.getElementById('hero-stat2-number').value = content.stat2Number;
            if (content.stat2Label) document.getElementById('hero-stat2-label').value = content.stat2Label;
            if (content.stat3Number) document.getElementById('hero-stat3-number').value = content.stat3Number;
            if (content.stat3Label) document.getElementById('hero-stat3-label').value = content.stat3Label;
            if (content.image) {
                const preview = document.getElementById('hero-image-preview');
                if (preview) preview.innerHTML = `<img src="${content.image}" alt="Hero">`;
            }
        } else if (key === 'about') {
            if (content.title) document.getElementById('about-title').value = content.title;
            if (content.text1) document.getElementById('about-text1').value = content.text1;
            if (content.text2) document.getElementById('about-text2').value = content.text2;
            if (content.image) {
                const preview = document.getElementById('about-image-preview');
                if (preview) preview.innerHTML = `<img src="${content.image}" alt="About">`;
            }
        } else if (key === 'contact') {
            if (content.phone1) document.getElementById('contact-phone1').value = content.phone1;
            if (content.phone2) document.getElementById('contact-phone2').value = content.phone2;
            if (content.email) document.getElementById('contact-email').value = content.email;
            if (content.address) document.getElementById('contact-address').value = content.address;
            if (content.hoursWeekday) document.getElementById('contact-hours-weekday').value = content.hoursWeekday;
            if (content.hoursSaturday) document.getElementById('contact-hours-saturday').value = content.hoursSaturday;
            if (content.whatsapp) document.getElementById('contact-whatsapp').value = content.whatsapp;
            if (content.map) document.getElementById('contact-map').value = content.map;
        } else if (key === 'social') {
            if (content.facebook) document.getElementById('social-facebook').value = content.facebook;
            if (content.instagram) document.getElementById('social-instagram').value = content.instagram;
            if (content.youtube) document.getElementById('social-youtube').value = content.youtube;
            if (content.linkedin) document.getElementById('social-linkedin').value = content.linkedin;
            if (content.twitter) document.getElementById('social-twitter').value = content.twitter;
        }
    }
}

function initPageForms() {
    async function savePage(key, payload) {
        try {
            const r = await fetchWithRetry(API_BASE + '/api/pages/' + key, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                body: JSON.stringify(payload)
            });
            if (r.status === 401) { logout(); return false; }
            if (!r.ok) throw new Error();
            return true;
        } catch (e) {
            showToast('Sunucuya bağlanılamadı. Değişiklikler kaydedilmedi. Lütfen tekrar deneyin.', 'error');
            return false;
        }
    }
    const heroForm = document.getElementById('hero-form');
    if (heroForm) {
        heroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const heroContent = {
                subtitle: document.getElementById('hero-subtitle').value,
                title: document.getElementById('hero-title').value,
                description: document.getElementById('hero-description').value,
                stat1Number: document.getElementById('hero-stat1-number').value,
                stat1Label: document.getElementById('hero-stat1-label').value,
                stat2Number: document.getElementById('hero-stat2-number').value,
                stat2Label: document.getElementById('hero-stat2-label').value,
                stat3Number: document.getElementById('hero-stat3-number').value,
                stat3Label: document.getElementById('hero-stat3-label').value,
                image: document.querySelector('#hero-image-preview img')?.src || ''
            };
            if (await savePage('hero', heroContent)) showToast('Hero bölümü kaydedildi!', 'success');
        });
    }
    const aboutForm = document.getElementById('about-form');
    if (aboutForm) {
        aboutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const aboutContent = {
                title: document.getElementById('about-title').value,
                text1: document.getElementById('about-text1').value,
                text2: document.getElementById('about-text2').value,
                image: document.querySelector('#about-image-preview img')?.src || ''
            };
            if (await savePage('about', aboutContent)) showToast('Hakkımda bölümü kaydedildi!', 'success');
        });
    }
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const contactContent = {
                phone1: document.getElementById('contact-phone1').value,
                phone2: document.getElementById('contact-phone2').value,
                email: document.getElementById('contact-email').value,
                address: document.getElementById('contact-address').value,
                hoursWeekday: document.getElementById('contact-hours-weekday').value,
                hoursSaturday: document.getElementById('contact-hours-saturday').value,
                whatsapp: document.getElementById('contact-whatsapp').value,
                map: document.getElementById('contact-map').value
            };
            if (await savePage('contact', contactContent)) showToast('İletişim bilgileri kaydedildi!', 'success');
        });
    }
    const socialForm = document.getElementById('social-form');
    if (socialForm) {
        socialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const socialContent = {
                facebook: document.getElementById('social-facebook').value,
                instagram: document.getElementById('social-instagram').value,
                youtube: document.getElementById('social-youtube').value,
                linkedin: document.getElementById('social-linkedin').value,
                twitter: document.getElementById('social-twitter').value
            };
            if (await savePage('social', socialContent)) showToast('Sosyal medya linkleri kaydedildi!', 'success');
        });
    }
}

function initPageImageUploads() {
    // Hero Image
    const heroUpload = document.getElementById('hero-image-upload');
    const heroInput = document.getElementById('hero-image-input');
    const heroPreview = document.getElementById('hero-image-preview');
    
    if (heroUpload && heroInput) {
        heroUpload.addEventListener('click', () => heroInput.click());
        heroInput.addEventListener('change', function() {
            handleImageUpload(this, heroPreview);
        });
    }
    
    // About Image
    const aboutUpload = document.getElementById('about-image-upload');
    const aboutInput = document.getElementById('about-image-input');
    const aboutPreview = document.getElementById('about-image-preview');
    
    if (aboutUpload && aboutInput) {
        aboutUpload.addEventListener('click', () => aboutInput.click());
        aboutInput.addEventListener('change', function() {
            handleImageUpload(this, aboutPreview);
        });
    }
}

function handleImageUpload(input, preview) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ========================================
// Media Gallery
// ========================================
function initMediaGallery() {
    const uploadZone = document.getElementById('media-upload-zone');
    const fileInput = document.getElementById('media-file-input');
    const uploadBtn = document.getElementById('upload-media-btn');
    
    if (uploadZone && fileInput) {
        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadBtn?.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleMediaUpload(files);
        });
        
        // File input change
        fileInput.addEventListener('change', function() {
            handleMediaUpload(this.files);
        });
    }
    
    // View toggle
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const grid = document.getElementById('media-grid');
            if (btn.dataset.view === 'list') {
                grid.style.gridTemplateColumns = '1fr';
            } else {
                grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
            }
        });
    });
    
    renderMediaGallery();
}

let mediaItemsCache = [];

async function getMediaItems() {
    try {
        const r = await fetch(API_BASE + '/api/media');
        if (!r.ok) throw new Error();
        return await r.json();
    } catch (e) {
        const data = localStorage.getItem('media_gallery');
        return data ? JSON.parse(data) : [];
    }
}

function handleMediaUpload(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = async function(e) {
            const mediaItem = {
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type,
                data: e.target.result
            };
            try {
                const res = await fetchWithRetry(API_BASE + '/api/media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
                    body: JSON.stringify(mediaItem)
                });
                if (res.status === 401) { logout(); return; }
                if (!res.ok) throw new Error();
                showToast('Fotoğraf yüklendi!', 'success');
            } catch (err) {
                showToast('Sunucuya bağlanılamadı. Fotoğraf yüklenemedi. Lütfen tekrar deneyin.', 'error');
            }
            renderMediaGallery();
        };
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function renderMediaGallery() {
    const grid = document.getElementById('media-grid');
    const emptyState = document.getElementById('media-empty');
    const countEl = document.getElementById('media-count');
    if (!grid) return;
    const mediaItems = await getMediaItems();
    mediaItemsCache = mediaItems;
    if (countEl) countEl.textContent = mediaItems.length;
    if (mediaItems.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = mediaItems.map(item => `
        <div class="media-item" data-id="${item.id}">
            <img src="${item.data}" alt="${item.name}">
            <div class="media-item-overlay">
                <div class="media-item-info">
                    <div class="media-item-name">${item.name}</div>
                    <div class="media-item-size">${item.size}</div>
                </div>
                <div class="media-item-actions">
                    <button onclick="copyMediaUrl('${item.id}')" title="URL Kopyala">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteMedia('${item.id}')" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.copyMediaUrl = function(id) {
    const item = mediaItemsCache.find(m => m.id === id);
    if (item && item.data) {
        navigator.clipboard.writeText(item.data).then(() => showToast('URL kopyalandı!', 'success'));
    }
};

window.deleteMedia = async function(id) {
    if (!confirm('Bu fotoğrafı silmek istediğinizden emin misiniz?')) return;
    try {
        const r = await fetchWithRetry(API_BASE + '/api/media/' + encodeURIComponent(id), {
            method: 'DELETE',
            headers: getAuthHeader()
        });
        if (r.status === 401) { logout(); return; }
        if (!r.ok) throw new Error();
        showToast('Fotoğraf silindi!', 'success');
    } catch (e) {
        showToast('Sunucuya bağlanılamadı. Silme işlemi yapılamadı. Lütfen tekrar deneyin.', 'error');
    }
    renderMediaGallery();
};

// ========================================
// Settings
// ========================================
function initSettings() {
    const credentialsForm = document.getElementById('credentials-form');
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    const clearBtn = document.getElementById('clear-data');
    
    // Giriş bilgileri Render ortam değişkenlerinde yönetiliyor
    if (credentialsForm) {
        credentialsForm.innerHTML = '<p class="text-muted" style="margin-bottom:12px;">Giriş, Vercel ortam değişkenlerinde yönetiliyor. Kullanıcı adı ve şifreyi değiştirmek için Vercel Dashboard → Projeniz → Settings → Environment Variables bölümünde <strong>ADMIN_USERNAME</strong> ve <strong>ADMIN_PASSWORD_HASH</strong> ekleyin. Şifre hash\'i için: <code>node -e "require(\'bcryptjs\').hash(\'YeniSifren\', 10).then(h=>console.log(h))"</code></p>';
    }
    
    // Export data
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const blogs = await getBlogs();
            const data = { blogs, exportDate: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blog-backup-${formatDateInput(new Date())}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Veriler dışa aktarıldı!', 'success');
        });
    }
    
    // Import data
    if (importBtn) {
        importBtn.addEventListener('click', () => importFile.click());
    }
    
    if (importFile) {
        importFile.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        if (data.blogs && Array.isArray(data.blogs)) {
                            for (const blog of data.blogs) {
                                await saveBlog(blog);
                            }
                            initDashboardStats();
                            initRecentPosts();
                            renderBlogsTable();
                            showToast('Veriler içe aktarıldı!', 'success');
                        } else {
                            showToast('Geçersiz dosya formatı!', 'error');
                        }
                    } catch (err) {
                        showToast('Dosya okunamadı!', 'error');
                    }
                };
                reader.readAsText(this.files[0]);
            }
        });
    }
    
    // Clear data
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Tüm blog verilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                localStorage.removeItem(CONFIG.storageKeys.blogs);
                initDashboardStats();
                initRecentPosts();
                renderBlogsTable();
                showToast('Tüm veriler silindi!', 'success');
            }
        });
    }
}

// ========================================
// Dark Mode
// ========================================
function initDarkMode() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('admin_theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('admin_theme', newTheme);
        });
    }
}

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dark mode first
    initDarkMode();
    
    // Detect which page we're on
    if (document.querySelector('.login-page')) {
        initLoginPage();
    } else if (document.querySelector('.dashboard-page')) {
        initDashboardPage();
    }
});

// Export for main page use
window.getPublishedBlogs = function() {
    return getBlogs().filter(blog => blog.status === 'published');
};

