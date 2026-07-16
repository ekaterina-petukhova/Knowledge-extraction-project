document.getElementById('year').textContent = new Date().getFullYear();

// ===== Methodology page =====
const methodologySections = [
  {
    id: 'method-data-sources',
    number: '01',
    title: 'Data sources',
    html: `
      <p>The study combines six museum archives and one specialized art-news publication. Each source was collected independently because archive structure, pagination, and page templates differ across institutions.</p>

      <h4>Museum archives</h4>
      <ul class="method-source-list">
        <li><a href="https://pushkinmuseum.art/" target="_blank" rel="noopener noreferrer">The Pushkin State Museum of Fine Arts</a></li>
        <li><a href="https://www.tretyakovgallery.ru/" target="_blank" rel="noopener noreferrer">The State Tretyakov Gallery</a></li>
        <li><a href="https://mamm-mdf.ru/" target="_blank" rel="noopener noreferrer">Multimedia Art Museum, Moscow — MAMM</a></li>
        <li><a href="https://www.hermitagemuseum.org/" target="_blank" rel="noopener noreferrer">The State Hermitage Museum</a></li>
        <li><a href="https://rusmuseum.ru/" target="_blank" rel="noopener noreferrer">The State Russian Museum</a></li>
        <li><a href="https://garagemca.org/" target="_blank" rel="noopener noreferrer">Garage Museum of Contemporary Art</a></li>
      </ul>

      <h4>Media source</h4>
      <ul class="method-source-list">
        <li><a href="https://www.theartnewspaper.ru/" target="_blank" rel="noopener noreferrer">The Art Newspaper Russia</a></li>
      </ul>

      <p>The museum datasets primarily represent institutions’ descriptions of their own exhibitions, publications, and activities. <em>The Art Newspaper Russia</em> provides an external media perspective covering multiple institutions and developments in the art world.</p>

      <p>None of the selected sources provides a complete public API for its historical archive. All records were therefore collected through direct web scraping.</p>
    `
  },

  {
    id: 'method-scraping',
    number: '02',
    title: 'Scraping',
    html: `
      <p>Before a full archive was collected, each scraper was tested on a limited sample of pages. This test-parsing stage verified pagination, selectors, link extraction, date extraction, description boundaries, differences between older and newer templates, and whether content was available in the initial HTML or loaded through JavaScript.</p>

      <h4>Static HTML sources</h4>
      <p>Sites returning complete HTML on the first request were collected with <code>requests</code> and parsed with <code>BeautifulSoup</code>. This method was used for the Russian Museum, MAMM, the Pushkin Museum, the Tretyakov Gallery, and <em>The Art Newspaper Russia</em>.</p>

      <h4>JavaScript-rendered sources</h4>
      <p>Garage Museum and the State Hermitage load archive content through client-side JavaScript. These sources were collected with <code>Playwright</code> and a headless browser.</p>

      <h4>Two-stage collection</h4>
      <ol>
        <li>Extract every available record link from the archive.</li>
        <li>Visit each record page separately and collect its title, date, description, and available metadata.</li>
      </ol>

      <p>The year was read from visible page text rather than inferred from the URL because many older records use numeric identifiers or URL structures without a reliable date.</p>

      <p>Failures were logged at the page or record level instead of terminating the complete run. This allowed collection to continue when individual pages were unavailable, malformed, or structurally different from the rest of the archive.</p>

      <div class="method-output">
        <strong>Typical fields</strong>
        <code>title · date · year · description · url</code>
      </div>
    `
  },

  {
    id: 'method-cleaning',
    number: '03',
    title: 'Text cleaning',
    html: `
      <p>Before classification and keyword analysis, descriptions were cleaned of navigation elements, footers, ticket information, opening hours, cookie notices, contact details, social-sharing prompts, and other repeated website boilerplate.</p>

      <p>The cleaning method depended on the structure of each source. Deterministic methods were preferred whenever the unwanted material could be identified reliably.</p>

      <h4>Marker-based extraction</h4>
      <p>When a website followed a predictable structure, useful text was extracted between stable beginning and ending markers. If descriptions consistently began or ended with ticket information or visitor instructions, only those repeated blocks were removed. The substantive description was preserved without rewriting or shortening it.</p>

      <h4>Anchor-based removal</h4>
      <p>Regular expressions were used when boilerplate appeared inside the description but could still be identified through recurring phrases. The unwanted fragment was removed without discarding the surrounding exhibition text.</p>

      <h4>Sentence filtering</h4>
      <p>Very short fragments and sentences containing known interface markers were removed when navigation and descriptive content appeared as separate text elements.</p>

      <h4>Ollama-assisted cleaning</h4>
      <p>Ollama was used only when the structure of an extracted description was inconsistent and no reliable marker, regular expression, or sentence-level rule could separate meaningful content from website noise.</p>

      <p>The local model was instructed to remove irrelevant boilerplate while preserving the substantive description. Ollama was therefore a fallback cleaning method, not a universal summarization stage. It was not applied to every page and was not used when deterministic rules were sufficient.</p>

      <p>Records were not silently discarded when a cleaning pattern failed. They were retained for inspection or passed through another cleaning method.</p>
    `
  },

  {
    id: 'method-classification',
    number: '04',
    title: 'Art classification',
    html: `
      <p>Every cleaned corpus was classified with the same multilingual zero-shot model:</p>

      <div class="method-code-line">
        <code>MoritzLaurer/mDeBERTa-v3-base-mnli-xnli</code>
      </div>

      <p>The model was accessed through the Hugging Face <code>transformers</code> zero-shot classification pipeline and was not fine-tuned on the museum datasets.</p>

      <div class="method-table-wrap">
        <table class="method-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>National Russian Art</td>
              <td>Russian or nationally framed artistic production</td>
            </tr>
            <tr>
              <td>Western Art</td>
              <td>European, North American, or broadly Western artistic production</td>
            </tr>
            <tr>
              <td>Eastern Art</td>
              <td>Asian, Middle Eastern, or other Eastern artistic production</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>The category describes the primary cultural and geographic focus of a record rather than the nationality of the institution publishing it. Each dataset was classified independently; records from different institutions were not pooled into a single classification run.</p>

      <p>Several pipelines used the hypothesis template <code>This art belongs to the category: {}</code>, producing a more natural proposition for Russian-language descriptions.</p>

      <h4>Rule-based safeguards</h4>
      <p>Selected pipelines included lexical rules for unambiguous references, including artist names, place names, historical terms, and institution-specific vocabulary. A sufficiently clear trigger could assign a category directly without a model call. These rules reduced obvious errors rather than replacing semantic classification.</p>

      <h4>Garage manual review</h4>
      <p>Garage records often contain short publication fragments with too little context for reliable automatic classification. The automatic results were checked against a manually labelled control sample, and the final Garage dataset was subjected to expert manual review.</p>
    `
  },

  {
    id: 'method-periodization',
    number: '05',
    title: 'Periodization and metrics',
    html: `
      <div class="method-table-wrap">
        <table class="method-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Definition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>pre_2022</code></td>
              <td>year earlier than 2022</td>
            </tr>
            <tr>
              <td><code>transition_2022</code></td>
              <td>year equal to 2022</td>
            </tr>
            <tr>
              <td><code>post_2022</code></td>
              <td>year equal to or later than 2023</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>Records outside the study range of 2014–2026 were excluded. The year 2022 is shown separately in annual charts because it represents a transition period. The principal comparison contrasts records before 2022 with records from 2023 onward.</p>

      <h4>Category dynamics</h4>
      <p>Records were grouped by year and category and displayed as stacked bar charts. Missing archive years were left empty rather than interpreted as zero institutional activity because a missing year may reflect an archive or collection gap.</p>

      <h4>National Component Share</h4>
      <div class="method-formula">
        National Russian Art records ÷ all classified records × 100
      </div>

      <p>The metric was calculated independently for the pre-2022 and post-2022 subsets. Percentages were used for comparison across institutions, while raw counts were retained where period sizes differed substantially.</p>
    `
  },

  {
    id: 'method-keywords',
    number: '06',
    title: 'Keyword analysis',
    html: `
      <h4>BERTopic — attempted</h4>
      <p>After cleaning, BERTopic was tested to identify recurring themes across the corpora. The resulting topics were frequently dominated by function words, generic museum vocabulary, institutional boilerplate, and other common terms that were not analytically distinctive.</p>

      <p>The clusters were difficult to interpret consistently across institutions and periods, so BERTopic was not adopted for the final comparative analysis.</p>

      <h4>TF-IDF — adopted</h4>
      <p>Keyword change was measured with term frequency–inverse document frequency using <code>scikit-learn</code>. TF-IDF was calculated separately for the pre-2022 and post-2022 corpora.</p>

      <p>For each term, the final value was calculated as the mean TF-IDF weight per document rather than the raw sum across all documents. This prevents the larger period from receiving higher scores simply because it contains more records.</p>

      <p>The stopword list combines Russian function words, generic museum and exhibition vocabulary, interface boilerplate, the institution’s name in common grammatical forms, and corpus-specific terms without interpretive value.</p>

      <p>For each comparison, the top terms from both periods were pooled and ranked by their combined weight. This preserves terms that are distinctive in only one period. TF-IDF was adopted because its results were more transparent, reproducible, and comparable than the BERTopic output.</p>
    `
  },

  {
    id: 'method-geography',
    number: '07',
    title: 'Geographic analysis',
    html: `
      <p>The Russian Museum corpus was additionally analyzed for references to Russian cities.</p>

      <p>Descriptions were lemmatized with <code>pymorphy3</code>, allowing different grammatical forms of the same city name to be grouped under one dictionary form. City mentions were then counted and compared across periods to examine whether the institution’s national focus became more geographically concentrated or more regionally distributed.</p>

      <p><code>Natasha</code> and <code>NLTK</code> were not used in this pipeline.</p>
    `
  },

  {
    id: 'method-visualization',
    number: '08',
    title: 'Visualization',
    html: `
      <p>All static analytical charts were produced with <code>matplotlib</code>.</p>

      <p>Annual category charts use the <code>viridis</code> palette. Before-and-after comparisons use dark green and terracotta to distinguish the two periods consistently across institutional pages.</p>

      <p>The project includes annual stacked category charts, National Component Share comparisons, TF-IDF keyword comparisons, and geographic-mention charts where applicable. Interactive versions allow users to inspect exact values, isolate categories, and compare analytical periods.</p>
    `
  },

  {
    id: 'method-limitations',
    number: '09',
    title: 'Comparability and limitations',
    html: `
      <p>The seven datasets follow the same analytical framework but differ in source type, archive completeness, page structure, and the amount of text available for each record.</p>

      <p>The zero-shot <code>mDeBERTa-v3-base-mnli-xnli</code> classifier is not error-free. It can misclassify records when descriptions are very short, culturally ambiguous, devoted to several artistic traditions, dominated by generic institutional language, or when a named artist or place is not the primary subject.</p>

      <p>Despite these limitations, the model produced generally coherent and analytically useful results across the seven datasets. At the aggregate level, its classifications were sufficiently consistent to reveal broad institutional patterns and changes over time.</p>

      <p>The model should therefore be understood as a reproducible analytical instrument rather than an infallible expert judgement. Rule-based safeguards, manual inspection, and the manually reviewed Garage corpus were used to identify and reduce obvious errors.</p>

      <p>Occasional record-level errors are less consequential here because the main results concern proportions, yearly dynamics, and period-level change rather than definitive classifications of individual exhibitions.</p>

      <p>Archive gaps were not automatically backfilled. Missing records or years should not be interpreted as proof that an institution organized no relevant exhibitions. Website structures also changed over time, and older records may contain less complete metadata or shorter descriptions than recent ones.</p>

      <p>The results should be read as a comparative analysis of documented institutional programming and discourse, not as a complete inventory of every exhibition or an error-free classification of every record.</p>
    `
  }
];

