import '@fortawesome/fontawesome-free/css/all.min.css';
import { getI18n } from './i18n';
import './style.css';

type DictionaryPayload = Record<string, number> | string[];
type SearchMode = 'regex' | 'wordle';
type CellState = 'none' | 'collect' | 'present' | 'absent';

type WordleCell = {
  letter: string;
  state: CellState;
};

const DEFAULT_PATTERN = '^.....$';
const LANGUAGE_STORAGE_KEY = 'word-search-language';
const RESULT_PAGE_SIZE = 100;
const WORDLE_ROWS = 6;
const WORDLE_COLS = 5;
const MARKED_STATE_CYCLE: CellState[] = ['collect', 'present', 'absent'];

const getDictionaryUrl = (): string => {
  const dictionaryUrl = import.meta.env.VITE_DICTIONARY_URL;
  if (!dictionaryUrl) {
    return 'base_dictionary.json';
  }

  try {
    return new URL(dictionaryUrl).toString();
  } catch {
    return dictionaryUrl;
  }
};

const getInitialLocale = () =>
  window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || navigator.language;

let { copy, numberFormatter } = getI18n(getInitialLocale());

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element was not found.');
}

const wordleGridMarkup = Array.from({ length: WORDLE_ROWS }, (_, row) => {
  const cells = Array.from(
    { length: WORDLE_COLS },
    (_, col) =>
      `<button type="button" class="wordle-cell" data-row="${row}" data-col="${col}" data-state="none" aria-label="Row ${row + 1} column ${col + 1}"></button>`,
  ).join('');
  return `<div class="wordle-row">${cells}</div>`;
}).join('');

const renderKeyboardLetterKeys = (letters: string) =>
  [...letters]
    .map(
      (letter) =>
        `<button type="button" class="wordle-key wordle-key-letter" data-key="${letter}" aria-label="${letter}">${letter}</button>`,
    )
    .join('');

const wordleKeyboardMarkup = `
  <div class="wordle-keyboard-row">
    ${renderKeyboardLetterKeys('QWERTYUIOP')}
  </div>
  <div class="wordle-keyboard-row">
    ${renderKeyboardLetterKeys('ASDFGHJKL')}
    <button
      type="button"
      class="wordle-key wordle-key-action"
      data-action="backspace"
      title="${copy.wordleBackspace}"
      aria-label="${copy.wordleBackspace}"
    ><i class="fa-solid fa-delete-left" aria-hidden="true"></i></button>
  </div>
  <div class="wordle-keyboard-row">
    ${renderKeyboardLetterKeys('ZXCVBNM')}
    <button
      type="button"
      class="wordle-key wordle-key-action"
      data-action="clear-line"
      title="${copy.wordleClearLine}"
      aria-label="${copy.wordleClearLine}"
      id="wordle-clear-line"
    ><i class="fa-solid fa-trash" aria-hidden="true"></i></button>
  </div>
`;

