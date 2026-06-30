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