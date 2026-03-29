const MUSIC_URLS: Record<string, string> = {
  main:    `${import.meta.env.BASE_URL}audio/pokemon_red_opening.mp3`,
  battle:  `${import.meta.env.BASE_URL}audio/pokemon_battle.mp3`,
  catch:   `${import.meta.env.BASE_URL}audio/pokemon_trap_mix.mp3`,
  island:  `${import.meta.env.BASE_URL}audio/team_galactic.mp3`,
};

class AudioService {
  private musicAudio: HTMLAudioElement | null = null;
  private currentTrack: string | null = null;
  private enabled: boolean = true;

  setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.musicAudio?.pause();
    } else if (this.currentTrack) {
      this.musicAudio?.play().catch(() => {});
    }
  }

  playMusic(track: string) {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    const url = MUSIC_URLS[track];
    if (!url) return;
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.src = '';
    }
    this.musicAudio = new Audio(url);
    this.musicAudio.loop = true;
    this.musicAudio.volume = 0.25;
    if (this.enabled) {
      this.musicAudio.play().catch(() => {});
    }
  }

  stopMusic() {
    this.musicAudio?.pause();
    this.currentTrack = null;
  }
}

export const audioService = new AudioService();