const stepsWrap = document.getElementById('methodologySteps');

if (stepsWrap) {
  const methodologyNav = methodologySections.map(section => `
    <a href="#${section.id}" class="methodology-nav-link">
      <span>${section.number}</span>
      ${section.title}
    </a>
  `).join('');

  const methodologyContent = methodologySections.map(section => `
    <section class="methodology-section reveal" id="${section.id}">
      <div class="methodology-section-number">
        ${section.number}
      </div>

      <div class="methodology-section-body">
        <h2>${section.title}</h2>
        ${section.html}
      </div>
    </section>
  `).join('');

  stepsWrap.innerHTML = `
    <div class="methodology-intro reveal">
      <p class="methodology-kicker">METHODOLOGY</p>

      <h1>From museum archives to comparable datasets</h1>

      <p class="methodology-lead">
        The full extraction and analysis pipeline behind the project:
        how exhibition and publication records were scraped from seven
        sources, how descriptions were cleaned, how records were classified
        by cultural focus, and how changes before and after 2022 were measured.
      </p>
    </div>

    <nav class="methodology-on-page reveal" aria-label="Methodology sections">
      <p>ON THIS PAGE</p>

      <div class="methodology-nav-grid">
        ${methodologyNav}
      </div>
    </nav>

    <div class="methodology-content">
      ${methodologyContent}
    </div>
  `;
}

// ===== Router =====
const routes = {
  '/': 'page-home',
  '/data': 'page-data',
  '/pushkin': 'page-pushkin',
  '/tretyakov': 'page-tretyakov',
  '/garage': 'page-garage',
  '/mamm': 'page-mamm',
  '/russian-museum': 'page-russian-museum',
  '/hermitage': 'page-hermitage',
  '/art-newspaper': 'page-art-newspaper',
  '/results': 'page-results',
  '/ontology': 'page-ontology',
  '/knowledge-graph': 'page-knowledge-graph',
  '/methodology': 'page-methodology',
  '/team': 'page-team'
};

const pages = document.querySelectorAll('.page');
const navLinkEls = document.querySelectorAll('[data-route]');
const mobileMenu = document.getElementById('mobileMenu');
const navDropdowns = document.querySelectorAll('.nav-dropdown');

function currentPath() {
  let hash = window.location.hash || '#/';
  let path = hash.replace(/^#/, '');
  if (!path) path = '/';
  return path;
}

function render() {
  const path = currentPath();
  const pageId = routes[path] || 'page-notfound';

  pages.forEach(p => p.classList.toggle('active', p.id === pageId));

  navLinkEls.forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-route') === path);
  });

  navDropdowns.forEach(dd => {
    const hasActive = !!dd.querySelector('[data-route].active');
    dd.classList.toggle('has-active', hasActive);
    dd.classList.remove('open');
  });

  mobileMenu.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  initReveal();
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);

// ===== Mobile menu toggle =====
document.getElementById('navToggle').addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// ===== Nav dropdowns (Art of Moscow / Art of Petersburg) =====
navDropdowns.forEach(dd => {
  const toggle = dd.querySelector('.nav-dropdown-toggle');
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !dd.classList.contains('open');
    navDropdowns.forEach(other => other.classList.remove('open'));
    if (willOpen) dd.classList.add('open');
  });
});
document.addEventListener('click', () => {
  navDropdowns.forEach(dd => dd.classList.remove('open'));
});

// ===== Scroll reveal =====
let observer;
function initReveal() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const targets = activePage.querySelectorAll('.reveal');

  if (observer) observer.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

  targets.forEach(t => observer.observe(t));
}

// ===== Shared SVG helpers =====
const svgNS = 'http://www.w3.org/2000/svg';

function elNS(tag, attrs) {
  const node = document.createElementNS(svgNS, tag);
  Object.keys(attrs || {}).forEach(k => node.setAttribute(k, attrs[k]));
  return node;
}

