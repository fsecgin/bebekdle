/**
 * Bebekdle Main Application Entry Point
 * Ana uygulama giriş noktası
 */

// Core imports - relative paths kullan
import { getCurrentRound } from './core/utils/time.js';
import { $, on } from './core/utils/dom.js';

// Feature imports
import { GameBoard } from './features/game/GameBoard.js';
import { GameLogic } from './features/game/GameLogic.js';
import { Keyboard } from './features/keyboard/Keyboard.js';
import { Navbar } from './features/ui/Navbar.js';
import { Snackbar } from './features/ui/Snackbar.js';

// Dialog imports
import { WinDialog } from './features/dialogs/WinDialog.js';
import { LoseDialog } from './features/dialogs/LoseDialog.js';
import { HintDialog } from './features/dialogs/HintDialog.js';
import { InfoDialog } from './features/dialogs/InfoDialog.js';
import { MultiplayerDialog } from './features/dialogs/MultiplayerDialog.js';

// Services
import MultiplayerService from './shared/services/MultiplayerService.js';

/**
 * Ana Bebekdle Uygulama Sınıfı
 */
class BebekdleApp {
  constructor() {
    this.gameBoard = null;
    this.gameLogic = null;
    this.keyboard = null;
    this.navbar = null;
    this.snackbar = null;
    
    // Multiplayer
    this.isMultiplayer = false;
    this.multiplayerInfo = null;
    
    this.init();
  }

  /**
   * Uygulamayı başlatır
   */
  async init() {
    try {
      console.log('🎮 Bebekdle starting...');
      
      // Loading screen göster
      this.showLoading();
      
      // UI bileşenlerini başlat
      this.initializeUI();
      
      // Oyun mantığını başlat
      this.gameLogic = new GameLogic();
      
      // Oyunu başlat
      await this.startGame();
      
      // Event listeners'ları ayarla
      this.setupEventListeners();
      
      // URL'den room ID kontrol et
      this.checkUrlForRoom();
      
      // Loading screen'i gizle
      this.hideLoading();
      
      console.log('✅ Bebekdle initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Bebekdle:', error);
      this.hideLoading();
      this.showError('Oyun yüklenirken bir hata oluştu. Sayfayı yenileyin.');
    }
  }

  /**
   * UI bileşenlerini başlatır
   */
  initializeUI() {
    // Navbar
    this.navbar = new Navbar($('#top-navbar'));
    this.navbar.setRound(getCurrentRound());
    
    // Game Board
    const boardContainer = $('#game-board-container') || document.body;
    this.gameBoard = new GameBoard(boardContainer);
    
    // Keyboard
    const keyboardContainer = $('#keyboard-container') || document.body;
    this.keyboard = new Keyboard(keyboardContainer);
    
    // Snackbar
    this.snackbar = new Snackbar();
  }

  /**
   * Yeni oyun başlatır
   */
  async startGame() {
    try {
      const gameInfo = await this.gameLogic.startNewGame();
      console.log('🎯 New game started:', gameInfo);
      
      // UI'ı temizle
      this.gameBoard.clear();
      this.keyboard.reset();
      
      // İlk tile'a focus
      this.gameBoard.focusTile(0, 0);
      
    } catch (error) {
      console.error('Failed to start game:', error);
      this.showError('Oyun başlatılırken hata oluştu.');
    }
  }