app.innerHTML = `
  <main class="shell" aria-live="polite">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-header">
        <div>
          <p class="eyebrow" id="page-eyebrow">${copy.eyebrow}</p>
          <h1 id="page-title">${copy.appTitle}</h1>
          <p class="lead">
            <a
              id="lead-link"
              href="${copy.leadHref}"
              target="_blank"
              rel="noreferrer"
            ><code id="lead-prefix">${copy.leadPrefix}</code></a>
            <span id="lead-suffix">${copy.leadSuffix}</span>
          </p>
        </div>

        <label class="language-toggle" aria-label="${copy.languageToggleLabel}">
          <span>JA</span>
          <input
            id="language-toggle-input"
            type="checkbox"
            ${copy.lang === 'en' ? 'checked' : ''}
          />
          <span class="language-toggle-track" aria-hidden="true"></span>
          <span>EN</span>
        </label>
      </div>

      <div class="hero-tabs" role="tablist" aria-label="${copy.searchOptionsLabel}">
        <button
          class="hero-tab"
          id="tab-regex"
          type="button"
          role="tab"
          aria-selected="true"
          aria-controls="panel-regex"
          data-tab="regex"
        >${copy.tabRegexSearch}</button>
        <button
          class="hero-tab"
          id="tab-wordle"
          type="button"
          role="tab"
          aria-selected="false"
          aria-controls="panel-wordle"
          data-tab="wordle"
        >${copy.tabWordleSearch}</button>
      </div>

      <div class="tab-panel" id="panel-regex" role="tabpanel" aria-labelledby="tab-regex">
        <form class="search-form" id="search-form">
          <label class="field">
            <span id="regex-label">${copy.regexLabel}</span>
            <textarea
              id="pattern-input"
              class="pattern-input"
              autocomplete="off"
              spellcheck="false"
              placeholder="${copy.regexPlaceholder}"
              rows="2"
            ></textarea>
          </label>

          <div class="options" aria-label="${copy.searchOptionsLabel}">
            <label>
              <input id="ignore-case-input" type="checkbox" checked />
              <span id="ignore-case-label">${copy.ignoreCase}</span>
            </label>
            <label>
              <input id="global-match-input" type="checkbox" checked />
              <span id="global-match-label">${copy.matchAnywhere}</span>
            </label>
            <button class="option-button" id="copy-url-button" type="button">
              <i class="fa-regular fa-copy" aria-hidden="true"></i>
              <span id="copy-url-label">${copy.copyUrl}</span>
            </button>
          </div>
        </form>

        <div class="tips" id="regex-examples" aria-label="${copy.regexExamplesLabel}">
          <button type="button" data-pattern="^a.*e$">^a.*e$</button>
          <button type="button" data-pattern="^[a-z]{5}$">^[a-z]{5}$</button>
          <button type="button" data-pattern="(ing|ed)$">(ing|ed)$</button>
          <button type="button" data-pattern="^[^aeiou]+$">^[^aeiou]+$</button>
        </div>
      </div>

      <div class="tab-panel wordle-panel" id="panel-wordle" role="tabpanel" aria-labelledby="tab-wordle" hidden>
        <div class="wordle-board">
          <div class="wordle-grid" id="wordle-grid" tabindex="0">${wordleGridMarkup}</div>
          <div class="wordle-keyboard-side">
            <button
              class="wordle-keyboard-toggle"
              id="wordle-keyboard-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="wordle-keyboard"
              title="${copy.wordleExpandKeyboard}"
              aria-label="${copy.wordleExpandKeyboard}"
            ><i class="fa-regular fa-keyboard" aria-hidden="true"></i></button>
            <div class="wordle-keyboard" id="wordle-keyboard" hidden>${wordleKeyboardMarkup}</div>
          </div>
        </div>
        <button class="wordle-clear" id="wordle-clear" type="button">${copy.wordleClear}</button>
      </div>
    </section>

    <section class="panel" aria-labelledby="results-title">
      <div class="panel-header">
        <div>
          <p class="eyebrow" id="results-eyebrow">${copy.resultsEyebrow}</p>
          <h2 id="results-title">${copy.loadingDictionary}</h2>
        </div>
        <p class="counter" id="counter">0 ${copy.wordsLabel}</p>
      </div>

      <p class="status" id="status">${copy.loadingDictionaryStatus}</p>
      <ol class="word-list" id="result-list"></ol>
      <div class="load-sentinel" id="load-sentinel" aria-hidden="true"></div>
    </section>
  </main>
`;

const patternInput =
  document.querySelector<HTMLTextAreaElement>('#pattern-input');
const languageToggleInput = document.querySelector<HTMLInputElement>(
  '#language-toggle-input',
);
const ignoreCaseInput =
  document.querySelector<HTMLInputElement>('#ignore-case-input');
const globalMatchInput =
  document.querySelector<HTMLInputElement>('#global-match-input');
const copyUrlButton =
  document.querySelector<HTMLButtonElement>('#copy-url-button');
const copyUrlLabel = document.querySelector<HTMLSpanElement>('#copy-url-label');
const resultList = document.querySelector<HTMLOListElement>('#result-list');
const loadSentinel = document.querySelector<HTMLDivElement>('#load-sentinel');
const resultsTitle = document.querySelector<HTMLHeadingElement>('#results-title');
const counter = document.querySelector<HTMLParagraphElement>('#counter');
const status = document.querySelector<HTMLParagraphElement>('#status');
const pageEyebrow = document.querySelector<HTMLParagraphElement>('#page-eyebrow');
const pageTitle = document.querySelector<HTMLHeadingElement>('#page-title');
const languageToggle =
  document.querySelector<HTMLLabelElement>('.language-toggle');
