// resident-auth.js - simple resident signup/login (client-only demo)
(function(){
  const resKey = 'bs_residents';
  function $(id){return document.getElementById(id);} 
  function loadResidents(){ return JSON.parse(localStorage.getItem(resKey) || '[]'); }
  function saveResidents(arr){ localStorage.setItem(resKey, JSON.stringify(arr)); }
  function findByEmail(email){ return loadResidents().find(r=>r.email.toLowerCase()===email.toLowerCase()); }
  function genId(){ return 'r_' + Date.now() + '_' + Math.floor(Math.random()*9000+1000); }

  // safe localStorage/sessionStorage helpers: some mobile browsers in private mode throw when writing
  function safeLocalSet(key, value){
    try{ localStorage.setItem(key, value); return true; }catch(err){ console.error('localStorage.setItem failed', err); return false; }
  }
  function safeSessionSet(key, value){
    try{ sessionStorage.setItem(key, value); return true; }catch(err){ console.error('sessionStorage.setItem failed', err); return false; }
  }

  // register page
  const regForm = $('resident-register-form');
  if(regForm){
    regForm.addEventListener('submit', e=>{
      e.preventDefault();
      const name = $('res-name').value.trim();
      const email = $('res-email').value.trim().toLowerCase();
      const pwd = $('res-password').value;
      if(findByEmail(email)){ alert('Email sudah terdaftar. Silakan login.'); location.href='resident-login.html'; return; }
      const residents = loadResidents();
      const r = { id: genId(), name, email, password: pwd, joinedAt: new Date().toISOString() };
      residents.push(r);
      if(!safeLocalSet(resKey, JSON.stringify(residents))){
        alert('Penyimpanan data pengguna gagal — browser Anda mungkin memblokir localStorage (mode privat). Coba nonaktifkan mode privat lalu coba lagi.');
        return;
      }
      // auto login
      const sess = JSON.stringify({id:r.id, name:r.name, email:r.email, token:btoa(r.id+':'+Date.now())});
      if(!safeSessionSet('bs_resident', sess)){
        alert('Pendaftaran berhasil, tetapi browser Anda memblokir sessionStorage sehingga login otomatis gagal. Silakan login secara manual atau izinkan penyimpanan sesi.');
        location.href = 'resident-login.html';
        return;
      }
      alert('Pendaftaran berhasil. Anda langsung masuk.');
      location.href = 'index.html#iuran';
    });
  }

  // login page
  const loginForm = $('resident-login-form');
  if(loginForm){
    loginForm.addEventListener('submit', e=>{
      e.preventDefault();
      const email = $('res-email').value.trim().toLowerCase();
      const pwd = $('res-password').value;
      const r = findByEmail(email);
      if(!r || r.password !== pwd){ alert('Login gagal. Periksa email & password.'); return; }
      const sess = JSON.stringify({id:r.id, name:r.name, email:r.email, token:btoa(r.id+':'+Date.now())});
      if(!safeSessionSet('bs_resident', sess)){
        alert('Login gagal karena browser memblokir sessionStorage (kemungkinan Private/Incognito). Nonaktifkan mode tersebut atau izinkan penyimpanan untuk melanjutkan.');
        return;
      }
      alert('Login berhasil.');
      location.href = 'index.html#iuran';
    });

    // forgot password link (in login page)
    const forgot = $('res-forgot');
    if(forgot){
      forgot.addEventListener('click', e=>{
        e.preventDefault();
        const email = prompt('Masukkan email akun Anda untuk mengatur ulang kata sandi:');
        if(!email) return;
        const em = email.trim().toLowerCase();
        const user = findByEmail(em);
        if(!user){ alert('Akun dengan email tersebut tidak ditemukan.'); return; }
        const newPwd = prompt('Masukkan kata sandi baru untuk ' + em + ' (min 4 karakter):');
        if(!newPwd || newPwd.length < 4){ alert('Kata sandi tidak valid. Minimal 4 karakter.'); return; }
        // update password safely
        const residents = loadResidents();
        const idx = residents.findIndex(x=>x.email.toLowerCase()===em);
        if(idx === -1){ alert('Akun tidak ditemukan saat mencoba memperbarui.'); return; }
        residents[idx].password = newPwd;
        if(!safeLocalSet(resKey, JSON.stringify(residents))){
          alert('Gagal menyimpan kata sandi baru — browser mungkin memblokir penyimpanan. Coba nonaktifkan mode privat dan coba lagi.');
          return;
        }
        alert('Kata sandi berhasil diperbarui. Silakan login dengan kata sandi baru.');
      });
    }
  }

})();