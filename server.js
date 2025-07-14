const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Game state
let teams = {};
let achievements = {
  'first_blood': { name: 'First Blood', description: 'Solve your first challenge', icon: '🩸', points: 50 },
  'speed_demon': { name: 'Speed Demon', description: 'Solve a challenge in under 2 minutes', icon: '⚡', points: 100 },
  'night_owl': { name: 'Night Owl', description: 'Solve challenges between 10PM-6AM', icon: '🦉', points: 75 },
  'perfectionist': { name: 'Perfectionist', description: 'Solve all challenges without wrong attempts', icon: '💎', points: 200 },
  'earth_defender': { name: 'Earth Defender', description: 'Complete all challenges', icon: '🌍', points: 500 }
};

let gameState = {
  started: false,
  startTime: null,
  challenges: [
    {
      id: 1,
      title: "Mission Briefing",
      description: "Welcome, young cyber defenders! The aliens have invaded and hidden secret codes in their systems. Your mission: find the hidden flag in the alien database's HTML source code.",
      type: "html-inspection",
      flag: "FLAG{welcome_to_cyber_defense}",
      difficulty: "Beginner",
      points: 100,
      hint: "Right-click and 'View Page Source' or press F12 to inspect the HTML!"
    },
    {
      id: 2,
      title: "Alien Code Breaker",
      description: "The aliens use strange encoding! Decode this message: RkxBR3tkZWNvZGVkX3NlY3JldH0=",
      type: "base64",
      flag: "FLAG{decoded_secret}",
      difficulty: "Beginner",
      points: 150,
      hint: "This looks like Base64 encoding. Try an online Base64 decoder!"
    },
    {
      id: 3,
      title: "Hidden Alien Files",
      description: "The aliens have a secret file system. Find the hidden directory by checking their robots.txt file.",
      type: "robots",
      flag: "FLAG{found_hidden_directory}",
      difficulty: "Easy",
      points: 200,
      hint: "Check /robots.txt - it might tell you where the aliens don't want you to look!"
    },
    {
      id: 4,
      title: "Alien Database Breach",
      description: "Access the alien user database. Try bypassing their login with username 'admin' and see what happens with special characters.",
      type: "sql-injection",
      flag: "FLAG{sql_injection_master}",
      difficulty: "Intermediate",
      points: 250,
      hint: "Try entering ' OR '1'='1 in the password field. This is a classic SQL injection technique!"
    },
    {
      id: 5,
      title: "Scrambled Alien Code",
      description: "The aliens have scrambled their JavaScript code. Unscramble it to reveal the hidden flag.",
      type: "javascript-obfuscation",
      flag: "FLAG{javascript_detective}",
      difficulty: "Intermediate",
      points: 300,
      hint: "Look at the JavaScript console or try to decode the obfuscated function."
    },
    {
      id: 6,
      title: "Hidden Message in Alien Art",
      description: "The aliens have hidden a message in their artwork. Download the image and use steganography tools to reveal the secret.",
      type: "steganography",
      flag: "FLAG{hidden_in_plain_sight}",
      difficulty: "Advanced",
      points: 350,
      hint: "Try using online steganography tools or check the image metadata."
    },
    {
      id: 7,
      title: "Final Alien Stronghold",
      description: "You've reached the alien mothership! Combine all your skills to find the final flag and save Earth!",
      type: "final-challenge",
      flag: "FLAG{earth_is_saved}",
      difficulty: "Expert",
      points: 500,
      hint: "This challenge combines multiple techniques. Think about everything you've learned!"
    },
    {
      id: 8,
      title: "Alien Network Analysis",
      description: "Intercept alien network traffic. Analyze the PCAP file to find hidden communications.",
      type: "network-forensics",
      flag: "FLAG{network_detective}",
      difficulty: "Advanced",
      points: 400,
      hint: "Look for unusual protocols or encrypted communications in the network dump.",
      category: "forensics"
    },
    {
      id: 9,
      title: "Alien Cryptocurrency Heist",
      description: "The aliens are using a blockchain to store invasion coordinates. Crack their wallet.",
      type: "blockchain",
      flag: "FLAG{crypto_master}",
      difficulty: "Expert",
      points: 450,
      hint: "Check the smart contract for vulnerabilities or weak random number generation.",
      category: "crypto"
    },
    {
      id: 10,
      title: "Social Engineering the Aliens",
      description: "Gather intel on alien commanders through their social media profiles.",
      type: "osint",
      flag: "FLAG{information_gatherer}",
      difficulty: "Intermediate",
      points: 300,
      hint: "Check their posts, comments, and metadata for clues about their plans.",
      category: "misc"
    },
    {
      id: 11,
      title: "Alien Memory Corruption",
      description: "Exploit a buffer overflow in the alien ship's navigation system.",
      type: "pwn",
      flag: "FLAG{buffer_overflow_expert}",
      difficulty: "Expert",
      points: 500,
      hint: "Look for input validation issues and stack smashing opportunities.",
      category: "pwn"
    },
    {
      id: 12,
      title: "Time-based Alien Attack",
      description: "The aliens attack at specific intervals. Find the pattern in their timing.",
      type: "timing-attack",
      flag: "FLAG{time_traveler}",
      difficulty: "Advanced",
      points: 425,
      hint: "Monitor response times and look for timing-based vulnerabilities.",
      category: "crypto"
    }
  ]
};

