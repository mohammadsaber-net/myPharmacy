# Phase 6.3 — Loading, product pagination, and product names

## Included changes

- Storefront product listing uses database pagination with 20 products per page.
- Admin product management and inventory balances use database pagination with 20 products per page.
- Previous/Next controls are disabled at the first/last page.
- Product search matches the Arabic/commercial name, scientific name, English name, and description.
- Product records now require `scientific_name` and `english_name`.
- The legacy `sku` database column and its existing values are retained for data safety, but the application no longer asks for or searches by SKU.
- Existing products receive empty strings in the two new name columns during migration. Before editing an existing product, enter its scientific and English names.
- Loading skeletons are added for storefront routes and admin pages. The home page streams its hero first and loads category/product sections independently.

## Apply the database migration

1. Back up the Neon database before changing its schema.
2. Copy the project files and install dependencies:

   ```bash
   npm install
   ```

3. Confirm `DATABASE_URL` in your local `.env` points to the intended Neon database.
4. Run the migration:

   ```bash
   npm run db:migrate
   ```

   This runs `drizzle/0002_product_names.sql`. It only adds two columns to `products` and removes their temporary defaults after existing rows are populated with empty strings. It does not drop tables, delete products, delete images, or alter orders.

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open Admin → Products and fill in the scientific and English names for existing products as you edit them. New products must include both names.

## Validation commands

```bash
npm run typecheck
npm run lint
npm run build
```

Run these after installing dependencies and applying the migration. The ZIP is syntax-checked, but a complete build and live database migration could not be executed in this environment because package installation did not complete and the Neon connection is not available here.
