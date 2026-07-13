document.getElementById('year').textContent = new Date().getFullYear();

// ===== Methodology steps data =====
const steps = [
  {
    title: "Corpus Selection",
    content: "We selected exhibition archives from two flagship Russian institutions — the Pushkin Museum of Fine Arts and the State Tretyakov Gallery. These were chosen for their public visibility, archival accessibility, and representative role in Russian cultural policy."
  },
  {
    title: "Temporal Segmentation",
    content: "Each exhibition record is tagged with a temporal vector: Pre-2022 or Post-2022. The year 2022 marks the critical geopolitical shift that restructured Russia's international cultural partnerships. This binary temporal axis is the backbone of our analytical model."
  },
  {
    title: "Entity Extraction",
    content: "From each exhibition record, we extract structured entities: Exhibition name, Institution, Curator (where named), Artistic Movement, Origin of Artworks (International Loan vs. Internal Reserve), and Theme. These become the nodes of our knowledge graph."
  },
  {
    title: "Ontology Mapping",
    content: "Entities and their relationships are mapped onto a formal ontology using RDF/OWL conventions. We define classes (Exhibition, Institution, ArtworkOrigin) and properties (hasOrigin, organizes, borrowedFrom, partOf). The ontology is designed to be extensible to the full 500+ exhibition record dataset."
  },
  {
    title: "Representative Sample",
    content: "Rather than processing all records upfront, we demonstrate the method on 3–5 representative cases: one pre-2022 international exhibition, one post-2022 domestic exhibition, and one Eastern-pivot exhibition. This sample-first approach validates the schema before full-scale extraction."
  },
  {
    title: "Graph Transformation Analysis",
    content: "The 'pivot' is quantified as a graph property: the ratio of International_Loan nodes to Internal_Reserve nodes across the temporal axis. A transformation from a globally-connected hub structure to a locally-anchored archival structure constitutes the Institutional Pivot."
  }
];

const stepsWrap = document.getElementById('methodologySteps');
stepsWrap.innerHTML = steps.map((step, i) => `
  <div class="step-item reveal">
    <div class="step-num">${i + 1}</div>
    <div class="step-card">
      <h3>${step.title}</h3>
      <p>${step.content}</p>
    </div>
  </div>
`).join('');

// ===== Router =====
const routes = {
  '/': 'page-home',
  '/data': 'page-data',
  '/analytics': 'page-analytics',
  '/ontology': 'page-ontology',
  '/knowledge-graph': 'page-knowledge-graph',
  '/methodology': 'page-methodology',
  '/team': 'page-team'
};

const pages = document.querySelectorAll('.page');
const navLinkEls = document.querySelectorAll('[data-route]');
const mobileMenu = document.getElementById('mobileMenu');

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

// ===== Exhibition Analytics chart =====
// Data verified against final_analysis_fixed.csv (counts by year x category).
const trendsData = [
  { year: 2014, eastern: 1,  western: 1,  national: 0 },
  { year: 2015, eastern: 8,  western: 12, national: 9 },
  { year: 2016, eastern: 12, western: 14, national: 12 },
  { year: 2017, eastern: 9,  western: 13, national: 7 },
  { year: 2018, eastern: 7,  western: 9,  national: 2 },
  { year: 2019, eastern: 6,  western: 6,  national: 16 },
  { year: 2020, eastern: 5,  western: 7,  national: 16 },
  { year: 2021, eastern: 7,  western: 9,  national: 14 },
  { year: 2022, eastern: 11, western: 9,  national: 20 },
  { year: 2023, eastern: 16, western: 15, national: 24 },
  { year: 2024, eastern: 12, western: 6,  national: 31 },
  { year: 2025, eastern: 13, western: 12, national: 16 },
  { year: 2026, eastern: 3,  western: 3,  national: 7 }
];

const trendsCategories = [
  { key: 'eastern', label: 'Eastern Art', color: '#A06060' },
  { key: 'western', label: 'Western Art', color: '#2F6663' },
  { key: 'national', label: 'National Russian Art', color: '#C9A84C' }
];

