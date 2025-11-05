// script.js (FULL - fixed + improved)
// Firebase v9 modular SDK (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, doc, updateDoc, getDoc, getDocs,
  onSnapshot, query, orderBy, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* ================= CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyCMhwCdyBmC3037SScytAYGmiXXnFiwFbI",
  authDomain: "request-materials-4b168.firebaseapp.com",
  projectId: "request-materials-4b168",
  storageBucket: "request-materials-4b168.firebasestorage.app",
  messagingSenderId: "1088278709255",
  appId: "1:1088278709255:web:138e1337bea754b21c16a2",
  measurementId: "G-F4FR8YJD99"
};

const cloudName = "dtmm8frik";     // Cloudinary cloud name
const uploadPreset = "Crrd2025";   // Cloudinary unsigned preset

/* ================= INIT ================= */
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/* ================= PERSONNEL (UI) ================= */
const PERSONNEL = [
  "Arnel Tito",
  "Aljay Albit",
  "Roger Castillo",
  "Roberto Oraiz",
  "Jessie Yamid",
  "Ricky Saragena"
];

/* ================= DOM refs ================= */
const modalRoot = document.getElementById('modalRoot');
const btnSubmit = document.getElementById('btnSubmit');
const btnView = document.getElementById('btnView');
const btnDelivered = document.getElementById('btnDelivered');
const btnRemaining = document.getElementById('btnRemaining');
const btnUsage = document.getElementById('btnUsage');
const btnHistory = document.getElementById('btnHistory');

