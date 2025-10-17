## Features

- Book Management: Add books manually or search using Google Books API
- Library Organization: Categorize books into "Want to Read", "Reading", "Read", and "Favorites"
- Progress Tracking: Record pages read and monitor reading progress
- Notes & Quotes: Add personal notes and important quotes
- Statistics: View reading statistics and progress charts
- Responsive Design: Works on desktop, tablet, and mobile devices

## Technologies Used

- HTML5, CSS3, JavaScript 
- Google Books API for book search
- Local Storage for data persistence
- Font Awesome for icons
- Google Fonts (Montserrat, Lato)

## Data Storage

All data is stored locally in your browser using Local Storage. Your books and reading progress will persist between sessions.

## Modular Architecture

The application is organized into modular JavaScript files:
- storage.js: Handles all localStorage operations
- auth.js: Manages user authentication and registration
- books.js: Handles book operations and management
- api.js: Manages external API calls
- ui.js: Controls all user interface interactions
- script.js: Main application orchestrator