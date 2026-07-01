<script lang="ts">
	// Ember Rotor win chime — deliberately simple (mirrors the original prototype's direct
	// audio play). The only sound is the win chime, triggered by the dedicated `soundWin`
	// emitter event (broadcast from bookEventHandlerMap.setTotalWin on a winning drop).
	//
	// We play a SERVED .mp3 (static/sfx/win.mp3) via a plain HTMLAudioElement. NOTE: an earlier
	// version inlined the file as a base64 `data:` URI, but Stake's game iframe CSP blocks
	// `data:` media (media-src 'self'), which silenced the chime on the platform. Serving the
	// file same-origin fixes it. (HTMLAudio, not the SDK Howler audiosprite, keeps this tiny.)
	//
	// Volume/mute respect the shared stateSound (the MENU "SOUND ON/OFF" item + the Settings
	// toggle both drive volumeValueMaster): we skip playing when muted and scale by the
	// derived sound-effect volume.
	import { stateSound, stateSoundDerived } from 'state-shared';

	import { getContext } from '../game/context';

	const context = getContext();

	// Sub-path-safe served URL: '../../sfx/win.mp3' does NOT resolve to a build-time file (the
	// real file is static/sfx/win.mp3, served at <base>/sfx/win.mp3), so Vite keeps it a runtime
	// import.meta.url URL that resolves relative to the bundle — same pattern as assets.ts.
	const WIN_SOUND_URL = new URL('../../sfx/win.mp3', import.meta.url).href;
	// One reused element. The win always follows the player's DROP/START click, so the audio
	// user-gesture has already happened by the time this fires (playback is unlocked for the session).
	const audio = typeof Audio !== 'undefined' ? new Audio(WIN_SOUND_URL) : null;
	if (audio) audio.preload = 'auto';

	const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

	context.eventEmitter.subscribeOnMount({
		soundWin: () => {
			if (!audio || stateSound.volumeValueMaster <= 0) return;
			audio.volume = clamp01(stateSoundDerived.volumeSoundEffect());
			audio.currentTime = 0;
			// play() may reject if autoplay is blocked; ignore — the next win will retry.
			void audio.play().catch(() => {});
		},
	});
</script>
