# Vloeiende, gegronde wolvenanimatie

De eerdere staplengte was vrijwel even groot bij langzaam wandelen en achtervolgen. In langzame bochten bleven steunpoten daardoor te ver achter de draaiende romp staan. De beenoplosser kortte de totale afstand naar zo'n onbereikbaar voetdoel af en trok daarbij de poot omhoog. Ook veranderden de voetdoelen te abrupt bij stoppen. De oude tests controleerden snellere beweging en kleine bochten; langzaam ronddwalen ontbrak.

De gerichte aanpassing in `js/forest-actors.js` geldt voor schemerwolven en grijze wolven:

- Kortere stappen bij lage snelheid; draaien telt mee voor de stapfrequentie.
- Een vierfasige wandelpas die bij hogere snelheid overgaat in diagonale draf.
- Lage voetbogen met geleidelijke afzet en landing; voetdoelen veranderen vloeiend bij versnellen en stoppen.
- Steunpoten blijven staan, te ver uitgestrekte poten beginnen eerder aan een nieuwe stap en bij stoppen worden de laatste poten afzonderlijk neergezet.
- De beenoplosser begrenst onbereikbare horizontale stappen op dezelfde voethoogte. Hij trekt een steunpoot niet langer van de grond.
- Voetzolen sluiten aan op de huidige valleihoogte van `-0.1`, met de werkelijke onderkant van de gedeelde pootgeometrie als referentie.
- Rust, ademhaling, waarschuwing, beet, terugslag, lijken en respawn blijven dezelfde actor gebruiken.

`js/game.js` laat wolven tijdens achtervolgen geleidelijk naar de speler draaien. Positie, snelheid, schade, aanvalstiming, quests, loot en opslag blijven hun bestaande regels gebruiken. De bestaande geometrie en materialen worden gedeeld; er zijn geen nieuwe modellen of extra meshes nodig.

## Controle

`tests/forest-actors.test.cjs` controleert beide vachten bij langzaam rondlopen (0.3, 0.65 en 1 eenheid/s), scherpe bochten en verschillende tijdstappen. Ook versnellen naar 3.3, kort onderbreken/hervatten, vertragen, stoppen, rust en respawn worden gecontroleerd op echte zoolhoogte, steuncontact en vloeiende voetbeweging.

`scripts/browser-wolves.cjs` rendert beide modellen vanuit meerdere stapfasen en controleert daarna de echte wandel- en achtervolg-AI met WASD-invoer in de bestaande vallei. Screenshots staan in `/tmp/emberwild-wolves-*.png` en in het bestaande browserartifact van GitHub Actions. Deze controle is onderdeel van `scripts/browser-start.cjs`.

```sh
node --test tests/*.cjs
EMBERWILD_BASE_URL=http://127.0.0.1:8781/ node scripts/browser-wolves.cjs
```

Start voor de browsertest een HTTP-server vanuit de projectroot. De game zelf blijft rechtstreeks via `index.html` speelbaar. De wijziging wordt alleen op `feature/quest-loot-system` aangeboden.
