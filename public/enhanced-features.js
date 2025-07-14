// Enhanced CTF Game Features

class CTFGameEnhanced {
    constructor() {
        this.socket = io();
        this.achievements = {};
        this.activityFeed = [];
        this.notifications = [];
        this.initializeEnhancedFeatures();
    }

    initializeEnhancedFeatures() {
        this.setupAchievementSystem();
        this.setupActivityFeed();
        this.setupProgressTracking();
        this.setupNotifications();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
    }

    // Achievement System
    setupAchievementSystem() {
        this.socket.on('achievement-unlocked', (achievement) => {
            this.unlockAchievement(achievement);
            this.showAchievementNotification(achievement);
        });
    }

    unlockAchievement(achievement) {
        this.achievements[achievement.id] = achievement;
        const achievementEl = document.querySelector(`[data-achievement="${achievement.id}"]`);
        if (achievementEl) {
            achievementEl.classList.add('achievement-unlocked');
            achievementEl.classList.remove('locked');
        }
        this.updateAchievementProgress();
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-popup">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <h3>Achievement Unlocked!</h3>
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    <span class="points">+${achievement.points} points</span>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Activity Feed
    setupActivityFeed() {
        this.socket.on('team-joined', (data) => {
            this.addActivity('👋', `${data.teamName} joined the mission!`, data.time);
        });

        this.socket.on('flag-captured', (data) => {
            this.addActivity('🎯', `${data.teamName} captured "${data.title}"!`, data.time);
        });

        this.socket.on('hint-requested', (data) => {
            this.addActivity('💡', `${data.teamName} requested a hint for Challenge ${data.challengeId}`, data.time);
        });
    }

    addActivity(icon, text, time) {
        const activity = { icon, text, time: new Date(time) };
        this.activityFeed.unshift(activity);
        this.updateActivityFeed();
    }

    updateActivityFeed() {
        const feedEl = document.getElementById('activity-feed');
        if (!feedEl) return;

        feedEl.innerHTML = this.activityFeed.slice(0, 10).map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${activity.icon}</span>
                <span class="activity-text">${activity.text}</span>
                <span class="activity-time">${this.formatTime(activity.time)}</span>
            </div>
        `).join('');
    }

    // Progress Tracking
    setupProgressTracking() {
        this.updateProgressRing();
        setInterval(() => this.updateProgressRing(), 5000);
    }

    updateProgressRing() {
        const progressEl = document.querySelector('.progress-ring-circle');
        const textEl = document.querySelector('.progress-text');
        
        if (!progressEl || !textEl) return;

        const totalChallenges = challenges.length;
        const currentTeam = localStorage.getItem('ctf-current-team');
        const solvedCount = currentTeam && teams[currentTeam] ? 
            teams[currentTeam].solvedChallenges.length : 0;
        
        const percentage = (solvedCount / totalChallenges) * 100;
        const circumference = 2 * Math.PI * 45; // radius = 45
        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
        
        progressEl.style.strokeDasharray = strokeDasharray;
        textEl.textContent = `${solvedCount}/${totalChallenges}`;
    }

    // Enhanced Notifications
    setupNotifications() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        this.socket.on('game-event', (event) => {
            this.showDesktopNotification(event.title, event.message);
        });
    }

    showDesktopNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                tag: 'ctf-game'
            });
        }
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to submit flag
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const submitBtn = document.getElementById('submit-flag');
                if (submitBtn) submitBtn.click();
            }

            // Ctrl/Cmd + H for help
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                const helpBtn = document.getElementById('help-toggle');
                if (helpBtn) helpBtn.click();
            }

            // Ctrl/Cmd + T for theme toggle
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                const themeBtn = document.getElementById('theme-toggle');
                if (themeBtn) themeBtn.click();
            }
        });
    }

    // Auto-save feature
    setupAutoSave() {
        // Save progress every 30 seconds
        setInterval(() => {
            this.saveProgress();
        }, 30000);

        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
        });
    }

    saveProgress() {
        const currentTeam = localStorage.getItem('ctf-current-team');
        if (currentTeam) {
            const progress = {
                team: currentTeam,
                timestamp: new Date().toISOString(),
                achievements: this.achievements,
                lastChallenge: this.getCurrentChallenge()
            };
            localStorage.setItem('ctf-progress', JSON.stringify(progress));
        }
    }

    getCurrentChallenge() {
        const challengeSelect = document.getElementById('challenge-select');
        return challengeSelect ? challengeSelect.value : null;
    }

    // Utility functions
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    }

    // Team collaboration features
    setupTeamChat() {
        this.socket.on('team-message', (data) => {
            this.addChatMessage(data);
        });
    }

    sendTeamMessage(message) {
        const currentTeam = localStorage.getItem('ctf-current-team');
        if (currentTeam && message.trim()) {
            this.socket.emit('team-message', {
                team: currentTeam,
                message: message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Statistics tracking
    getTeamStatistics() {
        const currentTeam = localStorage.getItem('ctf-current-team');
        if (!currentTeam || !teams[currentTeam]) return null;

        const team = teams[currentTeam];
        const totalChallenges = challenges.length;
        const solvedChallenges = team.solvedChallenges.length;
        const completionRate = (solvedChallenges / totalChallenges) * 100;

        return {
            completionRate,
            totalPoints: team.score,
            achievementsUnlocked: Object.keys(this.achievements).length,
            timeSpent: this.calculateTimeSpent(team.joinTime),
            averageTimePerChallenge: this.calculateAverageTime(team)
        };
    }

    calculateTimeSpent(joinTime) {
        const now = new Date();
        const start = new Date(joinTime);
        return Math.floor((now - start) / 1000 / 60); // minutes
    }

    calculateAverageTime(team) {
        if (team.solvedChallenges.length === 0) return 0;
        const totalTime = this.calculateTimeSpent(team.joinTime);
        return Math.floor(totalTime / team.solvedChallenges.length);
    }
}

// Initialize enhanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ctfGameEnhanced = new CTFGameEnhanced();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CTFGameEnhanced;
}
