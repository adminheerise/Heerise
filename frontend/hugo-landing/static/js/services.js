// frontend/hugo-landing/static/js/services.js
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {

    // ── Success stories horizontal carousel ───────────────────
    var track = document.getElementById('svc-stories-track');
    var prevBtn = document.getElementById('svc-stories-prev');
    var nextBtn = document.getElementById('svc-stories-next');
    if (!track || !prevBtn || !nextBtn) return;

    function getStep() {
      var firstSlide = track.querySelector('.svc-story-slide');
      if (!firstSlide) return track.clientWidth;
      return firstSlide.getBoundingClientRect().width + 20;
    }

    function updateNavState() {
      var maxScrollLeft = track.scrollWidth - track.clientWidth;
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= (maxScrollLeft - 2);
    }

    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: getStep(), behavior: 'smooth' });
    });

    track.addEventListener('scroll', updateNavState);
    window.addEventListener('resize', updateNavState);
    updateNavState();

  });
})();
