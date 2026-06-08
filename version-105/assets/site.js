(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    ready(function () {
        setupMobileMenu();
        setupHeroSlider();
        setupCategoryFilters();
        setupPlayers();
        setupSearchPage();
    });

    function setupMobileMenu() {
        var button = document.querySelector('.mobile-menu-button');
        var menu = document.querySelector('.mobile-nav');

        if (!button || !menu) {
            return;
        }

        button.addEventListener('click', function () {
            var expanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', String(!expanded));
            menu.classList.toggle('is-open', !expanded);
        });
    }

    function setupHeroSlider() {
        var slider = document.querySelector('[data-hero-slider]');

        if (!slider) {
            return;
        }

        var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
        var prev = slider.querySelector('[data-hero-prev]');
        var next = slider.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        if (slides.length <= 1) {
            return;
        }

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
                clearInterval(timer);
            }
            timer = setInterval(function () {
                show(current + 1);
            }, 5000);
        }

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

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                restart();
            });
        });

        restart();
    }

    function setupCategoryFilters() {
        var panel = document.querySelector('[data-filter-panel]');
        var grid = document.querySelector('[data-card-grid]');

        if (!panel || !grid) {
            return;
        }

        var search = panel.querySelector('.filter-search');
        var year = panel.querySelector('.filter-year');
        var type = panel.querySelector('.filter-type');
        var sort = panel.querySelector('.filter-sort');
        var empty = document.querySelector('.filter-empty');
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.movie-card'));

        function normalize(value) {
            return String(value || '').trim().toLowerCase();
        }

        function applyFilters() {
            var keyword = normalize(search && search.value);
            var selectedYear = year ? year.value : '';
            var selectedType = type ? type.value : '';
            var visibleCount = 0;

            cards.forEach(function (card) {
                var text = normalize(card.textContent + ' ' + card.dataset.title + ' ' + card.dataset.region + ' ' + card.dataset.type);
                var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
                var matchesYear = !selectedYear || card.dataset.year === selectedYear;
                var matchesType = !selectedType || card.dataset.type === selectedType;
                var visible = matchesKeyword && matchesYear && matchesType;

                card.hidden = !visible;
                if (visible) {
                    visibleCount += 1;
                }
            });

            if (empty) {
                empty.hidden = visibleCount !== 0;
            }
        }

        function applySort() {
            var mode = sort ? sort.value : 'year-desc';
            var sorted = cards.slice().sort(function (a, b) {
                if (mode === 'rating-desc') {
                    return Number(b.dataset.rating) - Number(a.dataset.rating);
                }

                if (mode === 'heat-desc') {
                    return Number(b.dataset.heat) - Number(a.dataset.heat);
                }

                if (mode === 'title-asc') {
                    return String(a.dataset.title).localeCompare(String(b.dataset.title), 'zh-Hans-CN');
                }

                return Number(b.dataset.year) - Number(a.dataset.year);
            });

            sorted.forEach(function (card) {
                grid.appendChild(card);
            });
        }

        [search, year, type].forEach(function (control) {
            if (control) {
                control.addEventListener('input', applyFilters);
                control.addEventListener('change', applyFilters);
            }
        });

        if (sort) {
            sort.addEventListener('change', function () {
                applySort();
                applyFilters();
            });
        }

        applySort();
        applyFilters();
    }

    function setupPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('.video-player'));

        players.forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('.play-toggle');
            var source = player.getAttribute('data-src') || (video && video.getAttribute('data-src'));
            var hlsInstance = null;

            if (!video || !source) {
                return;
            }

            function attachSource() {
                return new Promise(function (resolve) {
                    if (video.dataset.loaded === 'true') {
                        resolve();
                        return;
                    }

                    if (window.Hls && window.Hls.isSupported()) {
                        hlsInstance = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: false
                        });
                        hlsInstance.loadSource(source);
                        hlsInstance.attachMedia(video);
                        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                            resolve();
                        });
                        hlsInstance.on(window.Hls.Events.ERROR, function () {
                            resolve();
                        });
                    } else {
                        video.src = source;
                        video.addEventListener('loadedmetadata', function () {
                            resolve();
                        }, { once: true });
                        setTimeout(resolve, 300);
                    }

                    video.dataset.loaded = 'true';
                    player.classList.add('is-loaded');
                });
            }

            function playVideo() {
                attachSource().then(function () {
                    var promise = video.play();

                    if (promise && typeof promise.catch === 'function') {
                        promise.catch(function () {
                            video.controls = true;
                        });
                    }
                });
            }

            if (button) {
                button.addEventListener('click', playVideo);
            }

            video.addEventListener('click', function () {
                if (video.paused) {
                    playVideo();
                }
            });

            video.addEventListener('play', function () {
                player.classList.add('is-playing');
            });

            video.addEventListener('pause', function () {
                player.classList.remove('is-playing');
            });

            video.addEventListener('ended', function () {
                player.classList.remove('is-playing');
            });

            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    function setupSearchPage() {
        var results = document.querySelector('[data-search-results]');
        var title = document.querySelector('[data-search-title]');
        var form = document.querySelector('[data-search-form]');
        var data = window.MOVIE_SEARCH_DATA;

        if (!results || !Array.isArray(data)) {
            return;
        }

        var params = new URLSearchParams(window.location.search);
        var initialKeyword = params.get('q') || '';
        var input = form ? form.querySelector('input[name="q"]') : null;

        if (input) {
            input.value = initialKeyword;
        }

        function escapeHtml(value) {
            return String(value || '').replace(/[&<>"']/g, function (character) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;'
                }[character];
            });
        }

        function cardTemplate(movie) {
            var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
                return '<span>' + escapeHtml(tag) + '</span>';
            }).join('');

            return [
                '<article class="movie-card">',
                '    <a class="poster-frame" href="' + escapeHtml(movie.url) + '" aria-label="观看' + escapeHtml(movie.title) + '">',
                '        <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '海报" loading="lazy" onerror="this.closest(\'.poster-frame\').classList.add(\'image-missing\'); this.remove();">',
                '        <span class="poster-glow"></span>',
                '        <span class="poster-year">' + escapeHtml(movie.year || '精选') + '</span>',
                '        <span class="poster-play">▶</span>',
                '    </a>',
                '    <div class="movie-card-body">',
                '        <div class="movie-meta-line">',
                '            <span>' + escapeHtml(movie.region) + '</span>',
                '            <span>' + escapeHtml(movie.type) + '</span>',
                '            <span>' + escapeHtml(movie.category) + '</span>',
                '        </div>',
                '        <h3><a href="' + escapeHtml(movie.url) + '">' + escapeHtml(movie.title) + '</a></h3>',
                '        <p>' + escapeHtml(movie.oneLine) + '</p>',
                '        <div class="movie-tags">' + tags + '</div>',
                '        <div class="movie-card-foot">',
                '            <a class="text-link" href="' + escapeHtml(movie.categoryUrl) + '">' + escapeHtml(movie.category) + '</a>',
                '            <span class="score">' + escapeHtml(movie.rating) + '</span>',
                '        </div>',
                '    </div>',
                '</article>'
            ].join('');
        }

        function runSearch(keyword) {
            var normalized = String(keyword || '').trim().toLowerCase();
            var matches = data.filter(function (movie) {
                if (!normalized) {
                    return true;
                }

                return String([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.genre,
                    movie.category,
                    (movie.tags || []).join(' '),
                    movie.oneLine
                ].join(' ')).toLowerCase().indexOf(normalized) !== -1;
            }).slice(0, 120);

            if (title) {
                title.textContent = normalized ? '搜索结果：' + keyword : '最新片库';
            }

            if (matches.length === 0) {
                results.innerHTML = '<div class="filter-empty">没有找到匹配的影片。</div>';
                return;
            }

            results.innerHTML = matches.map(cardTemplate).join('');
        }

        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                var keyword = input ? input.value : '';
                var url = new URL(window.location.href);

                if (keyword.trim()) {
                    url.searchParams.set('q', keyword.trim());
                } else {
                    url.searchParams.delete('q');
                }

                window.history.replaceState(null, '', url.toString());
                runSearch(keyword);
            });
        }

        runSearch(initialKeyword);
    }
})();
