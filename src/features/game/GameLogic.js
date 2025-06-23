/**
 * Game Logic Component
 * Ana oyun mantığı ve kuralları
 */

import { GAME_CONFIG, MESSAGES } from '../../core/config.js';
import WordService from '../../shared/services/WordService.js';
import GameStateService from '../../shared/services/GameStateService.js';

export class GameLogic {
  constructor() {
    this.wordService = WordService;
    this.gameState = GameStateService;
  }

  /**
   * Yeni oyun başlatır
   * @returns {Promise} - Başlatma promise'i
   */
  async startNewGame() {
    // Kelime listesini yükle (eğer yüklenmemişse)
    if (!this.wordService.isWordListLoaded()) {
      await this.wordService.loadWordList();
    }

    // Oyun durumunu sıfırla
    this.gameState.reset();
    
    // Yeni kelimeyi ayarla
    const targetWord = this.wordService.getCurrentWord();
    this.gameState.setTargetWord(targetWord);

    console.log('Target Word (Debug):', targetWord);
    
    return {
      targetWord,
      wordLength: GAME_CONFIG.WORD_LENGTH,
      maxAttempts: GAME_CONFIG.MAX_ATTEMPTS
    };
  }

  /**
   * Harf girişini işler
   * @param {string} letter - Girilen harf
   * @returns {Object} - İşlem sonucu
   */
  handleLetterInput(letter) {
    if (!this.gameState.isGameActive()) {
      return { success: false, reason: 'Game not active' };
    }

    const currentGuess = this.gameState.getCurrentGuess();
    
    if (currentGuess.length >= GAME_CONFIG.WORD_LENGTH) {
      return { success: false, reason: 'Word already complete' };
    }

    const newGuess = currentGuess + letter.toLowerCase();
    this.gameState.setCurrentGuess(newGuess);

    return {
      success: true,
      currentGuess: newGuess,
      position: newGuess.length - 1
    };
  }

  /**
   * Harf silme işlemini gerçekleştirir
   * @returns {Object} - İşlem sonucu
   */
  handleBackspace() {
    if (!this.gameState.isGameActive()) {
      return { success: false, reason: 'Game not active' };
    }

    const currentGuess = this.gameState.getCurrentGuess();
    
    if (currentGuess.length === 0) {
      return { success: false, reason: 'Nothing to delete' };
    }

    const newGuess = currentGuess.slice(0, -1);
    this.gameState.setCurrentGuess(newGuess);

    return {
      success: true,
      currentGuess: newGuess,
      position: newGuess.length
    };
  }

  /**
   * Tahmin gönderme işlemini gerçekleştirir
   * @returns {Object} - İşlem sonucu
   */
  handleSubmitGuess() {
    const currentGuess = this.gameState.getCurrentGuess();
    const targetWord = this.gameState.getTargetWord();

    // Kelime uzunluğu kontrolü
    if (currentGuess.length !== GAME_CONFIG.WORD_LENGTH) {
      return {
        success: false,
        error: 'INVALID_LENGTH',
        message: MESSAGES.INVALID_LENGTH,
        shouldShake: true
      };
    }

    // Kelime geçerliliği kontrolü
    if (!this.wordService.isValidWord(currentGuess)) {
      return {
        success: false,
        error: 'INVALID_WORD',
        message: MESSAGES.INVALID_WORD,
        shouldShake: true
      };
    }

    // Tahmini analiz et
    const result = this.analyzeGuess(currentGuess, targetWord);
    
    // Tahmin ve sonucu kaydet
    this.gameState.addGuess(currentGuess, result.letterResults);

    // Oyun durumunu kontrol et
    const gameResult = this.checkGameState(currentGuess, targetWord);

    return {
      success: true,
      guess: currentGuess,
      result: result,
      gameResult: gameResult,
      row: this.gameState.getCurrentRow()
    };
  }

