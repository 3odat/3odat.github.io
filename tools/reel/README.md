# AeroMind reel

`reel.html` draws the 21.5 second explainer video on a canvas as a pure function of time, so every frame is
exact. The text and numbers are written in `reel.html` (search for `7.6`, `1.00`, and the headline lines).

```bash
python3 -m http.server 8000 &
node tools/reel/capture.js wide frames-wide
node tools/reel/capture.js portrait frames-portrait

# site version (720p)
ffmpeg -framerate 30 -i frames-wide/f_%04d.jpg -vf scale=1280:720:flags=lanczos \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart -an assets/video/aeromind-reel.mp4
# 1080p and vertical (for LinkedIn and Instagram)
ffmpeg -framerate 30 -i frames-wide/f_%04d.jpg -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart -an reel-1080p.mp4
ffmpeg -framerate 30 -i frames-portrait/f_%04d.jpg -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart -an reel-vertical.mp4
```

The poster is frame 294 (9.8 s) of the wide render, saved as `assets/video/aeromind-reel-poster.jpg`.
To use real footage instead, replace `assets/video/aeromind-reel.mp4` and the poster, keeping the file names.
