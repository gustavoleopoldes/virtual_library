class ApiManager {
    constructor(app) {
        this.app = app;
    }

    async searchExternalBooks() {
        const query = document.getElementById('bookSearch').value.trim();
        if (!query) {
            this.app.showNotification('Enter a search term', 'info');
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
            <div class="search-result-item" onclick="myReadsApp.booksManager.addBookFromSearch(${JSON.stringify(book).replace(/"/g, '&quot;')})">
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
}