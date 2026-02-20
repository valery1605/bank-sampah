// app.js - simple client-side demo for member registration, iuran, and pickup reporting

const membersKey = 'bs_nodetroopers_members';
const pickupsKey = 'bs_nodetroopers_pickups';

function $(id){return document.getElementById(id);} 

function loadMembers(){
  return JSON.parse(localStorage.getItem(membersKey) || '[]');
}

function saveMembers(members){
  localStorage.setItem(membersKey, JSON.stringify(members));
}

function loadPickups(){
  return JSON.parse(localStorage.getItem(pickupsKey) || '[]');
}

function savePickups(p){
  localStorage.setItem(pickupsKey, JSON.stringify(p));
}

function renderMembers(){
  const members = loadMembers();
  const container = $('members-list');
  if(!members.length){ container.innerHTML = '<p>Belum ada anggota terdaftar.</p>'; return; }

  const list = document.createElement('div');
  list.className = 'members-table';
  members.forEach((m, idx) => {
    const row = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `
      <div class="member-info">
        <strong>${escapeHtml(m.name)}</strong><br>
        <small>${escapeHtml(m.address)}</small>
        <div class="last-paid-info muted">
          Terakhir Bayar: ${m.lastPaid ? new Date(m.lastPaid).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : 'Belum Pernah'}
        </div>
      </div>
      <div class="member-actions">
        <button data-idx="${idx}" class="btn pay-btn">Bayar (${formatCurrency(m.fee)})</button>
        <button data-idx="${idx}" class="btn report-btn">Lapor Belum Diangkut</button>
        ${m.ownerId?('<div class="owner-tag">Pemilik: '+escapeHtml(m.ownerId)+'</div>'):''}
      </div>
    `;
    list.appendChild(row);
  });
  container.innerHTML = '';
  container.appendChild(list);

  // bind actions
  Array.from(container.querySelectorAll('.pay-btn')).forEach(b=>b.addEventListener('click', onPay));
  Array.from(container.querySelectorAll('.report-btn')).forEach(b=>b.addEventListener('click', onReport));
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

function formatCurrency(n){
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function onPay(e){
  const idx = Number(e.currentTarget.dataset.idx);
  const members = loadMembers();
  const m = members[idx];
  if(!m) return;
  // mark latest payment timestamp
  m.lastPaid = new Date().toISOString();
  saveMembers(members);
  renderMembers();
  alert(`Pembayaran iuran untuk ${m.name} tercatat.`);
}

function onReport(e){
  const idx = Number(e.currentTarget.dataset.idx);
  const members = loadMembers();
  const m = members[idx];
  if(!m) return;

  const pickups = loadPickups();
  const id = 'p_' + Date.now();
  const pickup = {
    id, memberIdx: idx, name: m.name, address: m.address, status: 'dilaporkan', reportedAt: new Date().toISOString()
  };
  pickups.push(pickup);
  savePickups(pickups);
  renderPickups();
  alert(`Laporan diterima. Petugas akan dikirim ke ${m.address} (simulasi dalam 15 detik).`);

  // simulate crew coming in 15s
  setTimeout(()=>{
    const pks = loadPickups();
    const p = pks.find(x=>x.id===id);
    if(p && p.status==='dilaporkan'){
      p.status = 'dijadwalkan';
      p.scheduledAt = new Date().toISOString();
      savePickups(pks);
      renderPickups();

      // simulate arrival after another 10s
      setTimeout(()=>{
        const pks2 = loadPickups();
        const p2 = pks2.find(x=>x.id===id);
        if(p2 && p2.status!=='selesai'){
          p2.status = 'selesai';
          p2.completedAt = new Date().toISOString();
          savePickups(pks2);
          renderPickups();
          alert(`Petugas telah menjemput sampah di ${m.address}. Terima kasih!`);
        }
      }, 10000);
    }
  }, 15000);
}

function renderPickups(){
  const pks = loadPickups();
  const c = $('pending-pickups');
  if(!pks.length){ c.innerHTML = '<p>Tidak ada pickup tertunda.</p>'; return; }
  const list = document.createElement('div');
  list.className = 'pickups-list';
  pks.slice().reverse().forEach(p=>{
    const item = document.createElement('div');
    item.className = 'pickup-item';
    item.innerHTML = `<strong>${escapeHtml(p.name)}</strong> — ${escapeHtml(p.address)}<br>
      <small>Status: ${escapeHtml(p.status)}${p.completedAt?(' • Selesai: '+new Date(p.completedAt).toLocaleString()):''}</small>`;
    list.appendChild(item);
  });
  c.innerHTML = '';
  c.appendChild(list);
}

// register form handling
const form = document.querySelector('#register-form');
if(form){
  // require resident login to register a house
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const resident = sessionStorage.getItem('bs_resident');
    if(!resident){
      if(confirm('Anda harus login sebagai warga untuk mendaftarkan rumah. Login sekarang?')){
        location.href = 'resident-login.html';
      }
      return;
    }
    const res = JSON.parse(resident);
    const name = $('name').value.trim();
    const address = $('address').value.trim();
    const fee = Number($('fee').value) || 0;
    const members = loadMembers();
    members.push({id: 'm_' + Date.now(), name,address,fee,joinedAt: new Date().toISOString(), ownerId: res.id});
    saveMembers(members);
    renderMembers();
    form.reset();
    alert('Berhasil mendaftarkan rumah.');
  });
  // also toggle form visibility depending on login
  const resident = sessionStorage.getItem('bs_resident');
  if(!resident){
    // show hint in place of form
    const parentCard = form.closest('.card');
    if(parentCard){
      parentCard.querySelector('h3').insertAdjacentHTML('afterend', '<p class="muted">Anda belum login sebagai warga. Silakan <a href="resident-login.html">masuk</a> atau <a href="resident-register.html">daftar</a> terlebih dahulu untuk mendaftarkan rumah.</p>');
      form.style.display = 'none';
    }
  }
}

