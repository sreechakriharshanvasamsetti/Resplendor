/**
 * ═══════════════════════════════════════════════════════════
 * RESPLENDOR — script.js
 * A fully-featured Spotify-like music player
 *
 * Architecture:
 *   - SongLibrary   : data & state
 *   - Player        : audio engine
 *   - UI            : all DOM rendering / events
 *   - PlaylistManager
 *   - StorageManager
 * ═══════════════════════════════════════════════════════════
 */

'use strict';

/* ══════════════════════════════════════════════════
   1. SONG LIBRARY — default tracks
   ► Replace `src` with real paths, e.g. "songs/track.mp3"
   ► `cover` can be a URL or omit for emoji fallback
══════════════════════════════════════════════════ */
const SONGS = [
  {
    id: 1,
    title:  'Neon Requiem',
    artist: 'Synth Specter',
    album:  'Dark Frequencies',
    genre:  'Synthwave',
    duration: 214,
    cover:  null,
    emoji:  '🌆',
    src:    'songs/neon-requiem.mp3',
  },
  {
    id: 2,
    title:  'Parallel Drift',
    artist: 'Axon Wave',
    album:  'Hyperspace Vol. I',
    genre:  'Ambient',
    duration: 188,
    cover:  null,
    emoji:  '🌌',
    src:    'songs/parallel-drift.mp3',
  },
  {
    id: 3,
    title:  'Grid Runner',
    artist: 'Dataglitch',
    album:  'Dark Frequencies',
    genre:  'Cyberpunk',
    duration: 232,
    cover:  null,
    emoji:  '⚡',
    src:    'songs/grid-runner.mp3',
  },
  {
    id: 4,
    title:  'Hollow Signal',
    artist: 'Synth Specter',
    album:  'Signal Lost',
    genre:  'Synthwave',
    duration: 197,
    cover:  null,
    emoji:  '📡',
    src:    'songs/hollow-signal.mp3',
  },
  {
    id: 5,
    title:  'Chrome Hearts',
    artist: 'Velvet Circuit',
    album:  'Neon Mirage',
    genre:  'Electro Pop',
    duration: 221,
    cover:  null,
    emoji:  '💜',
    src:    'songs/chrome-hearts.mp3',
  },
  {
    id: 6,
    title:  'Fractured Light',
    artist: 'Axon Wave',
    album:  'Hyperspace Vol. I',
    genre:  'Ambient',
    duration: 244,
    cover:  null,
    emoji:  '🔮',
    src:    'songs/fractured-light.mp3',
  },
  {
    id: 7,
    title:  'Terminal Bloom',
    artist: 'Dataglitch',
    album:  'Signal Lost',
    genre:  'Cyberpunk',
    duration: 209,
    cover:  null,
    emoji:  '🌸',
    src:    'songs/terminal-bloom.mp3',
  },
  {
    id: 8,
    title:  'Midnight Protocol',
    artist: 'Velvet Circuit',
    album:  'Dark Frequencies',
    genre:  'Electro Pop',
    duration: 236,
    cover:  null,
    emoji:  '🌙',
    src:    'songs/midnight-protocol.mp3',
  },
  {
    id: 9,
    title:  'Static Horizon',
    artist: 'Synth Specter',
    album:  'Neon Mirage',
    genre:  'Synthwave',
    duration: 178,
    cover:  null,
    emoji:  '🏙️',
    src:    'songs/static-horizon.mp3',
  },
  {
    id: 10,
    title:  'Pulse Vector',
    artist: 'Axon Wave',
    album:  'Signal Lost',
    genre:  'Ambient',
    duration: 261,
    cover:  null,
    emoji:  '🌊',
    src:    'songs/pulse-vector.mp3',
  },
];

