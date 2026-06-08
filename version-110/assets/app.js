(function () {
  "use strict";

  function selectAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("open");
    });
  }

  function initBackTop() {
    selectAll("[data-back-top]").forEach(function (button) {
      button.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function initImages() {
    selectAll("img").forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("image-error");
      });
    });
  }

  function initHero() {
    var slides = selectAll(".hero-slide");
    var dots = selectAll(".hero-dot");
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function start() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }

    show(0);
    start();
  }

  function createSearchPanel() {
    var existing = document.querySelector(".search-panel");
    if (existing) {
      return existing;
    }
    var panel = document.createElement("div");
    panel.className = "search-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "搜索结果");
    document.body.appendChild(panel);
    return panel;
  }

  function initSearch() {
    var data = window.MovieSearchData || [];
    var inputs = selectAll(".site-search-input");
    if (!inputs.length || !data.length) {
      return;
    }
    var panel = createSearchPanel();

    function render(query) {
      var value = String(query || "").trim().toLowerCase();
      if (!value) {
        panel.classList.remove("open");
        panel.innerHTML = "";
        return;
      }
      var results = data.filter(function (item) {
        var haystack = [item.title, item.year, item.region, item.type, item.genre, item.tags, item.oneLine].join(" ").toLowerCase();
        return haystack.indexOf(value) !== -1;
      }).slice(0, 14);
      if (!results.length) {
        panel.innerHTML = '<div class="search-empty">没有找到匹配影片</div>';
        panel.classList.add("open");
        return;
      }
      panel.innerHTML = results.map(function (item) {
        return [
          '<a class="search-result" href="./' + escapeHtml(item.file) + '">',
          '<img src="./' + escapeHtml(item.image) + '.jpg" alt="' + escapeHtml(item.title) + '">',
          '<div>',
          '<strong>' + escapeHtml(item.title) + '</strong>',
          '<span>' + escapeHtml(item.year) + ' · ' + escapeHtml(item.region) + ' · ' + escapeHtml(item.type) + '</span>',
          '<p>' + escapeHtml(item.oneLine) + '</p>',
          '</div>',
          '</a>'
        ].join("");
      }).join("");
      panel.classList.add("open");
    }

    inputs.forEach(function (input) {
      input.addEventListener("input", function () {
        render(input.value);
      });
      input.addEventListener("focus", function () {
        render(input.value);
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          panel.classList.remove("open");
          input.blur();
        }
      });
    });

    document.addEventListener("click", function (event) {
      var target = event.target;
      var insideInput = inputs.some(function (input) {
        return input === target;
      });
      if (!insideInput && !panel.contains(target)) {
        panel.classList.remove("open");
      }
    });
  }

  function initPlayers() {
    selectAll("[data-player]").forEach(function (player) {
      var video = player.querySelector("video");
      var playButton = player.querySelector("[data-play]");
      var source = player.getAttribute("data-source");
      var hlsInstance = null;
      var loaded = false;

      if (!video || !source) {
        return;
      }

      function loadVideo() {
        if (loaded) {
          return Promise.resolve();
        }
        loaded = true;
        player.classList.add("is-loading");

        if (window.Hls && window.Hls.isSupported()) {
          return new Promise(function (resolve) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              player.classList.remove("is-loading");
              resolve();
            });
            hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                hlsInstance.destroy();
                hlsInstance = null;
                video.src = source;
                player.classList.remove("is-loading");
                resolve();
              }
            });
          });
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
        } else {
          video.src = source;
        }
        player.classList.remove("is-loading");
        return Promise.resolve();
      }

      function startPlayback() {
        loadVideo().then(function () {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(function () {
              player.classList.remove("is-playing");
            });
          }
        });
      }

      if (playButton) {
        playButton.addEventListener("click", function () {
          startPlayback();
        });
      }

      video.addEventListener("play", function () {
        player.classList.add("is-playing");
      });

      video.addEventListener("pause", function () {
        if (video.currentTime === 0 || video.ended) {
          player.classList.remove("is-playing");
        }
      });

      video.addEventListener("ended", function () {
        player.classList.remove("is-playing");
      });
    });

    selectAll("[data-scroll-player]").forEach(function (button) {
      button.addEventListener("click", function () {
        var player = document.querySelector("[data-player]");
        if (!player) {
          return;
        }
        player.scrollIntoView({ behavior: "smooth", block: "center" });
        var playButton = player.querySelector("[data-play]");
        if (playButton) {
          window.setTimeout(function () {
            playButton.click();
          }, 420);
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenu();
    initBackTop();
    initImages();
    initHero();
    initSearch();
    initPlayers();
  });
})();
