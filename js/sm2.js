// Veiksmadridas - SM-2 Spaced Repetition Algorithm
// Based on SuperMemo SM-2: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
const SM2 = (() => {
  // quality: 0–5 (< 3 = fail, >= 3 = pass)
  function calculate(quality, repetitions, easeFactor, interval, intervalMultiplier = 1) {
    let ef = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ef < 1.3) ef = 1.3;

    let reps, intv;
    if (quality < 3) {
      reps = 0;
      intv = 1;
    } else {
      reps = repetitions + 1;
      if (repetitions === 0) intv = 1;
      else if (repetitions === 1) intv = 6;
      else intv = Math.round(interval * ef);
    }

    intv = Math.max(1, Math.round(intv * intervalMultiplier));

    return {
      repetitions: reps,
      easeFactor: parseFloat(ef.toFixed(4)),
      interval: intv,
      nextReviewAt: Date.now() + intv * 86400000,
    };
  }

  // Map correctness to quality score
  function qualityFromCorrect(correct) { return correct ? 4 : 1; }

  function getDueCards(arr) {
    const now = Date.now();
    return arr.filter(c => c.nextReviewAt <= now && c.totalAttempts > 0);
  }

  function getNewCards(arr, limit = 10) {
    return arr.filter(c => c.totalAttempts === 0).slice(0, limit);
  }

  function sortByPriority(cards) {
    const now = Date.now();
    const due = cards.filter(c => c.nextReviewAt <= now && c.repetitions > 0)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
    const newC = cards.filter(c => c.totalAttempts === 0);
    return [...due, ...newC];
  }

  function getStreakDays(reviewLog) {
    if (!reviewLog.length) return 0;
    const days = new Set(reviewLog.map(r => {
      const d = new Date(r.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    let streak = 0;
    const check = new Date();
    check.setHours(23, 59, 59, 999);
    for (let i = 0; i < 365; i++) {
      const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
      if (days.has(key)) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else if (i === 0) {
        check.setDate(check.getDate() - 1); // today may be empty, check yesterday
      } else {
        break;
      }
    }
    return streak;
  }

  function getMasteryLevel(card) {
    if (!card || card.totalAttempts === 0) return 'new';
    if (card.interval >= 21 && card.easeFactor >= 2.5) return 'mastered';
    if (card.interval >= 8) return 'advanced';
    if (card.interval >= 3) return 'intermediate';
    return 'beginner';
  }

  function getMasteryLabel(level) {
    return { new: 'New', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', mastered: 'Mastered' }[level] || 'New';
  }

  function getAccuracy(card) {
    if (!card || card.totalAttempts === 0) return null;
    return Math.round((card.totalCorrect / card.totalAttempts) * 100);
  }

  return { calculate, qualityFromCorrect, getDueCards, getNewCards, sortByPriority, getStreakDays, getMasteryLevel, getMasteryLabel, getAccuracy };
})();
