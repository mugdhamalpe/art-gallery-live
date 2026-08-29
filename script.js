document.getElementById('year').textContent = new Date().getFullYear();

const wallEl = document.getElementById('wall');
const emptyState = document.getElementById('empty-state');

const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbCatalog = document.getElementById('lightbox-catalog');
const lbTitle = document.getElementById('lightbox-title');
const lbMeta = document.getElementById('lightbox-meta');
const lbDesc = document.getElementById('lightbox-desc');

let paintings = [];
let currentIndex = 0;

async function loadPaintings() {
  try {
    const res = await fetch('data/paintings.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load paintings.json');
    const data = await res.json();
    paintings = Array.isArray(data.paintings) ? data.paintings : [];
  } catch (err) {
    console.error(err);
    paintings = [];
  }
  render();
}

function render() {
  wallEl.innerHTML = '';

  if (paintings.length === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  paintings.forEach((p, i) => {
    const frame = document.createElement('article');
    frame.className = 'frame';
    frame.tabIndex = 0;
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-label', `View ${p.title}`);

    frame.innerHTML = `
      <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
      <div class="label">
        <span class="title">${escapeHtml(p.title)}</span>
        <span class="catalog">No. ${escapeHtml(p.catalogNumber || String(i + 1).padStart(3, '0'))}</span>
      </div>
    `;

    frame.addEventListener('click', () => openLightbox(i));
    frame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(i);
      }
    });

    wallEl.appendChild(frame);
  });
}

function openLightbox(index) {
  currentIndex = index;
  const p = paintings[index];
  lbImg.src = p.image;
  lbImg.alt = p.title;
  lbCatalog.textContent = `No. ${p.catalogNumber || String(index + 1).padStart(3, '0')}`;
  lbTitle.textContent = p.title;
  lbMeta.textContent = [p.medium, p.dimensions, p.year].filter(Boolean).join(' · ');
  lbDesc.textContent = p.description || '';
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

function step(delta) {
  if (paintings.length === 0) return;
  currentIndex = (currentIndex + delta + paintings.length) % paintings.length;
  openLightbox(currentIndex);
}

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox-prev').addEventListener('click', () => step(-1));
document.getElementById('lightbox-next').addEventListener('click', () => step(1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

loadPaintings();