// ===== Reusable stacked year-trend chart (Pushkin/Tretyakov, Russian Museum) =====
// Renders a 2014-2026 stacked bar chart with a category legend, a
// pre/transition/post-2022 period selector, and a click-through detail panel.
function createYearTrendChart(cfg) {
  const state = { hidden: new Set(), selectedYear: null, selectedPeriod: null };
  const defaultDetailHtml = cfg.defaultDetailHtml
    || "Click or tap a bar for a year's breakdown, or a period above for that era's totals.";

  function yearTotal(row) {
    return cfg.categories.reduce((sum, cat) => sum + row[cat.key], 0);
  }

  function periodOf(year) {
    return year <= 2021 ? 'pre' : (year === 2022 ? 'transition' : 'post');
  }

  function periodRows(key) {
    return cfg.data.filter(r => periodOf(r.year) === key);
  }

  function buildLegend() {
    const legend = document.getElementById(cfg.legendId);
    if (!legend) return;
    legend.innerHTML = '';
    cfg.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'legend-btn';
      btn.dataset.key = cat.key;
      btn.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.label}`;
      btn.addEventListener('click', () => {
        if (state.hidden.has(cat.key)) state.hidden.delete(cat.key);
        else state.hidden.add(cat.key);
        render();
      });
      legend.appendChild(btn);
    });
  }

  function buildPeriodButtons() {
    document.querySelectorAll(`#${cfg.periodsId} .period-btn`).forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.period;
        state.selectedPeriod = state.selectedPeriod === key ? null : key;
        state.selectedYear = null;
        render();
      });
    });
  }

  function showTooltip(e, row, cat, value, total) {
    const tooltip = document.getElementById(cfg.tooltipId);
    if (!tooltip) return;
    const pct = total ? Math.round((value / total) * 100) : 0;
    tooltip.innerHTML = `<strong>${row.year}</strong> &middot; ${cat.label}<br>${value} exhibitions (${pct}% of that year)`;
    tooltip.classList.add('visible');
    positionTooltip(e);
  }

  function positionTooltip(e) {
    const tooltip = document.getElementById(cfg.tooltipId);
    const wrap = e.currentTarget.closest('.chart-svg-wrap');
    if (!tooltip || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    tooltip.style.left = (e.clientX - rect.left) + 'px';
    tooltip.style.top = (e.clientY - rect.top) + 'px';
  }

  function hideTooltip() {
    const tooltip = document.getElementById(cfg.tooltipId);
    if (tooltip) tooltip.classList.remove('visible');
  }

  function selectYear(year) {
    state.selectedYear = year;
    state.selectedPeriod = null;
    render();
  }

  function updateYearDetail(year) {
    const row = cfg.data.find(r => r.year === year);
    const detail = document.getElementById(cfg.detailId);
    if (!row || !detail) return;
    const total = yearTotal(row);
    const periodLabel = row.year <= 2021 ? 'pre-2022' : (row.year === 2022 ? 'transition year' : 'post-2022');
    const parts = cfg.categories.map(cat => {
      const v = row[cat.key];
      const pct = total ? Math.round((v / total) * 100) : 0;
      return `<strong style="color:${cat.color}">${cat.label}</strong>: ${v} (${pct}%)`;
    }).join(' &middot; ');
    detail.innerHTML = `<strong>${row.year}</strong> &middot; ${periodLabel} &middot; ${total} exhibitions total<br>${parts}`;
  }

  function updatePeriodDetail(key) {
    const rows = periodRows(key);
    const detail = document.getElementById(cfg.detailId);
    if (!rows.length || !detail) return;
    const sums = {};
    cfg.categories.forEach(cat => { sums[cat.key] = 0; });
    rows.forEach(r => cfg.categories.forEach(cat => { sums[cat.key] += r[cat.key]; }));
    const total = cfg.categories.reduce((s, cat) => s + sums[cat.key], 0);
    const years = rows.map(r => r.year);
    const range = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : `${years[0]}`;
    const label = key === 'pre' ? `Pre-2022 (${range})` : key === 'transition' ? '2022 · Transition year' : `Post-2022 (${range})`;
    const parts = cfg.categories.map(cat => {
      const v = sums[cat.key];
      const pct = total ? Math.round((v / total) * 100) : 0;
      return `<strong style="color:${cat.color}">${cat.label}</strong>: ${v} (${pct}%)`;
    }).join(' &middot; ');
    detail.innerHTML = `<strong>${label}</strong> &middot; ${years.length} year${years.length > 1 ? 's' : ''} &middot; ${total} exhibitions total<br>${parts}`;
  }

  function resetDetail() {
    const detail = document.getElementById(cfg.detailId);
    if (detail) detail.innerHTML = defaultDetailHtml;
  }

  function render() {
    const svg = document.getElementById(cfg.svgId);
    if (!svg) return;
    svg.innerHTML = '';

    document.querySelectorAll(`#${cfg.legendId} .legend-btn`).forEach(btn => {
      btn.classList.toggle('dimmed', state.hidden.has(btn.dataset.key));
    });

    document.querySelectorAll(`#${cfg.periodsId} .period-btn`).forEach(btn => {
      const isActive = state.selectedPeriod === btn.dataset.period;
      btn.classList.toggle('active', isActive);
      btn.classList.toggle('dimmed', !!state.selectedPeriod && !isActive);
    });

    const W = 960, H = 480;
    const marginLeft = 46, marginRight = 16, marginTop = 28, marginBottom = 56;
    const plotW = W - marginLeft - marginRight;
    const plotH = H - marginTop - marginBottom;

    const maxCount = Math.max(...cfg.data.map(yearTotal));
    const yMax = Math.ceil(maxCount / 10) * 10;
    const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

    const n = cfg.data.length;
    const band = plotW / n;
    const barW = band * 0.6;

    const periodBg = elNS('g', {});
    cfg.data.forEach((row, i) => {
      const x = marginLeft + i * band;
      const fill = row.year <= 2021 ? 'rgba(47,102,99,0.045)'
        : row.year === 2022 ? 'rgba(201,168,76,0.09)'
        : 'rgba(160,96,96,0.055)';
      periodBg.appendChild(elNS('rect', {
        x: x.toFixed(2), y: marginTop, width: band.toFixed(2), height: plotH, fill
      }));
    });
    svg.appendChild(periodBg);

    const gridG = elNS('g', {});
    yTicks.forEach(t => {
      const y = marginTop + plotH - (t / yMax) * plotH;
      gridG.appendChild(elNS('line', {
        x1: marginLeft, x2: W - marginRight, y1: y.toFixed(2), y2: y.toFixed(2),
        stroke: '#DDD4C7', 'stroke-width': 1
      }));
      const label = elNS('text', {
        x: marginLeft - 10, y: (y + 4).toFixed(2), 'text-anchor': 'end', class: 'chart-axis-label'
      });
      label.textContent = Math.round(t);
      gridG.appendChild(label);
    });
    svg.appendChild(gridG);

    const pivotIndex = cfg.data.findIndex(r => r.year === 2022);
    if (pivotIndex > -1) {
      const xStart = marginLeft + pivotIndex * band;
      const xEnd = xStart + band;
      const g = elNS('g', {});
      [xStart, xEnd].forEach(x => {
        g.appendChild(elNS('line', {
          x1: x.toFixed(2), x2: x.toFixed(2), y1: marginTop, y2: marginTop + plotH,
          stroke: '#C9A84C', 'stroke-width': 1.5, 'stroke-dasharray': '4 4'
        }));
      });
      const label = elNS('text', {
        x: (xStart + band / 2).toFixed(2), y: marginTop - 10, 'text-anchor': 'middle', class: 'chart-pivot-label'
      });
      label.textContent = '2022 pivot';
      g.appendChild(label);
      svg.appendChild(g);
    }

    cfg.data.forEach((row, i) => {
      const x = marginLeft + i * band + (band - barW) / 2;
      const total = yearTotal(row);
      const isSelected = state.selectedYear === row.year;
      const isPeriodFaded = !!state.selectedPeriod && state.selectedPeriod !== periodOf(row.year);
      let cumulative = 0;

      const yearGroup = elNS('g', { class: 'chart-year-group', opacity: isPeriodFaded ? 0.2 : 1 });

      cfg.categories.forEach(cat => {
        if (state.hidden.has(cat.key)) return;
        const value = row[cat.key];
        const segH = Math.max((value / yMax) * plotH, 0);
        const y = marginTop + plotH - ((cumulative + value) / yMax) * plotH;

        const rect = elNS('rect', {
          x: x.toFixed(2), y: y.toFixed(2), width: barW.toFixed(2), height: segH.toFixed(2),
          fill: cat.color, class: 'chart-bar-seg',
          stroke: isSelected ? '#2C2416' : 'none', 'stroke-width': isSelected ? 1.5 : 0
        });
        rect.addEventListener('mouseenter', (e) => showTooltip(e, row, cat, value, total));
        rect.addEventListener('mousemove', positionTooltip);
        rect.addEventListener('mouseleave', hideTooltip);
        rect.addEventListener('click', () => selectYear(row.year));

        yearGroup.appendChild(rect);
        cumulative += value;
      });

      const hit = elNS('rect', {
        x: (marginLeft + i * band).toFixed(2), y: marginTop, width: band.toFixed(2), height: plotH,
        fill: 'transparent', class: 'chart-year-hit'
      });
      hit.addEventListener('click', () => selectYear(row.year));
      svg.appendChild(hit);
      svg.appendChild(yearGroup);

      const yl = elNS('text', {
        x: (marginLeft + i * band + band / 2).toFixed(2), y: H - marginBottom + 20, 'text-anchor': 'middle',
        class: 'chart-year-label' + (isSelected ? ' active-year' : ''),
        opacity: isPeriodFaded ? 0.35 : 1
      });
      yl.textContent = row.year;
      svg.appendChild(yl);
    });

    if (state.selectedYear != null) updateYearDetail(state.selectedYear);
    else if (state.selectedPeriod != null) updatePeriodDetail(state.selectedPeriod);
    else resetDetail();
  }

  function init() {
    if (!document.getElementById(cfg.svgId)) return;
    buildLegend();
    buildPeriodButtons();
    render();
  }

  return { init };
}

// ===== Pushkin Museum: trends, national share, keywords =====
// Values verified against pushkin_category_by_year.csv, pushkin_national_share.csv
// and pushkin_tfidf_keywords.csv (Knowledge-extraction-data/pushk-tretyak/третьяк).
const pushkinTrendsData = [
  { year: 2014, eastern: 1, western: 0,  national: 1 },
  { year: 2015, eastern: 6, western: 15, national: 8 },
  { year: 2016, eastern: 7, western: 21, national: 10 },
  { year: 2017, eastern: 9, western: 14, national: 5 },
  { year: 2018, eastern: 5, western: 10, national: 3 },
  { year: 2019, eastern: 5, western: 7,  national: 2 },
  { year: 2020, eastern: 1, western: 4,  national: 3 },
  { year: 2021, eastern: 4, western: 5,  national: 4 },
  { year: 2022, eastern: 3, western: 7,  national: 5 },
  { year: 2023, eastern: 3, western: 9,  national: 6 },
  { year: 2024, eastern: 3, western: 4,  national: 9 },
  { year: 2025, eastern: 3, western: 8,  national: 5 },
  { year: 2026, eastern: 2, western: 4,  national: 4 }
];

const pushkinTrendsCategories = [
  { key: 'eastern', label: 'Eastern Art', color: '#A06060' },
  { key: 'western', label: 'Western Art', color: '#2F6663' },
  { key: 'national', label: 'National Russian Art', color: '#C9A84C' }
];

createYearTrendChart({
  svgId: 'pushkinTrendsSvg', legendId: 'pushkinChartLegend', tooltipId: 'pushkinChartTooltip',
  periodsId: 'pushkinChartPeriods', detailId: 'pushkinChartDetail',
  data: pushkinTrendsData, categories: pushkinTrendsCategories
}).init();

