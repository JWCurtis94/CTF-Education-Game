# Educational CTF Game for Students

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/JWCurtis94/CTF-Education-Game)

## 🎮 About This Game

This is a comprehensive web-based Capture The Flag (CTF) game designed specifically for students aged 11-15 (Year 7 to Year 10). The game teaches basic ethical hacking and cybersecurity skills in a fun, safe, and educational environment.

### 🎯 Educational Objectives

- Introduce students to cybersecurity concepts
- Teach ethical hacking fundamentals
- Develop critical thinking and problem-solving skills
- Make cybersecurity accessible and engaging for young learners
- Support neurodiverse students with accessible design

## 🚀 Quick Start

### Option 1: Run on Gitpod (Recommended)

1. Click the "Open in Gitpod" button above
2. Wait for the environment to load
3. The game will automatically start and open in your browser
4. Share the URL with your students

### Option 2: Local Installation

1. **Prerequisites:**
   - Node.js 14 or higher
   - npm (comes with Node.js)

2. **Installation:**
   ```bash
   git clone https://github.com/JWCurtis94/CTF-Education-Game.git
   cd CTF-Education-Game
   npm install
   ```

3. **Run the game:**
   ```bash
   npm start
   ```

4. **Access the game:**
   - Main game: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## 🎯 Game Structure

### Challenges Overview

1. **Mission Briefing (Beginner - 100 pts)**
   - HTML source code inspection
   - Introduction to browser developer tools

2. **Alien Code Breaker (Beginner - 150 pts)**
   - Base64 decoding
   - Understanding encoding vs encryption

3. **Hidden Alien Files (Easy - 200 pts)**
   - robots.txt exploration
   - Web reconnaissance basics

4. **Alien Database Breach (Intermediate - 250 pts)**
   - SQL injection fundamentals
   - Database security concepts

5. **Scrambled Alien Code (Intermediate - 300 pts)**
   - JavaScript deobfuscation
   - Code analysis techniques

6. **Hidden Message in Alien Art (Advanced - 350 pts)**
   - Digital steganography
   - Metadata analysis

7. **Final Alien Stronghold (Expert - 500 pts)**
   - Multi-layer security challenge
   - Combines all learned skills

## 👨‍🏫 Teacher's Guide

### Setting Up for Your Class

1. **Preparation:**
   - Review all challenges yourself first
   - Decide on team sizes (recommended: 2-4 students)
   - Prepare hint cards for students who need extra help

2. **Running the Game:**
   - Start the server using one of the methods above
   - Have students access the game URL
   - Monitor progress through the admin panel
   - Encourage collaboration and discussion

3. **Admin Panel Features:**
   - Real-time team monitoring
   - Progress tracking
   - Game reset capabilities
   - Export results for assessment

### Curriculum Integration

This CTF game aligns with:
- **Computing/Computer Science:** Web technologies, databases, programming
- **Mathematics:** Logic, problem-solving, pattern recognition  
- **Digital Literacy:** Online safety, digital citizenship
- **STEM:** Science, technology, engineering thinking

### Assessment Ideas

- **Teamwork:** Observe collaboration skills
- **Problem-solving:** Note different approaches to challenges
- **Technical skills:** Track progress through admin panel
- **Reflection:** Have students explain what they learned

## ♿ Accessibility Features

The game includes several features to support all learners:

- **Visual:** High contrast mode, clear typography, colorblind-friendly palette
- **Cognitive:** Step-by-step instructions, multiple hint levels, progress tracking
- **Motor:** Keyboard navigation, large click targets, no time pressure
- **Auditory:** Visual feedback, text-based instructions (sound is optional)

### For Students with Autism/ADHD

- Predictable navigation and layout
- Clear success/failure feedback
- Optional background music and sound effects
- Ability to work at own pace
- Multiple difficulty levels

## 🛡️ Safety and Ethics

### Built-in Safety Features

- **Local-only:** All challenges run locally, no real systems affected
- **Educational context:** Clear explanations of ethical use
- **Supervised environment:** Designed for classroom use
- **Age-appropriate:** Content suitable for 11-15 year olds

