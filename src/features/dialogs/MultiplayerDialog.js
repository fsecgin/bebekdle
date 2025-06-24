/**
 * Multiplayer Dialog Component
 * Room creation and joining interface
 */

import { createElement, createOverlay, removeElement, on } from '../../core/utils/dom.js';
import MultiplayerService from '../../shared/services/MultiplayerService.js';

export class MultiplayerDialog {
  constructor(options = {}) {
    this.options = {
      onRoomJoined: null,
      onCancel: null,
      ...options
    };
    
    this.overlay = null;
    this.dialog = null;
  }

  /**
   * Show the multiplayer dialog
   */
  show() {
    this.create();
    document.body.appendChild(this.overlay);
    
    // 🔥 Block game keyboard input
    this.keyboardHandler = (e) => {
      if (/^[a-zğüşıçöA-ZĞÜŞİÇÖ]$/i.test(e.key) || e.key === 'Enter' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('keydown', this.keyboardHandler, true);
  }

  /**
   * Create dialog elements
   */
  create() {
    this.overlay = createOverlay({
      id: 'multiplayer-overlay',
      onClick: (e) => {
        if (e.target === this.overlay) {
          this.hide();
        }
      }
    });

    this.dialog = createElement('div', {
      className: 'dialog multiplayer-dialog',
      innerHTML: this.getDialogHTML()
    });

    this.overlay.appendChild(this.dialog);
    this.setupEventListeners();
  }

  /**
   * Generate dialog HTML
   * @returns {string} - HTML content
   */
  getDialogHTML() {
    return `
      <div class="multiplayer-header">
        <h2>💕 Multiplayer Bebekdle</h2>
        <p>Sevgilinle birlikte oynayın!</p>
      </div>

      <div class="multiplayer-options">
        <div class="option-card" data-action="create-room">
          <div class="option-icon">🎮</div>
          <div class="option-content">
            <h3>Oda Oluştur</h3>
            <p>Yeni bir oyun odası oluştur ve linki paylaş</p>
          </div>
        </div>

        <div class="option-card" data-action="join-room">
          <div class="option-icon">🚪</div>
          <div class="option-content">
            <h3>Odaya Katıl</h3>
            <p>Mevcut bir odaya oda koduyla katıl</p>
          </div>
        </div>
      </div>

      <div class="multiplayer-form" id="room-form" style="display: none;">
        <div class="form-group">
          <label for="player-name">Adın:</label>
          <input type="text" id="player-name" placeholder="Adını gir..." maxlength="20">
        </div>

        <div class="form-group" id="room-code-group" style="display: none;">
          <label for="room-code">Oda Kodu:</label>
          <input type="text" id="room-code" placeholder="ABC123" maxlength="6" style="text-transform: uppercase;">
        </div>

        <div class="form-buttons">
          <button class="dialog-button secondary" data-action="back">Geri</button>
          <button class="dialog-button primary" id="start-multiplayer">Başla</button>
        </div>
      </div>

      <div class="multiplayer-loading" id="loading-state" style="display: none;">
        <div class="loading-spinner">🎮</div>
        <p>Oda hazırlanıyor...</p>
      </div>

      <button class="dialog-close" data-action="close">✕</button>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Create room option
    const createRoomCard = this.dialog.querySelector('[data-action="create-room"]');
    on(createRoomCard, 'click', () => this.showForm('create'));

    // Join room option
    const joinRoomCard = this.dialog.querySelector('[data-action="join-room"]');
    on(joinRoomCard, 'click', () => this.showForm('join'));

    // Back button
    const backButton = this.dialog.querySelector('[data-action="back"]');
    on(backButton, 'click', () => this.showOptions());

    // Close button
    const closeButton = this.dialog.querySelector('[data-action="close"]');
    on(closeButton, 'click', () => this.hide());

    // Start multiplayer button
    const startButton = this.dialog.querySelector('#start-multiplayer');
    on(startButton, 'click', () => this.handleStartMultiplayer());

    // Enter key support
    const inputs = this.dialog.querySelectorAll('input');
    inputs.forEach(input => {
      on(input, 'keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleStartMultiplayer();
        }
      });
    });

    // Room code formatting
    const roomCodeInput = this.dialog.querySelector('#room-code');
    on(roomCodeInput, 'input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
  }

  /**
   * Show form for create/join
   * @param {string} mode - 'create' or 'join'
   */
  showForm(mode) {
    this.currentMode = mode;
    
    // Hide options, show form
    this.dialog.querySelector('.multiplayer-options').style.display = 'none';
    this.dialog.querySelector('#room-form').style.display = 'block';
    
    // Show/hide room code input
    const roomCodeGroup = this.dialog.querySelector('#room-code-group');
    roomCodeGroup.style.display = mode === 'join' ? 'block' : 'none';
    
    // Update button text
    const startButton = this.dialog.querySelector('#start-multiplayer');
    startButton.textContent = mode === 'create' ? 'Oda Oluştur' : 'Odaya Katıl';
    
    // 🔥 FIXED: Multiple focus attempts
    const playerNameInput = this.dialog.querySelector('#player-name');
    
    const focusInput = () => {
      playerNameInput.focus();
      playerNameInput.select();
    };
    
    // Try focus multiple times with different delays
    setTimeout(focusInput, 50);
    setTimeout(focusInput, 100);
    setTimeout(focusInput, 200);
    setTimeout(focusInput, 300);
    
    // Also focus on dialog click
    this.dialog.addEventListener('click', focusInput);
  }

  /**
   * Show options screen
   */
  showOptions() {
    this.dialog.querySelector('.multiplayer-options').style.display = 'block';
    this.dialog.querySelector('#room-form').style.display = 'none';
    this.dialog.querySelector('#loading-state').style.display = 'none';
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.dialog.querySelector('.multiplayer-options').style.display = 'none';
    this.dialog.querySelector('#room-form').style.display = 'none';
    this.dialog.querySelector('#loading-state').style.display = 'block';
  }

  /**
   * Handle start multiplayer button click
   */
  async handleStartMultiplayer() {
    const playerName = this.dialog.querySelector('#player-name').value.trim();
    const roomCode = this.dialog.querySelector('#room-code').value.trim();

    // Validation
    if (!playerName) {
      this.showError('Lütfen adını gir');
      return;
    }

    if (this.currentMode === 'join' && !roomCode) {
      this.showError('Lütfen oda kodunu gir');
      return;
    }

    if (this.currentMode === 'join' && !/^[A-Z0-9]{6}$/.test(roomCode)) {
      this.showError('Oda kodu 6 karakter olmalı (A-Z, 0-9)');
      return;
    }

    this.showLoading();

    try {
      let roomId;
      
      if (this.currentMode === 'create') {
        roomId = await MultiplayerService.createRoom(playerName);
      } else {
        roomId = roomCode;
        await MultiplayerService.joinRoom(roomId, playerName);
      }

      // Success
      this.hide();
      
      if (this.options.onRoomJoined) {
        this.options.onRoomJoined({
          roomId,
          playerName,
          mode: this.currentMode
        });
      }

    } catch (error) {
      console.error('Multiplayer error:', error);
      this.showOptions();
      this.showError(error.message || 'Bağlantı hatası. Tekrar deneyin.');
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    // Remove existing error
    const existingError = this.dialog.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Add new error
    const errorDiv = createElement('div', {
      className: 'error-message',
      textContent: message
    });

    const form = this.dialog.querySelector('#room-form');
    form.insertBefore(errorDiv, form.querySelector('.form-buttons'));

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 3000);
  }

  /**
   * Hide the dialog
   */
  hide() {
    // 🔥 Remove keyboard handler
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler, true);
      this.keyboardHandler = null;
    }
    
    if (this.overlay) {
      removeElement(this.overlay);
      this.overlay = null;
      this.dialog = null;
    }

    if (this.options.onCancel) {
      this.options.onCancel();
    }
  }

  /**
   * Destroy the dialog
   */
  destroy() {
    this.hide();
  }
}