const leadLink = document.querySelector<HTMLAnchorElement>('#lead-link');
const leadPrefix = document.querySelector<HTMLElement>('#lead-prefix');
const leadSuffix = document.querySelector<HTMLSpanElement>('#lead-suffix');
const regexLabel = document.querySelector<HTMLSpanElement>('#regex-label');
const options = document.querySelector<HTMLDivElement>('.options');
const ignoreCaseLabel =
  document.querySelector<HTMLSpanElement>('#ignore-case-label');
const globalMatchLabel =
  document.querySelector<HTMLSpanElement>('#global-match-label');
const regexExamples = document.querySelector<HTMLDivElement>('#regex-examples');
const resultsEyebrow =
  document.querySelector<HTMLParagraphElement>('#results-eyebrow');
const tabRegex = document.querySelector<HTMLButtonElement>('#tab-regex');
const tabWordle = document.querySelector<HTMLButtonElement>('#tab-wordle');
const panelRegex = document.querySelector<HTMLDivElement>('#panel-regex');
const panelWordle = document.querySelector<HTMLDivElement>('#panel-wordle');
const wordleGrid = document.querySelector<HTMLDivElement>('#wordle-grid');
const wordleClearButton =
  document.querySelector<HTMLButtonElement>('#wordle-clear');
const wordleKeyboardToggle = document.querySelector<HTMLButtonElement>(
  '#wordle-keyboard-toggle',
);
const wordleKeyboard =
  document.querySelector<HTMLDivElement>('#wordle-keyboard');
const wordleClearLineButton = document.querySelector<HTMLButtonElement>(
  '#wordle-clear-line',
);
const wordleKeyboardToggleIcon =
  wordleKeyboardToggle?.querySelector<HTMLElement>('i');
const wordleCellButtons = document.querySelectorAll<HTMLButtonElement>(
  '.wordle-cell',
);

if (
  !patternInput ||
  !languageToggleInput ||
  !ignoreCaseInput ||
  !globalMatchInput ||
  !copyUrlButton ||
  !copyUrlLabel ||
  !resultList ||
  !loadSentinel ||
  !resultsTitle ||
  !counter ||
  !status ||
  !pageEyebrow ||
  !pageTitle ||
  !languageToggle ||
  !leadLink ||
  !leadPrefix ||
  !leadSuffix ||
  !regexLabel ||
  !options ||
  !ignoreCaseLabel ||
  !globalMatchLabel ||
  !regexExamples ||
  !resultsEyebrow ||
  !tabRegex ||
  !tabWordle ||
  !panelRegex ||
  !panelWordle ||
  !wordleGrid ||
  !wordleClearButton ||
  !wordleKeyboardToggle ||
  !wordleKeyboard ||
  !wordleClearLineButton ||
  !wordleKeyboardToggleIcon
) {
  throw new Error('Required UI element was not found.');
}

const queryParams = new URLSearchParams(window.location.search);
const queryPattern = queryParams.get('q');
patternInput.value = queryPattern ?? DEFAULT_PATTERN;

const resolveSearchMode = (value: string | null): SearchMode =>
  value === 'wordle' ? 'wordle' : 'regex';

let words: string[] = [];
let currentMatches: string[] = [];
let renderedResultCount = 0;
let pendingRender = 0;
let activeSearchMode: SearchMode = resolveSearchMode(queryParams.get('p'));
let activeInputIndex = 0;
let isWordleKeyboardExpanded = false;

const wordleCells: WordleCell[] = Array.from(
  { length: WORDLE_ROWS * WORDLE_COLS },
  () => ({ letter: '', state: 'none' }),
);

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getCellIndex = (row: number, col: number) => row * WORDLE_COLS + col;

const getCellCoords = (index: number) => ({
  row: Math.floor(index / WORDLE_COLS),
  col: index % WORDLE_COLS,
});

const getWordleCellButton = (index: number) => {
  const { row, col } = getCellCoords(index);
  return wordleGrid.querySelector<HTMLButtonElement>(
    `.wordle-cell[data-row="${row}"][data-col="${col}"]`,
  );
};

