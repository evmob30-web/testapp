# Zichtbare questsymbolen

Alle quest-NPC's gebruiken nu originele, gefacetteerde symbolen in de stijl van de aangeleverde referentie: een gouden uitroepteken of vraagteken, een brede donkere contour, een gouden buitenrand, lichte facetvlakken en een zachte gloed. De tekeningen worden lokaal met Canvas opgebouwd en hebben geen lettertype, externe afbeelding, nabewerking of extra lichtbron nodig.

## Leesbaarheid

De vorige kleine tekstletters krompen steeds verder mee met de afstand. `js/quest-markers.js` maakt de grootte nu afhankelijk van de projectie van de camera. De volledige sprite blijft bij normale desktopvensters tussen 64 en 86 CSS-pixels hoog, inclusief transparante marge en gloed. Het werkelijk zichtbare symbool is in de browsertest ongeveer 54–74 pixels hoog. Ook aan de andere kant van de vallei blijft het daardoor leesbaar.

De symbolen draaien als billboard automatisch naar de camera. Hun onderkant hangt boven het naamplaatje, zodat een groter symbool niet over het personage schuift. Camera draaien, zoomen en vensterwijzigingen worden iedere renderframe meegenomen. Kleine vensters gebruiken een aangepast bereik van 48–68 pixels voor de volledige sprite. De subtiele verticale beweging beslaat slechts enkele schermpixels en stopt tijdens pauze.

Goud blijft helder bij mist en donkere belichting. De iconen gebruiken dezelfde zichtbaarheid door begroeiing als de eerdere markers en schrijven niet in de depth-buffer. Drie gedeelde textures en materialen bedienen alle NPC's; er is geen bloom-effect of eigen renderpass nodig in de game.

## Questgedrag

- Nieuwe opdracht: goud `!`.
- Aangenomen en nog bezig: zilvergrijs `?`.
- Klaar om in te leveren: goud `?`, alleen bij de juiste inlever-NPC.
- Ingeleverd: geen symbool, tenzij dezelfde NPC nog een andere opdracht aanbiedt.

De bestaande queststatus, prioriteit voor inleverbare quests, dialogen, gebiedsregels en opgeslagen voortgang blijven de bron van waarheid. De vormgeving past die spelregels niet aan. Tijdens gesprekken verdwijnen de symbolen zoals voorheen.

## Bestanden en controle

`js/quest-markers.js` bevat de tekeningen en schermgrootte. `js/adventure-world.js` koppelt ze aan de bestaande NPC-statussen; `js/game.js` werkt de projectie bij na de camera. `index.html` laadt de module en vernieuwt de cacheversie.

`tests/quest-markers.test.cjs` controleert projectie tot 85 eenheden afstand, camerahoeken, FOV, venstergrootte, gedeelde materialen en stabiele positionering. De bestaande gameplaytest doorloopt dezelfde queststatussen in de echte scene.

`scripts/browser-markers.cjs` controleert de daadwerkelijk gerenderde afmetingen, gouden/zilveren pixels en donkere contour voor alle statussen, dichtbij, op middelafstand, op circa 70 meter en vanuit het bos. De iconen worden ook onder zware mist, na zoomen en na verkleinen van het venster gecontroleerd. Screenshots worden met de volledige GitHub-browsertest opgeslagen.

```sh
node --test tests/*.cjs
EMBERWILD_BASE_URL=http://127.0.0.1:8786/ node scripts/browser-markers.cjs
```

Start voor de laatste opdracht een lokale HTTP-server vanuit de projectroot. De game blijft rechtstreeks via `index.html` speelbaar. Deze wijziging staat uitsluitend op `feature/quest-loot-system`.