/* ══════════════════════════════════════════════════
   2. STORAGE MANAGER — localStorage wrapper
══════════════════════════════════════════════════ */
const StorageManager = {
  KEY_PLAYLISTS:  'resplendor_playlists',
  KEY_LAST_SONG:  'resplendor_last_song',
  KEY_VOLUME:     'resplendor_volume',
  KEY_LIKED:      'resplendor_liked',

  save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('LocalStorage write failed:', e); }
  },

  load(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  },

  savePlaylists(playlists) { this.save(this.KEY_PLAYLISTS, playlists); },
  loadPlaylists()          { return this.load(this.KEY_PLAYLISTS, []); },
  saveLastSong(id)         { this.save(this.KEY_LAST_SONG, id); },
  loadLastSong()           { return this.load(this.KEY_LAST_SONG, null); },
  saveVolume(vol)          { this.save(this.KEY_VOLUME, vol); },
  loadVolume()             { return this.load(this.KEY_VOLUME, 0.8); },
  saveLiked(ids)           { this.save(this.KEY_LIKED, ids); },
  loadLiked()              { return this.load(this.KEY_LIKED, []); },
};

/* ══════════════════════════════════════════════════
   3. PLAYLIST MANAGER
══════════════════════════════════════════════════ */
const PlaylistManager = {
  playlists: [],

  init() {
    const saved = StorageManager.loadPlaylists();
    if (saved.length > 0) {
      this.playlists = saved;
    } else {
      // Default playlists
      this.playlists = [
        { id: 'pl-1', name: 'Neon Favourites', emoji: '💚', songIds: [1, 3, 5, 7] },
        { id: 'pl-2', name: 'Late Night Drive',  emoji: '🌙', songIds: [2, 4, 8, 9] },
        { id: 'pl-3', name: 'Cyberpunk Mix',     emoji: '⚡', songIds: [3, 6, 10] },
      ];
      StorageManager.savePlaylists(this.playlists);
    }
  },

  create(name) {
    const pl = {
      id:      'pl-' + Date.now(),
      name:    name.trim() || 'Untitled Playlist',
      emoji:   '🎵',
      songIds: [],
    };
    this.playlists.push(pl);
    StorageManager.savePlaylists(this.playlists);
    return pl;
  },

  addSong(playlistId, songId) {
    const pl = this.get(playlistId);
    if (pl && !pl.songIds.includes(songId)) {
      pl.songIds.push(songId);
      StorageManager.savePlaylists(this.playlists);
      return true;
    }
    return false;
  },

  removeSong(playlistId, songId) {
    const pl = this.get(playlistId);
    if (pl) {
      pl.songIds = pl.songIds.filter(id => id !== songId);
      StorageManager.savePlaylists(this.playlists);
    }
  },

  get(id) { return this.playlists.find(p => p.id === id) || null; },

  getSongs(playlistId) {
    const pl = this.get(playlistId);
    if (!pl) return [];
    return pl.songIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);
  },
};

