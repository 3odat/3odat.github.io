# Ibrahim Odat · research site

Personal site of **Ibrahim Odat**, PhD candidate in AI security at Oakland University.

Live: https://3odat.github.io

## Stack

Plain HTML, CSS, and a small vanilla JS file. No build step and no dependencies. The only third-party
request is the GoatCounter visit counter (no cookies), loaded at the end of `index.html` and `cv.html`.
The statistics are at https://3odat.goatcounter.com.
Fonts (Newsreader, Inter, JetBrains Mono, all SIL Open Font License) are self-hosted in `assets/fonts/`.
Light and dark themes follow the system setting, with a manual toggle.

```
index.html            all content
cv.html               the CV as a web page, and the source of the PDF
assets/style.css      design tokens, layout, components
assets/script.js      theme toggle, nav, the interactive figures, BibTeX copy, lightbox
assets/img/           photos (WebP with JPEG fallback) and og.jpg
assets/fonts/         self-hosted variable fonts
assets/Ibrahim_Odat_CV.pdf
```

## Updating

Everything lives in `index.html`. Search for `UPDATE:` to find the spots that change most often.

After any change to `assets/style.css` or `assets/script.js`, raise the `?v=` number on both links in
`index.html`. Browsers keep the old files otherwise, and new markup with an old stylesheet looks broken.

- **New paper**: copy one `<li class="pub">` block in the Publications section, paste it at the top of the
  list, and edit the fields. The status tag is `review`, `preprint`, or `conf`.
- **News**: add an `<li>` at the top of the `news` list.
- **Citation numbers**: the `metrics` block in the hero, and the "Cited by" spans in Publications.
- **CV**: edit `cv.html`, open it in a browser, and use Print, then Save as PDF (Letter, default margins off)
  to replace `assets/Ibrahim_Odat_CV.pdf`. Keep the file name.
- **Figures**: Fig. 1 text lives at the top of the Fig. 1 block in `assets/script.js`. The Fig. 2 scenarios
  are `data-*` attributes on the buttons in `index.html`. Fig. 3 and Fig. 4 are plain markup.

## Tracking where visitors come from

Share a tagged link in each place and GoatCounter groups the visits by source:

```
https://3odat.github.io/?ref=instagram
https://3odat.github.io/?ref=linkedin
https://3odat.github.io/?ref=cv
```

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
