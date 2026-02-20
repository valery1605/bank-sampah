const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // Izinkan koneksi dari mana saja
app.use(express.static(__dirname)); // Izinkan server menampilkan file HTML/CSS/JS

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Izinkan semua origin, bagus untuk development dengan ngrok
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// "Database" sederhana di memori server untuk menyimpan data
let db = {
  members: [],
  pickups: []
};

io.on('connection', (socket) => {
  console.log('User terhubung:', socket.id);

  // 1. Kirim data awal saat user baru terhubung
  socket.emit('sync:init', db);

  // 2. Terima update data 'members' dari satu klien
  socket.on('update:members', (membersData) => {
    console.log('Menerima update "members" dari', socket.id);
    db.members = membersData;
    // 3. Kirim update ke SEMUA klien (termasuk pengirim)
    io.emit('sync:members', db.members);
  });

  // Lakukan hal yang sama untuk 'pickups'
  socket.on('update:pickups', (pickupsData) => {
    console.log('Menerima update "pickups" dari', socket.id);
    db.pickups = pickupsData;
    io.emit('sync:pickups', db.pickups);
  });

  // 4. Terima permintaan hapus dari admin
  socket.on('admin:delete:member', (memberId) => {
    console.log(`[DELETE] Request hapus anggota ID: "${memberId}"`);
    const initialCount = db.members.length;
    // Gunakan String() untuk memastikan perbandingan aman (angka vs string)
    db.members = db.members.filter(m => String(m.id) !== String(memberId));
    console.log(`[DELETE] Sisa anggota: ${db.members.length} (Dihapus: ${initialCount - db.members.length})`);
    io.emit('sync:members', db.members); // Kirim daftar anggota terbaru ke semua klien
  });

  socket.on('admin:delete:pickup', (pickupId) => {
    console.log(`[DELETE] Request hapus laporan ID: "${pickupId}"`);
    const initialCount = db.pickups.length;
    db.pickups = db.pickups.filter(p => String(p.id) !== String(pickupId));
    console.log(`[DELETE] Sisa laporan: ${db.pickups.length} (Dihapus: ${initialCount - db.pickups.length})`);
    io.emit('sync:pickups', db.pickups); // Kirim daftar laporan terbaru ke semua klien
  });

  socket.on('disconnect', () => console.log('User terputus:', socket.id));
});

server.listen(PORT, () => {
  console.log(`Server bank sampah berjalan di http://localhost:${PORT}`);
});