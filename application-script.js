class ModernApplication {
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
        this.preloadAssets();
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

    async preloadAssets() {
        const assets = [
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
        ];
        
        try {
            await Promise.all(assets.map(asset => this.loadAsset(asset)));
        } catch (error) {
            console.warn('Some assets failed to load:', error);
        }
    }

    loadAsset(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    setupEventListeners() {
        const startButton = document.getElementById('startButton');
        const applicationForm = document.getElementById('applicationForm');
        const ageInput = document.getElementById('age');
        const termsCheckbox = document.getElementById('terms');
        const minecraftNameInput = document.getElementById('minecraftName');
        
        if (startButton) {
            startButton.addEventListener('click', (e) => this.handleStartClick(e));
        }
        
        if (applicationForm) {
            applicationForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        
        if (ageInput) {
            ageInput.addEventListener('input', (e) => this.handleAgeInput(e));
            ageInput.addEventListener('blur', (e) => this.validateAge(e.target));
        }
        
        if (termsCheckbox) {
            termsCheckbox.addEventListener('change', () => this.updateStartButton());
        }
        
        if (minecraftNameInput) {
            minecraftNameInput.addEventListener('input', (e) => {
                this.handleMinecraftNameInput(e);
                this.updateStartButton();
            });

        }
        
        const discordNameInput = document.getElementById('discordName');
        if (discordNameInput) {
            discordNameInput.addEventListener('input', () => this.updateStartButton());
        }
        
        const discordIdInput = document.getElementById('discordId');
        if (discordIdInput) {
            discordIdInput.addEventListener('input', (e) => {
                this.handleDiscordIdInput(e);
                this.updateStartButton();
            });

        }
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.setupInputAnimations();
        this.setupPopupListeners();
    }

    setupInputAnimations() {
        const inputs = document.querySelectorAll('.input-field input');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => this.animateInputFocus(e.target));
            input.addEventListener('blur', (e) => this.animateInputBlur(e.target));
            input.addEventListener('input', (e) => this.handleInputChange(e.target));
        });
    }

    setupPopupListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('popup-backdrop')) {
                this.closePopup();
            }
        });
        
        const popupButtons = document.querySelectorAll('.popup-button');
        popupButtons.forEach(button => {
            button.addEventListener('click', () => this.closePopup());
        });
    }

    async handleStartClick(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const button = e.target;
        const termsCheckbox = document.getElementById('terms');
        
        if (!termsCheckbox?.checked) {
            await this.showErrorPopup(
                'Terms Required',
                'Please accept the terms and conditions to continue.'
            );
            return;
        }
        
        await this.animateButtonClick(button);
        await this.startApplication();
    }

    async animateButtonClick(button) {
        return new Promise(resolve => {
            const ripple = button.querySelector('.button-ripple');
            if (ripple) {
                ripple.style.animation = 'none';
                setTimeout(() => {
                    ripple.style.animation = '';
                    resolve();
                }, 100);
            } else {
                resolve();
            }
        });
    }

    async startApplication() {
        const discordName = document.getElementById('discordName')?.value.trim();
        const discordId = document.getElementById('discordId')?.value.trim();
        const minecraftName = document.getElementById('minecraftName')?.value.trim();
        this.formData.discordName = discordName;
        this.formData.discordId = discordId;
        this.formData.minecraftName = minecraftName;
        
        this.isLoading = true;
        await this.showScreen('loading');
        
        this.loadDiscordProfileImageLoading(discordId);
        
        await this.simulateLoading();
        await this.showScreen('application');
        this.isLoading = false;
        
        this.loadDiscordProfileImageForm(discordId);
    }

    async simulateLoading() {
        return new Promise(resolve => {
            this.loadingProgress = 0;
            const progressBar = document.querySelector('.progress-fill');
            const progressText = document.querySelector('.progress-text');
            const totalDuration = 7000;
            const updateInterval = 50;
            const totalSteps = totalDuration / updateInterval;
            const progressStep = 100 / totalSteps;
            
            this.loadingInterval = setInterval(() => {
                this.loadingProgress += progressStep;
                
                if (this.loadingProgress >= 100) {
                    this.loadingProgress = 100;
                    clearInterval(this.loadingInterval);
                    
                    if (progressBar) progressBar.style.width = '100%';
                    if (progressText) progressText.textContent = '100%';
                    
                    setTimeout(resolve, 500);
                } else {
                    if (progressBar) {
                        progressBar.style.width = `${this.loadingProgress}%`;
                    }
                    if (progressText) {
                        progressText.textContent = `${Math.round(this.loadingProgress)}%`;
                    }
                }
            }, updateInterval);
        });
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
            await this.animateScreenOut(currentScreenEl);
        }
        
        await this.animateScreenIn(targetScreenEl);
        
        this.currentScreen = screenName;
        this.isAnimating = false;
        
        if (this.animationQueue.length > 0) {
            const nextAnimation = this.animationQueue.shift();
            setTimeout(nextAnimation, 100);
        }
    }

    animateScreenOut(screen) {
        return new Promise(resolve => {
            screen.style.transform = 'translateY(-50px)';
            screen.style.opacity = '0';
            
            setTimeout(() => {
                screen.classList.remove('active');
                resolve();
            }, 400);
        });
    }

    animateScreenIn(screen) {
        return new Promise(resolve => {
            screen.classList.add('active');
            screen.style.transform = 'translateY(50px)';
            screen.style.opacity = '0';
            
            setTimeout(() => {
                screen.style.transform = 'translateY(0)';
                screen.style.opacity = '1';
                resolve();
            }, 50);
        });
    }

    setupFormValidation() {
        const form = document.getElementById('applicationForm');
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        
        if (field.id === 'age' && value) {
            const age = parseInt(value);
            if (age < 16) {
                isValid = false;
                errorMessage = 'You must be at least 16 years old';
            }
        }
        
        this.updateFieldValidation(field, isValid, errorMessage);
        return isValid;
    }

    updateFieldValidation(field, isValid, errorMessage) {
        const wrapper = field.closest('.form-group') || field.closest('.input-field');
        if (!wrapper) return;
        
        let errorEl = wrapper.querySelector('.field-error');
        
        if (!isValid) {
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'field-error';
                errorEl.style.cssText = `
                    color: #f44336;
                    font-size: 0.8rem;
                    margin-top: 0.5rem;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                `;
                wrapper.appendChild(errorEl);
            }
            
            errorEl.textContent = errorMessage;
            setTimeout(() => {
                errorEl.style.opacity = '1';
                errorEl.style.transform = 'translateY(0)';
            }, 10);
            
            field.style.borderColor = '#f44336';
        } else {
            if (errorEl) {
                errorEl.style.opacity = '0';
                errorEl.style.transform = 'translateY(-10px)';
                setTimeout(() => errorEl.remove(), 300);
            }
            field.style.borderColor = '';
        }
    }

    clearFieldError(field) {
        const wrapper = field.closest('.form-group') || field.closest('.input-field');
        if (!wrapper) return;
        
        const errorEl = wrapper.querySelector('.field-error');
        if (errorEl) {
            errorEl.style.opacity = '0';
            setTimeout(() => errorEl.remove(), 300);
        }
        field.style.borderColor = '';
    }

    handleAgeInput(e) {
        const value = e.target.value;
        if (value && (isNaN(value) || parseInt(value) < 0)) {
            e.target.value = value.replace(/[^0-9]/g, '');
        }
    }

    handleMinecraftNameInput(e) {
        const discordIdInput = document.getElementById('discordId');
        const discordId = discordIdInput?.value.trim();
        
        if (discordId && this.validateDiscordId(discordId)) {
            this.loadDiscordProfileImage(discordId);
        } else {
            this.resetPlayerHead();
        }
    }



    getBadgeMap() {
        return {
            'STAFF': { icon: 'fas fa-shield-alt', name: 'Staff', class: 'badge-staff' },
            'PARTNER': { icon: 'fas fa-handshake', name: 'Partner', class: 'badge-partner' },
            'HYPESQUAD': { icon: 'fas fa-bolt', name: 'HypeSquad', class: 'badge-hypesquad' },
            'BUG_HUNTER_LEVEL_1': { icon: 'fas fa-bug', name: 'Bug Hunter', class: 'badge-bughunter' },
            'BUG_HUNTER_LEVEL_2': { icon: 'fas fa-bug', name: 'Bug Hunter Gold', class: 'badge-bughunter' },
            'VERIFIED_BOT': { icon: 'fas fa-robot', name: 'Verified Bot', class: 'badge-verified-bot' },
            'EARLY_SUPPORTER': { icon: 'fas fa-heart', name: 'Early Supporter', class: 'badge-early-supporter' },
            'NITRO': { icon: 'fas fa-gem', name: 'Nitro', class: 'badge-nitro' }
        };
    }
    
    renderBadges(badgesContainer, userData) {
        if (!badgesContainer || !userData.badges) return;
        
        badgesContainer.innerHTML = '';
        const badgeMap = this.getBadgeMap();
        let hasVisibleBadges = false;
        
        userData.badges.forEach(badge => {
            const badgeInfo = badgeMap[badge];
            if (badgeInfo) {
                const badgeElement = document.createElement('div');
                badgeElement.className = `user-badge ${badgeInfo.class}`;
                badgeElement.innerHTML = `<i class="${badgeInfo.icon}"></i><span>${badgeInfo.name}</span>`;
                badgesContainer.appendChild(badgeElement);
                hasVisibleBadges = true;
            }
        });
        
        badgesContainer.style.display = hasVisibleBadges ? 'flex' : 'none';
    }
    
    displayUserBadges(userData) {
        const badgesContainer = document.getElementById('userBadges');
        this.renderBadges(badgesContainer, userData);
    }
    
    displayUserBadgesLoading(userData) {
        const badgesContainer = document.getElementById('userBadgesLoading');
        this.renderBadges(badgesContainer, userData);
    }
    
    displayUserBadgesForm(userData) {
        const badgesContainer = document.getElementById('userBadgesForm');
        this.renderBadges(badgesContainer, userData);
    }
    
    resetPlayerHead() {
        const playerHeadImage = document.getElementById('playerHeadImage');
        const playerHeadImageForm = document.getElementById('playerHeadImageForm');
        const playerHeadCircle = document.getElementById('playerHeadCircle');
        const playerHeadCircleForm = document.getElementById('playerHeadCircleForm');
        
        const badgeContainers = [
            document.getElementById('userBadges'),
            document.getElementById('userBadgesLoading'),
            document.getElementById('userBadgesForm')
        ];
        
        if (playerHeadImage) {
            playerHeadImage.style.display = 'none';
            playerHeadCircle?.classList.remove('loaded');
        }
        
        if (playerHeadImageForm) {
            playerHeadImageForm.style.display = 'none';
            playerHeadCircleForm?.classList.remove('loaded');
        }
        
        badgeContainers.forEach(container => {
            if (container) {
                container.style.display = 'none';
                container.innerHTML = '';
            }
        });
    }

    validateAge(input) {
        const age = parseInt(input.value);
        if (age && age < 16) {
            input.setCustomValidity('You must be at least 16 years old.');
        } else {
            input.setCustomValidity('');
        }
    }

    updateStartButton() {
        const discordName = document.getElementById('discordName')?.value.trim();
        const discordId = document.getElementById('discordId')?.value.trim();
        const minecraftName = document.getElementById('minecraftName')?.value.trim();
        const termsAccepted = document.getElementById('terms')?.checked;
        const startButton = document.getElementById('startButton');
        
        if (startButton) {
            const isValid = discordName && discordName.length > 0 && 
                           discordId && discordId.length > 0 && this.validateDiscordId(discordId) &&
                           minecraftName && minecraftName.length > 0 && 
                           termsAccepted;
            startButton.disabled = !isValid;
        }
    }
    
    handleDiscordIdInput(e) {
        const input = e.target;
        const value = input.value.trim();
        
        if (value && !this.validateDiscordId(value)) {
            input.setCustomValidity('Discord ID must be a valid number (17-19 digits)');
        } else {
            input.setCustomValidity('');
            if (value && this.validateDiscordId(value)) {
                this.loadDiscordProfileImage(value);
            } else {
                this.resetPlayerHead();
            }
        }
    }
    
    validateDiscordId(discordId) {
        return /^\d{17,19}$/.test(discordId);
    }
    
    async loadDiscordProfileImage(discordId) {
        if (!discordId || !this.validateDiscordId(discordId)) {
            this.resetPlayerHead();
            return;
        }
        
        const playerHeadCircle = document.getElementById('playerHeadCircle');
        const playerHeadImage = document.getElementById('playerHeadImage');
        const playerHeadPlaceholder = playerHeadCircle?.querySelector('.player-head-placeholder');
        
        if (!playerHeadCircle || !playerHeadImage || !playerHeadPlaceholder) return;
        
        try {
            playerHeadCircle.classList.add('loading');
            
            const response = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${discordId}`);
            if (!response.ok) {
                throw new Error('User not found');
            }
            
            const userData = await response.json();
            if (!userData.avatar || !userData.avatar.link) {
                throw new Error('No avatar available');
            }
            
            const discordAvatarUrl = userData.avatar.link + '.png?size=128';
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                playerHeadImage.src = discordAvatarUrl;
                playerHeadImage.style.display = 'block';
                playerHeadPlaceholder.classList.add('loaded');
                playerHeadCircle.classList.remove('loading');
                this.displayUserBadges(userData);
                console.log('Discord profile image loaded successfully via mesalytic API');
            };
            
            img.onerror = () => {
                console.log('Discord profile image failed via mesalytic API');
                this.resetPlayerHead();
            };
            
            img.src = discordAvatarUrl;
            
        } catch (error) {
            console.error('Error loading Discord profile image:', error);
            this.resetPlayerHead();
        }
    }
    

    
    async loadDiscordProfileImageLoading(discordId) {
        if (!discordId || !this.validateDiscordId(discordId)) {
            return;
        }
        
        const playerHeadCircle = document.getElementById('playerHeadCircleLoading');
        const playerHeadImage = document.getElementById('playerHeadImageLoading');
        const playerHeadPlaceholder = playerHeadCircle?.querySelector('.player-head-placeholder');
        
        if (!playerHeadCircle || !playerHeadImage || !playerHeadPlaceholder) {
            return;
        }
        
        try {
            const response = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${discordId}`);
            if (!response.ok) {
                throw new Error('User not found');
            }
            
            const userData = await response.json();
            if (!userData.avatar || !userData.avatar.link) {
                throw new Error('No avatar available');
            }
            
            const discordAvatarUrl = userData.avatar.link + '.png?size=128';
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                playerHeadImage.src = discordAvatarUrl;
                playerHeadImage.style.display = 'block';
                playerHeadPlaceholder.classList.add('loaded');
                this.displayUserBadgesLoading(userData);
                console.log('Discord profile image loaded in loading screen via mesalytic API');
            };
            
            img.onerror = () => {
                console.log('Discord profile image failed in loading via mesalytic API');
            };
            
            img.src = discordAvatarUrl;
            
        } catch (error) {
            console.error('Error loading Discord profile image in loading screen:', error);
        }
    }
    
    async loadDiscordProfileImageForm(discordId) {
        if (!discordId || !this.validateDiscordId(discordId)) {
            return;
        }
        
        const playerHeadCircle = document.getElementById('playerHeadCircleForm');
        const playerHeadImage = document.getElementById('playerHeadImageForm');
        const playerHeadPlaceholder = playerHeadCircle?.querySelector('.player-head-placeholder');
        
        if (!playerHeadCircle || !playerHeadImage || !playerHeadPlaceholder) {
            return;
        }
        
        try {
            playerHeadCircle.classList.add('loading');
            
            const response = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${discordId}`);
            if (!response.ok) {
                throw new Error('User not found');
            }
            
            const userData = await response.json();
            if (!userData.avatar || !userData.avatar.link) {
                throw new Error('No avatar available');
            }
            
            const discordAvatarUrl = userData.avatar.link + '.png?size=128';
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                playerHeadImage.src = discordAvatarUrl;
                playerHeadImage.style.display = 'block';
                playerHeadPlaceholder.classList.add('loaded');
                playerHeadCircle.classList.remove('loading');
                this.displayUserBadgesForm(userData);
                console.log('Discord profile image loaded in form via mesalytic API');
            };
            
            img.onerror = () => {
                console.log('Discord profile image failed in form via mesalytic API');
            };
            
            img.src = discordAvatarUrl;
            
        } catch (error) {
            console.error('Error loading Discord profile image in form:', error);
        }
    }

    animateInputFocus(input) {
        const wrapper = input.closest('.input-field');
        if (wrapper) {
            wrapper.style.transform = 'translateY(-2px)';
        }
    }

    animateInputBlur(input) {
        const wrapper = input.closest('.input-field');
        if (wrapper) {
            wrapper.style.transform = 'translateY(0)';
        }
    }

    handleInputChange(input) {
        if (input.value.trim()) {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const form = e.target;
        const submitButton = form.querySelector('.primary-button');
        
        if (!this.validateForm(form)) {
            await this.showErrorPopup(
                'Validation Error',
                'Please correct the errors in the form and try again.'
            );
            return;
        }
        
        await this.submitForm(form, submitButton);
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    async submitForm(form, button) {
        this.isLoading = true;
        
        try {
            await this.animateSubmitButton(button, 'loading');
            
            const formData = new FormData(form);
            const response = await this.sendFormData(formData);
            
            await this.animateSubmitButton(button, 'success');
            
            if (response.success) {
                await this.showSuccessPopup(
                    'Application Submitted!',
                    'Thank you for your application. We will review it and get back to you soon.'
                );
            } else {
                throw new Error(response.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            await this.animateSubmitButton(button, 'error');
            await this.showErrorPopup(
                'Submission Failed',
                'There was an error submitting your application. Please try again later.'
            );
        } finally {
            this.isLoading = false;
            setTimeout(() => this.resetSubmitButton(button), 2000);
        }
    }

    async animateSubmitButton(button, state) {
        const icon = button.querySelector('i');
        const text = button.querySelector('.button-text') || button;
        
        return new Promise(resolve => {
            switch (state) {
                case 'loading':
                    if (icon) icon.className = 'fas fa-spinner fa-spin';
                    if (text) text.textContent = 'Submitting...';
                    button.disabled = true;
                    break;
                    
                case 'success':
                    if (icon) icon.className = 'fas fa-check';
                    if (text) text.textContent = 'Submitted!';
                    button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                    break;
                    
                case 'error':
                    if (icon) icon.className = 'fas fa-exclamation-triangle';
                    if (text) text.textContent = 'Error!';
                    button.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
                    break;
            }
            
            setTimeout(resolve, 300);
        });
    }

    resetSubmitButton(button) {
        const icon = button.querySelector('i');
        const text = button.querySelector('.button-text') || button;
        
        if (icon) icon.className = 'fas fa-paper-plane';
        if (text) text.textContent = 'Submit Application';
        button.style.background = '';
        button.disabled = false;
    }

    async sendFormData(formData) {
        try {
            const webhookUrl = 'https://discord.com/api/webhooks/1415046708735381688/kABztnemrjgdsXTglwi1HFgv0LoEpkjX2bwdL9MG_ORuWj_1N4aMucwtzzfXpcblKeh6';
            
            const discordNameInput = document.getElementById('discordName');
            const discordIdInput = document.getElementById('discordId');
            const minecraftNameInput = document.getElementById('minecraftName');
            
            const discordName = discordNameInput ? discordNameInput.value.trim() : 'Unknown';
            const discordId = discordIdInput ? discordIdInput.value.trim() : 'Unknown';
            const minecraftName = minecraftNameInput ? minecraftNameInput.value.trim() : 'Unknown';
            
            const applicationData = {
                discordName: discordName,
                discordId: discordId,
                username: minecraftName,
                age: parseInt(formData.get('age')) || 0,
                languages: formData.getAll('languages'),
                experience: formData.get('experience') || 'Not specified',
                hours: parseInt(formData.get('hours')) || 0,
                teamwork: formData.get('teamwork') || 'Not specified',
                motivation: formData.get('motivation') || 'Not provided',
                whyChooseYou: formData.get('whyChooseYou') || 'Not provided'
            };
            
            console.log('Sending application data:', applicationData);
            
            const embed = {
                title: 'New Application Submitted',
                color: 0x1E90FF,
                fields: [
                    {
                        name: 'Discord Name',
                        value: applicationData.discordName || 'Not provided',
                        inline: true
                    },
                    {
                        name: 'Discord ID',
                        value: applicationData.discordId || 'Not provided',
                        inline: true
                    },
                    {
                        name: 'Minecraft Username',
                        value: applicationData.username || 'Not provided',
                        inline: true
                    },
                    {
                        name: 'Age',
                        value: applicationData.age ? applicationData.age.toString() : 'Not provided',
                        inline: true
                    },
                    {
                        name: 'Languages',
                        value: applicationData.languages && applicationData.languages.length > 0 ? applicationData.languages.join(', ') : 'None specified',
                        inline: true
                    },
                    {
                        name: 'Plugin Development Experience',
                        value: applicationData.experience || 'Not specified',
                        inline: true
                    },
                    {
                        name: 'Hours per week',
                        value: applicationData.hours ? applicationData.hours.toString() : 'Not specified',
                        inline: true
                    },
                    {
                        name: 'Team Experience',
                        value: applicationData.teamwork === 'yes' ? 'Yes' : (applicationData.teamwork === 'no' ? 'No' : 'Not specified'),
                        inline: true
                    },
                    {
                        name: 'Motivation',
                        value: applicationData.motivation && applicationData.motivation.trim() ? applicationData.motivation.trim() : 'Not provided',
                        inline: false
                    },
                    {
                        name: 'Why choose you over other candidates?',
                        value: applicationData.whyChooseYou && applicationData.whyChooseYou.trim() ? applicationData.whyChooseYou.trim() : 'Not provided',
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString()
            };
            
            const payload = {
                embeds: [embed]
            };
            
            console.log('Sending webhook payload:', JSON.stringify(payload, null, 2));
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('Webhook response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Webhook error response:', errorText);
                throw new Error(`Discord webhook error! status: ${response.status} - ${errorText}`);
            }
            
            const responseData = await response.text();
            console.log('Webhook success response:', responseData);
            
            return { success: true, message: 'Application submitted successfully' };
        } catch (error) {
            console.error('Webhook submission error:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            return { success: false, message: `Submission failed: ${error.message}` };
        }
    }

    async showSuccessPopup(title, message) {
        return new Promise(resolve => {
            const popup = this.createSuccessPopup(title, message, resolve);
            document.body.appendChild(popup);
            
            setTimeout(() => {
                popup.classList.add('show');
            }, 10);
        });
    }

    async showErrorPopup(title, message) {
        return this.showPopup('error', title, message);
    }

    async showPopup(type, title, message) {
        return new Promise(resolve => {
            const popup = this.createPopup(type, title, message, resolve);
            document.body.appendChild(popup);
            
            setTimeout(() => {
                popup.classList.add('show');
            }, 10);
        });
    }

    createSuccessPopup(title, message, onClose) {
        const popup = document.createElement('div');
        popup.className = 'popup-container';
        
        popup.innerHTML = `
            <div class="popup">
                <div class="popup-backdrop"></div>
                <div class="popup-content">
                    <div class="popup-icon success">
                        <i class="fas fa-check"></i>
                    </div>
                    <h3 class="popup-title">${title}</h3>
                    <p class="popup-message">${message}</p>
                    <button class="popup-button">
                        <i class="fas fa-home"></i>
                        Zur Hauptseite
                    </button>
                </div>
            </div>
        `;
        
        const closeButton = popup.querySelector('.popup-button');
        const backdrop = popup.querySelector('.popup-backdrop');
        
        const closeHandler = () => {
            this.closePopupElement(popup);
            window.location.href = 'http://localhost:8080/application.html';
            onClose();
        };
        
        closeButton.addEventListener('click', closeHandler);
        backdrop.addEventListener('click', closeHandler);
        
        return popup;
    }

    createPopup(type, title, message, onClose) {
        const popup = document.createElement('div');
        popup.className = 'popup-container';
        
        const iconClass = type === 'success' ? 'fas fa-check' : 'fas fa-exclamation-triangle';
        const iconType = type === 'success' ? 'success' : 'error';
        
        popup.innerHTML = `
            <div class="popup">
                <div class="popup-backdrop"></div>
                <div class="popup-content">
                    <div class="popup-icon ${iconType}">
                        <i class="${iconClass}"></i>
                    </div>
                    <h3 class="popup-title">${title}</h3>
                    <p class="popup-message">${message}</p>
                    <button class="popup-button">
                        <i class="fas fa-times"></i>
                        Close
                    </button>
                </div>
            </div>
        `;
        
        const closeButton = popup.querySelector('.popup-button');
        const backdrop = popup.querySelector('.popup-backdrop');
        
        const closeHandler = () => {
            this.closePopupElement(popup);
            onClose();
        };
        
        closeButton.addEventListener('click', closeHandler);
        backdrop.addEventListener('click', closeHandler);
        
        return popup;
    }

    async closePopup() {
        const popup = document.querySelector('.popup-container');
        if (popup) {
            await this.closePopupElement(popup);
        }
    }

    closePopupElement(popup) {
        return new Promise(resolve => {
            const popupEl = popup.querySelector('.popup');
            if (popupEl) {
                popupEl.classList.remove('show');
            }
            
            setTimeout(() => {
                popup.remove();
                resolve();
            }, 400);
        });
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            const activeElement = document.activeElement;
            
            if (activeElement.tagName === 'INPUT' && activeElement.type !== 'submit') {
                e.preventDefault();
                const form = activeElement.closest('form');
                if (form) {
                    const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
                    const currentIndex = inputs.indexOf(activeElement);
                    const nextInput = inputs[currentIndex + 1];
                    
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        const submitButton = form.querySelector('button[type="submit"], .primary-button');
                        if (submitButton && !submitButton.disabled) {
                            submitButton.click();
                        }
                    }
                }
            }
        }
        
        if (e.key === 'Escape') {
            this.closePopup();
        }
    }

    destroy() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        
        document.removeEventListener('keydown', this.handleKeyPress);
        
        const popups = document.querySelectorAll('.popup-container');
        popups.forEach(popup => popup.remove());
    }
}

let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new ModernApplication();
    });
} else {
    app = new ModernApplication();
}

window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});