const renderWordleCell = (index: number) => {
  const cell = wordleCells[index];
  const button = getWordleCellButton(index);
  if (!button) {
    return;
  }

  button.textContent = cell.letter;
  button.dataset.state = cell.state;
};

const renderWordleGrid = () => {
  for (let index = 0; index < wordleCells.length; index += 1) {
    renderWordleCell(index);
  }
  syncKeyboardKeyStates();
};

const KEYBOARD_STATE_PRIORITY: Record<CellState, number> = {
  none: 0,
  absent: 1,
  present: 2,
  collect: 3,
};

const syncKeyboardKeyStates = () => {
  const letterStates = new Map<string, CellState>();

  for (const cell of wordleCells) {
    if (!cell.letter || cell.state === 'none') {
      continue;
    }

    const current = letterStates.get(cell.letter) ?? 'none';
    if (
      KEYBOARD_STATE_PRIORITY[cell.state] > KEYBOARD_STATE_PRIORITY[current]
    ) {
      letterStates.set(cell.letter, cell.state);
    }
  }

  for (const button of wordleKeyboard.querySelectorAll<HTMLButtonElement>(
    '.wordle-key-letter',
  )) {
    const letter = button.dataset.key;
    const state = letter ? (letterStates.get(letter) ?? 'none') : 'none';
    if (state === 'none') {
      delete button.dataset.state;
    } else {
      button.dataset.state = state;
    }
  }
};

const syncActiveCellHighlight = () => {
  for (const button of wordleCellButtons) {
    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    const index = getCellIndex(row, col);
    const isActive =
      activeInputIndex < wordleCells.length && index === activeInputIndex;
    if (isActive) {
      button.dataset.active = 'true';
    } else {
      delete button.dataset.active;
    }
  }
};

const setStatus = (message: string, isError = false) => {
  status.textContent = message;
  status.classList.toggle('status-error', isError);
};

const updateLocalizedText = () => {
  document.documentElement.lang = copy.lang;
  pageEyebrow.textContent = copy.eyebrow;
  pageTitle.textContent = copy.appTitle;
  languageToggle.setAttribute('aria-label', copy.languageToggleLabel);
  leadLink.href = copy.leadHref;
  leadPrefix.textContent = copy.leadPrefix;
  leadSuffix.textContent = copy.leadSuffix;
  tabRegex.textContent = copy.tabRegexSearch;
  tabWordle.textContent = copy.tabWordleSearch;
  wordleClearButton.textContent = copy.wordleClear;
  const wordleBackspaceButton = wordleKeyboard.querySelector<HTMLButtonElement>(
    '[data-action="backspace"]',
  );
  if (wordleBackspaceButton) {
    wordleBackspaceButton.title = copy.wordleBackspace;
    wordleBackspaceButton.setAttribute('aria-label', copy.wordleBackspace);
  }
  wordleClearLineButton.title = copy.wordleClearLine;
  wordleClearLineButton.setAttribute('aria-label', copy.wordleClearLine);
  wordleKeyboardToggle.title = isWordleKeyboardExpanded
    ? copy.wordleCollapseKeyboard
    : copy.wordleExpandKeyboard;
  wordleKeyboardToggle.setAttribute(
    'aria-label',
    isWordleKeyboardExpanded
      ? copy.wordleCollapseKeyboard
      : copy.wordleExpandKeyboard,
  );
  regexLabel.textContent = copy.regexLabel;
  patternInput.placeholder = copy.regexPlaceholder;
  options.setAttribute('aria-label', copy.searchOptionsLabel);
  ignoreCaseLabel.textContent = copy.ignoreCase;
  globalMatchLabel.textContent = copy.matchAnywhere;
  copyUrlLabel.textContent = copy.copyUrl;
  regexExamples.setAttribute('aria-label', copy.regexExamplesLabel);
  resultsEyebrow.textContent = copy.resultsEyebrow;
  counter.textContent = `${numberFormatter.format(words.length)} ${copy.wordsLabel}`;
};

const setLocale = (locale: string) => {
  const nextI18n = getI18n(locale);
  copy = nextI18n.copy;
  numberFormatter = nextI18n.numberFormatter;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, copy.lang);
  updateLocalizedText();
};

