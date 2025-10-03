document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.querySelector("form");
    if (registerForm && window.location.pathname.includes("register.html")) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirm-password").value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            if (!email.includes("@") || !email.includes(".")) {
                alert("Please enter a valid email.");
                return;
            }

            const users = JSON.parse(localStorage.getItem("users")) || [];
            const userExists = users.some(user => user.email === email);

            if (userExists) {
                alert("This email is already registered.");
                return;
            }

            users.push({ username, email, password });
            localStorage.setItem("users", JSON.stringify(users));

            alert("Registration successful!");
            window.location.href = "login.html";
        });
    }

    const loginForm = document.querySelector("form");
    if (loginForm && window.location.pathname.includes("login.html")) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const users = JSON.parse(localStorage.getItem("users")) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                alert("Login successful!");
                localStorage.setItem("currentUser", JSON.stringify(user));
                window.location.href = "index.html";
            } else {
                alert("Incorrect email or password.");
            }
        });
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
        const nav = document.querySelector("header nav ul");
        if (nav) {
            const loginLink = nav.querySelector("a[href=\'login.html\"]");
            const registerLink = nav.querySelector("a[href=\'register.html\"]");
            if (loginLink) loginLink.parentElement.remove();
            if (registerLink) registerLink.parentElement.remove();

            const userLi = document.createElement("li");
            userLi.innerHTML = `<a href="#">Hello, ${currentUser.username}</a>`;
            nav.appendChild(userLi);

            const logoutLi = document.createElement("li");
            logoutLi.innerHTML = `<a href="#" id="logout-btn">Logout</a>`;
            nav.appendChild(logoutLi);

            document.getElementById("logout-btn").addEventListener("click", () => {
                localStorage.removeItem("currentUser");
                window.location.href = "index.html";
            });
        }
    }

    const searchButton = document.getElementById("search-button");
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");

    if (searchButton) {
        searchButton.addEventListener("click", async () => {
            const query = searchInput.value;
            if (!query) {
                alert("Please enter a search term.");
                return;
            }

            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`);
            const data = await response.json();

            if (data.items) {
                searchResults.innerHTML = "";
                data.items.forEach(item => {
                    const book = item.volumeInfo;
                    const bookCard = document.createElement("div");
                    bookCard.classList.add("book-card");
                    bookCard.innerHTML = `
                        <img src="${book.imageLinks?.thumbnail || ''}" alt="Book cover of ${book.title}">
                        <h3>${book.title}</h3>
                        <p>${book.authors?.join(", ") || "Unknown author"}</p>
                        <button class="add-to-library-btn" data-book-id="${item.id}">Add to Library</button>
                    `;
                    searchResults.appendChild(bookCard);
                });
            } else {
                searchResults.innerHTML = "<p>No books found.</p>";
            }
        });
    }

    searchResults.addEventListener("click", (event) => {
        if (event.target.classList.contains("add-to-library-btn")) {
            const bookId = event.target.dataset.bookId;
            const currentUser = JSON.parse(localStorage.getItem("currentUser"));

            if (!currentUser) {
                alert("You need to be logged in to add books to your library.");
                window.location.href = "login.html";
                return;
            }

            fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
                .then(response => response.json())
                .then(data => {
                    const bookInfo = data.volumeInfo;
                    const userBooks = JSON.parse(localStorage.getItem(`userBooks_${currentUser.email}`)) || [];

                    if (userBooks.some(b => b.id === bookId)) {
                        alert("This book is already in your library!");
                        return;
                    }

                    const newBook = {
                        id: bookId,
                        title: bookInfo.title,
                        authors: bookInfo.authors || [],
                        thumbnail: bookInfo.imageLinks?.thumbnail || 
                                   bookInfo.imageLinks?.smallThumbnail || 
                                   'https://via.placeholder.com/128x192?text=No+Cover',
                        status: "want-to-read",
                        currentPage: 0,
                        totalPages: bookInfo.pageCount || 0,
                        startDate: null,
                        endDate: null
                    };
                    userBooks.push(newBook);
                    localStorage.setItem(`userBooks_${currentUser.email}`, JSON.stringify(userBooks));
                    alert(`"${bookInfo.title}" added to your library!`);
                    displayUserBooks();
                })
                .catch(error => console.error("Error adding book:", error));
        }
    });

    function displayUserBooks() {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const myLibrarySection = document.getElementById("my-library-books");
        if (!myLibrarySection) return;

        if (!currentUser) {
            myLibrarySection.innerHTML = "<p>Log in to see your library.</p>";
            return;
        }

        const userBooks = JSON.parse(localStorage.getItem(`userBooks_${currentUser.email}`)) || [];

        if (userBooks.length === 0) {
            myLibrarySection.innerHTML = "<p>Your library is empty. Start adding books!</p>";
            return;
        }

        myLibrarySection.innerHTML = "";
        userBooks.forEach(book => {
            const bookCard = document.createElement("div");
            bookCard.classList.add("book-card");
            bookCard.innerHTML = `
                <img src="${book.thumbnail}" alt="Book cover of ${book.title}">
                <h3>${book.title}</h3>
                <p>${book.authors.join(", ")}</p>
                <p>Status: ${book.status}</p>
                ${book.status === 'reading' && book.totalPages > 0 ? 
                    `<p>Progress: ${((book.currentPage / book.totalPages) * 100).toFixed(0)}%</p>` : ''}
                <button class="view-book-details-btn" data-book-id="${book.id}">View Details</button>
            `;
            myLibrarySection.appendChild(bookCard);
        });
    }

    displayUserBooks();

    const bookDetailSection = document.getElementById("book-detail-section");
    if (bookDetailSection && window.location.pathname.includes("book_details.html")) {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get("id");

        if (bookId) {
            fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`)
                .then(response => response.json())
                .then(data => {
                    const book = data.volumeInfo;
                    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
                    const userBooks = JSON.parse(localStorage.getItem(`userBooks_${currentUser.email}`)) || [];
                    const userBook = userBooks.find(b => b.id === bookId);

                    bookDetailSection.innerHTML = `
                        <div class="book-detail-content">
                            <img src="${book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || 'https://via.placeholder.com/128x192?text=No+Cover'}" alt="Book cover of ${book.title}">
                            <div>
                                <h2>${book.title}</h2>
                                <h3>${book.authors?.join(', ') || 'Unknown author'}</h3>
                                <p><strong>Publisher:</strong> ${book.publisher || 'N/A'}</p>
                                <p><strong>Published Date:</strong> ${book.publishedDate || 'N/A'}</p>
                                <p><strong>Pages:</strong> ${book.pageCount || 'N/A'}</p>
                                <p><strong>ISBN:</strong> ${book.industryIdentifiers?.[0]?.identifier || 'N/A'}</p>
                                <p><strong>Description:</strong> ${book.description || 'N/A'}</p>
                                <p><strong>Status:</strong> ${userBook?.status || 'Not in library'}</p>
                                ${userBook && userBook.totalPages > 0 ? 
                                    `<p><strong>Progress:</strong> ${userBook.currentPage} / ${userBook.totalPages} pages (${((userBook.currentPage / userBook.totalPages) * 100).toFixed(0)}%)</p>` : ''}
                                
                                ${userBook ? `
                                    <div class="progress-controls">
                                        <label for="current-page">Current Page:</label>
                                        <input type="number" id="current-page" value="${userBook.currentPage}" min="0" max="${userBook.totalPages}">
                                        <button id="update-progress-btn" data-book-id="${bookId}">Update Progress</button>
                                        <select id="book-status-select" data-book-id="${bookId}">
                                            <option value="want-to-read" ${userBook.status === 'want-to-read' ? 'selected' : ''}>Want to Read</option>
                                            <option value="reading" ${userBook.status === 'reading' ? 'selected' : ''}>Reading</option>
                                            <option value="read" ${userBook.status === 'read' ? 'selected' : ''}>Read</option>
                                        </select>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;

                    const updateProgressBtn = document.getElementById("update-progress-btn");
                    if (updateProgressBtn) {
                        updateProgressBtn.addEventListener("click", () => {
                            const newPage = parseInt(document.getElementById("current-page").value);
                            updateReadingProgress(bookId, newPage);
                        });
                    }

                    const bookStatusSelect = document.getElementById("book-status-select");
                    if (bookStatusSelect) {
                        bookStatusSelect.addEventListener("change", (event) => {
                            updateBookStatus(bookId, event.target.value);
                        });
                    }

                })
                .catch(error => {
                    bookDetailSection.innerHTML = "<p>Error loading book details.</p>";
                    console.error("Error loading book details:", error);
                });
        } else {
            bookDetailSection.innerHTML = "<p>Book not specified.</p>";
        }
    }

    function updateReadingProgress(bookId, newPage) {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) return;

        let userBooks = JSON.parse(localStorage.getItem(`userBooks_${currentUser.email}`)) || [];
        const bookIndex = userBooks.findIndex(b => b.id === bookId);

        if (bookIndex !== -1) {
            userBooks[bookIndex].currentPage = newPage;
            if (newPage >= userBooks[bookIndex].totalPages && userBooks[bookIndex].totalPages > 0) {
                userBooks[bookIndex].status = "read";
                userBooks[bookIndex].endDate = new Date().toISOString().slice(0, 10);
            } else if (newPage > 0 && userBooks[bookIndex].status !== "read") {
                userBooks[bookIndex].status = "reading";
                if (!userBooks[bookIndex].startDate) {
                    userBooks[bookIndex].startDate = new Date().toISOString().slice(0, 10);
                }
            }
            localStorage.setItem(`userBooks_${currentUser.email}`, JSON.stringify(userBooks));
            alert("Progress updated successfully!");
            window.location.reload(); 
        }
    }

    function updateBookStatus(bookId, newStatus) {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) return;

        let userBooks = JSON.parse(localStorage.getItem(`userBooks_${currentUser.email}`)) || [];
        const bookIndex = userBooks.findIndex(b => b.id === bookId);

        if (bookIndex !== -1) {
            userBooks[bookIndex].status = newStatus;
            if (newStatus === "read" && !userBooks[bookIndex].endDate) {
                userBooks[bookIndex].endDate = new Date().toISOString().slice(0, 10);
            } else if (newStatus === "reading" && !userBooks[bookIndex].startDate) {
                userBooks[bookIndex].startDate = new Date().toISOString().slice(0, 10);
            }
            localStorage.setItem(`userBooks_${currentUser.email}`, JSON.stringify(userBooks));
            alert("Book status updated!");
            window.location.reload();
        }
    }

    document.addEventListener("click", (event) => {
        if (event.target.classList.contains("view-book-details-btn")) {
            const bookId = event.target.dataset.bookId;
            window.location.href = `book_details.html?id=${bookId}`;
        }
    });

    displayUserBooks();

    const statsSection = document.getElementById("stats-section");
    if (statsSection && window.location.pathname.includes("stats.html")) {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) {
            statsSection.innerHTML = "<p>Log in to see your statistics.</p>";
            return;
        }

        const userBooks = JSON.parse(localStorage.getItem(`userBooks_${currentUser.email}`)) || [];

        if (userBooks.length === 0) {
            statsSection.innerHTML = "<p>Your library is empty. Add books to see statistics.</p>";
            return;
        }

        let totalBooksRead = 0;
        let totalPagesRead = 0;
        const booksReadByMonth = {};
        const genresCount = {};

        userBooks.forEach(book => {
            if (book.status === "read") {
                totalBooksRead++;
                totalPagesRead += book.totalPages;

                if (book.endDate) {
                    const monthYear = book.endDate.substring(0, 7);
                    booksReadByMonth[monthYear] = (booksReadByMonth[monthYear] || 0) + 1;
                }

                if (book.genres && Array.isArray(book.genres)) {
                    book.genres.forEach(genre => {
                        genresCount[genre] = (genresCount[genre] || 0) + 1;
                    });
                }
            }
        });

        const avgPagesPerBook = totalBooksRead > 0 ? (totalPagesRead / totalBooksRead).toFixed(0) : 0;

        document.getElementById("total-books-read").textContent = totalBooksRead;
        document.getElementById("total-pages-read").textContent = totalPagesRead;
        document.getElementById("avg-pages-per-book").textContent = avgPagesPerBook;

        const sortedMonths = Object.keys(booksReadByMonth).sort();
        const booksData = sortedMonths.map(month => booksReadByMonth[month]);
        const booksReadCtx = document.getElementById("booksReadChart").getContext("2d");
        new Chart(booksReadCtx, {
            type: "bar",
            data: {
                labels: sortedMonths,
                datasets: [{
                    label: "Books Read",
                    data: booksData,
                    backgroundColor: "#1ABC9C",
                }],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: "Number of Books" }
                    },
                    x: {
                        title: { display: true, text: "Month" }
                    }
                }
            },
        });

        const sortedGenres = Object.keys(genresCount).sort((a, b) => genresCount[b] - genresCount[a]);
        const genresData = sortedGenres.map(genre => genresCount[genre]);
        const genresCtx = document.getElementById("genresChart").getContext("2d");
        new Chart(genresCtx, {
            type: "pie",
            data: {
                labels: sortedGenres,
                datasets: [{
                    data: genresData,
                    backgroundColor: [
                        "#1ABC9C", "#2C3E50", "#34495E", "#95A5A6", "#BDC3C7",
                        "#F1C40F", "#E67E22", "#E74C3C", "#9B59B6", "#3498DB"
                    ],
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                    title: {
                        display: true,
                        text: "Most Read Genres"
                    }
                }
            },
        });
    }
});

