# KAYAN — DM microsite

The interactive envelope page for KAYAN's direct-message campaign on X. Visitors tap the wax seal, the seal breaks, the flap opens and the invitation card slides out. The card shows:

> بيننا وبينك سؤال…
> سمعت عن كيان؟

Below that is a **شارك توقعاتك** button. It opens X with this post already written:
`وصلني كيان، وش تتوقعون؟ #كيان`

The site uses plain HTML, CSS and JavaScript. It has no build step and no dependencies, and it doesn't use cookies, tracking or forms.

## Files

```
index.html               page structure and Arabic copy
style.css                look, layout, card text animation
script.js                opening sequence, lighting, sound, share link
assets/
  kayan-logo-white.png   official KAYAN logo (used as the seal impression)
  plex-arabic-700.woff2  IBM Plex Sans Arabic Bold (Arabic subset)
  plex-arabic-400.woff2  IBM Plex Sans Arabic Regular (Arabic subset)
  amiri-400.woff2        Amiri Regular (Arabic subset)
  og.jpg                 link preview image for DMs
.nojekyll                tells GitHub Pages to serve files as they are
```

The paper sounds are created in the browser with the Web Audio API, so there are no audio files to load. The page is about 210 KB in total.

## Deploy on GitHub Pages

1. Create a new public repository, for example `kayan`.
2. Upload everything in this folder to the root of the repository, including `assets/` and `.nojekyll`.
3. Go to **Settings → Pages → Build and deployment**. Set Source to **Deploy from a branch**, the branch to **main**, and the folder to **/ (root)**, then save.
4. After a minute the site is live at `https://<username>.github.io/kayan/`.

## Link preview in DMs (recommended)

X needs an **absolute** image URL to show a preview card. After deploying, open `index.html` and replace the two `assets/og.jpg` values with the full URL:

```html
<meta property="og:image" content="https://<username>.github.io/kayan/assets/og.jpg">
<meta name="twitter:image" content="https://<username>.github.io/kayan/assets/og.jpg">
```

## Editing

- **Card text:** in `index.html`, inside `.card-body`.
- **Post text:** in the `SHARE_TEXT` variable at the top of `script.js`.
- **Colours:** the CSS variables at the top of `style.css`. They use the KAYAN palette: Midnight Ink `#031222`, KAYAN Navy `#042141`, KAYAN Teal `#00BCCA`, Deep Teal `#01525F` and Paper `#F1F4F6`.

## Compatibility

It works on iPhone Safari, Android Chrome and Samsung Internet, and in X's in-app browser. Tapping, mouse and keyboard all work: the seal and the share button are real buttons and links. It also respects the device's "reduce motion" setting. On iPhone, the paper sounds follow the silent switch.
