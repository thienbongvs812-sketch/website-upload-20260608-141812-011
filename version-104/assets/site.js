(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    ready(function () {
        var toggle = document.querySelector("[data-mobile-toggle]");
        var panel = document.querySelector("[data-mobile-panel]");
        if (toggle && panel) {
            toggle.addEventListener("click", function () {
                panel.classList.toggle("is-open");
            });
        }

        var hero = document.querySelector("[data-hero]");
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
            var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
            var active = 0;
            var show = function (index) {
                active = index % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle("is-active", slideIndex === active);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle("is-active", dotIndex === active);
                });
            };
            dots.forEach(function (dot, index) {
                dot.addEventListener("click", function () {
                    show(index);
                });
            });
            if (slides.length > 1) {
                setInterval(function () {
                    show(active + 1);
                }, 5600);
            }
        }

        var searchForms = Array.prototype.slice.call(document.querySelectorAll("[data-site-search]"));
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-title]"));
        var empty = document.querySelector("[data-empty-result]");
        var applySearch = function (query) {
            var keyword = query.trim().toLowerCase();
            var shown = 0;
            cards.forEach(function (card) {
                var text = [
                    card.getAttribute("data-title") || "",
                    card.getAttribute("data-year") || "",
                    card.getAttribute("data-region") || "",
                    card.getAttribute("data-genre") || ""
                ].join(" ").toLowerCase();
                var matched = !keyword || text.indexOf(keyword) !== -1;
                card.style.display = matched ? "" : "none";
                if (matched) {
                    shown += 1;
                }
            });
            if (empty) {
                document.body.classList.toggle("has-empty-result", shown === 0 && cards.length > 0);
            }
        };
        searchForms.forEach(function (form) {
            var input = form.querySelector("input[type='search']");
            if (input && cards.length > 0) {
                input.addEventListener("input", function () {
                    applySearch(input.value);
                });
            }
            form.addEventListener("submit", function (event) {
                if (cards.length > 0 && input) {
                    event.preventDefault();
                    applySearch(input.value);
                }
            });
        });

        var localInputs = Array.prototype.slice.call(document.querySelectorAll("[data-local-search]"));
        localInputs.forEach(function (input) {
            input.addEventListener("input", function () {
                applySearch(input.value);
            });
        });
    });
})();