/* ══════════════════════════════════════════════════
   4. PLAYER — audio engine
══════════════════════════════════════════════════ */
const Player = {
  audio:          null,
  currentSong:    null,
  currentIndex:   -1,
  queue:          [...SONGS],  // current playback queue
  isPlaying:      false,
  isShuffle:      false,
  repeatMode:     'none',      // 'none' | 'one' | 'all'
  volume:         0.8,
  isMuted:        false,
  likedIds:       [],

  init() {
    this.audio   = document.getElementById('audioPlayer');
    this.volume  = StorageManager.loadVolume();
    this.likedIds = StorageManager.loadLiked();
    this.audio.volume = this.volume;

    // Restore last song (but don't auto-play)
    const lastId = StorageManager.loadLastSong();
    if (lastId) {
      const idx = this.queue.findIndex(s => s.id === lastId);
      if (idx !== -1) this._setCurrentByIndex(idx, false);
    }

    this._bindAudioEvents();
  },

  /* ── Playback control ──────────────────────────── */
  play(song) {
    if (!song) return;
    this.currentSong  = song;
    this.currentIndex = this.queue.findIndex(s => s.id === song.id);
    this.audio.src    = song.src;
    this.audio.load();

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked — show a toast; user must interact first
        UI.showToast('Click play to start audio ▶');
      });
    }

    this.isPlaying = true;
    StorageManager.saveLastSong(song.id);
    UI.onSongChange(song);
  },

  toggle() {
    if (!this.currentSong) {
      // Play first song if nothing is selected
      if (this.queue.length) this.play(this.queue[0]);
      return;
    }
    if (this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
    } else {
      this.audio.play();
      this.isPlaying = true;
    }
    UI.onPlayStateChange();
  },

  next() {
    if (!this.queue.length) return;
    if (this.isShuffle) {
      // Pick a random index different from current
      let idx;
      do { idx = Math.floor(Math.random() * this.queue.length); }
      while (idx === this.currentIndex && this.queue.length > 1);
      this.play(this.queue[idx]);
    } else {
      const idx = (this.currentIndex + 1) % this.queue.length;
      this.play(this.queue[idx]);
    }
  },

  prev() {
    if (!this.queue.length) return;
    // If more than 3s into the song, restart it instead of going back
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    const idx = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    this.play(this.queue[idx]);
  },

  seek(ratio) {
    if (!this.audio.duration) return;
    this.audio.currentTime = ratio * this.audio.duration;
  },

  setVolume(val) {
    this.volume       = Math.max(0, Math.min(1, val));
    this.audio.volume = this.isMuted ? 0 : this.volume;
    StorageManager.saveVolume(this.volume);
    UI.onVolumeChange();
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.audio.volume = this.isMuted ? 0 : this.volume;
    UI.onVolumeChange();
  },

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    UI.onShuffleChange();
  },

  cycleRepeat() {
    const modes = ['none', 'one', 'all'];
    const idx   = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(idx + 1) % modes.length];
    UI.onRepeatChange();
  },

  toggleLike(songId) {
    if (this.likedIds.includes(songId)) {
      this.likedIds = this.likedIds.filter(id => id !== songId);
    } else {
      this.likedIds.push(songId);
    }
    StorageManager.saveLiked(this.likedIds);
    UI.onLikeChange(songId);
  },

  isLiked(songId) { return this.likedIds.includes(songId); },

  setQueue(songs) {
    this.queue = [...songs];
    // Keep current index valid
    if (this.currentSong) {
      this.currentIndex = this.queue.findIndex(s => s.id === this.currentSong.id);
    }
  },

  /* ── Private helpers ───────────────────────────── */
  _setCurrentByIndex(idx, autoPlay = false) {
    this.currentSong  = this.queue[idx];
    this.currentIndex = idx;
    this.audio.src    = this.currentSong.src;
    if (autoPlay) this.audio.play();
    UI.onSongChange(this.currentSong);
  },

  _bindAudioEvents() {
    const a = this.audio;

    // Update progress bar in real time
    a.addEventListener('timeupdate', () => UI.onTimeUpdate());

    // Song ended
    a.addEventListener('ended', () => {
      if (this.repeatMode === 'one') {
        a.currentTime = 0;
        a.play();
      } else if (this.repeatMode === 'all') {
        this.next();
      } else {
        // none: auto-advance unless we're at last track
        if (this.currentIndex < this.queue.length - 1) {
          this.next();
        } else {
          this.isPlaying = false;
          UI.onPlayStateChange();
        }
      }
    });

    // Metadata loaded — update duration display
    a.addEventListener('loadedmetadata', () => UI.onMetaLoaded());

    a.addEventListener('play',  () => { this.isPlaying = true;  UI.onPlayStateChange(); });
    a.addEventListener('pause', () => { this.isPlaying = false; UI.onPlayStateChange(); });

    a.addEventListener('error', () => {
      UI.showToast(`⚠️ Could not load: ${this.currentSong?.title || 'track'}. Add .mp3 files to the songs/ folder.`);
    });
  },
};

