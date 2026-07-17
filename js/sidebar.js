import { MONUMENTS, REGION_ORDER, KINDS } from '../data/monuments.js';

// Left panel: search + filter chips + region-grouped, keyboard-navigable list.
// Purely DOM; calls onSelect(id) when the user picks a monument.

export function createSidebar({ onSelect }) {
  const aside = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const listEl = document.getElementById('monument-list');
  const chipsEl = document.getElementById('chips');
  const searchEl = document.getElementById('search');
  const statsEl = document.getElementById('sb-stats');

  let activeKind = 'all';
  let query = '';
  let kbIndex = -1;         // keyboard-highlighted visible row
  const rowById = new Map();

  // build chips
  for (const k of KINDS) {
    const b = document.createElement('button');
    b.textContent = k.label;
    b.dataset.kind = k.id;
    if (k.id === 'all') b.classList.add('active');
    b.addEventListener('click', () => { activeKind = k.id; syncChips(); render(); });
    chipsEl.appendChild(b);
  }
  function syncChips() {
    for (const b of chipsEl.children) b.classList.toggle('active', b.dataset.kind === activeKind);
  }

  function matches(m) {
    if (activeKind !== 'all' && !(m.kinds || []).includes(activeKind)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      m.state.toLowerCase().includes(q) ||
      (m.style || '').toLowerCase().includes(q)
    );
  }

  function render() {
    listEl.replaceChildren();
    rowById.clear();
    kbIndex = -1;
    let shown = 0;

    for (const region of REGION_ORDER) {
      const items = MONUMENTS.filter((m) => m.region === region && matches(m));
      if (!items.length) continue;
      const h = document.createElement('div');
      h.className = 'sb-region';
      h.textContent = region;
      listEl.appendChild(h);
      for (const m of items) {
        const row = document.createElement('button');
        row.className = 'sb-item';
        row.dataset.id = m.id;
        const dot = document.createElement('span');
        dot.className = 'sb-dot';
        dot.style.background = '#' + m.color.toString(16).padStart(6, '0');
        const txt = document.createElement('div');
        txt.innerHTML = `<div class="sb-item-name">${m.name}</div><div class="sb-item-sub">${m.city}, ${m.state}</div>`;
        row.append(dot, txt);
        if (m.unesco) {
          const u = document.createElement('span');
          u.className = 'unesco';
          u.textContent = 'UNESCO';
          row.appendChild(u);
        }
        row.addEventListener('click', () => onSelect(m.id));
        listEl.appendChild(row);
        rowById.set(m.id, row);
        shown++;
      }
    }
    if (!shown) {
      const e = document.createElement('div');
      e.className = 'sb-empty';
      e.textContent = 'No monuments match your search.';
      listEl.appendChild(e);
    }
    statsEl.textContent = shown === MONUMENTS.length
      ? `${MONUMENTS.length} monuments · every region`
      : `${shown} of ${MONUMENTS.length} shown`;
  }

  function visibleRows() {
    return [...listEl.querySelectorAll('.sb-item')];
  }
  function highlight(i) {
    const rows = visibleRows();
    kbIndex = Math.max(0, Math.min(rows.length - 1, i));
    rows.forEach((r, idx) => r.classList.toggle('kbd-focus', idx === kbIndex));
    if (rows[kbIndex]) rows[kbIndex].scrollIntoView({ block: 'nearest' });
  }

  searchEl.addEventListener('input', () => { query = searchEl.value; render(); });
  searchEl.addEventListener('keydown', (e) => {
    const rows = visibleRows();
    if (e.key === 'Enter') {
      e.preventDefault();
      const pick = kbIndex >= 0 ? rows[kbIndex] : rows[0];
      if (pick) { onSelect(pick.dataset.id); searchEl.blur(); } // release focus so shortcuts work
    } else if (e.key === 'ArrowDown') { e.preventDefault(); highlight(kbIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(kbIndex - 1); }
    else if (e.key === 'Escape') { searchEl.blur(); }
  });

  // sidebar open/close — a docked panel on desktop, a slide-over drawer on phones
  const backdrop = document.getElementById('sidebar-backdrop');
  const isMobile = () => window.innerWidth <= 760;
  let open = false;
  function setOpen(v) {
    open = v;
    aside.hidden = !open;
    toggle.style.display = open ? 'none' : 'flex';
    backdrop.classList.toggle('show', open && isMobile());
  }
  toggle.addEventListener('click', () => setOpen(true));
  backdrop.addEventListener('click', () => setOpen(false));

  function setActive(id) {
    for (const r of rowById.values()) r.classList.remove('active');
    const row = rowById.get(id);
    if (row) { row.classList.add('active'); row.scrollIntoView({ block: 'nearest' }); }
  }

  function focusSearch() {
    if (!open) setOpen(true);
    searchEl.focus();
    searchEl.select();
  }

  render();
  setOpen(!isMobile()); // docked-open on desktop, closed drawer on phones

  return { setActive, focusSearch, setOpen, get isOpen() { return open; } };
}