/* ================= Inject styles (glossy yellow buttons + modal + table) ================= */
(function injectStyles(){
  const css = `
  /* Basic UI resets for modal and tables */
  :root { --glass: rgba(255,255,255,0.9); --accent: #f6c84b; --accent-dark: #e6ad22; --accent-shadow: rgba(230,173,34,0.22); --muted: #666; }
  .modal-root{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); z-index:9999; padding:18px; }
  .modal-card{ width:100%; max-width:1100px; max-height:90vh; overflow:auto; background:var(--glass); border-radius:12px; box-shadow: 0 10px 40px rgba(0,0,0,0.25); padding:16px; font-family:Inter,Arial,Helvetica,sans-serif; }
  .modal-head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; }
  .modal-head h3{ margin:0; font-size:18px; }
  .modal-controls{ display:flex; gap:8px; align-items:center; }
  .modal-body{ padding-top:6px; }
  .modal-actions{ display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }

  /* Glossy 3D yellow buttons */
  .btn, .action-btn, .dash-btn { border:0; cursor:pointer; padding:8px 12px; border-radius:10px; font-weight:600; box-shadow: 0 6px 0 rgba(0,0,0,0.08); transition: transform .12s ease, box-shadow .12s ease; background: linear-gradient(180deg, #fff7e6 0%, #fff2d1 40%, var(--accent) 100%); color:#2b2b2b; position:relative; }
  .dash-btn { background: linear-gradient(180deg, #fff9e0 0%, var(--accent) 50%, var(--accent-dark) 100%); box-shadow: 0 6px 18px var(--accent-shadow); }
  .btn:hover, .action-btn:hover, .dash-btn:hover{ transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }
  .btn:active, .action-btn:active, .dash-btn:active{ transform: translateY(-1px); box-shadow: 0 6px 12px rgba(0,0,0,0.08); }

  .icon-btn{ background:transparent; border:0; cursor:pointer; font-size:16px; padding:6px; border-radius:8px; }
  .search-input{ padding:8px 10px; border-radius:8px; border:1px solid #ddd; min-width:200px; }

  .table-wrap{ overflow:auto; max-height:56vh; }
  table{ width:100%; border-collapse:collapse; font-size:13px; }
  th, td{ padding:8px 10px; border-bottom:1px solid #eee; text-align:left; vertical-align:middle; }
  th{ background: #fafafa; position:sticky; top:0; z-index:2; }
  .small{ font-size:12px; color:var(--muted); }
  .badge{ padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700; }
  .badge-complete{ background:#e6ffea; color:#0a7a28; border:1px solid rgba(10,122,40,0.08); }
  .badge-pending{ background:#fff7e7; color:#a66b00; border:1px solid rgba(166,107,0,0.08); }

  .action-btn{ background:transparent; color:#2b2b2b; padding:6px 8px; border-radius:8px; border:1px solid #eee; font-weight:600; }
  .btn-danger{ background:transparent; color:#a70000; border:1px solid rgba(167,0,0,0.08); }
  input[type="number"] { -moz-appearance: textfield; }
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
})();

/* ================= Helpers (UI + Cloudinary) ================= */
function openModal(html){
  modalRoot.innerHTML = `<div class="modal-root" role="dialog" aria-modal="true"><div class="modal-card">${html}</div></div>`;
  const wrapper = modalRoot.querySelector('.modal-root');
  if(!wrapper) return;
  wrapper.addEventListener('click', (e)=>{ if(e.target === wrapper) closeModal(); });
  modalRoot.setAttribute('aria-hidden','false');
}
function closeModal(){ modalRoot.innerHTML = ''; modalRoot.setAttribute('aria-hidden','true'); }
function printHTML(title, html){
  const w = window.open('','_blank');
  w.document.write(`<html><head><title>${title}</title><style>body{font-family:Inter,Arial;padding:18px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd}</style></head><body><h2>${title}</h2>${html}</body></html>`);
  w.document.close(); w.print();
}

async function uploadFiles(files){
  const uploaded = [];
  for(const f of files){
    try{
      const fd = new FormData();
      fd.append('file', f);
      fd.append('upload_preset', uploadPreset);
      fd.append('folder','request_materials');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, { method:'POST', body: fd });
      const j = await res.json();
      if(j.secure_url) uploaded.push({ url: j.secure_url, name: j.original_filename || f.name });
    }catch(err){
      console.error('Cloudinary upload error', err);
    }
  }
  return uploaded;
}

/* ================= Core data utilities ================= */

/**
 * Add deliveredQty (the newly delivered amount) to Remaining Items.
 * If a remaining doc exists for the same requestId -> add there.
 * Else try match by particular -> add to first found.
 * Else create a new remaining doc (requestId may be null).
 */
async function addDeliveredQtyToRemaining({ requestId = null, particular, unit = '', deliveredQty = 0 }){
  try{
    const qByReq = requestId ? query(collection(db,'remaining'), where('requestId','==', requestId)) : null;
    if(qByReq){
      const snap = await getDocs(qByReq);
      if(!snap.empty){
        const rdoc = snap.docs[0];
        const prev = parseFloat(rdoc.data().qty || 0);
        const newQty = prev + deliveredQty;
        await updateDoc(doc(db,'remaining', rdoc.id), { qty: newQty, status: newQty > 0 ? 'Pending' : 'Completed', lastUpdated: new Date().toISOString() });
        return;
      }
    }

    // if no requestId-match, try match by particular
    const qByPart = query(collection(db,'remaining'), where('particular','==', particular));
    const snapPart = await getDocs(qByPart);
    if(!snapPart.empty){
      const rdoc = snapPart.docs[0];
      const prev = parseFloat(rdoc.data().qty || 0);
      const newQty = prev + deliveredQty;
      await updateDoc(doc(db,'remaining', rdoc.id), { qty: newQty, status: newQty > 0 ? 'Pending' : 'Completed', lastUpdated: new Date().toISOString() });
      return;
    }

    // otherwise create new remaining doc
    await addDoc(collection(db,'remaining'), {
      requestId: requestId || null,
      particular,
      unit,
      qty: deliveredQty,
      status: deliveredQty > 0 ? 'Pending' : 'Completed',
      lastUpdated: new Date().toISOString()
    });
  }catch(e){
    console.error('addDeliveredQtyToRemaining error', e);
  }
}

/**
 * When a delivered item is removed (deleted), reflect the reverse into Remaining:
 * - Try to find remaining by requestId first; subtract deliveredQty (but don't go below 0)
 * - Else match by particular.
 * - Keep remaining record (never auto-delete). If qty becomes 0 -> status Completed.
 */
async function removeDeliveredQtyFromRemaining({ requestId = null, particular, deliveredQty = 0 }){
  try{
    if(requestId){
      const q = query(collection(db,'remaining'), where('requestId','==', requestId));
      const snap = await getDocs(q);
      if(!snap.empty){
        const rdoc = snap.docs[0];
        const prev = parseFloat(rdoc.data().qty || 0);
        const newQty = Math.max(0, prev - deliveredQty);
        await updateDoc(doc(db,'remaining', rdoc.id), { qty: newQty, status: newQty > 0 ? 'Pending' : 'Completed', lastUpdated: new Date().toISOString() });
        return;
      }
    }
    // fallback by particular
    const q2 = query(collection(db,'remaining'), where('particular','==', particular));
    const snap2 = await getDocs(q2);
    if(!snap2.empty){
      const rdoc = snap2.docs[0];
      const prev = parseFloat(rdoc.data().qty || 0);
      const newQty = Math.max(0, prev - deliveredQty);
      await updateDoc(doc(db,'remaining', rdoc.id), { qty: newQty, status: newQty > 0 ? 'Pending' : 'Completed', lastUpdated: new Date().toISOString() });
      return;
    }
    // else nothing to update
  }catch(e){
    console.error('removeDeliveredQtyFromRemaining error', e);
  }
}

/**
 * Return total delivered quantity for a given requestId (sums deliveredItems.deliveredQty)
 */
async function getTotalDeliveredForRequest(requestId){
  try{
    if(!requestId) return 0;
    const dQ = query(collection(db,'deliveredItems'), where('requestId','==', requestId));
    const dSnap = await getDocs(dQ);
    let total = 0;
    dSnap.forEach(d => {
      total += parseFloat(d.data().deliveredQty || 0);
    });
    return total;
  }catch(e){
    console.error('getTotalDeliveredForRequest error', e);
    return 0;
  }
}

/**
 * Reconcile: if total delivered for requests >= requestedQty -> mark deliveredItems for that request Completed and delete request.
 * Called after deliveries added/edited/removed.
 */
async function reconcileRequests(){
  try{
    const reqSnap = await getDocs(query(collection(db,'requests'), orderBy('timestamp')));
    for(const rdoc of reqSnap.docs){
      const reqId = rdoc.id;
      const rdata = rdoc.data();
      const requested = parseFloat(rdata.requestedQty || 0);
      if(requested <= 0) continue;
      const deliveredTotal = await getTotalDeliveredForRequest(reqId);
      if(deliveredTotal >= requested){
        // mark deliveredItems of this request as Completed
        const dQ = query(collection(db,'deliveredItems'), where('requestId','==', reqId));
        const dSnap = await getDocs(dQ);
        for(const d of dSnap.docs){
          const dRef = doc(db,'deliveredItems', d.id);
          if(d.data().status !== 'Completed'){
            await updateDoc(dRef, { status: 'Completed' }).catch(()=>{/*ignore*/});
          }
        }
        // delete the request
        await deleteDoc(doc(db,'requests', reqId)).catch((err)=> console.error('delete request error', err));
        // (Remaining should already have been incremented by each delivered record when they were created)
      } else {
        // partial: nothing to delete; requests remain
      }
    }
  }catch(e){
    console.error('reconcileRequests error', e);
  }
}

/* ================= Submit Request ================= */
btnSubmit.addEventListener('click', ()=>{
  openModal(`
    <div class="modal-head">
      <h3>Submit Request</h3>
      <div class="modal-controls"><button id="closeSubmit" class="icon-btn" aria-label="Close">✖</button></div>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="col">
          <label>Personnel</label>
          <select id="personnelSelect">${PERSONNEL.map(p=>`<option value="${p}">${p}</option>`).join('')}</select>
        </div>
        <div class="col">
          <label>Date & Time</label>
          <input id="reqDate" readonly type="text" value="${new Date().toLocaleString()}">
        </div>
      </div>

      <div class="form-row" style="display:flex;gap:8px;margin-top:10px;">
        <div style="flex:2">
          <label>Particular (Item Name)</label>
          <input id="reqPart" type="text" placeholder="e.g. 2-pin plug" style="width:100%;padding:8px;border-radius:8px;border:1px solid #ddd">
        </div>
        <div style="flex:1">
          <label>Unit</label>
          <input id="reqUnit" type="text" placeholder="e.g. pcs" style="width:100%;padding:8px;border-radius:8px;border:1px solid #ddd">
        </div>
        <div style="width:110px">
          <label>Qty</label>
          <input id="reqQty" type="number" min="1" value="1" style="width:100%;padding:8px;border-radius:8px;border:1px solid #ddd">
        </div>
      </div>

      <div style="margin-top:12px;">
        <label>Attach files</label>
        <input id="reqFiles" type="file" multiple>
        <div class="small">Allowed: images, PDF. Files will be uploaded to Cloudinary (unsigned preset).</div>
      </div>

      <div class="modal-actions">
        <button id="cancelSubmit" class="btn">Exit</button>
        <button id="confirmSubmit" class="btn dash-btn">Submit Request</button>
      </div>
    </div>
  `);

  document.getElementById('closeSubmit').onclick = closeModal;
  document.getElementById('cancelSubmit').onclick = closeModal;

  document.getElementById('confirmSubmit').onclick = async ()=>{
    try{
      const personnel = document.getElementById('personnelSelect').value;
      const particular = document.getElementById('reqPart').value.trim();
      const unit = document.getElementById('reqUnit').value.trim();
      const qty = parseInt(document.getElementById('reqQty').value,10) || 0;
      const filesInput = document.getElementById('reqFiles');
      const files = filesInput.files ? Array.from(filesInput.files) : [];

      if(!particular || !unit || qty <= 0) return alert('Please fill particular, unit and quantity.');

      const uploaded = await uploadFiles(files);

      const payload = {
        personnel,
        particular,
        unit,
        requestedQty: qty,
        remarks: '',
        status: 'Requested',
        timestamp: new Date().toISOString(),
        displayDate: new Date().toLocaleString(),
        files: uploaded
      };

      await addDoc(collection(db,'requests'), payload);
      alert('Request submitted ✅');
      closeModal();
    }catch(err){
      console.error(err);
      alert('Failed to submit. Check console.');
    }
  };
});

/* ================= View Requests (editable deliveredQty & remarks) ================= */
btnView.addEventListener('click', ()=>{
  openModal(`
    <div class="modal-head">
      <h3>View Requests</h3>
      <div class="modal-controls">
        <input id="searchReq" class="search-input" placeholder="Search requests (all fields)...">
        <button id="printReq" class="icon-btn" title="Print">🖨</button>
        <button id="closeReq" class="icon-btn" aria-label="Close">✖</button>
      </div>
    </div>
    <div class="modal-body">
      <div class="table-wrap"><table id="requestsTable"><thead><tr>
        <th>Personnel</th><th>Particular</th><th>Unit</th><th>Requested Qty</th><th>Delivered Now</th><th>Remarks</th><th>Date</th><th>Files</th><th>Actions</th>
      </tr></thead><tbody></tbody></table></div>
      <div class="modal-actions"><button id="printReqBtn" class="action-btn">Print</button></div>
    </div>
  `);

  document.getElementById('closeReq').onclick = closeModal;
  document.getElementById('printReq').onclick = ()=> printHTML('Requests', document.querySelector('#requestsTable').outerHTML);
  document.getElementById('printReqBtn').onclick = ()=> printHTML('Requests', document.querySelector('#requestsTable').outerHTML);

  const tbody = document.querySelector('#requestsTable tbody');
  const searchEl = document.getElementById('searchReq');

  // maintain local copy of rows to filter on typing without waiting for snapshot changes
  let rowsCache = [];
  const q = query(collection(db,'requests'), orderBy('timestamp','desc'));
  const unsub = onSnapshot(q, snap=>{
    const rows = [];
    snap.forEach(s=> rows.push({ id: s.id, ...s.data() }));
    rowsCache = rows;
    renderRowsRequests();
  });

  function renderRowsRequests(){
    const term = (searchEl.value||'').toLowerCase();
    const filtered = rowsCache.filter(r=> JSON.stringify(r).toLowerCase().includes(term));
    tbody.innerHTML = filtered.map(r=>{
      const filesHtml = (r.files||[]).map(f=>`<a href="${f.url}" target="_blank">${f.name||'file'}</a>`).join(' ');
      return `<tr data-id="${r.id}">
        <td>${r.personnel||''}</td>
        <td>${r.particular||''}</td>
        <td>${r.unit||''}</td>
        <td>${r.requestedQty||0}</td>
        <td><input class="delivered-input" type="number" min="0" value="0" style="width:90px;padding:6px;border-radius:6px;border:1px solid #ddd"></td>
        <td><input class="remarks-input" type="text" value="${(r.remarks||'')}" placeholder="Remarks" style="width:220px;padding:6px;border-radius:6px;border:1px solid #ddd"></td>
        <td>${r.displayDate||new Date(r.timestamp).toLocaleString()}</td>
        <td class="small">${filesHtml}</td>
        <td>
          <button class="action-btn" data-action="save">Save</button>
          <button class="action-btn" data-action="view">View</button>
          <button class="action-btn btn-danger" data-action="delete">Delete</button>
        </td>
      </tr>`;
    }).join('');
  }

  searchEl.addEventListener('input', ()=> renderRowsRequests());

  tbody.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const row = btn.closest('tr'); if(!row) return;
    const id = row.dataset.id; const action = btn.dataset.action;

    if(action === 'view'){
      const snap = await getDoc(doc(db,'requests',id)); if(!snap.exists()) return alert('Request not found');
      const d = snap.data();
      openModal(`<div class="modal-head"><h3>Request Detail</h3><div class="modal-controls"><button id="closeDetail" class="icon-btn" aria-label="Close">✖</button></div></div>
        <div class="modal-body">
          <p><strong>Personnel:</strong> ${d.personnel}</p>
          <p><strong>Particular:</strong> ${d.particular}</p>
          <p><strong>Unit:</strong> ${d.unit}</p>
          <p><strong>Qty:</strong> ${d.requestedQty}</p>
          <p><strong>Remarks:</strong> ${d.remarks||''}</p>
          <p><strong>Date:</strong> ${d.displayDate||new Date(d.timestamp).toLocaleString()}</p>
          <p><strong>Files:</strong> ${(d.files||[]).map(f=>`<a href="${f.url}" target="_blank">${f.name||'file'}</a>`).join(' ')}</p>
        </div>`);
      document.getElementById('closeDetail').onclick = closeModal;
    }

    else if(action === 'save'){
      try{
        const deliveredInput = row.querySelector('.delivered-input');
        const remarksInput = row.querySelector('.remarks-input');
        const deliveredNowInput = parseInt(deliveredInput.value,10);
        const deliveredNow = isNaN(deliveredNowInput) ? 0 : deliveredNowInput;
        const remarks = remarksInput.value || '';

        if(deliveredNow <= 0) return alert('Enter a delivered quantity greater than 0 to record a delivery.');

        // fetch current request
        const reqSnap = await getDoc(doc(db,'requests',id));
        if(!reqSnap.exists()) return alert('Request not found (maybe already moved).');
        const req = reqSnap.data();
        const requestedQty = parseFloat(req.requestedQty || 0);

        // Add a deliveredItems record representing this delivery action (deliveredNow)
        const dPayload = {
          requestId: id,
          personnel: req.personnel,
          particular: req.particular,
          unit: req.unit,
          requestedQty: requestedQty,
          deliveredQty: deliveredNow,
          remarks,
          status: deliveredNow >= requestedQty ? 'Completed' : 'Pending',
          timestamp: new Date().toISOString(),
          displayDate: new Date().toLocaleString()
        };
        const deliveredRef = await addDoc(collection(db,'deliveredItems'), dPayload);

        // Immediately add deliveredNow to remaining (exact amount delivered)
        await addDeliveredQtyToRemaining({ requestId: id, particular: req.particular, unit: req.unit, deliveredQty: deliveredNow });

        // After adding, reconcile requests (if cumulative delivered reaches requested -> delete request)
        await reconcileRequests();

        alert('Delivery recorded. Remaining updated accordingly.');
      }catch(err){
        console.error(err);
        alert('Failed recording delivery. Check console.');
      }
    }

    else if(action === 'delete'){
      if(!confirm('Delete this request? This cannot be undone.')) return;
      try{
        await deleteDoc(doc(db,'requests',id));
        alert('Request deleted');
      }catch(err){
        console.error(err);
        alert('Failed to delete. Check console.');
      }
    }
  });

  // cleanup on modal root click/close
  const wrapper = modalRoot.querySelector('.modal-root');
  if(wrapper){
    const clickHandler = (e)=>{
      if(e.target === wrapper){ unsub(); closeModal(); wrapper.removeEventListener('click', clickHandler); }
    };
    wrapper.addEventListener('click', clickHandler);
  }
});

/* ================= View Delivered Items ================= */
btnDelivered.addEventListener('click', ()=>{
  openModal(`
    <div class="modal-head">
      <h3>Delivered Items</h3>
      <div class="modal-controls">
        <input id="searchDel" class="search-input" placeholder="Search delivered (all fields)...">
        <button id="printDel" class="icon-btn" title="Print">🖨</button>
        <button id="closeDel" class="icon-btn" aria-label="Close">✖</button>
      </div>
    </div>
    <div class="modal-body">
      <div class="table-wrap"><table id="delTable"><thead><tr>
        <th>Personnel</th><th>Particular</th><th>Unit</th><th>Requested</th><th>Delivered</th><th>Date</th><th>Remarks</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody></tbody></table></div>
    </div>
  `);

  document.getElementById('closeDel').onclick = closeModal;
  document.getElementById('printDel').onclick = ()=> printHTML('Delivered Items', document.querySelector('#delTable').outerHTML);

  const tbody = document.querySelector('#delTable tbody');
  const searchEl = document.getElementById('searchDel');

  // local caching pattern for responsive search
  let rowsCache = [];
  const q = query(collection(db,'deliveredItems'), orderBy('timestamp','desc'));
  const unsub = onSnapshot(q, snap=>{
    const rows = []; snap.forEach(s=> rows.push({ id: s.id, ...s.data() }));
    rowsCache = rows;
    renderRowsDelivered();
  });

  function renderRowsDelivered(){
    const term = (searchEl.value||'').toLowerCase();
    const filtered = rowsCache.filter(r=> JSON.stringify(r).toLowerCase().includes(term));
    tbody.innerHTML = filtered.map(r=>`
      <tr>
        <td>${r.personnel||''}</td>
        <td>${r.particular||''}</td>
        <td>${r.unit||''}</td>
        <td>${r.requestedQty||0}</td>
        <td>${r.deliveredQty||0}</td>
        <td>${r.displayDate || new Date(r.timestamp).toLocaleString()}</td>
        <td>${r.remarks||''}</td>
        <td>${
          r.status === 'Completed'
            ? `<span class="badge badge-complete">Completed</span>`
            : `<span class="badge badge-pending">Pending</span>`
        }</td>
        <td><button class="action-btn btn-danger" data-id="${r.id}" data-action="delete">Delete</button></td>
      </tr>
    `).join('');
  }

  searchEl.addEventListener('input', ()=> renderRowsDelivered());

  tbody.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    if(action === 'delete'){
      if(!confirm('Delete this delivered record? This cannot be undone.')) return;
      try{
        // get delivered doc data
        const dSnap = await getDoc(doc(db,'deliveredItems', id));
        const dData = dSnap.exists() ? dSnap.data() : null;

        // delete delivered record
        await deleteDoc(doc(db,'deliveredItems',id));

        // subtract deliveredQty from remaining (reverse of earlier addition)
        if(dData){
          await removeDeliveredQtyFromRemaining({ requestId: dData.requestId || null, particular: dData.particular, deliveredQty: parseFloat(dData.deliveredQty || 0) });
          // after adjusting remaining, reconcile requests
          await reconcileRequests();
        }

        alert('Delivered record deleted and remaining adjusted where applicable');
      }catch(err){
        console.error(err);
        alert('Failed to delete delivered record. Check console.');
      }
    }
  });

  const wrapper = modalRoot.querySelector('.modal-root');
  if(wrapper){
    const clickHandler = (e)=>{
      if(e.target === wrapper){ unsub(); closeModal(); wrapper.removeEventListener('click', clickHandler); }
    };
    wrapper.addEventListener('click', clickHandler);
  }
});

/* ================= View Remaining ================= */
btnRemaining.addEventListener('click', ()=>{
  openModal(`
    <div class="modal-head">
      <h3>Remaining Items</h3>
      <div class="modal-controls">
        <input id="searchRem" class="search-input" placeholder="Search remaining...">
        <button id="printRem" class="icon-btn" title="Print">🖨</button>
        <button id="closeRem" class="icon-btn" aria-label="Close">✖</button>
      </div>
    </div>
    <div class="modal-body">
      <div class="table-wrap"><table id="remTable"><thead><tr>
        <th>Particular</th><th>Unit</th><th>Qty</th><th>Status</th><th>Last Updated</th><th>Actions</th>
      </tr></thead><tbody></tbody></table></div>
      <div class="modal-actions"><button id="addManualRem" class="action-btn">Add Manual Remaining</button></div>
    </div>
  `);

  document.getElementById('closeRem').onclick = closeModal;
  document.getElementById('printRem').onclick = ()=> printHTML('Remaining Items', document.querySelector('#remTable').outerHTML);
  document.getElementById('addManualRem').onclick = async ()=>{
    const particular = prompt('Particular name:'); if(!particular) return;
    const unit = prompt('Unit (e.g. pcs):','pcs') || 'pcs';
    const qtyStr = prompt('Quantity:', '1'); const qty = parseInt(qtyStr,10) || 0;
    await addDoc(collection(db,'remaining'), { requestId: null, particular, unit, qty, status: qty > 0 ? 'Pending' : 'Completed', lastUpdated: new Date().toISOString() });
    alert('Manual remaining added (entries are never erased automatically).');
  };

  const tbody = document.querySelector('#remTable tbody');
  const searchEl = document.getElementById('searchRem');

  let rowsCache = [];
  const q = query(collection(db,'remaining'), orderBy('particular'));
  const unsub = onSnapshot(q, snap=>{
    const rows = []; snap.forEach(s=>rows.push({ id: s.id, ...s.data() }));
    rowsCache = rows;
    renderRowsRemaining();
  });

  function renderRowsRemaining(){
    const term = (searchEl.value||'').toLowerCase();
    const filtered = rowsCache.filter(r=> JSON.stringify(r).toLowerCase().includes(term));
    tbody.innerHTML = filtered.map(r=>`
      <tr>
        <td>${r.particular}</td>
        <td>${r.unit}</td>
        <td contenteditable="true" data-id="${r.id}" data-field="qty">${r.qty||0}</td>
        <td>${r.status || 'Pending'}</td>
        <td>${r.lastUpdated? new Date(r.lastUpdated).toLocaleString(): ''}</td>
        <td>
          <button class="action-btn" data-id="${r.id}" data-action="save">Save</button>
          <button class="action-btn" data-id="${r.id}" data-action="use">Add Usage</button>
          <button class="action-btn btn-danger" data-id="${r.id}" data-action="delete">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  searchEl.addEventListener('input', ()=> renderRowsRemaining());

  tbody.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    if(action === 'save'){
      const row = btn.closest('tr');
      const qty = parseInt(row.querySelector('td[data-field="qty"]').textContent.trim(),10) || 0;
      const status = qty > 0 ? 'Pending' : 'Completed';
      await updateDoc(doc(db,'remaining',id), { qty, status, lastUpdated: new Date().toISOString() });
      alert('Remaining updated (user-saved).');
    } else if(action === 'use'){
      const row = btn.closest('tr');
      const qtyAvailable = parseInt(row.querySelector('td[data-field="qty"]').textContent.trim(),10) || 0;
      const amtStr = prompt(`Enter amount to use (available: ${qtyAvailable}):`, '1');
      const amt = parseInt(amtStr,10) || 0;
      if(amt <= 0) return alert('Invalid amount');
      if(amt > qtyAvailable) return alert('Amount exceeds remaining available.');
      const remDoc = await getDoc(doc(db,'remaining',id));
      const remData = remDoc.data();
      await addDoc(collection(db,'usage'), {
        remainingId: id,
        particular: remData.particular,
        unit: remData.unit,
        qtyUsed: amt,
        date: new Date().toISOString(),
        displayDate: new Date().toLocaleString()
      });
      const newQty = Math.max(0, qtyAvailable - amt);
      const status = newQty > 0 ? 'Pending' : 'Completed';
      await updateDoc(doc(db,'remaining',id), { qty: newQty, status, lastUpdated: new Date().toISOString() });
      if(newQty === 0) alert('Usage recorded. Remaining is now 0 — Completed (record kept).');
      else alert('Usage recorded & Remaining updated ✅');
    } else if(action === 'delete'){
      if(!confirm('Delete this remaining item (manual)?')) return;
      await deleteDoc(doc(db,'remaining',id));
      alert('Remaining item deleted manually.');
    }
  });

  const wrapper = modalRoot.querySelector('.modal-root');
  if(wrapper){
    const clickHandler = (e)=>{
      if(e.target === wrapper){ unsub(); closeModal(); wrapper.removeEventListener('click', clickHandler); }
    };
    wrapper.addEventListener('click', clickHandler);
  }
});

