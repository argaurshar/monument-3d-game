// The on-map info card: history + "plan your visit" trip data. Reads from the
// static DOM skeleton in index.html and fills it per monument.

export function createInfoCard({ byId, onNearby, onWalk, onClose }) {
  const el = document.getElementById('infocard');
  const nameEl = el.querySelector('.ic-name');
  const locEl = el.querySelector('.ic-loc');
  const metaEl = el.querySelector('.ic-meta');
  const descEl = el.querySelector('.ic-desc');
  const factsEl = el.querySelector('.ic-facts');
  const tripGrid = el.querySelector('.ic-trip-grid');
  const nearbyEl = el.querySelector('.ic-nearby');
  const walkBtn = el.querySelector('.ic-walk');
  let currentId = null;

  el.querySelector('.ic-close').addEventListener('click', () => { hide(); if (onClose) onClose(); });
  walkBtn.addEventListener('click', () => { if (currentId && onWalk) onWalk(currentId); });

  function chip(text, cls) {
    const s = document.createElement('span');
    s.textContent = text;
    if (cls) s.className = cls;
    return s;
  }

  function tripCell(label, value) {
    const d = document.createElement('div');
    d.innerHTML = `<b>${label}</b>${value}`;
    return d;
  }

  function show(m) {
    currentId = m.id;
    nameEl.textContent = m.name;
    locEl.textContent = `${m.city}, ${m.state}`;

    metaEl.replaceChildren();
    if (m.unesco) metaEl.appendChild(chip('★ UNESCO', 'unesco'));
    if (m.built) metaEl.appendChild(chip(m.built));
    if (m.style) metaEl.appendChild(chip(m.style));
    if (m.builder) metaEl.appendChild(chip(m.builder));

    descEl.textContent = m.description;

    factsEl.replaceChildren();
    for (const f of m.facts) {
      const li = document.createElement('li');
      li.textContent = f;
      factsEl.appendChild(li);
    }

    tripGrid.replaceChildren(
      tripCell('Best time', m.trip.bestMonths),
      tripCell('Typical visit', m.trip.visitDuration),
      tripCell('Nearest airport', m.trip.nearestAirport),
      tripCell('Nearest rail', m.trip.nearestRail),
    );

    nearbyEl.replaceChildren();
    if (m.trip.nearby && m.trip.nearby.length) {
      nearbyEl.appendChild(chip('Nearby:', 'ic-nearby-label'));
      for (const nid of m.trip.nearby) {
        const nm = byId.get(nid);
        if (!nm) continue;
        const b = document.createElement('button');
        b.textContent = nm.name;
        b.addEventListener('click', () => { if (onNearby) onNearby(nid); });
        nearbyEl.appendChild(b);
      }
    }

    el.hidden = false;
    el.scrollTop = 0;
  }

  function hide() {
    el.hidden = true;
    currentId = null;
  }

  return { show, hide, el, get currentId() { return currentId; } };
}