const buildShareUrl = () => {
  const url = new URL(window.location.href);
  const pattern = patternInput.value;

  url.searchParams.set('p', activeSearchMode);

  if (pattern) {
    url.searchParams.set('q', pattern);
  } else {
    url.searchParams.delete('q');
  }

  return url.toString();
};

const syncPanelQueryParam = (mode: SearchMode) => {
  const url = new URL(window.location.href);
  url.searchParams.set('p', mode);
  window.history.replaceState(null, '', url);
};

const copyText = async (text: string) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.append(helper);
  helper.select();
  document.execCommand('copy');
  helper.remove();
};

const normalizeDictionary = (dictionary: DictionaryPayload) => {
  if (Array.isArray(dictionary)) {
    return dictionary.filter((word): word is string => typeof word === 'string');
  }

  return Object.keys(dictionary);
};

const appendResults = () => {
  if (renderedResultCount >= currentMatches.length) {
    loadSentinel.hidden = true;
    return;
  }

  const nextResultCount = Math.min(
    renderedResultCount + RESULT_PAGE_SIZE,
    currentMatches.length,
  );
  const fragment = document.createDocumentFragment();
  for (const word of currentMatches.slice(renderedResultCount, nextResultCount)) {
    const item = document.createElement('li');
    item.textContent = word;
    fragment.append(item);
  }

  resultList.append(fragment);
  renderedResultCount = nextResultCount;
  loadSentinel.hidden = renderedResultCount >= currentMatches.length;

  setStatus(
    renderedResultCount < currentMatches.length
      ? copy.visibleResultsStatus(renderedResultCount, currentMatches.length)
      : copy.allResultsStatus,
  );
};

const renderResults = (matches: string[]) => {
  currentMatches = matches;
  renderedResultCount = 0;
  resultList.replaceChildren();
  loadSentinel.hidden = matches.length === 0;

  if (matches.length === 0) {
    setStatus(copy.allResultsStatus);
    return;
  }

  appendResults();
};

const buildRegex = () => {
  const pattern = patternInput.value.trim();
  if (!pattern) {
    return null;
  }

  const source = globalMatchInput.checked ? pattern : `^(?:${pattern})$`;
  return new RegExp(source, ignoreCaseInput.checked ? 'i' : undefined);
};

const buildWordlePattern = () => {
  const collectByCol: (string | null)[] = Array(WORDLE_COLS).fill(null);
  const presentLetters = new Set<string>();
  const absentLetters = new Set<string>();
  const presentPositions: { col: number; letter: string }[] = [];
  let hasConstraint = false;

  for (let index = 0; index < wordleCells.length; index += 1) {
    const cell = wordleCells[index];
    if (!cell.letter || cell.state === 'none') {
      continue;
    }

    hasConstraint = true;
    const letter = cell.letter.toLowerCase();
    const { col } = getCellCoords(index);

    if (cell.state === 'collect') {
      collectByCol[col] = letter;
    } else if (cell.state === 'present') {
      presentLetters.add(letter);
      presentPositions.push({ col, letter });
    } else if (cell.state === 'absent') {
      absentLetters.add(letter);
    }
  }

  if (!hasConstraint) {
    return DEFAULT_PATTERN;
  }

  let pattern = '^';
  const collectPart = collectByCol.map((letter) => letter ?? '.').join('');
  pattern += `(?=^${collectPart}$)`;

  for (const letter of presentLetters) {
    if (!absentLetters.has(letter)) {
      pattern += `(?=.*${escapeRegex(letter)})`;
    }
  }

  if (absentLetters.size > 0) {
    const absentClass = [...absentLetters].map(escapeRegex).join('');
    pattern += `(?!.*[${absentClass}])`;
  }

  for (const { col, letter } of presentPositions) {
    if (absentLetters.has(letter)) {
      continue;
    }

    const prefix = '.'.repeat(col);
    const suffix = '.'.repeat(WORDLE_COLS - col - 1);
    pattern += `(?!^${prefix}${escapeRegex(letter)}${suffix}$)`;
  }

  pattern += '.{5}$';
  return pattern;
};

const buildWordleRegex = () => {
  const pattern = buildWordlePattern();
  if (!pattern) {
    return null;
  }

  return new RegExp(pattern, 'i');
};

