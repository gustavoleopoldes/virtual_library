class MyReadsApp {
    constructor() {
        this.books = [];
        this.currentFilter = 'all';
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadBooks();
    }

    checkAuth() {
        const user = localStorage.getItem('myreads_user');
        const books = localStorage.getItem('myreads_books');
        
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showDashboard();
        }
        
        if (books) {
            this.books = JSON.parse(books);
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            this.showNotification('Fill in all fields', 'error');
            return;
        }

        this.currentUser = {
            id: Date.now(),
            email: email,
            name: email.split('@')[0]
        };

        localStorage.setItem('myreads_user', JSON.stringify(this.currentUser));
        this.showDashboard();
        this.hideModal('authModal');
        this.showNotification('Login successful!', 'success');
    }

    handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        this.currentUser = {
            id: Date.now(),
            name: name,
            email: email
        };

        localStorage.setItem('myreads_user', JSON.stringify(this.currentUser));
        this.showDashboard();
        this.hideModal('authModal');
        this.showNotification(`Welcome, ${name}!`, 'success');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('myreads_user');
        this.showLandingPage();
        this.showNotification('Logout successful', 'info');
    }

    showAuthModal() {
        this.showModal('authModal');
        this.switchTab('login');
    }

    showLandingPage() {
        document.getElementById('landingPage').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('userActions').innerHTML = `
            <button class="btn btn-outline" id="loginBtn">Login</button>
            <button class="btn btn-primary" id="registerBtn">Register</button>
        `;
        setTimeout(() => {
            document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal());
            document.getElementById('registerBtn').addEventListener('click', () => this.showAuthModal());
        }, 100);
    }

    showDashboard() {
        document.getElementById('landingPage').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('userActions').innerHTML = `
            <span style="color: white; margin-right: 1rem;">Hello, ${this.currentUser?.name || 'User'}</span>
            <button class="btn btn-outline" onclick="myReadsApp.logout()">Logout</button>
        `;
        this.updateStats();
        this.renderBooks();
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        if (modalId === 'addBookModal') {
            document.getElementById('searchResults').innerHTML = '';
            document.getElementById('bookSearch').value = '';
        }
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tab)) {
                btn.classList.add('active');
            }
        });

        document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
        document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
    }

    showAddBookModal() {
        this.showModal('addBookModal');
    }

    loadBooks() {
        const saved = localStorage.getItem('myreads_books');
        this.books = saved ? JSON.parse(saved) : [];
        this.renderBooks();
        this.updateStats();
    }

    saveBooks() {
        localStorage.setItem('myreads_books', JSON.stringify(this.books));
        this.renderBooks();
        this.updateStats();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.renderBooks();
    }

    renderBooks() {
        const grid = document.getElementById('booksGrid');
        const emptyState = document.getElementById('emptyState');
        
        const filteredBooks = this.currentFilter === 'all' 
            ? this.books 
            : this.books.filter(book => book.status === this.currentFilter);

        if (filteredBooks.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        grid.innerHTML = filteredBooks.map(book => `
            <div class="book-card">
                <div class="book-cover">
                    ${book.coverUrl 
                        ? `<img src="${book.coverUrl}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;">`
                        : `<i class="fas fa-book"></i>`
                    }
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.authors?.join(', ') || 'Unknown author'}</p>
                    <div class="book-meta">
                        <span class="book-status status-${book.status}">
                            ${this.getStatusText(book.status)}
                        </span>
                        ${book.pages ? `<span>${book.pages}p</span>` : ''}
                    </div>
                    <div class="book-actions">
                        <button onclick="myReadsApp.showBookDetails('${book.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="myReadsApp.updateStatus('${book.id}', '${this.getNextStatus(book.status)}')">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="primary" onclick="myReadsApp.toggleFavorite('${book.id}')">
                            <i class="fas fa-heart" style="color: ${book.favorite ? '#e74c3c' : 'white'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'want_to_read': 'Want to Read',
            'reading': 'Reading',
            'read': 'Read',
            'favorites': 'Favorite'
        };
        return statusMap[status] || status;
    }

    getNextStatus(currentStatus) {
        const statusFlow = {
            'want_to_read': 'reading',
            'reading': 'read',
            'read': 'want_to_read',
            'favorites': 'want_to_read'
        };
        return statusFlow[currentStatus] || 'want_to_read';
    }

    updateStats() {
        const stats = {
            total: this.books.length,
            read: this.books.filter(b => b.status === 'read').length,
            reading: this.books.filter(b => b.status === 'reading').length,
            want_to_read: this.books.filter(b => b.status === 'want_to_read').length
        };

        document.getElementById('totalBooks').textContent = stats.total;
        document.getElementById('readBooks').textContent = stats.read;
        document.getElementById('readingBooks').textContent = stats.reading;
        document.getElementById('wantToReadBooks').textContent = stats.want_to_read;
    }

    async searchExternalBooks() {
        const query = document.getElementById('bookSearch').value.trim();
        if (!query) {
            this.showNotification('Enter a search term', 'info');
            return;
        }

        const results = document.getElementById('searchResults');
        results.innerHTML = '<p style="padding: 2rem; text-align: center;">Searching books...</p>';

        try {
            const books = await this.searchGoogleBooks(query);
            this.displaySearchResults(books);
        } catch (error) {
            console.error('Search error:', error);
            results.innerHTML = '<p style="padding: 2rem; text-align: center; color: #e74c3c;">Error searching books. Try again.</p>';
        }
    }

    async searchGoogleBooks(query) {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
        const data = await response.json();
        
        if (!data.items) return [];
        
        return data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            return {
                id: item.id,
                title: volumeInfo.title || 'Unknown title',
                authors: volumeInfo.authors || ['Unknown author'],
                description: volumeInfo.description,
                pages: volumeInfo.pageCount,
                publishedDate: volumeInfo.publishedDate,
                coverUrl: volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://'),
                source: 'google'
            };
        });
    }

    displaySearchResults(books) {
        const results = document.getElementById('searchResults');
        
        if (books.length === 0) {
            results.innerHTML = '<p style="padding: 2rem; text-align: center;">No books found. Try other terms.</p>';
            return;
        }

        results.innerHTML = books.map(book => `
            <div class="search-result-item" onclick="myReadsApp.addBookFromSearch(${JSON.stringify(book).replace(/"/g, '&quot;')})">
                <div>
                    ${book.coverUrl 
                        ? `<img src="${book.coverUrl}" alt="${book.title}">`
                        : `<div style="width:60px;height:80px;background:#eee;display:flex;align-items:center;justify-content:center;">
                             <i class="fas fa-book" style="color:#666;"></i>
                           </div>`
                    }
                </div>
                <div style="flex:1;">
                    <h4 style="margin-bottom:0.5rem;color:var(--primary);">${book.title}</h4>
                    <p style="margin-bottom:0.5rem;color:var(--dark-gray);">${book.authors.join(', ')}</p>
                    ${book.publishedDate ? `<small style="color:#666;">Published: ${book.publishedDate}</small>` : ''}
                    ${book.pages ? `<small style="color:#666;margin-left:0.5rem;">• ${book.pages} pages</small>` : ''}
                    ${book.description ? `<p style="margin-top:0.5rem;font-size:0.8rem;color:#666;line-height:1.3;">${book.description.substring(0, 100)}...</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    addBookFromSearch(bookData) {
        const book = {
            id: 'book_' + Date.now(),
            ...bookData,
            status: 'want_to_read',
            favorite: false,
            progress: 0,
            notes: [],
            addedDate: new Date().toISOString()
        };

        this.books.unshift(book);
        this.saveBooks();
        this.hideModal('addBookModal');
        this.showNotification('Book added successfully!', 'success');
    }

    addManualBook(e) {
        e.preventDefault();
        const inputs = e.target.elements;
        
        const book = {
            id: 'book_' + Date.now(),
            title: inputs[0].value,
            authors: [inputs[1].value],
            isbn: inputs[2].value,
            pages: parseInt(inputs[3].value) || null,
            status: inputs[4].value,
            favorite: false,
            progress: 0,
            notes: [],
            addedDate: new Date().toISOString()
        };

        this.books.unshift(book);
        this.saveBooks();
        this.hideModal('addBookModal');
        e.target.reset();
        this.showNotification('Book added successfully!', 'success');
    }

    updateStatus(bookId, newStatus) {
        const book = this.books.find(b => b.id === bookId);
        if (book) {
            book.status = newStatus;
            this.saveBooks();
            this.showNotification('Status updated!', 'success');
        }
    }

    toggleFavorite(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (book) {
            book.favorite = !book.favorite;
            if (book.favorite) {
                book.status = 'favorites';
            }
            this.saveBooks();
            this.showNotification(book.favorite ? 'Added to favorites!' : 'Removed from favorites!', 'success');
        }
    }

    showBookDetails(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;

        const content = document.getElementById('bookDetailsContent');
        content.innerHTML = `
            <div style="display:grid;grid-template-columns:200px 1fr;gap:2rem;">
                <div>
                    ${book.coverUrl 
                        ? `<img src="${book.coverUrl}" alt="${book.title}" style="width:100%;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.1);">`
                        : `<div style="width:100%;height:300px;background:var(--light-gray);display:flex;align-items:center;justify-content:center;border-radius:8px;">
                             <i class="fas fa-book" style="font-size:4rem;color:var(--dark-gray);opacity:0.5;"></i>
                           </div>`
                    }
                </div>
                <div>
                    <h2 style="color:var(--primary);margin-bottom:0.5rem;">${book.title}</h2>
                    <p style="font-size:1.2rem;color:var(--dark-gray);margin-bottom:2rem;">${book.authors.join(', ')}</p>
                    
                    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:1rem;margin-bottom:2rem;">
                        ${book.pages ? `<div style="background:var(--light-gray);padding:1rem;border-radius:8px;text-align:center;">
                            <div style="font-size:0.8rem;color:var(--dark-gray);margin-bottom:0.5rem;">Pages</div>
                            <div style="font-weight:bold;color:var(--primary);font-size:1.2rem;">${book.pages}</div>
                        </div>` : ''}
                        ${book.publishedDate ? `<div style="background:var(--light-gray);padding:1rem;border-radius:8px;text-align:center;">
                            <div style="font-size:0.8rem;color:var(--dark-gray);margin-bottom:0.5rem;">Published</div>
                            <div style="font-weight:bold;color:var(--primary);font-size:1.2rem;">${book.publishedDate}</div>
                        </div>` : ''}
                        <div style="background:var(--light-gray);padding:1rem;border-radius:8px;text-align:center;">
                            <div style="font-size:0.8rem;color:var(--dark-gray);margin-bottom:0.5rem;">Status</div>
                            <div style="font-weight:bold;color:var(--primary);font-size:1.2rem;">${this.getStatusText(book.status)}</div>
                        </div>
                    </div>

                    ${book.description ? `
                        <div style="margin-bottom:2rem;">
                            <h3 style="color:var(--primary);margin-bottom:1rem;">Description</h3>
                            <p style="line-height:1.6;color:var(--dark-gray);">${book.description}</p>
                        </div>
                    ` : ''}

                    <div style="background:var(--white);padding:1.5rem;border-radius:10px;box-shadow:var(--shadow);margin-bottom:2rem;">
                        <h3 style="color:var(--primary);margin-bottom:1.5rem;">Reading Progress</h3>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                            <div>
                                <label style="display:block;margin-bottom:0.5rem;color:var(--dark-gray);font-weight:600;">Pages Read</label>
                                <input type="number" 
                                       value="${book.progress || 0}" 
                                       min="0" 
                                       max="${book.pages || 1000}"
                                       onchange="myReadsApp.updateProgress('${book.id}', this.value)"
                                       style="width:100%;padding:0.75rem;border:1px solid var(--light-gray);border-radius:5px;">
                            </div>
                            <div>
                                <label style="display:block;margin-bottom:0.5rem;color:var(--dark-gray);font-weight:600;">Status</label>
                                <select onchange="myReadsApp.updateStatus('${book.id}', this.value)" style="width:100%;padding:0.75rem;border:1px solid var(--light-gray);border-radius:5px;">
                                    <option value="want_to_read" ${book.status === 'want_to_read' ? 'selected' : ''}>Want to Read</option>
                                    <option value="reading" ${book.status === 'reading' ? 'selected' : ''}>Reading</option>
                                    <option value="read" ${book.status === 'read' ? 'selected' : ''}>Read</option>
                                </select>
                            </div>
                        </div>
                        ${book.pages ? `
                            <div style="background:var(--light-gray);height:8px;border-radius:4px;margin-bottom:0.5rem;overflow:hidden;">
                                <div style="background:var(--secondary);height:100%;border-radius:4px;width:${((book.progress || 0) / book.pages) * 100}%;transition:width 0.3s;"></div>
                            </div>
                            <div style="display:flex;justify-content:space-between;font-size:0.9rem;color:var(--dark-gray);">
                                <span>${book.progress || 0} of ${book.pages} pages</span>
                                <span>${Math.round(((book.progress || 0) / book.pages) * 100)}%</span>
                            </div>
                        ` : ''}
                    </div>

                    <div style="background:var(--white);padding:1.5rem;border-radius:10px;box-shadow:var(--shadow);">
                        <h3 style="color:var(--primary);margin-bottom:1rem;">Notes & Quotes</h3>
                        ${book.notes && book.notes.length > 0 ? 
                            book.notes.map(note => `
                                <div style="background:var(--light-gray);padding:1rem;border-radius:8px;margin-bottom:1rem;border-left:4px solid var(--secondary);">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                                        <span style="font-size:0.8rem;color:var(--dark-gray);background:var(--white);padding:0.25rem 0.5rem;border-radius:10px;">Page ${note.page || 1}</span>
                                    </div>
                                    <p style="line-height:1.5;color:var(--dark-gray);">${note.content}</p>
                                </div>
                            `).join('') 
                            : '<p style="color:var(--dark-gray);text-align:center;padding:2rem;">No notes added yet.</p>'
                        }
                    </div>
                </div>
            </div>
        `;

        this.showModal('bookDetailsModal');
    }

    updateProgress(bookId, progress) {
        const book = this.books.find(b => b.id === bookId);
        if (book) {
            book.progress = parseInt(progress) || 0;
            if (book.pages && book.progress >= book.pages) {
                book.status = 'read';
            }
            this.saveBooks();
            this.showBookDetails(bookId);
        }
    }

    searchBooks() {
        const term = document.getElementById('searchInput').value.toLowerCase();
        if (!term) {
            this.renderBooks();
            return;
        }

        const filtered = this.books.filter(book =>
            book.title.toLowerCase().includes(term) ||
            book.authors.some(author => author.toLowerCase().includes(term))
        );

        this.renderFilteredBooks(filtered);
    }

    renderFilteredBooks(books) {
        const grid = document.getElementById('booksGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (books.length === 0) {
            grid.innerHTML = '';
            emptyState.innerHTML = `
                <i class="fas fa-search" style="font-size:4rem;color:var(--secondary);opacity:0.3;margin-bottom:1rem;"></i>
                <h3 style="color:var(--primary);margin-bottom:1rem;">No books found</h3>
                <p style="color:var(--dark-gray);margin-bottom:2rem;">Try using other search terms</p>
                <button class="btn btn-primary" onclick="myReadsApp.showAddBookModal()">Add Book</button>
            `;
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        grid.innerHTML = books.map(book => `
            <div class="book-card">
                <div class="book-cover">
                    ${book.coverUrl 
                        ? `<img src="${book.coverUrl}" alt="${book.title}" style="width:100%;height:100%;object-fit:cover;">`
                        : `<i class="fas fa-book"></i>`
                    }
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.authors?.join(', ') || 'Unknown author'}</p>
                    <div class="book-meta">
                        <span class="book-status status-${book.status}">
                            ${this.getStatusText(book.status)}
                        </span>
                        ${book.pages ? `<span>${book.pages}p</span>` : ''}
                    </div>
                    <div class="book-actions">
                        <button onclick="myReadsApp.showBookDetails('${book.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="myReadsApp.updateStatus('${book.id}', '${this.getNextStatus(book.status)}')">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="primary" onclick="myReadsApp.toggleFavorite('${book.id}')">
                            <i class="fas fa-heart" style="color: ${book.favorite ? '#e74c3c' : 'white'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 1001;
            background: ${type === 'success' ? '#1ABC9C' : type === 'error' ? '#e74c3c' : '#3498db'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchBooks();
            });
        }

        const bookSearch = document.getElementById('bookSearch');
        if (bookSearch) {
            bookSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchExternalBooks();
            });
        }

        document.getElementById('loginBtn')?.addEventListener('click', () => this.showAuthModal());
        document.getElementById('registerBtn')?.addEventListener('click', () => this.showAuthModal());
        document.getElementById('heroCta')?.addEventListener('click', () => this.showAuthModal());
        document.getElementById('ctaButton')?.addEventListener('click', () => this.showAuthModal());

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase();
                this.switchTab(tab);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    this.hideModal(openModal.id);
                }
            }
        });
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

const myReadsApp = new MyReadsApp();