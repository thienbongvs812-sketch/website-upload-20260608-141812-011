(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function setupMenu() {
        var button = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!button || !nav) {
            return;
        }
        button.addEventListener('click', function () {
            nav.classList.toggle('open');
        });
    }

    function setupHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        if (slides.length <= 1) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var index = parseInt(dot.getAttribute('data-hero-dot'), 10);
                show(index);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function textOf(card, name) {
        return (card.getAttribute(name) || '').toString().toLowerCase();
    }

    function setupFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll('[data-filter-target]'));
        panels.forEach(function (panel) {
            var targetId = panel.getAttribute('data-filter-target');
            var target = document.getElementById(targetId);
            if (!target) {
                return;
            }
            var input = panel.querySelector('[data-filter-input]');
            var yearSelect = panel.querySelector('[data-filter-year]');
            var typeSelect = panel.querySelector('[data-filter-type]');
            var sortSelect = panel.querySelector('[data-sort-select]');
            var count = panel.querySelector('[data-filter-count]');
            var cards = Array.prototype.slice.call(target.querySelectorAll('.movie-card'));

            function numberValue(card, name) {
                var value = parseFloat(card.getAttribute(name) || '0');
                return isNaN(value) ? 0 : value;
            }

            function apply() {
                var keyword = input ? input.value.trim().toLowerCase() : '';
                var year = yearSelect ? yearSelect.value : '';
                var type = typeSelect ? typeSelect.value : '';
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = [
                        textOf(card, 'data-title'),
                        textOf(card, 'data-region'),
                        textOf(card, 'data-type'),
                        textOf(card, 'data-tags')
                    ].join(' ');
                    var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                    var matchesYear = !year || card.getAttribute('data-year') === year;
                    var matchesType = !type || card.getAttribute('data-type') === type;
                    var matched = matchesKeyword && matchesYear && matchesType;
                    card.classList.toggle('is-hidden', !matched);
                    if (matched) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部影片';
                }
            }

            function sortCards() {
                var mode = sortSelect ? sortSelect.value : 'score_desc';
                cards.sort(function (a, b) {
                    if (mode === 'year_desc') {
                        return numberValue(b, 'data-year') - numberValue(a, 'data-year') || numberValue(b, 'data-score') - numberValue(a, 'data-score');
                    }
                    if (mode === 'title_asc') {
                        return textOf(a, 'data-title').localeCompare(textOf(b, 'data-title'), 'zh-Hans-CN');
                    }
                    return numberValue(b, 'data-score') - numberValue(a, 'data-score');
                });
                cards.forEach(function (card) {
                    target.appendChild(card);
                });
                apply();
            }

            [input, yearSelect, typeSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', apply);
                    control.addEventListener('change', apply);
                }
            });
            if (sortSelect) {
                sortSelect.addEventListener('change', sortCards);
            }
            sortCards();
        });
    }

    function setupImageFallbacks() {
        var images = Array.prototype.slice.call(document.querySelectorAll('img'));
        images.forEach(function (image) {
            image.addEventListener('error', function () {
                image.style.opacity = '0';
            }, { once: true });
        });
    }

    function setupPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
        players.forEach(function (player) {
            var video = player.querySelector('video[data-src]');
            var startButton = player.querySelector('.player-start');
            var status = player.querySelector('[data-player-status]');
            if (!video || !startButton) {
                return;
            }
            var source = video.getAttribute('data-src');

            function setStatus(message) {
                if (status) {
                    status.textContent = message;
                }
            }

            function initialize() {
                if (video.getAttribute('data-ready') === 'true') {
                    return;
                }
                if (!source) {
                    setStatus('当前影片暂未绑定播放源。');
                    return;
                }
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.setAttribute('data-ready', 'true');
                    setStatus('已使用浏览器原生 HLS 播放能力。');
                    return;
                }
                if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: false
                    });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    player._hls = hls;
                    video.setAttribute('data-ready', 'true');
                    setStatus('HLS 播放器已初始化。');
                    return;
                }
                setStatus('当前浏览器不支持 HLS，请使用 Safari 或允许加载 HLS.js 后播放。');
            }

            function play() {
                initialize();
                if (video.getAttribute('data-ready') === 'true') {
                    player.classList.add('is-playing');
                    var playPromise = video.play();
                    if (playPromise && typeof playPromise.catch === 'function') {
                        playPromise.catch(function () {
                            setStatus('浏览器阻止了自动播放，请再次点击视频控件播放。');
                        });
                    }
                }
            }

            startButton.addEventListener('click', play);
            video.addEventListener('click', function () {
                if (video.paused) {
                    play();
                } else {
                    video.pause();
                }
            });
        });
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupFilters();
        setupImageFallbacks();
        setupPlayers();
    });
}());
