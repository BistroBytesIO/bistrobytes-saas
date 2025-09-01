/**
 * Sound Service for admin notifications
 * Handles audio notifications for new orders and status updates
 */

class SoundService {
  constructor() {
    this.enabled = true;
    this.volume = 0.7;
    this.audioContext = null;
    this.sounds = new Map();
    
    // Initialize audio context when user interacts
    this.initializeAudioContext();
  }

  /**
   * Initialize Web Audio API context
   */
  initializeAudioContext() {
    // Create audio context on first user interaction
    const initializeContext = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔊 Audio context initialized');
      }
      
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('🔊 Audio context resumed');
        });
      }
      
      // Remove event listener after first interaction
      document.removeEventListener('click', initializeContext);
      document.removeEventListener('keydown', initializeContext);
    };

    // Wait for user interaction to initialize audio
    document.addEventListener('click', initializeContext, { once: true });
    document.addEventListener('keydown', initializeContext, { once: true });
  }

  /**
   * Create a simple tone using Web Audio API
   */
  createTone(frequency, duration, type = 'sine') {
    if (!this.audioContext) {
      console.warn('⚠️ Audio context not available');
      return null;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      // Volume envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      return oscillator;
    } catch (error) {
      console.error('❌ Error creating tone:', error);
      return null;
    }
  }

  /**
   * Play cha-ching sound for new orders
   */
  playChaChing() {
    if (!this.enabled) return;

    try {
      // Create a pleasant cha-ching sound sequence
      setTimeout(() => this.createTone(523.25, 0.15), 0);    // C5
      setTimeout(() => this.createTone(659.25, 0.15), 100);  // E5
      setTimeout(() => this.createTone(783.99, 0.25), 200);  // G5
      
      console.log('🔔 Playing cha-ching sound');
    } catch (error) {
      console.error('❌ Error playing cha-ching:', error);
    }
  }

  /**
   * Play notification beep for status updates
   */
  playNotificationBeep() {
    if (!this.enabled) return;

    try {
      // Simple notification beep
      this.createTone(800, 0.2);
      console.log('🔔 Playing notification beep');
    } catch (error) {
      console.error('❌ Error playing notification beep:', error);
    }
  }

  /**
   * Play success sound for completed actions
   */
  playSuccess() {
    if (!this.enabled) return;

    try {
      // Success sound sequence
      setTimeout(() => this.createTone(523.25, 0.1), 0);    // C5
      setTimeout(() => this.createTone(659.25, 0.1), 80);   // E5
      setTimeout(() => this.createTone(783.99, 0.2), 160);  // G5
      
      console.log('✅ Playing success sound');
    } catch (error) {
      console.error('❌ Error playing success sound:', error);
    }
  }

  /**
   * Play warning sound for alerts
   */
  playWarning() {
    if (!this.enabled) return;

    try {
      // Warning sound - alternating tones
      setTimeout(() => this.createTone(400, 0.15), 0);
      setTimeout(() => this.createTone(300, 0.15), 200);
      
      console.log('⚠️ Playing warning sound');
    } catch (error) {
      console.error('❌ Error playing warning sound:', error);
    }
  }

  /**
   * Play error sound for failures
   */
  playError() {
    if (!this.enabled) return;

    try {
      // Error sound - descending tone
      this.createTone(300, 0.4, 'sawtooth');
      
      console.log('❌ Playing error sound');
    } catch (error) {
      console.error('❌ Error playing error sound:', error);
    }
  }

  /**
   * Enable/disable sound notifications
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`🔊 Sound notifications ${enabled ? 'enabled' : 'disabled'}`);
    
    // Store preference in localStorage
    localStorage.setItem('admin_sounds_enabled', enabled.toString());
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Set volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Volume set to ${(this.volume * 100).toFixed(0)}%`);
    
    // Store preference in localStorage
    localStorage.setItem('admin_sounds_volume', this.volume.toString());
  }

  /**
   * Get current volume level
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Load sound preferences from localStorage
   */
  loadPreferences() {
    try {
      const enabledPref = localStorage.getItem('admin_sounds_enabled');
      if (enabledPref !== null) {
        this.enabled = enabledPref === 'true';
      }

      const volumePref = localStorage.getItem('admin_sounds_volume');
      if (volumePref !== null) {
        this.volume = parseFloat(volumePref);
      }

      console.log(`🔊 Loaded sound preferences: enabled=${this.enabled}, volume=${this.volume}`);
    } catch (error) {
      console.error('❌ Error loading sound preferences:', error);
    }
  }

  /**
   * Test all sounds
   */
  testAllSounds() {
    console.log('🧪 Testing all sounds...');
    
    setTimeout(() => this.playChaChing(), 0);
    setTimeout(() => this.playNotificationBeep(), 1000);
    setTimeout(() => this.playSuccess(), 2000);
    setTimeout(() => this.playWarning(), 3000);
    setTimeout(() => this.playError(), 4000);
  }
}

// Create a singleton instance
const soundService = new SoundService();

// Load preferences on initialization
soundService.loadPreferences();

export default soundService;