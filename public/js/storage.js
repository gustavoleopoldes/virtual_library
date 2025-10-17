class StorageManager {
    static get(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    static set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static getBooks() {
        return this.get('myreads_books') || [];
    }

    static saveBooks(books) {
        this.set('myreads_books', books);
    }

    static getUser() {
        return this.get('myreads_user');
    }

    static saveUser(user) {
        this.set('myreads_user', user);
    }

    static removeUser() {
        this.remove('myreads_user');
    }
}