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
  '/garage': 'page-garage',
  '/russian-museum': 'page-russian-museum',
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

createYearTrendChart({
  svgId: 'trendsSvg', legendId: 'chartLegend', tooltipId: 'chartTooltip',
  periodsId: 'chartPeriods', detailId: 'chartDetail',
  data: trendsData, categories: trendsCategories
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

// ===== Pushkin / Tretyakov: keyword shift & national component share =====
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

createGroupedCompareChart({
  svgId: 'keywordSvg', legendId: 'keywordLegend', tooltipId: 'keywordTooltip', detailId: 'keywordDetail',
  items: keywordCompareData, itemKey: d => d.word, itemLabel: d => d.word,
  series: keywordSeries, W: 560, H: 320, marginLeft: 34,
  yMax: Math.ceil(Math.max(...keywordCompareData.map(d => Math.max(d.before, d.after)))) + 1,
  yTicks: (() => {
    const max = Math.ceil(Math.max(...keywordCompareData.map(d => Math.max(d.before, d.after)))) + 1;
    const ticks = [];
    for (let t = 0; t <= max; t += 2) ticks.push(t);
    return ticks;
  })(),
  tooltipValue: v => `TF-IDF weight: ${v.toFixed(4)}`,
  onSelect: item => {
    if (item.before === 0 && item.after > 0) {
      return `<strong>"${item.word}"</strong> is absent before 2022 and emerges afterward with a weight of <strong>${item.after.toFixed(2)}</strong> &mdash; a genuinely new term in the vocabulary.`;
    }
    if (item.after === 0 && item.before > 0) {
      return `<strong>"${item.word}"</strong> carried a weight of <strong>${item.before.toFixed(2)}</strong> before 2022 and disappears entirely from the post-2022 top terms.`;
    }
    const delta = item.after - item.before;
    return `<strong>"${item.word}"</strong>: ${item.before.toFixed(2)} before 2022 &rarr; ${item.after.toFixed(2)} after (${delta >= 0 ? '+' : ''}${delta.toFixed(2)}).`;
  }
}).init();

createShareChart({
  svgId: 'nationalShareSvg', tooltipId: 'nationalShareTooltip', detailId: 'keywordDetail',
  items: nationalShareData, yMax: 45, yTicks: [0, 15, 30, 45], W: 380, H: 320,
  onSelect: () => `Records with a national/Russian component: <strong>45 of 202 (22.3%)</strong> before 2022 &rarr; <strong>71 of 198 (35.9%)</strong> after &mdash; a rise of 13.6 percentage points.`
}).init();

buildKeywordTable('keywordTableBefore', keywordFullBefore);
buildKeywordTable('keywordTableAfter', keywordFullAfter);

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