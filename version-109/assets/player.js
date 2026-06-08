(function () {
  window.initializePlayer = function (config) {
    var video = document.getElementById(config.videoId);
    var button = document.getElementById(config.playButtonId);
    var source = config.source;
    var loaded = false;
    var hlsInstance = null;

    function attachSource(autoplay) {
      if (!video || loaded) {
        if (autoplay && video) {
          video.play().catch(function () {});
        }
        return;
      }
      loaded = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        if (autoplay) {
          video.play().catch(function () {});
        }
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          if (autoplay) {
            video.play().catch(function () {});
          }
        });
        return;
      }
      video.src = source;
      if (autoplay) {
        video.play().catch(function () {});
      }
    }

    function startPlayback() {
      if (button) {
        button.classList.add("is-hidden");
      }
      attachSource(true);
    }

    if (button) {
      button.addEventListener("click", startPlayback);
    }

    if (video) {
      video.addEventListener("play", function () {
        if (!loaded) {
          attachSource(false);
        }
        if (button) {
          button.classList.add("is-hidden");
        }
      });
      video.addEventListener("ended", function () {
        if (button) {
          button.classList.remove("is-hidden");
        }
      });
      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
          hlsInstance = null;
        }
      });
    }
  };
})();
