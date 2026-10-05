// Point a <video> at a clip, smallest copy first. assets/media-formats.js
// (written by scripts/build_web_formats.py) lists the clips that have an AV1
// .webm smaller than their H.264 .mp4; for those the video gets both, AV1
// first, and a browser that cannot play AV1 falls through to the MP4. The
// project pages do the same in assets/render-project.js.
//
// Load after assets/media-formats.js. Used by the list pages, which fill
// their clips in only as they come near the screen.
(function () {
  const av1 = new Set((typeof MEDIA_FORMATS !== 'undefined' && MEDIA_FORMATS.av1) || []);
  window.setClipSource = function (v, src) {
    if (!src || v.dataset.loaded) return;
    v.dataset.loaded = '1';
    if (av1.has(src)) {
      const webm = document.createElement('source');
      webm.src = src.replace(/\.mp4$/i, '.webm');
      webm.type = 'video/webm; codecs="av01.0.05M.08, opus"';
      const mp4 = document.createElement('source');
      mp4.src = src;
      mp4.type = 'video/mp4';
      v.append(webm, mp4);
      v.load();
    } else {
      v.src = src;
    }
  };
})();
