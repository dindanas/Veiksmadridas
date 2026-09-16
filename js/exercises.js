// Veiksmadridas - Exercise Engine

const Exercises = (() => {

  const FORMS = ['form_1s','form_2s','form_3s','form_1p','form_2p','form_3p'];
  const PRONOUN_MAP = {
    form_1s:'yo', form_2s:'tú', form_3s:'él/ella',
    form_1p:'nosotros', form_2p:'vosotros', form_3p:'ellos/ellas'
  };

  // ---- Shuffle ----
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Build card IDs for a lesson ----
  function buildCardsForLesson(lesson) {
    const settings = Storage.getSettings();
    const forms = settings.showVosotros ? FORMS : FORMS.filter(f => f !== 'form_2p');
    const cards = [];
    lesson.verbSet.forEach(infinitive => {
      forms.forEach(form => {
        const row = getConjugation(infinitive, lesson.mood, lesson.tense);
        if (!row || !row[form]) return;
        const cardId = `${infinitive}||${lesson.mood}||${lesson.tense}||${form}`;
        let card = Storage.getCard(cardId);
        if (!card) card = Storage.initCard(cardId);
        cards.push(card);
      });
    });
    return cards;
  }

  // ---- Build practice queue from due + new cards ----
  function buildReviewQueue(limit = 20) {
    const allCards = Object.values(Storage.getAllCards());
    const settings = Storage.getSettings();
    const due = SM2.getDueCards(allCards);
    const today = Storage.formatDate(new Date());
    const newCardsIntroducedToday = allCards.filter(card =>
      card.introducedAt && Storage.formatDate(new Date(card.introducedAt)) === today
    ).length;
    const newAllowance = Math.max(0, settings.dailyNewCardLimit - newCardsIntroducedToday);
    const newC = SM2.getNewCards(allCards, Math.min(limit, newAllowance));
    return SM2.sortByPriority([...due, ...newC]).slice(0, limit);
  }

  function buildSentenceContext(pronoun, mood, tense) {
    const subjectEnglish = {
      yo: 'I', tú: 'you', 'él/ella': 'he or she', nosotros: 'we',
      vosotros: 'you all', 'ellos/ellas': 'they',
    }[pronoun] || pronoun;
    const key = `${mood}||${tense}`;
    const contexts = {
      'Indicativo||Presente': ['Cada día, {subject} ___.', 'Every day, {subject} ___.'],
      'Indicativo||Pretérito': ['Ayer, {subject} ___.', 'Yesterday, {subject} ___.'],
      'Indicativo||Imperfecto': ['Antes, {subject} ___.', 'In the past, {subject} ___.'],
      'Indicativo||Futuro': ['Mañana, {subject} ___.', 'Tomorrow, {subject} ___.'],
      'Indicativo||Condicional': ['Con más tiempo, {subject} ___.', 'With more time, {subject} ___.'],
      'Subjuntivo||Presente': ['Es importante que {subject} ___.', 'It is important that {subject} ___.'],
      'Subjuntivo||Imperfecto': ['Si {subject} ___, todo cambiaría.', 'If {subject} ___, everything would change.'],
      'Imperativo Afirmativo||Presente': ['Por favor, ___.', 'Please, ___.'],
    };
    const [esTemplate, enTemplate] = contexts[key] || ['{subject} ___.', '{subject} ___.'];
    return {
      es: esTemplate.replace('{subject}', pronoun),
      en: enTemplate.replace('{subject}', subjectEnglish),
    };
  }

  // ---- Multiple Choice Question ----
  function buildMultipleChoiceQuestion(cardId) {
    const [infinitive, mood, tense, form] = cardId.split('||');
    const row = getConjugation(infinitive, mood, tense);
    if (!row) return null;
    const correctAnswer = row[form];

    // Prefer other forms of the same verb, then fill any gaps with valid forms
    // from other verbs in the same mood, tense, and person slot.
    const otherForms = FORMS.filter(f => f !== form && row[f] && row[f] !== correctAnswer);
    const intraDistractors = otherForms.map(f => row[f]);
    const sameSlotDistractors = getVerbsForTense(mood, tense)
      .map(candidate => candidate[form])
      .filter(candidate => candidate && candidate !== correctAnswer);
    const distractors = shuffle([...new Set([...intraDistractors, ...sameSlotDistractors])]).slice(0, 3);
    const options = shuffle([correctAnswer, ...distractors]);

    return {
      type: 'multiple_choice',
      cardId,
      infinitive,
      mood,
      tense,
      form,
      prompt: {
        infinitive,
        english: row.infinitive_english,
        pronoun: PRONOUN_MAP[form],
        tense_english: row.tense_english,
        mood_english: row.mood_english,
      },
      options,
      correctAnswer,
      context: buildSentenceContext(PRONOUN_MAP[form], mood, tense),
      explanation: buildExplanation(row, form, infinitive, tense, mood),
    };
  }

  function buildExplanation(row, form, infinitive, tense, mood) {
    const correct = row[form];
    const pronoun = PRONOUN_MAP[form];
    // Strip leading "to " from infinitive_english for a cleaner gloss
    const meaning = row.infinitive_english.replace(/^to\s+/i, '').split(',')[0].trim();
    return `<strong>${pronoun} ${correct}</strong> — the <em>${pronoun}</em> form of <strong>${infinitive}</strong> (to ${meaning}) in the ${row.tense_english.toLowerCase()}. Gerund: <em>${row.gerund}</em> · Past participle: <em>${row.pastparticiple}</em>.`;
  }

  // ---- Session Management ----
  function createLessonSession(lessonId) {
    const lesson = Lessons.getLessonById(lessonId);
    if (!lesson) return null;
    const cards = buildCardsForLesson(lesson);
    const queue = shuffle(cards).slice(0, 30).map(c => c.cardId);
    const session = {
      sessionId: `sess_${Date.now()}`,
      startedAt: Date.now(),
      mode: 'lesson',
      lessonId,
      queue,
      results: [],
      currentIndex: 0,
    };
    Storage.saveSession(session);
    return session;
  }

  function createReviewSession() {
    const cards = buildReviewQueue(20);
    if (!cards.length) return null;
    const queue = cards.map(c => c.cardId);
    const session = {
      sessionId: `sess_${Date.now()}`,
      startedAt: Date.now(),
      mode: 'review',
      lessonId: null,
      queue,
      results: [],
      currentIndex: 0,
    };
    Storage.saveSession(session);
    return session;
  }

  function resumeSession() {
    return Storage.getSession();
  }

  function getCurrentQuestion(session) {
    if (!session || session.currentIndex >= session.queue.length) return null;
    const cardId = session.queue[session.currentIndex];
    return buildMultipleChoiceQuestion(cardId);
  }

  function handleAnswer(session, cardId, selectedAnswer) {
    const question = buildMultipleChoiceQuestion(cardId);
    const correct = selectedAnswer === question.correctAnswer;
    const quality = SM2.qualityFromCorrect(correct);

    let card = Storage.getCard(cardId);
    if (!card) card = Storage.initCard(cardId);

    const difficultyMultiplier = { easy: 1.3, hard: 0.7, auto: 1 }[Storage.getSettings().difficulty] || 1;
    const updated = SM2.calculate(
      quality, card.repetitions, card.easeFactor, card.interval, difficultyMultiplier
    );
    Storage.upsertCard(cardId, {
      ...updated,
      lastReviewedAt: Date.now(),
      introducedAt: card.introducedAt || (card.totalAttempts === 0 ? Date.now() : null),
      totalAttempts: (card.totalAttempts || 0) + 1,
      totalCorrect: (card.totalCorrect || 0) + (correct ? 1 : 0),
    });

    Storage.appendReview({
      timestamp: Date.now(),
      cardId,
      quality,
      correct,
      newInterval: updated.interval,
      sessionId: session.sessionId,
    });

    const newSession = {
      ...session,
      currentIndex: session.currentIndex + 1,
      results: [...session.results, { cardId, correct, quality, selectedAnswer, correctAnswer: question.correctAnswer }],
    };
    Storage.saveSession(newSession);
    return { newSession, correct, question };
  }

  // ---- Rendering ----
  function renderPracticeScreen() {
    const session = resumeSession();
    const dueCards = Object.values(Storage.getAllCards()).filter(c =>
      c.totalAttempts > 0 && c.nextReviewAt <= Date.now()
    );
    const allCards = Object.values(Storage.getAllCards());
    const newCards = allCards.filter(c => c.totalAttempts === 0);
    const settings = Storage.getSettings();
    const today = Storage.formatDate(new Date());
    const newCardsIntroducedToday = allCards.filter(card =>
      card.introducedAt && Storage.formatDate(new Date(card.introducedAt)) === today
    ).length;
    const newAllowance = Math.max(0, settings.dailyNewCardLimit - newCardsIntroducedToday);
    const reviewCount = Math.min(dueCards.length + Math.min(newCards.length, newAllowance), 20);

    if (session && session.currentIndex < session.queue.length) {
      return renderActiveSession(session);
    }

    return `
      <div class="screen">
        <div class="screen-header">
          <h1>Practice</h1>
          <p class="screen-subtitle">Reinforce your knowledge</p>
        </div>

        <div class="practice-options">
          <div class="practice-stat-row">
            <div class="stat-pill ${dueCards.length > 0 ? 'stat-pill-alert' : ''}">
              <span class="stat-num">${dueCards.length}</span>
              <span class="stat-lbl">due for review</span>
            </div>
            <div class="stat-pill">
              <span class="stat-num">${newCards.length}</span>
              <span class="stat-lbl">new cards</span>
            </div>
          </div>

          ${reviewCount > 0 ? `
            <button class="btn btn-primary btn-lg" id="btn-start-review">
              Start Review Session
              <span class="btn-sub">${reviewCount} cards</span>
            </button>
          ` : `
            <div class="empty-state">
              <div class="empty-icon">🎉</div>
              <h2>All caught up!</h2>
              <p>${newCards.length > 0 ? 'Your daily new-card limit is reached. Come back tomorrow or adjust it in Settings.' : 'No cards due for review. Go learn a new lesson.'}</p>
              <button class="btn btn-secondary" id="btn-go-lessons">Browse Lessons</button>
            </div>
          `}

          <div class="practice-by-tense">
            <h2 class="section-title">Practice by Tense</h2>
            ${Lessons.CURRICULUM.map(l => {
              const unlocked = Lessons.isUnlocked(l.id);
              if (!unlocked) return '';
              const tenseCards = Object.values(Storage.getAllCards()).filter(c => c.mood === l.mood && c.tense === l.tense);
              const tDue = tenseCards.filter(c => c.nextReviewAt <= Date.now()).length;
              return `
                <div class="tense-practice-row ${tDue > 0 ? 'has-due' : ''}"
                     data-lesson-id="${l.id}" role="button" tabindex="0">
                  <span class="tense-icon" style="color:${l.color}">${l.icon}</span>
                  <span class="tense-name">${l.title}</span>
                  ${tDue > 0 ? `<span class="due-badge">${tDue}</span>` : ''}
                  <span class="tense-arrow">→</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function getRuleSnippet(mood, tense) {
    const lessonId = `${mood}||${tense}`;
    const content = Lessons.CONTENT[lessonId];
    if (!content) return null;
    return content.body || null;
  }

  function renderActiveSession(session) {
    const question = getCurrentQuestion(session);
    if (!question) return renderSessionSummary(session);

    const progress = session.currentIndex;
    const total = session.queue.length;
    const pct = Math.round((progress / total) * 100);
    const ruleSnippet = getRuleSnippet(question.mood, question.tense);

    return `
      <div class="screen screen-exercise">
        <div class="exercise-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="progress-right">
            <span class="progress-label">${progress}/${total}</span>
            ${ruleSnippet ? `<button class="rule-toggle-btn" id="btn-rule-toggle" title="Show grammar rule">📖 Rule</button>` : ''}
          </div>
        </div>

        ${ruleSnippet ? `
          <div class="rule-drawer hidden" id="rule-drawer">
            <div class="rule-drawer-inner">
              <div class="rule-drawer-header">
                <span class="rule-drawer-title">${question.prompt.tense_english} — Quick Reference</span>
                <button class="rule-drawer-close" id="btn-rule-close">✕</button>
              </div>
              <div class="rule-drawer-body lesson-body">${ruleSnippet}</div>
            </div>
          </div>
        ` : ''}

        <div class="question-card" id="question-card">
          <div class="question-meta">
            <span class="question-tense">${question.prompt.tense_english}</span>
          </div>

          <div class="question-verb">
            <div class="verb-headline">
              <span class="verb-infinitive-lg">${question.prompt.infinitive}</span>
              <span class="verb-pronoun-inline">(${question.prompt.pronoun})</span>
            </div>
            <span class="verb-english-sm">${question.prompt.english}</span>
          </div>

          <p class="question-instruction">Choose the correct conjugation:</p>
          <div class="sentence-context">
            <p class="sentence-context-es">${question.context.es}</p>
            <button class="translation-toggle" id="btn-context-translation" type="button">Show English</button>
            <p class="sentence-context-en hidden" id="context-translation">${question.context.en}</p>
          </div>

          <div class="options-grid" id="options-grid">
            ${question.options.map((opt, i) => `
              <button class="option-btn" data-answer="${opt}" data-index="${i}">
                ${opt}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="feedback-area hidden" id="feedback-area">
          <div class="feedback-result" id="feedback-result"></div>
          <div class="explanation-box" id="explanation-box"></div>
          <button class="btn btn-primary" id="btn-next">Next →</button>
        </div>
      </div>
    `;
  }

  function renderSessionSummary(session) {
    Storage.clearSession();
    const total = session.results.length;
    if (total === 0) return renderPracticeScreen();

    const correct = session.results.filter(r => r.correct).length;
    const pct = Math.round((correct / total) * 100);
    const duration = Math.round((Date.now() - session.startedAt) / 60000);

    let emoji = '😅';
    if (pct >= 90) emoji = '🎉';
    else if (pct >= 70) emoji = '👍';
    else if (pct >= 50) emoji = '📚';

    if (session.lessonId && pct >= 60) {
      Lessons.markLessonComplete(session.lessonId, pct / 100);
    }

    return `
      <div class="screen screen-summary">
        <div class="summary-emoji">${emoji}</div>
        <h1 class="summary-title">Session Complete!</h1>
        <div class="summary-score">${pct}%</div>
        <p class="summary-detail">${correct} of ${total} correct · ${duration} min</p>

        <div class="summary-breakdown">
          ${session.results.map(r => `
            <div class="summary-row ${r.correct ? 'correct' : 'incorrect'}">
              <span class="summary-card-id">${r.cardId.split('||').slice(0,3).join(' · ')}</span>
              <span class="summary-mark">${r.correct ? '✓' : '✗'}</span>
            </div>
          `).join('')}
        </div>

        <div class="summary-actions">
          <button class="btn btn-primary" id="btn-practice-again">Practice Again</button>
          <button class="btn btn-secondary" id="btn-back-home">Back to Lessons</button>
        </div>
      </div>
    `;
  }

  return {
    shuffle,
    buildMultipleChoiceQuestion, buildCardsForLesson,
    createLessonSession, createReviewSession, resumeSession,
    getCurrentQuestion, handleAnswer,
    renderPracticeScreen, renderActiveSession, renderSessionSummary,
  };
})();
