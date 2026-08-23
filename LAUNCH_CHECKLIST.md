# Fraser Valley iPhone Repair Launch Checklist

## Completed

- [x] Move the approved clean design into the GitHub Astro site.
- [x] Remove visible street address from current pages.
- [x] Remove phone number from current pages.
- [x] Remove call, SMS, and email links from current pages.
- [x] Add iMessage, WhatsApp Business, and Messenger contact options.
- [x] Add contact icons to the top-right header.
- [x] Preserve Blogger archive posts inside the site.
- [x] Preserve same-path Blogger `.html` URLs, including `/p/services.html`.
- [x] Add GitHub Pages workflow deployment.
- [x] Set GitHub Pages custom domain to `fraservalleyiphonerepair.com`.
- [x] Deploy successfully from GitHub Actions.
- [x] Add build verification for legacy URLs and hidden phone/address rules.

## Remaining Before Domain Cutover

- [ ] Update DNS away from Blogger/Google and toward GitHub Pages.
  - Remove current apex `A` records pointing at Google:
    - `216.239.32.21`
    - `216.239.34.21`
    - `216.239.36.21`
    - `216.239.30.21`
  - Add apex `A` records for `@`:
    - `185.199.108.153`
    - `185.199.109.153`
    - `185.199.110.153`
    - `185.199.111.153`
  - Optional, add apex `AAAA` records for `@`:
    - `2606:50c0:8000::153`
    - `2606:50c0:8001::153`
    - `2606:50c0:8002::153`
    - `2606:50c0:8003::153`
  - Change `www` from `ghs.google.com` to `yannstlo.github.io`.
- [ ] Wait for DNS propagation.
- [ ] Enable GitHub Pages HTTPS enforcement once GitHub allows it.
- [ ] Check the live custom domain after DNS changes.

## Later Cleanup

- [ ] Review old imported blog article bodies for historical phone/address wording.
- [ ] Decide whether to keep all old posts visible in `/blog/` or keep some only as preserved legacy URLs.
- [ ] Submit the new sitemap in Google Search Console after the domain cutover.
