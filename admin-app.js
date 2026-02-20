// admin-app.js - Logic for the admin dashboard

// 1. Auth Check: Pastikan hanya admin yang bisa akses
(function authCheck() {
    const token = sessionStorage.getItem('bs_token');
    if (!token) {
        alert('Anda harus login sebagai admin untuk mengakses halaman ini.');
        location.href = 'login.html';
    }
})();

let socket; // Jadikan socket dapat diakses di seluruh skrip

// 2. Elemen UI
const membersContainer = document.getElementById('members-list-admin');
const pickupsContainer = document.getElementById('pickups-list-admin');

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

// 3. Fungsi Render
function renderMembers(members) {
    if (!members || !members.length) {
        membersContainer.innerHTML = '<p>Belum ada anggota yang terdaftar.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'admin-data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Nama</th>
                <th>Alamat</th>
                <th>Iuran</th>
                <th>Bergabung</th>
                <th>Terakhir Bayar</th>
                <th>Aksi</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement('tbody');
    members.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(m.name)}</td>
            <td>${escapeHtml(m.address)}</td>
            <td>Rp ${Number(m.fee).toLocaleString('id-ID')}</td>
            <td>${new Date(m.joinedAt).toLocaleDateString('id-ID')}</td>
            <td>${m.lastPaid ? new Date(m.lastPaid).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : 'Belum Pernah'}</td>
            <td>
                <button class="btn-delete" data-type="member" data-id="${escapeHtml(m.id || '')}">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    membersContainer.innerHTML = '';
    membersContainer.appendChild(table);
}

function renderPickups(pickups) {
    if (!pickups || !pickups.length) {
        pickupsContainer.innerHTML = '<p>Tidak ada laporan penjemputan sampah.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'admin-data-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Pelapor</th>
                <th>Alamat</th>
                <th>Status</th>
                <th>Dilaporkan</th>
                <th>Aksi</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement('tbody');
    // Show latest reports first
    pickups.slice().reverse().forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.address)}</td>
            <td><span class="status-badge status-${p.status.toLowerCase()}">${escapeHtml(p.status)}</span></td>
            <td>${new Date(p.reportedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td>
                <button class="btn-delete" data-type="pickup" data-id="${escapeHtml(p.id || '')}">Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    pickupsContainer.innerHTML = '';
    pickupsContainer.appendChild(table);
}

// 4. Logika Socket.io & Aksi Admin
function handleDelete(e) {
    const target = e.target;
    if (!target.classList.contains('btn-delete')) return;
    if (!socket) {
        alert('Koneksi ke server belum siap.');
        return;
    }

    const type = target.dataset.type;
    const id = target.dataset.id;

    // -- DEBUGGING --
    console.log(`Tombol Hapus diklik! Tipe: ${type}, ID yang diterima dari tombol: "${id}"`);
    // ---------------

    if (!id) {
        alert('Data ini adalah data lama yang tidak memiliki ID. Silakan refresh halaman "Warga" (index.html) terlebih dahulu untuk memperbaiki data secara otomatis.');
        return;
    }

    if (confirm(`Anda yakin ingin menghapus ${type === 'member' ? 'anggota' : 'laporan'} ini?`)) {
        // OPTIMISTIC UI: Langsung hapus baris dari tabel agar terasa responsif
        const row = target.closest('tr');
        if (row) row.remove();

        if (type === 'member') {
            console.log(`MENGIRIM event 'admin:delete:member' ke server dengan ID: ${id}`);
            socket.emit('admin:delete:member', id);
        } else if (type === 'pickup') {
            console.log(`MENGIRIM event 'admin:delete:pickup' ke server dengan ID: ${id}`);
            socket.emit('admin:delete:pickup', id);
        }
    }
}
membersContainer.addEventListener('click', handleDelete);
pickupsContainer.addEventListener('click', handleDelete);


if (window.io && window.SYNC_URL) {
    const syncUrl = window.SYNC_URL.trim(); // Hapus spasi yang mungkin ada di awal/akhir
    console.log('Admin attempting to connect to sync server:', syncUrl);
    
    socket = io(syncUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => console.log('Admin connected to sync server with ID:', socket.id));

    socket.on('connect_error', (err) => console.error('Admin connection error:', err));

    socket.on('sync:init', data => {
        console.log('Admin received initial data:', data);
        if (data.members) renderMembers(data.members);
        if (data.pickups) renderPickups(data.pickups);
    });

    socket.on('sync:members', membersData => renderMembers(membersData));
    socket.on('sync:pickups', pickupsData => renderPickups(pickupsData));
}