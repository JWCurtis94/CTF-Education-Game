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
    }
  ]
};

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
    
    // Ensure teams is a valid object
    if (!teams || typeof teams !== 'object') {
      teams = {};
    }
  } catch (error) {
    console.log('No saved teams data found, starting fresh');
    teams = {};
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
  
  // Check if gameState and challenges exist
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
    
    // Check if teams object exists and is properly initialized
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
    joinTime: new Date().toISOString()
  };
  
  saveGameData();
  io.emit('teams-updated', teams);
  res.json({ success: true, team: teams[teamName] });
});

app.post('/api/submit-flag', (req, res) => {
  const { teamName, challengeId, flag } = req.body;
  
  // Check if teams object exists and is properly initialized
  if (!teams || typeof teams !== 'object') {
    teams = {};
  }
  
  if (!teams[teamName]) {
    return res.status(400).json({ error: 'Team not found' });
  }
  
  // Check if gameState and challenges exist
  if (!gameState || !gameState.challenges || !Array.isArray(gameState.challenges)) {
    return res.status(500).json({ error: 'Server configuration error' });
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

// Socket.io connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.emit('teams-updated', teams);
  socket.emit('game-state', gameState);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
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
