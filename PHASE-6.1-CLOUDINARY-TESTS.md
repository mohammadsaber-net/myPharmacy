# Phase 6.1 — Cloudinary and lint fixes

## Cloudinary setup

- [ ] Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to the local `.env` file.
- [ ] Run `npm install` to install the Cloudinary SDK.
- [ ] Restart the development server.

## Image workflow

- [ ] Add a product with a JPG/PNG/WEBP/AVIF image smaller than 5 MB.
- [ ] Confirm the product appears in the admin list with its image.
- [ ] Confirm the image appears on `/products` and `/products/[slug]`.
- [ ] Edit the product and upload a replacement image; confirm the replacement is displayed.
- [ ] Remove the current image from the edit screen; confirm the placeholder appears in the store.
- [ ] Try an unsupported file and a file larger than 5 MB; both should be rejected with a clear message.
- [ ] Confirm the Cloudinary API secret is not present in browser requests or `NEXT_PUBLIC_` variables.

## Project checks

Run from the project directory:

```powershell
npm run typecheck
npm run lint
npm run build
```

The image integration reuses the existing `product_images` table. No database migration, seed, or destructive database command is required.