/* ══════════════════════════════════════════════════
   5. UI — all DOM rendering and event wiring
══════════════════════════════════════════════════ */
const UI = {
  /* ── Cache DOM refs ─────────────────────────────── */
  els: {},

  init() {
    const ids = [
      'sidebar', 'sidebarOverlay', 'sidebarClose', 'btnHamburger',
      'songList', 'playlistList', 'libraryGrid', 'searchResults',
      'searchBar', 'searchInput', 'clearSearch', 'btnToggleSearch',
      'btnPlayAll',
      // player controls
      'btnPlayPause', 'btnPrev', 'btnNext', 'btnShuffle', 'btnRepeat',
      'btnMute', 'btnHeart',
      // progress
      'progressTrack', 'progressFill', 'progressThumb',
      'timeElapsed', 'timeTotal',
      // volume
      'volumeTrack', 'volumeFill', 'volumeThumb',
      // info display
      'playerTitle', 'playerArtist', 'playerArt',
      'featuredTitle', 'featuredArtist', 'featuredAlbum', 'featuredArt',
      // vinyl
      'vinylRecord',
      // modal
      'modalOverlay', 'modal', 'modalPlaylistName', 'btnModalCancel', 'btnModalCreate',
      'btnNewPlaylist',
      // sections
      'section-home', 'section-search', 'section-library',
      'toastContainer',
    ];
    ids.forEach(id => { this.els[id] = document.getElementById(id); });

    // Also cache nav links
    this.navLinks = document.querySelectorAll('.nav-link');
  },

  /* ── Render song list ───────────────────────────── */
  renderSongList(songs = SONGS, containerId = 'songList') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!songs.length) {
      container.innerHTML = '<p class="empty-state">No songs found.</p>';
      return;
    }

    container.innerHTML = songs.map((song, i) => `
      <div class="song-row ${Player.currentSong?.id === song.id ? 'playing' : ''}"
           data-id="${song.id}"
           role="button"
           tabindex="0"
           aria-label="Play ${song.title} by ${song.artist}">

        <div class="song-row__num">${i + 1}</div>
        <div class="song-row__playing-icon">
          <div class="playing-bars">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div class="song-row__art">
          ${song.cover
            ? `<img src="${song.cover}" alt="${song.title}" loading="lazy">`
            : song.emoji}
        </div>

        <div class="song-row__meta">
          <div class="song-row__title">${escapeHtml(song.title)}</div>
          <div class="song-row__artist">${escapeHtml(song.artist)}</div>
        </div>

        <div class="song-row__album">${escapeHtml(song.album)}</div>
        <div class="song-row__duration">${formatTime(song.duration)}</div>
      </div>
    `).join('');

    // Attach click events
    container.querySelectorAll('.song-row').forEach(row => {
      const id = Number(row.dataset.id);
      row.addEventListener('click', () => this._onSongRowClick(id));
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') this._onSongRowClick(id);
      });
    });
  },

  _onSongRowClick(id) {
    const song = SONGS.find(s => s.id === id);
    if (!song) return;
    if (Player.currentSong?.id === id) {
      Player.toggle();
    } else {
      Player.setQueue(SONGS);
      Player.play(song);
    }
  },

  /* ── Render playlists ───────────────────────────── */
  renderPlaylists() {
    const list = this.els['playlistList'];
    if (!list) return;
    list.innerHTML = PlaylistManager.playlists.map(pl => `
      <li class="playlist-item" data-pl-id="${pl.id}" tabindex="0" role="button">
        <div class="playlist-item__icon">${pl.emoji}</div>
        <span>${escapeHtml(pl.name)}</span>
      </li>
    `).join('');

    list.querySelectorAll('.playlist-item').forEach(item => {
      item.addEventListener('click', () => {
        const plId = item.dataset.plId;
        const songs = PlaylistManager.getSongs(plId);
        const pl    = PlaylistManager.get(plId);
        this.showToast(`🎵 Loaded: ${pl.name}`);
        Player.setQueue(songs.length ? songs : SONGS);
        this.renderSongList(songs.length ? songs : SONGS);
        this.navigateTo('home');

        // Highlight active playlist
        list.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      });
    });
  },

  /* ── Render library ─────────────────────────────── */
  renderLibrary() {
    const grid = this.els['libraryGrid'];
    if (!grid) return;

    // Group songs by album
    const albums = {};
    SONGS.forEach(song => {
      if (!albums[song.album]) albums[song.album] = { songs: [], emoji: song.emoji, artist: song.artist };
      albums[song.album].songs.push(song);
    });

    grid.innerHTML = Object.entries(albums).map(([album, data]) => `
      <div class="library-card" data-album="${escapeHtml(album)}">
        <div class="library-card__art">
          ${data.songs[0].cover
            ? `<img src="${data.songs[0].cover}" alt="${album}">`
            : data.emoji}
        </div>
        <div class="library-card__title">${escapeHtml(album)}</div>
        <div class="library-card__sub">${escapeHtml(data.artist)} • ${data.songs.length} tracks</div>
      </div>
    `).join('');

    grid.querySelectorAll('.library-card').forEach(card => {
      card.addEventListener('click', () => {
        const album = card.dataset.album;
        const songs = SONGS.filter(s => s.album === album);
        Player.setQueue(songs);
        this.renderSongList(songs);
        this.navigateTo('home');
        this.showToast(`💿 Playing: ${album}`);
      });
    });
  },

  /* ── Navigation ─────────────────────────────────── */
  navigateTo(section) {
    // Hide all sections
    ['home', 'search', 'library'].forEach(s => {
      const el = this.els[`section-${s}`];
      if (el) el.classList.toggle('hidden', s !== section);
    });

    // Update nav links
    this.navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === section);
    });

    // Toggle search bar visibility
    const showSearch = section === 'search';
    if (this.els['searchBar']) this.els['searchBar'].style.display = showSearch ? 'flex' : 'none';
    if (showSearch && this.els['searchInput']) this.els['searchInput'].focus();
  },

  /* ── Player update callbacks ────────────────────── */
  onSongChange(song) {
    // Player bar
    this.els['playerTitle'].textContent  = song.title;
    this.els['playerArtist'].textContent = song.artist;
    this.els['featuredTitle'].textContent  = song.title;
    this.els['featuredArtist'].textContent = song.artist;
    this.els['featuredAlbum'].textContent  = song.album;

    // Art
    this._updateArt(this.els['playerArt'], song);
    this._updateArt(this.els['featuredArt'], song);

    // Heart button
    this._refreshHeartState(song.id);

    // Reset progress
    this.els['progressFill'].style.width = '0%';
    this.els['progressThumb'].style.left = '0%';
    this.els['timeElapsed'].textContent = '0:00';

    // Highlight playing row in all song lists
    document.querySelectorAll('.song-row').forEach(row => {
      row.classList.toggle('playing', Number(row.dataset.id) === song.id);
    });

    // Featured card art
    this.els['featuredArt'].style.fontSize = '24px';

    // Spin vinyl
    this.els['vinylRecord'].classList.add('spinning');

    this.onPlayStateChange();
  },

  onPlayStateChange() {
    const playing = Player.isPlaying;

    // Play/pause button icons
    const btnPP = this.els['btnPlayPause'];
    btnPP.querySelector('.icon-play').style.display  = playing ? 'none' : 'block';
    btnPP.querySelector('.icon-pause').style.display = playing ? 'block' : 'none';

    // Vinyl
    if (playing) {
      this.els['vinylRecord'].classList.add('spinning');
    } else {
      this.els['vinylRecord'].classList.remove('spinning');
    }
  },

  onTimeUpdate() {
    const a = Player.audio;
    if (!a.duration || isNaN(a.duration)) return;

    const ratio = a.currentTime / a.duration;
    const pct   = (ratio * 100).toFixed(2) + '%';

    this.els['progressFill'].style.width = pct;
    this.els['progressThumb'].style.left = pct;
    this.els['timeElapsed'].textContent  = formatTime(Math.floor(a.currentTime));
  },

  onMetaLoaded() {
    const dur = Player.audio.duration;
    if (!isNaN(dur)) {
      this.els['timeTotal'].textContent = formatTime(Math.floor(dur));
    }
  },

  onVolumeChange() {
    const vol   = Player.isMuted ? 0 : Player.volume;
    const pct   = (vol * 100).toFixed(1) + '%';
    this.els['volumeFill'].style.width  = pct;
    this.els['volumeThumb'].style.left  = pct;

    // Toggle mute icon
    const volOnEl  = this.els['btnMute'].querySelector('.icon-vol-on');
    const volOffEl = this.els['btnMute'].querySelector('.icon-vol-off');
    if (volOnEl && volOffEl) {
      volOnEl.style.display  = Player.isMuted ? 'none'  : 'block';
      volOffEl.style.display = Player.isMuted ? 'block' : 'none';
    }
  },

  onShuffleChange() {
    this.els['btnShuffle'].classList.toggle('active', Player.isShuffle);
  },

  onRepeatChange() {
    const btn = this.els['btnRepeat'];
    btn.classList.toggle('active', Player.repeatMode !== 'none');

    // Visual indicator for repeat-one
    const title = Player.repeatMode === 'one' ? 'Repeat One'
                : Player.repeatMode === 'all' ? 'Repeat All'
                : 'Repeat Off';
    btn.title = title;

    const icon = Player.repeatMode === 'one'
      ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>`;
    btn.innerHTML = icon;
  },

  onLikeChange(songId) {
    this._refreshHeartState(songId);
  },

  _refreshHeartState(songId) {
    this.els['btnHeart'].classList.toggle('liked', Player.isLiked(songId));
  },

  _updateArt(container, song) {
    if (!container) return;
    if (song.cover) {
      container.innerHTML = `<img src="${song.cover}" alt="${escapeHtml(song.title)}">`;
    } else {
      container.innerHTML = `<div class="player-art__placeholder" style="font-size:26px">${song.emoji}</div>`;
    }
  },

  /* ── Search ──────────────────────────────────────── */
  handleSearch(query) {
    const q = query.trim().toLowerCase();
    const container = this.els['searchResults'];

    if (!q) {
      container.innerHTML = '<p class="empty-state">Start typing to search songs and artists…</p>';
      return;
    }

    const results = SONGS.filter(s =>
      s.title.toLowerCase().includes(q)  ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q)  ||
      s.genre.toLowerCase().includes(q)
    );

    this.renderSongList(results, 'searchResults');

    if (!results.length) {
      container.innerHTML = `<p class="empty-state">No results for "<strong>${escapeHtml(query)}</strong>"</p>`;
    }
  },

  /* ── Progress seek ───────────────────────────────── */
  _isDraggingProgress: false,

  initProgressSeek() {
    const track = this.els['progressTrack'];
    if (!track) return;

    const getRatio = e => {
      const rect = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };

    track.addEventListener('mousedown', e => {
      this._isDraggingProgress = true;
      Player.seek(getRatio(e));
    });
    document.addEventListener('mousemove', e => {
      if (!this._isDraggingProgress) return;
      Player.seek(getRatio(e));
    });
    document.addEventListener('mouseup', () => { this._isDraggingProgress = false; });

    // Touch support
    track.addEventListener('touchstart', e => {
      e.preventDefault();
      Player.seek(getRatio(e.touches[0]));
    }, { passive: false });
    track.addEventListener('touchmove', e => {
      e.preventDefault();
      Player.seek(getRatio(e.touches[0]));
    }, { passive: false });
  },

  /* ── Volume seek ─────────────────────────────────── */
  _isDraggingVolume: false,

  initVolumeSeek() {
    const track = this.els['volumeTrack'];
    if (!track) return;

    const getVol = e => {
      const rect = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    };

    track.addEventListener('mousedown', e => {
      this._isDraggingVolume = true;
      Player.setVolume(getVol(e));
    });
    document.addEventListener('mousemove', e => {
      if (!this._isDraggingVolume) return;
      Player.setVolume(getVol(e));
    });
    document.addEventListener('mouseup', () => { this._isDraggingVolume = false; });
  },

  /* ── Toast ───────────────────────────────────────── */
  showToast(msg, duration = 2800) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    this.els['toastContainer'].appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /* ── Mobile sidebar ──────────────────────────────── */
  openSidebar() {
    this.els['sidebar'].classList.add('open');
    this.els['sidebarOverlay'].classList.add('open');
  },
  closeSidebar() {
    this.els['sidebar'].classList.remove('open');
    this.els['sidebarOverlay'].classList.remove('open');
  },

  /* ── Modal ───────────────────────────────────────── */
  openModal() {
    this.els['modalOverlay'].classList.add('open');
    this.els['modalPlaylistName'].value = '';
    setTimeout(() => this.els['modalPlaylistName'].focus(), 100);
  },
  closeModal() {
    this.els['modalOverlay'].classList.remove('open');
  },

  /* ── Keyboard shortcuts ──────────────────────────── */
  bindKeyboard() {
    document.addEventListener('keydown', e => {
      // Ignore when typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.code) {
        case 'Space':  e.preventDefault(); Player.toggle(); break;
        case 'ArrowRight': Player.next(); break;
        case 'ArrowLeft':  Player.prev(); break;
        case 'KeyM': Player.toggleMute(); break;
        case 'KeyS': Player.toggleShuffle(); break;
        case 'KeyR': Player.cycleRepeat(); break;
        case 'ArrowUp':
          e.preventDefault();
          Player.setVolume(Player.volume + 0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          Player.setVolume(Player.volume - 0.05);
          break;
      }
    });
  },

  /* ── Bind all events ─────────────────────────────── */
  bindEvents() {
    // Navigation
    this.navLinks.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.navigateTo(link.dataset.section);
        this.closeSidebar();
      });
    });

    // Play all
    this.els['btnPlayAll']?.addEventListener('click', () => {
      Player.setQueue(SONGS);
      Player.play(SONGS[0]);
    });

    // Playback controls
    this.els['btnPlayPause']?.addEventListener('click', () => Player.toggle());
    this.els['btnNext']?.addEventListener('click', () => Player.next());
    this.els['btnPrev']?.addEventListener('click', () => Player.prev());
    this.els['btnShuffle']?.addEventListener('click', () => Player.toggleShuffle());
    this.els['btnRepeat']?.addEventListener('click', () => Player.cycleRepeat());
    this.els['btnMute']?.addEventListener('click', () => Player.toggleMute());
    this.els['btnHeart']?.addEventListener('click', () => {
      if (Player.currentSong) {
        Player.toggleLike(Player.currentSong.id);
        this.showToast(Player.isLiked(Player.currentSong.id) ? '💚 Added to liked!' : '💔 Removed from liked');
      }
    });

    // Search
    this.els['btnToggleSearch']?.addEventListener('click', () => {
      this.navigateTo('search');
    });
    this.els['searchInput']?.addEventListener('input', e => {
      this.handleSearch(e.target.value);
    });
    this.els['clearSearch']?.addEventListener('click', () => {
      this.els['searchInput'].value = '';
      this.handleSearch('');
      this.els['searchInput'].focus();
    });

    // Mobile sidebar
    this.els['btnHamburger']?.addEventListener('click', () => this.openSidebar());
    this.els['sidebarClose']?.addEventListener('click', () => this.closeSidebar());
    this.els['sidebarOverlay']?.addEventListener('click', () => this.closeSidebar());

    // Modal
    this.els['btnNewPlaylist']?.addEventListener('click', () => this.openModal());
    this.els['btnModalCancel']?.addEventListener('click', () => this.closeModal());
    this.els['btnModalCreate']?.addEventListener('click', () => {
      const name = this.els['modalPlaylistName'].value.trim();
      if (!name) { this.els['modalPlaylistName'].focus(); return; }
      PlaylistManager.create(name);
      this.renderPlaylists();
      this.closeModal();
      this.showToast(`✅ Playlist "${name}" created!`);
    });
    this.els['modalPlaylistName']?.addEventListener('keydown', e => {
      if (e.key === 'Enter') this.els['btnModalCreate'].click();
      if (e.key === 'Escape') this.closeModal();
    });
    this.els['modalOverlay']?.addEventListener('click', e => {
      if (e.target === this.els['modalOverlay']) this.closeModal();
    });

    this.initProgressSeek();
    this.initVolumeSeek();
    this.bindKeyboard();
  },
};

/* ══════════════════════════════════════════════════
   6. UTILITIES
══════════════════════════════════════════════════ */

/** Format seconds → "m:ss" */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Safely escape HTML special chars */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════════════
   7. BOOTSTRAP — run everything
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Init all managers
  PlaylistManager.init();
  UI.init();
  Player.init();

  // 2. Render initial UI
  UI.renderSongList();
  UI.renderPlaylists();
  UI.renderLibrary();

  // 3. Bind events
  UI.bindEvents();

  // 4. Set initial volume UI
  UI.onVolumeChange();

  // 5. Stagger song row animations
  setTimeout(() => {
    document.querySelectorAll('.song-row').forEach((row, i) => {
      row.style.animationDelay = `${i * 40}ms`;
    });
  }, 0);

  console.log(
    '%cRESPLENDOR 🎵',
    'color:#39ff14; font-size:20px; font-weight:900; text-shadow:0 0 10px #39ff14',
  );
  console.log(
    '%cAdd .mp3 files to the songs/ folder to start playing.',
    'color:#00f5ff; font-size:12px',
  );
});

/* ══════════════════════════════════════════════════
   8. HOW TO ADD REAL SONGS
   ══════════════════════════════════════════════════
   1. Create a "songs/" folder next to index.html
   2. Drop your .mp3 files in (e.g. songs/track.mp3)
   3. Update the SONGS array above:
        src: 'songs/your-track.mp3',
        cover: 'songs/covers/your-art.jpg', // optional
   4. Open index.html in a local server, e.g.:
        npx serve .       (Node.js)
        python -m http.server 8080   (Python)
   
   ── OPTIONAL NODE.JS + EXPRESS BACKEND ──────────
   
   // server.js
   const express = require('express');
   const path    = require('path');
   const app     = express();
   
   // Serve static files
   app.use(express.static(__dirname));
   
   // Song metadata API endpoint
   const songs = require('./songs.json');
   app.get('/api/songs', (req, res) => res.json(songs));
   
   // Stream a song by filename (range-request aware)
   const fs = require('fs');
   app.get('/stream/:file', (req, res) => {
     const filePath = path.join(__dirname, 'songs', req.params.file);
     const stat = fs.statSync(filePath);
     const range = req.headers.range;
     if (range) {
       const [start, end] = range.replace(/bytes=/, '').split('-').map(Number);
       const chunkEnd = end || Math.min(start + 1e6, stat.size - 1);
       res.writeHead(206, {
         'Content-Range': `bytes ${start}-${chunkEnd}/${stat.size}`,
         'Accept-Ranges': 'bytes',
         'Content-Length': chunkEnd - start + 1,
         'Content-Type': 'audio/mpeg',
       });
       fs.createReadStream(filePath, { start, end: chunkEnd }).pipe(res);
     } else {
       res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'audio/mpeg' });
       fs.createReadStream(filePath).pipe(res);
     }
   });
   
   app.listen(3000, () => console.log('Resplendor server → http://localhost:3000'));
   ══════════════════════════════════════════════════ */
