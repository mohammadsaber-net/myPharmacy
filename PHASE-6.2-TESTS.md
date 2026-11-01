# Phase 6.2 – Storefront and image gallery test plan

## Product images
- [ ] Create a product with 2–3 images.
- [ ] Confirm all images appear in the admin product editor.
- [ ] Select a different primary image and save; confirm the product card uses it.
- [ ] Confirm product details show all images and thumbnails switch the main image.
- [ ] Remove one existing image and save; confirm its Cloudinary asset is deleted.
- [ ] Add another image while retaining older images.
- [ ] Remove every image and save; confirm no image records remain.
- [ ] Hide/delete a product; confirm all its Cloudinary images are deleted while old order records remain intact.
- [ ] Try an unsupported file type and an image larger than 5 MB.

## Storefront and mobile
- [ ] Check header navigation at desktop width.
- [ ] Check hamburger menu at mobile width and test every link/action.
- [ ] Add several units to cart; confirm the header badge counts total units.
- [ ] Refresh the page; confirm the cart and badge remain synchronized.
- [ ] Open contact and product-request popups, submit valid data, and confirm success toasts.
- [ ] Submit an invalid phone number for a product request and confirm an error toast.
- [ ] Confirm order confirmation in admin shows a success toast.
- [ ] Check `/privacy`, `/terms`, and `/policy` on mobile and desktop.

## Verification
Run locally after installing dependencies:

```bash
npm run typecheck
npm run lint
npm run build
```

No schema migration is expected for this phase.
