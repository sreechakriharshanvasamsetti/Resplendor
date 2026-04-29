/**
 * RESPLENDOR — script.js
 * Full-featured Spotify-like music player
 * Modular, well-commented JavaScript
 */

'use strict';

/* ============================================================
   1. SONG DATA — Add your local MP3 paths here
   ============================================================ */
const SONGS = [
  {
    id: 1,
    title: "Neon Drift",
    artist: "Synthwave Ghost",
    album: "Chromatic Dreams",
    duration: "3:42",
    src: "songs/neon-drift.mp3",       // ← replace with your file
    emoji: "🌆",
    color: "c0",
    genre: "Synthwave"
  },
  {
    id: 2,
    title: "Violet Haze",
    artist: "Aurora X",
    album: "Prism",
    duration: "4:11",
    src: "songs/violet-haze.mp3",
    emoji: "🔮",
    color: "c4",
    genre: "Electronic"
  },
  {
    id: 3,
    title: "Solar Flare",
    artist: "COSMO",
    album: "Stellar",
    duration: "3:55",
    src: "songs/solar-flare.mp3",
    emoji: "☀️",
    color: "c2",
    genre: "Ambient"
  },
  {
    id: 4,
    title: "Pink Signal",
    artist: "Nova Pulse",
    album: "Frequency",
    duration: "4:28",
    src: "songs/pink-signal.mp3",
    emoji: "📡",
    color: "c1",
    genre: "Synthwave"
  },
  {
    id: 5,
    title: "Ocean Circuit",
    artist: "Deep Blue",
    album: "Submerged",
    duration: "5:02",
    src: "songs/ocean-circuit.mp3",
    emoji: "🌊",
    color: "c5",
    genre: "Chill"
  },
  {
    id: 6,
    title: "Golden Hour",
    artist: "Zenith",
    album: "Horizon",
    duration: "3:30",
    src: "songs/golden-hour.mp3",
    emoji: "🌅",
    color: "c3",
    genre: "Chill"
  },
  {
    id: 7,
    title: "Laser Rain",
    artist: "Synthwave Ghost",
    album: "Chromatic Dreams",
    duration: "4:00",
    src: "songs/laser-rain.mp3",
    emoji: "⚡",
    color: "c6",
    genre: "Electronic"
  },
  {
    id: 8,
    title: "Forest Code",
    artist: "PixelWood",
    album: "Organic Bits",
    duration: "3:18",
    src: "songs/forest-code.mp3",
    emoji: "🌲",
    color: "c7",
    genre: "Ambient"
  },
];

/* ============================================================
   2. PLAYLIST DATA
   ============================================================ */
let PLAYLISTS = [
  { id: "pl1", name: "Synthwave Rides", songIds: [1, 4, 7] },
  { id: "pl2", name: "Chill Zone",      songIds: [5, 6, 8] },
  { id: "pl3", name: "Favourites",      songIds: [] },
];

/* ============================================================
   3. APP STATE
   ============================================================ */
const state = {
  currentSongIndex: -1,     // Index in current queue
  queue: [...SONGS],        // Songs currently being played
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0,            // 0=off, 1=all, 2=one
  library: [],              // Song IDs added to library
  currentView: 'home',
  currentPlaylistId: null,
};

/* ============================================================
   4. DOM REFERENCES
   ============================================================ */
const audio          = document.getElementById('audio-player');
const btnPlay        = document.getElementById('btn-play');
const playIcon       = document.getElementById('play-icon');
const btnPrev        = document.getElementById('btn-prev');
const btnNext        = document.getElementById('btn-next');
const btnShuffle     = document.getElementById('btn-shuffle');
const btnRepeat      = document.getElementById('btn-repeat');
const progressTrack  = document.getElementById('progress-track');
const progressFill   = document.getElementById('progress-fill');
const progressThumb  = document.getElementById('progress-thumb');
const currentTimeEl  = document.getElementById('current-time');
const totalTimeEl    = document.getElementById('total-time');
const playerTitle    = document.getElementById('player-title');
const playerArtist   = document.getElementById('player-artist');
const coverArtEl     = document.getElementById('cover-art-display');
const volumeSlider   = document.getElementById('volume-slider');
const playerBar      = document.getElementById('player-bar');
const likeBtn        = document.getElementById('like-btn');
const searchInput    = document.getElementById('search-input');
const playlistList   = document.getElementById('playlist-list');
const btnNewPlaylist = document.getElementById('btn-new-playlist');
const hamburger      = document.getElementById('hamburger');
const sidebar        = document.getElementById('sidebar');
const timeGreeting   = document.getElementById('time-greeting');

