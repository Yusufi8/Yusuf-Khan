// Clickable Odoo screens for the Projects section and the case pages.
// Each one is redrawn from the current version of a module I built (Odoo 16, T&I Projects), with
// sample data only (User 1, Hex Bolt, Sample Exports...), so no company records leave the company.
// Put <div data-screen="name"></div> where one should appear:
// requisition, management, people, variant or packing.
(() => {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const now = () => new Date().toTimeString().slice(0, 5);
  const inr = (n, d = 2) => `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  const kg = (n) => Number(n).toFixed(2);

  // Window frame: Odoo's purple bar, an app name and the menu items passed in
  const frame = (app, menu, right, body) => `
    <div class="oe-nav">
      <span class="oe-apps" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <span class="oe-app">${app}</span>
      <span class="oe-menu">${menu}</span>
      <span class="oe-right">${right || ''}</span>
    </div>
    <div class="oe-body">${body}</div>`;

  // Redraw a screen and put the focus back on the control that had it (or on the selector given)
  const redraw = (box, html, focusSel) => {
    const a = document.activeElement;
    const keep = !focusSel && a && box.contains(a) ? a : null;
    let sel = focusSel;
    if (keep) {
      const d = Object.entries(keep.dataset)[0];
      if (d) sel = `[data-${d[0].replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}="${CSS.escape(d[1])}"]`;
    }
    box.innerHTML = html;
    const el = sel && box.querySelector(sel);
    if (el) el.focus();
  };

  // ======================================================================================
  // 1. Material requisition (ti_material_requisition 16.0.3.8): the Request Materials pop-up,
  //    then the request moving through its real states. A short line takes the director path.
  // ======================================================================================
  const STOCK = { 'Hex Bolt M10 × 50 mm': [120, 'Units'], 'Welding Rod 3.15 mm': [8, 'kg'], 'Safety Gloves': [40, 'Pairs'], 'Steel Pipe 40 mm': [0, 'm'] };
  const ROLE = { pu: ['User 1', 'Production User'], pm: ['User 2', 'Production Manager'], im: ['User 3', 'Inventory Manager'], dir: ['User 4', 'Director'], auto: ['Odoo', 'on the director\'s approval'] };
  const PATH_OK = [
    ['Draft', 'pu', 'Request created from the Request Materials pop-up.'],
    ['Submitted', 'pu', 'Sent to the Production Manager, who can approve in Odoo or straight from the e-mail.'],
    ['Manager Approved', 'pm', 'Approved by the Production Manager.'],
    ['Inventory Review', 'im', 'The Inventory Manager checks stock for every line.'],
    ['Ready to Issue', 'im', 'Everything is in stock.'],
    ['Stock Reserved', 'im', 'Stock reserved in an issue transfer.'],
    ['Issued', 'im', 'Material issued from stores, with an issue slip.'],
    ['Completed', 'pu', 'The person who asked marked it received. Request closed.'],
  ];
  const PATH_SHORT = [
    ...PATH_OK.slice(0, 4),
    ['Partially Available', 'im', 'Some lines are short.'],
    ['Waiting for Approval', 'im', 'The shortage is sent to a director.'],
    ['Approved', 'dir', 'A director approved the shortage.'],
    ['PR Created', 'auto', 'Purchase requisition PR/2026/0018 created for the short lines and sent to Purchase automatically.'],
    PATH_OK[6],
    PATH_OK[7],
  ];

  const requisition = (box) => {
    const s = { lines: [['Hex Bolt M10 × 50 mm', 50], ['Welding Rod 3.15 mm', 12]], step: -1, path: PATH_OK, log: [], priority: 'Normal', dept: 'Fabrication', shut: false };
    const short = () => s.lines.some(([p, q]) => q > STOCK[p][0]);

    const lineRows = (edit) => s.lines.map(([p, q], i) => {
      const [onHand, uom] = STOCK[p];
      const isShort = q > onHand;
      return `<tr>
        <td>${edit ? `<select data-line="${i}" aria-label="Product">${Object.keys(STOCK).map((k) => `<option${k === p ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>` : esc(p)}</td>
        <td>${uom}</td>
        <td class="num">${edit ? `<input type="number" min="1" value="${q}" data-qty="${i}" aria-label="Qty needed">` : q}</td>
        <td class="num ${isShort ? 'oe-red' : 'oe-green'}">${onHand}${isShort ? ' <small>short</small>' : ''}</td>
        ${edit ? `<td><button type="button" class="oe-x" data-del="${i}" aria-label="Remove line">×</button></td>` : ''}
      </tr>`;
    }).join('');

    const wizard = () => `
      <div class="oe-page-title"><span>Material Requisitions</span></div>
      <div class="oe-control"><button type="button" class="oe-btn" data-act="open">Request Materials</button><span class="oe-hint">a short pop-up instead of a long form</span></div>
      <div class="oe-sheet oe-list">
        <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Reference</th><th>Requested By</th><th>Required By</th><th>Status</th></tr></thead><tbody>
          <tr><td>MR/2026/0057</td><td>User 5</td><td>Tomorrow</td><td><span class="oe-chip">Ready to Issue</span></td></tr>
          <tr><td>MR/2026/0056</td><td>User 1</td><td>Today</td><td><span class="oe-chip">Inventory Review</span></td></tr>
          <tr><td>MR/2026/0055</td><td>User 6</td><td>Yesterday</td><td><span class="oe-chip">Completed</span></td></tr>
        </tbody></table></div>
      </div>
      <div class="oe-dialog" data-dialog${s.shut ? ' hidden' : ''} role="dialog" aria-label="Request Materials">
        <div class="oe-dialog-box oe-wide">
          <header><strong>Request Materials</strong><button type="button" class="oe-x" data-act="close" aria-label="Close">×</button></header>
          <p class="oe-sep">Request details</p>
          <div class="oe-grid2">
            <label>Department<select data-f="dept">${['Fabrication', 'Assembly', 'Maintenance'].map((d) => `<option${d === s.dept ? ' selected' : ''}>${d}</option>`).join('')}</select></label>
            <label>Required By<input type="date" value="${new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)}"></label>
            <fieldset><legend>Priority</legend>${['Normal', 'Urgent', 'Critical'].map((p) => `<label class="oe-radio"><input type="radio" name="prio-${box.id}" value="${p}"${p === s.priority ? ' checked' : ''}>${p}</label>`).join('')}</fieldset>
            <label>Purpose<input type="text" value="Frame welding for S00012"></label>
          </div>
          <p class="oe-sep">Order references</p>
          <div class="oe-grid2">
            <label>Sales Order<select><option>S00012 · Sample Customer</option><option>S00015 · Demo Industries</option></select></label>
            <label>Project<select><option>Conveyor Line 2</option><option>Plant Maintenance</option></select></label>
          </div>
          <p class="oe-sep">Products required</p>
          <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Product</th><th>Unit</th><th class="num">Qty Needed</th><th class="num">Currently In Stock</th><th><span class="sr-only">Remove</span></th></tr></thead>
          <tbody>${lineRows(true)}</tbody></table></div>
          <button type="button" class="oe-link" data-act="add">Add a line</button>
          <footer><button type="button" class="oe-btn" data-act="submit">✔ Submit Request</button><button type="button" class="oe-btn oe-btn-2" data-act="close">Save as Draft</button></footer>
        </div>
      </div>`;

    const record = () => {
      const done = s.step >= s.path.length - 1;
      const next = s.path[s.step + 1];
      const who = next && ROLE[next[1]];
      return `
      <div class="oe-page-title"><span>Material Requisitions / <b>MR/2026/0058</b></span></div>
      <div class="oe-control">
        ${done ? '<button type="button" class="oe-btn oe-btn-2" data-act="again">Start again</button><span class="oe-hint">Try it again with every line in stock (or with one short).</span>'
          : `<button type="button" class="oe-btn" data-act="next">Next: ${next[0]}</button><span class="oe-hint">${next[1] === 'auto' ? 'happens by itself' : `as ${who[0]} (${who[1]})`}</span>`}
      </div>
      <ol class="oe-status" aria-label="Status">${s.path.map(([n], i) => `<li class="${i === s.step ? 'on' : i < s.step ? 'past' : ''}"${i === s.step ? ' aria-current="step"' : ''}>${n}</li>`).join('')}</ol>
      <div class="oe-sheet">
        <div class="oe-grid2 oe-read">
          <p><span>Department</span>${esc(s.dept)}</p><p><span>Priority</span>${esc(s.priority)}</p>
          <p><span>Requested by</span>User 1</p><p><span>Sales Order</span>S00012</p>
        </div>
        <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Product</th><th>Unit</th><th class="num">Requested</th><th class="num">In stock</th></tr></thead><tbody>${lineRows(false)}</tbody></table></div>
        ${s.path === PATH_SHORT && s.step >= 7 ? '<p class="oe-note">Short lines: <b>PR/2026/0018</b> was created and sent to Purchase, linked back to this request.</p>' : ''}
      </div>
      <div class="oe-chatter" aria-live="polite">
        <p class="oe-chatter-h">Timeline: every step is kept, with who and when</p>
        ${s.log.slice().reverse().map((l) => `<div class="oe-msg"><i aria-hidden="true">${l.who === 'Odoo' ? 'O' : l.who.slice(-1)}</i><div><b>${l.who}</b> <small>${l.role} · ${l.at}</small><p><span class="oe-chip">${l.state}</span> ${l.text}</p></div></div>`).join('')}
      </div>`;
    };

    const draw = (focusSel) => redraw(box, frame('Manufacturing', '<span>Operations</span><span class="on">Material Requisitions</span>', '<span class="oe-user">Production User</span>', s.step < 0 ? wizard() : record()), focusSel);
    const log = () => {
      const [state, r, text] = s.path[s.step];
      s.log.push({ who: ROLE[r][0], role: ROLE[r][1], at: now(), state, text });
    };

    box.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.line) s.lines[t.dataset.line][0] = t.value;
      if (t.dataset.qty) s.lines[t.dataset.qty][1] = Math.max(1, Number(t.value) || 1);
      if (t.dataset.f === 'dept') s.dept = t.value;
      if (t.type === 'radio') s.priority = t.value;
      if (t.dataset.line || t.dataset.qty) draw();
    });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'open') { s.shut = false; draw('[data-dialog] select'); }
      if (act === 'close') { s.shut = true; draw('[data-act="open"]'); }
      if (b.dataset.del) { s.lines.splice(Number(b.dataset.del), 1); draw('[data-act="add"]'); }
      if (act === 'add') { s.lines.push([Object.keys(STOCK).find((k) => !s.lines.some(([p]) => p === k)) || 'Safety Gloves', 1]); draw('[data-act="add"]'); }
      if (act === 'submit' && s.lines.length) {
        s.path = short() ? PATH_SHORT : PATH_OK;
        s.step = 0; s.log = []; log();
        s.step = 1; log();
        draw('[data-act="next"]');
      }
      if (act === 'next') { s.step += 1; log(); draw('[data-act="next"], [data-act="again"]'); }
      if (act === 'again') { s.step = -1; s.log = []; s.shut = false; draw('[data-dialog] select'); }
    });
    draw();
  };

  // ======================================================================================
  // 2. Management dashboard (TI Dashboards › Management, ti_business_dashboard 16.0.1.5):
  //    tabs by role, period and comparison, every number with its definition.
  // ======================================================================================
  const TAB_NAMES = { overview: 'Overview', sales: 'Sales', purchase: 'Purchase', inventory: 'Inventory', manufacturing: 'Manufacturing', requisitions: 'Requisitions', flow: 'Process flow' };
  const ROLES = {
    'Managing Director': ['overview', 'sales', 'purchase', 'inventory', 'manufacturing', 'requisitions', 'flow'],
    'Purchase Manager': ['overview', 'purchase', 'requisitions', 'flow'],
    'Production Manager': ['overview', 'manufacturing', 'requisitions', 'flow'],
    'Inventory Manager': ['overview', 'inventory', 'requisitions', 'flow'],
    'Sales Manager': ['overview', 'sales'],
  };
  const PERIODS = { this_month: ['This month', 1], last_month: ['Last month', 1.12], last_3: ['Last 3 months', 3.1], this_year: ['This year', 10.6] };
  // [label, value this month, value of the period before, kind, definition]. kind: n number, m money, d days, p percent; "now" = a snapshot, never compared
  const TILES = {
    sales: [
      ['Orders confirmed', 18, 15, 'n', 'Sales orders confirmed in the period.'],
      ['Value confirmed', 4280000, 3910000, 'm', 'Untaxed, in company currency at the rate of the order date.'],
      ['Delivered', 3150000, 3330000, 'm', 'Done deliveries of sales order lines in the period, at the line\'s net price.'],
      ['Open orders (now)', 11, null, 'n', 'Confirmed orders with goods not fully delivered.'],
      ['Delivered by promised date', 86, 81, 'p', 'Deliveries in the period made on or before the deadline.'],
      ['Open quotations (now)', 9, null, 'n', 'Draft and sent quotations; 3 are older than 15 days.'],
    ],
    purchase: [
      ['POs confirmed', 42, 37, 'n', 'Purchase orders confirmed in the period.'],
      ['Value ordered', 2640000, 2890000, 'm', 'Untaxed, in company currency at the rate of the confirmation date.'],
      ['Received', 2210000, 2050000, 'm', 'Done receipts from vendors in the period, at the line\'s net price.'],
      ['Open POs (now)', 23, null, 'n', 'Confirmed POs with goods not fully received.'],
      ['Received by promised date', 78, 74, 'p', 'Receipt lines in the period on or before the line\'s expected date.'],
      ['Order → receipt', 9, 11, 'd', 'Median calendar days from PO confirmation to the last receipt.'],
      ['RFQs with a price missing (now)', 4, null, 'n', 'Open RFQs with a line at price 0.'],
      ['Price changes', 7, 5, 'n', 'Products ordered in the period whose last purchase price changed from the one before.'],
    ],
    inventory: [
      ['Stock value (now)', 18450000, null, 'm', 'On hand in internal locations × last purchase price.'],
      ['Stock in', 2340000, 2180000, 'm', 'Done moves into internal locations, at last purchase price.'],
      ['Stock out', 2610000, 2400000, 'm', 'Done moves out of internal locations, at last purchase price.'],
      ['Incoming, next 7 days (now)', 31, null, 'n', 'Open moves into internal locations planned up to 7 days ahead, overdue included.'],
      ['Outgoing, next 7 days (now)', 26, null, 'n', 'Open moves out of internal locations planned up to 7 days ahead.'],
      ['Not moved for 90+ days (now)', 64, null, 'n', 'Products in stock without a done move in 90 days.'],
    ],
    manufacturing: [
      ['MOs completed', 27, 24, 'n', 'Manufacturing orders done in the period.'],
      ['Completed by planned date', 81, 85, 'p', 'Finished on or before the deadline (else the planned end).'],
      ['In progress (now)', 12, null, 'n', 'MOs in progress or to close.'],
      ['Waiting for material (now)', 5, null, 'n', 'Confirmed MOs with components not all reserved.'],
      ['Material consumed', 1960000, 1820000, 'm', 'Done component moves, at last purchase price.'],
      ['Scrap', 38000, 52000, 'm', 'Scrap orders in the period, at last purchase price.'],
    ],
    requisitions: [
      ['Material requests raised', 64, 58, 'n', 'Submitted in the period.'],
      ['Requests issued', 57, 55, 'n', 'Reached Issued or Completed for the first time in the period.'],
      ['Request → issue', 1.5, 2, 'd', 'Median working days from submitting to the issue (from stock: 1; via purchase: 6).'],
      ['Purchase requisitions raised', 13, 16, 'n', 'First submitted in the period.'],
      ['PR → PO', 3, 4, 'd', 'Median working days from submitted to PO created.'],
      ['Sent back or rejected', 4, 6, 'n', 'Approval decisions that returned the document to draft or rejected it.'],
      ['Short for a request (now)', 6, null, 'n', 'Requested items that will not be in stock by the date needed.'],
    ],
  };
  const OVERVIEW_PICK = { sales: [1, 2, 3], purchase: [1, 2, 3], inventory: [0, 1, 2], manufacturing: [0, 1, 3], requisitions: [0, 2, 6] };
  // Process flow: [step, team, waiting now, late now, finished in the period, average working days, allowed days]
  const FLOW = [
    ['Request → issue', [
      ['Manager approval', 'Production', 3, 1, 61, 0.8, 1],
      ['Inventory review', 'Stores', 4, 1, 59, 1.2, 2],
      ['Issue', 'Stores', 5, 2, 57, 2.4, 2],
      ['Mark received', 'Production', 2, 0, 55, 0.6, 2],
    ]],
    ['Shortage → purchase → delivery', [
      ['Director approval', 'Directors', 1, 0, 14, 0.9, 1],
      ['Purchase requisition → RFQ', 'Purchase', 2, 1, 13, 2.6, 2],
      ['PO approval', 'Directors', 1, 0, 12, 0.7, 1],
      ['Vendor delivery', 'Vendors', 9, 3, 11, 7.8, 10],
    ]],
  ];

  const management = (box) => {
    const s = { role: 'Managing Director', tab: 'overview', period: 'this_month', compare: 'prev', dept: 'All departments', tip: null };

    const val = (t) => {
      const [, cur, , kind] = t;
      const f = kind === 'm' || kind === 'n' ? PERIODS[s.period][1] : 1;
      const n = kind === 'n' && t[0].includes('(now)') ? cur : cur * f * (s.dept === 'All departments' ? 1 : 0.42);
      if (kind === 'm') return n >= 1e7 ? `₹ ${(n / 1e7).toFixed(2)} Cr` : `₹ ${(n / 1e5).toFixed(2)} L`;
      if (kind === 'p') return `${Math.round(n)}%`;
      if (kind === 'd') return `${n.toFixed(1)} days`;
      return Math.round(n).toLocaleString('en-IN');
    };
    const change = (t) => {
      const [, cur, prev, kind] = t;
      if (prev === null || s.compare === 'none') return '';
      const diff = kind === 'p' ? cur - prev : ((cur - prev) / prev) * 100;
      const up = diff >= 0;
      return `<span class="oe-cmp">${up ? '▲' : '▼'} ${Math.abs(diff).toFixed(kind === 'p' ? 0 : 1)}${kind === 'p' ? ' pts' : '%'}</span>`;
    };
    const tile = (t, key) => `<div class="oe-bt">
      <button type="button" class="oe-q" data-tip="${key}" aria-expanded="${s.tip === key}" aria-label="What does ${esc(t[0])} count?">?</button>
      <span class="oe-bt-l">${esc(t[0])}</span><span class="oe-bt-n">${val(t)}</span>${change(t)}
      ${s.tip === key ? `<span class="oe-tip" role="note">${esc(t[4])}</span>` : ''}
    </div>`;

    const overview = () => {
      const tabs = ROLES[s.role].filter((t) => TILES[t]);
      const weeks = [[7.4, 5.1], [8.2, 6.0], [6.1, 7.3], [9.0, 5.6]];
      const max = 10;
      return `${tabs.map((t) => `<div class="oe-group"><p class="oe-group-h">${TAB_NAMES[t]}</p><div class="oe-btiles">${OVERVIEW_PICK[t].map((i) => tile(TILES[t][i], `${t}${i}`)).join('')}</div></div>`).join('')}
      ${tabs.includes('sales') || tabs.includes('purchase') ? `<div class="oe-card"><div class="oe-card-h"><b>Goods out and in</b><small>Untaxed value delivered to customers and received from vendors.</small></div>
        <div class="oe-legend"><i class="l" style="background:#4b7bd1"></i>Delivered to customers <i class="n" style="background:#d1914b"></i>Received from vendors</div>
        <div class="oe-weeks">${weeks.map(([o, i], w) => `<div class="oe-week"><span class="oe-col"><i style="height:${(o / max) * 100}%;background:#4b7bd1"></i><i style="height:${(i / max) * 100}%;background:#d1914b"></i></span><small>Week ${w + 1}</small></div>`).join('')}</div>
      </div>` : ''}`;
    };

    const flow = () => FLOW.map(([name, steps]) => `<div class="oe-card"><div class="oe-card-h"><b>${name}</b><small>waiting now · finished in the period</small></div>
      <ol class="oe-flow">${steps.map(([step, team, wait, late, doneN, avg, allowed]) => `
        <li class="${avg > allowed ? 'slow' : ''}"><b>${step}</b><small>${team}</small>
          <span><b>${wait}</b> waiting${late ? ` <span class="oe-red">(${late} late)</span>` : ''}</span>
          <span>${Math.round(doneN * PERIODS[s.period][1])} done · avg <b>${avg}</b> working days <small>(allowed ${allowed})</small></span></li>`).join('')}</ol>
      <p class="oe-hint">An amber edge marks a step whose average took longer than its allowed time.</p></div>`).join('');

    const body = () => {
      const tabs = ROLES[s.role];
      if (!tabs.includes(s.tab)) s.tab = tabs[0];
      const content = s.tab === 'overview' ? overview() : s.tab === 'flow' ? flow()
        : `<div class="oe-btiles">${TILES[s.tab].map((t, i) => tile(t, `${s.tab}${i}`)).join('')}</div>`;
      return `
      <div class="oe-demo"><label>Sample: open it as<select data-f="role">${Object.keys(ROLES).map((r) => `<option${r === s.role ? ' selected' : ''}>${r}</option>`).join('')}</select></label><small>each role sees only its own tabs</small></div>
      <div class="oe-dash-head"><b>Management</b><span>Updated ${now()}</span></div>
      <div class="oe-filters">
        <label>Period<select data-f="period">${Object.entries(PERIODS).map(([k, [l]]) => `<option value="${k}"${k === s.period ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label>Compare with<select data-f="compare"><option value="prev"${s.compare === 'prev' ? ' selected' : ''}>Previous period</option><option value="year"${s.compare === 'year' ? ' selected' : ''}>Same period last year</option><option value="none"${s.compare === 'none' ? ' selected' : ''}>No comparison</option></select></label>
        <label>Department<select data-f="dept">${['All departments', 'Fabrication', 'Assembly', 'Maintenance'].map((d) => `<option${d === s.dept ? ' selected' : ''}>${d}</option>`).join('')}</select></label>
        <label>Employee<input type="text" placeholder="Name or Employee ID"></label>
      </div>
      <div class="oe-btabs" role="tablist" aria-label="Dashboard tabs">${tabs.map((t) => `<button type="button" role="tab" data-tab="${t}" aria-selected="${t === s.tab}">${TAB_NAMES[t]}</button>`).join('')}</div>
      <div class="oe-bbody" role="tabpanel" aria-live="polite">${content}</div>
      <p class="oe-foot">Money is untaxed, in company currency. Every number opens the records it counts.</p>`;
    };

    const draw = () => redraw(box, frame('TI Dashboards', '<span class="on">Management</span><span>Lists</span>', '<span class="oe-avatar">D</span>', body()));
    box.addEventListener('change', (e) => {
      const f = e.target.dataset.f;
      if (!f) return;
      s[f] = e.target.value; s.tip = null;
      draw();
    });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tab) { s.tab = b.dataset.tab; s.tip = null; }
      if (b.dataset.tip) s.tip = s.tip === b.dataset.tip ? null : b.dataset.tip;
      draw();
    });
    box.addEventListener('keydown', (e) => {
      const t = e.target.closest('[role="tab"]');
      if (!t || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const tabs = ROLES[s.role];
      s.tab = tabs[(tabs.indexOf(s.tab) + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      redraw(box, frame('TI Dashboards', '<span class="on">Management</span><span>Lists</span>', '<span class="oe-avatar">D</span>', body()), `[data-tab="${s.tab}"]`);
    });
    draw();
  };

  // ======================================================================================
  // 3. People tracking (ti_people_tracking 16.0.3.0): a common login, each person picks their
  //    name and enters their Login PIN. 5 wrong tries lock the name.
  // ======================================================================================
  const people = (box) => {
    const PEOPLE = [
      { name: 'User 1', id: 'EMP0001', dept: 'Fabrication', pin: '1234', tries: 5 },
      { name: 'User 2', id: 'EMP0002', dept: 'Fabrication', pin: '1234', tries: 5 },
      { name: 'User 3', id: 'EMP0003', dept: 'Assembly', pin: null, tries: 5 },
    ];
    const STEPS = [
      ['Requested by', 'Request', 'shared'],
      ['Submitted by', 'Submit', 'shared'],
      ['Approved by (Manager)', 'Approve as the Production Manager', 'manager'],
      ['Material Received By', 'Mark received', 'shared'],
    ];
    const s = { who: null, pick: null, err: '', ask: true, done: [] };
    const person = () => PEOPLE.find((p) => p.name === s.pick);

    const pinForm = () => {
      const p = person();
      if (!p) return '';
      if (p.tries <= 0) return `<div class="oe-pin"><p class="oe-red" role="alert">${p.name} is locked after 5 wrong PINs. An administrator sets a new PIN with <b>Change PIN</b> or clears it with <b>Reset PIN</b> (Employees › ${p.name} › HR Settings).</p>
        <button type="button" class="oe-btn oe-btn-2" data-act="reset">Reset PIN (as the administrator)</button></div>`;
      if (!p.pin) return `<form class="oe-pin" data-pin="new">
        <label>Choose a Login PIN<input type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 digits" data-p1></label>
        <label>Again<input type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 digits" data-p2></label>
        <button type="submit" class="oe-btn">Set PIN and start</button>
        <small>First time on this login: ${p.name} sets their own PIN.</small>
        ${s.err ? `<p class="oe-red" role="alert">${s.err}</p>` : ''}</form>`;
      return `<form class="oe-pin" data-pin="check">
        <label>Login PIN for ${p.name}<input type="password" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="4 digits" data-p1></label>
        <button type="submit" class="oe-btn">Start</button>
        <small>Sample PIN: 1234</small>
        ${s.err ? `<p class="oe-red" role="alert">${s.err}</p>` : ''}</form>`;
    };

    const dialog = () => `
      <div class="oe-dialog" role="dialog" aria-label="${s.who ? 'Who are you?' : 'Choose your name to start'}">
        <div class="oe-dialog-box">
          <header><strong>${s.who ? 'Who are you?' : 'Choose your name to start'}</strong>${s.who ? '<button type="button" class="oe-x" data-act="cancel" aria-label="Close">×</button>' : ''}</header>
          <p>Several people work on this login. Tap your name and enter your own PIN: everything you do in Odoo is recorded under it, and the others on this login do not see your documents.</p>
          <div class="oe-people">${PEOPLE.map((p) => `<button type="button" class="oe-person ${s.pick === p.name ? 'on' : ''}" data-pick="${p.name}" aria-pressed="${s.pick === p.name}"><b>${p.name}</b><small>${p.id} · ${p.dept}${p.tries <= 0 ? ' · locked' : !p.pin ? ' · PIN not set' : ''}</small></button>`).join('')}</div>
          ${pinForm()}
        </div>
      </div>`;

    const sheet = () => {
      const next = STEPS[s.done.length];
      return `
      <div class="oe-page-title"><span>Material Requisitions / <b>MR/2026/0061</b></span></div>
      <div class="oe-control">${next ? `<button type="button" class="oe-btn" data-act="step">${next[1]}</button><span class="oe-hint">${next[2] === 'manager' ? 'on the manager\'s own login: never asked for a name, recorded as User 4' : `recorded as <b>${s.who || '…'}</b>. Tap the name at the top to switch person.`}</span>`
        : '<button type="button" class="oe-btn oe-btn-2" data-act="again">Start again</button><span class="oe-hint">One shared login, and still a name on every step.</span>'}</div>
      <div class="oe-sheet">
        <div class="oe-tabs"><span>Products Requested</span><span class="on">Who Did What</span></div>
        <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Step</th><th>Name</th><th>When</th></tr></thead><tbody aria-live="polite">
        ${STEPS.map(([label], i) => { const d = s.done[i]; return `<tr class="${d && i === s.done.length - 1 ? 'oe-new' : ''}"><td>${label}</td><td>${d ? `<b class="oe-name">${d.who}</b>` : ''}</td><td>${d ? d.at : ''}</td></tr>`; }).join('')}
        </tbody></table></div>
      </div>`;
    };

    const draw = (focusSel) => redraw(box, frame('Manufacturing', '<span class="on">Material Requisitions</span>',
      `<button type="button" class="oe-who" data-act="who">👤 ${s.who || 'Who are you?'}</button><span class="oe-login">Production User</span>`,
      sheet() + (s.ask ? dialog() : '')), focusSel);

    box.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const act = b.dataset.act;
      if (b.dataset.pick) { s.pick = b.dataset.pick; s.err = ''; draw('[data-p1], [data-act="reset"]'); }
      if (act === 'who') { s.ask = true; s.pick = null; s.err = ''; draw('.oe-person'); }
      if (act === 'cancel') { s.ask = false; draw('[data-act="who"]'); }
      if (act === 'reset') { const p = person(); p.pin = null; p.tries = 5; s.err = ''; draw('[data-p1]'); }
      if (act === 'step') {
        const manager = STEPS[s.done.length][2] === 'manager';
        s.done.push({ who: manager ? 'User 4' : s.who, at: now() });
        draw('[data-act="step"], [data-act="again"]');
      }
      if (act === 'again') { s.done = []; draw('[data-act="step"]'); }
    });
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const p = person();
      const p1 = e.target.querySelector('[data-p1]').value;
      if (e.target.dataset.pin === 'new') {
        const p2 = e.target.querySelector('[data-p2]').value;
        if (!/^\d{4}$/.test(p1)) { s.err = 'The PIN is 4 digits.'; draw('[data-p1]'); return; }
        if (p1 !== p2) { s.err = 'The two PINs differ.'; draw('[data-p1]'); return; }
        p.pin = p1;
      } else if (p1 !== p.pin) {
        p.tries -= 1;
        s.err = p.tries > 0 ? `Wrong PIN. ${p.tries} ${p.tries === 1 ? 'try' : 'tries'} left.` : '';
        draw(p.tries > 0 ? '[data-p1]' : '[data-act="reset"]');
        return;
      }
      p.tries = 5;
      s.who = p.name; s.ask = false; s.err = '';
      draw('[data-act="step"], [data-act="again"]');
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape' && s.ask && s.who) { s.ask = false; draw('[data-act="who"]'); } });
    draw();
  };

  // ======================================================================================
  // 4. Variant configurator (ti_variant_configurator_reuse 16.0.2.2.4 + ti_purchase_variant_price
  //    + ti_purchase_variant_price_configurator 16.0.1.1.1): an administrator switches a page's
  //    product field to Variant Mode; the popup then picks the exact variant and shows its
  //    purchase prices.
  // ======================================================================================
  const HB = {
    name: 'Hex Bolt', code: 'HB',
    attrs: [['Size', ['M8', 'M10', 'M12']], ['Length', ['30 mm', '50 mm']], ['Finish', ['Plain', 'Zinc plated']]],
    skip: (v) => v[0] === 'M8' && v[1] === '50 mm',
  };
  const part = (x) => (/^[\d.]+ mm$/.test(x) ? x.split(' ')[0]
    : /^[a-z]+( [a-z]+)+$/i.test(x) ? x.split(' ').map((w) => w[0]).join('').toUpperCase()
    : /^[a-z]+$/i.test(x) && x.length > 3 ? x.slice(0, 2).toUpperCase() : x.replace(/ /g, '').toUpperCase());
  const vref = (v) => `${HB.code}-${v.map(part).join('-')}`;
  const VARIANTS = HB.attrs.map(([, o]) => o).reduce((acc, o) => acc.flatMap((a) => o.map((x) => [...a, x])), [[]]).filter((v) => !HB.skip(v));
  // Purchase data per variant (sample): base price by size, +length, +finish
  const base = (v) => ({ M8: 8.4, M10: 11.8, M12: 15.6 }[v[0]] + (v[1] === '50 mm' ? 1.6 : 0) + (v[2] === 'Zinc plated' ? 0.9 : 0));
  const prices = (v) => {
    const r = vref(v);
    const b = base(v);
    const neverBought = r === 'HB-M12-50-PL';
    const variantPrice = ['HB-M10-50-ZP', 'HB-M10-30-ZP', 'HB-M12-30-ZP'].includes(r);
    return {
      vendor: variantPrice ? { price: +(b * 1.04).toFixed(2), disc: 5, forVariant: true } : r === 'HB-M8-30-ZP' ? null : { price: 13.0, disc: 0, forVariant: false },
      last: neverBought ? null : { price: +b.toFixed(2), partner: 'Sample Steel Traders', date: '11/14/2026', order: 'P00031' },
      others: neverBought ? [] : [{ partner: 'Demo Fasteners', price: +(b * 1.03).toFixed(2), date: '10/02/2026', order: 'P00019' }],
      rfqs: r === 'HB-M10-50-ZP' ? [{ partner: 'Demo Fasteners', price: +(b * 1.05).toFixed(2), order: 'P00036' }] : [],
    };
  };
  const RULES = [
    { name: 'Bill of Materials lines', type: 'Registered adapter', model: 'BoM Line', field: 'product_id', view: '', mode: '', on: true },
    { name: 'Material Requisition lines', type: 'Registered adapter', model: 'Material Requisition Line', field: 'product_id', view: '', mode: '', on: true },
    { name: 'Request Materials popup', type: 'Registered adapter', model: 'Request Materials (wizard line)', field: 'product_id', view: '', mode: '', on: true },
    { name: 'Manufacturing Order - Product', type: 'Product field', model: 'Production Order', field: 'product_id', view: '', mode: 'Variant Mode', on: true },
    { name: 'Manufacturing Order - Components and By-products', type: 'Product field', model: 'Stock Move', field: 'product_id', view: 'mrp.production.form', mode: 'Variant Mode', on: true },
    { name: 'Transfers - Operations (disabled example)', type: 'Product field', model: 'Stock Move', field: 'product_id', view: 'stock.picking.form', mode: 'Variant Mode', on: false, key: 'transfer' },
    { name: 'Scrap - Product (disabled example)', type: 'Product field', model: 'Scrap', field: 'product_id', view: '', mode: 'Variant Mode', on: false },
  ];

  const variant = (box) => {
    const rules = RULES.map((r) => ({ ...r }));
    const transferRule = rules.find((r) => r.key === 'transfer');
    const s = { page: 'rules', open: null, q: '', typing: false, cfg: null, lines: { transfer: [], po: [] }, vv: ['M10', '50 mm', 'Zinc plated'] };
    const variantMode = () => transferRule.on && transferRule.mode === 'Variant Mode';

    // ---- Configuration › Variant Selection Rules
    const rulesList = () => `
      <div class="oe-page-title"><span>Variant Selection Rules</span></div>
      <div class="oe-sheet">
        <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Name</th><th>Type</th><th>Model</th><th>Field Name</th><th>Target View</th><th>Selection Mode</th><th>Active</th></tr></thead><tbody>
        ${rules.map((r, i) => `<tr class="${r.on ? '' : 'oe-muted'}">
          <td>${r.type === 'Product field' ? `<button type="button" class="oe-link oe-rowlink" data-rule="${i}">${esc(r.name)}</button>` : esc(r.name)}</td>
          <td>${r.type}</td><td>${r.model}</td><td><code>${r.field}</code></td><td>${r.view ? `<code>${r.view}</code>` : ''}</td><td>${r.mode}</td>
          <td><button type="button" class="oe-toggle" role="switch" aria-checked="${r.on}" data-onoff="${i}" aria-label="Active: ${esc(r.name)}"><i></i></button></td></tr>`).join('')}
        </tbody></table></div>
        <p class="oe-hint oe-pad">Registered adapters cover the custom screens. A <b>Product field</b> rule switches any other product field to Variant Mode, on one view or on every view, with no code per screen. Users reload the page after a change.</p>
      </div>`;

    const ruleForm = () => {
      const r = rules[s.open];
      return `
      <div class="oe-page-title"><span><button type="button" class="oe-link" data-go="rules">Variant Selection Rules</button> / <b>${esc(r.name)}</b></span></div>
      <div class="oe-sheet">
        <div class="oe-grid2">
          <div class="oe-read"><p class="oe-sep">Target</p>
            <p><span>Model</span>${r.model}</p><p><span>Product Field</span>Product (<code>${r.field}</code>)</p><p><span>Target View</span>${r.view ? `<code>${r.view}</code>` : 'every view that shows the field'}</p></div>
          <div><p class="oe-sep">Behaviour</p>
            <fieldset><legend>Selection Mode</legend>${['Variant Mode', 'Normal Mode'].map((m) => `<label class="oe-radio"><input type="radio" name="mode-${box.id}" value="${m}" data-mode${r.mode === m ? ' checked' : ''}>${m}</label>`).join('')}</fieldset>
            <p class="oe-inline">Active <button type="button" class="oe-toggle" role="switch" aria-checked="${r.on}" data-onoff="${s.open}" aria-label="Active"><i></i></button></p></div>
        </div>
        <p class="oe-sep">Activation conditions</p>
        <div class="oe-grid2 oe-read"><p><span>Allowed Groups</span>any user</p><p><span>Product domain</span><code>[]</code></p></div>
        <p class="oe-sep">Coverage</p>
        <pre class="oe-pre">${r.view === 'stock.picking.form' ? 'Transfer [stock.view_picking_form] - applies' : r.view ? 'Production Order [mrp.mrp_production_form_view] - applies' : 'Production Order [mrp.mrp_production_form_view] - applies\nProduction Order list [mrp.mrp_production_tree_view] - applies'}</pre>
        ${r.key === 'transfer' ? '<p class="oe-hint">Switch it on, then open <button type="button" class="oe-link" data-go="transfer">the transfer</button> and type "bolt".</p>' : ''}
      </div>`;
    };

    // ---- A product field: the dropdown follows the rule
    const productField = (where) => {
      const vm = where === 'po' || variantMode();
      const q = s.q.toLowerCase();
      let items = [];
      if (s.typing && q) {
        const exact = VARIANTS.find((v) => vref(v).toLowerCase() === q);
        if (exact) items = [{ label: `[${vref(exact)}] Hex Bolt (${exact.join(', ')})`, v: exact }];
        else if ('hex bolt'.includes(q) || q.includes('bolt')) items = vm ? [{ label: `Hex Bolt <small>(${VARIANTS.length} variants)</small>`, tmpl: true }] : VARIANTS.map((v) => ({ label: `[${vref(v)}] Hex Bolt (${v.join(', ')})`, v }));
      }
      return `<div class="oe-combo">
        <input type="text" data-search placeholder="Type a product, e.g. bolt" value="${esc(s.q)}" aria-label="Product" role="combobox" aria-autocomplete="list" aria-expanded="${items.length > 0}" aria-controls="${box.id}-drop" autocomplete="off">
        ${items.length ? `<ul class="oe-drop" role="listbox" id="${box.id}-drop">${items.slice(0, 8).map((it, i) => `<li role="none"><button type="button" role="option" ${it.tmpl ? 'data-tmpl="1"' : `data-pickv="${i}"`}>${it.label}</button></li>`).join('')}${items.length > 8 ? `<li role="none" class="oe-more">Search More… (${items.length} variants)</li>` : ''}</ul>` : ''}
        <span class="oe-mode">${vm ? 'Variant Mode' : 'Normal Mode: every variant listed'}</span>
      </div>`;
    };

    const transfer = () => `
      <div class="oe-page-title"><span>Transfers / <b>WH/INT/00012</b></span></div>
      <ol class="oe-status" aria-label="Status"><li class="on">Draft</li><li>Waiting</li><li>Ready</li><li>Done</li></ol>
      <div class="oe-sheet">
        <div class="oe-grid2 oe-read"><p><span>Source Location</span>WH/Stock</p><p><span>Destination Location</span>WH/Production</p></div>
        <div class="oe-tabs"><span class="on">Operations</span><span>Additional Info</span></div>
        <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Product</th><th class="num">Demand</th><th>Unit</th><th><span class="sr-only">Change variant</span></th></tr></thead><tbody>
          ${s.lines.transfer.map((l, i) => `<tr class="${l.fresh ? 'oe-new' : ''}"><td><b>[${vref(l.v)}]</b> Hex Bolt (${l.v.join(', ')})</td><td class="num">${l.qty.toFixed(2)}</td><td>Units</td><td>${variantMode() ? slider('transfer', i) : ''}</td></tr>`).join('')}
          <tr><td colspan="4">${productField('transfer')}</td></tr>
        </tbody></table></div>
        <p class="oe-hint oe-pad">${variantMode() ? 'The rule is on: typing lists the product once, and choosing it opens the configurator.' : 'The rule is off: Odoo lists every variant, as standard. <button type="button" class="oe-link" data-go="rule5">Switch the rule on</button> to see the difference.'}</p>
      </div>`;

    const po = () => `
      <div class="oe-page-title"><span>Requests for Quotation / <b>P00037</b></span></div>
      <ol class="oe-status" aria-label="Status"><li class="on">RFQ</li><li>RFQ Sent</li><li>Purchase Order</li></ol>
      <div class="oe-sheet">
        <div class="oe-grid2 oe-read"><p><span>Vendor</span>Sample Steel Traders</p><p><span>Order Deadline</span>12/02/2026</p></div>
        <div class="oe-tabs"><span class="on">Products</span><span>Other Information</span></div>
        <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Product</th><th class="num">Quantity</th><th class="num">Unit Price</th><th class="num">Disc.%</th><th class="num">Previous price</th><th><span class="sr-only">Change variant</span></th></tr></thead><tbody>
          ${s.lines.po.map((l, i) => {
            const p = prices(l.v);
            const unit = p.vendor ? p.vendor.price : (p.last ? p.last.price : 0);
            const disc = p.vendor ? p.vendor.disc : 0;
            const net = unit * (1 - disc / 100);
            const prev = p.last && p.last.price;
            const pct = prev ? ((net - prev) / prev) * 100 : null;
            return `<tr class="${l.fresh ? 'oe-new' : ''}"><td><b>[${vref(l.v)}]</b> Hex Bolt (${l.v.join(', ')})</td><td class="num">${l.qty.toFixed(2)}</td><td class="num">${unit.toFixed(2)}</td><td class="num">${disc.toFixed(2)}</td>
              <td class="num">${prev ? `${prev.toFixed(2)} <span class="${Math.abs(pct) >= 5 ? 'oe-alert' : 'oe-muted-t'}">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</span>` : '<small>never bought</small>'}</td><td>${slider('po', i)}</td></tr>`;
          }).join('')}
          <tr><td colspan="6">${productField('po')}</td></tr>
        </tbody></table></div>
        <p class="oe-hint oe-pad">Purchase lines always use the configurator. The previous price column turns red when the price moves 5% or more from the last one (a Purchase setting).</p>
      </div>`;

    const product = () => {
      const v = s.vv;
      const p = prices(v);
      return `
      <div class="oe-page-title"><span>Product Variants / <b>[${vref(v)}] Hex Bolt (${v.join(', ')})</b></span></div>
      <div class="oe-control"><label class="oe-inline">Variant <select data-f="vv">${VARIANTS.map((x) => `<option value="${x.join('|')}"${x.join('|') === v.join('|') ? ' selected' : ''}>${vref(x)}</option>`).join('')}</select></label></div>
      <div class="oe-sheet">
        <div class="oe-tabs"><span>General Information</span><span>Inventory</span><span class="on">Purchase</span></div>
        <div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Vendor</th><th>Variant</th><th class="num">Min Qty</th><th class="num">Price</th><th class="num">Discount</th></tr></thead><tbody>
          ${p.vendor && p.vendor.forVariant ? `<tr><td>Sample Steel Traders</td><td>${v.join(', ')}</td><td class="num">100.00</td><td class="num">${p.vendor.price.toFixed(2)}</td><td class="num">5.00</td></tr>` : ''}
          <tr class="${p.vendor && p.vendor.forVariant ? 'oe-muted' : ''}"><td>Sample Steel Traders</td><td><i>All variants</i></td><td class="num">0.00</td><td class="num">13.00</td><td class="num">0.00</td></tr>
          <tr><td>Demo Fasteners</td><td><i>All variants</i></td><td class="num">0.00</td><td class="num">13.40</td><td class="num">0.00</td></tr>
        </tbody></table></div>
        ${p.vendor && p.vendor.forVariant ? '<p class="oe-hint oe-pad">This variant has its own price from Sample Steel Traders, so their "All variants" row is ignored for it.</p>' : ''}
        <p class="oe-sep">Last Purchase (this variant)</p>
        <div class="oe-grid2 oe-read">${p.last ? `<p><span>Last Purchase Price</span>${inr(p.last.price)}</p><p><span>Last Purchase Date</span>${p.last.date}</p><p><span>Last Vendor</span>${p.last.partner}</p><p><span>Purchase Order</span>${p.last.order}</p>`
          : '<p><span>Last Purchase Price</span>never bought</p>'}</div>
        <p class="oe-hint">After the line discount, tax excluded, in company currency and the product's unit. Reporting only: cost and valuation are never changed.</p>
      </div>`;
    };

    const slider = (where, i) => `<button type="button" class="oe-slide" data-re="${where}:${i}" aria-label="Change variant" title="Change variant"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h7M13 4h1M2 12h1M7 12h7M2 8h3M9 8h5" /><circle cx="11" cy="4" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="7" cy="8" r="1.6"/></svg></button>`;

    // ---- The popup: purchase_product_configurator's modal, sales price hidden, purchase price panel under it
    const pop = () => {
      if (!s.cfg) return '';
      const bad = HB.skip(s.cfg.v);
      const p = !bad && prices(s.cfg.v);
      const money = (x) => inr(x.price);
      const vendorLine = s.cfg.where === 'po' ? `<div><strong>This vendor (Sample Steel Traders):</strong> ${p && p.vendor ? `${money(p.vendor)} per Units${p.vendor.disc ? ` less ${p.vendor.disc}%` : ''} <span class="oe-muted-t">(vendor price list${p.vendor.forVariant ? '' : ', for the whole product'})</span>` : '<span class="oe-muted-t">no vendor price for this variant yet</span>'}</div>` : '';
      return `<div class="oe-dialog" role="dialog" aria-label="Configure">
        <div class="oe-dialog-box oe-wide">
          <header><strong>Configure</strong><button type="button" class="oe-x" data-act="cancel" aria-label="Close">×</button></header>
          <div class="oe-table-wrap"><table class="oe-table oe-cfg-table"><thead><tr><th>Product</th><th class="num">Quantity</th></tr></thead><tbody><tr>
            <td><div class="oe-cfg"><span class="oe-thumb" aria-hidden="true">HB</span><div><b>Hex Bolt</b><small>${bad ? 'not available' : `[${vref(s.cfg.v)}]`}</small></div></div>
              ${HB.attrs.map(([a, opts], i) => `<fieldset class="oe-attr"><legend>${a}</legend>${opts.map((o) => `<button type="button" class="oe-pill ${s.cfg.v[i] === o ? 'on' : ''}" data-attr="${i}" data-val="${o}" aria-pressed="${s.cfg.v[i] === o}">${o}</button>`).join('')}</fieldset>`).join('')}</td>
            <td class="num"><input type="number" min="1" value="${s.cfg.qty}" data-cqty aria-label="Quantity"></td></tr></tbody></table></div>
          <div class="oe-panel" aria-live="polite">${bad ? '<p class="oe-red">This combination does not exist.</p>' : `
            ${vendorLine}
            <div><strong>Last bought:</strong> ${p.last ? `${money(p.last)} per Units from ${p.last.partner} on ${p.last.date} (${p.last.order})` : '<span class="oe-muted-t">never bought</span>'}</div>
            ${p.others.length ? `<div><strong>Other vendors:</strong> ${p.others.map((o) => `${o.partner} ${money(o)} per Units on ${o.date} (${o.order})`).join('; ')}</div>` : ''}
            ${p.rfqs.length ? `<div><strong>Open RFQs:</strong> ${p.rfqs.map((o) => `${o.partner} ${money(o)} per Units (${o.order})`).join('; ')}</div>` : ''}
            <div class="oe-muted-t oe-small">Purchase prices after discount, without tax, in the unit and currency of each order.</div>`}
          </div>
          <footer><button type="button" class="oe-btn" data-act="confirm"${bad ? ' disabled' : ''}>Confirm</button><button type="button" class="oe-btn oe-btn-2" data-act="cancel">Cancel</button></footer>
        </div>
      </div>`;
    };

    const PAGES = { rules: 'Variant Selection Rules', transfer: 'Transfer', po: 'Purchase', product: 'Product variant' };
    const draw = (focusSel) => {
      const body = s.page === 'rules' ? (s.open === null ? rulesList() : ruleForm()) : s.page === 'transfer' ? transfer() : s.page === 'po' ? po() : product();
      redraw(box, frame(s.page === 'po' ? 'Purchase' : s.page === 'transfer' ? 'Inventory' : s.page === 'product' ? 'Purchase' : 'Manufacturing',
        Object.entries(PAGES).map(([k, l]) => `<button type="button" data-go="${k}" class="${s.page === k ? 'on' : ''}" aria-pressed="${s.page === k}">${l}</button>`).join(''),
        '<span class="oe-user">Administrator</span>', body + pop()), focusSel);
      const inp = box.querySelector('[data-search]');
      if (inp && document.activeElement === inp) inp.setSelectionRange(inp.value.length, inp.value.length);
    };

    const openCfg = (where, v, qty, at) => { s.cfg = { where, v: [...v], qty, at }; s.typing = false; s.q = ''; draw('.oe-pill.on'); };

    box.addEventListener('input', (e) => {
      if (e.target.matches('[data-search]')) { s.q = e.target.value; s.typing = true; draw('[data-search]'); }
      if (e.target.matches('[data-cqty]')) s.cfg.qty = Math.max(1, Number(e.target.value) || 1);
    });
    box.addEventListener('change', (e) => {
      if (e.target.matches('[data-mode]')) { rules[s.open].mode = e.target.value; draw('[data-mode]:checked'); }
      if (e.target.dataset.f === 'vv') { s.vv = e.target.value.split('|'); draw('[data-f="vv"]'); }
    });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const d = b.dataset;
      if (d.go) {
        if (d.go === 'rule5') { s.page = 'rules'; s.open = rules.indexOf(transferRule); draw('[data-onoff]'); return; }
        s.page = d.go; s.open = null; s.q = ''; s.typing = false; s.cfg = null;
        draw(`[data-go="${d.go}"]`);
      }
      if (d.rule) { s.open = Number(d.rule); draw('[data-mode]:checked'); }
      if (d.onoff) { rules[d.onoff].on = !rules[d.onoff].on; draw(`[data-onoff="${d.onoff}"]`); }
      if (d.tmpl) openCfg(s.page, ['M10', '50 mm', 'Zinc plated'], 10, null);
      if (d.pickv) {
        const label = b.textContent;
        const v = VARIANTS.find((x) => label.includes(vref(x)));
        s.lines[s.page].forEach((l) => { l.fresh = false; });
        s.lines[s.page].push({ v, qty: 1, fresh: true });
        s.q = ''; s.typing = false;
        draw('[data-search]');
      }
      if (d.attr) { s.cfg.v[d.attr] = d.val; draw(`[data-attr="${d.attr}"][data-val="${d.val}"]`); }
      if (d.re) { const [where, i] = d.re.split(':'); const l = s.lines[where][i]; openCfg(where, l.v, l.qty, Number(i)); }
      if (d.act === 'confirm') {
        const list = s.lines[s.cfg.where];
        list.forEach((l) => { l.fresh = false; });
        const line = { v: s.cfg.v, qty: s.cfg.qty, fresh: true };
        if (s.cfg.at === null) list.push(line); else list[s.cfg.at] = line;
        s.cfg = null;
        draw('[data-search]');
      }
      if (d.act === 'cancel') { s.cfg = null; draw('[data-search]'); }
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (s.cfg || s.typing)) { s.cfg = null; s.typing = false; draw('[data-search]'); } });
    document.addEventListener('click', (e) => { if (s.typing && !box.contains(e.target)) { s.typing = false; draw(); } });
    draw();
  };

  // ======================================================================================
  // 5. Export packing (T&I_Export_Packing_Customization 16.0.8.1.1): the Packing List tab of a
  //    delivery in four steps, then the Packing List (PL) and the Packing Slip (PS) it prints.
  // ======================================================================================
  const GOODS = [
    { product: 'Conveyor Roller 600 mm', qty: 24, uom: 'Units', unitWt: 6.5, type: 'Wooden Box', perPkg: 12, size: '120 x 60 x 40', gross: 15, printed: '12 Units each' },
    { product: 'Gear Motor 2 HP', qty: 2, uom: 'Units', unitWt: 38, type: 'Carton Box', perPkg: 1, size: '50 x 40 x 40', gross: 10, printed: '1 no each' },
    { product: 'Control Panel 415 V', qty: 1, uom: 'Unit', unitWt: 55, type: 'Wooden Box', perPkg: 1, size: '90 x 60 x 140', gross: 20, printed: '1 Set' },
  ];
  const SPARES = { product: null, desc: 'Spares', type: 'Wooden Box', pkgs: 1, size: '60 x 40 x 30', net: 18, gross: 10, printed: '1 Lot',
    contents: [['Bearing 6204', 10, 'Nos'], ['V-Belt B-52', 4, 'Nos'], ['Gasket Set', 2, 'Set']] };
  const HEADER = [['Consignee', 'Sample Buyer GmbH, Hamburg, Germany'], ['Shipping Mark', 'SEPL / HAMBURG'], ['Port of Loading', 'Chennai'], ['Port of Discharge', 'Hamburg'], ['Vessel / Flight No.', 'MV Sample Star'], ['Invoice No. & Date', 'EXP/2026/0042 · 11/25/2026'], ['Buyer Order No. & Date', 'PO-7781 · 10/30/2026']];
  const WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];

  const packing = (box) => {
    const s = { header: false, goods: false, rows: [], view: 'form', sheet: 0, warn: '' };

    const rowNet = (r) => (r.product ? r.qty * GOODS.find((g) => g.product === r.product).unitWt : r.net);
    const rowGross = (r) => rowNet(r) * (1 + r.gross / 100);
    const packed = (p) => s.rows.filter((r) => r.product === p).reduce((n, r) => n + r.qty, 0);
    const numbered = () => {
      let n = 0;
      return s.rows.map((r) => { const from = n + 1; n += r.pkgs; return { ...r, from, to: n }; });
    };
    const nos = (r) => (r.from === r.to ? String(r.from).padStart(2, '0') : `${String(r.from).padStart(2, '0')}-${String(r.to).padStart(2, '0')}`);
    const totals = () => s.rows.reduce((t, r) => ({ pkgs: t.pkgs + r.pkgs, net: t.net + rowNet(r), gross: t.gross + rowGross(r) }), { pkgs: 0, net: 0, gross: 0 });
    const warnings = () => (s.goods ? GOODS.filter((g) => packed(g.product) < g.qty).map((g) => `${g.product}: ${g.qty - packed(g.product)} ${g.uom} still to pack`) : []);
    const contentsText = (r) => (r.product ? `${r.product}` : r.desc);

    const form = () => {
      const w = warnings();
      const t = totals();
      return `
      <div class="oe-page-title"><span>Deliveries / <b>WH/OUT/00018</b></span></div>
      <div class="oe-control"><span class="oe-chip">Done</span><span class="oe-hint">S00012 · Sample Buyer GmbH</span></div>
      <div class="oe-sheet">
        <div class="oe-tabs"><span>Operations</span><span class="on">Packing List</span><span>Additional Info</span></div>

        <p class="oe-sep">1. Header (every page and the stickers)</p>
        <div class="oe-step-row"><button type="button" class="oe-btn ${s.header ? 'oe-btn-2' : ''}" data-act="defaults">Fill Export Defaults</button><small>fills only the empty fields, from the customer, the sales order and its invoice</small></div>
        <div class="oe-grid2 oe-read">${HEADER.map(([k, v]) => `<p><span>${k}</span>${s.header ? esc(v) : '<i class="oe-muted-t">empty</i>'}</p>`).join('')}</div>

        <p class="oe-sep">2. Page 1: Goods Summary</p>
        <div class="oe-step-row"><button type="button" class="oe-btn ${s.goods ? 'oe-btn-2' : ''}" data-act="fetch">Fetch Goods</button><small>one line per product, up to the delivery's Done quantities</small></div>
        ${s.goods ? `<div class="oe-table-wrap"><table class="oe-table"><thead><tr><th>Product</th><th class="num">Qty</th><th>UoM</th><th>Description (page 1)</th><th>Printed Qty (page 1)</th><th class="num">Unit Wt. (kg)</th></tr></thead><tbody>
          ${GOODS.map((g) => `<tr><td>${g.product}</td><td class="num">${g.qty}</td><td>${g.uom}</td><td>${g.product}</td><td>${g.qty} ${g.uom === 'Unit' ? 'Set' : 'Nos'}</td><td class="num">${kg(g.unitWt)}</td></tr>`).join('')}
        </tbody></table></div>` : ''}

        <p class="oe-sep">3. Page 2 onwards and the stickers: Packing Details</p>
        <div class="oe-step-row"><button type="button" class="oe-btn ${s.rows.some((r) => r.product) ? 'oe-btn-2' : ''}" data-act="addall"${s.goods ? '' : ' disabled'}>Add all products</button>
          <button type="button" class="oe-btn oe-btn-2" data-act="spares"${s.goods && !s.rows.some((r) => !r.product) ? '' : ' disabled'}>Add a line: box of spares</button>
          <small>${s.goods ? 'packing data and weights come from the product; change No. of Pkgs, Qty or Gross %' : 'needs page 1 first'}</small></div>
        ${s.rows.length ? `<div class="oe-table-wrap"><table class="oe-table oe-pack"><thead><tr><th>Product</th><th class="num">No. of Pkgs</th><th>Packing Type</th><th>Size</th><th>Contents</th><th class="num">Qty</th><th>Printed Quantity</th><th class="num">Net Wt. (kg)</th><th class="num">Gross %</th><th class="num">Gross Wt. (kg)</th><th>Package Nos</th></tr></thead><tbody>
          ${numbered().map((r, i) => `<tr>
            <td>${r.product ? esc(r.product) : `<i>(no product)</i> ${esc(r.desc)}`}</td>
            <td class="num"><input type="number" min="1" value="${r.pkgs}" data-pkgs="${i}" aria-label="No. of Pkgs, row ${i + 1}"></td>
            <td>${r.type}</td><td>${r.size}</td>
            <td>${r.contents ? `<ul class="oe-contents">${r.contents.map(([it, q, u]) => `<li>${it} <b>${q} ${u}</b></li>`).join('')}</ul>` : '<small>—</small>'}</td>
            <td class="num">${r.product ? `<input type="number" min="1" value="${r.qty}" data-rqty="${i}" aria-label="Qty, row ${i + 1}">` : ''}</td>
            <td>${r.printed}</td>
            <td class="num">${kg(rowNet(r))}</td>
            <td class="num"><input type="number" min="0" max="100" value="${r.gross}" data-gross="${i}" aria-label="Gross %, row ${i + 1}"></td>
            <td class="num">${kg(rowGross(r))}</td><td>${nos(r)}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
        ${s.warn ? `<p class="oe-note" role="alert">${s.warn}</p>` : ''}

        <p class="oe-sep">4. Check: totals, then print</p>
        ${w.length ? `<div class="oe-warn">${w.map((x) => `<p>⚠ ${x}</p>`).join('')}</div>` : ''}
        ${s.header ? '' : '<div class="oe-warn"><p>⚠ The header is empty: press Fill Export Defaults.</p></div>'}
        <div class="oe-grid2 oe-read"><p><span>Packages</span>${t.pkgs}</p><p><span>Net / Gross Wt. (kg)</span>${kg(t.net)} / ${kg(t.gross)}</p></div>
        <div class="oe-step-row"><button type="button" class="oe-btn" data-act="pl"${s.rows.length ? '' : ' disabled'}>Print PL</button><button type="button" class="oe-btn" data-act="ps"${s.rows.length ? '' : ' disabled'}>Print Packing Slip</button></div>
      </div>`;
    };

    const shipper = '<b>SAMPLE EXPORTS PVT LTD</b><br>Chennai - 600032, India<br>GST No. 33ABCDE1234F1Z5';
    const pl = () => {
      const r = numbered();
      const t = totals();
      const kinds = {};
      r.forEach((x) => { kinds[x.type] = (kinds[x.type] || 0) + x.pkgs; });
      const H = Object.fromEntries(HEADER);
      const head = (page) => `<div class="pp-title"><b>PACKING LIST</b><span>Page ${page} of 2</span></div>
        <table class="pp-grid"><tr><td rowspan="3" class="pp-w50">${shipper}</td><td>Invoice No. &amp; Date<br><b>${s.header ? H['Invoice No. & Date'] : ''}</b></td></tr>
        <tr><td>Buyer Order No. &amp; Date<br><b>${s.header ? H['Buyer Order No. & Date'] : ''}</b></td></tr><tr><td>Other Reference(s)</td></tr></table>`;
      return `<div class="pp-paper" role="document" aria-label="Packing List">
        ${head(1)}
        <table class="pp-grid"><tr><td class="pp-w50">Consignee :<br><b>${s.header ? H.Consignee : ''}</b></td><td>Country of Origin of Goods<br><b>INDIA</b></td></tr></table>
        <table class="pp-grid"><tr><td>Vessel / Flight No.<br><b>${s.header ? H['Vessel / Flight No.'] : ''}</b></td><td>Port of Loading<br><b>${s.header ? H['Port of Loading'] : ''}</b></td><td>Port of Discharge<br><b>${s.header ? H['Port of Discharge'] : ''}</b></td></tr></table>
        <table class="pp-grid pp-goods"><thead><tr><th>Mark &amp; Nos.</th><th>No. &amp; kind of Packing</th><th>Description of Goods</th><th>Quantity</th><th>Net Wt.(kgs)</th><th>Gross Wt.(kgs)</th></tr></thead>
          <tbody><tr><td class="pp-c">${s.header ? H['Shipping Mark'] : ''}<br>(1-${t.pkgs})</td>
            <td class="pp-c"><b>${t.pkgs} (${WORDS[t.pkgs] || t.pkgs}) PACKAGES</b><br>${Object.entries(kinds).map(([k, n]) => `${n} (${WORDS[n] || n}) ${k.toUpperCase()}`).join('<br>')}</td>
            <td><b class="pp-u">CONVEYOR EQUIPMENT &amp; SPARES</b><ol>${GOODS.map((g) => `<li>${g.product}</li>`).join('')}</ol></td>
            <td>${GOODS.map((g) => `${g.qty} ${g.uom === 'Unit' ? 'Set' : 'Nos'}`).join('<br>')}</td><td></td><td></td></tr>
          <tr class="pp-total"><td colspan="4" class="pp-r">TOTAL</td><td>${kg(t.net)}</td><td>${kg(t.gross)}</td></tr></tbody></table>
        <p class="pp-cont">Cont. on page 02.</p>
      </div>
      <div class="pp-paper" role="document" aria-label="Packing List page 2">
        ${head(2)}
        <table class="pp-grid pp-goods"><thead><tr><th>Mark &amp; Nos.</th><th>No. &amp; kind of Packing</th><th>Description of Goods</th><th>Quantity</th><th>Net Wt.(kgs)</th><th>Gross Wt.(kgs)</th></tr></thead><tbody>
          ${r.map((x) => `<tr><td class="pp-c">${x.pkgs} Package${x.pkgs > 1 ? 's' : ''}</td><td class="pp-c">${x.type}</td>
            <td><b>${x.type} No ${nos(x)} Size ${x.size} Cms containing</b><br>${x.contents ? x.contents.map(([it, q, u]) => `<span class="pp-item"><span>${it}</span><span>${q} ${u}</span></span>`).join('') : `${contentsText(x)}${x.pkgs > 1 ? ` (${+(x.qty / x.pkgs).toFixed(2)} each)` : ''}`}</td>
            <td>${x.printed}</td><td>${kg(rowNet(x))}</td><td>${kg(rowGross(x))}</td></tr>`).join('')}
        </tbody></table>
        <p class="pp-cont">Signature &amp; Date · For SAMPLE EXPORTS PVT LTD</p>
      </div>`;
    };

    const stickers = () => {
      const list = [];
      numbered().forEach((x) => { for (let n = x.from; n <= x.to; n += 1) list.push({ ...x, n }); });
      const i = Math.min(s.sheet, list.length - 1);
      const x = list[i];
      const H = Object.fromEntries(HEADER);
      return `<div class="pp-nav"><button type="button" class="oe-btn oe-btn-2" data-sheet="-1"${i ? '' : ' disabled'}>‹ Previous</button><span aria-live="polite">Sheet ${i + 1} of ${list.length}</span><button type="button" class="oe-btn oe-btn-2" data-sheet="1"${i < list.length - 1 ? '' : ' disabled'}>Next ›</button></div>
        <div class="pp-sticker" role="document" aria-label="Packing Slip, package ${x.n}">
          <div class="pp-title"><b>PACKING SLIP</b></div>
          <table class="pp-grid pp-big"><tr><td class="pp-c"><u>SHIPPER:</u><br>SAMPLE EXPORTS<br>PVT LTD<br>CHENNAI, INDIA</td><td class="pp-c"><u>SHIPPING MARK</u><br>${s.header ? H['Shipping Mark'] : ''}</td></tr>
            <tr><td colspan="2" class="pp-c pp-xl">COUNTRY OF ORIGIN : INDIA</td></tr>
            <tr><td colspan="2" class="pp-c pp-xxl">PACKAGE NO. ${x.n}</td></tr>
            <tr><td colspan="2" class="pp-c pp-xl">ITEM DESCRIPTION</td></tr>
            <tr><td colspan="2"><b>${x.type} No. ${x.n} of size ${x.size.replace(/ /g, '')} cm Containing</b><br>
              ${x.contents ? x.contents.map(([it, q, u]) => `<span class="pp-item"><span>${it}</span><span>${q} ${u}</span></span>`).join('') : `<span class="pp-item"><span>${contentsText(x)}</span><span>${+(x.qty / x.pkgs).toFixed(2)} Nos</span></span>`}</td></tr></table>
        </div>`;
    };

    const body = () => {
      if (s.view === 'form') return form();
      return `<div class="oe-page-title"><span><button type="button" class="oe-link" data-act="back">WH/OUT/00018</button> / <b>${s.view === 'pl' ? 'Packing List (PDF)' : 'Packing Slip (PDF)'}</b></span></div>
        <div class="pp-wrap">${s.view === 'pl' ? pl() : stickers()}</div>`;
    };
    const draw = (focusSel) => redraw(box, frame('Inventory', '<span class="on">Deliveries</span><span>Reporting</span>', '<span class="oe-user">Export User</span>', body()), focusSel);

    box.addEventListener('change', (e) => {
      const d = e.target.dataset;
      const key = ['pkgs', 'rqty', 'gross'].find((k) => d[k] !== undefined);
      if (!key) return;
      const i = Number(d[key]);
      const r = s.rows[i];
      const v = Math.max(d.gross !== undefined ? 0 : 1, Number(e.target.value) || 0);
      s.warn = '';
      if (d.pkgs !== undefined) r.pkgs = v;
      if (d.gross !== undefined) r.gross = Math.min(100, v);
      if (d.rqty !== undefined) {
        const g = GOODS.find((x) => x.product === r.product);
        const room = g.qty - (packed(r.product) - r.qty);
        if (v > room) { r.qty = room; s.warn = `${r.product}: page 2 can't pack more than page 1 (${g.qty} ${g.uom}), so the Qty was cut back to ${room}.`; } else r.qty = v;
      }
      draw();
    });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'defaults') s.header = true;
      if (act === 'fetch') s.goods = true;
      if (act === 'addall') GOODS.filter((g) => !s.rows.some((r) => r.product === g.product)).forEach((g) => s.rows.push({ product: g.product, pkgs: Math.ceil(g.qty / g.perPkg), type: g.type, size: g.size, qty: g.qty, gross: g.gross, printed: g.printed }));
      if (act === 'spares') s.rows.push({ ...SPARES, contents: SPARES.contents.map((c) => [...c]) });
      if (act === 'pl' || act === 'ps') { s.view = act; s.sheet = 0; draw('[data-act="back"]'); return; }
      if (act === 'back') { s.view = 'form'; draw('[data-act="pl"]'); return; }
      if (b.dataset.sheet) { s.sheet = Math.max(0, s.sheet + Number(b.dataset.sheet)); draw(`[data-sheet="${b.dataset.sheet}"]`); return; }
      if (act) draw(`[data-act="${act}"]`);
    });
    draw();
  };

  const SCREENS = { requisition, management, people, variant, packing };
  document.querySelectorAll('[data-screen]').forEach((box, i) => {
    const make = SCREENS[box.dataset.screen];
    if (!make) return;
    box.id = box.id || `screen-${i}`;
    box.classList.add('oe');
    box.textContent = '';
    make(box);
  });
})();
