# Motion Carpenters

One-page site for Mike. Real job photos only. No database, no login, nothing paid.

The live files are in `public/`. Vercel can host that folder as a static site.

## Run it here

```powershell
cd c:\Users\justi\OneDrive\Desktop\DymondIQ\MotionCarpenters
npm install
npm run dev
```

Open http://localhost:4173

## Photos

Optimised WebP files are already in `public/images/`. Thumbs are in `public/images/thumbs/`. Camera data is stripped so a photo cannot publish a client's location.

To rebuild them from the Drive folder (`G:\My Drive\Motion Carpenters - Website Photos`):

```powershell
npm run optimize
```

`duplicate-10.jpeg` is skipped. The phone black bars on two screenshots are cropped off. The jobs themselves are unchanged.

## Deploy later

Only when Justin says so. This has not been deployed.

```powershell
npx vercel
```

If it asks: framework **Other**, output directory **public**, no build command. `vercel.json` is set that way.

That gives a free `.vercel.app` link. Check the photos and the WhatsApp button on that link.

`npx vercel --prod` is the lasting link. Don't run that until he wants it public.
