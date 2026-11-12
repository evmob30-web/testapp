# Herstel van gestreept en flikkerend terrein

## Vastgestelde oorzaak

De oorspronkelijke vallei bevatte een grondblok, twee ondiepe padblokken en 35 zevenhoekige grasvlakken. Alle grasvlakken lagen op exact `y = -0.04`. Verscheidene paren overlapten elkaar over een groot oppervlak. Nabij de grot overlappen bijvoorbeeld grasvlakken 6 en 27 rond `(0.2, -45.55)`; hun middelpunten liggen minder dan één eenheid uit elkaar. Vergelijkbare overlappingen lagen langs het midden/zuiden van het pad en aan de buitenrand van het bos.

De depth-buffer moest twee kleuren met dezelfde diepte vergelijken. Dat veroorzaakte de fijne horizontale strepen en kleurwisselingen bij camerabeweging. Het probleem is gereproduceerd in Chromium, vooral vanuit een hogere en een schuine westelijke camera. Tijdelijk één overlappend vlak verbergen liet het verdwijnen. Schaduwen uitschakelen veranderde het niet. De betrokken materialen hadden geen textures, transparantie of aangepaste shaders.

## Gerichte geometrische oplossing

`js/terrain.js` behoudt de oorspronkelijke 35 zevenhoeken, hun ligging, afmetingen, kleuren en de beide padrechthoeken. Het verdeelt die ontwerpen in aansluitende polygonen en trianguleert ze tot één ondoorzichtig grondoppervlak. Gedeelde randpunten worden in aangrenzende polygonen opgenomen om kieren door T-aansluitingen te voorkomen. Het pad heeft voorrang op de grasvlakken binnen zijn oorspronkelijke begrenzing; de groene vormen ernaast blijven bestaan.

De vloer blijft op de bovenkant van het oorspronkelijke grondblok (`y = -0.1`). Ook de oorspronkelijke wereldomtrek en de zijkant/onderkant blijven behouden. Geen twee bovenoppervlakken bedekken nog hetzelfde gebied. Het grondblok, de padblokken en losse graslagen worden uitsluitend voor dit oppervlak vervangen. Bomen, rotsen, grot, gebouwen, modelskeletten, colliders en navigatieregels blijven onderdeel van dezelfde wereld.

De originele vier grondkleuren blijven behouden, met gewone `MeshStandardMaterial`, vertexkleuren en schaduwen. Er zijn geen polygon-offsets, transparantietrucs, render-orderaanpassingen of globale camera-/depth-bufferwijzigingen nodig. De vloer gebruikt ongeveer 2.050 driehoeken en één materiaal.

## Controle

- `tests/terrain.test.cjs`: originele ontwerpen en begrenzing, totale gesloten oppervlakte van 32.300 eenheden², geen overlappende kleurregio's, geen ongeldige/driehoekloze vlakken, neerwaartse raycasts op honderden plaatsen, ononderbroken vijf eenheden breed pad en behouden groene vlakken ernaast.
- `scripts/browser-terrain.cjs`: acht echte WebGL-camerastandpunten bij de grot, het midden/zuiden, het dorp en buiten het pad. Een aparte kleurpass vergelijkt honderden gerenderde pixels met de geometrie, los van bedoelde schaduwen. Normale gamebelichting blijft op de screenshots actief.
- Dezelfde browsertest loopt met de werkelijke WASD-/Shift-invoer van `(0, -24)` naar de grotingang, draait de camera, controleert de bereikbare ingang en gaat de Wortelgrotten binnen. Alleen de testfixture houdt vijanden tijdelijk dood om de navigatie te isoleren; de productiegame krijgt geen testknoppen.
- Screenshots worden als `/tmp/emberwild-terrain-*.png` opgeslagen en samen met de andere browserbeelden als GitHub Actions-artifact bewaard.

Uitvoeren vanuit de projectroot, naast een lokale HTTP-server:

```sh
node --test tests/terrain.test.cjs
EMBERWILD_BASE_URL=http://127.0.0.1:8780/ node scripts/browser-terrain.cjs
```

Deze wijziging staat uitsluitend op `feature/quest-loot-system`. De bestaande testcheckout serveert de aanpassing direct; de live GitHub Pages-versie wordt niet gepubliceerd.