const svgNS = 'http://www.w3.org/2000/svg';
const chartState = { hidden: new Set(), selectedYear: null, selectedPeriod: null };
const DEFAULT_DETAIL_HTML = "Click or tap a bar for a year's breakdown, or a period above for that era's totals.";

function elNS(tag, attrs) {
  const node = document.createElementNS(svgNS, tag);
  Object.keys(attrs || {}).forEach(k => node.setAttribute(k, attrs[k]));
  return node;
}

function yearTotal(row) {
  return row.eastern + row.western + row.national;
}

function periodOf(year) {
  return year <= 2021 ? 'pre' : (year === 2022 ? 'transition' : 'post');
}

function periodRows(key) {
  return trendsData.filter(r => periodOf(r.year) === key);
}

function buildLegend() {
  const legend = document.getElementById('chartLegend');
  if (!legend) return;
  legend.innerHTML = '';
  trendsCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'legend-btn';
    btn.dataset.key = cat.key;
    btn.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.label}`;
    btn.addEventListener('click', () => {
      if (chartState.hidden.has(cat.key)) {
        chartState.hidden.delete(cat.key);
      } else {
        chartState.hidden.add(cat.key);
      }
      renderChart();
    });
    legend.appendChild(btn);
  });
}

function buildPeriodButtons() {
  document.querySelectorAll('#chartPeriods .period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.period;
      chartState.selectedPeriod = chartState.selectedPeriod === key ? null : key;
      chartState.selectedYear = null;
      renderChart();
    });
  });
}

function showTooltip(e, row, cat, value, total) {
  const tooltip = document.getElementById('chartTooltip');
  if (!tooltip) return;
  const pct = total ? Math.round((value / total) * 100) : 0;
  tooltip.innerHTML = `<strong>${row.year}</strong> &middot; ${cat.label}<br>${value} exhibitions (${pct}% of that year)`;
  tooltip.classList.add('visible');
  positionTooltip(e);
}

function positionTooltip(e) {
  const tooltip = document.getElementById('chartTooltip');
  const wrap = document.querySelector('.chart-svg-wrap');
  if (!tooltip || !wrap) return;
  const rect = wrap.getBoundingClientRect();
  tooltip.style.left = (e.clientX - rect.left) + 'px';
  tooltip.style.top = (e.clientY - rect.top) + 'px';
}

function hideTooltip() {
  const tooltip = document.getElementById('chartTooltip');
  if (tooltip) tooltip.classList.remove('visible');
}

function selectYear(year) {
  chartState.selectedYear = year;
  chartState.selectedPeriod = null;
  renderChart();
}

function updateYearDetail(year) {
  const row = trendsData.find(r => r.year === year);
  const detail = document.getElementById('chartDetail');
  if (!row || !detail) return;
  const total = yearTotal(row);
  const periodLabel = row.year <= 2021 ? 'pre-2022' : (row.year === 2022 ? 'transition year' : 'post-2022');
  const parts = trendsCategories.map(cat => {
    const v = row[cat.key];
    const pct = total ? Math.round((v / total) * 100) : 0;
    return `<strong style="color:${cat.color}">${cat.label}</strong>: ${v} (${pct}%)`;
  }).join(' &middot; ');
  detail.innerHTML = `<strong>${row.year}</strong> &middot; ${periodLabel} &middot; ${total} exhibitions total<br>${parts}`;
}

function updatePeriodDetail(key) {
  const rows = periodRows(key);
  const detail = document.getElementById('chartDetail');
  if (!rows.length || !detail) return;
  const sums = { eastern: 0, western: 0, national: 0 };
  rows.forEach(r => { sums.eastern += r.eastern; sums.western += r.western; sums.national += r.national; });
  const total = sums.eastern + sums.western + sums.national;
  const years = rows.map(r => r.year);
  const range = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : `${years[0]}`;
  const label = key === 'pre' ? `Pre-2022 (${range})` : key === 'transition' ? '2022 · Transition year' : `Post-2022 (${range})`;
  const parts = trendsCategories.map(cat => {
    const v = sums[cat.key];
    const pct = total ? Math.round((v / total) * 100) : 0;
    return `<strong style="color:${cat.color}">${cat.label}</strong>: ${v} (${pct}%)`;
  }).join(' &middot; ');
  detail.innerHTML = `<strong>${label}</strong> &middot; ${years.length} year${years.length > 1 ? 's' : ''} &middot; ${total} exhibitions total<br>${parts}`;
}

function resetDetail() {
  const detail = document.getElementById('chartDetail');
  if (detail) detail.innerHTML = DEFAULT_DETAIL_HTML;
}

function renderChart() {
  const svg = document.getElementById('trendsSvg');
  if (!svg) return;
  svg.innerHTML = '';

  document.querySelectorAll('.legend-btn').forEach(btn => {
    btn.classList.toggle('dimmed', chartState.hidden.has(btn.dataset.key));
  });

  document.querySelectorAll('#chartPeriods .period-btn').forEach(btn => {
    const isActive = chartState.selectedPeriod === btn.dataset.period;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('dimmed', !!chartState.selectedPeriod && !isActive);
  });

  const W = 960, H = 480;
  const marginLeft = 46, marginRight = 16, marginTop = 28, marginBottom = 56;
  const plotW = W - marginLeft - marginRight;
  const plotH = H - marginTop - marginBottom;

  const maxCount = Math.max(...trendsData.map(yearTotal));
  const yMax = Math.ceil(maxCount / 10) * 10;
  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  const n = trendsData.length;
  const band = plotW / n;
  const barW = band * 0.6;

  // period backgrounds (pre-2022 / transition / post-2022)
  const periodBg = elNS('g', {});
  trendsData.forEach((row, i) => {
    const x = marginLeft + i * band;
    const fill = row.year <= 2021 ? 'rgba(47,102,99,0.045)'
      : row.year === 2022 ? 'rgba(201,168,76,0.09)'
      : 'rgba(160,96,96,0.055)';
    periodBg.appendChild(elNS('rect', {
      x: x.toFixed(2), y: marginTop, width: band.toFixed(2), height: plotH, fill
    }));
  });
  svg.appendChild(periodBg);

  // gridlines + y-axis labels
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

  // 2022 pivot marker
  const pivotIndex = trendsData.findIndex(r => r.year === 2022);
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

  trendsData.forEach((row, i) => {
    const x = marginLeft + i * band + (band - barW) / 2;
    const total = yearTotal(row);
    const isSelected = chartState.selectedYear === row.year;
    const isPeriodFaded = !!chartState.selectedPeriod && chartState.selectedPeriod !== periodOf(row.year);
    let cumulative = 0;

    const yearGroup = elNS('g', { class: 'chart-year-group', opacity: isPeriodFaded ? 0.2 : 1 });

    trendsCategories.forEach(cat => {
      if (chartState.hidden.has(cat.key)) return;
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

    // transparent hit area for click-to-select across the whole column
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

  if (chartState.selectedYear != null) {
    updateYearDetail(chartState.selectedYear);
  } else if (chartState.selectedPeriod != null) {
    updatePeriodDetail(chartState.selectedPeriod);
  } else {
    resetDetail();
  }
}

function initTrendsChart() {
  if (!document.getElementById('trendsSvg')) return;
  buildLegend();
  buildPeriodButtons();
  renderChart();
}

initTrendsChart();

// ===== Keyword / TF-IDF analysis =====
// Values verified against the TF-IDF extraction output (before/after 2022).
const nationalShareData = [
  { key: 'before', label: 'Before 2022', color: '#2F6663', count: 45, total: 202, pct: 22.3 },
  { key: 'after',  label: 'After 2022',  color: '#A06060', count: 71, total: 198, pct: 35.9 }
];

const keywordCompareData = [
  { word: 'art',        before: 7.5455, after: 7.3371 },
  { word: 'works',      before: 7.7288, after: 7.0628 },
  { word: 'russian',    before: 4.5246, after: 6.2481 },
  { word: 'collection', before: 5.8772, after: 4.7494 },
  { word: 'unique',     before: 4.6174, after: 0 },
  { word: 'museum',     before: 4.2727, after: 3.5332 },
  { word: 'century',    before: 0,      after: 7.8787 },
  { word: 'tretyakov',  before: 0,      after: 3.5966 }
];

const keywordSeries = [
  { key: 'before', label: 'Before 2022', color: '#2F6663' },
  { key: 'after',  label: 'After 2022',  color: '#A06060' }
];

// Full TF-IDF term lists. Russian-language terms from the bilingual corpus
// are flagged `ru: true` and rendered with an RU tag rather than merged
// into their English near-equivalents, since they carry a distinct weight.
const keywordFullBefore = [
  { word: 'works', weight: 7.7288 },
  { word: 'art', weight: 7.5455 },
  { word: 'collection', weight: 5.8772 },
  { word: 'unique', weight: 4.6174 },
  { word: 'russian', weight: 4.5246 },
  { word: 'artists', weight: 4.4484 },
  { word: 'museum', weight: 4.2727 },
  { word: 'artist', weight: 4.2098 },
  { word: 'exhibition', weight: 4.1491, ru: true },
  { word: 'works', weight: 4.1419, ru: true },
  { word: 'showcases', weight: 3.9867 },
  { word: 'artists', weight: 3.8178, ru: true },
  { word: 'selection', weight: 3.6328 }
];

const keywordFullAfter = [
  { word: 'art', weight: 7.3371 },
  { word: 'works', weight: 7.0628 },
  { word: 'russian', weight: 6.2481 },
  { word: 'collection', weight: 4.7494 },
  { word: 'artists', weight: 4.3856 },
  { word: 'exhibition', weight: 4.2424, ru: true },
  { word: 'century', weight: 7.8787 },
  { word: 'gallery', weight: 3.9971 },
  { word: 'features', weight: 3.7497 },
  { word: 'works', weight: 3.6335, ru: true },
  { word: 'tretyakov', weight: 3.5966 },
  { word: 'museum', weight: 3.5332 }
];

const keywordChartState = { hidden: new Set(), selectedWord: null };

function buildKeywordLegend() {
  const legend = document.getElementById('keywordLegend');
  if (!legend) return;
  legend.innerHTML = '';
  keywordSeries.forEach(s => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'legend-btn';
    btn.dataset.key = s.key;
    btn.innerHTML = `<span class="dot" style="background:${s.color}"></span>${s.label}`;
    btn.addEventListener('click', () => {
      if (keywordChartState.hidden.has(s.key)) {
        keywordChartState.hidden.delete(s.key);
      } else {
        keywordChartState.hidden.add(s.key);
      }
      renderKeywordChart();
    });
    legend.appendChild(btn);
  });
}

function showKeywordTooltip(e, word, series, value) {
  const tooltip = document.getElementById('keywordTooltip');
  if (!tooltip) return;
  tooltip.innerHTML = `<strong>${word}</strong> &middot; ${series.label}<br>TF-IDF weight: ${value.toFixed(4)}`;
  tooltip.classList.add('visible');
  positionKeywordTooltip(e, 'keywordTooltip');
}

function positionKeywordTooltip(e, tooltipId) {
  const tooltip = document.getElementById(tooltipId);
  const wrap = e.currentTarget.closest('.chart-svg-wrap');
  if (!tooltip || !wrap) return;
  const rect = wrap.getBoundingClientRect();
  tooltip.style.left = (e.clientX - rect.left) + 'px';
  tooltip.style.top = (e.clientY - rect.top) + 'px';
}

function hideKeywordTooltip(tooltipId) {
  const tooltip = document.getElementById(tooltipId);
  if (tooltip) tooltip.classList.remove('visible');
}

function selectKeyword(word) {
  keywordChartState.selectedWord = word;
  renderKeywordChart();
  const item = keywordCompareData.find(d => d.word === word);
  const detail = document.getElementById('keywordDetail');
  if (!item || !detail) return;
  let msg;
  if (item.before === 0 && item.after > 0) {
    msg = `<strong>"${word}"</strong> is absent before 2022 and emerges afterward with a weight of <strong>${item.after.toFixed(2)}</strong> &mdash; a genuinely new term in the vocabulary.`;
  } else if (item.after === 0 && item.before > 0) {
    msg = `<strong>"${word}"</strong> carried a weight of <strong>${item.before.toFixed(2)}</strong> before 2022 and disappears entirely from the post-2022 top terms.`;
  } else {
    const delta = item.after - item.before;
    msg = `<strong>"${word}"</strong>: ${item.before.toFixed(2)} before 2022 &rarr; ${item.after.toFixed(2)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(2)}).`;
  }
  detail.innerHTML = msg;
}

function renderKeywordChart() {
  const svg = document.getElementById('keywordSvg');
  if (!svg) return;
  svg.innerHTML = '';

  document.querySelectorAll('#keywordLegend .legend-btn').forEach(btn => {
    btn.classList.toggle('dimmed', keywordChartState.hidden.has(btn.dataset.key));
  });

  const W = 560, H = 320;
  const marginLeft = 34, marginRight = 12, marginTop = 16, marginBottom = 44;
  const plotW = W - marginLeft - marginRight;
  const plotH = H - marginTop - marginBottom;

  const maxVal = Math.max(...keywordCompareData.map(d => Math.max(d.before, d.after)));
  const yMax = Math.ceil(maxVal) + 1;
  const yTicks = [];
  for (let t = 0; t <= yMax; t += 2) yTicks.push(t);

  const n = keywordCompareData.length;
  const band = plotW / n;
  const groupW = band * 0.68;
  const barW = groupW / 2;

  const gridG = elNS('g', {});
  yTicks.forEach(t => {
    const y = marginTop + plotH - (t / yMax) * plotH;
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

  keywordCompareData.forEach((item, i) => {
    const groupX = marginLeft + i * band + (band - groupW) / 2;
    const isSelected = keywordChartState.selectedWord === item.word;

    keywordSeries.forEach((s, si) => {
      if (keywordChartState.hidden.has(s.key)) return;
      const value = item[s.key];
      const segH = Math.max((value / yMax) * plotH, value > 0 ? 2 : 0);
      const x = groupX + si * barW;
      const y = marginTop + plotH - segH;

      const rect = elNS('rect', {
        x: x.toFixed(2), y: y.toFixed(2), width: (barW - 3).toFixed(2), height: segH.toFixed(2),
        fill: s.color, class: 'chart-bar-seg',
        stroke: isSelected ? '#2C2416' : 'none', 'stroke-width': isSelected ? 1.5 : 0
      });
      rect.addEventListener('mouseenter', (e) => showKeywordTooltip(e, item.word, s, value));
      rect.addEventListener('mousemove', (e) => positionKeywordTooltip(e, 'keywordTooltip'));
      rect.addEventListener('mouseleave', () => hideKeywordTooltip('keywordTooltip'));
      rect.addEventListener('click', () => selectKeyword(item.word));
      svg.appendChild(rect);
    });

    const hit = elNS('rect', {
      x: (marginLeft + i * band).toFixed(2), y: marginTop, width: band.toFixed(2), height: plotH,
      fill: 'transparent'
    });
    hit.style.cursor = 'pointer';
    hit.addEventListener('click', () => selectKeyword(item.word));
    svg.appendChild(hit);

    const label = elNS('text', {
      x: (marginLeft + i * band + band / 2).toFixed(2), y: H - marginBottom + 20, 'text-anchor': 'middle',
      class: 'chart-year-label' + (isSelected ? ' active-year' : '')
    });
    label.textContent = item.word;
    svg.appendChild(label);
  });
}

function showNationalTooltip(e, item) {
  const tooltip = document.getElementById('nationalShareTooltip');
  if (!tooltip) return;
  tooltip.innerHTML = `<strong>${item.label}</strong><br>${item.count} of ${item.total} exhibitions (${item.pct}%)`;
  tooltip.classList.add('visible');
  positionKeywordTooltip(e, 'nationalShareTooltip');
}

function selectNationalShare() {
  const detail = document.getElementById('keywordDetail');
  if (!detail) return;
  detail.innerHTML = `Records with a national/Russian component: <strong>45 of 202 (22.3%)</strong> before 2022 &rarr; <strong>71 of 198 (35.9%)</strong> after &mdash; a rise of 13.6 percentage points.`;
}

function renderNationalShareChart() {
  const svg = document.getElementById('nationalShareSvg');
  if (!svg) return;
  svg.innerHTML = '';

  const W = 380, H = 320;
  const marginLeft = 40, marginRight = 16, marginTop = 30, marginBottom = 50;
  const plotW = W - marginLeft - marginRight;
  const plotH = H - marginTop - marginBottom;
  const yMax = 45;
  const yTicks = [0, 15, 30, 45];

  const gridG = elNS('g', {});
  yTicks.forEach(t => {
    const y = marginTop + plotH - (t / yMax) * plotH;
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

  const n = nationalShareData.length;
  const band = plotW / n;
  const barW = band * 0.55;

  nationalShareData.forEach((item, i) => {
    const x = marginLeft + i * band + (band - barW) / 2;
    const segH = (item.pct / yMax) * plotH;
    const y = marginTop + plotH - segH;

    const rect = elNS('rect', {
      x: x.toFixed(2), y: y.toFixed(2), width: barW.toFixed(2), height: segH.toFixed(2),
      fill: item.color, class: 'chart-bar-seg'
    });
    rect.addEventListener('mouseenter', (e) => showNationalTooltip(e, item));
    rect.addEventListener('mousemove', (e) => positionKeywordTooltip(e, 'nationalShareTooltip'));
    rect.addEventListener('mouseleave', () => hideKeywordTooltip('nationalShareTooltip'));
    rect.addEventListener('click', selectNationalShare);
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

function initKeywordAnalysis() {
  if (!document.getElementById('keywordSvg')) return;
  buildKeywordLegend();
  renderKeywordChart();
  renderNationalShareChart();
  buildKeywordTable('keywordTableBefore', keywordFullBefore);
  buildKeywordTable('keywordTableAfter', keywordFullAfter);
}

initKeywordAnalysis();

// ===== Hermitage Museum Exhibition Analytics chart =====
// Data verified against hermitage_fixed.csv (counts by year x category, excludes 15 no-content records).
const hermitageTrendsData = [
  { year: 2014, eastern: 7,  western: 15, national: 4 },
  { year: 2015, eastern: 15, western: 12, national: 9 },
  { year: 2016, eastern: 15, western: 20, national: 7 },
  { year: 2017, eastern: 15, western: 13, national: 13 },
  { year: 2018, eastern: 13, western: 25, national: 4 },
  { year: 2019, eastern: 16, western: 19, national: 10 },
  { year: 2020, eastern: 13, western: 9,  national: 7 },
  { year: 2021, eastern: 9,  western: 12, national: 9 },
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

const hermitageChartState = { hidden: new Set(), selectedYear: null, selectedPeriod: null };
const HERMITAGE_DEFAULT_DETAIL_HTML = "Click or tap a bar for a year's breakdown, or a period above for that era's totals.";

function hermitageYearTotal(row) {
  return row.eastern + row.western + row.national;
}

function hermitagePeriodOf(year) {
  return year <= 2021 ? 'pre' : (year === 2022 ? 'transition' : 'post');
}

function hermitagePeriodRows(key) {
  return hermitageTrendsData.filter(r => hermitagePeriodOf(r.year) === key);
}

function buildHermitageLegend() {
  const legend = document.getElementById('hermitageChartLegend');
  if (!legend) return;
  legend.innerHTML = '';
  hermitageTrendsCategories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'legend-btn';
    btn.dataset.key = cat.key;
    btn.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.label}`;
    btn.addEventListener('click', () => {
      if (hermitageChartState.hidden.has(cat.key)) {
        hermitageChartState.hidden.delete(cat.key);
      } else {
        hermitageChartState.hidden.add(cat.key);
      }
      renderHermitageChart();
    });
    legend.appendChild(btn);
  });
}

