(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function playerScriptBase() {
        var scripts = document.querySelectorAll("script[src]");
        for (var i = scripts.length - 1; i >= 0; i -= 1) {
            var src = scripts[i].getAttribute("src") || "";
            if (src.indexOf("player.js") !== -1) {
                return new URL(".", scripts[i].src).href;
            }
        }
        return new URL("./", window.location.href).href;
    }

    var hlsPromise = null;

    function loadHls() {
        if (window.Hls) {
            return Promise.resolve(window.Hls);
        }
        if (!hlsPromise) {
            var moduleUrl = new URL("video-vendor-dru42stk.js", playerScriptBase()).href;
            hlsPromise = import(moduleUrl).then(function (module) {
                return module.H || module.default || null;
            }).catch(function () {
                return null;
            });
        }
        return hlsPromise;
    }

    function prepare(card, video, source) {
        if (card.dataset.prepared === "true") {
            return Promise.resolve();
        }
        card.dataset.prepared = "true";
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source;
            return Promise.resolve();
        }
        return loadHls().then(function (Hls) {
            if (Hls && Hls.isSupported()) {
                var hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        hls.recoverMediaError();
                    } else {
                        hls.destroy();
                    }
                });
                card._hls = hls;
            } else {
                video.src = source;
            }
        });
    }

    ready(function () {
        var cards = document.querySelectorAll("[data-video-src]");
        cards.forEach(function (card) {
            var video = card.querySelector("video");
            var button = card.querySelector("[data-player-start]");
            var source = card.getAttribute("data-video-src");
            if (!video || !source) {
                return;
            }
            var play = function () {
                prepare(card, video, source).then(function () {
                    var promise = video.play();
                    if (promise && promise.then) {
                        promise.then(function () {
                            card.classList.add("is-playing");
                        }).catch(function () {
                            card.classList.remove("is-playing");
                        });
                    } else {
                        card.classList.add("is-playing");
                    }
                });
            };
            if (button) {
                button.addEventListener("click", play);
            }
            video.addEventListener("click", function () {
                if (video.paused) {
                    play();
                }
            });
            video.addEventListener("play", function () {
                card.classList.add("is-playing");
            });
            video.addEventListener("pause", function () {
                card.classList.remove("is-playing");
            });
        });
    });
})();