// Enhanced game features
let leaderboardHistory = [];
let challengeAttempts = {};
let teamChatMessages = {};

// Periodic leaderboard snapshots
setInterval(() => {
  const snapshot = {
    timestamp: new Date().toISOString(),
    leaderboard: Object.values(teams)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  };
  leaderboardHistory.push(snapshot);
  
  // Keep only last 24 hours of snapshots
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  leaderboardHistory = leaderboardHistory.filter(
    snapshot => new Date(snapshot.timestamp) > oneDayAgo
  );
}, 5 * 60 * 1000); // Every 5 minutes

// Initialize storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Load saved data
function loadGameData() {
  try {
    const teamsData = fs.readFileSync(path.join(dataDir, 'teams.json'), 'utf8');
    teams = JSON.parse(teamsData);
  } catch (error) {
    console.log('No saved teams data found, starting fresh');
  }
}

// Save game data
function saveGameData() {
  try {
    fs.writeFileSync(path.join(dataDir, 'teams.json'), JSON.stringify(teams, null, 2));
  } catch (error) {
    console.error('Error saving game data:', error);
  }
}

// Load data on startup
loadGameData();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/challenge/:id', (req, res) => {
  const challengeId = parseInt(req.params.id);
  
  // Ensure gameState and challenges are properly initialized
  if (!gameState || !gameState.challenges || !Array.isArray(gameState.challenges)) {
    return res.status(500).send('Server configuration error');
  }
  
  const challenge = gameState.challenges.find(c => c.id === challengeId);
  
  if (!challenge) {
    return res.status(404).send('Challenge not found');
  }
  
  // Check if challenge is locked (for challenges 2 and above)
  if (challengeId > 1) {
    const teamName = req.query.team; // Team name should be passed as query parameter
    
    if (!teamName) {
      return res.status(403).send(`
        <html>
          <head><title>Challenge Locked</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🔒 Challenge Locked</h1>
            <p>Please register your team first and access challenges through the main game page.</p>
            <a href="/" style="color: #007bff; text-decoration: none;">← Back to Game</a>
          </body>
        </html>
      `);
    }
    
    // Ensure teams object is properly initialized
    if (!teams || typeof teams !== 'object') {
      teams = {};
    }
    
    const team = teams[teamName];
    if (!team) {
      return res.status(403).send(`
        <html>
          <head><title>Team Not Found</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Team Not Found</h1>
            <p>Team "${teamName}" is not registered.</p>
            <a href="/" style="color: #007bff; text-decoration: none;">← Back to Game</a>
          </body>
        </html>
      `);
    }
    
    // Check if previous challenge is solved
    const previousChallengeId = challengeId - 1;
    if (!team.solvedChallenges.includes(previousChallengeId)) {
      return res.status(403).send(`
        <html>
          <head><title>Challenge Locked</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🔒 Challenge Locked</h1>
            <p>You must complete Challenge ${previousChallengeId} before accessing this challenge.</p>
            <a href="/" style="color: #007bff; text-decoration: none;">← Back to Game</a>
          </body>
        </html>
      `);
    }
  }
  
  res.sendFile(path.join(__dirname, 'public', 'challenges', `challenge${challengeId}.html`));
});