function buildHermitagePeriodButtons() {
  document.querySelectorAll('#hermitageChartPeriods .period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.period;
      hermitageChartState.selectedPeriod = hermitageChartState.selectedPeriod === key ? null : key;
      hermitageChartState.selectedYear = null;
      renderHermitageChart();
    });
  });
}

function showHermitageTooltip(e, row, cat, value, total) {
  const tooltip = document.getElementById('hermitageChartTooltip');
  if (!tooltip) return;
  const pct = total ? Math.round((value / total) * 100) : 0;
  tooltip.innerHTML = `<strong>${row.year}</strong> &middot; ${cat.label}<br>${value} exhibitions (${pct}% of that year)`;
  tooltip.classList.add('visible');
  positionHermitageTooltip(e);
}

function positionHermitageTooltip(e) {
  const tooltip = document.getElementById('hermitageChartTooltip');
  const wrap = document.getElementById('hermitageChartSvgWrap');
  if (!tooltip || !wrap) return;
  const rect = wrap.getBoundingClientRect();
  tooltip.style.left = (e.clientX - rect.left) + 'px';
  tooltip.style.top = (e.clientY - rect.top) + 'px';
}

function hideHermitageTooltip() {
  const tooltip = document.getElementById('hermitageChartTooltip');
  if (tooltip) tooltip.classList.remove('visible');
}

