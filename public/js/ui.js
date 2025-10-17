class UIManager {
    constructor(app) {
        this.app = app;
    }

    showLandingPage() {
        document.getElementById('landingPage').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('userActions').innerHTML = `
            <button class="btn btn-outline" id="loginBtn">Login</button>
            <button class="btn btn-primary" id="registerBtn">Register</button>
        `;
        setTimeout(() => {
            document.getElementById('loginBtn').addEventListener('click', () => this.app.showAuthModal());
            document.getElementById('registerBtn').addEventListener('click', () => this.app.showAuthModal());
        }, 100);
    }

    showDashboard() {
        document.getElementById('landingPage').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('userActions').innerHTML = `
            <span style="color: white; margin-right: 1rem;">Hello, ${this.app.currentUser?.name || 'User'}</span>
            <button class="btn btn-outline" onclick="myReadsApp.authManager.logout()">Logout</button>
        `;
        this.app.updateStats();
        this.app.renderBooks();
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

    renderBooks() {
        const grid = document.getElementById('booksGrid');
        const emptyState = document.getElementById('emptyState');
        
        const filteredBooks = this.app.currentFilter === 'all' 
            ? this.app.books 
            : this.app.books.filter(book => book.status === this.app.currentFilter);

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
                            ${this.app.booksManager.getStatusText(book.status)}
                        </span>
                        ${book.pages ? `<span>${book.pages}p</span>` : ''}
                    </div>
                    <div class="book-actions">
                        <button onclick="myReadsApp.showBookDetails('${book.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="myReadsApp.booksManager.updateStatus('${book.id}', '${this.app.booksManager.getNextStatus(book.status)}')">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="primary" onclick="myReadsApp.booksManager.toggleFavorite('${book.id}')">
                            <i class="fas fa-heart" style="color: ${book.favorite ? '#e74c3c' : 'white'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
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
                            ${this.app.booksManager.getStatusText(book.status)}
                        </span>
                        ${book.pages ? `<span>${book.pages}p</span>` : ''}
                    </div>
                    <div class="book-actions">
                        <button onclick="myReadsApp.showBookDetails('${book.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="myReadsApp.booksManager.updateStatus('${book.id}', '${this.app.booksManager.getNextStatus(book.status)}')">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="primary" onclick="myReadsApp.booksManager.toggleFavorite('${book.id}')">
                            <i class="fas fa-heart" style="color: ${book.favorite ? '#e74c3c' : 'white'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}