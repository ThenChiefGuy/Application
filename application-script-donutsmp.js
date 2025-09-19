
class DonutSMPApplication {
    constructor() {
        this.currentScreen = 'welcome';
        this.formData = {};
        this.isLoading = false;
        this.loadingProgress = 0;
        this.loadingInterval = null;
        this.animationQueue = [];
        this.isAnimating = false;

        this.init();
    }

    async init() {
        await this.waitForDOM();
        this.setupEventListeners();
        this.setupFormValidation();
        this.showScreen('welcome');
    }

    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        const applicationForm = document.getElementById('applicationForm');

        if (startButton) {
            startButton.addEventListener('click', (e) => this.handleStartClick(e));
        }

        if (applicationForm) {
            applicationForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    async handleStartClick(e) {
        e.preventDefault();
        await this.showScreen('application');
    }

    async showScreen(screenName) {
        if (this.isAnimating) {
            this.animationQueue.push(() => this.showScreen(screenName));
            return;
        }

        this.isAnimating = true;
        const currentScreenEl = document.querySelector('.screen.active');
        const targetScreenEl = document.getElementById(`${screenName}Screen`);

        if (!targetScreenEl) {
            console.error(`Screen ${screenName} not found`);
            this.isAnimating = false;
            return;
        }

        if (currentScreenEl && currentScreenEl !== targetScreenEl) {
            currentScreenEl.classList.remove('active');
        }

        targetScreenEl.classList.add('active');
        this.currentScreen = screenName;
        this.isAnimating = false;
    }

    setupFormValidation() {
        const form = document.getElementById('applicationForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        if (!value) {
            field.style.borderColor = '#f44336';
            return false;
        }
        field.style.borderColor = '';
        return true;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        if (!this.validateForm(form)) {
            alert("Please fill out all required fields.");
            return;
        }
        await this.submitForm(form);
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let valid = true;
        inputs.forEach(input => {
            if (!this.validateField(input)) valid = false;
        });
        return valid;
    }

    async submitForm(form) {
        this.isLoading = true;
        try {
            const formData = new FormData(form);
            const applicationData = {
                discordName: formData.get('discordName') || 'Unknown',
                discordId: formData.get('discordId') || 'Unknown',
                minecraftName: formData.get('minecraftName') || 'Unknown',
                age: formData.get('age') || 'Unknown',
                motivation: formData.get('motivation') || 'Not provided'
            };

            const embed = {
                title: 'New DonutSMP Application',
                color: 0x2563eb,
                fields: [
                    { name: 'Discord Name', value: applicationData.discordName, inline: true },
                    { name: 'Discord ID', value: applicationData.discordId, inline: true },
                    { name: 'Minecraft Username', value: applicationData.minecraftName, inline: true },
                    { name: 'Age', value: applicationData.age.toString(), inline: true },
                    { name: 'Motivation', value: applicationData.motivation, inline: false }
                ],
                timestamp: new Date().toISOString()
            };

            // 🚨 Use a relay/forwarding service instead of exposing webhook here
            const webhookUrl = "https://your-relay-service.com/unique-id";

            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ embeds: [embed] })
            });

            if (!response.ok) throw new Error("Webhook submission failed.");

            alert("✅ Application submitted to DonutSMP!");
        } catch (error) {
            console.error("Submission error:", error);
            alert("❌ Failed to submit application. Please try again later.");
        } finally {
            this.isLoading = false;
        }
    }
}

let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new DonutSMPApplication();
    });
} else {
    app = new DonutSMPApplication();
}
