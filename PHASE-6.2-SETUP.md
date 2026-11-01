# Phase 6.2 setup

This release builds on `saydalety-phase6-cloudinary.zip`.

## Installation
1. Stop the running development server.
2. Extract this ZIP and copy the contents of its `saydalety` folder over the existing project folder.
3. Keep the current `.env` file and do not replace it with `.env.example`.
4. No database migration is required. The existing `product_images` table already supports multiple image rows per product.
5. Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run dev
```

## Image behavior
- Each product supports up to 10 images, each up to 5 MB.
- Supported formats: JPEG, PNG, WEBP, AVIF.
- The admin editor supports adding and removing images and choosing the primary image.
- Removed image assets and product image assets are deleted from Cloudinary after the database update. Cloudinary cleanup is retried up to three times; if it still fails, the API returns a cleanup warning and writes details to server logs.
- Product deletion from the admin is implemented as the existing soft-hide behavior, preserving old order history while removing its product image records and Cloudinary assets.

## Storefront updates
- Responsive mobile hamburger menu.
- Header cart badge counts total units in the cart.
- Product details gallery with thumbnails; product cards use the primary image.
- Contact and product-request dialogs are available from the header.
- Toast messages cover cart actions, customer forms, checkout errors/success, product changes, and admin order status updates.
- New routes: `/privacy`, `/terms`, `/policy`.

The legal pages are draft templates and should be reviewed by qualified Egyptian legal/pharmacy compliance counsel before launch.
