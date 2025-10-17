class BooksManager {
    constructor(app) {
        this.app = app;
    }

    loadBooks() {
        this.app.books = StorageManager.getBooks();
        this.app.renderBooks();
        this.app.updateStats();
        this.app.updateCharts();
    }

    saveBooks() {
        StorageManager.saveBooks(this.app.books);
        this.app.renderBooks();
        this.app.updateStats();
        this.app.updateCharts();
    }

    addBookFromSearch(bookData) {
        const book = {
            id: 'book_' + Date.now(),
            ...bookData,
            status: 'want_to_read',
            favorite: false,
            progress: 0,
            notes: [],
            addedDate: new Date().toISOString(),
            readingSessions: []
        };

        this.app.books.unshift(book);
        this.saveBooks();
        this.app.hideModal('addBookModal');
        this.app.showNotification('Book added successfully!', 'success');
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
            addedDate: new Date().toISOString(),
            readingSessions: []
        };

        this.app.books.unshift(book);
        this.saveBooks();
        this.app.hideModal('addBookModal');
        e.target.reset();
        this.app.showNotification('Book added successfully!', 'success');
    }

    updateStatus(bookId, newStatus) {
        const book = this.app.books.find(b => b.id === bookId);
        if (book) {
            book.status = newStatus;
            
            if (newStatus === 'reading' || newStatus === 'read') {
                this.recordReadingSession(bookId);
            }
            
            this.saveBooks();
            this.app.showNotification('Status updated!', 'success');
        }
    }

    toggleFavorite(bookId) {
        const book = this.app.books.find(b => b.id === bookId);
        if (book) {
            book.favorite = !book.favorite;
            if (book.favorite) {
                book.status = 'favorites';
            }
            this.saveBooks();
            this.app.showNotification(book.favorite ? 'Added to favorites!' : 'Removed from favorites!', 'success');
        }
    }

    updateProgress(bookId, progress) {
        const book = this.app.books.find(b => b.id === bookId);
        if (book) {
            book.progress = parseInt(progress) || 0;
            if (book.pages && book.progress >= book.pages) {
                book.status = 'read';
                this.recordReadingSession(bookId, true);
            }
            this.saveBooks();
            this.app.showBookDetails(bookId);
        }
    }

    recordReadingSession(bookId, completed = false) {
        const book = this.app.books.find(b => b.id === bookId);
        if (book) {
            if (!book.readingSessions) {
                book.readingSessions = [];
            }
            
            const session = {
                date: new Date().toISOString(),
                pagesRead: book.progress || 0,
                completed: completed
            };
            
            book.readingSessions.unshift(session);
        }
    }

    addNote(bookId, noteContent, page = 1) {
        const book = this.app.books.find(b => b.id === bookId);
        if (book && noteContent.trim()) {
            const note = {
                id: 'note_' + Date.now(),
                content: noteContent.trim(),
                page: parseInt(page) || 1,
                date: new Date().toISOString()
            };
            
            if (!book.notes) {
                book.notes = [];
            }
            
            book.notes.unshift(note);
            this.saveBooks();
            this.app.showNotification('Note added successfully!', 'success');
            return true;
        }
        return false;
    }

    removeNote(bookId, noteId) {
        const book = this.app.books.find(b => b.id === bookId);
        if (book && book.notes) {
            book.notes = book.notes.filter(note => note.id !== noteId);
            this.saveBooks();
            this.app.showNotification('Note removed!', 'success');
            return true;
        }
        return false;
    }

    getReadingConsistencyData(days = 30) {
        const readingDays = {};
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            readingDays[dateString] = 0;
        }
        
        this.app.books.forEach(book => {
            if (book.readingSessions) {
                book.readingSessions.forEach(session => {
                    const sessionDate = new Date(session.date).toISOString().split('T')[0];
                    if (readingDays.hasOwnProperty(sessionDate)) {
                        readingDays[sessionDate]++;
                    }
                });
            }
        });
        
        return {
            labels: Object.keys(readingDays),
            data: Object.values(readingDays)
        };
    }

    getBooksByStatusData() {
        const statusCount = {
            'want_to_read': 0,
            'reading': 0,
            'read': 0,
            'favorites': 0
        };
        
        this.app.books.forEach(book => {
            if (statusCount.hasOwnProperty(book.status)) {
                statusCount[book.status]++;
            }
        });
        
        return {
            labels: ['Want to Read', 'Reading', 'Read', 'Favorites'],
            data: [
                statusCount.want_to_read,
                statusCount.reading,
                statusCount.read,
                statusCount.favorites
            ],
            colors: ['#FFCE56', '#36A2EB', '#4BC0C0', '#FF6384']
        };
    }

    getReadingInsights() {
        const totalBooks = this.app.books.length;
        const readBooks = this.app.books.filter(b => b.status === 'read').length;
        const readingBooks = this.app.books.filter(b => b.status === 'reading').length;
        const totalPages = this.app.books.reduce((sum, book) => sum + (book.pages || 0), 0);
        const readPages = this.app.books.reduce((sum, book) => {
            return book.status === 'read' ? sum + (book.pages || 0) : sum + (book.progress || 0);
        }, 0);
        
        const consistencyData = this.getReadingConsistencyData(7);
        const activeDays = consistencyData.data.filter(count => count > 0).length;
        const readingStreak = this.calculateReadingStreak();
        
        return [
            {
                icon: 'fas fa-trophy',
                title: 'Completion Rate',
                value: totalBooks > 0 ? `${Math.round((readBooks / totalBooks) * 100)}%` : '0%',
                description: `${readBooks} of ${totalBooks} books completed`
            },
            {
                icon: 'fas fa-fire',
                title: 'Reading Streak',
                value: `${readingStreak} days`,
                description: 'Consecutive days with reading activity'
            },
            {
                icon: 'fas fa-calendar-check',
                title: 'Weekly Activity',
                value: `${activeDays}/7 days`,
                description: 'Active reading days this week'
            },
            {
                icon: 'fas fa-file-alt',
                title: 'Pages Progress',
                value: totalPages > 0 ? `${Math.round((readPages / totalPages) * 100)}%` : '0%',
                description: `${readPages} of ${totalPages} pages read`
            }
        ];
    }

    calculateReadingStreak() {
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        while (true) {
            const dateString = currentDate.toISOString().split('T')[0];
            let hasReading = false;
            
            for (const book of this.app.books) {
                if (book.readingSessions) {
                    for (const session of book.readingSessions) {
                        const sessionDate = new Date(session.date).toISOString().split('T')[0];
                        if (sessionDate === dateString) {
                            hasReading = true;
                            break;
                        }
                    }
                }
                if (hasReading) break;
            }
            
            if (hasReading) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
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
            total: this.app.books.length,
            read: this.app.books.filter(b => b.status === 'read').length,
            reading: this.app.books.filter(b => b.status === 'reading').length,
            want_to_read: this.app.books.filter(b => b.status === 'want_to_read').length
        };

        document.getElementById('totalBooks').textContent = stats.total;
        document.getElementById('readBooks').textContent = stats.read;
        document.getElementById('readingBooks').textContent = stats.reading;
        document.getElementById('wantToReadBooks').textContent = stats.want_to_read;
    }
}