/* ============================================================
   5. INTRO BLAST ANIMATION
   ============================================================ */
function runIntro() {
  const overlay = document.getElementById('intro-overlay');
  const canvas  = document.getElementById('intro-canvas');
  const logo    = document.getElementById('intro-logo');
  const ctx     = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Particle burst colors matching the neon theme
  const COLORS = ['#00d4ff','#ff3dce','#ff7b00','#ffe400','#b400ff','#00ff99','#ff0066','#33ccff'];

  // Particles explode from center dot
  const particles = [];
  const NUM = 200;

  for (let i = 0; i < NUM; i++) {
    const angle  = Math.random() * Math.PI * 2;
    const speed  = 1 + Math.random() * 9;
    const life   = 0.6 + Math.random() * 0.4;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 1 + Math.random() * 3,
      alpha: 1,
      life,
      decay: 1 / (60 * life),
      wave: Math.random() * 0.3,      // wobble amplitude
      waveSpeed: 0.05 + Math.random() * 0.1,
      t: 0,
    });
  }

  // Central dot grows
  let dotRadius = 0;
  let frame = 0;
  let shockRadius = 0;
  let shockAlpha  = 1;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Shock-wave ring
    if (shockAlpha > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,255,${shockAlpha})`;
      ctx.lineWidth   = 3;
      ctx.stroke();
      shockRadius += 14;
      shockAlpha  -= 0.025;
    }

    // Second ring (pink)
    if (frame > 4 && shockAlpha > -0.4) {
      ctx.beginPath();
      ctx.arc(cx, cy, shockRadius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,61,206,${Math.max(0, shockAlpha + 0.2)})`;
      ctx.lineWidth   = 2;
      ctx.stroke();
    }

    // Particles
    let alive = false;
    for (const p of particles) {
      if (p.alpha <= 0) continue;
      alive = true;
      p.t   += p.waveSpeed;
      p.x   += p.vx + Math.sin(p.t) * p.wave;
      p.y   += p.vy + Math.cos(p.t) * p.wave;
      p.vx  *= 0.97;
      p.vy  *= 0.97;
      p.alpha -= p.decay;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2,'0');
      ctx.fill();

      // Glow trail
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color + '18';
      ctx.fill();
    }

    // Central glowing dot fades
    dotRadius = Math.min(dotRadius + 2.5, 60);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, dotRadius);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.3, 'rgba(0,212,255,0.6)');
    grad.addColorStop(1, 'rgba(0,212,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    frame++;

    if (frame < 120) {
      requestAnimationFrame(draw);
    } else {
      // Fade out overlay, show logo briefly, then show app
      logo.classList.add('show');
      setTimeout(() => {
        overlay.style.transition = 'opacity 0.8s ease';
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          document.getElementById('app').classList.remove('hidden');
        }, 800);
      }, 1000);
    }
  }

  draw();
}

/* ============================================================
   6. TIME GREETING
   ============================================================ */
function setGreeting() {
  const h = new Date().getHours();
  if (h < 12)       timeGreeting.textContent = "Morning";
  else if (h < 17)  timeGreeting.textContent = "Afternoon";
  else               timeGreeting.textContent = "Evening";
}

/* ============================================================
   7. RENDER FUNCTIONS
   ============================================================ */

/** Render song cards in the featured / search grid */
function renderCards(songs, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!songs.length) {
    container.innerHTML = '<p class="empty-msg">No songs found.</p>';
    return;
  }
  songs.forEach((song, i) => {
    const card = document.createElement('div');
    card.className = `song-card${state.currentSongIndex !== -1 && state.queue[state.currentSongIndex]?.id === song.id ? ' playing' : ''}`;
    card.style.animationDelay = `${i * 0.04}s`;
    card.innerHTML = `
      <div class="card-art ${song.color}">
        ${song.emoji}
        <div class="card-play-overlay"><i class="fa fa-play"></i></div>
      </div>
      <p class="card-title">${song.title}</p>
      <p class="card-artist">${song.artist}</p>
    `;
    card.addEventListener('click', () => playSong(SONGS.indexOf(song)));
    container.appendChild(card);
  });
}