const runSearch = () => {
  window.cancelAnimationFrame(pendingRender);

  pendingRender = window.requestAnimationFrame(() => {
    if (words.length === 0) {
      return;
    }

    let regex: RegExp | null;
    try {
      regex =
        activeSearchMode === 'wordle' ? buildWordleRegex() : buildRegex();
    } catch (error) {
      renderResults([]);
      resultsTitle.textContent = copy.invalidRegexTitle;
      counter.textContent = `${numberFormatter.format(words.length)} ${copy.wordsLabel}`;
      setStatus(error instanceof Error ? error.message : copy.invalidRegex, true);
      return;
    }

    if (!regex) {
      renderResults([]);
      resultsTitle.textContent = copy.emptyRegexTitle;
      counter.textContent = `${numberFormatter.format(words.length)} ${copy.wordsLabel}`;
      setStatus(copy.emptyRegexStatus);
      return;
    }

    const matches = words.filter((word) => regex.test(word));
    renderResults(matches);

    resultsTitle.textContent = copy.matchesTitle(matches.length);
    counter.textContent = `${numberFormatter.format(words.length)} ${copy.wordsLabel}`;
  });
};

const setSearchMode = (mode: SearchMode, options: { syncUrl?: boolean } = {}) => {
  const { syncUrl = true } = options;
  activeSearchMode = mode;
  const isRegex = mode === 'regex';

  tabRegex.setAttribute('aria-selected', String(isRegex));
  tabWordle.setAttribute('aria-selected', String(!isRegex));
  panelRegex.hidden = !isRegex;
  panelWordle.hidden = isRegex;

  if (syncUrl) {
    syncPanelQueryParam(mode);
  }

  if (isRegex) {
    patternInput.focus();
  } else {
    wordleGrid.focus();
  }

  runSearch();
};

const getNextInputIndex = () => {
  for (let index = 0; index < wordleCells.length; index += 1) {
    if (!wordleCells[index].letter) {
      return index;
    }
  }

  return wordleCells.length;
};

const syncActiveInputIndex = () => {
  activeInputIndex = getNextInputIndex();
  syncActiveCellHighlight();
};

const appendWordleLetter = (letter: string) => {
  if (activeInputIndex >= wordleCells.length) {
    return;
  }

  wordleCells[activeInputIndex].letter = letter;
  renderWordleCell(activeInputIndex);
  activeInputIndex += 1;
  syncActiveCellHighlight();
  syncKeyboardKeyStates();
  runSearch();
};

const removeLastWordleLetter = () => {
  if (activeInputIndex === 0) {
    return;
  }

  activeInputIndex -= 1;
  wordleCells[activeInputIndex].letter = '';
  wordleCells[activeInputIndex].state = 'none';
  renderWordleCell(activeInputIndex);
  syncActiveCellHighlight();
  syncKeyboardKeyStates();
  runSearch();
};

const cycleWordleCellState = (index: number) => {
  const cell = wordleCells[index];
  if (!cell.letter) {
    return;
  }

  if (cell.state === 'none') {
    cell.state = 'collect';
  } else {
    const currentIndex = MARKED_STATE_CYCLE.indexOf(cell.state);
    cell.state =
      MARKED_STATE_CYCLE[(currentIndex + 1) % MARKED_STATE_CYCLE.length];
  }

  renderWordleCell(index);
  syncKeyboardKeyStates();
  runSearch();
};

const clearWordleGrid = () => {
  for (let index = 0; index < wordleCells.length; index += 1) {
    wordleCells[index].letter = '';
    wordleCells[index].state = 'none';
  }

  activeInputIndex = 0;
  renderWordleGrid();
  syncActiveCellHighlight();
  runSearch();
};

const getClearableRow = () => {
  if (activeInputIndex === 0) {
    return null;
  }

  if (activeInputIndex >= wordleCells.length) {
    return WORDLE_ROWS - 1;
  }

  if (activeInputIndex % WORDLE_COLS === 0) {
    return Math.floor(activeInputIndex / WORDLE_COLS) - 1;
  }

  return Math.floor(activeInputIndex / WORDLE_COLS);
};

