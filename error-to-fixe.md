## Error Type
Blocking Route

## Error Message
Route "/tournaments/[tournamentId]/editions/[editionId]": Next.js encountered URL data in `generateMetadata()`.

This route's metadata is blocked, but the rest of its content can be prefetched. `params` or `searchParams` accessed in `generateMetadata()` prevent it from being prefetched.

Ways to fix this:
  - [static] Use a static metadata export instead of `generateMetadata()`
  - [dynamic] Render a marker component that calls `await connection()` inside `<Suspense>` on the page

Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime


    at Module.generateMetadata (app\tournaments\[tournamentId]\editions\[editionId]\page.tsx:25:25)

## Code Frame
  23 |   params,
  24 | }: PageProps): Promise<Metadata> {
> 25 |   const { editionId } = await params;
     |                         ^
  26 |   const edition = await getTournamentEditionById(editionId);
  27 |   return {
  28 |     title: edition

Next.js version: 16.4.3 (Turbopack)


## Error Type
Blocking Route

## Error Message
Route "/tournaments/[tournamentId]/editions/[editionId]/calendar": Next.js encountered URL data in `generateMetadata()`.

This route's metadata is blocked, but the rest of its content can be prefetched. `params` or `searchParams` accessed in `generateMetadata()` prevent it from being prefetched.

Ways to fix this:
  - [static] Use a static metadata export instead of `generateMetadata()`
  - [dynamic] Render a marker component that calls `await connection()` inside `<Suspense>` on the page

Learn more: https://nextjs.org/docs/messages/blocking-prerender-metadata-runtime


    at Module.generateMetadata (app\tournaments\[tournamentId]\editions\[editionId]\calendar\page.tsx:16:25)

## Code Frame
  14 |
  15 | export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
> 16 |   const { editionId } = await params;
     |                         ^
  17 |   const edition = await getTournamentEditionById(editionId);
  18 |   return {
  19 |     title: `Calendrier - ${edition?.name || `Édition #${edition?.editionNumber}`} | Games-Trafics`,

Next.js version: 16.4.3 (Turbopack)


