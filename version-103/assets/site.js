(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var navPanel = document.querySelector('[data-nav-panel]');

    if (menuButton && navPanel) {
        menuButton.addEventListener('click', function () {
            navPanel.classList.toggle('is-open');
        });
    }

    var hero = document.querySelector('[data-hero-carousel]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
        var current = 0;

        function showSlide(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                showSlide(current + 1);
            }, 5200);
        }
    }

    document.querySelectorAll('[data-go-search]').forEach(function (form) {
        form.addEventListener('submit', function () {
            var input = form.querySelector('input[name="q"]');
            if (input) {
                input.value = input.value.trim();
            }
        });
    });

    document.querySelectorAll('[data-filter-root]').forEach(function (root) {
        var input = root.querySelector('[data-filter-input]');
        var cards = Array.prototype.slice.call(root.querySelectorAll('[data-card]'));
        var empty = root.querySelector('[data-empty]');
        var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-filter-button]'));
        var activeType = 'all';

        function normalize(value) {
            return String(value || '').toLowerCase().replace(/\s+/g, '');
        }

        function applyFilter() {
            var query = normalize(input ? input.value : '');
            var visible = 0;

            cards.forEach(function (card) {
                var text = normalize(card.getAttribute('data-search'));
                var type = normalize(card.getAttribute('data-type'));
                var matchText = !query || text.indexOf(query) !== -1;
                var matchType = activeType === 'all' || type.indexOf(activeType) !== -1;
                var show = matchText && matchType;

                card.style.display = show ? '' : 'none';
                if (show) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.classList.toggle('is-visible', visible === 0);
            }
        }

        if (input) {
            input.addEventListener('input', applyFilter);
            var params = new URLSearchParams(window.location.search);
            var query = params.get('q');
            if (query) {
                input.value = query;
            }
        }

        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                activeType = normalize(button.getAttribute('data-filter-button'));
                buttons.forEach(function (item) {
                    item.classList.toggle('is-active', item === button);
                });
                applyFilter();
            });
        });

        applyFilter();
    });
})();

function initMoviePlayer(streamUrl) {
    var frame = document.querySelector('[data-player-frame]');
    var video = document.querySelector('[data-video]');
    var button = document.querySelector('[data-play-button]');
    var prepared = false;
    var hlsInstance = null;

    if (!frame || !video || !button || !streamUrl) {
        return;
    }

    function prepare() {
        if (prepared) {
            return;
        }

        prepared = true;

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(video);
        } else {
            video.src = streamUrl;
        }
    }

    function play() {
        prepare();
        frame.classList.add('is-playing');
        var playPromise = video.play();

        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {
                frame.classList.remove('is-playing');
            });
        }
    }

    button.addEventListener('click', play);
    video.addEventListener('click', function () {
        if (video.paused) {
            play();
        }
    });
    video.addEventListener('play', function () {
        frame.classList.add('is-playing');
    });
    video.addEventListener('pause', function () {
        if (!video.ended) {
            frame.classList.remove('is-playing');
        }
    });
    window.addEventListener('beforeunload', function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
}
