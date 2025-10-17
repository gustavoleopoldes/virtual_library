class AuthManager {
    constructor(app) {
        this.app = app;
    }

    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            this.app.showNotification('Fill in all fields', 'error');
            return;
        }

        const user = {
            id: Date.now(),
            email: email,
            name: email.split('@')[0]
        };

        StorageManager.saveUser(user);
        this.app.currentUser = user;
        this.app.showDashboard();
        this.app.hideModal('authModal');
        this.app.showNotification('Login successful!', 'success');
    }

    handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (!name || !email || !password || !confirmPassword) {
            this.app.showNotification('Fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.app.showNotification('Passwords do not match', 'error');
            return;
        }

        const user = {
            id: Date.now(),
            name: name,
            email: email
        };

        StorageManager.saveUser(user);
        this.app.currentUser = user;
        this.app.showDashboard();
        this.app.hideModal('authModal');
        this.app.showNotification(`Welcome, ${name}!`, 'success');
    }

    logout() {
        this.app.currentUser = null;
        StorageManager.removeUser();
        this.app.showLandingPage();
        this.app.showNotification('Logout successful', 'info');
    }

    checkAuth() {
        const user = StorageManager.getUser();
        if (user) {
            this.app.currentUser = user;
            this.app.showDashboard();
        }
    }
}