/* ================= Use Items (from Remaining) ================= */
btnUsage.addEventListener('click', ()=>{
  openModal(`
    <div class="modal-head">
      <h3>Use Items (From Remaining)</h3>
      <div class="modal-controls">
        <input id="searchUseRem" class="search-input" placeholder="Search remaining...">
        <button id="printUseRem" class="icon-btn" title="Print">🖨</button>
        <button id="closeUseRem" class="icon-btn" aria-label="Close">✖</button>
      </div>
    </div>
    <div class="modal-body">
      <div class="table-wrap"><table id="useRemTable"><thead><tr>
        <th>Particular</th><th>Unit</th><th>Remaining Qty</th><th>Last Updated</th><th>Actions</th>
      </tr></thead><tbody></tbody></table></div>
    </div>
  `);

  document.getElementById('closeUseRem').onclick = closeModal;
  document.getElementById('printUseRem').onclick = ()=> printHTML('Remaining (for Usage)', document.querySelector('#useRemTable').outerHTML);

  const tbody = document.querySelector('#useRemTable tbody');
  const searchEl = document.getElementById('searchUseRem');

  let rowsCache = [];
  const q = query(collection(db,'remaining'), orderBy('particular'));
  const unsub = onSnapshot(q, snap=>{
    const rows = []; snap.forEach(s=>rows.push({ id: s.id, ...s.data() }));
    rowsCache = rows;
    renderTable();
  });

  function renderTable(){
    const term = (searchEl.value||'').toLowerCase();
    const filtered = rowsCache.filter(r=> JSON.stringify(r).toLowerCase().includes(term));
    tbody.innerHTML = filtered.map(r=>`
      <tr>
        <td>${r.particular}</td>
        <td>${r.unit}</td>
        <td>${r.qty||0}</td>
        <td>${r.lastUpdated? new Date(r.lastUpdated).toLocaleString(): ''}</td>
        <td>
          <button class="action-btn" data-id="${r.id}" data-action="use">Use</button>
        </td>
      </tr>
    `).join('');
  }

  searchEl.addEventListener('input', ()=> renderTable());

  tbody.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    if(action === 'use'){
      const remDoc = await getDoc(doc(db,'remaining',id));
      const remData = remDoc.data();
      const qtyAvailable = parseInt(remData.qty || 0);
      const amtStr = prompt(`Enter amount to use (available: ${qtyAvailable}):`, '1');
      const amt = parseInt(amtStr,10) || 0;
      if(amt <= 0) return alert('Invalid amount');
      if(amt > qtyAvailable) return alert('Amount exceeds remaining available.');
      await addDoc(collection(db,'usage'), {
        remainingId: id,
        particular: remData.particular,
        unit: remData.unit,
        qtyUsed: amt,
        date: new Date().toISOString(),
        displayDate: new Date().toLocaleString()
      });
      const newQty = Math.max(0, qtyAvailable - amt);
      const status = newQty > 0 ? 'Pending' : 'Completed';
      await updateDoc(doc(db,'remaining',id), { qty: newQty, status, lastUpdated: new Date().toISOString() });
      if(newQty === 0) alert('Usage recorded. Remaining is now 0 — Completed (record kept).');
      else alert('Usage recorded & Remaining updated ✅');
    }
  });

  const wrapper = modalRoot.querySelector('.modal-root');
  if(wrapper){
    const clickHandler = (e)=>{
      if(e.target === wrapper){ unsub(); closeModal(); wrapper.removeEventListener('click', clickHandler); }
    };
    wrapper.addEventListener('click', clickHandler);
  }
});

