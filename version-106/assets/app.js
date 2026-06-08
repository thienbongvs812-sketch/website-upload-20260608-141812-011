(function () {
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function setupNavigation() {
    var header = one('[data-header]');
    var toggle = one('[data-mobile-toggle]');
    if (!header || !toggle) {
      return;
    }
    toggle.addEventListener('click', function () {
      header.classList.toggle('is-open');
    });
  }

  function setupHero() {
    var slider = one('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = all('.hero-slide', slider);
    var dots = all('.hero-dot', slider);
    var next = one('[data-hero-next]', slider);
    var prev = one('[data-hero-prev]', slider);
    if (slides.length === 0) {
      return;
    }
    var active = 0;
    var timer = null;

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    }

    function run(delta) {
      show(active + delta);
    }

    function restart() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        run(1);
      }, 5200);
    }

    if (next) {
      next.addEventListener('click', function () {
        run(1);
        restart();
      });
    }
    if (prev) {
      prev.addEventListener('click', function () {
        run(-1);
        restart();
      });
    }
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        restart();
      });
    });
    show(0);
    restart();
  }

  function setupFilters() {
    all('[data-filter-root]').forEach(function (root) {
      var text = one('[data-filter-text]', root);
      var type = one('[data-filter-type]', root);
      var region = one('[data-filter-region]', root);
      var year = one('[data-filter-year]', root);
      var button = one('[data-filter-submit]', root);
      var cards = all('.movie-card', root);
      var empty = one('[data-empty-result]', root);
      var count = one('[data-result-count]', root);
      var params = new URLSearchParams(window.location.search);
      var incoming = params.get('q');

      if (incoming && text) {
        text.value = incoming;
      }

      function match(card) {
        var query = normalize(text && text.value);
        var selectedType = normalize(type && type.value);
        var selectedRegion = normalize(region && region.value);
        var selectedYear = normalize(year && year.value);
        var lookup = normalize(card.getAttribute('data-lookup'));
        var cardType = normalize(card.getAttribute('data-type'));
        var cardRegion = normalize(card.getAttribute('data-region'));
        var cardYear = normalize(card.getAttribute('data-year'));
        var ok = true;
        if (query && lookup.indexOf(query) === -1) {
          ok = false;
        }
        if (selectedType && cardType !== selectedType) {
          ok = false;
        }
        if (selectedRegion && cardRegion !== selectedRegion) {
          ok = false;
        }
        if (selectedYear && cardYear !== selectedYear) {
          ok = false;
        }
        return ok;
      }

      function update() {
        var visible = 0;
        cards.forEach(function (card) {
          var ok = match(card);
          card.style.display = ok ? '' : 'none';
          if (ok) {
            visible += 1;
          }
        });
        if (empty) {
          empty.style.display = visible === 0 ? 'block' : 'none';
        }
        if (count) {
          count.textContent = '当前显示 ' + visible + ' 部影片';
        }
      }

      [text, type, region, year].forEach(function (field) {
        if (field) {
          field.addEventListener('input', update);
          field.addEventListener('change', update);
        }
      });
      if (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          update();
        });
      }
      update();
    });
  }

  function setupSearchForms() {
    all('[data-site-search]').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        var input = one('input[name="q"]', form);
        if (!input || !input.value.trim()) {
          return;
        }
        event.preventDefault();
        var action = form.getAttribute('action') || 'search.html';
        window.location.href = action + '?q=' + encodeURIComponent(input.value.trim());
      });
    });
  }

  function setupPlayers() {
    all('[data-player]').forEach(function (player) {
      var video = one('video', player);
      var layer = one('[data-play-layer]', player);
      var button = one('[data-play]', player);
      var status = one('[data-player-status]', player);
      var stream = player.getAttribute('data-stream');
      var started = false;
      var hls = null;

      function setStatus(text) {
        if (status) {
          status.textContent = text;
        }
      }

      function start() {
        if (!video || !stream) {
          setStatus('播放线路准备中，请稍后重试。');
          return;
        }
        if (started) {
          video.play().catch(function () {});
          return;
        }
        started = true;
        if (layer) {
          layer.classList.add('is-hidden');
        }
        setStatus('正在连接播放线路…');
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = stream;
          video.play().then(function () {
            setStatus('正在播放');
          }).catch(function () {
            setStatus('点击视频控件继续播放。');
          });
          return;
        }
        if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90
          });
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().then(function () {
              setStatus('正在播放');
            }).catch(function () {
              setStatus('点击视频控件继续播放。');
            });
          });
          hls.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus('播放失败，请刷新后重试。');
            }
          });
          return;
        }
        video.src = stream;
        video.play().then(function () {
          setStatus('正在播放');
        }).catch(function () {
          setStatus('播放失败，请刷新后重试。');
        });
      }

      if (button) {
        button.addEventListener('click', start);
      }
      if (layer) {
        layer.addEventListener('click', start);
      }
      if (video) {
        video.addEventListener('play', function () {
          if (layer) {
            layer.classList.add('is-hidden');
          }
        });
      }
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupNavigation();
    setupHero();
    setupFilters();
    setupSearchForms();
    setupPlayers();
  });
})();
