(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        initMenu();
        initCarousels();
        initFilters();
        initPlayers();
    });

    function initMenu() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function initCarousels() {
        var carousels = document.querySelectorAll("[data-carousel]");
        carousels.forEach(function (carousel) {
            var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-carousel-slide]"));
            var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-carousel-dot]"));
            var prev = carousel.querySelector("[data-carousel-prev]");
            var next = carousel.querySelector("[data-carousel-next]");
            var current = 0;
            var timer;

            if (!slides.length) {
                return;
            }

            function show(index) {
                current = (index + slides.length) % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle("is-active", slideIndex === current);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle("is-active", dotIndex === current);
                });
            }

            function start() {
                window.clearInterval(timer);
                timer = window.setInterval(function () {
                    show(current + 1);
                }, 5200);
            }

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

            dots.forEach(function (dot) {
                dot.addEventListener("click", function () {
                    show(Number(dot.getAttribute("data-carousel-dot")) || 0);
                    start();
                });
            });

            show(0);
            start();
        });
    }

    function initFilters() {
        var panels = document.querySelectorAll("[data-filter-panel]");
        panels.forEach(function (panel) {
            var section = panel.parentElement;
            var cards = Array.prototype.slice.call(section.querySelectorAll(".searchable-card"));
            var search = panel.querySelector("[data-filter-search]");
            var selects = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-select]"));

            function normalize(value) {
                return String(value || "").toLowerCase().trim();
            }

            function update() {
                var query = normalize(search ? search.value : "");
                var selected = {};
                selects.forEach(function (select) {
                    selected[select.getAttribute("data-filter-select")] = normalize(select.value);
                });
                cards.forEach(function (card) {
                    var text = normalize([
                        card.getAttribute("data-title"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-type"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-genre"),
                        card.getAttribute("data-category")
                    ].join(" "));
                    var matchesQuery = !query || text.indexOf(query) !== -1;
                    var matchesSelects = selects.every(function (select) {
                        var key = select.getAttribute("data-filter-select");
                        var value = selected[key];
                        var source = normalize(card.getAttribute("data-" + key));
                        return !value || source.indexOf(value) !== -1;
                    });
                    card.hidden = !(matchesQuery && matchesSelects);
                });
            }

            if (search) {
                search.addEventListener("input", update);
            }
            selects.forEach(function (select) {
                select.addEventListener("change", update);
            });
        });
    }

    function initPlayers() {
        var players = document.querySelectorAll("[data-player]");
        players.forEach(function (player) {
            var video = player.querySelector("video");
            var overlay = player.querySelector(".player-overlay");
            if (!video || !overlay) {
                return;
            }
            var videoUrl = video.getAttribute("data-video-url");
            var hlsInstance = null;
            var attached = false;

            function attachVideo() {
                if (attached || !videoUrl) {
                    return;
                }
                attached = true;
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = videoUrl;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        maxBufferLength: 30,
                        enableWorker: true
                    });
                    hlsInstance.loadSource(videoUrl);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = videoUrl;
                }
            }

            function playVideo() {
                attachVideo();
                video.setAttribute("controls", "controls");
                overlay.classList.add("is-hidden");
                var action = video.play();
                if (action && typeof action.catch === "function") {
                    action.catch(function () {
                        overlay.classList.remove("is-hidden");
                    });
                }
            }

            overlay.addEventListener("click", playVideo);
            video.addEventListener("click", function () {
                if (video.paused) {
                    playVideo();
                }
            });
            video.addEventListener("ended", function () {
                overlay.classList.remove("is-hidden");
            });
            window.addEventListener("pagehide", function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                    hlsInstance = null;
                }
            });
        });
    }
})();
