# Ibrahim Odat · research site

Personal site of **Ibrahim Odat**, PhD candidate in AI security at Oakland University.

Live: https://3odat.github.io

## Stack

Plain HTML, CSS, and a small vanilla JS file. No build step, no dependencies, no third-party requests.
Fonts (Newsreader, Inter, JetBrains Mono, all SIL Open Font License) are self-hosted in `assets/fonts/`.
Light and dark themes follow the system setting, with a manual toggle.

```
index.html            all content
assets/style.css      design tokens, layout, components
assets/script.js      theme toggle, nav, Fig. 1, BibTeX copy, lightbox
assets/img/           photos (WebP with JPEG fallback) and og.jpg
assets/fonts/         self-hosted variable fonts
assets/Ibrahim_Odat_CV.pdf
```

## Updating

Everything lives in `index.html`. Search for `UPDATE:` to find the spots that change most often.

- **New paper**: copy one `<li class="pub">` block in the Publications section, paste it at the top of the
  list, and edit the fields. The status tag is `review`, `preprint`, or `conf`.
- **News**: add an `<li>` at the top of the `news` list.
- **Citation numbers**: the `metrics` block in the hero, and the "Cited by" spans in Publications.
- **CV**: replace `assets/Ibrahim_Odat_CV.pdf`, keeping the file name.

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.
