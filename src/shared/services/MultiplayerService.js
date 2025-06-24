/**
 * Multiplayer Service
 * Real-time multiplayer functionality for Bebekdle
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJvc24_NJchtdsqwLFYsvRgoQrVrmSdq0",
  authDomain: "bebekdle.firebaseapp.com",
  databaseURL: "https://bebekdle-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bebekdle",
  storageBucket: "bebekdle.firebasestorage.app",
  messagingSenderId: "708006060672",
  appId: "1:708006060672:web:2109374108d4e2f6497c65"
};

class MultiplayerService {
  constructor() {
    this.app = null;
    this.database = null;
    this.auth = null;
    this.roomId = null;
    this.playerId = null;
    this.playerName = null;
    this.isConnected = false;
    this.lastUpdate = 0;
    this.isAuthenticated = false;
    this.isInitialized = false;
    
    // Initialize Firebase when constructor is called
    this.init();
    
    // Callbacks
    this.onPlayerUpdate = null;
    this.onPlayerJoin = null;
    this.onPlayerLeave = null;
    this.onGameComplete = null;
    
    // Rate limiting
    this.maxUpdatesPerMinute = 30;
    this.updateTimes = [];
  }

  /**
   * Initialize Firebase (compat API)
   */
  init() {
    try {
      // Wait for Firebase to be loaded
      if (typeof firebase === 'undefined') {
        setTimeout(() => this.init(), 100);
        return;
      }
      
      // Initialize Firebase app
      this.app = firebase.initializeApp(firebaseConfig);
      this.database = firebase.database();
      this.auth = firebase.auth();
      this.isInitialized = true;
      
      console.log('🔥 Firebase initialized successfully (compat API)');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
    }
  }

  /**
   * Wait for Firebase to be initialized
   */
  async waitForInit() {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Input sanitization for security
   * @param {string} input - User input to sanitize
   * @returns {string} - Clean input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>'"]/g, '') // Remove potential HTML/JS
      .replace(/[^\w\sğüşıçöĞÜŞİÇÖ\-]/g, '') // Only letters, spaces, dashes
      .substring(0, 50) // Max length
      .trim();
  }

  /**
   * Rate limiting check
   * @returns {boolean} - Can perform action
   */
  canUpdate() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old updates
    this.updateTimes = this.updateTimes.filter(time => time > oneMinuteAgo);
    
    if (this.updateTimes.length >= this.maxUpdatesPerMinute) {
      console.warn('🚫 Rate limit exceeded');
      return false;
    }
    
    this.updateTimes.push(now);
    return true;
  }

  /**
   * Authenticate anonymously with Firebase
   * @returns {Promise} - Authentication promise
   */
  async authenticate() {
    await this.waitForInit();
    
    if (this.isAuthenticated) return;
    
    try {
      await this.auth.signInAnonymously();
      this.isAuthenticated = true;
      console.log('🔐 Anonymous authentication successful');
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Authentication required for multiplayer');
    }
  }

  /**
   * Generate a random room ID
   * @returns {string} - 6 character room ID
   */
  generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a new multiplayer room
   * @param {string} playerName - Player's display name
   * @returns {Promise<string>} - Room ID
   */
  async createRoom(playerName) {
    // Authenticate first
    await this.authenticate();
    
    const roomId = this.generateRoomId();
    const cleanName = this.sanitizeInput(playerName);
    
    if (!cleanName) {
      throw new Error('Valid player name required');
    }

    await this.joinRoom(roomId, cleanName);
    return roomId;
  }

  /**
   * Join an existing room
   * @param {string} roomId - Room ID to join
   * @param {string} playerName - Player's display name
   */
  async joinRoom(roomId, playerName) {
    // Authenticate first
    await this.authenticate();
    
    if (!/^[A-Z0-9]{6}$/.test(roomId)) {
      throw new Error('Invalid room ID format');
    }

    const cleanName = this.sanitizeInput(playerName);
    if (!cleanName) {
      throw new Error('Valid player name required');
    }

    this.roomId = roomId;
    this.playerId = this.auth.currentUser.uid;
    this.playerName = cleanName;

    // Set player data with room metadata
    const now = Date.now();
    const roomRef = this.database.ref(`rooms/${roomId}`);
    
    // Set room metadata if it doesn't exist
    await roomRef.update({
      createdAt: now,
      expiresAt: now + (2 * 60 * 60 * 1000) // 2 hours expiry
    });
    
    // Set player data
    const playerRef = this.database.ref(`rooms/${roomId}/players/${this.playerId}`);
    await playerRef.set({
      name: cleanName,
      isOnline: true,
      joinedAt: now,
      lastSeen: now,
      currentAttempt: 0,
      lettersFound: 0,
      currentGuess: '',
      isCompleted: false,
      completedAt: null
    });

    // Handle disconnect
    await playerRef.onDisconnect().update({
      isOnline: false,
      lastSeen: Date.now()
    });

    // Start listening
    this.listenToRoom();
    this.isConnected = true;

    console.log(`🎮 Joined room: ${roomId} as ${cleanName}`);
  }

  /**
   * Listen to room updates
   */
  listenToRoom() {
    if (!this.roomId) return;

    const playersRef = this.database.ref(`rooms/${this.roomId}/players`);
    
    playersRef.on('value', (snapshot) => {
      const players = snapshot.val();
      if (!players) return;

      // Find other players
      const otherPlayers = Object.entries(players)
        .filter(([id, player]) => id !== this.playerId)
        .map(([id, player]) => ({ id, ...player }));

      // Trigger callbacks
      this.handlePlayerUpdates(otherPlayers);
    });
  }

  /**
   * Handle player updates from Firebase
   * @param {Array} otherPlayers - Other players in the room
   */
  handlePlayerUpdates(otherPlayers) {
    otherPlayers.forEach(player => {
      // Player join notification
      if (this.onPlayerJoin && player.isOnline) {
        this.onPlayerJoin(player);
      }

      // Player leave notification
      if (this.onPlayerLeave && !player.isOnline) {
        this.onPlayerLeave(player);
      }

      // Progress updates
      if (this.onPlayerUpdate && player.isOnline) {
        this.onPlayerUpdate(player);
      }

      // Game completion
      if (this.onGameComplete && player.isCompleted) {
        this.onGameComplete(player);
      }
    });
  }

  /**
   * Update player progress
   * @param {number} attempt - Current attempt number (1-6)
   * @param {number} lettersFound - Number of correct letters found
   * @param {string} currentGuess - Current guess being typed
   * @param {boolean} isCompleted - Whether game is completed
   */
  async updateProgress(attempt, lettersFound, currentGuess = '', isCompleted = false) {
    if (!this.isConnected || !this.canUpdate()) return;

    // Validate inputs
    if (attempt < 0 || attempt > 6) return;
    if (lettersFound < 0 || lettersFound > 5) return;

    const cleanGuess = this.sanitizeInput(currentGuess);
    const now = Date.now();

    const updates = {};
    const basePath = `rooms/${this.roomId}/players/${this.playerId}`;
    
    updates[`${basePath}/currentAttempt`] = attempt;
    updates[`${basePath}/lettersFound`] = lettersFound;
    updates[`${basePath}/currentGuess`] = cleanGuess;
    updates[`${basePath}/lastSeen`] = now;
    updates[`${basePath}/isCompleted`] = isCompleted;

    if (isCompleted) {
      updates[`${basePath}/completedAt`] = now;
    }

    try {
      await this.database.ref().update(updates);
      this.lastUpdate = now;
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  /**
   * Send a quick reaction/emoji
   * @param {string} emoji - Emoji to send
   */
  async sendReaction(emoji) {
    if (!this.isConnected || !this.canUpdate()) return;

    const cleanEmoji = emoji.slice(0, 4); // Max 4 chars for emoji
    
    const updates = {};
    updates[`rooms/${this.roomId}/players/${this.playerId}/lastReaction`] = {
      emoji: cleanEmoji,
      timestamp: Date.now()
    };

    await this.database.ref().update(updates);
  }

  /**
   * Leave the current room
   */
  async leaveRoom() {
    if (!this.roomId || !this.playerId) return;

    // Mark as offline
    const updates = {};
    updates[`rooms/${this.roomId}/players/${this.playerId}/isOnline`] = false;
    updates[`rooms/${this.roomId}/players/${this.playerId}/lastSeen`] = Date.now();
    
    await this.database.ref().update(updates);

    // Clean up after 5 minutes
    setTimeout(async () => {
      try {
        await this.database.ref(`rooms/${this.roomId}/players/${this.playerId}`).remove();
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    }, 5 * 60 * 1000);

    this.roomId = null;
    this.playerId = null;
    this.playerName = null;
    this.isConnected = false;

    console.log('👋 Left multiplayer room');
  }

  /**
   * Get current room info
   * @returns {Object} - Room information
   */
  getRoomInfo() {
    return {
      roomId: this.roomId,
      playerId: this.playerId,
      playerName: this.playerName,
      isConnected: this.isConnected
    };
  }

  /**
   * Check if currently in a multiplayer session
   * @returns {boolean}
   */
  isInMultiplayer() {
    return this.isConnected && this.roomId && this.playerId;
  }
}

// Singleton instance
export default new MultiplayerService();
