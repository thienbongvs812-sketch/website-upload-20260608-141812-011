function initMobileMenu() {
  var toggle = document.querySelector('.mobile-toggle');
  var panel = document.querySelector('.mobile-panel');
  if (!toggle || !panel) {
    return;
  }
  toggle.addEventListener('click', function () {
    var isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
  });
}

function initHeroSlider() {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var prev = document.querySelector('.hero-prev');
  var next = document.querySelector('.hero-next');
  if (!slides.length) {
    return;
  }
  var current = 0;
  var timer = null;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  }

  function restart() {
    if (timer) {
      window.clearInterval(timer);
    }
    timer = window.setInterval(function () {
      show(current + 1);
    }, 5000);
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      show(index);
      restart();
    });
  });

  if (prev) {
    prev.addEventListener('click', function () {
      show(current - 1);
      restart();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      show(current + 1);
      restart();
    });
  }

  show(0);
  restart();
}

function initMoviePlayer(streamUrl) {
  var video = document.getElementById('moviePlayer');
  var mask = document.getElementById('moviePlayMask');
  if (!video || !streamUrl) {
    return;
  }
  var started = false;
  var hlsInstance = null;

  function attachStream() {
    if (started) {
      return;
    }
    started = true;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
    } else {
      video.src = streamUrl;
    }
  }

  function playVideo() {
    attachStream();
    if (mask) {
      mask.classList.add('is-hidden');
    }
    var playTask = video.play();
    if (playTask && typeof playTask.catch === 'function') {
      playTask.catch(function () {});
    }
  }

  if (mask) {
    mask.addEventListener('click', playVideo);
  }

  video.addEventListener('click', function () {
    if (!started || video.paused) {
      playVideo();
    }
  });

  video.addEventListener('play', function () {
    if (mask) {
      mask.classList.add('is-hidden');
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getQueryValue(name) {
  var params = new URLSearchParams(window.location.search);
  return params.get(name) || '';
}

function initSearchPage() {
  var panel = document.getElementById('searchPanel');
  var results = document.getElementById('searchResults');
  var status = document.getElementById('searchStatus');
  if (!panel || !results || typeof MOVIE_SEARCH_DATA === 'undefined') {
    return;
  }
  var keyword = document.getElementById('searchKeyword');
  var category = document.getElementById('searchCategory');
  var type = document.getElementById('searchType');
  var year = document.getElementById('searchYear');

  keyword.value = getQueryValue('q');

  function card(movie) {
    return [
      '<article class="movie-card standard">',
      '<a class="poster" href="' + escapeHtml(movie.url) + '" aria-label="观看 ' + escapeHtml(movie.title) + '">',
      '<img src="./' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" onerror="this.style.opacity='0';">',
      '<span class="poster-shade"></span>',
      '<span class="score">' + escapeHtml(movie.rating) + '</span>',
      '<span class="duration">' + escapeHtml(movie.duration) + '</span>',
      '</a>',
      '<div class="card-body">',
      '<h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
      '<p class="card-line">' + escapeHtml(movie.oneLine) + '</p>',
      '<div class="card-meta">',
      '<span>' + escapeHtml(movie.year) + '</span>',
      '<span>' + escapeHtml(movie.region) + '</span>',
      '<span>' + escapeHtml(movie.type) + '</span>',
      '</div>',
      '<p class="card-tags">' + escapeHtml(movie.tags.join(', ')) + '</p>',
      '</div>',
      '</article>'
    ].join('');
  }

  function render() {
    var q = keyword.value.trim().toLowerCase();
    var cat = category.value;
    var selectedType = type.value;
    var selectedYear = year.value.trim();
    var filtered = MOVIE_SEARCH_DATA.filter(function (movie) {
      var haystack = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.category, movie.tags.join(' '), movie.oneLine].join(' ').toLowerCase();
      var matchKeyword = !q || haystack.indexOf(q) !== -1;
      var matchCategory = !cat || movie.category === cat;
      var matchType = !selectedType || movie.type.indexOf(selectedType) !== -1;
      var matchYear = !selectedYear || movie.year.indexOf(selectedYear) !== -1;
      return matchKeyword && matchCategory && matchType && matchYear;
    });
    filtered = filtered.slice(0, 160);
    results.innerHTML = filtered.map(card).join('');
    status.textContent = filtered.length ? '已为你筛选出 ' + filtered.length + ' 部相关影片' : '未找到匹配影片';
  }

  panel.addEventListener('submit', function (event) {
    event.preventDefault();
    render();
  });

  [keyword, category, type, year].forEach(function (field) {
    field.addEventListener('input', render);
    field.addEventListener('change', render);
  });

  render();
}

document.addEventListener('DOMContentLoaded', function () {
  initMobileMenu();
  initHeroSlider();
  initSearchPage();
});
