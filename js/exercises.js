// Veiksmadridas - Exercise Engine

const Exercises = (() => {

  const FORMS = ['form_1s','form_2s','form_3s','form_1p','form_2p','form_3p'];
  const PRONOUN_MAP = {
    form_1s:'yo', form_2s:'tú', form_3s:'él/ella',
    form_1p:'nosotros', form_2p:'vosotros', form_3p:'ellos/ellas'
  };
  const GUIDED_CORRECT_TO_GRADUATE = 1;
  const INTRODUCTION_CARD_COUNT = 10;
  const SESSION_CARD_COUNT = 30;
  const TAUGHT_INDICATIVE_TENSES = new Set(['Presente', 'Pretérito', 'Imperfecto', 'Futuro', 'Condicional']);

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

  function buildSentenceContext(infinitive, pronoun, mood, tense) {
    const subjectEnglish = {
      yo: 'I', tú: 'you', 'él/ella': 'he or she', nosotros: 'we',
      vosotros: 'you all', 'ellos/ellas': 'they',
    }[pronoun] || pronoun;
    const key = `${mood}||${tense}`;
    // These complements deliberately avoid gender and number agreement, so a
    // prompt stays grammatical for every person (yo, tú, él/ella, etc.).
    // They are short, meaningful phrases rather than filler added to a stem.
    const complements = {
      hablar: [['con mi familia', 'with my family'], ['con el profesor', 'with the teacher']],
      comer: [['en casa', 'at home'], ['con amigos', 'with friends']],
      vivir: [['cerca del centro', 'near the city centre'], ['en Madrid', 'in Madrid']],
      ser: [['parte del equipo', 'part of the team'], ['de confianza', 'trustworthy']],
      estar: [['en casa', 'at home'], ['aquí', 'here']],
      ir: [['al mercado', 'to the market'], ['a casa', 'home']],
      tener: [['tiempo', 'time'], ['mucha suerte', 'a lot of luck']],
      hacer: [['ejercicio', 'exercise'], ['la cena', 'dinner']],
      poder: [['ayudar', 'help'], ['venir', 'come']],
      querer: [['hablar español', 'speak Spanish'], ['descansar', 'rest']],
      salir: [['temprano', 'early'], ['con amigos', 'with friends']],
    };
    const choices = complements[infinitive] || [['', '']];
    const [complementEs, complementEn] = choices[Math.floor(Math.random() * choices.length)];
    const contexts = {
      'Indicativo||Presente': ['{subject} ___ {complement}.', '{subject} ___ {complement}.'],
      'Indicativo||Pretérito': ['Ayer, {subject} ___ {complement}.', 'Yesterday, {subject} ___ {complement}.'],
      'Indicativo||Imperfecto': ['Antes, {subject} ___ {complement}.', 'In the past, {subject} ___ {complement}.'],
      'Indicativo||Futuro': ['Mañana, {subject} ___ {complement}.', 'Tomorrow, {subject} ___ {complement}.'],
      'Indicativo||Condicional': ['Con más tiempo, {subject} ___ {complement}.', 'With more time, {subject} ___ {complement}.'],
      'Subjuntivo||Presente': ['Es importante que {subject} ___ {complement}.', 'It is important that {subject} ___ {complement}.'],
      'Subjuntivo||Imperfecto': ['Si {subject} ___ {complement}, todo sería distinto.', 'If {subject} ___ {complement}, everything would be different.'],
      'Imperativo Afirmativo||Presente': ['Por favor, ___ {complement}.', 'Please, ___ {complement}.'],
    };
    const [esTemplate, enTemplate] = contexts[key] || ['{subject} ___.', '{subject} ___.'];
    return {
      es: esTemplate.replace('{subject}', pronoun).replace('{complement}', complementEs).replace(/\s+\./, '.'),
      en: enTemplate.replace('{subject}', subjectEnglish).replace('{complement}', complementEn).replace(/\s+\./, '.'),
    };
  }

  function normalizedAnswer(answer) {
    return String(answer || '')
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  function getGuidedCorrect(card) {
    if (typeof card?.guidedCorrect === 'number') return card.guidedCorrect;
    // Existing progress predates guidedCorrect. Preserve its earned progress.
    return Math.min(card?.totalCorrect || 0, GUIDED_CORRECT_TO_GRADUATE);
  }

  function getAnswerMode(card, session) {
    const isIntroduction = session?.mode === 'lesson' &&
      !session.isRetryRound &&
      session.currentIndex < (session.introductionCount || 0);
    const isRecallRound = session?.isRetryRound ||
      (session?.mode === 'lesson' && session.forceTypedAfterIntroduction && !isIntroduction);
    return isIntroduction || (!isRecallRound && getGuidedCorrect(card) < GUIDED_CORRECT_TO_GRADUATE)
      ? 'guided'
      : 'typed';
  }

  // ---- Adaptive question builder ----
  function buildMultipleChoiceQuestion(cardId, session = null) {
    const [infinitive, mood, tense, form] = cardId.split('||');
    const row = getConjugation(infinitive, mood, tense);
    if (!row) return null;
    const correctAnswer = row[form];
    const card = Storage.getCard(cardId) || Storage.initCard(cardId);
    const answerMode = getAnswerMode(card, session);

    // Every option must be a form of the verb named in the question. Choosing
    // a different infinitive merely tests word recognition; using the same
    // person in other tenses makes this a genuine conjugation question.
    const sameVerbDifferentTenses = getVerbRows(infinitive)
      .filter(candidate =>
        candidate.mood === 'Indicativo' &&
        TAUGHT_INDICATIVE_TENSES.has(candidate.tense) &&
        candidate.tense !== tense &&
        candidate[form] &&
        candidate[form] !== correctAnswer
      )
      .map(candidate => candidate[form]);
    const distractors = shuffle([...new Set(sameVerbDifferentTenses)]).slice(0, 3);
    const options = shuffle([correctAnswer, ...distractors]);

    return {
      type: 'multiple_choice',
      answerMode,
      isIntroduction: session?.mode === 'lesson' && session.currentIndex < (session.introductionCount || 0),
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
      context: buildSentenceContext(infinitive, PRONOUN_MAP[form], mood, tense),
      explanation: buildExplanation(row, form, infinitive, tense, mood),
    };
  }

  function buildExplanation(row, form, infinitive, tense, mood, selectedAnswer = null) {
    const correct = row[form];
    const pronoun = PRONOUN_MAP[form];
    // Strip leading "to " from infinitive_english for a cleaner gloss
    const meaning = row.infinitive_english.replace(/^to\s+/i, '').split(',')[0].trim();
    const selectedForm = getVerbRows(infinitive).find(candidate =>
      candidate[form] &&
      normalizedAnswer(candidate[form]) === normalizedAnswer(selectedAnswer) &&
      (candidate.mood !== mood || candidate.tense !== tense)
    );
    const contrast = selectedForm
      ? ` You entered <strong>${selectedForm[form]}</strong>, the <em>${pronoun}</em> ${selectedForm.tense_english.toLowerCase()} form.`
      : '';
    return `<strong>${pronoun} ${correct}</strong> — the <em>${pronoun}</em> form of <strong>${infinitive}</strong> (to ${meaning}) in the ${row.tense_english.toLowerCase()}.${contrast} Gerund: <em>${row.gerund}</em> · Past participle: <em>${row.pastparticiple}</em>.`;
  }

  // ---- Session Management ----
  function uniqueCards(cards) {
    return [...new Map(cards.map(card => [card.cardId, card])).values()];
  }

  function fillQueue(queue, candidates, max) {
    const seen = new Set(queue.map(card => card.cardId));
    for (const card of shuffle(candidates)) {
      if (queue.length >= max) break;
      if (!seen.has(card.cardId)) {
        queue.push(card);
        seen.add(card.cardId);
      }
    }
    return queue;
  }

  function getCompletedLessons() {
    return Lessons.CURRICULUM.filter(lesson =>
      Storage.getLessonStatus(lesson.id)?.status === 'completed'
    );
  }

  function createLessonSession(lessonId) {
    const lesson = Lessons.getLessonById(lessonId);
    if (!lesson) return null;
    const lessonStatus = Storage.getLessonStatus(lessonId);
    const isFirstPass = !lessonStatus?.introductionStartedAt;
    const targetCards = shuffle(buildCardsForLesson(lesson));
    const completedLessons = getCompletedLessons().filter(candidate => candidate.id !== lessonId);
    const reviewCards = uniqueCards(completedLessons.flatMap(buildCardsForLesson));
    const introduction = isFirstPass
      ? targetCards.slice(0, Math.min(INTRODUCTION_CARD_COUNT, targetCards.length))
      : [];
    const remainingTarget = targetCards.filter(card => !introduction.some(intro => intro.cardId === card.cardId));
    const remainingSlots = SESSION_CARD_COUNT - introduction.length;
    const targetSlots = reviewCards.length ? Math.ceil(remainingSlots * 0.65) : remainingSlots;
    const queueCards = [...introduction];

    fillQueue(queueCards, remainingTarget, introduction.length + targetSlots);
    fillQueue(queueCards, reviewCards, introduction.length + remainingSlots);
    fillQueue(queueCards, [...remainingTarget, ...reviewCards], SESSION_CARD_COUNT);

    if (isFirstPass) {
      Storage.updateLesson(lessonId, { introductionStartedAt: Date.now() });
    }
    const session = {
      sessionId: `sess_${Date.now()}`,
      startedAt: Date.now(),
      mode: 'lesson',
      lessonId,
      queue: queueCards.map(card => card.cardId),
      results: [],
      currentIndex: 0,
      introductionCount: introduction.length,
      forceTypedAfterIntroduction: isFirstPass,
      isMixed: reviewCards.length > 0,
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
      isMixed: new Set(cards.map(card => `${card.mood}||${card.tense}`)).size > 1,
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
    return buildMultipleChoiceQuestion(cardId, session);
  }

  function getMainRoundResults(session) {
    const end = session.initialResultCount || session.results.length;
    return session.results.slice(0, end);
  }

  function getMissedResults(session) {
    const missed = new Map();
    getMainRoundResults(session).forEach(result => {
      if (!result.correct && !missed.has(result.cardId)) missed.set(result.cardId, result);
    });
    return [...missed.values()];
  }

  // A missed form stays available now, not just when SM-2 schedules it tomorrow.
  // The retry round deliberately uses typed recall, so it confirms the answer was
  // retrieved rather than selected from a set of options.
  function createRetrySession(session) {
    if (!session || session.isRetryRound) return null;
    const missed = getMissedResults(session);
    if (!missed.length) return null;

    const retrySession = {
      ...session,
      queue: shuffle(missed.map(result => result.cardId)),
      currentIndex: 0,
      initialResultCount: session.results.length,
      introductionCount: 0,
      forceTypedAfterIntroduction: true,
      isRetryRound: true,
    };
    Storage.saveSession(retrySession);
    return retrySession;
  }

  function handleAnswer(session, cardId, selectedAnswer) {
    const question = buildMultipleChoiceQuestion(cardId, session);
    const correct = normalizedAnswer(selectedAnswer) === normalizedAnswer(question.correctAnswer);
    const quality = SM2.qualityFromCorrect(correct);

    let card = Storage.getCard(cardId);
    if (!card) card = Storage.initCard(cardId);

    const difficultyMultiplier = { easy: 1.3, hard: 0.7, auto: 1 }[Storage.getSettings().difficulty] || 1;
    const updated = SM2.calculate(
      quality, card.repetitions, card.easeFactor, card.interval, difficultyMultiplier
    );
    const guidedCorrect = getGuidedCorrect(card);
    const nextGuidedCorrect = correct
      ? Math.min(GUIDED_CORRECT_TO_GRADUATE, guidedCorrect + 1)
      : Math.max(0, guidedCorrect - 1);
    Storage.upsertCard(cardId, {
      ...updated,
      lastReviewedAt: Date.now(),
      introducedAt: card.introducedAt || (card.totalAttempts === 0 ? Date.now() : null),
      totalAttempts: (card.totalAttempts || 0) + 1,
      totalCorrect: (card.totalCorrect || 0) + (correct ? 1 : 0),
      guidedCorrect: nextGuidedCorrect,
      typedAttempts: (card.typedAttempts || 0) + (question.answerMode === 'typed' ? 1 : 0),
      typedCorrect: (card.typedCorrect || 0) + (question.answerMode === 'typed' && correct ? 1 : 0),
    });

    Storage.appendReview({
      timestamp: Date.now(),
      cardId,
      quality,
      correct,
      answerMode: question.answerMode,
      newInterval: updated.interval,
      sessionId: session.sessionId,
    });

    const row = getConjugation(question.infinitive, question.mood, question.tense);
    question.explanation = buildExplanation(
      row, question.form, question.infinitive, question.tense, question.mood, selectedAnswer
    );

    const newSession = {
      ...session,
      currentIndex: session.currentIndex + 1,
      results: [...session.results, {
        cardId, correct, quality, selectedAnswer, correctAnswer: question.correctAnswer,
        round: session.isRetryRound ? 'retry' : 'main',
      }],
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
            ${session.isRetryRound
              ? '<span class="question-mode">Quick retry</span>'
              : question.isIntroduction
              ? `<span class="question-tense">Learning: ${question.prompt.tense_english}</span>`
              : `<span class="question-mode">${question.answerMode === 'typed' ? 'Recall practice' : 'Guided practice'}</span>`}
            ${session.isMixed ? '<span class="question-mixed">Mixed tenses</span>' : ''}
          </div>

          <div class="question-verb">
            <div class="verb-headline">
              <span class="verb-infinitive-lg">${question.prompt.infinitive}</span>
              <span class="verb-pronoun-inline">(${question.prompt.pronoun})</span>
            </div>
            ${question.answerMode === 'guided' ? `<span class="verb-english-sm">${question.prompt.english}</span>` : ''}
          </div>

          <p class="question-instruction">${question.answerMode === 'typed' ? 'Type the conjugation:' : 'Choose the correct conjugation:'}</p>
          <div class="sentence-context">
            <p class="sentence-context-es">${question.context.es}</p>
            <button class="translation-toggle" id="btn-context-translation" type="button">Show English</button>
            <p class="sentence-context-en hidden" id="context-translation">${question.context.en}</p>
          </div>

          ${question.answerMode === 'typed' ? `
            <form class="typed-answer-form" id="typed-answer-form" autocomplete="off">
              <input class="typed-answer-input" id="typed-answer-input" name="answer" type="text"
                     inputmode="text" lang="es" autocapitalize="none" autocomplete="off" spellcheck="false"
                     placeholder="Type the Spanish form" aria-label="Type the Spanish conjugation" required>
              <button class="btn btn-primary typed-answer-submit" type="submit">Check answer</button>
              <p class="typed-answer-help">Accents are encouraged, but not required for marking.</p>
            </form>
          ` : `
            <div class="options-grid" id="options-grid">
              ${question.options.map((opt, i) => `
                <button class="option-btn" data-answer="${opt}" data-index="${i}">
                  ${opt}
                </button>
              `).join('')}
            </div>
          `}
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
    const mainResults = getMainRoundResults(session);
    const total = mainResults.length;
    if (total === 0) return renderPracticeScreen();

    const mainCorrect = mainResults.filter(result => result.correct).length;
    const missed = getMissedResults(session);
    const retryResults = session.isRetryRound ? session.results.slice(session.initialResultCount) : [];
    const retryByCardId = new Map(retryResults.map(result => [result.cardId, result]));
    const fixedOnRetry = missed.filter(result => retryByCardId.get(result.cardId)?.correct);
    const stillMissed = session.isRetryRound
      ? missed.filter(result => !retryByCardId.get(result.cardId)?.correct)
      : missed;
    const finalCorrect = mainCorrect + fixedOnRetry.length;
    const initialPct = Math.round((mainCorrect / total) * 100);
    const completionPct = session.isRetryRound
      ? Math.round((finalCorrect / total) * 100)
      : initialPct;
    const duration = Math.round((Date.now() - session.startedAt) / 60000);

    let emoji = '😅';
    if (completionPct >= 90) emoji = '🎉';
    else if (completionPct >= 70) emoji = '👍';
    else if (completionPct >= 50) emoji = '📚';

    if (session.lessonId && completionPct >= 60) {
      Lessons.markLessonComplete(session.lessonId, completionPct / 100);
    }

    const labelFor = result => {
      const [, , tense, form] = result.cardId.split('||');
      const [infinitive] = result.cardId.split('||');
      return `${infinitive} · ${PRONOUN_MAP[form]} · ${tense}`;
    };
    const renderRows = (results, state) => results.map(result => `
      <div class="summary-row ${state}">
        <span class="summary-row-label">${labelFor(result)}</span>
        <span class="summary-row-answer">${result.correctAnswer}</span>
        <span class="summary-mark">${state === 'correct' ? '✓' : '✗'}</span>
      </div>
    `).join('');
    const firstTryCorrect = mainResults.filter(result => result.correct);

    return `
      <div class="screen screen-summary">
        <div class="summary-emoji">${emoji}</div>
        <h1 class="summary-title">${session.isRetryRound ? 'Retry Complete!' : 'Session Complete!'}</h1>
        <div class="summary-score">${session.isRetryRound ? `${fixedOnRetry.length}/${missed.length}` : `${initialPct}%`}</div>
        <p class="summary-detail">${session.isRetryRound
          ? `${fixedOnRetry.length} of ${missed.length} missed forms now correct · ${duration} min total`
          : `${mainCorrect} of ${total} correct on the first try · ${duration} min`}</p>

        <div class="summary-recap">
          <div class="summary-recap-card mastered">
            <span>Correct first time</span>
            <strong>${firstTryCorrect.length}</strong>
          </div>
          <div class="summary-recap-card missed">
            <span>${session.isRetryRound ? 'Still to revisit' : 'Needs a retry'}</span>
            <strong>${stillMissed.length}</strong>
          </div>
        </div>

        ${stillMissed.length ? `
          <section class="summary-section">
            <h2 class="summary-section-title">${session.isRetryRound ? 'Keep an eye on these' : 'Forms to try again'}</h2>
            <div class="summary-breakdown">${renderRows(stillMissed, 'incorrect')}</div>
          </section>
        ` : '<p class="summary-clean-run">✓ No forms left to retry in this session.</p>'}

        ${firstTryCorrect.length ? `
          <details class="summary-mastered">
            <summary>Correct first time (${firstTryCorrect.length})</summary>
            <div class="summary-breakdown">${renderRows(firstTryCorrect, 'correct')}</div>
          </details>
        ` : ''}

        <div class="summary-actions">
          ${!session.isRetryRound && missed.length
            ? `<button class="btn btn-primary" id="btn-retry-missed">Retry ${missed.length} missed ${missed.length === 1 ? 'form' : 'forms'} now</button>`
            : ''}
          <button class="btn btn-primary" id="btn-practice-again">Practice Again</button>
          <button class="btn btn-secondary" id="btn-back-home">Back to Lessons</button>
        </div>
      </div>
    `;
  }

  return {
    shuffle,
    buildMultipleChoiceQuestion, buildCardsForLesson,
    createLessonSession, createReviewSession, createRetrySession, resumeSession,
    getCurrentQuestion, handleAnswer,
    renderPracticeScreen, renderActiveSession, renderSessionSummary,
  };
})();
