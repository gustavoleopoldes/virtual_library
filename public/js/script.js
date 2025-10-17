class MyReadsApp {
    constructor() {
        this.books = [];
        this.currentFilter = 'all';
        this.currentUser = null;
        this.charts = {};
        
        this.storageManager = StorageManager;
        this.authManager = new AuthManager(this);
        this.booksManager = new BooksManager(this);
        this.apiManager = new ApiManager(this);
        this.uiManager = new UIManager(this);
        
        this.init();
    }

    init() {
        this.authManager.checkAuth();
        this.setupEventListeners();
        this.booksManager.loadBooks();
        this.addNotificationStyles();
    }

    showAuthModal() {
        this.uiManager.showModal('authModal');
        this.uiManager.switchTab('login');
    }

    showAddBookModal() {
        this.uiManager.showModal('addBookModal');
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        this.uiManager.renderBooks();
    }

    searchBooks() {
        const term = document.getElementById('searchInput').value.toLowerCase();
        if (!term) {
            this.uiManager.renderBooks();
            return;
        }

        const filtered = this.books.filter(book =>
            book.title.toLowerCase().includes(term) ||
            book.authors.some(author => author.toLowerCase().includes(term))
        );

        this.uiManager.renderFilteredBooks(filtered);
    }

    updateCharts() {
        this.updateReadingConsistencyChart();
        this.updateBooksByStatusChart();
        this.updateReadingInsights();
    }

    updateReadingConsistencyChart() {
        const ctx = document.getElementById('readingConsistencyChart');
        if (!ctx) return;

        const consistencyData = this.booksManager.getReadingConsistencyData(30);
        
        if (this.charts.readingConsistency) {
            this.charts.readingConsistency.destroy();
        }

        this.charts.readingConsistency = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: consistencyData.labels.map(date => {
                    const d = new Date(date);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                }),
                datasets: [{
                    label: 'Reading Sessions',
                    data: consistencyData.data,
                    backgroundColor: '#1ABC9C',
                    borderColor: '#16a085',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Sessions per Day'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                const date = consistencyData.labels[context[0].dataIndex];
                                return new Date(date).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                            }
                        }
                    }
                }
            }
        });
    }

    updateBooksByStatusChart() {
        const ctx = document.getElementById('booksByStatusChart');
        if (!ctx) return;

        const statusData = this.booksManager.getBooksByStatusData();
        
        if (this.charts.booksByStatus) {
            this.charts.booksByStatus.destroy();
        }

        this.charts.booksByStatus = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: statusData.labels,
                datasets: [{
                    data: statusData.data,
                    backgroundColor: statusData.colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    updateReadingInsights() {
        const insightsContainer = document.getElementById('readingInsights');
        if (!insightsContainer) return;

        const insights = this.booksManager.getReadingInsights();
        
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <i class="${insight.icon}"></i>
                <h4>${insight.value}</h4>
                <p>${insight.title}</p>
                <small>${insight.description}</small>
            </div>
        `).join('');
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
                            <div style="font-weight:bold;color:var(--primary);font-size:1.2rem;">${this.booksManager.getStatusText(book.status)}</div>
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
                                       onchange="myReadsApp.booksManager.updateProgress('${book.id}', this.value)"
                                       style="width:100%;padding:0.75rem;border:1px solid var(--light-gray);border-radius:5px;">
                            </div>
                            <div>
                                <label style="display:block;margin-bottom:0.5rem;color:var(--dark-gray);font-weight:600;">Status</label>
                                <select onchange="myReadsApp.booksManager.updateStatus('${book.id}', this.value)" style="width:100%;padding:0.75rem;border:1px solid var(--light-gray);border-radius:5px;">
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
                        
                        <div style="background:var(--light-gray);padding:1.5rem;border-radius:8px;margin-bottom:2rem;">
                            <h4 style="color:var(--primary);margin-bottom:1rem;">Add New Note</h4>
                            <div style="display:grid;grid-template-columns:1fr 2fr auto;gap:1rem;align-items:end;">
                                <div>
                                    <label style="display:block;margin-bottom:0.5rem;color:var(--dark-gray);font-weight:600;">Page</label>
                                    <input type="number" 
                                           id="notePage-${book.id}" 
                                           value="1" 
                                           min="1" 
                                           max="${book.pages || 1000}"
                                           style="width:100%;padding:0.5rem;border:1px solid var(--light-gray);border-radius:5px;">
                                </div>
                                <div>
                                    <label style="display:block;margin-bottom:0.5rem;color:var(--dark-gray);font-weight:600;">Note</label>
                                    <textarea 
                                        id="noteContent-${book.id}"
                                        placeholder="Write your note or quote here..."
                                        style="width:100%;padding:0.5rem;border:1px solid var(--light-gray);border-radius:5px;min-height:60px;resize:vertical;"
                                    ></textarea>
                                </div>
                                <div>
                                    <button type="button" 
                                            onclick="myReadsApp.addNoteToBook('${book.id}')"
                                            style="background:var(--secondary);color:white;border:none;padding:0.5rem 1rem;border-radius:5px;cursor:pointer;white-space:nowrap;">
                                        <i class="fas fa-plus"></i> Add Note
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div id="notes-container-${book.id}">
                            ${book.notes && book.notes.length > 0 ? 
                                book.notes.map(note => `
                                    <div class="note-item" style="background:var(--light-gray);padding:1rem;border-radius:8px;margin-bottom:1rem;border-left:4px solid var(--secondary);position:relative;">
                                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                                            <span style="font-size:0.8rem;color:var(--dark-gray);background:var(--white);padding:0.25rem 0.5rem;border-radius:10px;">
                                                Page ${note.page || 1}
                                            </span>
                                            <small style="color:var(--dark-gray);">
                                                ${new Date(note.date).toLocaleDateString()}
                                            </small>
                                        </div>
                                        <p style="line-height:1.5;color:var(--dark-gray);margin:0;">${note.content}</p>
                                        <button onclick="myReadsApp.booksManager.removeNote('${book.id}', '${note.id}')" 
                                                style="position:absolute;top:0.5rem;right:0.5rem;background:none;border:none;color:#e74c3c;cursor:pointer;padding:0.25rem;">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                `).join('') 
                                : '<p style="color:var(--dark-gray);text-align:center;padding:2rem;">No notes added yet. Add your first note above!</p>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.uiManager.showModal('bookDetailsModal');
    }

    addNoteToBook(bookId) {
        const pageInput = document.getElementById(`notePage-${bookId}`);
        const contentInput = document.getElementById(`noteContent-${bookId}`);
        
        const page = pageInput ? parseInt(pageInput.value) || 1 : 1;
        const content = contentInput ? contentInput.value.trim() : '';
        
        if (!content) {
            this.showNotification('Please enter note content', 'error');
            return;
        }
        
        const success = this.booksManager.addNote(bookId, content, page);
        if (success) {
            if (contentInput) contentInput.value = '';
            if (pageInput) pageInput.value = '1';
            
            this.showBookDetails(bookId);
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.uiManager.hideModal(e.target.id);
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
                if (e.key === 'Enter') this.apiManager.searchExternalBooks();
            });
        }

        document.getElementById('loginBtn')?.addEventListener('click', () => this.showAuthModal());
        document.getElementById('registerBtn')?.addEventListener('click', () => this.showAuthModal());
        document.getElementById('heroCta')?.addEventListener('click', () => this.showAuthModal());
        document.getElementById('ctaButton')?.addEventListener('click', () => this.showAuthModal());

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase();
                this.uiManager.switchTab(tab);
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    this.uiManager.hideModal(openModal.id);
                }
            }
        });
    }

    addNotificationStyles() {
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
    }

    showLandingPage() { this.uiManager.showLandingPage(); }
    showDashboard() { 
        this.uiManager.showDashboard();
        this.updateCharts();
    }
    showModal(modalId) { this.uiManager.showModal(modalId); }
    hideModal(modalId) { this.uiManager.hideModal(modalId); }
    switchTab(tab) { this.uiManager.switchTab(tab); }
    showNotification(message, type) { this.uiManager.showNotification(message, type); }
    renderBooks() { this.uiManager.renderBooks(); }
    updateStats() { this.booksManager.updateStats(); }
    searchExternalBooks() { this.apiManager.searchExternalBooks(); }
}

const myReadsApp = new MyReadsApp();