(function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function TinySynthAndroid(options) {
    options = options || {};

    var maxVoices = Math.max(1, Math.min(24, Number(options.maxVoices) || 10));
    var defaultVolume = clamp(Number(options.volume) || 0.14, 0, 1);
    var enabled = false;
    var audioCtx = null;
    var masterGain = null;
    var activeVoices = 0;

    function getAudioCtor() {
      return window.AudioContext || window.webkitAudioContext || null;
    }

    function getContext() {
      if (!audioCtx) {
        var Ctor = getAudioCtor();
        if (!Ctor) return null;
        audioCtx = new Ctor();
      }

      if (!masterGain) {
        masterGain = audioCtx.createGain();
        masterGain.gain.value = defaultVolume;
        masterGain.connect(audioCtx.destination);
      }

      return audioCtx;
    }

    function ensureReady() {
      var ctx = getContext();
      if (!ctx) return false;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(function () {});
      }

      return true;
    }

    function setVolume(volume) {
      var ctx = getContext();
      if (!ctx || !masterGain) return;
      var finalVolume = clamp(volume, 0, 1);
      masterGain.gain.setTargetAtTime(finalVolume, ctx.currentTime, 0.08);
    }

    function midiToFrequency(midi) {
      return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function playTone(frequency, duration, velocity, waveType) {
      if (!enabled) return null;
      if (!ensureReady()) return null;

      if (activeVoices >= maxVoices) {
        return null;
      }

      var ctx = getContext();
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var toneDuration = Math.max(0.08, Number(duration) || 0.18);
      var amp = clamp(Number(velocity) || 64, 0, 127) / 127;
      var type = waveType || 'square';

      osc.type = type;
      osc.frequency.value = Number(frequency) || 440;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime((amp * 0.42), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + toneDuration);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + toneDuration + 0.04);

      activeVoices += 1;
      osc.onended = function () {
        activeVoices = Math.max(0, activeVoices - 1);
        try { osc.disconnect(); } catch (e) {}
        try { gain.disconnect(); } catch (e) {}
      };

      return osc;
    }

    function noteOn(midi, velocity, waveType) {
      if (!enabled) return null;
      var freq = midiToFrequency(Number(midi) || 60);
      return playTone(freq, 0.18, velocity, waveType || 'square');
    }

    function noteOff() {
      // simple passive API for compatibility; no extra cleanup needed
    }

    function start() {
      enabled = true;
      ensureReady();
      return true;
    }

    function stop() {
      enabled = false;
      return true;
    }

    function stopAll() {
      // Nothing to force-stop here; the browser will naturally end active oscillators.
      return true;
    }

    function setMaxVoices(value) {
      maxVoices = Math.max(1, Math.min(24, Number(value) || maxVoices));
    }

    return {
      start: start,
      stop: stop,
      stopAll: stopAll,
      ensureReady: ensureReady,
      setVolume: setVolume,
      setMaxVoices: setMaxVoices,
      getContext: getContext,
      playTone: playTone,
      noteOn: noteOn,
      noteOff: noteOff,
      isEnabled: function () {
        return enabled;
      }
    };
  }

  window.TinySynthAndroid = TinySynthAndroid;

  if (!window.__tinySynthAndroidBootstrapped) {
    window.__tinySynthAndroidBootstrapped = true;

    ['pointerdown', 'touchstart', 'keydown', 'click', 'mousedown'].forEach(function (eventName) {
      document.addEventListener(eventName, function () {
        if (window.__tinySynthAndroidInstance) {
          window.__tinySynthAndroidInstance.ensureReady();
        }
      }, { passive: true, once: true });
    });
  }
})();
