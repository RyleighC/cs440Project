class ApiService {
    static async post(url, data) {
        const token = localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: "POST",
            headers,
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
        this.user = await ApiService.post("/api/player/sync", {});

        this.updateUI();
    }, 1000);
}
    async click() {
        this.user = await ApiService.post("/api/player/click", {});
        this.updateUI();
    }


    async buyUpgrade(type) {
        const result = await ApiService.post("/api/upgrade/buy", {
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

        const result = await ApiService.post("/api/auth/register", { username, password });
        alert(result.message || result.error);
    }

    async login() {
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const data = await ApiService.post("/api/auth/login", { username, password });

        if (data.error) {
            alert(data.error);
            return;
        }

        localStorage.setItem("token", data.token);

        const player = await ApiService.post("/api/player/bootstrap", {});
        if (player.error) {
            alert(player.error);
            return;
        }

        this.user = player;
        this.game = new Game(player);

        document.getElementById("auth").style.display = "none";
        document.getElementById("game").style.display = "block";
    }

    logout() {
        localStorage.removeItem("token");
        location.reload();
    }
}

window.app = new App();
