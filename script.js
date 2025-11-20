/* script.js — fixed slider + blobs + showreel modal
   Added: resume hero video after modal close and try-play on load.
*/

(() => {
  // --- SLIDER & NAV ---
  const slides = document.getElementById("slides");
  const dots = Array.from(document.querySelectorAll(".dot"));
  const prev = document.querySelector(".arrow-left");
  const next = document.querySelector(".arrow-right");
  const slideEls = Array.from(document.querySelectorAll(".slide"));
  const total = slideEls.length;

  let index = 0;

  function goTo(i) {
    if (!slides) return;
    if (i < 0) i = 0;
    if (i >= total) i = total - 1;

    index = i;
    slides.style.transform = `translateX(-${i * 100}vw)`;

    // update dots
    dots.forEach(d => d.classList.remove("active"));
    const active = document.querySelector(`.dot[data-slide="${i}"]`);
    if (active) active.classList.add("active");

    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === total - 1;
  }

  /* DOTS */
  dots.forEach(d => {
    d.addEventListener("click", () => {
      const s = Number(d.dataset.slide);
      if (!Number.isNaN(s)) goTo(s);
    });
  });

  /* ARROWS */
  if (prev) prev.addEventListener("click", () => goTo(index - 1));
  if (next) next.addEventListener("click", () => goTo(index + 1));

  /* KEYBOARD */
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
  });

  /* Prevent default page scroll while using slider (optional) */
  window.addEventListener("wheel", e => e.preventDefault(), { passive:false });
  window.addEventListener("touchmove", e => e.preventDefault(), { passive:false });

  goTo(0);

  // --- BLOBS PARALLAX ---
  const blobs = Array.from(document.querySelectorAll(".blob"));
  const mouse = { x:0, y:0 };
  const smooth = { x:0, y:0 };
  const ease = 0.12;
  const startTime = performance.now();

  window.addEventListener("mousemove", e => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  });

  function animate(t){
    const time = (t - startTime) / 1000;
    smooth.x += (mouse.x - smooth.x) * ease;
    smooth.y += (mouse.y - smooth.y) * ease;

    blobs.forEach((b,i)=>{
      const depth = (i+1)*18;
      const bobX = Math.sin(time*(0.8+i*0.1))*20;
      const bobY = Math.cos(time*(0.6+i*0.1))*20;
      const mx = smooth.x * depth;
      const my = smooth.y * depth;

      b.style.transform = `translate3d(${mx + bobX}px, ${my + bobY}px, 0)`;
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // --- Helper: hero resume / try-play on load ---
  function getHeroVideo() {
    return document.querySelector('.mock-video');
  }

  async function tryPlayHero() {
    const hero = getHeroVideo();
    if (!hero) return;
    try {
      // try to play; if autoplay is allowed (muted), this will succeed
      await hero.play();
      // ensure it's muted (should already be muted in markup)
      hero.muted = true;
    } catch (err) {
      // autoplay blocked — ignore silently; user can play manually
      // console.debug('Hero autoplay blocked:', err);
    }
  }

  // Try to play hero once on load (muted autoplay allowed in most browsers)
  document.addEventListener('DOMContentLoaded', () => {
    tryPlayHero();
  });

  // --- SHOWREEL: modal player (already added in HTML) ---
  (function showreel() {
    const videoGrid = document.getElementById('videoGrid');
    const modal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalCaption = document.getElementById('modalCaption');
    const modalClose = modal ? modal.querySelector('.modal-close') : null;

    if (!videoGrid || !modal || !modalVideo) return;

    function stopAllOtherVideos() {
      document.querySelectorAll('video').forEach(v=>{
        try {
          if (v !== modalVideo) { v.pause(); }
        } catch(e){}
      });
    }

    function resumeHeroAndInline() {
      // Resume hero video if it's present and paused
      const hero = getHeroVideo();
      if (hero) {
        try {
          hero.play().catch(()=>{/* may be blocked */});
        } catch(e){}
      }
      // Optionally resume other inline videos you want — currently none expected
      // document.querySelectorAll('.inline-video-to-resume').forEach(v=>v.play().catch(()=>{}));
    }

    function openModal(src, poster, title) {
      stopAllOtherVideos();
      modalVideo.pause();
      // remove any previous sources
      while (modalVideo.firstChild) modalVideo.removeChild(modalVideo.firstChild);
      const sourceEl = document.createElement('source');
      sourceEl.src = src;
      sourceEl.type = 'video/mp4';
      modalVideo.appendChild(sourceEl);
      if (poster) modalVideo.poster = poster;
      modalCaption.textContent = title || '';
      modal.setAttribute('aria-hidden', 'false');

      // small delay to allow CSS transition then play
      setTimeout(()=> {
        modalVideo.load();
        modalVideo.play().catch(()=>{ /* may be blocked but user clicked so should play */ });
      }, 90);

      if (modalClose) modalClose.focus();
    }

    function closeModal() {
      try {
        modalVideo.pause();
        while (modalVideo.firstChild) modalVideo.removeChild(modalVideo.firstChild);
        modalVideo.removeAttribute('src');
      } catch(e){}
      modal.setAttribute('aria-hidden', 'true');

      // resume hero (if available) — do after closing to restore original preview
      setTimeout(() => {
        resumeHeroAndInline();
      }, 120);
    }

    // click handler on cards
    videoGrid.addEventListener('click', e => {
      const card = e.target.closest('.video-card');
      if (!card) return;
      const src = card.dataset.src;
      const poster = card.dataset.poster || '';
      const title = card.querySelector('.video-title')?.textContent || '';
      if (src) openModal(src, poster, title);
    });

    // keyboard activation (Enter / Space)
    videoGrid.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.video-card') || e.target;
        if (card && card.classList.contains('video-card')) {
          e.preventDefault();
          const src = card.dataset.src;
          const poster = card.dataset.poster || '';
          const title = card.querySelector('.video-title')?.textContent || '';
          if (src) openModal(src, poster, title);
        }
      }
    });

    // close handlers
    if (modalClose) modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

  })();

})();
