(function () {
    function loadHlsLibrary(callback) {
        if (window.Hls) {
            callback();
            return;
        }
        var existing = document.querySelector("script[data-hls-loader]");
        if (existing) {
            existing.addEventListener("load", callback, { once: true });
            return;
        }
        var script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/hls.js@1.6.15/dist/hls.min.js";
        script.async = true;
        script.setAttribute("data-hls-loader", "true");
        script.addEventListener("load", callback, { once: true });
        document.head.appendChild(script);
    }

    function attachHls(video, source, startPlayback) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            startPlayback();
            return;
        }

        loadHlsLibrary(function () {
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    startPlayback();
                });
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy();
                        video.src = source;
                        startPlayback();
                    }
                });
                video._hlsInstance = hls;
            } else {
                video.src = source;
                startPlayback();
            }
        });
    }

    window.setupPlayer = function (settings) {
        var video = document.getElementById(settings.videoId);
        var overlay = document.getElementById(settings.overlayId);
        var source = settings.source;
        var started = false;

        if (!video || !source) {
            return;
        }

        function startPlayback() {
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {});
            }
        }

        function start() {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
            if (started) {
                startPlayback();
                return;
            }
            started = true;
            attachHls(video, source, startPlayback);
        }

        if (overlay) {
            overlay.addEventListener("click", start);
        }
        video.addEventListener("click", function () {
            if (!started) {
                start();
            }
        });
        video.addEventListener("play", function () {
            if (overlay) {
                overlay.classList.add("is-hidden");
            }
        });
    };
}());
