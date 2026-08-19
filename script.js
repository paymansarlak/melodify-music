/* ================================================================
   MELODIFY — APPLICATION LOGIC
   Vanilla JS only. Organized as a single app object to avoid
   polluting the global namespace with loose variables.
   ================================================================ */

/* ============================================================
   1. MUSIC LIBRARY
   Replace `src` / `cover` with your own files inside
   / and /. Keep the same field names.
   ============================================================ */
const songs = [
  { id: 1, title: "بارون بهاری",     artist: "آرمان کیا",     album: "فصل‌ها",     genre: "پاپ",     duration: 10, src: "baroon-bahari.mp3",   cover: "baroon-bahari.jpg" },
  { id: 2, title: "شب آرام",         artist: "نگار رستمی",    album: "سکوت",       genre: "آرام",    duration: 10, src: "shabe-aram.mp3",       cover: "shabe-aram.jpg" },
  { id: 3, title: "رویای دور",       artist: "سینا مهر",      album: "افق",        genre: "امبینت",  duration: 10, src: "roya-ye-dour.mp3",     cover: "roya-ye-dour.jpg" },
  { id: 4, title: "لحظه‌های ساده",   artist: "پرنیا",         album: "روزمرگی",    genre: "آکوستیک", duration: 7, src: "lahzehaye-sadeh.mp3",  cover: "lahzehaye-sadeh.jpg" },
  { id: 5, title: "آسمون آبی",       artist: "کیوان طاها",    album: "پرواز",      genre: "پاپ",     duration: 5, src: "aseman-abi.mp3",       cover: "aseman-abi.jpg" },
  { id: 6, title: "خاطره‌ها",        artist: "نگار رستمی",    album: "سکوت",       genre: "آرام",    duration: 14, src: "khaterehha.mp3",       cover: "khaterehha.jpg" },
  { id: 7, title: "جاده‌ی نور",      artist: "آرمان کیا",     album: "فصل‌ها",     genre: "پاپ",     duration: 6, src: "jade-ye-nour.mp3",     cover: "jade-ye-nour.jpg" },
  { id: 8, title: "نسیم شرقی",       artist: "سینا مهر",      album: "افق",        genre: "امبینت",  duration: 7, src: "nasime-sharghi.mp3",   cover: "nasime-sharghi.jpg" },
  { id: 9, title: "ستاره‌ی من",      artist: "پرنیا",         album: "روزمرگی",    genre: "آکوستیک", duration: 9, src: "setareh-ye-man.mp3",   cover: "setareh-ye-man.jpg" },
  { id:10, title: "پاییز عاشق",      artist: "کیوان طاها",    album: "پرواز",      genre: "پاپ",     duration: 11, src: "paeez-ashegh.mp3",     cover: "paeez-ashegh.jpg" }
];

const DEFAULT_COVER =
  "data:image/svg+xml;utf8," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" fill="#242025"/>' +
    '<circle cx="50" cy="50" r="18" fill="none" stroke="#c98a3e" stroke-width="3"/>' +
    '<circle cx="50" cy="50" r="4" fill="#c98a3e"/></svg>'
  );

const STORAGE_KEYS = {
  favorites: "melodify_favorites",
  recent: "melodify_recent",
  theme: "melodify_theme",
  playback: "melodify_playback"
};

/* ============================================================
   2. APP STATE
   ============================================================ */
const state = {
  queue: songs,          // the list currently driving next/prev (changes with search/filter context)
  currentIndex: 0,
  isPlaying: false,
  isShuffle: false,
  repeatMode: "all",      // "off" | "all" | "one"
  favorites: loadJSON(STORAGE_KEYS.favorites, []),
  recent: loadJSON(STORAGE_KEYS.recent, []),
  shuffleHistory: [],
  activeView: "home"
};