// ===== Tretyakov Gallery: trends, national share, keywords =====
// Values verified against tretyakov_category_by_year.csv and tretyakov_national_share.csv.
// Archive gaps (2014-2016, 2018) are real, not backfilled with zeroes.
const tretyakovTrendsData = [
  { year: 2017, eastern: 0, western: 0,  national: 1 },
  { year: 2019, eastern: 0, western: 5,  national: 9 },
  { year: 2020, eastern: 1, western: 5,  national: 14 },
  { year: 2021, eastern: 2, western: 3,  national: 12 },
  { year: 2022, eastern: 4, western: 4,  national: 17 },
  { year: 2023, eastern: 6, western: 10, national: 21 },
  { year: 2024, eastern: 5, western: 9,  national: 19 },
  { year: 2025, eastern: 5, western: 7,  national: 13 },
  { year: 2026, eastern: 1, western: 0,  national: 2 }
];

const tretyakovTrendsCategories = [
  { key: 'eastern', label: 'Eastern Art', color: '#A06060' },
  { key: 'western', label: 'Western Art', color: '#2F6663' },
  { key: 'national', label: 'National Russian Art', color: '#C9A84C' }
];

createYearTrendChart({
  svgId: 'tretyakovTrendsSvg', legendId: 'tretyakovChartLegend', tooltipId: 'tretyakovChartTooltip',
  periodsId: 'tretyakovChartPeriods', detailId: 'tretyakovChartDetail',
  data: tretyakovTrendsData, categories: tretyakovTrendsCategories
}).init();

// Data verified against category_by_year.csv (Knowledge-extraction-data/russkiy muzei).
const rmTrendsData = [
  { year: 2014, eastern: 1,  western: 19, national: 17 },
  { year: 2015, eastern: 4,  western: 9,  national: 25 },
  { year: 2016, eastern: 3,  western: 13, national: 32 },
  { year: 2017, eastern: 7,  western: 16, national: 27 },
  { year: 2018, eastern: 5,  western: 31, national: 28 },
  { year: 2019, eastern: 10, western: 27, national: 35 },
  { year: 2020, eastern: 2,  western: 8,  national: 20 },
  { year: 2021, eastern: 6,  western: 12, national: 23 },
  { year: 2022, eastern: 12, western: 13, national: 47 },
  { year: 2023, eastern: 9,  western: 15, national: 46 },
  { year: 2024, eastern: 3,  western: 18, national: 46 },
  { year: 2025, eastern: 4,  western: 9,  national: 36 },
  { year: 2026, eastern: 1,  western: 2,  national: 10 }
];

const rmTrendsCategories = [
  { key: 'eastern', label: 'Eastern Art', color: '#A06060' },
  { key: 'western', label: 'Western Art', color: '#2F6663' },
  { key: 'national', label: 'National Russian Art', color: '#C9A84C' }
];

createYearTrendChart({
  svgId: 'rmTrendsSvg', legendId: 'rmChartLegend', tooltipId: 'rmChartTooltip',
  periodsId: 'rmChartPeriods', detailId: 'rmChartDetail',
  data: rmTrendsData, categories: rmTrendsCategories
}).init();

// ===== Reusable grouped compare chart (keywords, category shares) =====
// Two series (typically before/after 2022) plotted as grouped bars across a
// list of items, with a legend, hover tooltips and a click-through detail panel.
function createGroupedCompareChart(cfg) {
  const state = { hidden: new Set(), selectedKey: null };
  const W = cfg.W, H = cfg.H;
  const yTickLabel = cfg.yTickLabel || (t => t);

  function buildLegend() {
    const legend = document.getElementById(cfg.legendId);
    if (!legend) return;
    legend.innerHTML = '';
    cfg.series.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'legend-btn';
      btn.dataset.key = s.key;
      btn.innerHTML = `<span class="dot" style="background:${s.color}"></span>${s.label}`;
      btn.addEventListener('click', () => {
        if (state.hidden.has(s.key)) state.hidden.delete(s.key);
        else state.hidden.add(s.key);
        render();
      });
      legend.appendChild(btn);
    });
  }

  function showTooltip(e, item, series, value) {
    const tooltip = document.getElementById(cfg.tooltipId);
    if (!tooltip) return;
    tooltip.innerHTML = `<strong>${cfg.itemLabel(item)}</strong> &middot; ${series.label}<br>${cfg.tooltipValue(value)}`;
    tooltip.classList.add('visible');
    positionTooltip(e);
  }

  function positionTooltip(e) {
    const tooltip = document.getElementById(cfg.tooltipId);
    const wrap = e.currentTarget.closest('.chart-svg-wrap');
    if (!tooltip || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    tooltip.style.left = (e.clientX - rect.left) + 'px';
    tooltip.style.top = (e.clientY - rect.top) + 'px';
  }

  function hideTooltip() {
    const tooltip = document.getElementById(cfg.tooltipId);
    if (tooltip) tooltip.classList.remove('visible');
  }

  function select(key) {
    state.selectedKey = key;
    render();
    const item = cfg.items.find(it => cfg.itemKey(it) === key);
    const detail = document.getElementById(cfg.detailId);
    if (!item || !detail) return;
    detail.innerHTML = cfg.onSelect(item);
  }

  function render() {
    const svg = document.getElementById(cfg.svgId);
    if (!svg) return;
    svg.innerHTML = '';

    document.querySelectorAll(`#${cfg.legendId} .legend-btn`).forEach(btn => {
      btn.classList.toggle('dimmed', state.hidden.has(btn.dataset.key));
    });

    const marginLeft = cfg.marginLeft, marginRight = 12, marginTop = 16, marginBottom = cfg.marginBottom || 44;
    const plotW = W - marginLeft - marginRight;
    const plotH = H - marginTop - marginBottom;

    const n = cfg.items.length;
    const band = plotW / n;
    const groupW = band * (cfg.groupWidthRatio || 0.68);
    const barW = groupW / 2;

    const gridG = elNS('g', {});
    cfg.yTicks.forEach(t => {
      const y = marginTop + plotH - (t / cfg.yMax) * plotH;
      gridG.appendChild(elNS('line', {
        x1: marginLeft, x2: W - marginRight, y1: y.toFixed(2), y2: y.toFixed(2),
        stroke: '#DDD4C7', 'stroke-width': 1
      }));
      const label = elNS('text', {
        x: marginLeft - 8, y: (y + 4).toFixed(2), 'text-anchor': 'end', class: 'chart-axis-label'
      });
      label.textContent = yTickLabel(t);
      gridG.appendChild(label);
    });
    svg.appendChild(gridG);

    cfg.items.forEach((item, i) => {
      const groupX = marginLeft + i * band + (band - groupW) / 2;
      const key = cfg.itemKey(item);
      const isSelected = state.selectedKey === key;

      cfg.series.forEach((s, si) => {
        if (state.hidden.has(s.key)) return;
        const value = item[s.key];
        const segH = Math.max((value / cfg.yMax) * plotH, value > 0 ? 2 : 0);
        const x = groupX + si * barW;
        const y = marginTop + plotH - segH;

        const rect = elNS('rect', {
          x: x.toFixed(2), y: y.toFixed(2), width: (barW - 3).toFixed(2), height: segH.toFixed(2),
          fill: s.color, class: 'chart-bar-seg',
          stroke: isSelected ? '#2C2416' : 'none', 'stroke-width': isSelected ? 1.5 : 0
        });
        rect.addEventListener('mouseenter', (e) => showTooltip(e, item, s, value));
        rect.addEventListener('mousemove', (e) => positionTooltip(e));
        rect.addEventListener('mouseleave', () => hideTooltip());
        rect.addEventListener('click', () => select(key));
        svg.appendChild(rect);
      });

      const hit = elNS('rect', {
        x: (marginLeft + i * band).toFixed(2), y: marginTop, width: band.toFixed(2), height: plotH,
        fill: 'transparent'
      });
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', () => select(key));
      svg.appendChild(hit);

      const labelX = (marginLeft + i * band + band / 2).toFixed(2);
      const labelAttrs = cfg.rotateLabels
        ? { x: labelX, y: (H - marginBottom + 14).toFixed(2), 'text-anchor': 'end',
            transform: `rotate(-40 ${labelX} ${(H - marginBottom + 14).toFixed(2)})` }
        : { x: labelX, y: H - marginBottom + 20, 'text-anchor': 'middle' };
      const label = elNS('text', {
        ...labelAttrs, class: 'chart-year-label' + (isSelected ? ' active-year' : '')
      });
      label.textContent = cfg.itemLabel(item);
      svg.appendChild(label);
    });
  }

  function init() {
    if (!document.getElementById(cfg.svgId)) return;
    buildLegend();
    render();
  }

  return { init };
}

