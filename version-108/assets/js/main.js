(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setupNavigation() {
        var toggle = document.querySelector(".nav-toggle");
        var mobileNav = document.querySelector(".mobile-nav");
        if (!toggle || !mobileNav) {
            return;
        }
        toggle.addEventListener("click", function () {
            var isOpen = mobileNav.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    function setupHero() {
        document.querySelectorAll("[data-hero-carousel]").forEach(function (carousel) {
            var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
            var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
            var prev = carousel.querySelector("[data-hero-prev]");
            var next = carousel.querySelector("[data-hero-next]");
            var index = slides.findIndex(function (slide) {
                return slide.classList.contains("is-active");
            });
            var timer = null;

            if (index < 0) {
                index = 0;
            }

            function show(nextIndex) {
                if (!slides.length) {
                    return;
                }
                index = (nextIndex + slides.length) % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle("is-active", slideIndex === index);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle("is-active", dotIndex === index);
                });
            }

            function start() {
                stop();
                timer = window.setInterval(function () {
                    show(index + 1);
                }, 5000);
            }

            function stop() {
                if (timer) {
                    window.clearInterval(timer);
                    timer = null;
                }
            }

            if (prev) {
                prev.addEventListener("click", function () {
                    show(index - 1);
                    start();
                });
            }
            if (next) {
                next.addEventListener("click", function () {
                    show(index + 1);
                    start();
                });
            }
            dots.forEach(function (dot, dotIndex) {
                dot.addEventListener("click", function () {
                    show(dotIndex);
                    start();
                });
            });

            carousel.addEventListener("mouseenter", stop);
            carousel.addEventListener("mouseleave", start);
            show(index);
            start();
        });
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function setupFilters() {
        document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
            var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));
            var search = scope.querySelector("[data-filter-search]");
            var category = scope.querySelector("[data-filter-category]");
            var year = scope.querySelector("[data-filter-year]");
            var region = scope.querySelector("[data-filter-region]");
            var reset = scope.querySelector("[data-filter-reset]");
            var count = scope.querySelector("[data-result-count]");

            function apply() {
                var searchValue = normalize(search && search.value);
                var categoryValue = normalize(category && category.value);
                var yearValue = normalize(year && year.value);
                var regionValue = normalize(region && region.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = normalize([
                        card.dataset.title,
                        card.dataset.region,
                        card.dataset.type,
                        card.dataset.year,
                        card.dataset.category,
                        card.dataset.genre,
                        card.dataset.tags
                    ].join(" "));
                    var matchesSearch = !searchValue || haystack.indexOf(searchValue) !== -1;
                    var matchesCategory = !categoryValue || normalize(card.dataset.category) === categoryValue;
                    var matchesYear = !yearValue || normalize(card.dataset.year) === yearValue;
                    var matchesRegion = !regionValue || normalize(card.dataset.region).indexOf(regionValue) !== -1;
                    var shouldShow = matchesSearch && matchesCategory && matchesYear && matchesRegion;

                    card.classList.toggle("is-hidden-by-filter", !shouldShow);
                    if (shouldShow) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = String(visible);
                }
            }

            [search, category, year, region].forEach(function (control) {
                if (!control) {
                    return;
                }
                control.addEventListener("input", apply);
                control.addEventListener("change", apply);
            });

            if (reset) {
                reset.addEventListener("click", function () {
                    [search, category, year, region].forEach(function (control) {
                        if (control) {
                            control.value = "";
                        }
                    });
                    apply();
                });
            }

            apply();
        });
    }

    ready(function () {
        setupNavigation();
        setupHero();
        setupFilters();
    });
}());
