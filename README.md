# OceanEmbed Console

Frontend-first operations console for the OceanEmbed ensemble. It currently uses a deterministic mock API so the map, depth rail, profile inspector, and basemap switch can be built before the NRT backend exists.

## Run

```bash
npm install
npm run dev
```

## Backend integration

Replace `src/api/mockOceanApi.ts` with a real client implementing the `OceanEmbedApi` interface in `src/api/types.ts`. No map or UI component needs to know whether its data is mocked or served by FastAPI.

The map has two independent basemaps: OSM-derived basic tiles and satellite imagery. Set a production provider in `src/map/basemaps.ts` before deployment, respecting its terms and attribution requirements.