// ===== Reusable two-bar share chart (national component, before vs. after) =====
function createShareChart(cfg) {
  const W = cfg.W, H = cfg.H;

  function showTooltip(e, item) {
    const tooltip = document.getElementById(cfg.tooltipId);
    if (!tooltip) return;
    tooltip.innerHTML = `<strong>${item.label}</strong><br>${item.count} of ${item.total} exhibitions (${item.pct}%)`;
    tooltip.classList.add('visible');
    positionTooltip(e);
  }

  function positionTooltip(e) {
    const tooltip = document.getElementById(cfg.tooltipId);
    const wrap = e.currentTarget.closest('.chart-svg-wrap');
    if (!tooltip || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    tooltip.style.left = (e.clientX - rect.left) + 'px';
    tooltip.style.top = (e.clientY - rect.top) + 'px';
  }

  function hideTooltip() {
    const tooltip = document.getElementById(cfg.tooltipId);
    if (tooltip) tooltip.classList.remove('visible');
  }

  function select() {
    const detail = document.getElementById(cfg.detailId);
    if (detail) detail.innerHTML = cfg.onSelect();
  }

  function render() {
    const svg = document.getElementById(cfg.svgId);
    if (!svg) return;
    svg.innerHTML = '';

    const marginLeft = 40, marginRight = 16, marginTop = 30, marginBottom = 50;
    const plotW = W - marginLeft - marginRight;
    const plotH = H - marginTop - marginBottom;

    const gridG = elNS('g', {});
    cfg.yTicks.forEach(t => {
      const y = marginTop + plotH - (t / cfg.yMax) * plotH;
      gridG.appendChild(elNS('line', {
        x1: marginLeft, x2: W - marginRight, y1: y.toFixed(2), y2: y.toFixed(2),
        stroke: '#DDD4C7', 'stroke-width': 1
      }));
      const label = elNS('text', {
        x: marginLeft - 8, y: (y + 4).toFixed(2), 'text-anchor': 'end', class: 'chart-axis-label'
      });
      label.textContent = t;
      gridG.appendChild(label);
    });
    svg.appendChild(gridG);

    const n = cfg.items.length;
    const band = plotW / n;
    const barW = band * 0.55;

    cfg.items.forEach((item, i) => {
      const x = marginLeft + i * band + (band - barW) / 2;
      const segH = (item.pct / cfg.yMax) * plotH;
      const y = marginTop + plotH - segH;

      const rect = elNS('rect', {
        x: x.toFixed(2), y: y.toFixed(2), width: barW.toFixed(2), height: segH.toFixed(2),
        fill: item.color, class: 'chart-bar-seg'
      });
      rect.addEventListener('mouseenter', (e) => showTooltip(e, item));
      rect.addEventListener('mousemove', (e) => positionTooltip(e));
      rect.addEventListener('mouseleave', () => hideTooltip());
      rect.addEventListener('click', select);
      svg.appendChild(rect);

      const valueLabel = elNS('text', {
        x: (x + barW / 2).toFixed(2), y: (y - 10).toFixed(2), 'text-anchor': 'middle', class: 'chart-pivot-label'
      });
      valueLabel.textContent = `${item.pct}%`;
      svg.appendChild(valueLabel);

      const catLabel = elNS('text', {
        x: (x + barW / 2).toFixed(2), y: H - marginBottom + 22, 'text-anchor': 'middle', class: 'chart-year-label'
      });
      catLabel.textContent = item.label;
      svg.appendChild(catLabel);
    });
  }

  function init() {
    if (!document.getElementById(cfg.svgId)) return;
    render();
  }

  return { init };
}

function buildKeywordTable(id, rows) {
  const tbody = document.getElementById(id);
  if (!tbody) return;
  const sorted = [...rows].sort((a, b) => b.weight - a.weight);
  tbody.innerHTML = sorted.map(r => `
    <tr>
      <td class="kw-word">${r.word}${r.ru ? '<span class="ru-tag">RU</span>' : ''}</td>
      <td class="kw-weight">${r.weight.toFixed(4)}</td>
    </tr>
  `).join('');
}

// ===== Pushkin Museum: national share & keyword shift =====
// Values verified against pushkin_national_share.csv and pushkin_tfidf_keywords.csv.
const pushkinShareData = [
  { key: 'before', label: 'Before 2022', color: '#2F6663', count: 36, total: 150, pct: 24.0 },
  { key: 'after',  label: 'After 2022',  color: '#A06060', count: 29, total: 75,  pct: 38.7 }
];

createShareChart({
  svgId: 'pushkinShareSvg', tooltipId: 'pushkinShareTooltip', detailId: 'pushkinKeywordDetail',
  items: pushkinShareData, yMax: 45, yTicks: [0, 15, 30, 45], W: 380, H: 320,
  onSelect: () => `Records classified as National Russian Art: <strong>36 of 150 (24.0%)</strong> before 2022 &rarr; <strong>29 of 75 (38.7%)</strong> after &mdash; a rise of 14.7 percentage points.`
}).init();

// All ten keywords are distinct concepts, no near-duplicate word forms here.
const pushkinKeywordCompareData = [
  { key: 'art',        label: 'art',                 before: 0.0419, after: 0.0456 },
  { key: 'project',    label: 'project',              before: 0.0162, after: 0.0319 },
  { key: 'xix',        label: 'XIX',                  before: 0.0202, after: 0.0239 },
  { key: 'centuries',  label: 'centuries',             before: 0.0167, after: 0.0238 },
  { key: 'firsttime',  label: 'for the first time',    before: 0.0183, after: 0.0214 },
  { key: 'russia',     label: 'Russia',                before: 0.0226, after: 0.0151 },
  { key: 'willbe',     label: 'will be',               before: 0.0149, after: 0.0204 },
  { key: 'engravings', label: 'engravings',            before: 0.0342, after: 0 },
  { key: 'painting',   label: 'painting',              before: 0.0161, after: 0.0181 },
  { key: 'masters',    label: 'masters',               before: 0.0172, after: 0.0167 }
];

const pushkinKeywordSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'pushkinKeywordSvg', legendId: 'pushkinKeywordLegend', tooltipId: 'pushkinKeywordTooltip', detailId: 'pushkinKeywordDetail',
  items: pushkinKeywordCompareData, itemKey: d => d.key, itemLabel: d => d.label,
  series: pushkinKeywordSeries, W: 560, H: 320, marginLeft: 40,
  yMax: 0.05, yTicks: [0, 0.01, 0.02, 0.03, 0.04, 0.05], yTickLabel: t => t.toFixed(2),
  tooltipValue: v => `Mean TF-IDF: ${v.toFixed(4)}`,
  onSelect: item => {
    if (item.after === 0 && item.before > 0) {
      return `<strong>"${item.label}"</strong> (RU) carried a weight of <strong>${item.before.toFixed(4)}</strong> before 2022 &mdash; its single highest-weighted term &mdash; and disappears entirely afterward.`;
    }
    const delta = item.after - item.before;
    return `<strong>"${item.label}"</strong> (RU): ${item.before.toFixed(4)} before 2022 &rarr; ${item.after.toFixed(4)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(4)}).`;
  }
}).init();

const pushkinKeywordFullBefore = pushkinKeywordCompareData.map(d => ({ word: d.label, weight: d.before, ru: true }));
const pushkinKeywordFullAfter = pushkinKeywordCompareData.map(d => ({ word: d.label, weight: d.after, ru: true }));

buildKeywordTable('pushkinKeywordTableBefore', pushkinKeywordFullBefore);
buildKeywordTable('pushkinKeywordTableAfter', pushkinKeywordFullAfter);

// ===== Tretyakov Gallery: national share & keyword shift =====
// Values verified against tretyakov_national_share.csv and tretyakov_tfidf_keywords.csv.
// Note the national share FALLS after 2022, unlike every other institution studied.
const tretyakovShareData = [
  { key: 'before', label: 'Before 2022', color: '#2F6663', count: 36, total: 52,  pct: 69.2 },
  { key: 'after',  label: 'After 2022',  color: '#A06060', count: 72, total: 123, pct: 58.5 }
];

createShareChart({
  svgId: 'tretyakovShareSvg', tooltipId: 'tretyakovShareTooltip', detailId: 'tretyakovKeywordDetail',
  items: tretyakovShareData, yMax: 80, yTicks: [0, 20, 40, 60, 80], W: 380, H: 320,
  onSelect: () => `Records classified as National Russian Art: <strong>36 of 52 (69.2%)</strong> before 2022 &rarr; <strong>72 of 123 (58.5%)</strong> after &mdash; a fall of 10.7 percentage points, the only decrease among the institutions in this study.`
}).init();

// Full 10-word TF-IDF list has two grammatical duplicates ("art" and "project"
// each appear in two case forms). Only one form of each is used in the
// interactive chart to avoid a duplicate label; both forms are kept below.
const tretyakovKeywordFullData = [
  { key: 'art',       label: 'art',      before: 0.0385, after: 0.0354 },
  { key: 'painting',  label: 'painting', before: 0.0263, after: 0.0221 },
  { key: 'project2',  label: 'project',  before: 0.0247, after: 0.0211 },
  { key: 'russianadj',label: 'Russian',  before: 0.0195, after: 0.0213 },
  { key: 'project',   label: 'project',  before: 0.0220, after: 0.0167 },
  { key: 'masters',   label: 'masters',  before: 0.0148, after: 0.0207 },
  { key: 'russia',    label: 'Russia',   before: 0.0204, after: 0.0143 },
  { key: 'beginning', label: 'beginning',before: 0.0194, after: 0.0144 },
  { key: 'years',     label: 'years',    before: 0.0122, after: 0.0193 },
  { key: 'art2',      label: 'art',      before: 0.0199, after: 0.0089 }
];

