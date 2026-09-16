// Veiksmadridas - Main App Router & Screen Renderers

const App = (() => {
  let currentRoute = 'lessons';
  let routeParams = {};
  const root = () => document.getElementById('app-root');

  // ---- Theme ----
  function applyTheme(theme) {
    const el = document.documentElement;
    if (theme === 'system') {
      el.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      el.dataset.theme = theme;
    }
  }

  // ---- Toast ----
  function showToast(msg, type = '') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ---- Navigation ----
  function navigate(route, params = {}) {
    currentRoute = route;
    routeParams = params;
    renderRoute();
    updateNav(route);
    document.getElementById('app-root').scrollTop = 0;
  }

  function updateNav(route) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === route);
    });
  }

  // ---- Render ----
  function renderRoute() {
    const r = root();
    const params = routeParams;

    if (currentRoute === 'lessons') {
      if (params.lessonId) {
        r.innerHTML = Lessons.renderLessonDetail(params.lessonId);
        bindLessonDetail(params.lessonId);
      } else {
        r.innerHTML = Lessons.renderLessonsScreen();
        bindLessonsScreen();
      }
    } else if (currentRoute === 'practice') {
      if (params.lessonId) {
        // Start/resume lesson practice
        let session = Exercises.resumeSession();
        if (!session || session.lessonId !== params.lessonId) {
          session = Exercises.createLessonSession(params.lessonId);
        }
        r.innerHTML = Exercises.renderActiveSession(session);
        bindExercise(session);
      } else if (params.reviewMode) {
        let session = Exercises.createReviewSession();
        if (!session) { navigate('practice'); return; }
        r.innerHTML = Exercises.renderActiveSession(session);
        bindExercise(session);
      } else {
        r.innerHTML = Exercises.renderPracticeScreen();
        bindPracticeScreen();
      }
    } else if (currentRoute === 'progress') {
      r.innerHTML = renderProgressScreen();
      drawTimelineChart();
    } else if (currentRoute === 'settings') {
      r.innerHTML = renderSettingsScreen();
      bindSettingsScreen();
    }
  }

  // ---- Lessons Screen ----
  function bindLessonsScreen() {
    document.querySelectorAll('.lesson-card.available').forEach(el => {
      el.addEventListener('click', () => navigate('lessons', { lessonId: el.dataset.lessonId }));
    });
  }

  // ---- Lesson Detail ----
  function bindLessonDetail(lessonId) {
    const backBtn = document.getElementById('btn-back-lessons');
    if (backBtn) backBtn.addEventListener('click', () => navigate('lessons'));

    const startBtn = document.getElementById('btn-start-lesson-practice');
    if (startBtn) {
      startBtn.addEventListener('click', () => navigate('practice', { lessonId }));
    }
  }

  // ---- Practice Screen ----
  function bindPracticeScreen() {
    const reviewBtn = document.getElementById('btn-start-review');
    if (reviewBtn) reviewBtn.addEventListener('click', () => navigate('practice', { reviewMode: true }));

    const lessonsBtn = document.getElementById('btn-go-lessons');
    if (lessonsBtn) lessonsBtn.addEventListener('click', () => navigate('lessons'));

    document.querySelectorAll('.tense-practice-row').forEach(el => {
      el.addEventListener('click', () => navigate('practice', { lessonId: el.dataset.lessonId }));
    });
  }

  // ---- Exercise (active session) ----
  let currentSession = null;
  let currentQuestion = null;
  let answered = false;

  function bindExercise(session) {
    currentSession = session;
    currentQuestion = Exercises.getCurrentQuestion(session);
    answered = false;

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => handleOptionClick(btn.dataset.answer));
    });

    const translationToggle = document.getElementById('btn-context-translation');
    const translation = document.getElementById('context-translation');
    if (translationToggle && translation) {
      translationToggle.addEventListener('click', () => {
        const isHidden = translation.classList.toggle('hidden');
        translationToggle.textContent = isHidden ? 'Show English' : 'Hide English';
      });
    }

    // Rule drawer toggle
    const ruleToggle = document.getElementById('btn-rule-toggle');
    const ruleDrawer = document.getElementById('rule-drawer');
    const ruleClose = document.getElementById('btn-rule-close');
    if (ruleToggle && ruleDrawer) {
      ruleToggle.addEventListener('click', () => {
        const open = !ruleDrawer.classList.contains('hidden');
        ruleDrawer.classList.toggle('hidden', open);
        ruleToggle.classList.toggle('active', !open);
      });
      if (ruleClose) {
        ruleClose.addEventListener('click', () => {
          ruleDrawer.classList.add('hidden');
          ruleToggle.classList.remove('active');
        });
      }
    }
  }

  function handleOptionClick(selected) {
    if (answered) return;
    answered = true;

    const { newSession, correct, question } = Exercises.handleAnswer(currentSession, currentQuestion.cardId, selected);
    currentSession = newSession;

    // Mark buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.answer === question.correctAnswer) btn.classList.add('correct');
      else if (btn.dataset.answer === selected && !correct) btn.classList.add('incorrect');
    });

    // Show feedback
    const feedbackArea = document.getElementById('feedback-area');
    const feedbackResult = document.getElementById('feedback-result');
    const explanationBox = document.getElementById('explanation-box');

    feedbackArea.classList.remove('hidden');
    feedbackResult.className = `feedback-result ${correct ? 'correct' : 'incorrect'}`;
    feedbackResult.textContent = correct ? '✓ Correct!' : '✗ Incorrect';
    explanationBox.innerHTML = question.explanation;

    const nextBtn = document.getElementById('btn-next');
    nextBtn.addEventListener('click', () => {
      if (currentSession.currentIndex >= currentSession.queue.length) {
        root().innerHTML = Exercises.renderSessionSummary(currentSession);
        bindSummaryScreen(currentSession);
      } else {
        root().innerHTML = Exercises.renderActiveSession(currentSession);
        bindExercise(currentSession);
      }
    });
  }

  // ---- Session Summary ----
  function bindSummaryScreen(session) {
    const againBtn = document.getElementById('btn-practice-again');
    if (againBtn) {
      againBtn.addEventListener('click', () => {
        if (session.lessonId) navigate('practice', { lessonId: session.lessonId });
        else navigate('practice', { reviewMode: true });
      });
    }
    const homeBtn = document.getElementById('btn-back-home');
    if (homeBtn) homeBtn.addEventListener('click', () => navigate('lessons'));
  }

  // ---- Tense Timeline ----
  // Each tense is positioned on a -100 (deep past) → +100 (future) axis
  // with a start and end to show its temporal "footprint"
  const TENSE_SPANS = [
    { id: 'Indicativo||Imperfecto',    label: 'Imperfect',       labelEs: 'Imperfecto',   start: -80, end: -15, color: '#d97706', shape: 'wave',  note: 'ongoing / habitual past' },
    { id: 'Indicativo||Pretérito',     label: 'Preterite',       labelEs: 'Pretérito',    start: -60, end: -40, color: '#92400e', shape: 'point', note: 'completed past moment' },
    { id: 'Subjuntivo||Imperfecto',    label: 'Imperfect Subj.', labelEs: 'Subj. Imp.',   start: -50, end: -10, color: '#ef4444', shape: 'dash',  note: 'past hypotheticals' },
    { id: 'Indicativo||Presente',      label: 'Present',         labelEs: 'Presente',     start: -8,  end:  8,  color: '#3b82f6', shape: 'solid', note: 'now / habitual' },
    { id: 'Subjuntivo||Presente',      label: 'Present Subj.',   labelEs: 'Subj. Pres.',  start: -5,  end: 20,  color: '#a855f7', shape: 'dash',  note: 'wishes / doubts' },
    { id: 'Imperativo||Afirmativo',    label: 'Imperative',      labelEs: 'Imperativo',   start:  0,  end: 10,  color: '#f97316', shape: 'arrow', note: 'commands' },
    { id: 'Indicativo||Condicional',   label: 'Conditional',     labelEs: 'Condicional',  start: 10,  end: 60,  color: '#22c55e', shape: 'dash',  note: 'would / hypothetical' },
    { id: 'Indicativo||Futuro',        label: 'Future',          labelEs: 'Futuro',       start: 20,  end: 90,  color: '#eab308', shape: 'solid', note: 'will happen' },
  ];

  function renderTenseTimeline() {
    // Axis: -100 = deep past, 0 = present, +100 = future
    // Map to percentage: pct = (val + 100) / 200 * 100
    const toX = v => ((v + 100) / 200 * 100).toFixed(2) + '%';

    const rows = TENSE_SPANS.map((t, i) => {
      const unlocked = Lessons.isUnlocked(t.id);
      const xL = ((t.start + 100) / 200 * 100).toFixed(2);
      const xR = ((t.end   + 100) / 200 * 100).toFixed(2);
      const width = (xR - xL).toFixed(2);
      const midX = ((+xL + +xR) / 2).toFixed(2);
      const opacity = unlocked ? '1' : '0.35';
      const isDash = t.shape === 'dash';
      const isPoint = t.shape === 'point';
      const barH = isPoint ? 6 : 10;
      const borderR = isPoint ? 3 : 5;

      return `
        <div class="tl-row" data-lesson-id="${t.id}" style="opacity:${opacity}">
          <div class="tl-label-left">${t.label}</div>
          <div class="tl-track-wrap">
            <div class="tl-bar-container">
              <div class="tl-bar ${isDash ? 'tl-bar--dash' : ''}"
                   style="left:${xL}%;width:${width}%;background:${t.color};height:${barH}px;border-radius:${borderR}px;${isDash?'opacity:0.7':''}">
              </div>
              ${isPoint ? `<div class="tl-point-marker" style="left:${midX}%;background:${t.color}"></div>` : ''}
            </div>
          </div>
          <div class="tl-note">${t.note}</div>
        </div>
      `;
    });

    return `
      <div class="tl-wrapper">
        <div class="tl-axis-labels">
          <span>◀ Past</span>
          <span>Present</span>
          <span>Future ▶</span>
        </div>
        <div class="tl-axis-line">
          <div class="tl-axis-center"></div>
        </div>
        <div class="tl-rows">
          ${rows.join('')}
        </div>
        <p class="tl-legend">
          <span class="tl-legend-item"><span class="tl-swatch" style="background:#3b82f6"></span> Indicative</span>
          <span class="tl-legend-item"><span class="tl-swatch tl-swatch--dash" style="background:#a855f7"></span> Subjunctive</span>
          <span class="tl-legend-item"><span class="tl-swatch" style="background:#f97316"></span> Imperative</span>
        </p>
      </div>
    `;
  }

  // ---- Progress Screen ----
  function renderProgressScreen() {
    const log = Storage.getReviewLog();
    const cards = Object.values(Storage.getAllCards());
    const streak = SM2.getStreakDays(log);
    const mastered = cards.filter(c => SM2.getMasteryLevel(c) === 'mastered').length;
    const seen = cards.filter(c => c.totalAttempts > 0).length;
    const totalReviews = log.length;

    const masteryRows = Lessons.CURRICULUM.map(lesson => {
      const tenseCards = cards.filter(c => c.mood === lesson.mood && c.tense === lesson.tense);
      const total = tenseCards.length;
      const masteredN = tenseCards.filter(c => SM2.getMasteryLevel(c) === 'mastered').length;
      const pct = total > 0 ? Math.round((masteredN / total) * 100) : 0;
      return `
        <div class="mastery-row">
          <span class="mastery-icon" style="color:${lesson.color}">${lesson.icon}</span>
          <div class="mastery-info">
            <div class="mastery-name">${lesson.title}</div>
            <div class="mastery-bar-wrap">
              <div class="mastery-bar-fill" style="width:${pct}%;background:${lesson.color}"></div>
            </div>
          </div>
          <span class="mastery-count">${masteredN}/${total}</span>
        </div>
      `;
    }).join('');

    // Timeline dots
    const timelineDots = Lessons.CURRICULUM.map(l => `
      <div class="timeline-tense" data-lesson-id="${l.id}">
        <div class="timeline-dot" style="background:${l.color}"></div>
        <div class="timeline-tense-name">${l.title.split(' ')[0]}</div>
        <div class="timeline-en">${l.subtitle.split(' ').slice(-1)[0]}</div>
      </div>
    `).join('');

    return `
      <div class="screen">
        <div class="screen-header">
          <h1>Progress</h1>
          <p class="screen-subtitle">Your learning journey</p>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">${streak}</span>
            <span class="stat-label">Day streak</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${mastered}</span>
            <span class="stat-label">Mastered</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${totalReviews}</span>
            <span class="stat-label">Reviews</span>
          </div>
        </div>

        <div class="timeline-viz">
          <h2 class="chart-title" style="margin-bottom:16px">Tense Timeline</h2>
          ${renderTenseTimeline()}
        </div>

        <div class="chart-card">
          <div class="chart-title">Last 14 Days</div>
          <canvas id="timeline-chart" height="120"></canvas>
        </div>

        <div class="mastery-grid">
          <div class="mastery-title">MASTERY BY TENSE</div>
          ${masteryRows}
        </div>
      </div>
    `;
  }

  function drawTimelineChart() {
    const canvas = document.getElementById('timeline-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const log = Storage.getReviewLog();

    // Build 14 days of data
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = Storage.formatDate(d);
      const reviews = Storage.getReviewsForDate(dateStr);
      days.push({
        label: i === 0 ? 'Today' : `${d.getDate()}/${d.getMonth()+1}`,
        total: reviews.length,
        correct: reviews.filter(r => r.correct).length,
      });
    }

    const maxVal = Math.max(...days.map(d => d.total), 1);
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = 120;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.dataset.theme !== 'light';
    const barColor = '#c0392b';
    const correctColor = '#27ae60';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#666' : '#aaa';

    const padL = 8, padR = 8, padT = 8, padB = 28;
    const chartH = h - padT - padB;
    const barW = Math.floor((w - padL - padR) / days.length) - 2;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    for (let i = 0; i <= 3; i++) {
      const y = padT + chartH - (chartH * i / 3);
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }

    // Bars
    days.forEach((day, i) => {
      const x = padL + i * ((w - padL - padR) / days.length);
      const barH = maxVal > 0 ? (day.total / maxVal) * chartH : 0;
      const correctH = maxVal > 0 && day.total > 0 ? (day.correct / maxVal) * chartH : 0;
      const y = padT + chartH - barH;

      if (barH > 0) {
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, barW, barH, [2, 2, 0, 0]);
        ctx.fill();

        if (correctH > 0) {
          ctx.fillStyle = correctColor;
          ctx.beginPath();
          ctx.roundRect(x + 1, padT + chartH - correctH, barW, correctH, [2, 2, 0, 0]);
          ctx.fill();
        }
      }

      // Label every other day
      if (i % 2 === 0 || i === days.length - 1) {
        ctx.fillStyle = textColor;
        ctx.font = `10px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(day.label, x + barW / 2, h - 8);
      }
    });
  }

  // ---- Settings Screen ----
  function renderSettingsScreen() {
    const s = Storage.getSettings();
    return `
      <div class="screen">
        <div class="screen-header">
          <h1>Settings</h1>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Appearance</div>
          <div class="setting-row">
            <div class="setting-label-wrap">
              <div class="setting-label">Theme</div>
            </div>
            <select class="setting-select" id="setting-theme">
              <option value="dark"   ${s.theme==='dark'   ? 'selected' : ''}>Dark</option>
              <option value="light"  ${s.theme==='light'  ? 'selected' : ''}>Light</option>
              <option value="system" ${s.theme==='system' ? 'selected' : ''}>System</option>
            </select>
          </div>
          <div class="setting-row">
            <div class="setting-label-wrap">
              <div class="setting-label">Show Vosotros</div>
              <div class="setting-desc">Include vosotros form in tables & practice</div>
            </div>
            <button class="toggle ${s.showVosotros ? 'on' : ''}" id="toggle-vosotros"></button>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Study</div>
          <div class="setting-row">
            <div class="setting-label-wrap">
              <div class="setting-label">New cards per day</div>
              <div class="setting-desc">How many new cards to introduce daily</div>
            </div>
            <select class="setting-select" id="setting-new-cards">
              ${[5,10,15,20,30].map(n => `<option value="${n}" ${s.dailyNewCardLimit===n?'selected':''}>${n}</option>`).join('')}
            </select>
          </div>
          <div class="setting-row">
            <div class="setting-label-wrap">
              <div class="setting-label">Difficulty</div>
              <div class="setting-desc">Controls review interval lengths</div>
            </div>
            <select class="setting-select" id="setting-difficulty">
              <option value="auto"  ${s.difficulty==='auto' ?'selected':''}>Auto</option>
              <option value="easy"  ${s.difficulty==='easy' ?'selected':''}>Easy</option>
              <option value="hard"  ${s.difficulty==='hard' ?'selected':''}>Hard</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Data</div>
          <div class="settings-btn-row">
            <button class="btn btn-secondary" id="btn-export">Export Backup</button>
          </div>
          <div class="settings-btn-row">
            <button class="btn btn-secondary" id="btn-import">Import Backup</button>
            <input type="file" id="import-file" accept=".json" style="display:none">
          </div>
          <div class="settings-btn-row">
            <button class="btn btn-danger" id="btn-reset">Reset All Data</button>
          </div>
        </div>

        <div class="settings-footer">
          <p>Verb data: Fred Jehle, CC BY-NC-SA 3.0</p>
          <p>Veiksmadridas v1.0.0 · Built for B2 Spanish</p>
        </div>
      </div>
    `;
  }

  function bindSettingsScreen() {
    // Theme
    const themeSelect = document.getElementById('setting-theme');
    themeSelect.addEventListener('change', () => {
      Storage.updateSettings({ theme: themeSelect.value });
      applyTheme(themeSelect.value);
    });

    // Vosotros toggle
    const vosotrosBtn = document.getElementById('toggle-vosotros');
    vosotrosBtn.addEventListener('click', () => {
      const s = Storage.getSettings();
      Storage.updateSettings({ showVosotros: !s.showVosotros });
      vosotrosBtn.classList.toggle('on', !s.showVosotros);
    });

    // New cards
    const newCardsSelect = document.getElementById('setting-new-cards');
    newCardsSelect.addEventListener('change', () => {
      Storage.updateSettings({ dailyNewCardLimit: parseInt(newCardsSelect.value) });
    });

    // Difficulty
    const diffSelect = document.getElementById('setting-difficulty');
    diffSelect.addEventListener('change', () => {
      Storage.updateSettings({ difficulty: diffSelect.value });
    });

    // Export
    document.getElementById('btn-export').addEventListener('click', () => {
      const json = Storage.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `veiksmadridas_backup_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exported!', 'success');
    });

    // Import
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          Storage.importAll(ev.target.result);
          showToast('Backup imported!', 'success');
          navigate('settings');
        } catch (err) {
          showToast('Import failed — invalid file', 'error');
        }
      };
      reader.readAsText(file);
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        Storage.clearAll();
        showToast('All data cleared', '');
        navigate('lessons');
      }
    });
  }

  // ---- Init ----
  function init() {
    const settings = Storage.getSettings();
    applyTheme(settings.theme);

    // Wire bottom nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => navigate(btn.dataset.route));
    });

    // Check for in-progress session
    const session = Storage.getSession();
    if (session && session.currentIndex < session.queue.length) {
      navigate('practice');
      return;
    }

    navigate('lessons');
  }

  return { init, navigate, showToast, applyTheme };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