// initial render
renderMembers();
renderPickups();

// MIGRASI DATA: Perbaiki data lama yang tidak punya ID
(function fixMissingIds(){
  let members = loadMembers();
  let pickups = loadPickups();
  let changed = false;
  
  members = members.map((m, i) => {
    if(!m.id){ m.id = 'm_old_' + Date.now() + '_' + i; changed = true; }
    return m;
  });
  pickups = pickups.map((p, i) => {
    if(!p.id){ p.id = 'p_old_' + Date.now() + '_' + i; changed = true; }
    return p;
  });

  if(changed){
    saveMembers(members);
    savePickups(pickups);
    renderMembers();
    renderPickups();
  }
})();

// resident area in navbar
function renderResidentArea(){
  const container = document.getElementById('resident-area');
  if(!container) return;
  const resident = sessionStorage.getItem('bs_resident');
  if(!resident){
    container.innerHTML = `<a href="resident-login.html" style="color:var(--brand-light);text-decoration:none;margin-right:8px;">Masuk Warga</a>`;
    return;
  }
  const r = JSON.parse(resident);
  container.innerHTML = `<span class="res-name">Halo, ${escapeHtml(r.name)}</span><button class="res-logout">Keluar</button>`;
  const btn = container.querySelector('.res-logout');
  btn.addEventListener('click', ()=>{
    sessionStorage.removeItem('bs_resident');
    // refresh to update UI
    renderResidentArea();
    // if on iuran section, reload page to show/hide form
    if(location.hash === '#iuran') location.reload();
  });
}

renderResidentArea();

// expose for debug
window.bs = {loadMembers, loadPickups, saveMembers, savePickups};

// Optional: Socket.io sync to a local sync server (useful with ngrok)
// Usage: set window.SYNC_URL = 'https://abcd.ngrok.io' in console before reload, or host a small sync-config.js
if (window.io) {
  (function(){
    let syncUrl = window.SYNC_URL || (location.hostname === 'localhost' ? 'http://localhost:3000' : null);
    if(!syncUrl) return;
    syncUrl = syncUrl.trim(); // Hapus spasi yang mungkin ada di awal/akhir
    try {
      console.log('Attempting socket sync to', syncUrl);
      const socket = io(syncUrl, { transports: ['websocket', 'polling'] });

      socket.on('connect', ()=>console.log('sync socket connected', socket.id));

      socket.on('sync:init', data => {
        if(data.members){ try{ localStorage.setItem(membersKey, JSON.stringify(data.members)); }catch(e){}; renderMembers(); }
        if(data.pickups){ try{ localStorage.setItem(pickupsKey, JSON.stringify(data.pickups)); }catch(e){}; renderPickups(); }
      });

      socket.on('sync:members', m => {
        try{ localStorage.setItem(membersKey, JSON.stringify(m||[])); }catch(e){}
        renderMembers();
      });

      socket.on('sync:pickups', p => {
        try{ localStorage.setItem(pickupsKey, JSON.stringify(p||[])); }catch(e){}
        renderPickups();
      });

      // emit updates when local saves happen
      const _saveMembers = saveMembers;
      saveMembers = function(members){
        try{ _saveMembers(members); }catch(e){}
        try{ socket.emit('update:members', members || []); }catch(e){ console.warn('socket emit members failed', e); }
      };

      const _savePickups = savePickups;
      savePickups = function(pickups){
        try{ _savePickups(pickups); }catch(e){}
        try{ socket.emit('update:pickups', pickups || []); }catch(e){ console.warn('socket emit pickups failed', e); }
      };

    } catch(err){ console.error('Socket sync setup failed', err); }
  })();
}
