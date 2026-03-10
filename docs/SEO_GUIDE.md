# SEO Guide

## Article requirements

- Every published article should have a unique title, excerpt, and canonical slug.
- Fill `seo.metaTitle`, `seo.metaDesc`, and `seo.ogImage` before publishing.
- Use semantic `h2` blocks in article content where relevant.

## Technical coverage

- `app/news/[slug]/page.tsx` emits canonical metadata and JSON-LD.
- `app/sitemap.ts` indexes published articles only.
- Category and anime hub pages create thematic internal linking.