function loadJSON(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveJSON(key, value){
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

/* ============================================================
   3. DOM REFERENCES
   ============================================================ */
const audio = document.getElementById('audio');

const searchInput   = document.getElementById('search-input');
const searchClear   = document.getElementById('search-clear');
const searchQueryLabel = document.getElementById('search-query-label');

const themeBtn   = document.getElementById('theme-btn');
const menuBtn    = document.getElementById('menu-btn');
const sidebar    = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarCloseBtn = document.getElementById('sidebar-close');

const playBtn    = document.getElementById('play-btn');
const playIcon   = document.getElementById('play-icon');
const pauseIcon  = document.getElementById('pause-icon');
const prevBtn    = document.getElementById('prev-btn');
const nextBtn    = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn  = document.getElementById('repeat-btn');
const repeatIconAll = document.getElementById('repeat-icon-all');
const repeatIconOne = document.getElementById('repeat-icon-one');
const repeatDot  = document.getElementById('repeat-dot');

const progressBar    = document.getElementById('progress-bar');
const currentTimeEl  = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');

const volumeBar  = document.getElementById('volume-bar');
const muteBtn    = document.getElementById('mute-btn');
const volIcon    = document.getElementById('vol-icon');
const muteIcon   = document.getElementById('mute-icon');

const playerCover  = document.getElementById('player-cover');
const playerTitle  = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerFavBtn = document.getElementById('player-fav-btn');
const playerError  = document.getElementById('player-error');

const rowTemplate = document.getElementById('track-row-template');

const views = {
  home: document.getElementById('view-home'),
  search: document.getElementById('view-search'),
  discover: document.getElementById('view-discover'),
  favorites: document.getElementById('view-favorites'),
  recent: document.getElementById('view-recent')
};

let lastVolume = 0.8;

/* ============================================================
   4. HELPERS
   ============================================================ */
function formatTime(seconds){
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}
function findSongIndex(id){ return songs.findIndex(s => s.id === id); }
function isFavorite(id){ return state.favorites.includes(id); }

/* ============================================================
   5. RENDERING — reusable track row builder
   ============================================================ */
function buildTrackRow(song, index, { showIndex = false } = {}){
  const node = rowTemplate.content.firstElementChild.cloneNode(true);
  node.dataset.id = song.id;

  const idxEl = node.querySelector('.track-row-index');
  idxEl.textContent = showIndex ? (index + 1) : '';
  idxEl.style.visibility = showIndex ? 'visible' : 'hidden';

  const coverEl = node.querySelector('.track-row-cover');
  coverEl.src = song.cover;
  coverEl.alt = song.title;
  coverEl.onerror = () => { coverEl.src = DEFAULT_COVER; };

  node.querySelector('.track-row-title').textContent = song.title;
  node.querySelector('.track-row-artist').textContent = song.artist;
  node.querySelector('.track-row-duration').textContent = formatTime(song.duration);

  const favBtn = node.querySelector('.track-row-fav');
  favBtn.classList.toggle('is-active', isFavorite(song.id));
  favBtn.setAttribute('aria-pressed', String(isFavorite(song.id)));
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(song.id);
  });

  if (songs[state.currentIndex] && songs[state.currentIndex].id === song.id && state.isPlaying){
    node.classList.add('playing');
  }

  const activate = () => playFromLibrary(song.id);
  node.addEventListener('click', activate);
  node.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); activate(); }
  });

  return node;
}

function renderList(container, songList, opts){
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  songList.forEach((song, i) => frag.appendChild(buildTrackRow(song, i, opts)));
  container.appendChild(frag);
}

function refreshPlayingHighlight(){
  document.querySelectorAll('.track-row').forEach(row => {
    const id = Number(row.dataset.id);
    const isCurrent = songs[state.currentIndex] && songs[state.currentIndex].id === id;
    row.classList.toggle('playing', Boolean(isCurrent && state.isPlaying));
  });
}

/* ============================================================
   6. HOME / DISCOVER RENDER
   ============================================================ */
function renderHome(){
  const recentSongs = state.recent
    .map(id => songs.find(s => s.id === id))
    .filter(Boolean)
    .slice(0, 5);

  const recentContainer = document.getElementById('home-recent-list');
  const recentBlock = recentContainer.closest('.section-block');
  if (recentSongs.length === 0){
    recentBlock.style.display = 'none';
  } else {
    recentBlock.style.display = '';
    renderList(recentContainer, recentSongs, {});
  }

  renderList(document.getElementById('home-all-list'), songs, { showIndex:true });
  document.getElementById('all-count').textContent = `${songs.length} آهنگ`;
}

function renderDiscover(){
  const groups = {};
  songs.forEach(s => { (groups[s.genre] ||= []).push(s); });

  const container = document.getElementById('genre-groups');
  container.innerHTML = '';
  Object.entries(groups).forEach(([genre, list]) => {
    const wrap = document.createElement('div');
    wrap.className = 'genre-group';
    const h3 = document.createElement('h3');
    h3.textContent = genre;
    wrap.appendChild(h3);
    const ul = document.createElement('ul');
    ul.className = 'track-row-list';
    renderList(ul, list, {});
    wrap.appendChild(ul);
    container.appendChild(wrap);
  });
}

