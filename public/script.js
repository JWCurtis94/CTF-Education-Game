// Global variables
let currentTeam = null;
let challenges = [];
let teams = {};
let soundEnabled = true;
let socket = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupSocketConnection();
    loadChallenges();
    loadTeams();
});

// Initialize the application
function initializeApp() {
    // Load saved settings
    const savedTheme = localStorage.getItem('ctf-theme') || 'light';
    const savedSound = localStorage.getItem('ctf-sound') !== 'false';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    soundEnabled = savedSound;
    
    updateThemeToggle();
    updateSoundToggle();
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Sound toggle
    document.getElementById('sound-toggle').addEventListener('click', toggleSound);
    
    // Help modal
    document.getElementById('help-toggle').addEventListener('click', showHelp);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
    
    // Team registration
    document.getElementById('register-team').addEventListener('click', registerTeam);
    
    // Enter key for team registration
    document.getElementById('team-name').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            registerTeam();
        }
    });
    
    // Flag submission
    document.getElementById('submit-flag').addEventListener('click', submitFlag);
    
    // Enter key for flag submission
    document.getElementById('flag-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitFlag();
        }
    });
    
    // Play again button
    document.getElementById('play-again').addEventListener('click', function() {
        closeModal();
        location.reload();
    });
}

// Setup socket connection
function setupSocketConnection() {
    socket = io();
    
    socket.on('teams-updated', function(updatedTeams) {
        teams = updatedTeams;
        updateScoreboard();
    });
    
    socket.on('flag-captured', function(data) {
        showToast(`🎉 ${data.teamName} captured "${data.title}" for ${data.points} points!`, 'success');
        playSound('success');
        
        // Add celebration animation
        createCelebration();
    });
    
    socket.on('game-reset', function() {
        showToast('🔄 Game has been reset!', 'info');
        setTimeout(() => location.reload(), 1000);
    });
    
    socket.on('game-started', function() {
        showToast('🚀 Game has started! Good luck!', 'success');
    });
}

// Load challenges from server
async function loadChallenges() {
    try {
        const response = await fetch('/api/challenges');
        challenges = await response.json();
        updateChallengesGrid();
        updateChallengeSelect();
    } catch (error) {
        console.error('Error loading challenges:', error);
        showToast('Error loading challenges', 'error');
    }
}

// Load teams from server
async function loadTeams() {
    try {
        const response = await fetch('/api/teams');
        teams = await response.json();
        updateScoreboard();
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

// Theme toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('ctf-theme', newTheme);
    
    updateThemeToggle();
    playSound('click');
}

function updateThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Sound toggle
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('ctf-sound', soundEnabled);
    updateSoundToggle();
    
    if (soundEnabled) {
        playSound('click');
    }
}

function updateSoundToggle() {
    const soundToggle = document.getElementById('sound-toggle');
    soundToggle.textContent = soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
}

// Play sound effect
function playSound(type) {
    if (!soundEnabled) return;
    
    try {
        const audio = document.getElementById(type === 'success' ? 'success-sound' : 'background-music');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    } catch (error) {
        console.log('Sound play error:', error);
    }
}

// Show help modal
function showHelp() {
    document.getElementById('help-modal').style.display = 'block';
    playSound('click');
}

// Close modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

