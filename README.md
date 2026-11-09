# Emberwild — De laatste vonk · versie 0.3

Een originele singleplayer-actie-RPG in 3D: de Schemervallei met een dorp, bos en ruïne, plus de Wortelgrotten met drie verbonden kamers. Alle personages, modellen en verhalen zijn eigen werk. Three.js verzorgt WebGL; er worden geen Warcraft-assets gebruikt.

## Starten

Open `index.html` in een recente desktopbrowser met WebGL/hardwareversnelling. Geen installatie, backend, account, externe API of buildstap nodig. Three.js wordt lokaal meegeleverd. Ook geschikt voor GitHub Pages op een subpad. De game is bedoeld voor toetsenbord en muis op een laptop of desktop; er is nog geen mobiele besturing.

## Besturing

| Invoer | Actie |
| --- | --- |
| WASD / pijltjes | Bewegen ten opzichte van de camera |
| Shift | Rennen |
| Muis slepen | Camera draaien en kantelen |
| Muiswiel | In- en uitzoomen |
| 1 / korte linkermuisklik | Zwaardslag op de dichtstbijzijnde vijand binnen 3,1 meter |
| 2 | Vonkflits binnen 13 meter; 3,5 s afkoeltijd |
| Spatie | Voorwaartse ontwijkrol in je bewegingsrichting; 0,38 s bescherming, 1,35 s afkoeltijd |
| Q | Levensdrank; herstelt tot 70 gezondheid |
| E | Praten, verzamelen, deur openen of gebied betreden/verlaten |
| I | Inventaris en uitrusting |
| Esc | Pauze / menu sluiten |

## Hoofdstuk 1 — De Schemervallei

1. Praat met Elin bij het kampvuur in Lindehaard.
2. Versla drie schemerwolven in het noorden en keer terug naar Elin.
3. Verzamel drie mintgroene kristallen (zichtbaar op de minimap) en breng ze naar Elin voor het vonkzwaard.
4. Versla de Doornwachter bij de noordelijke ruïne. Ontwijk de oranje aanvalscirkel.
5. Keer terug naar Elin om het eerste hoofdstuk te voltooien.

De optionele bosgeest in het oostelijke woud houdt afstand en schiet paarse projectielen. Hij telt niet mee voor de wolvenopdracht. De Doornwachter laat **Doornlicht** achter: +18 schade, uit te rusten via I. Ook bestaande opslag waarin de Doornwachter al verslagen is geeft toegang tot dit wapen.

Bram verkoopt levensdranken voor 15 goud. Een verborgen kist ligt ten oosten van het bospad. Rust bij het kampvuur om te herstellen. Ervaring verhoogt je niveau, gezondheid en schade.

## Hoofdstuk 2 — De Wortelgrotten

1. Praat na hoofdstuk 1 opnieuw met Elin en neem de nieuwe opdracht aan. Je krijgt twee levensdranken.
2. Zoek de doorgang onder de noordelijke ruïne en druk op E om af te dalen.
3. **De Sporehal:** een wortelwacht bewaakt de eerste kamer. De gloeiende kring bij de ingang herstelt langzaam gezondheid. De uitgang aan de zuidkant brengt je terug naar de vallei.
4. **Het Wortelarchief:** versla de Sporenwachter die van afstand aanvalt. Pak daarna de gouden wortelsleutel op de sokkel aan de oostkant met E.
5. Open met E de gesloten worteldeur in de noordelijke gang. Zonder sleutel kun je hier ook niet doorheen rollen.
6. **Het Stille Hart:** versla de Wortelmoeder. Ze wisselt twee aanvallen af: een oranje wortelslag met groter bereik, en een paars zaadsalvo van drie projectielen. De tekst en gekleurde cirkel kondigen de aanval aan. Verplaats je of rol op het juiste moment.
7. Pak met E het **Hartamulet** van het altaar achter de eindbaas. Via I kun je het uitrusten: +40 maximale gezondheid en +8 schade. Het krijgt ook een zichtbaar hangertje op je personage. Uitrusten geneest niet gratis; rust bij een herstelplek of gebruik een levensdrank om de extra gezondheid te vullen.
8. Verlaat de grot via de ingang en keer terug naar Elin voor de voltooiing en laatste beloning.