/** Render song table rows */
function renderTable(songs, tbodyId, showAddBtn = true) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  songs.forEach((song, i) => {
    const isPlaying   = state.currentSongIndex !== -1 && state.queue[state.currentSongIndex]?.id === song.id;
    const inLibrary   = state.library.includes(song.id);
    const tr = document.createElement('tr');
    tr.className = isPlaying ? 'playing' : '';
    tr.innerHTML = `
      <td>${isPlaying ? '<i class="fa fa-volume-high" style="color:var(--pink)"></i>' : i + 1}</td>
      <td>${song.title}</td>
      <td>${song.artist}</td>
      <td>${song.album}</td>
      <td>${song.duration}</td>
      ${showAddBtn ? `<td>
        <button class="row-add-btn ${inLibrary ? 'in-lib' : ''}" data-id="${song.id}">
          ${inLibrary ? '✓ Saved' : '+ Library'}
        </button>
      </td>` : '<td></td>'}
    `;
    tr.addEventListener('click', (e) => {
      if (e.target.classList.contains('row-add-btn')) return;
      state.queue = [...SONGS];
      playSong(SONGS.indexOf(song));
    });
    if (showAddBtn) {
      tr.querySelector('.row-add-btn')?.addEventListener('click', () => toggleLibrary(song.id));
    }
    tbody.appendChild(tr);
  });
}

/** Render sidebar playlist links */
function renderPlaylistSidebar() {
  playlistList.innerHTML = '';
  PLAYLISTS.forEach(pl => {
    const li = document.createElement('li');
    li.textContent = pl.name;
    li.className   = state.currentPlaylistId === pl.id ? 'active' : '';
    li.addEventListener('click', () => {
      state.currentPlaylistId = pl.id;
      switchView('playlist');
      renderPlaylistDetail();
      renderPlaylistSidebar();
    });
    playlistList.appendChild(li);
  });
}

