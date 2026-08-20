'use strict';

const TWO_PI = Math.PI * 2;
const PALETTE = [
  '#e63946', '#f1a208', '#ffd60a', '#2a9d8f', '#457b9d',
  '#8338ec', '#ff006e', '#06d6a0', '#fb5607'
];
const LEVEL_LABELS = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };

const canvas = document.getElementById('wheel-canvas');
const ctx = canvas.getContext('2d');
const wheelWrap = document.getElementById('wheel-wrap');
const spinButton = document.getElementById('spin-btn');
const loadError = document.getElementById('load-error');
const resultPanel = document.getElementById('result-panel');
const resultName = document.getElementById('result-name');
const resultDescription = document.getElementById('result-description');
const resultKeywords = document.getElementById('result-keywords');
const resultIos = document.getElementById('result-ios');
const resultAndroid = document.getElementById('result-android');
const resultDocLink = document.getElementById('result-doc-link');
const resultPracticeLink = document.getElementById('result-practice-link');
const resultExercises = document.getElementById('result-exercises');
const relaunchButton = document.getElementById('relaunch-btn');
const wheelView = document.getElementById('wheel-view');
const listView = document.getElementById('list-view');
const algoList = document.getElementById('algo-list');
const toggleViewButton = document.getElementById('toggle-view-btn');

let algorithms = [];
let currentRotation = 0;
let isSpinning = false;
let currentView = 'wheel';

async function loadAlgorithms() {
  const response = await fetch('algorithms.json');
  if (!response.ok) {
    throw new Error(`Failed to load algorithms.json: ${response.status}`);
  }
  const data = await response.json();
  return data.algorithms;
}

