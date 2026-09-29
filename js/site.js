// 手機版選單開關
(function () {
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'CLOSE' : 'MENU';
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'MENU';
    }
  });
})();

// 首頁主視覺輪播：4.5 秒換一張、自動循環；鍵盤聚焦在圓點時暫停；系統設定「減少動態」時不自動播放
(function () {
  var box = document.querySelector('.bh');
  if (!box) return;
  var slides = box.querySelectorAll('.bh-slides img');
  var dots = box.querySelectorAll('.bh-dots button');
  if (slides.length < 2) return;
  // 第 2 張以後等頁面載完再下載，不跟首屏產品照搶頻寬
  function loadRest() {
    for (var j = 0; j < slides.length; j++) {
      var ds = slides[j].getAttribute('data-src');
      if (ds) { slides[j].src = ds; slides[j].removeAttribute('data-src'); }
    }
  }
  if (document.readyState === 'complete') loadRest(); else window.addEventListener('load', loadRest);
  var cur = 0, timer = null;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(i) {
    loadRest();
    cur = (i + slides.length) % slides.length;
    for (var k = 0; k < slides.length; k++) {
      slides[k].classList.toggle('on', k === cur);
      dots[k].classList.toggle('on', k === cur);
      dots[k].setAttribute('aria-pressed', k === cur ? 'true' : 'false');
    }
  }
  function stop() { clearInterval(timer); timer = null; }
  function start() { if (!still && !timer) timer = setInterval(function () { go(cur + 1); }, 4500); }
  for (var d = 0; d < dots.length; d++) {
    dots[d].addEventListener('click', (function (i) { return function () { stop(); go(i); start(); }; })(d));
  }
  box.addEventListener('focusin', stop);
  box.addEventListener('focusout', start);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  start();
})();
