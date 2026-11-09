# Star Hopper — versie 0.2

Een originele eerste speelbare 2D-platformgame in Dromervelden. Help Nova, een klein wezen met grote oren, een blauwe sjaal en een lichtgevende ster, over zwevende eilanden naar het sterrenportaal.

## Starten

Open **index.html** in een recente browser (Chrome, Firefox, Edge of Safari). Geen installatie, internetverbinding, buildstap, backend of API nodig. Laat de mappenstructuur intact. Klik op ‘Begin het avontuur’ of druk op Enter.

Optioneel lokaal serveren: `python3 -m http.server 8000` vanuit deze map en open http://localhost:8000.

## Besturing

| Toets | Actie |
| --- | --- |
| A / D of links / rechts | Lopen |
| Spatie / W / omhoog | Springen; langer vasthouden voor een hogere sprong |
| Esc | Pauzeren / hervatten |
| R | Het hele level opnieuw beginnen |
| Enter | Starten / hervatten / opnieuw spelen vanuit een menu |

Op aanraakschermen verschijnen drie knoppen. Voor de prettigste ervaring op een telefoon: gebruik liggende weergave. De game pauzeert automatisch bij verlies van vensterfocus of wanneer je het tabblad verbergt.

## Doel en spelregels

Volg twaalf sterren langs twaalf eilanden naar het portaal rechts aan het einde. Alle sterren verzamelen is optioneel: het portaal is altijd beschikbaar. Na vallen begin je bij het eerste eiland en wordt de sterrenteller geleegd. Je totale speeltijd en aantal valpartijen blijven voor deze poging bewaard. R of ‘Opnieuw beginnen’ wist ook die cijfers. Het voltooiingsscherm toont het resultaat. Na een voltooid level worden je beste tijd en hoogste sterrenscore lokaal in deze browser bewaard. Deze records worden op het start-, pauze- en voltooiingsscherm getoond. Bij geblokkeerde opslag gelden ze alleen voor de huidige sessie. Gebruik ‘Geluid aan/uit’ bovenaan om de originele synthgeluiden te dempen; deze voorkeur wordt ook lokaal bewaard. Geluid start pas na een gebruikersactie. Er zijn geen trackers of externe audiodiensten.

## Publiceren op GitHub Pages

1. Maak een nieuwe GitHub-repository, bijvoorbeeld `star-hopper`.
2. Upload de **inhoud van deze map** naar de hoofdmap van de repository. `index.html` moet direct in de hoofdmap staan, met daarnaast `style.css` en `js/`.
3. Open **Settings → Pages**.
4. Kies bij **Build and deployment** de bron **Deploy from a branch**.
5. Kies branch **main**, map **/ (root)** en klik **Save**.
6. Wacht tot GitHub de deployment afrondt. De link staat op dezelfde pagina, meestal `https://JOUW-NAAM.github.io/star-hopper/`.

Alle bronverwijzingen zijn relatief, dus ook een GitHub Pages-projectpad werkt. `.nojekyll` voorkomt onnodige Jekyll-verwerking. Publicatie naar een account is niet uitgevoerd.

## Bestanden

- `index.html` — Canvas, sterrenteller, menu’s en toegankelijke HTML-knoppen.
- `style.css` — responsieve 16:9-weergave, interface en aanraakknoppen.
- `js/level.js` — platform-, ster-, start- en portaaldata.
- `js/physics.js` — beweging, zwaartekracht, variabele sprongen, 110 ms coyote time, 130 ms jump buffering en botsingen.
- `js/renderer.js` — originele procedurele pixelgraphics, Nova’s vier animatietoestanden, luchtlagen, wolken, eilanden, portaal en effecten.
- `js/audio.js` — zachte Web Audio-geluiden voor springen, landen, sterren en het portaal; met dempvoorkeur.
- `js/records.js` — beste tijd en sterrenscore in localStorage, met veilige terugval naar sessiegeheugen.
- `js/game.js` — invoer, vaste simulatiestap, begrensde vloeiende camera, spelstatus, HUD en deeltjes.
- `tests/*.test.cjs` — automatische fysica- en spelcyclustests met Node.js.

## Techniek en uitbreiden

De interne Canvas-resolutie is 960 × 540 en schaalt proportioneel met het venster. De simulatie gebruikt 120 vaste stappen per seconde, met begrensde inhaaltijd. De renderer gebruikt requestAnimationFrame; er zijn maximaal 120 kortlevende deeltjes. Canvas-glow wordt gericht gebruikt voor sterren en het portaal.

`drawNova(context, player, time)` is de plek om later spritesheets in te voegen. De speler levert `animation` (`idle`, `run`, `jump`, `fall`) en `facing` aan. Graphics en leveldata zijn onafhankelijk van de fysica. Het project gebruikt klassieke scripts, zodat openen via `file://` werkt zonder ES-module/CORS-problemen.

## Controles

Met Node.js 18 of nieuwer, vanuit de projectmap:

```sh
node --test tests/*.cjs
```

Tien tests geslaagd: stabiel landen, alle elf opeenvolgende levelsprongen, variabele spronghoogte en geen herhaalsprong bij vasthouden, coyote time en buffering, zij-/onderbotsingen en wereldgrenzen, plus starten/pauzeren/sterren/vallen/portaal/herstarten, blijvende records, geblokkeerde of beschadigde opslag en audiostart/dempen. De integratietest gebruikt een nagebootste DOM en Canvas-context; dit controleert uitvoering en spelstatus, niet de uiteindelijke pixels. JavaScript-syntax is ook gecontroleerd. Visuele controle in een echte browser is niet uitgevoerd: de voorgeschreven browsertool was in de ontwikkelomgeving niet beschikbaar.

Geen externe assets, fonts, libraries of betaalde diensten. Geen extra werelden of complexe systemen.
