/* =========================================================
   IMPERIAL URBANISMO — interações das páginas de empreendimento
   Vanilla JS, sem dependências.
   ========================================================= */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     NAV — estado ao rolar + menu mobile
     --------------------------------------------------------- */
  var nav = $('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var burger = $('.nav__burger', nav);
    if (burger) {
      burger.addEventListener('click', function () { nav.classList.toggle('is-open'); });
      $$('.nav__links a', nav).forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('is-open'); });
      });
    }
  }

  /* ---------------------------------------------------------
     REVEAL — entrada escalonada ao entrar na viewport
     --------------------------------------------------------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal').forEach(function (el, i) {
    /* os do hero já entram por animação CSS no carregamento — observar
       aqui só reintroduziria a espera pela rolagem */
    if (el.closest('.hero, .hhero')) return;

    var group = el.closest('[data-stagger]');
    if (group) {
      var sibs = $$('.reveal', group);
      el.style.setProperty('--d', (sibs.indexOf(el) * 0.08) + 's');
    }
    revealIO.observe(el);
  });

  /* ---------------------------------------------------------
     ANDAMENTO DA OBRA — anéis + contagem + total
     --------------------------------------------------------- */
  var CIRC = 2 * Math.PI * 54; // r = 54

  function fmt(v) {
    return v === 100 ? '100' : v.toFixed(2).replace('.', ',');
  }

  function buildRings(mes) {
    var host = $('#rings');
    if (!host) return;
    host.innerHTML = '';
    mes.etapas.forEach(function (et, i) {
      var d = document.createElement('div');
      d.className = 'ring reveal';
      d.style.setProperty('--d', (i * 0.07) + 's');
      d.innerHTML =
        '<div class="ring__vis">' +
          '<svg viewBox="0 0 124 124" aria-hidden="true">' +
            '<circle class="ring__track" cx="62" cy="62" r="54"></circle>' +
            '<circle class="ring__bar" cx="62" cy="62" r="54"></circle>' +
          '</svg>' +
          '<div class="ring__num" data-val="' + et.v + '">0<sup>%</sup></div>' +
        '</div>' +
        '<p class="ring__label">' + et.n + '</p>';
      host.appendChild(d);
      revealIO.observe(d);
    });
    animateRings();
  }

  function animateRings() {
    $$('.ring').forEach(function (ring) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var bar = $('.ring__bar', ring);
          var num = $('.ring__num', ring);
          var target = parseFloat(num.getAttribute('data-val'));

          if (reduce) {
            bar.style.strokeDashoffset = CIRC * (1 - target / 100);
            num.innerHTML = fmt(target) + '<sup>%</sup>';
          } else {
            requestAnimationFrame(function () {
              bar.style.strokeDashoffset = CIRC * (1 - target / 100);
            });
            countUp(num, target, 1400);
          }
          io.unobserve(ring);
        });
      }, { threshold: 0.4 });
      io.observe(ring);
    });
  }

  function countUp(el, target, dur) {
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.innerHTML = fmt(target * eased) + '<sup>%</sup>';
      if (p < 1) requestAnimationFrame(step);
      else el.innerHTML = fmt(target) + '<sup>%</sup>';
    }
    requestAnimationFrame(step);
  }

  function paintTotal(mes) {
    var numEl = $('#totalNum'), barEl = $('#totalBar'), capEl = $('#totalCap');
    if (!numEl) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (reduce) {
          numEl.innerHTML = fmt(mes.total) + '<sup>%</sup>';
        } else {
          countUp(numEl, mes.total, 1600);
        }
        barEl.style.width = mes.total + '%';
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    io.observe(numEl.closest('.total'));
    if (capEl) capEl.textContent = mes.cap;
  }

  if (window.OBRA && window.OBRA.meses && window.OBRA.meses.length) {
    var sel = $('#medicao');
    if (sel) {
      window.OBRA.meses.forEach(function (m, i) {
        var o = document.createElement('option');
        o.value = i; o.textContent = m.label;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        var m = window.OBRA.meses[this.value];
        buildRings(m);
        var numEl = $('#totalNum'), barEl = $('#totalBar'), capEl = $('#totalCap');
        countUp(numEl, m.total, 900);
        barEl.style.width = m.total + '%';
        if (capEl) capEl.textContent = m.cap;
      });
    }
    buildRings(window.OBRA.meses[0]);
    paintTotal(window.OBRA.meses[0]);
  }

  /* ---------------------------------------------------------
     VÍDEO — fachada leve: o iframe do YouTube só entra no clique,
     então a página não carrega o player inteiro à toa.
     --------------------------------------------------------- */
  $$('[data-video]').forEach(function (el) {
    el.addEventListener('click', function () {
      var id = el.getAttribute('data-video');
      if (!id || el.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      f.title = el.getAttribute('data-title') || 'Vídeo institucional';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      el.innerHTML = '';
      el.appendChild(f);
      el.style.cursor = 'default';
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
  });

  /* ---------------------------------------------------------
     CONTADORES da seção Nossa Trajetória
     Lê o próprio texto para descobrir prefixo ("+") e zero à
     esquerda ("02"), então o formato final é preservado.
     --------------------------------------------------------- */
  $$('.stat__n').forEach(function (el, i) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;

    var raw = node.nodeValue.trim();          // "+22", "02", "+900"
    var m = raw.match(/^([^\d]*)(\d+)$/);
    if (!m) return;

    var prefix = m[1];
    var digits = m[2];
    var target = parseInt(digits, 10);
    /* só preenche com zero se o original tinha zero à esquerda */
    var pad = digits.charAt(0) === '0' ? digits.length : 0;

    function write(v) {
      var s = String(v);
      while (s.length < pad) s = '0' + s;
      node.nodeValue = prefix + s + ' ';
    }

    /* Não zera no load: se o observer ou o rAF nunca rodarem (aba em
       segundo plano, JS bloqueado), o número correto continua na tela.
       O zero só entra no instante em que a animação vai começar. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);

        if (reduce) { write(target); return; }
        write(0);

        var dur = 1500, delay = i * 90, t0 = null;
        setTimeout(function () {
          requestAnimationFrame(function step(ts) {
            if (!t0) t0 = ts;
            var p = Math.min((ts - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            write(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(step);
            else write(target);
          });
        }, delay);
      });
    }, { threshold: 0.45 });

    io.observe(el.closest('.stat') || el);
  });

  /* ---------------------------------------------------------
     BARRAS [data-fill] — preenchem ao entrar na viewport
     (etapas de obra da Home)
     --------------------------------------------------------- */
  $$('[data-fill]').forEach(function (bar) {
    var pct = parseFloat(bar.getAttribute('data-fill')) || 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        bar.style.width = pct + '%';
        io.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    /* a própria barra nasce com width:0 — área zero nunca atinge o
       threshold. Observa a trilha (o pai), que tem largura real. */
    io.observe(bar.closest('.etapa') || bar.parentElement || bar);
  });

  /* ---------------------------------------------------------
     PROCESSO IMPERIAL (História) — trilho que liga as elipses
     numeradas e se preenche conforme a página rola.
     --------------------------------------------------------- */
  (function () {
    var card = $('.hs-card');
    if (!card) return;
    var trilho = $('.hs-trilho', card);
    var fill   = trilho && $('i', trilho);
    var etapas = $$('.hs-etapa', card);
    if (!trilho || !fill || etapas.length < 2) return;

    var topo = 0, altura = 0, centros = [];

    /* mede os centros das elipses em relação ao card */
    function medir() {
      var cb = card.getBoundingClientRect();
      centros = etapas.map(function (e) {
        var n = $('.hs-etapa__n', e).getBoundingClientRect();
        return n.top - cb.top + n.height / 2;
      });
      var primeiraN = $('.hs-etapa__n', etapas[0]).getBoundingClientRect();
      topo   = centros[0];
      altura = centros[centros.length - 1] - centros[0];
      trilho.style.top    = topo + 'px';
      trilho.style.height = altura + 'px';
      trilho.style.left   = (primeiraN.left - cb.left + primeiraN.width / 2) + 'px';
    }

    function pintar() {
      if (!altura) return;
      var cb = card.getBoundingClientRect();
      /* a linha de referência fica a 62% da altura da janela: o trecho
         acumula à medida que cada elipse cruza esse ponto */
      var ref = window.innerHeight * 0.62;
      var avanco = ref - (cb.top + topo);
      var h = Math.max(0, Math.min(avanco, altura));
      fill.style.height = h + 'px';
      for (var i = 0; i < etapas.length; i++) {
        etapas[i].classList.toggle('is-on', cb.top + centros[i] <= ref);
      }
    }

    /* sem animação: mostra o trilho inteiro preenchido */
    if (reduce) {
      medir();
      fill.style.transition = 'none';
      fill.style.height = altura + 'px';
      etapas.forEach(function (e) { e.classList.add('is-on'); });
      return;
    }

    var agendado = false;
    function aoRolar() {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(function () { agendado = false; pintar(); });
    }

    medir(); pintar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', function () { medir(); pintar(); });
    window.addEventListener('load', function () { medir(); pintar(); });
    if (window.ResizeObserver) new ResizeObserver(function () { medir(); pintar(); }).observe(card);
  })();

  /* ---------------------------------------------------------
     NEWSLETTER da Home — demo (não envia)
     --------------------------------------------------------- */
  $$('.hnews__form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.closest('.hnews').classList.add('is-sent');
    });
  });

  /* ---------------------------------------------------------
     CARROSSEL — filtros, setas, arrastar, progresso
     --------------------------------------------------------- */
  $$('.carousel').forEach(function (car) {
    var vp     = $('.carousel__viewport', car);
    var prev   = $('[data-prev]', car);
    var next   = $('[data-next]', car);
    var prog   = $('.progressbar i', car);
    var count  = $('.carousel__count', car);
    var tabsEl = car.previousElementSibling &&
                 car.previousElementSibling.classList.contains('tabs')
                 ? car.previousElementSibling : null;

    function visible() {
      return $$('.slide', vp).filter(function (s) { return s.style.display !== 'none'; });
    }
    function step() {
      var s = visible()[0];
      return s ? s.getBoundingClientRect().width + 18 : 400;
    }
    function update() {
      var max = vp.scrollWidth - vp.clientWidth;
      var p = max > 4 ? vp.scrollLeft / max : 1;
      if (prog) prog.style.width = Math.max(6, p * 100) + '%';
      if (prev) prev.disabled = vp.scrollLeft < 8;
      if (next) next.disabled = vp.scrollLeft >= max - 8;
      if (count) {
        var n = visible().length;
        var idx = Math.min(n, Math.round(vp.scrollLeft / step()) + 1);
        count.textContent = String(idx).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      }
    }

    if (prev) prev.addEventListener('click', function () { vp.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { vp.scrollBy({ left:  step(), behavior: 'smooth' }); });
    vp.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    /* as imagens são lazy: remede depois que o layout assenta, senão
       as setas podem nascer desabilitadas por scrollWidth ainda zerado */
    window.addEventListener('load', update);
    if (window.ResizeObserver) new ResizeObserver(update).observe(vp);
    /* o script é defer: se 'load' já passou, o listener acima nunca
       dispara e as setas ficam com o estado do HTML. Mede uma vez agora. */
    update();

    /* arrastar com o mouse */
    var down = false, startX = 0, startL = 0, moved = 0;
    vp.addEventListener('mousedown', function (e) {
      down = true; moved = 0;
      startX = e.pageX; startL = vp.scrollLeft;
      vp.classList.add('is-dragging');
    });
    window.addEventListener('mouseup', function () {
      if (!down) return;
      down = false; vp.classList.remove('is-dragging');
    });
    vp.addEventListener('mousemove', function (e) {
      if (!down) return;
      e.preventDefault();
      var dx = e.pageX - startX;
      moved = Math.abs(dx);
      vp.scrollLeft = startL - dx;
    });
    vp.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    /* filtros */
    if (tabsEl) {
      $$('.tab', tabsEl).forEach(function (tab) {
        tab.addEventListener('click', function () {
          $$('.tab', tabsEl).forEach(function (t) { t.classList.remove('is-active'); });
          tab.classList.add('is-active');
          var cat = tab.getAttribute('data-cat');
          $$('.slide', vp).forEach(function (s, i) {
            var on = cat === 'todos' || s.getAttribute('data-cat') === cat;
            s.style.display = on ? '' : 'none';
            if (on) { s.style.animation = 'none'; void s.offsetWidth; s.style.animation = ''; s.style.animationDelay = (i % 8 * 0.05) + 's'; }
          });
          vp.scrollTo({ left: 0, behavior: 'smooth' });
          setTimeout(update, 60);
        });
      });
    }
    update();
  });

  /* ---------------------------------------------------------
     LIGHTBOX
     --------------------------------------------------------- */
  var lb = $('#lightbox');
  if (lb) {
    var lbImg = $('.lightbox__img', lb);
    var lbCap = $('.lightbox__cap', lb);
    var pool = [], cur = 0;

    function openLb(slide) {
      pool = $$('.slide').filter(function (s) { return s.style.display !== 'none' && s.closest('.carousel') === slide.closest('.carousel'); });
      cur = pool.indexOf(slide);
      render();
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function render() {
      var s = pool[cur];
      if (!s) return;
      var img = $('img', s);
      lbImg.src = img.getAttribute('data-full') || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = (cur + 1) + ' / ' + pool.length + '  ·  ' + img.alt;
      lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
    }
    function closeLb() { lb.classList.remove('is-open'); document.body.style.overflow = ''; }
    function go(d) { cur = (cur + d + pool.length) % pool.length; render(); }

    document.addEventListener('click', function (e) {
      var s = e.target.closest('.slide');
      /* slide--card é um card de conteúdo (Portfólio), não uma foto: sem lightbox */
      if (s && s.classList.contains('slide--card')) return;
      if (s && s.closest('.carousel')) { openLb(s); }
    });

    /* Galeria avulsa: um botão [data-galeria="#id"] abre o lightbox com os
       .slide de um contêiner oculto. Usado no card do Recanto dos Pássaros,
       que tem fotos mas não tem página própria. */
    $$('[data-galeria]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var cont = document.querySelector(btn.getAttribute('data-galeria'));
        if (!cont) return;
        var itens = $$('.slide', cont);
        if (!itens.length) return;
        pool = itens; cur = 0;
        render();
        lb.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    });
    $('.lightbox__close', lb).addEventListener('click', closeLb);
    $('.lightbox__prev',  lb).addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    $('.lightbox__next',  lb).addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
  }

  /* ---------------------------------------------------------
     FORMULÁRIO — demo (não envia)
     --------------------------------------------------------- */
  $$('.formcard form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var card = form.closest('.formcard');
      card.classList.add('is-sent');
      form.style.display = 'none';
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });
  $$('.field select').forEach(function (s) {
    var sync = function () { s.classList.toggle('has-value', !!s.value); };
    s.addEventListener('change', sync); sync();
  });

  /* O menu é o do site inteiro, não um índice de seções: `is-active`
     marca a PÁGINA atual e é definido no HTML. Não há scroll-spy —
     ele ficava trocando a pílula durante a rolagem, o que alargava o
     menu e cortava os itens mais longos. */
})();
