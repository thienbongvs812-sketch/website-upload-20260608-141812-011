(function () {
  var headerSearchButtons = document.querySelectorAll(".search-open");
  var searchPanel = document.querySelector(".search-panel");
  var searchInput = document.getElementById("site-search-input");
  var searchResults = document.getElementById("site-search-results");
  var mobileToggle = document.querySelector(".mobile-toggle");
  var mobileMenu = document.getElementById("mobile-menu");

  headerSearchButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (!searchPanel) {
        return;
      }
      searchPanel.classList.toggle("is-open");
      searchPanel.setAttribute("aria-hidden", searchPanel.classList.contains("is-open") ? "false" : "true");
      if (searchPanel.classList.contains("is-open") && searchInput) {
        searchInput.focus();
      }
    });
  });

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", function () {
      var open = mobileMenu.classList.toggle("is-open");
      mobileToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function renderSearch(value) {
    if (!searchResults || !window.SiteSearchIndex) {
      return;
    }
    var query = value.trim().toLowerCase();
    if (!query) {
      searchResults.innerHTML = "";
      return;
    }
    var matched = window.SiteSearchIndex.filter(function (item) {
      return item.text.toLowerCase().indexOf(query) !== -1;
    }).slice(0, 10);
    searchResults.innerHTML = matched.map(function (item) {
      return '<a href="' + item.url + '"><strong>' + item.title + '</strong><span>' + item.meta + '</span></a>';
    }).join("");
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      renderSearch(searchInput.value);
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
  var prev = document.querySelector(".hero-prev");
  var next = document.querySelector(".hero-next");
  var current = 0;

  function setSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  if (prev) {
    prev.addEventListener("click", function () {
      setSlide(current - 1);
    });
  }

  if (next) {
    next.addEventListener("click", function () {
      setSlide(current + 1);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener("click", function () {
      setSlide(index);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      setSlide(current + 1);
    }, 5600);
  }

  var pageFilterInput = document.querySelector(".page-filter-input");
  var pageFilterType = document.querySelector(".page-filter-type");
  var pageFilterYear = document.querySelector(".page-filter-year");
  var filterCards = Array.prototype.slice.call(document.querySelectorAll(".filter-grid .movie-card"));

  function applyPageFilter() {
    var query = pageFilterInput ? pageFilterInput.value.trim().toLowerCase() : "";
    var type = pageFilterType ? pageFilterType.value : "";
    var year = pageFilterYear ? pageFilterYear.value : "";
    filterCards.forEach(function (card) {
      var text = (card.getAttribute("data-searchable") || "").toLowerCase();
      var cardType = card.getAttribute("data-type") || "";
      var cardYear = card.getAttribute("data-year") || "";
      var visible = (!query || text.indexOf(query) !== -1) && (!type || cardType.indexOf(type) !== -1) && (!year || cardYear === year);
      card.style.display = visible ? "" : "none";
    });
  }

  [pageFilterInput, pageFilterType, pageFilterYear].forEach(function (control) {
    if (control) {
      control.addEventListener("input", applyPageFilter);
      control.addEventListener("change", applyPageFilter);
    }
  });
})();