De minimap past zich aan het gebied aan en toont de huidige kamer. Sleutel, deur en altaar hebben een eigen markering. Verslagen vijanden, gevonden sleutel, geopende deur en amulet blijven bewaard bij verlaten en herladen. Nog levende vijanden herstellen en keren terug naar hun beginplek wanneer je van gebied wisselt.

Na een nederlaag verlies je maximaal 10 goud. In de vallei keer je terug naar het dorp; in de grot naar de eerste kamer. Opdrachten, gevonden buit en geopende deur blijven behouden.

## Opslag en geluid

Automatische localStorage-opslag iedere vijf spelseconden en na belangrijke acties, gebiedswissels en pauzeren. Opslagsleutel: `emberwild-save-v1`. Oudere opslag van versie 0.1/0.2 blijft bruikbaar; hoofdstuk 2 begint pas nadat je de nieuwe opdracht aanneemt. Je hoeft niet opnieuw te beginnen.

‘Ga verder’ verschijnt bij een bruikbare opslag. ‘Nieuw avontuur’ vervangt de voortgang; tijdens spelen wordt hiervoor bevestiging gevraagd. Voortgang is gebonden aan dezelfde browser en hetzelfde site-adres. Bij geblokkeerde opslag blijft spelen mogelijk voor de huidige sessie. Geen cloudopslag of multiplayer.

Geluiden worden via Web Audio gemaakt na een gebruikersactie. Met ‘Geluid aan/uit’ kun je dempen; de voorkeur blijft lokaal bewaard. Er is geen achtergrondmuziek.

## Bestanden

- `index.html`, `style.css`: interface en menu's.
- `js/core.js`: spelregels, opdrachten, uitrusting, beloningen en opslagvalidatie.
- `js/combat.js`: ontwijkregels, afkoeltijden en botsingen voor snelle projectielen.
- `js/world.js`: procedurele vallei, modellen, animaties en gevechtseffecten.
- `js/dungeon.js`: drie kamers, vloeren, wanden, deur, sleutel, altaar, gebiedsweergave en loopruimte.
- `js/audio.js`: procedurele geluidseffecten en dempknop.
- `js/game.js`: camera, invoer, gevechten, gebiedswissels, interacties, HUD en opslag.
- `vendor/three.min.js`: Three.js 0.160.1, MIT-licentie in `vendor/THREE-LICENSE.txt`.
- `tests/`: Node.js-tests.

## Controle

Met Node.js 18+: `node --test tests/*.cjs`.

17 tests geslaagd. Ze controleren beide opdrachtketens, kamerbereikbaarheid en deurblokkering, oude en nieuwe opslag, uitrusting, herhaalde beloningen, niveauverhogingen, audio, rollen en projectielbotsingen. De integratietest bouwt de echte Three.js-wereld op en voltooit beide hoofdstukken met gesimuleerde invoer. Hij test ook beide aanvalspatronen van de Wortelmoeder, het amulet, gebiedswissels en doodgaan in de grot. JavaScript-syntax en relatieve bestandsverwijzingen zijn gecontroleerd.

De test vervangt DOM en WebGL-renderer en controleert geen uiteindelijke pixels of hardwareprestaties. De voorgeschreven browsertool was niet beschikbaar voor een visuele browsercontrole. Vloertegels in de grot worden in twee InstancedMesh-batches getekend om het aantal tekenaanroepen klein te houden.

Dit is een eerste speelbare RPG met twee gebieden, één klasse, twee korte hoofdstukken en eenvoudige modellen en AI. Nog geen uitgebreide uitrustingssystemen, sprongen, multiplayer of extra kerkers.
