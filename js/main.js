// js/main.js
(function(){
  const log = (...a)=>console.log('[nav]', ...a);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Normalize path to highlight active link
  function norm(p){ return ("/"+p).replace(/\/+/g,"/").replace(/\/$/,""); }

  document.addEventListener('DOMContentLoaded', ()=>{
    const here = norm(location.pathname);
    document.querySelectorAll('header nav a').forEach(a=>{
      const href = a.getAttribute('href'); if(!href) return;
      const target = norm(new URL(href, location.href).pathname);
      if (here === target) a.classList.add('is-active');
    });
  });

  function initSectionReveals(){
    const sections = Array.from(document.querySelectorAll('main.home-main > section'));
    if (!sections.length) return;

    if (prefersReducedMotion){
      sections.forEach(section => section.classList.add('is-revealed'));
      return;
    }

    sections.forEach((section, i) => {
      section.classList.add('reveal-section');
      section.style.setProperty('--reveal-delay', `${Math.min(i * 90, 280)}ms`);
      if (i === 0) section.classList.add('is-revealed');
    });

    if (!('IntersectionObserver' in window)){
      sections.forEach(section => section.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px'
    });

    sections.forEach(section => {
      if (!section.classList.contains('is-revealed')) io.observe(section);
    });
  }

  function initReducedMotionMedia(){
    if (!prefersReducedMotion) return;
    document.querySelectorAll('main.home-main video[autoplay]').forEach(video => {
      video.pause();
      video.removeAttribute('autoplay');
    });
  }

  function initVideoPlaybackRates(){
    document.querySelectorAll('video[data-playback-rate]').forEach(video => {
      const rate = Number(video.dataset.playbackRate);
      if (!Number.isFinite(rate) || rate <= 0) return;

      const applyRate = () => {
        video.playbackRate = rate;
        video.defaultPlaybackRate = rate;
      };

      applyRate();
      video.addEventListener('loadedmetadata', applyRate, { once: true });
    });
  }

  function initServiceAccordion(){
    const details = Array.from(document.querySelectorAll('.services-highlights .service-dropdown'));
    if (!details.length) return;

    details.forEach(item => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        details.forEach(other => {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  function initReviewNavigation(){
    const track = document.querySelector('.reviews-grid');
    if (!track) return;

    const buttons = document.querySelectorAll('.reviews-btn');
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = Number(btn.dataset.dir || 1);
        const card = track.querySelector('.review-tile');
        const step = card ? card.getBoundingClientRect().width + 20 : 360;
        track.scrollBy({ left: dir * step, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  let bound = false;

  function tryBind(){
    if (bound) return true;
    const header = document.querySelector('header');
    const menuBtn = document.querySelector('.menu-toggle');
    const nav = document.getElementById('mobile-menu') || document.querySelector('.site-nav');
    if (!header || !menuBtn || !nav) return false;

    // Set --header-h for mobile offset
    const root = document.documentElement;
    const setH = () => {
      const h = (header.offsetHeight || 72) + 'px';
      root.style.setProperty('--header-h', h);        // desktop + general
      root.style.setProperty('--header-h-mobile', h); // mobile should match actual header height
    };

    setH(); addEventListener('resize', setH, {passive:true}); addEventListener('orientationchange', setH);

    const lock = ()=>document.body.classList.add('no-scroll');
    const unlock = ()=>document.body.classList.remove('no-scroll');

    const toggle = (force)=>{
      const open = (typeof force==='boolean') ? force : !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);

      menuBtn.classList.toggle('is-open', open); // ✅ add this

      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      open ? lock() : unlock();
      setTimeout(setH, 50);
      log('menu', open ? 'opened' : 'closed');
    };


    menuBtn.addEventListener('click', ()=>toggle());
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>toggle(false)));
    document.addEventListener('keydown', e=>{ if(e.key==='Escape' && nav.classList.contains('is-open')) toggle(false); });
    document.addEventListener('click', e=>{
      if(!nav.classList.contains('is-open')) return;
      if(!nav.contains(e.target) && !menuBtn.contains(e.target)) toggle(false);
    });

    // Header shadow on scroll
    const onScroll = ()=>{ header.style.boxShadow = (scrollY>6) ? '0 10px 24px rgba(110,101,92,.06)' : 'none'; };
    onScroll(); addEventListener('scroll', onScroll, {passive:true});

    bound = true;
    log('bound listeners');
    return true;
  }

  // Bind now if possible
  if (!tryBind()){
    // Retry briefly (fast path)
    let tries = 0;
    const t = setInterval(()=>{
      if (tryBind() || ++tries > 12) clearInterval(t);
    }, 250);

    // And also observe DOM for late-injected header (robust path)
    const mo = new MutationObserver(() => { if (tryBind()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState !== 'loading') initSectionReveals();
  else document.addEventListener('DOMContentLoaded', initSectionReveals);

  if (document.readyState !== 'loading') initReducedMotionMedia();
  else document.addEventListener('DOMContentLoaded', initReducedMotionMedia);

  if (document.readyState !== 'loading') initVideoPlaybackRates();
  else document.addEventListener('DOMContentLoaded', initVideoPlaybackRates);

  if (document.readyState !== 'loading') initServiceAccordion();
  else document.addEventListener('DOMContentLoaded', initServiceAccordion);

  if (document.readyState !== 'loading') initReviewNavigation();
  else document.addEventListener('DOMContentLoaded', initReviewNavigation);

})();
