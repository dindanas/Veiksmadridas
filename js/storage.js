// Veiksmadridas - Local Storage Manager
const Storage = (() => {
  const KEYS = {
    SETTINGS: 'vd_settings',
    CARDS: 'vd_cards',
    LESSONS: 'vd_lessons',
    REVIEW_LOG: 'vd_review_log',
    SESSION: 'vd_session',
  };

  const DEFAULTS = {
    theme: 'dark',
    dailyNewCardLimit: 10,
    dailyReviewGoal: 20,
    difficulty: 'auto',
    showVosotros: true,
    onboardingComplete: false,
  };

  function load(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error('Storage write failed:', e); }
  }

  function getSettings() {
    return { ...DEFAULTS, ...(load(KEYS.SETTINGS) || {}) };
  }

  function updateSettings(partial) {
    save(KEYS.SETTINGS, { ...getSettings(), ...partial });
  }

  function getAllCards() { return load(KEYS.CARDS) || {}; }

  function getCard(cardId) {
    return getAllCards()[cardId] || null;
  }

  function upsertCard(cardId, updates) {
    const cards = getAllCards();
    cards[cardId] = { ...(cards[cardId] || {}), ...updates, cardId };
    save(KEYS.CARDS, cards);
  }

  function initCard(cardId) {
    const [infinitive, mood, tense, form] = cardId.split('||');
    const card = {
      cardId, infinitive, mood, tense, form,
      repetitions: 0, easeFactor: 2.5, interval: 0,
      nextReviewAt: Date.now(), lastReviewedAt: null,
      totalCorrect: 0, totalAttempts: 0,
    };
    upsertCard(cardId, card);
    return card;
  }

  function getAllLessons() { return load(KEYS.LESSONS) || {}; }

  function getLessonStatus(lessonId) {
    return getAllLessons()[lessonId] || null;
  }

  function updateLesson(lessonId, updates) {
    const lessons = getAllLessons();
    lessons[lessonId] = { ...(lessons[lessonId] || {}), ...updates, lessonId };
    save(KEYS.LESSONS, lessons);
  }

  function getReviewLog() { return load(KEYS.REVIEW_LOG) || []; }

  function appendReview(event) {
    const log = getReviewLog();
    log.push(event);
    if (log.length > 10000) log.splice(0, log.length - 10000);
    save(KEYS.REVIEW_LOG, log);
  }

  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getReviewsForDate(dateStr) {
    return getReviewLog().filter(r => formatDate(new Date(r.timestamp)) === dateStr);
  }

  function getSession() { return load(KEYS.SESSION); }
  function saveSession(s) { save(KEYS.SESSION, s); }
  function clearSession() { localStorage.removeItem(KEYS.SESSION); }

  function exportAll() {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: load(KEYS.SETTINGS),
      cards: load(KEYS.CARDS),
      lessons: load(KEYS.LESSONS),
      reviewLog: load(KEYS.REVIEW_LOG),
    }, null, 2);
  }

  function importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (!data.version) throw new Error('Invalid backup');
    if (data.settings) save(KEYS.SETTINGS, data.settings);
    if (data.cards) save(KEYS.CARDS, data.cards);
    if (data.lessons) save(KEYS.LESSONS, data.lessons);
    if (data.reviewLog) save(KEYS.REVIEW_LOG, data.reviewLog);
  }

  function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  return {
    getSettings, updateSettings,
    getAllCards, getCard, upsertCard, initCard,
    getAllLessons, getLessonStatus, updateLesson,
    getReviewLog, appendReview, formatDate, getReviewsForDate,
    getSession, saveSession, clearSession,
    exportAll, importAll, clearAll,
  };
})();
