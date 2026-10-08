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
      if (ds) {
        var dss = slides[j].getAttribute('data-srcset');
        if (dss) { slides[j].srcset = dss; slides[j].removeAttribute('data-srcset'); }
        slides[j].src = ds; slides[j].removeAttribute('data-src');
      }
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

// 動態效果：捲動淡入（A）、OUT! 進場（B，樣式在 CSS）、數字跳動（E）
// 系統開「減少動態」或瀏覽器不支援時整段不啟動，內容維持靜態顯示
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var main = document.getElementById('main');
  if (!main) return;
  var targets = [];
  function add(el, delay) {
    if (!el || el.classList.contains('rv')) return;
    el.classList.add('rv');
    if (delay) el.style.setProperty('--rv-d', delay + 'ms');
    targets.push(el);
  }
  // 成排的卡片：同一排依序出現
  var groups = main.querySelectorAll('.problems, .panels, .sports, .pack4, .reviews, .scenes, .pair');
  for (var g = 0; g < groups.length; g++) {
    groups[g].setAttribute('data-rv-group', '');
    var kids = groups[g].children;
    for (var k = 0; k < kids.length; k++) add(kids[k], Math.min(k, 5) * 90);
  }
  // 其餘區塊：每個區塊的直接子層各自淡入（首屏的主視覺不處理）
  var secs = main.children;
  for (var s = 0; s < secs.length; s++) {
    var sec = secs[s];
    if (sec.classList.contains('bh') || sec.classList.contains('p-hero') || sec.classList.contains('crumb')) continue;
    if (sec.tagName !== 'SECTION') { add(sec); continue; }
    var ch = sec.children;
    for (var c = 0; c < ch.length; c++) if (!ch[c].hasAttribute('data-rv-group')) add(ch[c]);
  }
  if (!targets.length) return;
  document.documentElement.classList.add('js');

  function countUp(el) {
    var m = /^([\d.]+)(\D*)$/.exec(el.textContent.trim());
    if (!m) return;
    var end = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, unit = m[2], t0 = null, dur = 1400, done = false;
    function finish() { done = true; el.textContent = m[1] + unit; }
    function step(t) {
      if (done) return;
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      if (p < 1) { el.textContent = (end * e).toFixed(dec) + unit; requestAnimationFrame(step); } else finish();
    }
    requestAnimationFrame(step);
    // 保險：就算動畫被瀏覽器暫停，時間到也一定顯示正確數字
    setTimeout(finish, dur + 300);
  }
  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      var el = entries[i].target;
      el.classList.add('in');
      io.unobserve(el);
      var num = el.matches('.sports figure') ? el.querySelector('figcaption span') : null;
      if (num) countUp(num);
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  for (var t = 0; t < targets.length; t++) io.observe(targets[t]);
})();

// 頁面載完後，在背景依序把後面的照片先抓好（一次 2 張），捲到時就不用等
// 使用者開了省流量模式時不做
(function () {
  var c = navigator.connection;
  if (c && c.saveData) return;
  function run() {
    var list = Array.prototype.slice.call(document.querySelectorAll('img[loading="lazy"]'));
    var i = 0, active = 0;
    function next() {
      while (active < 2 && i < list.length) {
        var im = list[i++];
        if (im.complete && im.naturalWidth) continue;
        active++;
        var done = (function () { var called = false; return function () { if (called) return; called = true; active--; next(); }; })();
        im.addEventListener('load', done); im.addEventListener('error', done);
        setTimeout(done, 8000);
        im.loading = 'eager';
      }
    }
    next();
  }
  function later() { setTimeout(run, 1200); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