/* ================= Usage History ================= */
btnHistory.addEventListener('click', ()=>{
  openModal(`
    <div class="modal-head">
      <h3>Usage History</h3>
      <div class="modal-controls">
        <input id="searchHist" class="search-input" placeholder="Search history...">
        <button id="printHist" class="icon-btn" title="Print">🖨</button>
        <button id="closeHist" class="icon-btn" aria-label="Close">✖</button>
      </div>
    </div>
    <div class="modal-body">
      <div class="table-wrap"><table id="histTable"><thead><tr>
        <th>Date</th><th>Particular</th><th>Qty Used</th><th>Remaining Now</th><th>Actions</th>
      </tr></thead><tbody></tbody></table></div>
    </div>
  `);

  document.getElementById('closeHist').onclick = closeModal;
  document.getElementById('printHist').onclick = ()=> printHTML('Usage History', document.querySelector('#histTable').outerHTML);

  const tbody = document.querySelector('#histTable tbody');
  const searchEl = document.getElementById('searchHist');

  let rowsCache = [];
  const q = query(collection(db,'usage'), orderBy('date','desc'));
  const unsub = onSnapshot(q, snap=>{
    const rows = []; snap.forEach(s=>rows.push({ id: s.id, ...s.data() }));
    rowsCache = rows;
    renderHistory();
  });

  async function enrichRow(r){
    let remNow = '-';
    if(r.remainingId){
      try{
        const remDoc = await getDoc(doc(db,'remaining', r.remainingId));
        if(remDoc.exists()) remNow = remDoc.data().qty || 0;
      }catch(e){ remNow = '-'; }
    } else {
      try{
        const remQ = query(collection(db,'remaining'), where('particular','==', r.particular));
        const remSnap = await getDocs(remQ);
        if(!remSnap.empty) remNow = remSnap.docs[0].data().qty || 0;
      }catch(e){ remNow = '-'; }
    }
    return { ...r, remNow };
  }

  async function renderHistory(){
    const term = (searchEl.value||'').toLowerCase();
    const filtered = rowsCache.filter(r=> JSON.stringify(r).toLowerCase().includes(term)).slice(0,200);
    const promises = filtered.map(enrichRow);
    const results = await Promise.all(promises);
    tbody.innerHTML = results.map(r=>`
      <tr>
        <td>${r.displayDate||new Date(r.date).toLocaleString()}</td>
        <td>${r.particular}</td>
        <td>${r.qtyUsed||0}</td>
        <td>${r.remNow}</td>
        <td><button class="action-btn btn-danger" data-id="${r.id}" data-action="delete">Delete</button></td>
      </tr>
    `).join('');
  }

  searchEl.addEventListener('input', ()=> renderHistory());

  tbody.addEventListener('click', async (ev)=>{
    const btn = ev.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    if(action === 'delete'){
      if(!confirm('Delete this usage record?')) return;
      await deleteDoc(doc(db,'usage',id));
      alert('Deleted');
    }
  });

  const wrapper = modalRoot.querySelector('.modal-root');
  if(wrapper){
    const clickHandler = (e)=>{
      if(e.target === wrapper){ unsub(); closeModal(); wrapper.removeEventListener('click', clickHandler); }
    };
    wrapper.addEventListener('click', clickHandler);
  }
});

/* ================= deliveredItems watcher =================
   When deliveredItems change, we:
   - For added deliveries: ensure remaining gets the deliveredQty (handled on creation)
   - For deleted deliveries: subtract deliveredQty from remaining (handled on delete)
   - After any change, run reconcileRequests to auto-complete requests if totals meet/exceed requestedQty
*/
const deliveredWatcher = query(collection(db,'deliveredItems'), orderBy('timestamp','desc'));
onSnapshot(deliveredWatcher, async snap=>{
  try{
    // Just run reconciliation after any change to ensure requests removal when totals match
    await reconcileRequests();
  }catch(e){
    console.error('deliveredWatcher error', e);
  }
});

/* ================= End of script.js ================= */