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
    
    // Player state tracking for notifications
    this.playerStates = new Map();
    
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
   * 🔥 FIXED: Real-time room listening with proper notifications
   */
  listenToRoom() {
    if (!this.roomId) return;

    const playersRef = this.database.ref(`rooms/${this.roomId}/players`);
    
    // 🔥 Track existing players to avoid duplicate join notifications
    let initialLoad = true;
    let initialPlayers = new Set();
    
    // 🔥 First, get all existing players (including self)
    playersRef.once('value', (snapshot) => {
      const players = snapshot.val() || {};
      Object.keys(players).forEach(playerId => {
        initialPlayers.add(playerId);
        this.playerStates.set(playerId, players[playerId]);
      });
      
      console.log('📋 Initial players loaded:', Array.from(initialPlayers));
      
      // Mark initial load complete
      setTimeout(() => {
        initialLoad = false;
        console.log('📋 Initial load complete, ready for real-time notifications');
      }, 500);
    });
    
    // Listen to individual player changes for real-time updates
    playersRef.on('child_added', (snapshot) => {
      const playerId = snapshot.key;
      const playerData = snapshot.val();
      
      // Skip own addition
      if (playerId === this.playerId) return;
      
      // 🔥 Only show join notification for truly new players
      if (!initialLoad && !initialPlayers.has(playerId)) {
        console.log('👋 New player joined:', playerData.name);
        if (this.onPlayerJoin) {
          this.onPlayerJoin({ 
            id: playerId, 
            ...playerData,
            notification: `👋 ${playerData.name} odaya katıldı!`,
            type: 'player_joined'
          });
        }
      }
      
      // Always store player state
      this.playerStates.set(playerId, playerData);
      initialPlayers.add(playerId);
    });

    playersRef.on('child_changed', (snapshot) => {
      const playerId = snapshot.key;
      const newData = snapshot.val();
      
      // Skip own updates
      if (playerId === this.playerId) return;
      
      const oldData = this.playerStates.get(playerId) || {};
      this.playerStates.set(playerId, newData);
      
      console.log('🔄 Player update detected:', { 
        playerId: playerId.substring(0, 8), 
        playerName: newData.name,
        oldAttempt: oldData.currentAttempt,
        newAttempt: newData.currentAttempt,
        oldLetters: oldData.lettersFound,
        newLetters: newData.lettersFound
      });
      
      // 🔥 Real-time notifications based on changes
      this.handleRealTimeUpdate(playerId, oldData, newData);
    });

    playersRef.on('child_removed', (snapshot) => {
      const playerId = snapshot.key;
      const playerData = snapshot.val();
      
      // Remove from state tracking
      this.playerStates.delete(playerId);
      initialPlayers.delete(playerId);
      
      // 👋 Player left notification
      if (this.onPlayerLeave) {
        this.onPlayerLeave({ 
          id: playerId, 
          ...playerData,
          notification: `👋 ${playerData.name} odadan ayrıldı`,
          type: 'player_left'
        });
      }
    });
  }

  /**
   * 🚀 NEW: Handle real-time player updates with specific notifications
   */
  handleRealTimeUpdate(playerId, oldData, newData) {
    const player = { id: playerId, ...newData };
    
    console.log('🎯 Processing real-time update:', {
      playerId, 
      oldAttempt: oldData.currentAttempt,
      newAttempt: newData.currentAttempt,
      oldLetters: oldData.lettersFound,
      newLetters: newData.lettersFound,
      isCompleted: newData.isCompleted
    });
    
    // 🎯 Specific notification types based on what changed
    
    // 1. First attempt made
    if (oldData.currentAttempt === 0 && newData.currentAttempt === 1) {
      console.log('✅ First attempt detected');
      if (this.onPlayerUpdate) {
        this.onPlayerUpdate({
          ...player,
          notification: `${newData.name} ilk tahminini yaptı!`,
          type: 'first_attempt'
        });
      }
      return; // Return after notification
    }
    
    // 2. Subsequent attempts (no letters found)
    if (newData.currentAttempt > oldData.currentAttempt && newData.lettersFound === oldData.lettersFound) {
      console.log('✅ New attempt with no letters detected');
      if (this.onPlayerUpdate) {
        this.onPlayerUpdate({
          ...player,
          notification: `${newData.name} ${newData.currentAttempt}. tahminini yaptı`,
          type: 'attempt_no_letters'
        });
      }
      return; // Return after notification
    }
    
    // 3. Letters found in attempt
    if (newData.lettersFound > oldData.lettersFound) {
      console.log('✅ Letters found detected');
      if (this.onPlayerUpdate) {
        this.onPlayerUpdate({
          ...player,
          notification: `${newData.name}, ${newData.currentAttempt}. tahmininde ${newData.lettersFound} harf buldu!`,
          type: 'letters_found'
        });
      }
      return; // Return after notification
    }
    
    // 4. Game completed successfully
    if (!oldData.isCompleted && newData.isCompleted) {
      console.log('✅ Game completion detected');
      if (this.onGameComplete) {
        this.onGameComplete({
          ...player,
          notification: `${newData.name} cevabı buldu! 🎉`,
          type: 'game_won'
        });
      }
      return; // Return after notification
    }
    
    // 5. Game failed (6 attempts, not completed)
    if (newData.currentAttempt >= 6 && !newData.isCompleted && oldData.currentAttempt < 6) {
      console.log('✅ Game failure detected');
      if (this.onPlayerUpdate) {
        this.onPlayerUpdate({
          ...player,
          notification: `${newData.name} cevabı bulamadı 😢`,
          type: 'game_lost'
        });
      }
      return; // Return after notification
    }
    
    // 6. Online status changes
    if (oldData.isOnline !== newData.isOnline) {
      console.log('✅ Online status change detected');
      if (newData.isOnline) {
        if (this.onPlayerJoin) {
          this.onPlayerJoin({
            ...player,
            notification: `${newData.name} tekrar bağlandı`,
            type: 'reconnected'
          });
        }
      } else {
        if (this.onPlayerLeave) {
          this.onPlayerLeave({
            ...player,
            notification: `${newData.name} bağlantısını kaybetti`,
            type: 'disconnected'
          });
        }
      }
      return; // Return after notification
    }
    
    console.log('⚠️ No specific notification condition met, using generic update');
  }

  /**
   * Update player progress (now triggers real-time notifications)
   * @param {number} attempt - Current attempt number (1-6)
   * @param {number} lettersFound - Number of correct letters found
   * @param {string} currentGuess - Current guess being typed
   * @param {boolean} isCompleted - Whether game is completed
   */
  async updateProgress(attempt, lettersFound, currentGuess = '', isCompleted = false) {
    if (!this.isConnected || !this.canUpdate()) {
      console.warn('❌ Cannot update progress:', { isConnected: this.isConnected, canUpdate: this.canUpdate() });
      return;
    }

    // Validate inputs
    if (attempt < 0 || attempt > 6) {
      console.warn('❌ Invalid attempt:', attempt);
      return;
    }
    if (lettersFound < 0 || lettersFound > 5) {
      console.warn('❌ Invalid lettersFound:', lettersFound);
      return;
    }

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
      console.log('📡 Updating progress:', { attempt, lettersFound, isCompleted });
      
      // 🔥 This update will trigger real-time notifications to other players
      await this.database.ref().update(updates);
      this.lastUpdate = now;
      
      console.log('✅ Progress updated successfully');
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
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

    // Clean up listeners
    const playersRef = this.database.ref(`rooms/${this.roomId}/players`);
    playersRef.off();

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
    this.playerStates.clear();

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