function renderFavorites(){
  const list = state.favorites.map(id => songs.find(s => s.id === id)).filter(Boolean);
  document.getElementById('favorites-empty').hidden = list.length > 0;
  renderList(document.getElementById('favorites-list'), list, {});
}

function renderRecent(){
  const list = state.recent.map(id => songs.find(s => s.id === id)).filter(Boolean);
  document.getElementById('recent-empty').hidden = list.length > 0;
  renderList(document.getElementById('recent-list'), list, {});
}

function renderSearch(query){
  const q = query.trim().toLowerCase();
  const results = songs.filter(s =>
    s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
  );
  searchQueryLabel.textContent = query;
  document.getElementById('search-empty').hidden = results.length > 0;
  renderList(document.getElementById('search-results-list'), results, {});
  state.queue = results.length ? results : songs;
}

/* ============================================================
   7. NAVIGATION (single-page view switching)
   ============================================================ */
function showView(name){
  state.activeView = name;
  Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === name);
  });
  if (name === 'home') renderHome();
  if (name === 'discover') renderDiscover();
  if (name === 'favorites') renderFavorites();
  if (name === 'recent') renderRecent();
  closeSidebar();
  window.scrollTo({ top:0, behavior:'smooth' });
}

document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const target = el.dataset.nav;
    if (target === 'home') { searchInput.value=''; searchClear.hidden = true; }
    showView(target === 'home' && el.tagName === 'A' ? 'home' : target);
  });
});

function openSidebar(){
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('show');
  menuBtn.setAttribute('aria-expanded', 'true');
}
function closeSidebar(){
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
  menuBtn.setAttribute('aria-expanded', 'false');
}
menuBtn.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});
sidebarOverlay.addEventListener('click', closeSidebar);
sidebarCloseBtn.addEventListener('click', closeSidebar);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
});

/* ============================================================
   8. SEARCH
   ============================================================ */
let searchDebounce = null;
searchInput.addEventListener('input', () => {
  const value = searchInput.value;
  searchClear.hidden = value.length === 0;
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    if (value.trim() === ''){
      if (state.activeView === 'search') showView('home');
      return;
    }
    if (state.activeView !== 'search') showView('search');
    renderSearch(value);
  }, 120); // instant-feeling but avoids re-render on every single keystroke burst
});
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.hidden = true;
  showView('home');
  searchInput.focus();
});

/* ============================================================
   9. FAVORITES (localStorage)
   ============================================================ */
function toggleFavorite(id){
  const idx = state.favorites.indexOf(id);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push(id);
  saveJSON(STORAGE_KEYS.favorites, state.favorites);

  // Sync every visible favorite icon for this song (row + player bar)
  document.querySelectorAll(`.track-row[data-id="${id}"] .track-row-fav`).forEach(btn => {
    btn.classList.toggle('is-active', isFavorite(id));
    btn.setAttribute('aria-pressed', String(isFavorite(id)));
  });
  if (songs[state.currentIndex] && songs[state.currentIndex].id === id){
    playerFavBtn.classList.toggle('is-active', isFavorite(id));
    playerFavBtn.setAttribute('aria-pressed', String(isFavorite(id)));
  }
  if (state.activeView === 'favorites') renderFavorites();
}
playerFavBtn.addEventListener('click', () => {
  const song = songs[state.currentIndex];
  if (song) toggleFavorite(song.id);
});

/* ============================================================
   10. RECENTLY PLAYED (localStorage, de-duplicated, newest first)
   ============================================================ */
function pushRecent(id){
  state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, 20);
  saveJSON(STORAGE_KEYS.recent, state.recent);
  if (state.activeView === 'recent') renderRecent();
}

/* ============================================================
   11. THEME (localStorage, smooth transition via CSS)
   ============================================================ */