/** Render current playlist in the playlist view */
function renderPlaylistDetail() {
  const container = document.getElementById('playlist-detail');
  const pl = PLAYLISTS.find(p => p.id === state.currentPlaylistId);
  if (!pl) {
    container.innerHTML = '<p class="empty-msg">Select a playlist from the sidebar.</p>';
    return;
  }
  const songs = pl.songIds.map(id => SONGS.find(s => s.id === id)).filter(Boolean);

  container.innerHTML = `
    <div class="pl-header">
      <div class="pl-cover">🎵</div>
      <div class="pl-info">
        <h2>${pl.name}</h2>
        <p>${songs.length} song${songs.length !== 1 ? 's' : ''}</p>
        <div class="pl-actions">
          <button class="btn-play-pl" id="btn-play-pl">▶ Play All</button>
        </div>
      </div>
    </div>
    <div class="song-list-container">
      <table class="song-table">
        <thead><tr><th>#</th><th>Title</th><th>Artist</th><th>Album</th><th></th><th></th></tr></thead>
        <tbody id="pl-table-body"></tbody>
      </table>
    </div>
  `;

  // Play all
  document.getElementById('btn-play-pl').addEventListener('click', () => {
    if (!songs.length) return;
    state.queue = songs;
    playSong(0);
  });

  // Render rows with remove option
  const tbody = document.getElementById('pl-table-body');
  songs.forEach((song, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${song.title}</td>
      <td>${song.artist}</td>
      <td>${song.album}</td>
      <td>${song.duration}</td>
      <td><button class="row-add-btn" data-id="${song.id}" title="Remove">✕ Remove</button></td>
    `;
    tr.addEventListener('click', (e) => {
      if (e.target.classList.contains('row-add-btn')) return;
      state.queue = songs;
      playSong(i);
    });
    tr.querySelector('.row-add-btn').addEventListener('click', () => {
      pl.songIds = pl.songIds.filter(id => id !== song.id);
      saveState();
      renderPlaylistDetail();
    });
    tbody.appendChild(tr);
  });
}

/* ============================================================
   8. PLAYBACK FUNCTIONS
   ============================================================ */

/** Play a song by its index in state.queue */
function playSong(index) {
  if (index < 0 || index >= state.queue.length) return;

  state.currentSongIndex = index;
  const song = state.queue[index];

  // Update audio element
  audio.src = song.src;
  audio.volume = parseFloat(volumeSlider.value);
  audio.play().catch(() => {
    // If file isn't found, show demo mode
    simulatePlayback(song);
  });

  state.isPlaying = true;
  updatePlayerUI(song);
  updatePlayPauseBtn();
  refreshAllLists();
  saveState();
}

/** Visual playback simulation when no actual MP3 exists */
function simulatePlayback(song) {
  console.info(`[Demo] Playing: ${song.title} — add MP3 files to /songs/ folder`);
  // Simulate time advancing for demo
  let fakeDuration = parseDuration(song.duration);
  let fakeTime     = 0;
  clearInterval(window._demoInterval);
  window._demoInterval = setInterval(() => {
    fakeTime += 0.2;
    if (fakeTime >= fakeDuration) {
      clearInterval(window._demoInterval);
      onSongEnd();
      return;
    }
    updateProgress(fakeTime, fakeDuration);
  }, 200);
}

function parseDuration(str) {
  const [m, s] = str.split(':').map(Number);
  return m * 60 + s;
}

/** Toggle play / pause */
function togglePlay() {
  if (state.currentSongIndex === -1) {
    playSong(0);
    return;
  }
  if (state.isPlaying) {
    audio.pause();
    clearInterval(window._demoInterval);
    state.isPlaying = false;
  } else {
    audio.play().catch(() => simulatePlayback(state.queue[state.currentSongIndex]));
    state.isPlaying = true;
  }
  updatePlayPauseBtn();
  playerBar.classList.toggle('is-playing', state.isPlaying);
}

/** Play previous song */
function playPrev() {
  if (state.currentSongIndex <= 0) return;
  playSong(state.currentSongIndex - 1);
}

/** Play next song (respects shuffle & repeat) */
function playNext() {
  const len = state.queue.length;
  if (state.repeatMode === 2) {
    // Repeat one
    playSong(state.currentSongIndex);
    return;
  }
  let next;
  if (state.isShuffle) {
    next = Math.floor(Math.random() * len);
  } else {
    next = state.currentSongIndex + 1;
  }
  if (next >= len) {
    if (state.repeatMode === 1) next = 0;
    else { state.isPlaying = false; updatePlayPauseBtn(); return; }
  }
  playSong(next);
}

/** Called when audio ends naturally */
function onSongEnd() {
  playNext();
}

/* ============================================================
   9. UI UPDATE HELPERS
   ============================================================ */

function updatePlayerUI(song) {
  playerTitle.textContent  = song.title;
  playerArtist.textContent = song.artist;
  coverArtEl.textContent   = song.emoji;
  coverArtEl.style.background = `linear-gradient(135deg, var(--bg3), var(--bg2))`;
  totalTimeEl.textContent  = song.duration;
  playerBar.classList.add('is-playing');

  // Like button state
  likeBtn.classList.toggle('liked', state.library.includes(song.id));

  // Update document title
  document.title = `${song.title} • Resplendor`;
}

function updatePlayPauseBtn() {
  playIcon.className = state.isPlaying ? 'fa fa-pause' : 'fa fa-play';
}

function updateProgress(current, total) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  progressFill.style.width = pct + '%';
  progressThumb.style.left = pct + '%';
  currentTimeEl.textContent = formatTime(current);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}

/** Re-render all song lists to update highlight states */
function refreshAllLists() {
  renderCards(SONGS.slice(0, 6), 'featured-grid');
  renderTable(SONGS, 'song-table-body', true);
  renderTable(state.library.map(id => SONGS.find(s => s.id === id)).filter(Boolean), 'library-table-body', false);
  if (state.currentPlaylistId) renderPlaylistDetail();
}

/* ============================================================
   10. LIBRARY (liked songs)
   ============================================================ */

function toggleLibrary(songId) {
  const idx = state.library.indexOf(songId);
  if (idx === -1) {
    state.library.push(songId);
  } else {
    state.library.splice(idx, 1);
  }
  // Update like button if this is the current song
  if (state.currentSongIndex !== -1) {
    const cur = state.queue[state.currentSongIndex];
    if (cur && cur.id === songId) {
      likeBtn.classList.toggle('liked', state.library.includes(songId));
    }
  }
  saveState();
  refreshAllLists();
}

/* ============================================================
   11. VIEW SWITCHING
   ============================================================ */

function switchView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById('view-' + viewName)?.classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

  if (viewName === 'library') {
    renderTable(
      state.library.map(id => SONGS.find(s => s.id === id)).filter(Boolean),
      'library-table-body',
      false
    );
  }
  if (viewName === 'playlist') {
    renderPlaylistDetail();
  }

  // Close sidebar on mobile
  sidebar.classList.remove('open');
}

/* ============================================================
   12. SEARCH
   ============================================================ */

function handleSearch(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    document.getElementById('search-results-grid').innerHTML = '<p class="empty-msg">Type something to search…</p>';
    return;
  }
  const results = SONGS.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.album.toLowerCase().includes(q) ||
    s.genre.toLowerCase().includes(q)
  );
  renderCards(results, 'search-results-grid');
}

/* ============================================================
   13. PLAYLIST CREATION
   ============================================================ */

function createNewPlaylist() {
  const name = prompt('Name your new playlist:');
  if (!name || !name.trim()) return;
  const pl = { id: 'pl' + Date.now(), name: name.trim(), songIds: [] };
  PLAYLISTS.push(pl);
  state.currentPlaylistId = pl.id;
  renderPlaylistSidebar();
  switchView('playlist');
  saveState();
}

/* ============================================================
   14. PERSIST STATE (localStorage)
   ============================================================ */

function saveState() {
  try {
    localStorage.setItem('resplendor_library',   JSON.stringify(state.library));
    localStorage.setItem('resplendor_playlists', JSON.stringify(PLAYLISTS));
    if (state.currentSongIndex !== -1 && state.queue[state.currentSongIndex]) {
      localStorage.setItem('resplendor_lastSong', JSON.stringify(state.queue[state.currentSongIndex].id));
    }
  } catch(e) { /* localStorage not available */ }
}

function loadState() {
  try {
    const lib = localStorage.getItem('resplendor_library');
    if (lib) state.library = JSON.parse(lib);

    const pls = localStorage.getItem('resplendor_playlists');
    if (pls) PLAYLISTS = JSON.parse(pls);

    const lastId = localStorage.getItem('resplendor_lastSong');
    if (lastId) {
      const id  = JSON.parse(lastId);
      const idx = SONGS.findIndex(s => s.id === id);
      if (idx !== -1) {
        state.currentSongIndex = idx;
        state.queue = [...SONGS];
        updatePlayerUI(SONGS[idx]);
        // Don't auto-play; just restore UI
      }
    }
  } catch(e) { /* ignore */ }
}

/* ============================================================
   15. PROGRESS BAR SEEKING
   ============================================================ */

progressTrack.addEventListener('click', (e) => {
  const rect = progressTrack.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  if (audio.duration) {
    audio.currentTime = pct * audio.duration;
  }
  // For demo mode, update visually
  progressFill.style.width  = (pct * 100) + '%';
  progressThumb.style.left  = (pct * 100) + '%';
});

/* ============================================================
   16. AUDIO EVENT LISTENERS
   ============================================================ */

audio.addEventListener('timeupdate', () => {
  updateProgress(audio.currentTime, audio.duration);
});

audio.addEventListener('ended', onSongEnd);

audio.addEventListener('loadedmetadata', () => {
  totalTimeEl.textContent = formatTime(audio.duration);
});

/* ============================================================
   17. CONTROL BUTTON LISTENERS
   ============================================================ */

btnPlay.addEventListener('click', togglePlay);
btnPrev.addEventListener('click', playPrev);
btnNext.addEventListener('click', playNext);

btnShuffle.addEventListener('click', () => {
  state.isShuffle = !state.isShuffle;
  btnShuffle.classList.toggle('active', state.isShuffle);
});

btnRepeat.addEventListener('click', () => {
  state.repeatMode = (state.repeatMode + 1) % 3;
  const icons = ['fa-repeat', 'fa-repeat', 'fa-1'];
  btnRepeat.querySelector('i').className = `fa ${icons[state.repeatMode]}`;
  btnRepeat.classList.toggle('active', state.repeatMode > 0);
  btnRepeat.style.color = state.repeatMode === 2 ? 'var(--orange)' : '';
});

volumeSlider.addEventListener('input', () => {
  audio.volume = parseFloat(volumeSlider.value);
});

likeBtn.addEventListener('click', () => {
  if (state.currentSongIndex === -1) return;
  toggleLibrary(state.queue[state.currentSongIndex].id);
});

/* ============================================================
   18. NAV & SEARCH LISTENERS
   ============================================================ */

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(item.dataset.view);
  });
});

searchInput.addEventListener('input', (e) => {
  const q = e.target.value;
  handleSearch(q);
  if (q.trim()) switchView('search');
  else switchView('home');
});

btnNewPlaylist.addEventListener('click', createNewPlaylist);

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// Back/Forward nav buttons (basic history)
document.getElementById('btn-back').addEventListener('click', () => history.back());
document.getElementById('btn-fwd').addEventListener('click', () => history.forward());

/* ============================================================
   19. KEYBOARD SHORTCUTS
   ============================================================ */
document.addEventListener('keydown', (e) => {
  // Don't trigger if typing in search
  if (e.target.tagName === 'INPUT') return;

  switch (e.code) {
    case 'Space':        e.preventDefault(); togglePlay(); break;
    case 'ArrowRight':   e.preventDefault(); playNext();   break;
    case 'ArrowLeft':    e.preventDefault(); playPrev();   break;
    case 'KeyM':
      audio.muted = !audio.muted;
      volumeSlider.value = audio.muted ? 0 : 0.8;
      break;
  }
});

/* ============================================================
   20. INIT
   ============================================================ */

function init() {
  // Load persisted state
  loadState();

  // Set greeting
  setGreeting();

  // Initial renders
  renderCards(SONGS.slice(0, 6), 'featured-grid');
  renderTable(SONGS, 'song-table-body', true);
  renderPlaylistSidebar();

  // Run intro blast
  runIntro();
}

// Start the app
init();

/* ============================================================
   BACKEND INTEGRATION NOTES
   ============================================================

   For a production app with Node.js + Express:

   1. STREAMING SONGS:
   ─────────────────
   // server.js
   const express = require('express');
   const app     = express();
   const path    = require('path');
   const fs      = require('fs');

   app.get('/stream/:filename', (req, res) => {
     const filePath = path.join(__dirname, 'songs', req.params.filename);
     const stat     = fs.statSync(filePath);
     const range    = req.headers.range;

     if (range) {
       const [start, end] = range.replace('bytes=','').split('-').map(Number);
       const chunkSize = (end || stat.size - 1) - start + 1;
       res.writeHead(206, {
         'Content-Range': `bytes ${start}-${end||stat.size-1}/${stat.size}`,
         'Accept-Ranges': 'bytes',
         'Content-Length': chunkSize,
         'Content-Type': 'audio/mpeg',
       });
       fs.createReadStream(filePath, { start, end }).pipe(res);
     } else {
       res.writeHead(200, { 'Content-Length': stat.size, 'Content-Type': 'audio/mpeg' });
       fs.createReadStream(filePath).pipe(res);
     }
   });
   app.listen(3000);

   Then in script.js, set: src: '/stream/your-song.mp3'

   2. SONG METADATA (JSON):
   ───────────────────────
   // songs.json
   [
     { "id": 1, "title": "Neon Drift", "artist": "...", "file": "neon-drift.mp3" }
   ]
   // Fetch with: const songs = await fetch('/api/songs').then(r => r.json());

   3. DATABASE (SQLite / PostgreSQL):
   ─────────────────────────────────
   CREATE TABLE songs (
     id INTEGER PRIMARY KEY,
     title TEXT, artist TEXT,
     album TEXT, duration TEXT,
     filename TEXT, genre TEXT
   );
   // Use with Prisma ORM or better-sqlite3 for Node.js

   ============================================================ */