function selectHermitageYear(year) {
  hermitageChartState.selectedYear = year;
  hermitageChartState.selectedPeriod = null;
  renderHermitageChart();
}

function updateHermitageYearDetail(year) {
  const row = hermitageTrendsData.find(r => r.year === year);
  const detail = document.getElementById('hermitageChartDetail');
  if (!row || !detail) return;
  const total = hermitageYearTotal(row);
  const periodLabel = row.year <= 2021 ? 'pre-2022' : (row.year === 2022 ? 'transition year' : 'post-2022');
  const parts = hermitageTrendsCategories.map(cat => {
    const v = row[cat.key];
    const pct = total ? Math.round((v / total) * 100) : 0;
    return `<strong style="color:${cat.color}">${cat.label}</strong>: ${v} (${pct}%)`;
  }).join(' &middot; ');
  detail.innerHTML = `<strong>${row.year}</strong> &middot; ${periodLabel} &middot; ${total} exhibitions total<br>${parts}`;
}

function updateHermitagePeriodDetail(key) {
  const rows = hermitagePeriodRows(key);
  const detail = document.getElementById('hermitageChartDetail');
  if (!rows.length || !detail) return;
  const sums = { eastern: 0, western: 0, national: 0 };
  rows.forEach(r => { sums.eastern += r.eastern; sums.western += r.western; sums.national += r.national; });
  const total = sums.eastern + sums.western + sums.national;
  const years = rows.map(r => r.year);
  const range = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : `${years[0]}`;
  const label = key === 'pre' ? `Pre-2022 (${range})` : key === 'transition' ? '2022 · Transition year' : `Post-2022 (${range})`;
  const parts = hermitageTrendsCategories.map(cat => {
    const v = sums[cat.key];
    const pct = total ? Math.round((v / total) * 100) : 0;
    return `<strong style="color:${cat.color}">${cat.label}</strong>: ${v} (${pct}%)`;
  }).join(' &middot; ');
  detail.innerHTML = `<strong>${label}</strong> &middot; ${years.length} year${years.length > 1 ? 's' : ''} &middot; ${total} exhibitions total<br>${parts}`;
}

