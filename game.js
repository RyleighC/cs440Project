class ApiService {
    static async post(url, data) {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        return response.json();
    }
}

class Game {
    constructor(userData) {
        this.user = userData;
        this.updateUI();
        this.startSyncLoop();
    }
    startSyncLoop() {
    setInterval(async () => {
        this.user = await ApiService.post("/sync", {
        id: this.user.id
        });

        this.updateUI();
    }, 1000);
}
    async click() {
        this.user = await ApiService.post("/click", {
            id: this.user.id
        });
        this.updateUI();
    }
    

    async buyUpgrade(type) {
        const result = await ApiService.post("/upgrade", {
            id: this.user.id,
            type
        });

        if (result.error) {
            alert(result.error);
            return;
        }

        this.user = result;
        this.updateUI();
    }

    updateUI() {
        document.getElementById("score").innerText = this.user.score;

    }
    
}

class App {
    constructor() {
        this.user = null;
        this.game = null;
    }

    async register() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const result = await ApiService.post("/register", { username, password });
        alert(result.message || result.error);
    }

    async login() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const data = await ApiService.post("/login", { username, password });

        if (data.error) {
            alert(data.error);
            return;
        }

        this.user = data;
        this.game = new Game(data);

        document.getElementById("auth").style.display = "none";
        document.getElementById("game").style.display = "block";
    }

    logout() {
        location.reload();
    }
}

window.app = new App();