### Teaching Ethical Hacking

The game emphasizes:
- **Permission:** Always get authorization before testing
- **Responsibility:** Use skills to help, not harm
- **Legal compliance:** Understanding laws and regulations
- **Disclosure:** Report vulnerabilities responsibly

## 🔧 Technical Details

### Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript, Socket.io
- **Backend:** Node.js, Express.js
- **Storage:** JSON files (no database required)
- **Deployment:** Gitpod, Heroku, or local server

### File Structure

```
student-ctf-game/
├── server.js              # Main server file
├── package.json           # Dependencies
├── README.md             # This file
├── .gitpod.yml           # Gitpod configuration
├── .gitpod.Dockerfile    # Gitpod Docker setup
├── public/               # Static files
│   ├── index.html        # Main game page
│   ├── admin.html        # Admin panel
│   ├── styles.css        # Game styling
│   ├── script.js         # Game logic
│   └── challenges/       # Individual challenge pages
│       ├── challenge1.html
│       ├── challenge2.html
│       └── ...
└── data/                 # Game data storage
    └── teams.json        # Team data
```

### Customization

#### Adding New Challenges

1. Create a new challenge HTML file in `public/challenges/`
2. Add challenge data to `server.js` in the `gameState.challenges` array
3. Update the challenge routes if needed
4. Test thoroughly before deploying

#### Modifying Existing Challenges

1. Edit the challenge HTML files in `public/challenges/`
2. Update flag values in `server.js`
3. Modify point values and difficulty levels as needed

#### Changing the Theme

1. Edit CSS variables in `public/styles.css`
2. Update colors, fonts, and styling
3. Modify the narrative theme in HTML files

## 📊 Monitoring and Assessment

### Admin Panel Features

- **Real-time Dashboard:** See all team progress
- **Activity Log:** Track all game events
- **Export Data:** Download results for grading
- **Game Management:** Reset, pause, or restart the game

### Data Export

The admin panel can export:
- Team scores and rankings
- Individual challenge completion times
- Activity logs for analysis
- Complete game state for backup

## 🆘 Troubleshooting

### Common Issues

1. **Game won't start:**
   - Check Node.js version (14+)
   - Run `npm install` to install dependencies
   - Check for port conflicts (default: 3000)

2. **Students can't access the game:**
   - Verify network connectivity
   - Check firewall settings
   - Ensure correct URL is shared

3. **Flags not accepting:**
   - Verify exact flag format: `FLAG{something}`
   - Check for extra spaces or characters
   - Use admin panel to verify flag values

4. **Teams not saving:**
   - Check file permissions in `data/` directory
   - Verify server write access
   - Check browser console for errors

### Getting Help

- Check the issues section of the GitHub repository
- Review the server logs for error messages
- Test in a different browser or incognito mode
- Contact the project maintainers

## 🔄 Updates and Maintenance

### Regular Updates

- Review challenge difficulty based on student feedback
- Update dependencies for security patches
- Add new challenges based on curriculum needs
- Improve accessibility features

### Backup and Recovery

- Export game data regularly through admin panel
- Keep backup of customized files
- Document any local modifications
- Test restore procedures

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions from educators and developers:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Types of Contributions Welcome

- New challenge ideas
- Accessibility improvements
- Bug fixes and optimizations
- Documentation updates
- Translation to other languages

## 📞 Support

For technical support or educational guidance:

- **GitHub Issues:** Report bugs and request features
- **Email:** [Your contact email]
- **Discord:** [Your Discord server] for community support

## 🙏 Acknowledgments

- Thanks to all the educators who provided feedback
- Special recognition to accessibility consultants
- Appreciation for student testers and their valuable input
- Credit to the cybersecurity education community

---

**Remember:** This game is designed to inspire the next generation of ethical hackers and cybersecurity professionals. Use it to spark curiosity, teach responsibility, and make cybersecurity education accessible to all students.

🛡️ **Stay safe, stay ethical, and happy hacking!** 🛡️