const tretyakovKeywordCompareData = tretyakovKeywordFullData.filter(d => d.key !== 'project2' && d.key !== 'art2');

const tretyakovKeywordSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'tretyakovKeywordSvg', legendId: 'tretyakovKeywordLegend', tooltipId: 'tretyakovKeywordTooltip', detailId: 'tretyakovKeywordDetail',
  items: tretyakovKeywordCompareData, itemKey: d => d.key, itemLabel: d => d.label,
  series: tretyakovKeywordSeries, W: 560, H: 320, marginLeft: 40,
  yMax: 0.04, yTicks: [0, 0.01, 0.02, 0.03, 0.04], yTickLabel: t => t.toFixed(2),
  tooltipValue: v => `Mean TF-IDF: ${v.toFixed(4)}`,
  onSelect: item => {
    const delta = item.after - item.before;
    return `<strong>"${item.label}"</strong> (RU): ${item.before.toFixed(4)} before 2022 &rarr; ${item.after.toFixed(4)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(4)}).`;
  }
}).init();

const tretyakovKeywordFullBefore = tretyakovKeywordFullData.map(d => ({ word: d.label, weight: d.before, ru: true }));
const tretyakovKeywordFullAfter = tretyakovKeywordFullData.map(d => ({ word: d.label, weight: d.after, ru: true }));

buildKeywordTable('tretyakovKeywordTableBefore', tretyakovKeywordFullBefore);
buildKeywordTable('tretyakovKeywordTableAfter', tretyakovKeywordFullAfter);

// ===== Garage Museum: category balance, before vs. after 2022 =====
const garageCategoryData = [
  {
    key: 'national', category: 'National Russian Art', before: 79.4, after: 96.6,
    note: 'the increase from 79.4% to 96.6% indicates a near-total alignment with domestic cultural production &mdash; Garage becomes the primary platform for Russian contemporary art in the absence of international exchange.'
  },
  {
    key: 'western', category: 'Western Art', before: 15.6, after: 0.0,
    note: 'the drop from 15.6% to 0.0% is a complete cessation of international collaborations, marking the formal end of Garage\'s role as a bridge between the Western art market and the Russian scene.'
  },
  {
    key: 'eastern', category: 'Eastern Art', before: 5.0, after: 3.4,
    note: 'the decline from 5.0% to 3.4% shows that, in Garage\'s own programming, the &ldquo;Pivot to the East&rdquo; remains aspirational rather than an implemented institutional reality.'
  }
];

const garageSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'garageCategorySvg', legendId: 'garageLegend', tooltipId: 'garageCategoryTooltip', detailId: 'garageCategoryDetail',
  items: garageCategoryData, itemKey: d => d.key, itemLabel: d => d.category,
  series: garageSeries, W: 720, H: 420, marginLeft: 44,
  yMax: 100, yTicks: [0, 20, 40, 60, 80, 100],
  tooltipValue: v => `${v.toFixed(1)}% of publications`,
  onSelect: item => `<strong>${item.category}</strong>: ${item.before.toFixed(1)}% before 2022 &rarr; ${item.after.toFixed(1)}% after &mdash; ${item.note}`
}).init();

// ===== Russian Museum: national component share & TF-IDF keyword shift =====
// Values verified against russian_museum_national_share.csv and
// russian_museum_tfidf_keywords.csv (Knowledge-extraction-data/russkiy muzei).
const rmShareData = [
  { key: 'before', label: 'Before 2022', color: '#2F6663', count: 207, total: 380, pct: 54.5 },
  { key: 'after',  label: 'After 2022',  color: '#A06060', count: 185, total: 271, pct: 68.3 }
];

createShareChart({
  svgId: 'rmShareSvg', tooltipId: 'rmShareTooltip', detailId: 'rmKeywordDetail',
  items: rmShareData, yMax: 80, yTicks: [0, 20, 40, 60, 80], W: 380, H: 320,
  onSelect: () => `Records with a national/Russian component: <strong>207 of 380 (54.5%)</strong> before 2022 &rarr; <strong>185 of 271 (68.3%)</strong> after &mdash; a rise of 13.8 percentage points, echoing Garage (+17.2 pp) and the Pushkin/Tretyakov corpus (+13.6 pp).`
}).init();

// Russian-language TF-IDF terms translated to English (all flagged RU); weights
// are the mean TF-IDF score per document, not a raw sum.
const rmKeywordCompareData = [
  { key: 'art',         label: 'art',         ru: 'искусства',      before: 0.0236, after: 0.0248 },
  { key: 'anniversary',  label: 'anniversary',  ru: 'летию',          before: 0.0136, after: 0.0251 },
  { key: 'painting',    label: 'painting',    ru: 'живописи',       before: 0.0181, after: 0.0205 },
  { key: 'day',          label: 'day',          ru: 'дня',            before: 0.0119, after: 0.0226 },
  { key: 'dedicated',    label: 'dedicated',    ru: 'посвящена',      before: 0.0134, after: 0.0198 },
  { key: 'presents',     label: 'presents',     ru: 'представляет',   before: 0.0210, after: 0.0114 },
  { key: 'mikhailovsky', label: 'Mikhailovsky', ru: 'михайловского',  before: 0.0104, after: 0.0209 },
  { key: 'russia',       label: 'Russia',       ru: 'россии',         before: 0.0161, after: 0.0150 },
  { key: 'birth',        label: 'birth',        ru: 'рождения',       before: 0.0107, after: 0.0182 },
  { key: 'opened',       label: 'opened',       ru: 'открылась',      before: 0.0067, after: 0.0215 }
];

const rmKeywordSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'rmKeywordSvg', legendId: 'rmKeywordLegend', tooltipId: 'rmKeywordTooltip', detailId: 'rmKeywordDetail',
  items: rmKeywordCompareData, itemKey: d => d.key, itemLabel: d => d.label,
  series: rmKeywordSeries, W: 560, H: 320, marginLeft: 40,
  yMax: 0.03, yTicks: [0, 0.01, 0.02, 0.03], yTickLabel: t => t.toFixed(2),
  tooltipValue: v => `Mean TF-IDF: ${v.toFixed(4)}`,
  onSelect: item => {
    const delta = item.after - item.before;
    return `<strong>"${item.label}"</strong> (RU: ${item.ru}): ${item.before.toFixed(4)} before 2022 &rarr; ${item.after.toFixed(4)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(4)}).`;
  }
}).init();

const rmKeywordFullBefore = rmKeywordCompareData.map(d => ({ word: d.label, weight: d.before, ru: true }));
const rmKeywordFullAfter = rmKeywordCompareData.map(d => ({ word: d.label, weight: d.after, ru: true }));

buildKeywordTable('rmKeywordTableBefore', rmKeywordFullBefore);
buildKeywordTable('rmKeywordTableAfter', rmKeywordFullAfter);

// ===== Russian Museum: city mentions, before vs. after 2022 =====
// Lemmatized content-analysis counts, union of both top-city lists, sorted by
// combined mention count. Values verified against the raw before/after tallies.
const rmCityData = [
  { key: 'vladimir',      label: 'Vladimir',        before: 15, after: 7 },
  { key: 'spb',            label: 'Saint Petersburg', before: 8,  after: 13 },
  { key: 'moscow',         label: 'Moscow',           before: 7,  after: 6 },
  { key: 'kazan',          label: 'Kazan',            before: 5,  after: 1 },
  { key: 'zvenigorod',     label: 'Zvenigorod',       before: 0,  after: 5 },
  { key: 'ryazan',         label: 'Ryazan',           before: 0,  after: 3 },
  { key: 'tula',           label: 'Tula',             before: 0,  after: 3 },
  { key: 'novosibirsk',    label: 'Novosibirsk',      before: 0,  after: 3 },
  { key: 'yaroslavl',      label: 'Yaroslavl',        before: 1,  after: 2 },
  { key: 'krasnoyarsk',    label: 'Krasnoyarsk',      before: 1,  after: 2 },
  { key: 'samara',         label: 'Samara',           before: 0,  after: 2 },
  { key: 'chelyabinsk',    label: 'Chelyabinsk',      before: 1,  after: 1 },
  { key: 'voronezh',       label: 'Voronezh',         before: 1,  after: 1 },
  { key: 'omsk',           label: 'Omsk',             before: 0,  after: 1 },
  { key: 'ufa',            label: 'Ufa',              before: 0,  after: 1 },
  { key: 'rostov',         label: 'Rostov',           before: 0,  after: 1 }
];

const rmCitySeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'rmCitySvg', legendId: 'rmCityLegend', tooltipId: 'rmCityTooltip', detailId: 'rmCityDetail',
  items: rmCityData, itemKey: d => d.key, itemLabel: d => d.label,
  series: rmCitySeries, W: 960, H: 440, marginLeft: 34, marginBottom: 76,
  groupWidthRatio: 0.72, rotateLabels: true,
  yMax: 16, yTicks: [0, 4, 8, 12, 16],
  tooltipValue: v => `${v} mention${v === 1 ? '' : 's'}`,
  onSelect: item => {
    if (item.before === 0 && item.after > 0) {
      return `<strong>${item.label}</strong> isn't mentioned before 2022 and appears <strong>${item.after}</strong> time${item.after === 1 ? '' : 's'} after &mdash; a new city in the museum's programme.`;
    }
    const delta = item.after - item.before;
    return `<strong>${item.label}</strong>: ${item.before} mention${item.before === 1 ? '' : 's'} before 2022 &rarr; ${item.after} after (${delta >= 0 ? '+' : ''}${delta}).`;
  }
}).init();