function resizeCanvas() {
  const size = Math.max(260, Math.min(500, wheelWrap.clientWidth));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function truncateLabel(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 1 && context.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

function drawWheel(rotation) {
  const size = canvas.clientWidth;
  const radius = size / 2;
  ctx.clearRect(0, 0, size, size);
  if (!algorithms.length) {
    return;
  }
  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(rotation);
  const sectorAngle = TWO_PI / algorithms.length;
  algorithms.forEach((algo, i) => {
    const startAngle = i * sectorAngle;
    const endAngle = startAngle + sectorAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 4, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fill();

    ctx.save();
    ctx.rotate(startAngle + sectorAngle / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    ctx.font = '600 13px system-ui, sans-serif';
    const label = truncateLabel(ctx, algo.name, radius - 24);
    ctx.fillText(label, radius - 14, 0);
    ctx.restore();
  });
  ctx.restore();
}

const EXTRA_SPINS = 6;
const SPIN_DURATION_MS = 3000;

function normalizeAngle(angle) {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

function computeFinalRotation(fromRotation, winningIndex, sectorCount) {
  const sectorAngle = TWO_PI / sectorCount;
  const pointerAngle = -Math.PI / 2;
  const targetSectorCenter = (winningIndex + 0.5) * sectorAngle;
  const jitter = (Math.random() - 0.5) * sectorAngle * 0.6;
  const targetMod = normalizeAngle(pointerAngle - targetSectorCenter - jitter);
  const currentMod = normalizeAngle(fromRotation);
  let delta = targetMod - currentMod;
  if (delta < 0) {
    delta += TWO_PI;
  }
  return fromRotation + EXTRA_SPINS * TWO_PI + delta;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateSpin(fromRotation, toRotation, duration, onComplete) {
  const startTime = performance.now();
  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);
    currentRotation = fromRotation + (toRotation - fromRotation) * eased;
    drawWheel(currentRotation);
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      currentRotation = toRotation;
      onComplete();
    }
  }
  requestAnimationFrame(frame);
}

function triggerPulse() {
  wheelWrap.classList.add('pulse');
  wheelWrap.addEventListener('animationend', () => {
    wheelWrap.classList.remove('pulse');
  }, { once: true });
}

function handleSpinClick() {
  if (isSpinning || !algorithms.length) {
    return;
  }
  isSpinning = true;
  spinButton.disabled = true;
  hideResultPanel();

  const winningIndex = Math.floor(Math.random() * algorithms.length);
  const fromRotation = currentRotation;
  const toRotation = computeFinalRotation(fromRotation, winningIndex, algorithms.length);

  animateSpin(fromRotation, toRotation, SPIN_DURATION_MS, () => {
    isSpinning = false;
    spinButton.disabled = false;
    triggerPulse();
    showResult(algorithms[winningIndex]);
  });
}

function renderResultLinks(algorithm) {
  if (algorithm.docUrl) {
    resultDocLink.href = algorithm.docUrl;
    resultDocLink.hidden = false;
  } else {
    resultDocLink.hidden = true;
  }
  if (algorithm.practiceUrl) {
    resultPracticeLink.href = algorithm.practiceUrl;
    resultPracticeLink.hidden = false;
  } else {
    resultPracticeLink.hidden = true;
  }
}

function buildLangPanel(lang, code, isActive) {
  const panel = document.createElement('div');
  panel.className = 'lang-panel';
  panel.dataset.lang = lang;
  panel.hidden = !isActive;

  const signature = document.createElement('pre');
  signature.className = 'code-block signature';
  const signatureCode = document.createElement('code');
  signatureCode.textContent = code.signature;
  signature.appendChild(signatureCode);

  const solution = document.createElement('pre');
  solution.className = 'code-block solution';
  solution.hidden = true;
  const solutionCode = document.createElement('code');
  solutionCode.textContent = code.solution;
  solution.appendChild(solutionCode);

  panel.append(signature, solution);
  return panel;
}

function buildExerciseElement(exercise) {
  const details = document.createElement('details');
  details.className = 'exercise';
  details.dataset.level = exercise.level;

  const summary = document.createElement('summary');
  summary.textContent = `${LEVEL_LABELS[exercise.level]} — ${exercise.title}`;
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'exercise-body';

  const statement = document.createElement('p');
  statement.className = 'exercise-statement';
  statement.textContent = exercise.statement;
  body.appendChild(statement);

  const tabs = document.createElement('div');
  tabs.className = 'lang-tabs';
  const swiftTab = document.createElement('button');
  swiftTab.type = 'button';
  swiftTab.className = 'lang-tab active';
  swiftTab.dataset.lang = 'swift';
  swiftTab.textContent = 'Swift';
  const kotlinTab = document.createElement('button');
  kotlinTab.type = 'button';
  kotlinTab.className = 'lang-tab';
  kotlinTab.dataset.lang = 'kotlin';
  kotlinTab.textContent = 'Kotlin';
  tabs.append(swiftTab, kotlinTab);
  body.appendChild(tabs);

  body.appendChild(buildLangPanel('swift', exercise.swift, true));
  body.appendChild(buildLangPanel('kotlin', exercise.kotlin, false));

  const tests = document.createElement('div');
  tests.className = 'exercise-tests';
  exercise.tests.forEach((test) => {
    const line = document.createElement('p');
    line.className = 'exercise-test';
    const input = document.createElement('code');
    input.textContent = test.input;
    const output = document.createElement('code');
    output.textContent = test.output;
    line.append(input, ' → ', output);
    tests.appendChild(line);
  });
  body.appendChild(tests);

  const revealBtn = document.createElement('button');
  revealBtn.type = 'button';
  revealBtn.className = 'reveal-btn';
  revealBtn.textContent = 'Révéler la solution';
  body.appendChild(revealBtn);

  details.appendChild(body);
  return details;
}

function renderExercises(exercises) {
  resultExercises.replaceChildren(...exercises.map(buildExerciseElement));
}

function handleExercisesClick(event) {
  const tab = event.target.closest('.lang-tab');
  if (tab) {
    const exercise = tab.closest('.exercise');
    const lang = tab.dataset.lang;
    exercise.querySelectorAll('.lang-tab').forEach((btn) => {
      btn.classList.toggle('active', btn === tab);
    });
    exercise.querySelectorAll('.lang-panel').forEach((panel) => {
      panel.hidden = panel.dataset.lang !== lang;
    });
    return;
  }

  const revealBtn = event.target.closest('.reveal-btn');
  if (revealBtn) {
    const exercise = revealBtn.closest('.exercise');
    const revealed = exercise.classList.toggle('solution-revealed');
    exercise.querySelectorAll('.code-block.solution').forEach((solution) => {
      solution.hidden = !revealed;
    });
    revealBtn.textContent = revealed ? 'Masquer la solution' : 'Révéler la solution';
  }
}

function showResult(algorithm) {
  resultName.textContent = algorithm.name;
  resultDescription.textContent = algorithm.fullDescription;
  resultKeywords.replaceChildren(
    ...algorithm.keywords.map((keyword) => {
      const pill = document.createElement('span');
      pill.className = 'keyword-pill';
      pill.textContent = keyword;
      return pill;
    })
  );
  resultIos.textContent = algorithm.ios;
  resultAndroid.textContent = algorithm.android;
  renderResultLinks(algorithm);
  renderExercises(algorithm.exercises);
  relaunchButton.textContent = currentView === 'list' ? 'Fermer' : 'Relancer';
  resultPanel.hidden = false;
}

function hideResultPanel() {
  resultPanel.hidden = true;
}

function renderAlgorithmList() {
  algoList.replaceChildren(
    ...algorithms.map((algo, i) => {
      const item = document.createElement('li');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'algo-list-item';
      button.addEventListener('click', () => showResult(algo));

      const swatch = document.createElement('span');
      swatch.className = 'algo-list-swatch';
      swatch.style.backgroundColor = PALETTE[i % PALETTE.length];

      const name = document.createElement('span');
      name.className = 'algo-list-name';
      name.textContent = algo.name;

      const summary = document.createElement('span');
      summary.className = 'algo-list-summary';
      summary.textContent = algo.summary;

      button.append(swatch, name, summary);
      item.appendChild(button);
      return item;
    })
  );
}

function showListView() {
  currentView = 'list';
  wheelView.hidden = true;
  listView.hidden = false;
  toggleViewButton.textContent = '🎡 Voir la roue';
}

function showWheelView() {
  currentView = 'wheel';
  listView.hidden = true;
  wheelView.hidden = false;
  toggleViewButton.textContent = '📋 Voir la liste';
  resizeCanvas();
  drawWheel(currentRotation);
}

function handleToggleViewClick() {
  if (currentView === 'wheel') {
    showListView();
  } else {
    showWheelView();
  }
}

function showLoadError() {
  loadError.hidden = false;
  spinButton.disabled = true;
  toggleViewButton.disabled = true;
}

async function init() {
  try {
    algorithms = await loadAlgorithms();
  } catch (err) {
    showLoadError();
    return;
  }
  resizeCanvas();
  drawWheel(currentRotation);
  renderAlgorithmList();
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawWheel(currentRotation);
  });
  spinButton.addEventListener('click', handleSpinClick);
  relaunchButton.addEventListener('click', hideResultPanel);
  toggleViewButton.addEventListener('click', handleToggleViewClick);
  resultExercises.addEventListener('click', handleExercisesClick);
}

init();