const clearWordleLine = () => {
  const row = getClearableRow();
  if (row === null) {
    return;
  }

  const startIndex = getCellIndex(row, 0);
  for (let col = 0; col < WORDLE_COLS; col += 1) {
    const index = startIndex + col;
    wordleCells[index].letter = '';
    wordleCells[index].state = 'none';
    renderWordleCell(index);
  }

  activeInputIndex = startIndex;
  syncActiveCellHighlight();
  syncKeyboardKeyStates();
  runSearch();
};

const setWordleKeyboardExpanded = (expanded: boolean) => {
  isWordleKeyboardExpanded = expanded;
  wordleKeyboard.hidden = !expanded;
  wordleKeyboardToggle.setAttribute('aria-expanded', String(expanded));
  wordleKeyboardToggle.title = expanded
    ? copy.wordleCollapseKeyboard
    : copy.wordleExpandKeyboard;
  wordleKeyboardToggle.setAttribute(
    'aria-label',
    expanded ? copy.wordleCollapseKeyboard : copy.wordleExpandKeyboard,
  );
  wordleKeyboardToggleIcon.className = expanded
    ? 'fa-solid fa-keyboard'
    : 'fa-regular fa-keyboard';
};

const handleWordleKeydown = (event: KeyboardEvent) => {
  if (activeSearchMode !== 'wordle') {
    return;
  }

  if (event.key === 'Backspace') {
    event.preventDefault();
    removeLastWordleLetter();
    return;
  }

  if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
    event.preventDefault();
    appendWordleLetter(event.key.toUpperCase());
  }
};

const loadObserver = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      appendResults();
    }
  },
  { rootMargin: '240px' },
);

loadObserver.observe(loadSentinel);

const loadDictionary = async () => {
  try {
    const dictionaryUrl = getDictionaryUrl();
    const response = await fetch(dictionaryUrl);
    if (!response.ok) {
      throw new Error(copy.dictionaryLoadFailedStatus(response.status));
    }

    const dictionary = (await response.json()) as DictionaryPayload;
    words = normalizeDictionary(dictionary);
    runSearch();
  } catch (error) {
    resultsTitle.textContent = copy.dictionaryLoadFailedTitle;
    counter.textContent = `0 ${copy.wordsLabel}`;
    setStatus(
      error instanceof Error ? error.message : copy.dictionaryLoadFailedTitle,
      true,
    );
  }
};

patternInput.addEventListener('input', runSearch);
languageToggleInput.addEventListener('change', () => {
  setLocale(languageToggleInput.checked ? 'en' : 'ja-JP');

  if (words.length === 0) {
    resultsTitle.textContent = copy.loadingDictionary;
    setStatus(copy.loadingDictionaryStatus);
    return;
  }

  runSearch();
});
ignoreCaseInput.addEventListener('change', runSearch);
globalMatchInput.addEventListener('change', runSearch);
copyUrlButton.addEventListener('click', async () => {
  try {
    await copyText(buildShareUrl());
    setStatus(copy.copiedUrl);
  } catch {
    setStatus(copy.copyUrlFailed, true);
  }
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-pattern]')) {
  button.addEventListener('click', () => {
    patternInput.value = button.dataset.pattern ?? '';
    runSearch();
    patternInput.focus();
  });
}

tabRegex.addEventListener('click', () => {
  setSearchMode('regex');
});

tabWordle.addEventListener('click', () => {
  setSearchMode('wordle');
});

wordleGrid.addEventListener('keydown', handleWordleKeydown);
wordleClearButton.addEventListener('click', clearWordleGrid);
wordleKeyboardToggle.addEventListener('click', () => {
  setWordleKeyboardExpanded(!isWordleKeyboardExpanded);
});

wordleKeyboard.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>('button.wordle-key');
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  if (action === 'backspace') {
    removeLastWordleLetter();
  } else if (action === 'clear-line') {
    clearWordleLine();
  } else if (button.dataset.key) {
    appendWordleLetter(button.dataset.key);
  }

  wordleGrid.focus();
});

for (const button of wordleCellButtons) {
  button.addEventListener('click', () => {
    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    cycleWordleCellState(getCellIndex(row, col));
  });
}

syncActiveInputIndex();
setSearchMode(activeSearchMode, { syncUrl: false });
void loadDictionary();