  /**
   * Tahmini analiz eder ve sonuçları döndürür
   * @param {string} guess - Tahmin
   * @param {string} target - Hedef kelime
   * @returns {Object} - Analiz sonucu
   */
  analyzeGuess(guess, target) {
    const letterResults = [];
    const targetUsage = Array(target.length).fill(false);

    // 1. Önce doğru pozisyonları işaretle
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === target[i]) {
        letterResults[i] = 'correct';
        targetUsage[i] = true;
      }
    }

    // 2. Sonra yanlış pozisyonları ve olmayan harfleri kontrol et
    for (let i = 0; i < guess.length; i++) {
      if (letterResults[i] === 'correct') {
        continue; // Zaten işlendi
      }

      const letter = guess[i];
      const unusedIndex = target.split('').findIndex(
        (char, idx) => char === letter && !targetUsage[idx]
      );

      if (unusedIndex !== -1) {
        letterResults[i] = 'present';
        targetUsage[unusedIndex] = true;
      } else {
        letterResults[i] = 'absent';
      }
    }

    return {
      letterResults,
      isCorrect: guess === target,
      correctLetters: letterResults.filter(r => r === 'correct').length,
      presentLetters: letterResults.filter(r => r === 'present').length
    };
  }

  /**
   * Oyun durumunu kontrol eder (kazanma/kaybetme)
   * @param {string} guess - Son tahmin
   * @param {string} target - Hedef kelime
   * @returns {Object} - Oyun sonucu
   */
  checkGameState(guess, target) {
    const currentRow = this.gameState.getCurrentRow();
    
    if (guess === target) {
      this.gameState.setGameState('won');
      return {
        state: 'won',
        attemptsUsed: currentRow + 1,
        maxAttempts: GAME_CONFIG.MAX_ATTEMPTS,
        currentRow: currentRow
      };
    }

    // Henüz nextRow() çağırma - main.js'te animation sonrası yapılacak
    const nextRow = currentRow + 1;
    const remainingAfterThis = GAME_CONFIG.MAX_ATTEMPTS - (currentRow + 1);

    if (remainingAfterThis === 0) {
      this.gameState.setGameState('lost');
      return {
        state: 'lost',
        attemptsUsed: GAME_CONFIG.MAX_ATTEMPTS,
        maxAttempts: GAME_CONFIG.MAX_ATTEMPTS,
        correctWord: target,
        currentRow: currentRow
      };
    }

    return {
      state: 'playing',
      attemptsUsed: currentRow + 1,
      maxAttempts: GAME_CONFIG.MAX_ATTEMPTS,
      guessesRemaining: remainingAfterThis,
      currentRow: currentRow,
      nextRow: nextRow
    };
  }

  /**
   * Sonraki satıra geçer (animation sonrası çağrılacak)
   */
  moveToNextRow() {
    this.gameState.nextRow();
  }

  /**
   * İpucu verir (rastgele bir harf açıklar)
   * @returns {Object} - İpucu sonucu
   */
  provideHint() {
    const targetWord = this.gameState.getTargetWord();
    const hintLetter = this.gameState.getHintLetter();

    // Eğer daha önce ipucu verildiyse, aynı harfi kontrol et
    if (hintLetter) {
      if (this.gameState.hasGuessedLetter(hintLetter)) {
        return {
          success: false,
          message: MESSAGES.HINT_ALREADY_FOUND,
          alreadyRevealed: true
        };
      } else {
        return {
          success: true,
          letter: hintLetter,
          message: MESSAGES.HINT_REVEAL(hintLetter),
          isRepeated: true
        };
      }
    }

    // Yeni ipucu harfi seç
    const unrevealedLetters = this.getUnrevealedLetters(targetWord);
    
    if (unrevealedLetters.length === 0) {
      return {
        success: false,
        message: MESSAGES.HINT_ALREADY_FOUND,
        allRevealed: true
      };
    }

    const randomIndex = Math.floor(Math.random() * unrevealedLetters.length);
    const selectedLetter = unrevealedLetters[randomIndex];
    
    this.gameState.setHintLetter(selectedLetter);

    return {
      success: true,
      letter: selectedLetter,
      message: MESSAGES.HINT_REVEAL(selectedLetter),
      isNew: true
    };
  }

  /**
   * Henüz tahmin edilmemiş harfleri bulur
   * @param {string} targetWord - Hedef kelime
   * @returns {Array} - Açıklanmamış harfler
   */
  getUnrevealedLetters(targetWord) {
    const guessedLetters = new Set();
    
    // Tüm tahmin edilen harfleri topla
    const guesses = this.gameState.getGuesses();
    for (const guess of guesses) {
      for (const letter of guess.word) {
        guessedLetters.add(letter.toLowerCase());
      }
    }

    // Mevcut tahmin de dahil et
    const currentGuess = this.gameState.getCurrentGuess();
    for (const letter of currentGuess) {
      guessedLetters.add(letter.toLowerCase());
    }

    // Hedef kelimedeki açıklanmamış harfleri bul
    const unrevealedLetters = [];
    for (const letter of targetWord) {
      if (!guessedLetters.has(letter.toLowerCase()) && !unrevealedLetters.includes(letter.toLowerCase())) {
        unrevealedLetters.push(letter.toLowerCase());
      }
    }

    return unrevealedLetters;
  }

  /**
   * Mevcut oyun durumunu döndürür
   * @returns {Object} - Oyun durumu
   */
  getGameStatus() {
    return {
      targetWord: this.gameState.getTargetWord(),
      currentGuess: this.gameState.getCurrentGuess(),
      currentRow: this.gameState.getCurrentRow(),
      guessesRemaining: this.gameState.getGuessesRemaining(),
      gameState: this.gameState.getGameState(),
      hintUsed: this.gameState.isHintUsed(),
      guesses: this.gameState.getGuesses(),
      stats: this.gameState.getStats(),
      gameDuration: this.gameState.getGameDurationFormatted(),
      gameDurationMs: this.gameState.getGameDuration()
    };
  }

  /**
   * Klavye durumlarını hesaplar
   * @returns {Object} - Klavye harf durumları
   */
  getKeyboardStates() {
    const keyStates = {};
    const guesses = this.gameState.getGuesses();
    const targetWord = this.gameState.getTargetWord();

    for (const guess of guesses) {
      for (let i = 0; i < guess.word.length; i++) {
        const letter = guess.word[i];
        const result = guess.result[i];

        // Öncelik sırası: correct > present > absent
        if (!keyStates[letter] || 
            (result === 'correct') ||
            (result === 'present' && keyStates[letter] === 'absent')) {
          keyStates[letter] = result;
        }
      }
    }

    return keyStates;
  }
}
