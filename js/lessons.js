// Veiksmadridas - Lesson Content & Rendering

const Lessons = (() => {

  // Curriculum definition — ordered, each unlocks the next
  const CURRICULUM = [
    {
      id: 'Indicativo||Presente',
      mood: 'Indicativo', tense: 'Presente',
      title: 'Present Tense', subtitle: 'El Presente de Indicativo',
      icon: '🔵', color: '#3b82f6',
      order: 1, unlockRequires: null,
      verbSet: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'ir', 'tener', 'hacer', 'poder', 'querer'],
    },
    {
      id: 'Indicativo||Pretérito',
      mood: 'Indicativo', tense: 'Pretérito',
      title: 'Preterite Tense', subtitle: 'El Pretérito Indefinido',
      icon: '🟤', color: '#92400e',
      order: 2, unlockRequires: 'Indicativo||Presente',
      verbSet: ['hablar', 'comer', 'ir', 'ser', 'tener', 'hacer', 'poder', 'estar'],
    },
    {
      id: 'Indicativo||Imperfecto',
      mood: 'Indicativo', tense: 'Imperfecto',
      title: 'Imperfect Tense', subtitle: 'El Pretérito Imperfecto',
      icon: '🟠', color: '#d97706',
      order: 3, unlockRequires: 'Indicativo||Pretérito',
      verbSet: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'ir', 'tener', 'hacer'],
    },
    {
      id: 'Indicativo||Futuro',
      mood: 'Indicativo', tense: 'Futuro',
      title: 'Future Tense', subtitle: 'El Futuro Simple',
      icon: '🟡', color: '#eab308',
      order: 4, unlockRequires: 'Indicativo||Imperfecto',
      verbSet: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'ir', 'tener', 'hacer', 'poder', 'salir'],
    },
    {
      id: 'Indicativo||Condicional',
      mood: 'Indicativo', tense: 'Condicional',
      title: 'Conditional Tense', subtitle: 'El Condicional Simple',
      icon: '🟢', color: '#22c55e',
      order: 5, unlockRequires: 'Indicativo||Futuro',
      verbSet: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'ir', 'tener', 'hacer', 'poder', 'salir'],
    },
    {
      id: 'Subjuntivo||Presente',
      mood: 'Subjuntivo', tense: 'Presente',
      title: 'Present Subjunctive', subtitle: 'El Presente de Subjuntivo',
      icon: '🟣', color: '#a855f7',
      order: 6, unlockRequires: 'Indicativo||Condicional',
      verbSet: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'ir', 'tener', 'hacer'],
    },
    {
      id: 'Subjuntivo||Imperfecto',
      mood: 'Subjuntivo', tense: 'Imperfecto',
      title: 'Imperfect Subjunctive', subtitle: 'El Imperfecto de Subjuntivo',
      icon: '🔴', color: '#ef4444',
      order: 7, unlockRequires: 'Subjuntivo||Presente',
      verbSet: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'ir', 'tener', 'hacer'],
    },
    {
      id: 'Imperativo||Afirmativo',
      mood: 'Imperativo Afirmativo', tense: 'Presente',
      title: 'Imperative', subtitle: 'El Imperativo',
      icon: '⚡', color: '#f97316',
      order: 8, unlockRequires: 'Subjuntivo||Imperfecto',
      verbSet: ['hablar', 'comer', 'vivir', 'ser', 'estar', 'ir', 'tener', 'hacer'],
    },
  ];

  // Rich lesson content per tense
  const CONTENT = {
    'Indicativo||Presente': {
      summary: 'The present tense describes current actions, habits, and universal truths. It\'s the most used tense in Spanish — master this first.',
      body: `
<h3>When to Use the Present Tense</h3>
<p>The Spanish present tense (<em>presente de indicativo</em>) covers more ground than its English counterpart. Use it for:</p>
<ul>
  <li><strong>Current actions:</strong> <em>Yo hablo español.</em> — I speak Spanish.</li>
  <li><strong>Habitual actions:</strong> <em>Ella trabaja todos los días.</em> — She works every day.</li>
  <li><strong>General truths:</strong> <em>El sol sale por el este.</em> — The sun rises in the east.</li>
  <li><strong>Near future (with time marker):</strong> <em>Mañana voy al médico.</em> — Tomorrow I'm going to the doctor.</li>
  <li><strong>Historical present:</strong> <em>En 1492, Colón llega a América.</em> — In 1492, Columbus arrives in America.</li>
</ul>

<h3>Regular Conjugation Rules</h3>
<p>Drop the infinitive ending (-ar, -er, -ir) and add the appropriate ending:</p>

<table class="grammar-table">
  <thead><tr><th>Pronoun</th><th>-AR (hablar)</th><th>-ER (comer)</th><th>-IR (vivir)</th></tr></thead>
  <tbody>
    <tr><td>yo</td><td>habl<strong>o</strong></td><td>com<strong>o</strong></td><td>viv<strong>o</strong></td></tr>
    <tr><td>tú</td><td>habl<strong>as</strong></td><td>com<strong>es</strong></td><td>viv<strong>es</strong></td></tr>
    <tr><td>él/ella</td><td>habl<strong>a</strong></td><td>com<strong>e</strong></td><td>viv<strong>e</strong></td></tr>
    <tr><td>nosotros</td><td>habl<strong>amos</strong></td><td>com<strong>emos</strong></td><td>viv<strong>imos</strong></td></tr>
    <tr><td>vosotros</td><td>habl<strong>áis</strong></td><td>com<strong>éis</strong></td><td>viv<strong>ís</strong></td></tr>
    <tr><td>ellos/ellas</td><td>habl<strong>an</strong></td><td>com<strong>en</strong></td><td>viv<strong>en</strong></td></tr>
  </tbody>
</table>

<h3>Key Shortcuts & Tips</h3>
<ul>
  <li><strong>Yo is unique:</strong> The -o ending for <em>yo</em> is consistent across ALL regular verbs (hablo, como, vivo). Even many irregulars follow this (tengo, hago, vengo).</li>
  <li><strong>-ER and -IR are almost identical:</strong> Only nosotros and vosotros differ (-emos/-éis vs. -imos/-ís).</li>
  <li><strong>Accent on vosotros:</strong> -áis, -éis, -ís always carry a written accent in the present.</li>
</ul>

<h3>Common Mistakes</h3>
<ul>
  <li>❌ <em>Ella habla mucho ayer</em> — Don't use present for completed past actions. Use preterite.</li>
  <li>❌ <em>Yo estoy trabajar</em> — In Spanish, the progressive requires the gerund: <em>estoy trabajando</em>.</li>
  <li>✓ Remember: Spanish doesn't need "do/does" — <em>¿Hablas español?</em> = Do you speak Spanish?</li>
</ul>

<h3>Timeline Position</h3>
<p>The present tense sits at the center of the timeline — it's where you are right now. Think of it as your anchor point for all other tenses.</p>
      `,
      timelineNote: 'NOW — actions happening at this moment or regularly',
      examples: [
        { es: 'Yo hablo español todos los días.', en: 'I speak Spanish every day.' },
        { es: '¿Dónde vives tú?', en: 'Where do you live?' },
        { es: 'Nosotros comemos a las dos.', en: 'We eat at two o\'clock.' },
        { es: 'Ellos no tienen tiempo.', en: 'They don\'t have time.' },
      ],
    },
    'Indicativo||Pretérito': {
      summary: 'The preterite expresses completed past actions at a specific time. Think of it as a photograph — a moment frozen in time.',
      body: `
<h3>When to Use the Preterite</h3>
<p>The <em>pretérito indefinido</em> describes actions that were completed at a specific point in the past. It answers "what happened?"</p>
<ul>
  <li><strong>Single completed action:</strong> <em>Ayer comí una pizza.</em> — Yesterday I ate a pizza.</li>
  <li><strong>Actions with clear beginning/end:</strong> <em>Viví en Madrid dos años.</em> — I lived in Madrid for two years.</li>
  <li><strong>Series of events:</strong> <em>Me levanté, me duché y desayuné.</em> — I got up, showered, and had breakfast.</li>
  <li><strong>Interrupting action:</strong> <em>Sonó el teléfono cuando comía.</em> — The phone rang while I was eating.</li>
</ul>

<h3>Regular Conjugation Rules</h3>
<table class="grammar-table">
  <thead><tr><th>Pronoun</th><th>-AR (hablar)</th><th>-ER/-IR (comer/vivir)</th></tr></thead>
  <tbody>
    <tr><td>yo</td><td>habl<strong>é</strong></td><td>com<strong>í</strong></td></tr>
    <tr><td>tú</td><td>habl<strong>aste</strong></td><td>com<strong>iste</strong></td></tr>
    <tr><td>él/ella</td><td>habl<strong>ó</strong></td><td>com<strong>ió</strong></td></tr>
    <tr><td>nosotros</td><td>habl<strong>amos</strong></td><td>com<strong>imos</strong></td></tr>
    <tr><td>vosotros</td><td>habl<strong>asteis</strong></td><td>com<strong>isteis</strong></td></tr>
    <tr><td>ellos/ellas</td><td>habl<strong>aron</strong></td><td>com<strong>ieron</strong></td></tr>
  </tbody>
</table>

<h3>Key Time Markers</h3>
<p>These words signal the preterite:</p>
<ul>
  <li><em>ayer</em> (yesterday), <em>anteayer</em> (the day before yesterday)</li>
  <li><em>la semana pasada</em> (last week), <em>el mes pasado</em> (last month)</li>
  <li><em>hace [time]</em> (ago): <em>Hace dos horas comí.</em> — I ate two hours ago.</li>
  <li><em>de repente</em> (suddenly), <em>entonces</em> (then)</li>
</ul>

<h3>Common Mistakes</h3>
<ul>
  <li>❌ Confusing with imperfect: preterite = completed action, imperfect = background/ongoing state.</li>
  <li>❌ Forgetting accents: <em>hablé</em> (I spoke) vs. <em>hable</em> (subjunctive).</li>
  <li>✓ -ER/-IR share the SAME endings in the preterite — only one set to learn!</li>
</ul>
      `,
      timelineNote: 'PAST — completed action at a specific moment',
      examples: [
        { es: 'Ayer fui al mercado.', en: 'Yesterday I went to the market.' },
        { es: 'Ella habló con su madre.', en: 'She spoke with her mother.' },
        { es: '¿Qué comiste anoche?', en: 'What did you eat last night?' },
      ],
    },
    'Indicativo||Imperfecto': {
      summary: 'The imperfect describes ongoing past states, habitual past actions, and background settings. Think of it as a video playing in the past.',
      body: `
<h3>When to Use the Imperfect</h3>
<p>The <em>pretérito imperfecto</em> paints the background of past stories. Use it for:</p>
<ul>
  <li><strong>Habitual past actions:</strong> <em>De niño, comía mucho.</em> — As a child, I used to eat a lot.</li>
  <li><strong>Ongoing past states:</strong> <em>Era muy tarde.</em> — It was very late.</li>
  <li><strong>Background descriptions:</strong> <em>Llovía cuando salí.</em> — It was raining when I left.</li>
  <li><strong>Age, time, feelings in the past:</strong> <em>Tenía veinte años.</em> — I was twenty years old.</li>
</ul>

<h3>Regular Conjugation Rules</h3>
<table class="grammar-table">
  <thead><tr><th>Pronoun</th><th>-AR (hablar)</th><th>-ER/-IR (comer/vivir)</th></tr></thead>
  <tbody>
    <tr><td>yo</td><td>habl<strong>aba</strong></td><td>com<strong>ía</strong></td></tr>
    <tr><td>tú</td><td>habl<strong>abas</strong></td><td>com<strong>ías</strong></td></tr>
    <tr><td>él/ella</td><td>habl<strong>aba</strong></td><td>com<strong>ía</strong></td></tr>
    <tr><td>nosotros</td><td>habl<strong>ábamos</strong></td><td>com<strong>íamos</strong></td></tr>
    <tr><td>vosotros</td><td>habl<strong>abais</strong></td><td>com<strong>íais</strong></td></tr>
    <tr><td>ellos/ellas</td><td>habl<strong>aban</strong></td><td>com<strong>ían</strong></td></tr>
  </tbody>
</table>

<h3>Only 3 Irregular Verbs</h3>
<p>The imperfect is the most regular tense in Spanish — only 3 irregular verbs:</p>
<ul>
  <li><strong>ser:</strong> era, eras, era, éramos, erais, eran</li>
  <li><strong>ir:</strong> iba, ibas, iba, íbamos, ibais, iban</li>
  <li><strong>ver:</strong> veía, veías, veía, veíamos, veíais, veían</li>
</ul>
      `,
      timelineNote: 'PAST — ongoing state or habitual action (background)',
      examples: [
        { es: 'Cuando era joven, jugaba al fútbol.', en: 'When I was young, I used to play football.' },
        { es: 'Llovía mucho ese día.', en: 'It was raining a lot that day.' },
      ],
    },
    'Indicativo||Futuro': {
      summary: 'The future tense expresses what will happen. It also expresses probability or conjecture about the present.',
      body: `
<h3>When to Use the Future</h3>
<ul>
  <li><strong>Future events:</strong> <em>Mañana hablaré con ella.</em> — Tomorrow I will talk to her.</li>
  <li><strong>Probability/conjecture:</strong> <em>¿Dónde estará Juan?</em> — Where could Juan be?</li>
  <li><strong>Promises:</strong> <em>Te llamaré esta noche.</em> — I will call you tonight.</li>
</ul>

<h3>Regular Conjugation Rules</h3>
<p>The future uses the <strong>full infinitive</strong> as the stem — just add the endings:</p>
<table class="grammar-table">
  <thead><tr><th>Pronoun</th><th>Ending</th><th>hablar</th></tr></thead>
  <tbody>
    <tr><td>yo</td><td>-é</td><td>hablar<strong>é</strong></td></tr>
    <tr><td>tú</td><td>-ás</td><td>hablar<strong>ás</strong></td></tr>
    <tr><td>él/ella</td><td>-á</td><td>hablar<strong>á</strong></td></tr>
    <tr><td>nosotros</td><td>-emos</td><td>hablar<strong>emos</strong></td></tr>
    <tr><td>vosotros</td><td>-éis</td><td>hablar<strong>éis</strong></td></tr>
    <tr><td>ellos/ellas</td><td>-án</td><td>hablar<strong>án</strong></td></tr>
  </tbody>
</table>
<p>The same endings apply to <em>comer</em> → comer<strong>é</strong>, <em>vivir</em> → vivir<strong>é</strong>.</p>
      `,
      timelineNote: 'FUTURE — actions that will happen',
      examples: [
        { es: 'Mañana estudiaré todo el día.', en: 'Tomorrow I will study all day.' },
        { es: '¿Vendrás a la fiesta?', en: 'Will you come to the party?' },
      ],
    },
    'Indicativo||Condicional': {
      summary: 'The conditional expresses what would happen under certain conditions. Essential for polite requests and hypotheticals.',
      body: `
<h3>When to Use the Conditional</h3>
<ul>
  <li><strong>Hypotheticals:</strong> <em>Con más tiempo, aprendería chino.</em> — With more time, I would learn Chinese.</li>
  <li><strong>Polite requests:</strong> <em>¿Podría ayudarme?</em> — Could you help me?</li>
  <li><strong>Future in the past:</strong> <em>Dijo que vendría.</em> — He said he would come.</li>
</ul>

<h3>Conjugation</h3>
<p>Same irregular stems as the future, with these endings:</p>
<table class="grammar-table">
  <thead><tr><th>Pronoun</th><th>Ending</th><th>hablar</th></tr></thead>
  <tbody>
    <tr><td>yo</td><td>-ía</td><td>hablar<strong>ía</strong></td></tr>
    <tr><td>tú</td><td>-ías</td><td>hablar<strong>ías</strong></td></tr>
    <tr><td>él/ella</td><td>-ía</td><td>hablar<strong>ía</strong></td></tr>
    <tr><td>nosotros</td><td>-íamos</td><td>hablar<strong>íamos</strong></td></tr>
    <tr><td>vosotros</td><td>-íais</td><td>hablar<strong>íais</strong></td></tr>
    <tr><td>ellos/ellas</td><td>-ían</td><td>hablar<strong>ían</strong></td></tr>
  </tbody>
</table>
      `,
      timelineNote: 'CONDITIONAL — what would happen',
      examples: [
        { es: '¿Me ayudarías?', en: 'Would you help me?' },
        { es: 'Iría, pero tengo trabajo.', en: 'I would go, but I have work.' },
      ],
    },
    'Subjuntivo||Presente': {
      summary: 'The present subjunctive expresses doubt, emotion, desire, and hypothetical situations. It follows trigger phrases like "quiero que" and "es importante que".',
      body: `
<h3>When to Use the Present Subjunctive</h3>
<p>The subjunctive is not a tense but a <em>mood</em> — it expresses subjectivity. Triggers include:</p>
<ul>
  <li><strong>Wishes/desires:</strong> <em>Quiero que vengas.</em> — I want you to come.</li>
  <li><strong>Doubt/denial:</strong> <em>No creo que sea verdad.</em> — I don't think it's true.</li>
  <li><strong>Emotion:</strong> <em>Me alegra que estés aquí.</em> — I'm glad you're here.</li>
  <li><strong>Impersonal expressions:</strong> <em>Es importante que estudies.</em> — It's important that you study.</li>
</ul>

<h3>Formation: "GOES" Rule</h3>
<p>Take the <em>yo</em> form of the present, drop the -o, add opposite endings (-ar verbs get -e endings, -er/-ir verbs get -a endings):</p>
<table class="grammar-table">
  <thead><tr><th>Pronoun</th><th>hablar</th><th>comer</th><th>vivir</th></tr></thead>
  <tbody>
    <tr><td>yo</td><td>habl<strong>e</strong></td><td>com<strong>a</strong></td><td>viv<strong>a</strong></td></tr>
    <tr><td>tú</td><td>habl<strong>es</strong></td><td>com<strong>as</strong></td><td>viv<strong>as</strong></td></tr>
    <tr><td>él/ella</td><td>habl<strong>e</strong></td><td>com<strong>a</strong></td><td>viv<strong>a</strong></td></tr>
    <tr><td>nosotros</td><td>habl<strong>emos</strong></td><td>com<strong>amos</strong></td><td>viv<strong>amos</strong></td></tr>
    <tr><td>vosotros</td><td>habl<strong>éis</strong></td><td>com<strong>áis</strong></td><td>viv<strong>áis</strong></td></tr>
    <tr><td>ellos/ellas</td><td>habl<strong>en</strong></td><td>com<strong>an</strong></td><td>viv<strong>an</strong></td></tr>
  </tbody>
</table>
      `,
      timelineNote: 'PRESENT — subjective/hypothetical present situations',
      examples: [
        { es: 'Espero que llegues a tiempo.', en: 'I hope you arrive on time.' },
        { es: 'Es necesario que practiques.', en: 'It\'s necessary that you practice.' },
      ],
    },
    'Subjuntivo||Imperfecto': {
      summary: 'The imperfect subjunctive expresses past hypotheticals, wishes, and doubts. Essential for "si" clauses (if-then statements).',
      body: `
<h3>When to Use the Imperfect Subjunctive</h3>
<ul>
  <li><strong>Past wishes/doubts:</strong> <em>Quería que vinieras.</em> — I wanted you to come.</li>
  <li><strong>Hypothetical "si" clauses:</strong> <em>Si tuviera dinero, viajaría.</em> — If I had money, I would travel.</li>
  <li><strong>Polite wishes:</strong> <em>Quisiera un café.</em> — I would like a coffee.</li>
</ul>

<h3>Formation</h3>
<p>Take the 3rd person plural preterite, drop -ron, add endings:</p>
<table class="grammar-table">
  <thead><tr><th>Pronoun</th><th>hablar (-ara)</th><th>comer (-iera)</th></tr></thead>
  <tbody>
    <tr><td>yo</td><td>habl<strong>ara</strong></td><td>com<strong>iera</strong></td></tr>
    <tr><td>tú</td><td>habl<strong>aras</strong></td><td>com<strong>ieras</strong></td></tr>
    <tr><td>él/ella</td><td>habl<strong>ara</strong></td><td>com<strong>iera</strong></td></tr>
    <tr><td>nosotros</td><td>habl<strong>áramos</strong></td><td>com<strong>iéramos</strong></td></tr>
    <tr><td>vosotros</td><td>habl<strong>arais</strong></td><td>com<strong>ierais</strong></td></tr>
    <tr><td>ellos/ellas</td><td>habl<strong>aran</strong></td><td>com<strong>ieran</strong></td></tr>
  </tbody>
</table>
      `,
      timelineNote: 'PAST — past hypotheticals and si-clauses',
      examples: [
        { es: 'Si pudiera, te ayudaría.', en: 'If I could, I would help you.' },
        { es: 'Quería que hablaras más despacio.', en: 'I wanted you to speak more slowly.' },
      ],
    },
    'Imperativo||Afirmativo': {
      summary: 'The imperative gives commands and instructions. Different forms for tú, usted, nosotros, vosotros, and ustedes.',
      body: `
<h3>When to Use the Imperative</h3>
<ul>
  <li><strong>Commands:</strong> <em>¡Habla más despacio!</em> — Speak more slowly!</li>
  <li><strong>Instructions:</strong> <em>Tome la primera calle a la derecha.</em> — Take the first street on the right.</li>
  <li><strong>Suggestions (nosotros):</strong> <em>¡Comamos juntos!</em> — Let's eat together!</li>
</ul>

<h3>Formation</h3>
<table class="grammar-table">
  <thead><tr><th>Person</th><th>hablar</th><th>comer</th><th>vivir</th></tr></thead>
  <tbody>
    <tr><td>tú</td><td>habl<strong>a</strong></td><td>com<strong>e</strong></td><td>viv<strong>e</strong></td></tr>
    <tr><td>él/usted</td><td>habl<strong>e</strong></td><td>com<strong>a</strong></td><td>viv<strong>a</strong></td></tr>
    <tr><td>nosotros</td><td>habl<strong>emos</strong></td><td>com<strong>amos</strong></td><td>viv<strong>amos</strong></td></tr>
    <tr><td>vosotros</td><td>habl<strong>ad</strong></td><td>com<strong>ed</strong></td><td>viv<strong>id</strong></td></tr>
    <tr><td>ellos/ustedes</td><td>habl<strong>en</strong></td><td>com<strong>an</strong></td><td>viv<strong>an</strong></td></tr>
  </tbody>
</table>
      `,
      timelineNote: 'COMMAND — direct instructions to others',
      examples: [
        { es: '¡Habla con ella!', en: 'Talk to her!' },
        { es: 'Come más verduras.', en: 'Eat more vegetables.' },
      ],
    },
  };

  const PRONOUN_MAP = {
    form_1s: 'yo', form_2s: 'tú', form_3s: 'él/ella',
    form_1p: 'nosotros', form_2p: 'vosotros', form_3p: 'ellos/ellas',
  };

  function getLessonById(id) {
    return CURRICULUM.find(l => l.id === id);
  }

  function isUnlocked(lessonId) {
    const lesson = getLessonById(lessonId);
    if (!lesson || !lesson.unlockRequires) return true;
    const req = Storage.getLessonStatus(lesson.unlockRequires);
    return req && req.status === 'completed';
  }

  function getLessonCompletion(lessonId) {
    return Storage.getLessonStatus(lessonId);
  }

  function renderConjugationTable(infinitive, mood, tense) {
    const row = getConjugation(infinitive, mood, tense);
    if (!row) return `<p class="no-data">No data for ${infinitive} ${tense}</p>`;
    const settings = Storage.getSettings();
    const forms = ['form_1s','form_2s','form_3s','form_1p'];
    if (settings.showVosotros) forms.push('form_2p');
    forms.push('form_3p');

    return `
      <div class="verb-card">
        <div class="verb-card-header">
          <span class="verb-infinitive">${infinitive}</span>
          <span class="verb-english">${row.infinitive_english}</span>
        </div>
        <table class="conjugation-table">
          ${forms.map(f => `
            <tr>
              <td class="pronoun">${PRONOUN_MAP[f]}</td>
              <td class="form">${row[f] || '—'}</td>
            </tr>
          `).join('')}
        </table>
        <div class="verb-meta">
          <span class="meta-pill">gerund: ${row.gerund}</span>
          <span class="meta-pill">pp: ${row.pastparticiple}</span>
        </div>
      </div>
    `;
  }

  function renderLessonsScreen() {
    return `
      <div class="screen">
        <div class="screen-header">
          <h1>Lessons</h1>
          <p class="screen-subtitle">Build your knowledge tense by tense</p>
        </div>
        <div class="lesson-list">
          ${CURRICULUM.map(lesson => renderLessonCard(lesson)).join('')}
        </div>
      </div>
    `;
  }

  function renderLessonCard(lesson) {
    const unlocked = isUnlocked(lesson.id);
    const stored = Storage.getLessonStatus(lesson.id);
    const completed = stored && stored.status === 'completed';
    const cls = completed ? 'lesson-card completed' : unlocked ? 'lesson-card available' : 'lesson-card locked';

    let badge = '';
    if (completed) badge = '<span class="lesson-badge done">✓ Done</span>';
    else if (!unlocked) badge = '<span class="lesson-badge locked">🔒</span>';
    else badge = '<span class="lesson-badge new">Start</span>';

    return `
      <div class="${cls}" data-lesson-id="${lesson.id}" ${unlocked ? 'role="button" tabindex="0"' : ''}>
        <div class="lesson-icon" style="background:${lesson.color}20;color:${lesson.color}">${lesson.icon}</div>
        <div class="lesson-info">
          <div class="lesson-title">${lesson.title}</div>
          <div class="lesson-subtitle">${lesson.subtitle}</div>
        </div>
        ${badge}
      </div>
    `;
  }

  function renderLessonDetail(lessonId) {
    const lesson = getLessonById(lessonId);
    if (!lesson) return '<div class="screen"><p>Lesson not found.</p></div>';
    const content = CONTENT[lessonId] || {};
    const unlocked = isUnlocked(lessonId);

    const tables = lesson.verbSet.map(v => renderConjugationTable(v, lesson.mood, lesson.tense)).join('');

    const examples = (content.examples || []).map(ex => `
      <div class="example-row">
        <div class="example-es">${ex.es}</div>
        <div class="example-en">${ex.en}</div>
      </div>
    `).join('');

    return `
      <div class="screen">
        <div class="lesson-detail-header" style="border-left:4px solid ${lesson.color}">
          <button class="back-btn" id="btn-back-lessons">← Lessons</button>
          <div class="lesson-detail-title">
            <span class="lesson-icon-lg">${lesson.icon}</span>
            <div>
              <h1>${lesson.title}</h1>
              <p class="lesson-detail-subtitle">${lesson.subtitle}</p>
            </div>
          </div>
          ${content.summary ? `<p class="lesson-summary">${content.summary}</p>` : ''}
          ${content.timelineNote ? `<div class="timeline-note" style="border-color:${lesson.color}">${content.timelineNote}</div>` : ''}
        </div>

        ${content.body ? `<div class="lesson-body">${content.body}</div>` : ''}

        ${examples ? `
          <div class="lesson-section">
            <h2 class="section-title">Example Sentences</h2>
            <div class="examples-list">${examples}</div>
          </div>
        ` : ''}

        <div class="lesson-section">
          <h2 class="section-title">Conjugation Tables</h2>
          <p class="section-note">Key verbs for this tense:</p>
          <div class="verb-tables">${tables}</div>
        </div>

        ${unlocked ? `
          <div class="lesson-cta">
            <button class="btn btn-primary btn-lg" id="btn-start-lesson-practice" data-lesson-id="${lessonId}">
              Practice This Tense →
            </button>
          </div>
        ` : '<p class="locked-note">Complete the previous lesson to unlock practice.</p>'}
      </div>
    `;
  }

  function markLessonComplete(lessonId, score) {
    Storage.updateLesson(lessonId, {
      status: 'completed',
      completedAt: Date.now(),
      bestScore: score,
    });
  }

  return {
    CURRICULUM, CONTENT, PRONOUN_MAP,
    getLessonById, isUnlocked, getLessonCompletion,
    renderConjugationTable, renderLessonsScreen, renderLessonDetail,
    markLessonComplete,
  };
})();
