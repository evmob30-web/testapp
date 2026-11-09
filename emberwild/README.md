# Emberwild — De laatste vonk

Een originele, kleine singleplayer-actie-RPG in een echte 3D-wereld. Deze eerste versie bevat één vallei, een dorp, een bos en een ruïne. Eigen low-poly graphics en personages; geen Warcraft-assets of verhaal.

## Starten

Open `index.html` in een recente desktopbrowser met WebGL/hardwareversnelling. Alle bestanden inclusief Three.js worden lokaal meegeleverd; geen backend, account, internetverbinding of buildstap nodig. Ook geschikt voor GitHub Pages op een subpad. Ontwikkeld voor toetsenbord en muis op een laptop/desktop; nog geen mobiele besturing.

## Besturing

| Invoer | Actie |
| --- | --- |
| WASD / pijltjes | Bewegen ten opzichte van de camera |
| Shift | Rennen |
| Muis slepen (links of rechts) | Camera draaien en kantelen |
| Muiswiel | In- en uitzoomen |
| 1 / korte linkermuisklik / spatie | Zwaardslag op dichtstbijzijnde vijand binnen 3,1 meter |
| 2 | Vonkflits op dichtstbijzijnde vijand binnen 13 meter; 3,5 s afkoeltijd |
| Q | Levensdrank, herstelt tot 70 gezondheid |
| E | Praten, kristal verzamelen, kist openen |
| I | Inventaris openen/sluiten |
| Esc | Pauze / menu sluiten |

## Het avontuur

1. Praat met Elin bij het kampvuur en aanvaard haar opdracht.
2. Versla drie schemerwolven ten noorden van het dorp. Kom terug bij Elin voor je beloning.
3. Verzamel de drie mintgroene kristallen die op de minimap staan. Breng ze naar Elin om het vonkzwaard te krijgen.
4. Versla de Doornwachter bij de noordelijke ruïne. Ontwijk zijn oranje aanvalscirkel tijdens de voorbereiding van zijn slag.
5. Keer terug naar Elin om het avontuur te voltooien.

Bram verkoopt levensdranken voor 15 goud. Er ligt een verborgen kist ten oosten van het bospad. Rust binnen vijf meter van het kampvuur om te herstellen. Met ervaring stijg je in niveau: je krijgt meer gezondheid en schade. Na een nederlaag keer je terug naar het dorp, verlies je maximaal 10 goud en behoud je opdrachtvoortgang en verzamelde buit. Nog levende vijanden herstellen en keren terug naar hun beginplek.

## Opslag

Automatische localStorage-opslag elke vijf spelSeconden, bij gesprekken, belangrijke beloningen, pauzeren en verlaten van de pagina. De opslag staat onder een eigen sleutel (`emberwild-save-v1`) en raakt Star Hopper niet. ‘Ga verder’ verschijnt als er een bruikbare opslag is. ‘Nieuw avontuur’ vervangt je voortgang; tijdens een actief avontuur vraagt het spel daarvoor bevestiging. De opslag werkt alleen in dezelfde browser en op dezelfde site. Als opslag geblokkeerd is, blijft spelen mogelijk voor de huidige sessie. Geen cloudopslag of multiplayer.

## Bestanden

- `index.html`, `style.css`: interface, menu's en schermindeling.
- `js/core.js`: spelregels, opdrachten, beloningen, opslagvalidatie.
- `js/world.js`: procedureel gebouwde 3D-wereld, modellen en effecten.
- `js/game.js`: WebGL-weergave, camera, invoer, gevechten, interacties, opslag en UI.
- `vendor/three.min.js`: lokaal meegeleverde Three.js 0.160.1, MIT-licentie in `vendor/THREE-LICENSE.txt`.
- `tests/`: Node.js-regressietests.

## Controle

Voer uit met Node.js 18+: `node --test tests/*.cjs`.

Vijf tests geslaagd: volledige opdrachtketen, opslagherstel, ongeldige opslag, niveauverhogingen en een integratietest die de echte Three.js-wereld opbouwt en het volledige avontuur met gesimuleerde invoer voltooit. Daarin worden ook pauze, inventaris, doodgaan en opnieuw beginnen getest. JavaScript-syntax is gecontroleerd. De integratietest vervangt de WebGL-renderer en DOM; hij controleert geen uiteindelijke pixels, geluid of hardwareprestaties. Visuele browser-QA was niet beschikbaar doordat de voorgeschreven browsertool ontbrak.

Dit is een eerste 3D-prototype: één klasse, één gebied, één korte verhaallijn, eenvoudige modellen en gevechts-AI. Nog geen sprongen, achtergrondmuziek, uitrustingskeuzes, grootschalige open wereld of extra dungeons.