// ===== MAMM (Multimedia Art Museum, Moscow): trends, national share, keywords =====
// Values verified against category_by_year.csv, mamm_national_share.csv and
// mamm_tfidf_keywords.csv (Knowledge-extraction-data/mamm).
const mammTrendsData = [
  { year: 2014, eastern: 2, western: 7,  national: 70 },
  { year: 2015, eastern: 0, western: 5,  national: 72 },
  { year: 2016, eastern: 3, western: 9,  national: 71 },
  { year: 2017, eastern: 0, western: 3,  national: 62 },
  { year: 2018, eastern: 3, western: 3,  national: 53 },
  { year: 2019, eastern: 0, western: 10, national: 57 },
  { year: 2020, eastern: 0, western: 0,  national: 28 },
  { year: 2021, eastern: 1, western: 6,  national: 33 },
  { year: 2022, eastern: 0, western: 1,  national: 66 },
  { year: 2023, eastern: 0, western: 1,  national: 5 },
  { year: 2024, eastern: 0, western: 0,  national: 20 },
  { year: 2025, eastern: 0, western: 0,  national: 35 },
  { year: 2026, eastern: 0, western: 0,  national: 35 }
];

const mammTrendsCategories = [
  { key: 'eastern', label: 'Eastern Art', color: '#A06060' },
  { key: 'western', label: 'Western Art', color: '#2F6663' },
  { key: 'national', label: 'National Russian Art', color: '#C9A84C' }
];

createYearTrendChart({
  svgId: 'mammTrendsSvg', legendId: 'mammChartLegend', tooltipId: 'mammChartTooltip',
  periodsId: 'mammChartPeriods', detailId: 'mammChartDetail',
  data: mammTrendsData, categories: mammTrendsCategories
}).init();

const mammShareData = [
  { key: 'before', label: 'Before 2022', color: '#2F6663', count: 446, total: 498, pct: 89.6 },
  { key: 'after',  label: 'After 2022',  color: '#A06060', count: 161, total: 163, pct: 98.8 }
];

createShareChart({
  svgId: 'mammShareSvg', tooltipId: 'mammShareTooltip', detailId: 'mammKeywordDetail',
  items: mammShareData, yMax: 100, yTicks: [0, 25, 50, 75, 100], W: 380, H: 320,
  onSelect: () => `Records classified as National Russian Art: <strong>446 of 498 (89.6%)</strong> before 2022 &rarr; <strong>161 of 163 (98.8%)</strong> after &mdash; up 9.2 percentage points, the smallest rise of the four institutions studied, because MAMM started closest to the ceiling.`
}).init();

// MAMM's own site content is already in English, so no translation or RU tag is needed.
const mammKeywordCompareData = [
  { key: 'art',      label: 'art',      before: 0.0483, after: 0.0704 },
  { key: 'courtesy', label: 'courtesy', before: 0.0367, after: 0.0147 },
  { key: 'artist',   label: 'artist',   before: 0.0296, after: 0.0192 },
  { key: 'russian',  label: 'russian',  before: 0.0234, after: 0.0224 },
  { key: 'print',    label: 'print',    before: 0.0274, after: 0.0164 },
  { key: 'project',  label: 'project',  before: 0.0265, after: 0.0172 },
  { key: 'new',      label: 'new',      before: 0.0187, after: 0.0232 },
  { key: 'house',    label: 'house',    before: 0.0233, after: 0.0162 },
  { key: 'series',   label: 'series',   before: 0.0273, after: 0.0109 },
  { key: 'world',    label: 'world',    before: 0.0137, after: 0.0201 }
];

const mammKeywordSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'mammKeywordSvg', legendId: 'mammKeywordLegend', tooltipId: 'mammKeywordTooltip', detailId: 'mammKeywordDetail',
  items: mammKeywordCompareData, itemKey: d => d.key, itemLabel: d => d.label,
  series: mammKeywordSeries, W: 560, H: 320, marginLeft: 40,
  yMax: 0.08, yTicks: [0, 0.02, 0.04, 0.06, 0.08], yTickLabel: t => t.toFixed(2),
  tooltipValue: v => `Mean TF-IDF: ${v.toFixed(4)}`,
  onSelect: item => {
    const delta = item.after - item.before;
    return `<strong>"${item.label}"</strong>: ${item.before.toFixed(4)} before 2022 &rarr; ${item.after.toFixed(4)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(4)}).`;
  }
}).init();

const mammKeywordFullBefore = mammKeywordCompareData.map(d => ({ word: d.label, weight: d.before }));
const mammKeywordFullAfter = mammKeywordCompareData.map(d => ({ word: d.label, weight: d.after }));

buildKeywordTable('mammKeywordTableBefore', mammKeywordFullBefore);
buildKeywordTable('mammKeywordTableAfter', mammKeywordFullAfter);

// ===== State Hermitage Museum: trends, national share, keywords =====
// Values verified against category_by_year.csv, hermitage_national_share.csv
// and hermitage_tfidf_keywords_normalized.csv (Knowledge-extraction-data/hermitage).
const hermitageTrendsData = [
  { year: 2014, eastern: 7,  western: 17, national: 4 },
  { year: 2015, eastern: 15, western: 15, national: 9 },
  { year: 2016, eastern: 15, western: 22, national: 7 },
  { year: 2017, eastern: 15, western: 14, national: 13 },
  { year: 2018, eastern: 13, western: 26, national: 4 },
  { year: 2019, eastern: 16, western: 22, national: 10 },
  { year: 2020, eastern: 13, western: 10, national: 7 },
  { year: 2021, eastern: 9,  western: 14, national: 9 },
  { year: 2022, eastern: 8,  western: 9,  national: 14 },
  { year: 2023, eastern: 10, western: 9,  national: 10 },
  { year: 2024, eastern: 10, western: 17, national: 17 },
  { year: 2025, eastern: 8,  western: 9,  national: 15 },
  { year: 2026, eastern: 5,  western: 4,  national: 2 }
];

const hermitageTrendsCategories = [
  { key: 'eastern', label: 'Eastern Art', color: '#A06060' },
  { key: 'western', label: 'Western Art', color: '#2F6663' },
  { key: 'national', label: 'National Russian Art', color: '#C9A84C' }
];

createYearTrendChart({
  svgId: 'hermitageTrendsSvg', legendId: 'hermitageChartLegend', tooltipId: 'hermitageChartTooltip',
  periodsId: 'hermitageChartPeriods', detailId: 'hermitageChartDetail',
  data: hermitageTrendsData, categories: hermitageTrendsCategories
}).init();

const hermitageShareData = [
  { key: 'before', label: 'Before 2022', color: '#2F6663', count: 63, total: 291, pct: 21.6 },
  { key: 'after',  label: 'After 2022',  color: '#A06060', count: 58, total: 147, pct: 39.5 }
];

createShareChart({
  svgId: 'hermitageShareSvg', tooltipId: 'hermitageShareTooltip', detailId: 'hermitageKeywordDetail',
  items: hermitageShareData, yMax: 45, yTicks: [0, 15, 30, 45], W: 380, H: 320,
  onSelect: () => `Records classified as National Russian Art: <strong>63 of 291 (21.6%)</strong> before 2022 &rarr; <strong>58 of 147 (39.5%)</strong> after &mdash; up 17.9 percentage points, the largest rise of any institution studied, yet still the lowest post-2022 ceiling of the four.`
}).init();

// Full 10-word TF-IDF list, Russian-language, translated to English and RU-flagged.
// "art" appears twice (искусства/искусство, two grammatical forms with distinct
// weights); only one is used in the interactive chart to avoid a duplicate label,
// both are kept in the full table below.
const hermitageKeywordFullData = [
  { key: 'art',      label: 'art',     before: 0.0340, after: 0.0268 },
  { key: 'among',    label: 'among',   before: 0.0170, after: 0.0174 },
  { key: 'palace',   label: 'palace',  before: 0.0155, after: 0.0180 },
  { key: 'saint',    label: 'Saint',   before: 0.0160, after: 0.0170 },
  { key: 'books',    label: 'books',   before: 0.0187, after: 0.0139 },
  { key: 'russia',   label: 'Russia',  before: 0.0151, after: 0.0176 },
  { key: 'art2',     label: 'art',     before: 0.0178, after: 0.0129 },
  { key: 'masters',  label: 'masters', before: 0.0161, after: 0.0142 },
  { key: 'culture',  label: 'culture', before: 0.0147, after: 0.0153 },
  { key: 'winter',   label: 'winter',  before: 0.0135, after: 0.0165 }
];

const hermitageKeywordCompareData = hermitageKeywordFullData.filter(d => d.key !== 'art2');

const hermitageKeywordSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'hermitageKeywordSvg', legendId: 'hermitageKeywordLegend', tooltipId: 'hermitageKeywordTooltip', detailId: 'hermitageKeywordDetail',
  items: hermitageKeywordCompareData, itemKey: d => d.key, itemLabel: d => d.label,
  series: hermitageKeywordSeries, W: 560, H: 320, marginLeft: 40,
  yMax: 0.04, yTicks: [0, 0.01, 0.02, 0.03, 0.04], yTickLabel: t => t.toFixed(2),
  tooltipValue: v => `Mean TF-IDF: ${v.toFixed(4)}`,
  onSelect: item => {
    const delta = item.after - item.before;
    return `<strong>"${item.label}"</strong> (RU): ${item.before.toFixed(4)} before 2022 &rarr; ${item.after.toFixed(4)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(4)}).`;
  }
}).init();

const hermitageKeywordFullBefore = hermitageKeywordFullData.map(d => ({ word: d.label, weight: d.before, ru: true }));
const hermitageKeywordFullAfter = hermitageKeywordFullData.map(d => ({ word: d.label, weight: d.after, ru: true }));

buildKeywordTable('hermitageKeywordTableBefore', hermitageKeywordFullBefore);
buildKeywordTable('hermitageKeywordTableAfter', hermitageKeywordFullAfter);

// ===== The Art Newspaper Russia: trends, national share, keywords =====
// Independent press coverage, not a single institution's own record. Values
// verified against category_by_year.csv and the national-share/tfidf CSVs
// (Knowledge-extraction-data/art_newspaper).
const artNewspaperTrendsData = [
  { year: 2014, eastern: 2,  western: 16,  national: 18 },
  { year: 2015, eastern: 12, western: 18,  national: 24 },
  { year: 2016, eastern: 11, western: 32,  national: 30 },
  { year: 2017, eastern: 33, western: 163, national: 98 },
  { year: 2018, eastern: 39, western: 203, national: 105 },
  { year: 2019, eastern: 46, western: 276, national: 89 },
  { year: 2020, eastern: 21, western: 97,  national: 48 },
  { year: 2021, eastern: 21, western: 110, national: 79 },
  { year: 2022, eastern: 46, western: 107, national: 68 },
  { year: 2023, eastern: 32, western: 104, national: 75 },
  { year: 2024, eastern: 39, western: 136, national: 85 },
  { year: 2025, eastern: 25, western: 109, national: 78 },
  { year: 2026, eastern: 26, western: 55,  national: 45 }
];

const artNewspaperTrendsCategories = [
  { key: 'eastern', label: 'Eastern Art', color: '#A06060' },
  { key: 'western', label: 'Western Art', color: '#2F6663' },
  { key: 'national', label: 'National Russian Art', color: '#C9A84C' }
];

createYearTrendChart({
  svgId: 'artNewspaperTrendsSvg', legendId: 'artNewspaperChartLegend', tooltipId: 'artNewspaperChartTooltip',
  periodsId: 'artNewspaperChartPeriods', detailId: 'artNewspaperChartDetail',
  data: artNewspaperTrendsData, categories: artNewspaperTrendsCategories
}).init();

const artNewspaperShareData = [
  { key: 'before', label: 'Before 2022', color: '#2F6663', count: 491, total: 1591, pct: 30.9 },
  { key: 'after',  label: 'After 2022',  color: '#A06060', count: 351, total: 1030, pct: 34.1 }
];

createShareChart({
  svgId: 'artNewspaperShareSvg', tooltipId: 'artNewspaperShareTooltip', detailId: 'artNewspaperKeywordDetail',
  items: artNewspaperShareData, yMax: 45, yTicks: [0, 15, 30, 45], W: 380, H: 320,
  onSelect: () => `Coverage classified as National Russian Art: <strong>491 of 1,591 (30.9%)</strong> before 2022 &rarr; <strong>351 of 1,030 (34.1%)</strong> after &mdash; a rise of 3.2 percentage points, the smallest of any dataset in this study.`
}).init();

// Full 10-word list has two near-duplicate "art" forms (искусство, the native
// loanword арт) beyond the primary искусства entry; only one is charted.
const artNewspaperKeywordFullData = [
  { key: 'art',          label: 'art',          before: 0.0308, after: 0.0266 },
  { key: 'contemporary',  label: 'contemporary',  before: 0.0209, after: 0.0136 },
  { key: 'exhibition',    label: 'exhibition',    before: 0.0137, after: 0.0167 },
  { key: 'project',       label: 'project',       before: 0.0140, after: 0.0146 },
  { key: 'gallery',       label: 'gallery',       before: 0.0159, after: 0.0111 },
  { key: 'art2',          label: 'art',           before: 0.0146, after: 0.0103 },
  { key: 'center',        label: 'center',        before: 0.0084, after: 0.0148 },
  { key: 'takesplace',    label: 'takes place',   before: 0.0114, after: 0.0117 },
  { key: 'art3',          label: 'art',           before: 0.0130, after: 0.0094 },
  { key: 'anniversary',   label: 'anniversary',   before: 0.0114, after: 0.0094 }
];

const artNewspaperKeywordCompareData = artNewspaperKeywordFullData.filter(d => d.key !== 'art2' && d.key !== 'art3');

const artNewspaperKeywordSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'artNewspaperKeywordSvg', legendId: 'artNewspaperKeywordLegend', tooltipId: 'artNewspaperKeywordTooltip', detailId: 'artNewspaperKeywordDetail',
  items: artNewspaperKeywordCompareData, itemKey: d => d.key, itemLabel: d => d.label,
  series: artNewspaperKeywordSeries, W: 560, H: 320, marginLeft: 40,
  yMax: 0.04, yTicks: [0, 0.01, 0.02, 0.03, 0.04], yTickLabel: t => t.toFixed(2),
  tooltipValue: v => `Mean TF-IDF: ${v.toFixed(4)}`,
  onSelect: item => {
    const delta = item.after - item.before;
    return `<strong>"${item.label}"</strong> (RU): ${item.before.toFixed(4)} before 2022 &rarr; ${item.after.toFixed(4)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(4)}).`;
  }
}).init();

const artNewspaperKeywordFullBefore = artNewspaperKeywordFullData.map(d => ({ word: d.label, weight: d.before, ru: true }));
const artNewspaperKeywordFullAfter = artNewspaperKeywordFullData.map(d => ({ word: d.label, weight: d.after, ru: true }));

buildKeywordTable('artNewspaperKeywordTableBefore', artNewspaperKeywordFullBefore);
buildKeywordTable('artNewspaperKeywordTableAfter', artNewspaperKeywordFullAfter);

// ===== Results: national share across every institution and media outlet =====
// Consolidates the national-share figures already verified on each individual page.
const resultsData = [
  { key: 'pushkin',        label: 'Pushkin',         route: '/pushkin',         before: 24.0, after: 38.7 },
  { key: 'tretyakov',      label: 'Tretyakov',       route: '/tretyakov',       before: 69.2, after: 58.5 },
  { key: 'garage',         label: 'Garage',          route: '/garage',          before: 79.4, after: 96.6 },
  { key: 'mamm',           label: 'MAMM',            route: '/mamm',            before: 89.6, after: 98.8 },
  { key: 'russianmuseum',  label: 'Russian Museum',  route: '/russian-museum',  before: 54.5, after: 68.3 },
  { key: 'hermitage',      label: 'Hermitage',       route: '/hermitage',       before: 21.6, after: 39.5 },
  { key: 'artnewspaper',   label: 'Art Newspaper',   route: '/art-newspaper',   before: 30.9, after: 34.1 }
];

const resultsSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

createGroupedCompareChart({
  svgId: 'resultsSvg', legendId: 'resultsChartLegend', tooltipId: 'resultsTooltip', detailId: 'resultsDetail',
  items: resultsData, itemKey: d => d.key, itemLabel: d => d.label,
  series: resultsSeries, W: 960, H: 460, marginLeft: 40, marginBottom: 76,
  groupWidthRatio: 0.72, rotateLabels: true,
  yMax: 100, yTicks: [0, 20, 40, 60, 80, 100],
  tooltipValue: v => `${v.toFixed(1)}%`,
  onSelect: item => {
    const delta = item.after - item.before;
    return `<strong>${item.label}</strong>: ${item.before.toFixed(1)}% before 2022 &rarr; ${item.after.toFixed(1)}% after (${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pp).`;
  }
}).init();

function buildResultsTable(id, rows) {
  const tbody = document.getElementById(id);
  if (!tbody) return;
  const sorted = [...rows].sort((a, b) => (b.after - b.before) - (a.after - a.before));
  tbody.innerHTML = sorted.map(r => {
    const delta = r.after - r.before;
    const dir = delta >= 0 ? 'up' : 'down';
    const arrow = delta >= 0 ? '&#9650;' : '&#9660;';
    return `
      <tr>
        <td class="rt-institution"><a href="#${r.route}" data-link>${r.label}</a></td>
        <td class="rt-num">${r.before.toFixed(1)}%</td>
        <td class="rt-num">${r.after.toFixed(1)}%</td>
        <td class="rt-delta ${dir}">${arrow} ${Math.abs(delta).toFixed(1)} pp</td>
      </tr>
    `;
  }).join('');
}

buildResultsTable('resultsTableBody', resultsData);