function resetHermitageDetail() {
  const detail = document.getElementById('hermitageChartDetail');
  if (detail) detail.innerHTML = HERMITAGE_DEFAULT_DETAIL_HTML;
}

function renderHermitageChart() {
  const svg = document.getElementById('hermitageTrendsSvg');
  if (!svg) return;
  svg.innerHTML = '';

  document.querySelectorAll('#hermitageChartLegend .legend-btn').forEach(btn => {
    btn.classList.toggle('dimmed', hermitageChartState.hidden.has(btn.dataset.key));
  });

  document.querySelectorAll('#hermitageChartPeriods .period-btn').forEach(btn => {
    const isActive = hermitageChartState.selectedPeriod === btn.dataset.period;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('dimmed', !!hermitageChartState.selectedPeriod && !isActive);
  });

  const W = 960, H = 480;
  const marginLeft = 46, marginRight = 16, marginTop = 28, marginBottom = 56;
  const plotW = W - marginLeft - marginRight;
  const plotH = H - marginTop - marginBottom;

  const maxCount = Math.max(...hermitageTrendsData.map(hermitageYearTotal));
  const yMax = Math.ceil(maxCount / 10) * 10;
  const yTicks = [0, yMax / 4, yMax / 2, (yMax * 3) / 4, yMax];

  const n = hermitageTrendsData.length;
  const band = plotW / n;
  const barW = band * 0.6;

  const periodBg = elNS('g', {});
  hermitageTrendsData.forEach((row, i) => {
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

  const pivotIndex = hermitageTrendsData.findIndex(r => r.year === 2022);
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

  hermitageTrendsData.forEach((row, i) => {
    const x = marginLeft + i * band + (band - barW) / 2;
    const total = hermitageYearTotal(row);
    const isSelected = hermitageChartState.selectedYear === row.year;
    const isPeriodFaded = !!hermitageChartState.selectedPeriod && hermitageChartState.selectedPeriod !== hermitagePeriodOf(row.year);
    let cumulative = 0;

    const yearGroup = elNS('g', { class: 'chart-year-group', opacity: isPeriodFaded ? 0.2 : 1 });

    hermitageTrendsCategories.forEach(cat => {
      if (hermitageChartState.hidden.has(cat.key)) return;
      const value = row[cat.key];
      const segH = Math.max((value / yMax) * plotH, 0);
      const y = marginTop + plotH - ((cumulative + value) / yMax) * plotH;

      const rect = elNS('rect', {
        x: x.toFixed(2), y: y.toFixed(2), width: barW.toFixed(2), height: segH.toFixed(2),
        fill: cat.color, class: 'chart-bar-seg',
        stroke: isSelected ? '#2C2416' : 'none', 'stroke-width': isSelected ? 1.5 : 0
      });
      rect.addEventListener('mouseenter', (e) => showHermitageTooltip(e, row, cat, value, total));
      rect.addEventListener('mousemove', positionHermitageTooltip);
      rect.addEventListener('mouseleave', hideHermitageTooltip);
      rect.addEventListener('click', () => selectHermitageYear(row.year));

      yearGroup.appendChild(rect);
      cumulative += value;
    });

    const hit = elNS('rect', {
      x: (marginLeft + i * band).toFixed(2), y: marginTop, width: band.toFixed(2), height: plotH,
      fill: 'transparent', class: 'chart-year-hit'
    });
    hit.addEventListener('click', () => selectHermitageYear(row.year));
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

  if (hermitageChartState.selectedYear != null) {
    updateHermitageYearDetail(hermitageChartState.selectedYear);
  } else if (hermitageChartState.selectedPeriod != null) {
    updateHermitagePeriodDetail(hermitageChartState.selectedPeriod);
  } else {
    resetHermitageDetail();
  }
}

function initHermitageTrendsChart() {
  if (!document.getElementById('hermitageTrendsSvg')) return;
  buildHermitageLegend();
  buildHermitagePeriodButtons();
  renderHermitageChart();
}

initHermitageTrendsChart();