// Register team
async function registerTeam() {
    const teamName = document.getElementById('team-name').value.trim();
    const teamMembers = document.getElementById('team-members').value.trim();
    
    if (!teamName) {
        showStatus('team-status', 'Please enter a team name', 'error');
        return;
    }
    
    if (teamName.length < 3) {
        showStatus('team-status', 'Team name must be at least 3 characters long', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/teams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teamName: teamName,
                members: teamMembers.split(',').map(m => m.trim()).filter(m => m)
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentTeam = teamName;
            showStatus('team-status', `🎉 Team "${teamName}" registered successfully!`, 'success');
            document.getElementById('team-name').value = '';
            document.getElementById('team-members').value = '';
            playSound('success');
            
            // Update UI to show team is registered
            document.getElementById('register-team').textContent = '✅ Team Registered';
            document.getElementById('register-team').disabled = true;
            
            // Show team info
            const teamInfo = document.createElement('div');
            teamInfo.className = 'team-info-display';
            teamInfo.innerHTML = `
                <h3>🏅 Your Team: ${teamName}</h3>
                <p>Members: ${data.team.members.join(', ') || 'No members listed'}</p>
                <p>You're ready to start the mission!</p>
            `;
            document.getElementById('team-status').appendChild(teamInfo);
            
        } else {
            showStatus('team-status', data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showStatus('team-status', 'Connection error. Please try again.', 'error');
    }
}

// Submit flag
async function submitFlag() {
    const challengeId = document.getElementById('challenge-select').value;
    const flag = document.getElementById('flag-input').value.trim();
    
    if (!currentTeam) {
        showStatus('flag-status', 'Please register your team first!', 'error');
        return;
    }
    
    if (!challengeId) {
        showStatus('flag-status', 'Please select a challenge', 'error');
        return;
    }
    
    if (!flag) {
        showStatus('flag-status', 'Please enter a flag', 'error');
        return;
    }
    
    if (!flag.startsWith('FLAG{') || !flag.endsWith('}')) {
        showStatus('flag-status', 'Flag must be in format: FLAG{...}', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/submit-flag', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teamName: currentTeam,
                challengeId: parseInt(challengeId),
                flag: flag
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatus('flag-status', `🎉 ${data.message} (+${data.points} points)`, 'success');
            document.getElementById('flag-input').value = '';
            document.getElementById('challenge-select').value = '';
            playSound('success');
            
            // Update challenge as solved
            updateChallengeStatus(parseInt(challengeId), true);
            
            // Check if all challenges are solved
            const teamData = teams[currentTeam];
            if (teamData && teamData.solvedChallenges.length === challenges.length) {
                setTimeout(() => showVictory(teamData), 1000);
            }
            
        } else {
            showStatus('flag-status', data.error || 'Incorrect flag', 'error');
        }
    } catch (error) {
        console.error('Flag submission error:', error);
        showStatus('flag-status', 'Connection error. Please try again.', 'error');
    }
}

// Update challenges grid
function updateChallengesGrid() {
    const grid = document.getElementById('challenges-grid');
    
    if (challenges.length === 0) {
        grid.innerHTML = '<div class="no-teams">Loading challenges...</div>';
        return;
    }
    
    grid.innerHTML = challenges.map(challenge => {
        const isSolved = currentTeam && teams[currentTeam] && 
                        teams[currentTeam].solvedChallenges.includes(challenge.id);
        
        return `
            <div class="challenge-card ${isSolved ? 'solved' : ''}" data-challenge-id="${challenge.id}">
                <div class="challenge-header">
                    <div>
                        <h3 class="challenge-title">${challenge.title}</h3>
                        <div class="difficulty-badge ${challenge.difficulty.toLowerCase()}">${challenge.difficulty}</div>
                    </div>
                    ${isSolved ? '<div class="solved-badge">✅ SOLVED</div>' : ''}
                </div>
                <p class="challenge-description">${challenge.description}</p>
                <div class="challenge-footer">
                    <span class="points">🏆 ${challenge.points} points</span>
                    <div class="challenge-actions">
                        <button class="btn btn-secondary btn-small" onclick="showHint(${challenge.id})">💡 Hint</button>
                        <button class="btn btn-primary btn-small" onclick="openChallenge(${challenge.id})">🚀 Start</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update challenge select dropdown
function updateChallengeSelect() {
    const select = document.getElementById('challenge-select');
    select.innerHTML = '<option value="">Select a challenge...</option>' + 
        challenges.map(challenge => 
            `<option value="${challenge.id}">${challenge.title} (${challenge.points} pts)</option>`
        ).join('');
}

// Update challenge status
function updateChallengeStatus(challengeId, solved) {
    const card = document.querySelector(`[data-challenge-id="${challengeId}"]`);
    if (card) {
        if (solved) {
            card.classList.add('solved');
            if (!card.querySelector('.solved-badge')) {
                const header = card.querySelector('.challenge-header');
                const badge = document.createElement('div');
                badge.className = 'solved-badge';
                badge.textContent = '✅ SOLVED';
                header.appendChild(badge);
            }
        } else {
            card.classList.remove('solved');
            const badge = card.querySelector('.solved-badge');
            if (badge) badge.remove();
        }
    }
}

// Show hint
function showHint(challengeId) {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
        showToast(`💡 Hint: ${challenge.hint}`, 'info', 8000);
        playSound('click');
    }
}

// Open challenge
function openChallenge(challengeId) {
    if (!currentTeam) {
        showToast('Please register your team first!', 'error');
        return;
    }
    
    // Open challenge in new tab
    window.open(`/challenge/${challengeId}`, '_blank');
    playSound('click');
}

// Update scoreboard
function updateScoreboard() {
    const scoreboard = document.getElementById('scoreboard');
    
    const teamArray = Object.values(teams);
    
    if (teamArray.length === 0) {
        scoreboard.innerHTML = '<div class="no-teams">No teams registered yet. Be the first to join the mission!</div>';
        return;
    }
    
    // Sort teams by score (descending)
    teamArray.sort((a, b) => b.score - a.score);
    
    scoreboard.innerHTML = teamArray.map((team, index) => {
        const isWinner = index === 0 && team.score > 0;
        const members = team.members.length > 0 ? team.members.join(', ') : 'No members listed';
        
        return `
            <div class="team-card ${isWinner ? 'winner' : ''}" data-team="${team.name}">
                <div class="team-info">
                    <h3>${index + 1}. ${team.name} ${isWinner ? '👑' : ''}</h3>
                    <p class="team-members">👥 ${members}</p>
                </div>
                <div class="team-stats">
                    <div class="score">${team.score}</div>
                    <div class="challenges-solved">${team.solvedChallenges.length}/${challenges.length} challenges</div>
                </div>
            </div>
        `;
    }).join('');
}

// Show victory screen
function showVictory(teamData) {
    document.getElementById('final-score').textContent = teamData.score;
    document.getElementById('challenges-solved').textContent = teamData.solvedChallenges.length;
    document.getElementById('victory-modal').style.display = 'block';
    
    // Play victory sound
    playSound('success');
    
    // Create fireworks effect
    createFireworks();
}

// Create celebration animation
function createCelebration() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.innerHTML = '🎉';
    celebration.style.cssText = `
        position: fixed;
        font-size: 3rem;
        z-index: 1000;
        pointer-events: none;
        animation: celebrate 2s ease-out forwards;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
    `;
    
    document.body.appendChild(celebration);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes celebrate {
            0% { transform: scale(0) rotate(0deg); opacity: 1; }
            50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
            100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => {
        celebration.remove();
        style.remove();
    }, 2000);
}

// Create fireworks effect
function createFireworks() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'firework';
            firework.innerHTML = '✨';
            firework.style.cssText = `
                position: fixed;
                font-size: 2rem;
                z-index: 1000;
                pointer-events: none;
                animation: firework 3s ease-out forwards;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            
            document.body.appendChild(firework);
            
            setTimeout(() => firework.remove(), 3000);
        }, i * 500);
    }
    
    // Add firework animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes firework {
            0% { transform: scale(0); opacity: 1; }
            20% { transform: scale(1); opacity: 1; }
            80% { transform: scale(1.2); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Show status message
function showStatus(elementId, message, type) {
    const statusElement = document.getElementById(elementId);
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    
    // Clear after 5 seconds
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'status-message';
    }, 5000);
}

// Show toast notification
function showToast(message, type = 'success', duration = 4000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Utility functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + H for help
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        showHelp();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Auto-save team selection
function saveCurrentTeam() {
    if (currentTeam) {
        localStorage.setItem('ctf-current-team', currentTeam);
    }
}

// Load saved team
function loadCurrentTeam() {
    const savedTeam = localStorage.getItem('ctf-current-team');
    if (savedTeam && teams[savedTeam]) {
        currentTeam = savedTeam;
        updateChallengesGrid();
    }
}

// Auto-refresh data every 30 seconds
setInterval(() => {
    loadTeams();
}, 30000);

// Handle window focus to refresh data
window.addEventListener('focus', () => {
    loadTeams();
    loadChallenges();
});

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

// Export functions for testing
window.CTFGame = {
    registerTeam,
    submitFlag,
    loadChallenges,
    loadTeams,
    toggleTheme,
    toggleSound,
    showHint,
    openChallenge
};