function applyTheme(theme){
  document.body.dataset.theme = theme;
  document.getElementById('theme-icon-dark').style.display = theme === 'dark' ? '' : 'none';
  document.getElementById('theme-icon-light').style.display = theme === 'light' ? '' : 'none';
  saveJSON(STORAGE_KEYS.theme, theme);
}
themeBtn.addEventListener('click', () => {
  applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   12. CORE PLAYBACK ENGINE
   ============================================================ */
function loadSong(index, { autoplay = false, fromQueue = null } = {}){
  const list = fromQueue || songs;
  const song = list[index];
  if (!song) return;

  state.currentIndex = findSongIndex(song.id);

  audio.src = song.src;
  playerTitle.textContent = song.title;
  playerArtist.textContent = song.artist;
  playerCover.src = song.cover;
  playerCover.onerror = () => { playerCover.src = DEFAULT_COVER; };
  playerFavBtn.classList.toggle('is-active', isFavorite(song.id));
  playerFavBtn.setAttribute('aria-pressed', String(isFavorite(song.id)));
  playerError.hidden = true;

  progressBar.value = 0;
  progressBar.style.setProperty('--fill', '0%');
  currentTimeEl.textContent = "0:00";
  durationTimeEl.textContent = "0:00";

  savePlaybackState();
  refreshPlayingHighlight();

  if (autoplay) playSong(); else pauseVisualState();
}

/* Called from any track row / search result / favorites / recent list */
function playFromLibrary(id){
  const index = findSongIndex(id);
  if (index === -1) return;
  loadSong(index, { autoplay: true });
}

function playSong(){
  const p = audio.play();
  if (p !== undefined){
    p.then(() => {
      state.isPlaying = true;
      setPlayingVisualState();
      pushRecent(songs[state.currentIndex].id);
    }).catch(() => {
      // Autoplay blocked or file missing — stay paused, no crash.
      state.isPlaying = false;
      pauseVisualState();
    });
  } else {
    state.isPlaying = true;
    setPlayingVisualState();
  }
}
function pauseSong(){
  audio.pause();
  state.isPlaying = false;
  pauseVisualState();
}
function togglePlay(){
  if (!audio.src) { loadSong(0, { autoplay:true }); return; }
  state.isPlaying ? pauseSong() : playSong();
}
function setPlayingVisualState(){
  playIcon.style.display = 'none';
  pauseIcon.style.display = '';
  playBtn.setAttribute('aria-label', 'توقف پخش');
  refreshPlayingHighlight();
}
function pauseVisualState(){
  playIcon.style.display = '';
  pauseIcon.style.display = 'none';
  playBtn.setAttribute('aria-label', 'پخش');
  refreshPlayingHighlight();
}

function getActiveQueue(){
  // Use search results as the queue while the user is browsing search, otherwise full library.
  return state.activeView === 'search' && state.queue.length ? state.queue : songs;
}

function getNextIndex(){
  const queue = getActiveQueue();
  const currentId = songs[state.currentIndex].id;
  const posInQueue = queue.findIndex(s => s.id === currentId);

  if (state.isShuffle){
    if (state.shuffleHistory.length >= queue.length) state.shuffleHistory = [];
    let candidates = queue.map(s => s.id).filter(id => !state.shuffleHistory.includes(id) && id !== currentId);
    if (candidates.length === 0) candidates = queue.map(s => s.id).filter(id => id !== currentId);
    const nextId = candidates[Math.floor(Math.random() * candidates.length)] ?? currentId;
    state.shuffleHistory.push(nextId);
    return findSongIndex(nextId);
  }
  const nextPos = (posInQueue + 1) % queue.length;
  return findSongIndex(queue[nextPos].id);
}
function getPrevIndex(){
  const queue = getActiveQueue();
  const currentId = songs[state.currentIndex].id;
  const posInQueue = queue.findIndex(s => s.id === currentId);
  if (state.isShuffle) return getNextIndex();
  const prevPos = (posInQueue - 1 + queue.length) % queue.length;
  return findSongIndex(queue[prevPos].id);
}
function nextSong(){ loadSong(getNextIndex(), { autoplay:true }); }
function prevSong(){ loadSong(getPrevIndex(), { autoplay:true }); }

playBtn.addEventListener('click', togglePlay);
nextBtn.addEventListener('click', nextSong);
prevBtn.addEventListener('click', prevSong);

/* ---- progress / seek ---- */
audio.addEventListener('loadedmetadata', () => {
  durationTimeEl.textContent = formatTime(audio.duration);
});
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressBar.value = pct;
  progressBar.style.setProperty('--fill', pct + '%');
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
progressBar.addEventListener('input', () => {
  if (!audio.duration) return;
  const pct = progressBar.value;
  progressBar.style.setProperty('--fill', pct + '%');
  audio.currentTime = (pct / 100) * audio.duration;
});

/* ---- volume / mute ---- */
function setVolumeIcon(){
  const muted = audio.muted || audio.volume === 0;
  volIcon.style.display = muted ? 'none' : '';
  muteIcon.style.display = muted ? '' : 'none';
}
audio.volume = 0.8;
volumeBar.addEventListener('input', () => {
  const v = volumeBar.value / 100;
  audio.volume = v;
  audio.muted = false;
  if (v > 0) lastVolume = v;
  setVolumeIcon();
});
muteBtn.addEventListener('click', () => {
  if (audio.muted || audio.volume === 0){
    audio.muted = false;
    audio.volume = lastVolume || 0.8;
    volumeBar.value = audio.volume * 100;
  } else {
    lastVolume = audio.volume;
    audio.muted = true;
  }
  setVolumeIcon();
});

/* ---- shuffle / repeat ---- */
shuffleBtn.addEventListener('click', () => {
  state.isShuffle = !state.isShuffle;
  state.shuffleHistory = [];
  shuffleBtn.classList.toggle('is-active', state.isShuffle);
  shuffleBtn.setAttribute('aria-pressed', String(state.isShuffle));
});
const repeatCycle = ["all", "one", "off"];
repeatBtn.addEventListener('click', () => {
  const idx = repeatCycle.indexOf(state.repeatMode);
  state.repeatMode = repeatCycle[(idx + 1) % repeatCycle.length];
  updateRepeatUI();
});
function updateRepeatUI(){
  const isOn = state.repeatMode !== "off";
  repeatBtn.classList.toggle('is-active', isOn);
  repeatBtn.setAttribute('aria-pressed', String(isOn));
  repeatIconOne.style.display = state.repeatMode === "one" ? '' : 'none';
  repeatIconAll.style.display = state.repeatMode === "one" ? 'none' : '';
  repeatDot.hidden = state.repeatMode === "off";
  repeatBtn.title = state.repeatMode === "off" ? "Repeat: off" : state.repeatMode === "one" ? "Repeat: one" : "Repeat: all";
}

/* ---- song end → auto-advance ---- */
audio.addEventListener('ended', () => {
  if (state.repeatMode === "one"){
    audio.currentTime = 0;
    playSong();
  } else if (state.repeatMode === "off"){
    const queue = getActiveQueue();
    const posInQueue = queue.findIndex(s => s.id === songs[state.currentIndex].id);
    if (posInQueue === queue.length - 1){
      pauseSong(); // reached end of queue, repeat is off — stop instead of looping
    } else {
      nextSong();
    }
  } else {
    nextSong(); // repeat "all" — wraps to first automatically
  }
});

/* ---- error handling (missing / broken audio files) ---- */
audio.addEventListener('error', () => {
  playerError.hidden = false;
  pauseSong();
});

/* ============================================================
   13. CONTINUE PLAYBACK (resume song + position across visits)
   ============================================================ */
function savePlaybackState(){
  const song = songs[state.currentIndex];
  if (!song) return;
  saveJSON(STORAGE_KEYS.playback, { id: song.id, time: audio.currentTime || 0 });
}
audio.addEventListener('pause', savePlaybackState);
window.addEventListener('beforeunload', savePlaybackState);

function restorePlaybackState(){
  const saved = loadJSON(STORAGE_KEYS.playback, null);
  if (!saved) { loadSong(0); return; }
  const index = findSongIndex(saved.id);
  if (index === -1) { loadSong(0); return; }
  loadSong(index);
  audio.addEventListener('loadedmetadata', function onceReady(){
    audio.currentTime = Math.min(saved.time || 0, audio.duration || 0);
    audio.removeEventListener('loadedmetadata', onceReady);
  });
}

/* ============================================================
   14. KEYBOARD SHORTCUTS
   ============================================================ */
document.addEventListener('keydown', (e) => {
  const typingInInput = document.activeElement === searchInput;
  if (typingInInput) return; // never hijack typing

  switch (e.key){
    case ' ':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      if (audio.duration) audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
      break;
    case 'ArrowLeft':
      if (audio.duration) audio.currentTime = Math.max(audio.currentTime - 5, 0);
      break;
    case 'ArrowUp':
      e.preventDefault();
      audio.volume = Math.min(audio.volume + 0.1, 1);
      audio.muted = false;
      volumeBar.value = audio.volume * 100;
      setVolumeIcon();
      break;
    case 'ArrowDown':
      e.preventDefault();
      audio.volume = Math.max(audio.volume - 0.1, 0);
      volumeBar.value = audio.volume * 100;
      setVolumeIcon();
      break;
    case 'n': case 'N': nextSong(); break;
    case 'p': case 'P': prevSong(); break;
  }
});

/* ============================================================
   15. INIT
   ============================================================ */
(function init(){
  applyTheme(loadJSON(STORAGE_KEYS.theme, 'dark'));
  updateRepeatUI();
  setVolumeIcon();
  renderHome();
  restorePlaybackState();
})();
