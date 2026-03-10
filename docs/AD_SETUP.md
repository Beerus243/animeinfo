# Ad Setup

## Current approach

- Use consent-gated ad slots rendered by `app/components/AdUnit.tsx`.
- Configure `NEXT_PUBLIC_ADSENSE_CLIENT` to enable AdSense.
- Keep `PREBID_ENABLED=false` until header bidding is integrated.

## Required files

- `public/ads.txt`: paste the lines provided by AdSense or Ezoic.
- `app/components/ConsentBanner.tsx`: only enable ad loading after consent.

## Scaling path

- Start with AdSense for initial validation.
- Move to Ezoic or Mediavine when traffic thresholds justify mediation.
- Enable Prebid once direct demand and layout stability are priorities.