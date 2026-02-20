// auth.js - simple client-side auth demo (DO NOT use in production)
(function(){
  const form = document.getElementById('login-form');
  if(!form) return;

  // helpers: safe storage access (some mobile browsers in private mode throw on setItem)
  function safeSessionSet(key, value){
    try{
      sessionStorage.setItem(key, value);
      return true;
    }catch(err){
      console.error('sessionStorage.setItem failed', err);
      return false;
    }
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    // demo credentials
    if(user === 'admin' && pass === 'password123'){
      // create a simple session token
      const token = btoa(user+':'+Date.now());
      const ok = safeSessionSet('bs_token', token);
      if(!ok){
        alert('Browser Anda memblokir penyimpanan session (mungkin Private/Incognito). Nonaktifkan mode tersebut atau izinkan penyimpanan untuk login.');
        return;
      }
      location.href = 'admin.html';
    } else {
      alert('Login gagal: username atau password salah. Gunakan admin / password123 untuk demo.');
    }
  });
})();
