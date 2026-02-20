// nav.js - toggle mobile menu
document.addEventListener('DOMContentLoaded', ()=>{
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if(!toggle || !navLinks) return;
  toggle.addEventListener('click', ()=>{
    navLinks.classList.toggle('open');
  });
  // register service worker
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/sw.js').catch(()=>{});
  }
  // detect if running as installed app (standalone)
  function isStandalone(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true || (document.referrer && document.referrer.startsWith('android-app://'));
  }
  // consider a device mobile when it has touch / coarse pointer or small screen
  function isMobileDevice(){
    try{
      return ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || window.innerWidth <= 900;
    }catch(e){ return window.innerWidth <= 900; }
  }

  if(isStandalone()){
    if(isMobileDevice()){
      document.body.classList.add('mobile-mode');
      if(window.innerWidth <= 900){ navLinks.classList.add('open'); }
    } else {
      // installed on desktop/laptop: keep desktop layout
      document.body.classList.remove('mobile-mode');
      navLinks.classList.remove('open');
    }
  }

  // keep in sync if display mode changes (some browsers support it)
  try{
    if(window.matchMedia) window.matchMedia('(display-mode: standalone)').addEventListener('change', e=>{
      if(e.matches && isMobileDevice()){ document.body.classList.add('mobile-mode'); navLinks.classList.add('open'); }
      else { document.body.classList.remove('mobile-mode'); navLinks.classList.remove('open'); }
    });
  }catch(e){}
});