// API Routes
app.get('/api/challenges', (req, res) => {
  const publicChallenges = gameState.challenges.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    difficulty: c.difficulty,
    points: c.points,
    hint: c.hint
  }));
  res.json(publicChallenges);
});

app.get('/api/teams', (req, res) => {
  res.json(teams);
});

app.post('/api/teams', (req, res) => {
  const { teamName, members } = req.body;
  
  if (!teamName || teams[teamName]) {
    return res.status(400).json({ error: 'Team name required or already exists' });
  }
  
  teams[teamName] = {
    name: teamName,
    members: members || [],
    score: 0,
    solvedChallenges: [],
    achievements: [],
    joinTime: new Date().toISOString()
  };
  
  saveGameData();
  io.emit('teams-updated', teams);
  res.json({ success: true, team: teams[teamName] });
});

app.post('/api/submit-flag', (req, res) => {
  const { teamName, challengeId, flag } = req.body;
  
  if (!teams[teamName]) {
    return res.status(400).json({ error: 'Team not found' });
  }
  
  const challenge = gameState.challenges.find(c => c.id === parseInt(challengeId));
  if (!challenge) {
    return res.status(400).json({ error: 'Challenge not found' });
  }
  
  if (teams[teamName].solvedChallenges.includes(challengeId)) {
    return res.status(400).json({ error: 'Challenge already solved' });
  }
  
  if (flag.trim() === challenge.flag) {
    teams[teamName].score += challenge.points;
    teams[teamName].solvedChallenges.push(challengeId);
    teams[teamName].lastSolve = new Date().toISOString();
    
    // Check and assign achievements
    checkAndAssignAchievements(teams[teamName], challengeId);
    
    saveGameData();
    io.emit('teams-updated', teams);
    io.emit('flag-captured', {
      teamName,
      challengeId,
      points: challenge.points,
      title: challenge.title
    });
    
    res.json({ 
      success: true, 
      message: 'Flag captured! 🎉',
      points: challenge.points,
      totalScore: teams[teamName].score
    });
  } else {
    res.status(400).json({ error: 'Incorrect flag' });
  }
});

// Check and assign achievements to a team
function checkAndAssignAchievements(team, challengeId) {
  // Achievement: First Blood
  if (team.solvedChallenges.length === 1 && !team.achievements.includes('first_blood')) {
    team.achievements.push('first_blood');
    team.score += achievements['first_blood'].points;
    io.emit('achievement-unlocked', { team: team.name, achievement: achievements['first_blood'] });
  }
  
  // Achievement: Speed Demon (for challenges that take less than 2 minutes)
  const challenge = gameState.challenges.find(c => c.id === challengeId);
  if (challenge && challenge.timeTaken < 120 && !team.achievements.includes('speed_demon')) {
    team.achievements.push('speed_demon');
    team.score += achievements['speed_demon'].points;
    io.emit('achievement-unlocked', { team: team.name, achievement: achievements['speed_demon'] });
  }
  
  // Achievement: Night Owl (for challenges solved between 10PM-6AM)
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) {
    if (!team.achievements.includes('night_owl')) {
      team.achievements.push('night_owl');
      team.score += achievements['night_owl'].points;
      io.emit('achievement-unlocked', { team: team.name, achievement: achievements['night_owl'] });
    }
  }
  
  // Achievement: Perfectionist (if all challenges are solved without wrong attempts)
  if (team.solvedChallenges.length === gameState.challenges.length && !team.achievements.includes('perfectionist')) {
    team.achievements.push('perfectionist');
    team.score += achievements['perfectionist'].points;
    io.emit('achievement-unlocked', { team: team.name, achievement: achievements['perfectionist'] });
  }
  
  // Achievement: Earth Defender (on completing all challenges)
  if (team.solvedChallenges.length === gameState.challenges.length && !team.achievements.includes('earth_defender')) {
    team.achievements.push('earth_defender');
    team.score += achievements['earth_defender'].points;
    io.emit('achievement-unlocked', { team: team.name, achievement: achievements['earth_defender'] });
  }
}

