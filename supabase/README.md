# Supabase catalog setup

1. Create a Supabase project at https://supabase.com/dashboard.
2. In **SQL Editor**, run `migrations/20260901000000_create_catalog.sql`.
3. Copy `.env.example` to `.env.local` and add the project URL plus its **Publishable** (anon) key from **Project Settings → API**.
4. Restart `npm run dev` after changing environment variables.

The browser uses only the publishable key. Never add the `service_role` key to a Vite environment file or commit it to Git.

## Data model

- `categories` groups products for navigation and collections.
- `products` stores shared product content and the URL slug.
- `product_variants` contains each sellable colour, SKU, price, and total stock.
- `product_images` supports galleries and optional colour-specific images.
- `product_sizes` stores purchasable sizes and per-size stock.
- `product_details` stores ordered bullet points for the product-detail accordion.

Use the Supabase dashboard to add catalog rows initially. Build an authenticated admin interface later; the public browser role intentionally has read-only access.
