# Emberwild — De laatste vonk · versie 0.4

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

## Verkenning — De vermiste kruidenzoeker

Deze zijmissie kan op ieder moment en staat los van de hoofdopdracht.

1. Zoek **Mira**, ten zuidoosten van het kampvuur (bij 6, 25), en praat met E. Neem haar opdracht aan.
2. Zoek **Tovin** met zijn blauwe lantaarn in het westelijke bos (bij -23, -32). Praat met hem; hij vindt de weg terug naar het dorp.
3. Keer terug naar Mira voor 75 XP, 35 goud en drie kruiden. Tovin is daarna ook in het dorp te vinden.
4. Volg Tovins aanwijzing en de blauwe bloemen noordwestwaarts naar het **Fluisterheiligdom** (bij -26, -48). Wanneer je dichtbij komt wordt de plek ontdekt en verschijnt hij op de minimap.
5. Onderzoek het heiligdom met E en ontvang de **Woudzegen**: permanent +20 maximale gezondheid, eenmalig volledig herstel, 50 XP en 25 goud. Dit stapelt met het Hartamulet en hoeft niet apart uitgerust te worden. De beloning kun je maar één keer ontvangen. Je mag het heiligdom ook al vóór de zijmissie ontdekken.

**Kruiden en drankjes:** acht goudbloesemplanten staan verspreid door de vallei. Pluk met E. Nabije planten verschijnen als kleine geelgroene punten op de minimap. Iedere plant geeft één kruid en blijft daarna geplukt in je opslag. In het gesprek met Bram kun je kiezen tussen een levensdrank kopen voor 15 goud en een drank maken van drie kruiden zonder goudkosten. De maakknop is uitgeschakeld als je te weinig kruiden hebt. Inventaris I toont je kruidenvoorraad.

De extra opdracht staat onder ‘Verkenning’ in de HUD en vervangt je hoofdopdracht niet. Verkenningsvoortgang, geplukte planten, kruidenvoorraad en Woudzegen blijven bewaard bij reizen, doodgaan en herladen.

## Opslag en geluid

Automatische localStorage-opslag iedere vijf spelseconden en na belangrijke acties, gebiedswissels en pauzeren. Opslagsleutel: `emberwild-save-v1`. Oudere opslag van versie 0.1/0.2/0.3 blijft bruikbaar; hoofdstuk 2 begint pas nadat je de nieuwe opdracht aanneemt. Je hoeft niet opnieuw te beginnen.

‘Ga verder’ verschijnt bij een bruikbare opslag. ‘Nieuw avontuur’ vervangt de voortgang; tijdens spelen wordt hiervoor bevestiging gevraagd. Voortgang is gebonden aan dezelfde browser en hetzelfde site-adres. Bij geblokkeerde opslag blijft spelen mogelijk voor de huidige sessie. Geen cloudopslag of multiplayer.

Geluiden worden via Web Audio gemaakt na een gebruikersactie. Met ‘Geluid aan/uit’ kun je dempen; de voorkeur blijft lokaal bewaard. Er is geen achtergrondmuziek. In de vallei hoor je zachte procedurele wind en vogels; in de Wortelgrotten hoor je zachte ruis en druppels met korte echo’s. Omgevingsgeluid start na gebruikersinvoer, pauzeert tijdens menu’s of verlies van vensterfocus en wordt samen met de effecten gedempt. Eén hergebruikte ruislus en enkele korte tonen houden het audiowerk beperkt.

## Bestanden

- `index.html`, `style.css`: interface en menu's.
- `js/core.js`: spelregels, opdrachten, uitrusting, beloningen en opslagvalidatie.
- `js/combat.js`: ontwijkregels, afkoeltijden en botsingen voor snelle projectielen.
- `js/world.js`: procedurele vallei, modellen, animaties en gevechtseffecten.
- `js/dungeon.js`: drie kamers, vloeren, wanden, deur, sleutel, altaar, gebiedsweergave en loopruimte.
- `js/exploration.js`: Mira, Tovin, kruiden, heiligdom en bloemspoor.
- `js/audio.js`: procedurele geluidseffecten, omgevingsgeluid en dempknop.
- `js/game.js`: camera, invoer, gevechten, gebiedswissels, interacties, HUD en opslag.
- `vendor/three.min.js`: Three.js 0.160.1, MIT-licentie in `vendor/THREE-LICENSE.txt`.
- `tests/`: Node.js-tests.

## Controle

Met Node.js 18+: `node --test tests/*.cjs`.

22 tests geslaagd. Ze controleren beide opdrachtketens, kamerbereikbaarheid en deurblokkering, oude en nieuwe opslag, uitrusting, herhaalde beloningen, niveauverhogingen, audio, rollen en projectielbotsingen. De integratietest bouwt de echte Three.js-wereld op en voltooit beide hoofdstukken met gesimuleerde invoer. Hij test ook beide aanvalspatronen van de Wortelmoeder, het amulet, gebiedswissels en doodgaan in de grot, de zijmissie, bereikbare verkenningsplekken, kruiden plukken, drankjes maken en de Woudzegen. Audiotests controleren ook de omgevingslus, gebiedswissels, pauze en dempen. JavaScript-syntax en relatieve bestandsverwijzingen zijn gecontroleerd.

De test vervangt DOM en WebGL-renderer en controleert geen uiteindelijke pixels of hardwareprestaties. De voorgeschreven browsertool was niet beschikbaar voor een visuele browsercontrole. Vloertegels in de grot worden in twee InstancedMesh-batches getekend om het aantal tekenaanroepen klein te houden.

Dit is een eerste speelbare RPG met twee gebieden, één klasse, twee korte hoofdstukken en eenvoudige modellen en AI. Nog geen uitgebreide uitrustingssystemen, sprongen, multiplayer of extra kerkers.