  /**
   * Event listeners'ları ayarlar
   */
  setupEventListeners() {
    // Fiziksel klavye
    on(document, 'keydown', (event) => this.handleKeyboardInput(event));
    
    // Ekran klavyesi
    this.keyboard.onLetterClick = (letter) => this.handleLetterInput(letter);
    this.keyboard.onBackspace = () => this.handleBackspace();
    this.keyboard.onEnter = () => this.handleSubmit();
    
    // Navbar ikonları
    this.navbar.onInfoClick = () => this.showInfoDialog();
    this.navbar.onHintClick = () => this.showHintDialog();
    this.navbar.onMultiplayerClick = () => this.showMultiplayerDialog();
    
    // Debug shortcut (Ctrl+Shift+D)
    on(document, 'keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        this.toggleDebug();
      }
    });
  }

  /**
   * Fiziksel klavye girişini işler
   * @param {KeyboardEvent} event - Klavye eventi
   */
  handleKeyboardInput(event) {
    const key = event.key.toLowerCase();
    
    if (key === 'enter') {
      event.preventDefault();
      this.handleSubmit();
    } else if (key === 'backspace') {
      event.preventDefault();
      this.handleBackspace();
    } else if (/^[a-zğüşıçö]$/.test(key)) {
      event.preventDefault();
      this.handleLetterInput(key);
    }
  }

  /**
   * Harf girişini işler
   * @param {string} letter - Girilen harf
   */
  handleLetterInput(letter) {
    const result = this.gameLogic.handleLetterInput(letter);
    
    if (result.success) {
      const status = this.gameLogic.getGameStatus();
      
      // Tahta güncelle
      this.gameBoard.updateRowTiles(status.currentRow, status.currentGuess);
      
      // Focus güncelle
      this.gameBoard.focusTile(status.currentRow, result.position);
    }
  }

  /**
   * Backspace işlemini gerçekleştirir
   */
  handleBackspace() {
    const result = this.gameLogic.handleBackspace();
    
    if (result.success) {
      const status = this.gameLogic.getGameStatus();
      
      // Tahta güncelle
      this.gameBoard.updateRowTiles(status.currentRow, status.currentGuess);
      
      // Focus güncelle
      this.gameBoard.focusTile(status.currentRow, result.position);
    }
  }

  /**
   * Tahmin gönderme işlemini gerçekleştirir
   */
  async handleSubmit() {
    const result = this.gameLogic.handleSubmitGuess();
    
    if (!result.success) {
      // Hata durumu
      this.snackbar.show(result.message);
      
      if (result.shouldShake) {
        await this.gameBoard.shakeRow(this.gameLogic.getGameStatus().currentRow);
      }
      return;
    }

    // Başarılı tahmin
    const { guess, result: guessResult, gameResult, row } = result;
    
    // 🔥 Multiplayer update
    if (this.isMultiplayer) {
      await this.updateMultiplayerProgress(gameResult, guessResult);
    }
    
    // DOĞRU ROW'da animasyonları çalıştır
    await this.gameBoard.animateRowResults(gameResult.currentRow, guessResult.letterResults);
    
    // Klavye durumlarını güncelle
    const keyStates = this.gameLogic.getKeyboardStates();
    this.keyboard.updateKeyStates(keyStates);
    
    // Oyun sonucu kontrolü
    if (gameResult.state === 'won') {
      await this.handleGameWon(gameResult);
    } else if (gameResult.state === 'lost') {
      await this.handleGameLost(gameResult);
    } else {
      // Oyun devam ediyor - ŞİMDİ sonraki satıra geç
      this.gameLogic.moveToNextRow();
      this.gameBoard.transitionToNextRow(gameResult.currentRow, gameResult.nextRow);
    }
  }

  /**
   * Oyun kazanma durumunu işler
   * @param {Object} gameResult - Oyun sonucu
   */
  async handleGameWon(gameResult) {
    const gameStatus = this.gameLogic.getGameStatus();
    
    // Game result'taki attemptsUsed değerini win dialog'a aktar
    const winDialog = new WinDialog({
      attemptsUsed: gameResult.attemptsUsed,
      maxAttempts: gameResult.maxAttempts,
      hintUsed: gameStatus.hintUsed,
      guesses: gameStatus.guesses,
      gameDuration: gameStatus.gameDuration, // Süre bilgisini ekle
      onShare: () => this.handleShare(gameResult) // gameResult'ı aktar
    });
    
    winDialog.show();
  }

  /**
   * Oyun kaybetme durumunu işler
   * @param {Object} gameResult - Oyun sonucu
   */
  async handleGameLost(gameResult) {
    const loseDialog = new LoseDialog({
      correctWord: gameResult.correctWord
    });
    
    loseDialog.show();
  }

  /**
   * Paylaşım işlemini gerçekleştirir
   * @param {Object} gameResult - Oyun sonucu (win durumunda gerekli)
   */
  async handleShare(gameResult = null) {
    try {
      const ShareService = (await import('./shared/services/ShareService.js')).default;
      const gameStatus = this.gameLogic.getGameStatus();
      
      // Stats objesini düzgün hazırla
      const shareStats = {
        attempts: gameResult ? gameResult.attemptsUsed : gameStatus.stats.attempts,
        maxAttempts: gameStatus.stats.maxAttempts,
        hintUsed: gameStatus.hintUsed,
        gameDuration: gameStatus.gameDuration // Süre bilgisini ekle
      };
      
      const result = await ShareService.share(shareStats, gameStatus.guesses);
      
      if (result.success) {
        console.log('Share successful:', result.method);
      }
    } catch (error) {
      console.error('Share failed:', error);
      this.showError('Paylaşım işlemi başarısız oldu.');
    }
  }

  /**
   * İpucu dialogunu gösterir
   */
  showHintDialog() {
    const hintDialog = new HintDialog({
      onRevealHint: () => this.handleHintReveal(),
      onClose: () => console.log('Hint dialog closed')
    });
    
    hintDialog.show();
  }

  /**
   * İpucu açıklama işlemini gerçekleştirir
   */
  handleHintReveal() {
    const result = this.gameLogic.provideHint();
    
    if (result.success) {
      this.snackbar.show(result.message);
    } else {
      this.snackbar.show(result.message);
    }
  }

  /**
   * Bilgi dialogunu gösterir
   */
  showInfoDialog() {
    const infoDialog = new InfoDialog();
    infoDialog.show();
  }

  /**
   * 🔥 Multiplayer dialogunu gösterir
   */
  showMultiplayerDialog() {
    const multiplayerDialog = new MultiplayerDialog({
      onRoomJoined: (roomInfo) => this.handleRoomJoined(roomInfo),
      onCancel: () => console.log('Multiplayer cancelled')
    });
    
    multiplayerDialog.show();
  }

  /**
   * 🔥 Room'a katılınca çağrılır
   * @param {Object} roomInfo - Room bilgileri
   */
  async handleRoomJoined(roomInfo) {
    console.log('🎮 Multiplayer room joined:', roomInfo);
    
    this.isMultiplayer = true;
    this.multiplayerInfo = roomInfo;
    
    // Multiplayer callbacks setup
    this.setupMultiplayerCallbacks();
    
    // UI feedback
    this.snackbar.show(`💕 ${roomInfo.roomId} odasına katıldın!`);
    
    // URL'i güncelle (room ID ile)
    if (history.pushState) {
      const newUrl = `${window.location.pathname}?room=${roomInfo.roomId}`;
      history.pushState(null, '', newUrl);
    }
  }

  /**
   * 🔥 Multiplayer callback'lerini ayarlar
   */
  setupMultiplayerCallbacks() {
    // Real-time specific notifications
    MultiplayerService.onPlayerUpdate = (player) => {
      // Use specific notification text from the service
      if (player.notification) {
        this.snackbar.show(player.notification);
      }
    };
    
    // Player join notifications
    MultiplayerService.onPlayerJoin = (player) => {
      if (player.notification) {
        this.snackbar.show(player.notification);
      } else {
        this.snackbar.show(`👋 ${player.name} odaya katıldı!`);
      }
    };
    
    // Player leave notifications
    MultiplayerService.onPlayerLeave = (player) => {
      if (player.notification) {
        this.snackbar.show(player.notification);
      } else {
        this.snackbar.show(`👋 ${player.name} odadan ayrıldı`);
      }
    };
    
    // Game completion notifications
    MultiplayerService.onGameComplete = (player) => {
      if (player.notification) {
        this.snackbar.show(player.notification);
      } else {
        this.snackbar.show(`🏆 ${player.name} oyunu tamamladı!`);
      }
    };
  }

  /**
   * 🔥 Multiplayer progress update gönder
   * @param {Object} gameResult - Game result
   * @param {Object} guessResult - Guess result
   */
  async updateMultiplayerProgress(gameResult, guessResult) {
    try {
      await MultiplayerService.updateProgress(
        gameResult.attemptsUsed,
        guessResult.correctLetters,
        '', // Current guess (boş çünkü tahmin tamamlandı)
        gameResult.state === 'won'
      );
    } catch (error) {
      console.error('Multiplayer update failed:', error);
    }
  }

  /**
   * 🔥 URL'den room ID'yi kontrol et
   */
  checkUrlForRoom() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (roomId && /^[A-Z0-9]{6}$/.test(roomId)) {
      // URL'de geçerli room ID var, auto-join dialog göster
      setTimeout(() => {
        this.showAutoJoinDialog(roomId);
      }, 1000);
    }
  }

  /**
   * 🔥 URL'deki room için auto-join dialog
   * @param {string} roomId - Room ID
   */
  showAutoJoinDialog(roomId) {
    const playerName = prompt(`Oda ${roomId}'e katılmak için adınızı girin:`);
    
    if (playerName && playerName.trim()) {
      MultiplayerService.joinRoom(roomId, playerName.trim())
        .then(() => {
          this.handleRoomJoined({
            roomId,
            playerName: playerName.trim(),
            mode: 'join'
          });
        })
        .catch(error => {
          console.error('Auto-join failed:', error);
          this.snackbar.show('Odaya katılırken hata oluştu');
        });
    }
  }

  /**
   * Hata mesajı gösterir
   * @param {string} message - Hata mesajı
   */
  showError(message) {
    this.snackbar.show(message);
  }

  /**
   * Loading screen'i gösterir
   */
  showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  /**
   * Loading screen'i gizler
   */
  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  // Debug metodları (gelecekte gerekirse açılabilir)
  toggleDebug() {
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
      const isVisible = debugInfo.style.display !== 'none';
      debugInfo.style.display = isVisible ? 'none' : 'block';
      debugInfo.style.position = 'fixed';
      debugInfo.style.bottom = '10px';
      debugInfo.style.left = '10px';
      debugInfo.style.background = 'rgba(0,0,0,0.8)';
      debugInfo.style.color = 'white';
      debugInfo.style.padding = '10px';
      debugInfo.style.borderRadius = '5px';
      debugInfo.style.fontFamily = 'monospace';
      debugInfo.style.fontSize = '12px';
      debugInfo.style.zIndex = '1000';
      
      if (!isVisible) {
        this.updateDebugInfo();
      }
    }
  }
  
  updateDebugInfo() {
    const debugAnswer = document.getElementById('debug-answer');
    const debugWordCount = document.getElementById('debug-wordcount');
    const debugRound = document.getElementById('debug-round');
    
    if (debugAnswer && this.gameLogic) {
      const status = this.gameLogic.getGameStatus();
      debugAnswer.textContent = `Cevap: ${status.targetWord.toUpperCase()}`;
    }
    
    if (debugWordCount) {
      const WordService = this.gameLogic?.wordService;
      const wordCount = WordService?.getWordCount() || 0;
      debugWordCount.textContent = `Words: ${wordCount}`;
    }
    
    if (debugRound) {
      debugRound.textContent = `Round: R${getCurrentRound()}`;
    }
  }
}

/**
 * DOM yüklendiğinde uygulamayı başlat
 */
document.addEventListener('DOMContentLoaded', () => {
  new BebekdleApp();
});