// Admin routes
app.post('/api/admin/reset', (req, res) => {
  teams = {};
  gameState.started = false;
  gameState.startTime = null;
  saveGameData();
  io.emit('game-reset');
  res.json({ success: true });
});

app.post('/api/admin/start-game', (req, res) => {
  gameState.started = true;
  gameState.startTime = new Date().toISOString();
  io.emit('game-started', gameState);
  res.json({ success: true });
});

// Enhanced API endpoints
app.get('/api/achievements/:teamName', (req, res) => {
  const { teamName } = req.params;
  const team = teams[teamName];
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json({
    achievements: team.achievements || [],
    availableAchievements: achievements
  });
});

app.get('/api/leaderboard/history', (req, res) => {
  res.json(leaderboardHistory);
});

app.get('/api/statistics', (req, res) => {
  const stats = {
    totalTeams: Object.keys(teams).length,
    totalChallengesSolved: Object.values(teams).reduce((sum, team) => 
      sum + team.solvedChallenges.length, 0),
    averageScore: Object.values(teams).length > 0 ? 
      Object.values(teams).reduce((sum, team) => sum + team.score, 0) / Object.values(teams).length : 0,
    challengeCompletionRates: gameState.challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      completionRate: Object.values(teams).filter(team => 
        team.solvedChallenges.includes(challenge.id)).length / Math.max(Object.keys(teams).length, 1) * 100
    })),
    topTeams: Object.values(teams)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(team => ({ name: team.name, score: team.score }))
  };
  
  res.json(stats);
});

app.post('/api/team-chat', (req, res) => {
  const { teamName, message } = req.body;
  
  if (!teams[teamName]) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  if (!teamChatMessages[teamName]) {
    teamChatMessages[teamName] = [];
  }
  
  const chatMessage = {
    message,
    timestamp: new Date().toISOString(),
    id: Date.now()
  };
  
  teamChatMessages[teamName].push(chatMessage);
  
  // Keep only last 50 messages per team
  if (teamChatMessages[teamName].length > 50) {
    teamChatMessages[teamName] = teamChatMessages[teamName].slice(-50);
  }
  
  io.emit('team-chat-message', { teamName, ...chatMessage });
  res.json({ success: true });
});

app.get('/api/team-chat/:teamName', (req, res) => {
  const { teamName } = req.params;
  res.json(teamChatMessages[teamName] || []);
});

// Challenge-specific routes
app.get('/api/challenge1/source', (req, res) => {
  res.send(`
    <!-- Welcome to the Alien Database -->
    <div>
      <h1>Alien Database Access</h1>
      <p>Searching for classified information...</p>
      <!-- SECRET FLAG: FLAG{welcome_to_cyber_defense} -->
      <p>Access denied for unauthorized users.</p>
    </div>
  `);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`
User-agent: *
Disallow: /secret-alien-files/
Disallow: /hidden-directory/

# FLAG{found_hidden_directory}
`);
});

app.get('/secret-alien-files/', (req, res) => {
  res.send(`
    <h1>🛸 Secret Alien Files 🛸</h1>
    <p>You found the hidden directory! Here's your reward:</p>
    <h2>FLAG{found_hidden_directory}</h2>
  `);
});

app.post('/api/alien-login', (req, res) => {
  const { username, password } = req.body;
  
  // Simulate SQL injection vulnerability
  if (password.includes("' OR '1'='1") || password.includes("' OR 1=1")) {
    res.json({
      success: true,
      message: "Login successful! You've bypassed the alien security!",
      flag: "FLAG{sql_injection_master}",
      data: [
        { id: 1, username: 'alien_commander', secret: 'invasion_plans.txt' },
        { id: 2, username: 'alien_scientist', secret: 'weapon_blueprints.txt' },
        { id: 3, username: 'admin', secret: 'FLAG{sql_injection_master}' }
      ]
    });
  } else {
    res.json({
      success: false,
      message: "Invalid credentials"
    });
  }
});

// File upload for steganography challenge
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  
  // Simulate finding hidden message
  res.json({
    success: true,
    message: "Image processed! Hidden message found:",
    flag: "FLAG{hidden_in_plain_sight}"
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CTF Game Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to play`);
  console.log(`👨‍💻 Admin panel: http://localhost:${PORT}/admin`);
});
