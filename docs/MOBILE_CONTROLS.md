# Mobiele besturing en automatische interactie

Emberwild gebruikt dezelfde Three.js-wereld, personages, animaties, opslag, botsingen en gevechtsfuncties op pc, telefoon en tablet. Deze uitbreiding staat op `feature/quest-loot-system`. `main` en de productiepagina worden niet rechtstreeks aangepast.

## Spelen

Open de game in een recente browser met WebGL. Op een telefoon of tablet verschijnt de touchinterface automatisch. Liggend spelen geeft het meeste zicht; staand spelen blijft mogelijk. Onder **Pauze → Besturing** of op het startscherm kies je **Automatisch**, **Touch** of **Toetsenbord & muis**. Deze voorkeur wordt alleen op dit apparaat opgeslagen, los van de personages.

De detectie combineert Pointer Events, `maxTouchPoints`, mediaqueries voor grove/fijne invoer en hover, schermgrootte en waar beschikbaar `userAgentData.mobile`. Een iPad met desktopidentiteit wordt ook herkend. Een laptop met touch en een muis houdt aanvankelijk de pc-interface; een aanraking kan in de automatische modus touch activeren. Toetsenbord en muis blijven ook met de touchinterface bruikbaar.

| Bediening | Actie |
| --- | --- |
| Joystick linksonder | Camera-afhankelijk lopen in alle richtingen. Verder uitslaan loopt sneller; aan de buitenrand ren je. Loslaten stopt direct. |
| Vrije rechterdeel vegen | Camera draaien en kantelen binnen de bestaande grenzen; tegelijk lopen blijft mogelijk. |
| Twee vingers op het cameravlak | In- of uitzoomen binnen het bestaande zoombereik. |
| NPC of diens questsymbool aantikken | Selecteren, zo nodig om obstakels heen lopen en binnen praatbereik het gesprek openen. |
| Levend doelwit aantikken | Selecteren; de ring en de bestaande vijandbalk geven het doelwit aan. |
| Aanval / vaardigheid | De bestaande aanval uitvoeren; zo nodig eerst naar een vrije positie binnen bereik lopen. |
| Aanval vasthouden | Zwaard/staf herhalen volgens de bestaande cooldown. Bij een boog spannen en bij loslaten schieten; de knop toont de lading. |
| Boogaanval kort aantikken buiten bereik | Eerst benaderen, daarna één geladen schot. Een nieuwe opdracht of handmatig lopen annuleert dit automatische schot. |
| Lichaam aantikken / Buit | Naar een geldig lichaam lopen en de bestaande buitlijst openen. Pak een afzonderlijk item of **Alles verzamelen**. |
| Gebruik | Geselecteerde NPC/voorwerp benaderen, of de bestaande interactie dichtbij uitvoeren. |
| Doelwit | Door levende vijanden binnen 32 speleenheden wisselen; een aanval start pas via de aanvalsknop. |
| Rol, Drank, Barrière, Blink | De bestaande acties uitvoeren met dezelfde beschikbaarheid, mana en cooldowns. |
| Bovenste knoppen | Wapen wisselen, kaart, pauze, geluid, questlog en inventaris. |

Emberwild heeft een ontwijkrol en geen sprongmechaniek; de bestaande rol staat daarom op de touchinterface. Vooruitgang en alle pc-sneltoetsen blijven behouden. Questdialogen, individuele buitregels, uitrusting, handel, personageslots en de creator gebruiken gewone aanraakbare knoppen. Menu's kunnen normaal worden gescrold.

## Eén navigatie- en interactiesysteem

`js/navigation.js` bevat een renderer-onafhankelijke A*-routezoeker en een gedeelde controller. `js/interaction-targets.js` vertaalt de echte wereldobjecten naar NPC-, vijand-, lichaam-, oefendoel- en voorwerpdoelen. `js/game.js` verbindt deze met de bestaande `interact`, aanvallen, boog, spreuken en bewegingsbotsingen. Er is geen tweede combatsysteem en de navigatie teleporteert niet.

De controller gebruikt `IDLE`, `MOVING_TO_TARGET`, `INTERACTING`, `ATTACKING` en `CANCELLED`. Iedere opdracht bevat de sleutel en identiteit van één doel. Een nieuwe selectie vervangt de vorige opdracht. De opdracht wordt vóór de interactiecallback vrijgegeven, zodat een geopend dialoog- of lootvenster niet een tweede keer wordt geopend. Een aanval wacht zo nodig op de bestaande cooldown.

Routes respecteren de bestaande cirkelbotsingen in de vallei en `EmberDungeon.canStand` in de grot, inclusief gesloten deuren. De spelerstraal is dezelfde 0,55 als bij handmatig bewegen. De route wordt gecontroleerd tussen rasterpunten en vlak vóór iedere automatische bewegingsstap; diagonalen mogen geen hoeken afsnijden. De bestemming is een geldige positie binnen interactie-/aanvalsbereik, niet het midden van het model. Aanvallen en gewone interacties vereisen tevens de bestaande vrije zichtlijn. Lichamen volgen het bestaande lootbereik; de gesloten worteldeur is zelf een obstakel en blijft vanaf zijn voorkant te gebruiken.

Een ruimtelijke index en gecachete begaanbaarheid beperken werk per zoekactie. Het raster gebruikt stappen van 0,75 en maximaal 9.000 uitgebreide knopen per route. Verplaatste doelen krijgen pas na minimaal 0,7 seconde en meer dan één eenheid verplaatsing een nieuwe route. Een vastgelopen speler stopt na 2,2 seconden; achtervolgingen duren hoogstens 18 seconden, overige opdrachten 40 seconden. Na meer dan 18 routeplannen stopt een opdracht ook. Een onbereikbaar doel geeft een melding in plaats van eindeloos zoeken.

Automatisch lopen stopt bij joystick- of looptoetsinput, een nieuwe selectie, **Stop**, een lege plek aantikken, een menu, gebieds-/personagewissel, nederlaag of ongeldige bestemming. Schade onderbreekt een niet-gevechtsinteractie. Aanvalsorders blijven tijdens het gebruikelijke gevecht geldig, maar kunnen altijd handmatig worden gestopt. Verdwenen modellen, een ander gebied en een nieuwe spawn-generatie maken een eerdere selectie ongeldig.

Nieuwe questobjecten kunnen via dezelfde `register(key, definition)`-methode worden toegevoegd. Een definitie levert `kind`, `label`, `interactionId`, `range`, `position()`, `valid()`, `objects()` en eventueel `identity()`. De queststatus hoort in `valid()`; een interactie wordt pas door de bestaande gameplaycode uitgevoerd nadat de gedeelde controller het bereik heeft gecontroleerd.

## Loot en quests

De bestaande encounter- en questmodules blijven eigenaar van loot, itemontvangsten en voortgang. De touchregistratie gebruikt `EmberEncounters.available`, de bestaande questzichtbaarheid en de identiteit van het oorspronkelijke lichaam. Daardoor verschijnen toekomstige questitems niet eerder, kan een lichaam niet tweemaal uitgeven en kan een verlopen lichaam geen lootvenster openen. Het bestaande lootvenster werkt de tracker na een item direct bij.

De gouden uitroeptekens en vraagtekens behouden hun bestaande donkere contour, gloed en schermgroottebegrenzing. Aantikken van een NPC-symbool selecteert dezelfde NPC als diens lichaam. Het symbool houdt geen afzonderlijke, concurrerende interactie bij. De selectiering staat op de grond en gebruikt de werkelijke doelpositie.

## Schermen en prestaties

Joystick, camera en actieknoppen hebben onafhankelijke Pointer-ID's. `pointercancel`, verloren pointercapture, focusverlies en menu's ruimen vastgehouden invoer op. Compatibility-clicks worden onderdrukt zodat een aanraking geen tweede aanval veroorzaakt. Gameplayvlakken gebruiken `touch-action: none`; menu's behouden normale scrollinteractie.

De interface gebruikt de browser-safe-areas en de actuele canvasmaat, inclusief dynamische viewportwijzigingen. Telefoons hebben compacte knoppen, tablets grotere. HP, mana en een compacte questtracker blijven zichtbaar. De volledige lijst staat onder **Quests**; de kaart kan worden opengeklapt. Knopnamen zijn op touch verkort, bijvoorbeeld **Drank** en **Rol**. Een vrijblijvend bericht raadt landscape aan, zonder portretstand te blokkeren.

Mobiel wordt de renderer-pixelratio begrensd op 1,2 voor telefoons en 1,35 voor tablets, en de bestaande zon-schaduwkaart op 512. Pc behoudt zijn bestaande grens van 1,6 en 1024. Dit verlaagt de tekenlast; daadwerkelijke snelheid hangt af van apparaat, browser en hardwareversnelling.

## Tests uitvoeren

Zonder dependencies:

```sh
node --test tests/*.cjs
```

De nieuwe unittests controleren routes rond gebouwen, hoeken, dunne muren, kerkerdeuren, onbereikbare doelen, annuleringsgevallen, generaties, cooldowns en verplaatste doelen. Ook detectie, joystickrichtingen, onafhankelijke pointers, dezelfde actie met twee vingers, dubbele clicks, veilige resets en echte quest-/lichaamzichtbaarheid worden gecontroleerd. De bestaande pc-integratietest laadt de nieuwe modules en doorloopt dezelfde game.

Voor browsertests installeer je Playwright in je lokale testomgeving, start je vanuit de repository een statische server en draai je in een tweede terminal de test:

```sh
npm install --no-save playwright
npx playwright install chromium
python3 -m http.server 8765 --bind 127.0.0.1
```

```sh
node scripts/browser-start.cjs --mobile-only
```

`EMBERWILD_BASE_URL` kan naar een andere lokale poort wijzen. `EMBERWILD_CHROMIUM_PATH` kan naar een aanwezige Chromium-/Chrome-installatie wijzen. Zonder deze variabele gebruikt de volledige runner Playwrights browser. De afzonderlijke Chromium-helpers vallen terug op `/usr/bin/chromium`.

De volledige `node scripts/browser-start.cjs` voert zowel de bestaande pc-controles als de mobiele scenario's uit en controleert ook direct openen van `index.html`. GitHub Actions bewaart screenshots als artifact. `--http-only` slaat alleen de direct-openencontrole over op beheerde machines die `file://` blokkeren.

WebKit kan afzonderlijk worden uitgevoerd als de browser en systeemlibraries aanwezig zijn:

```sh
npx playwright install webkit
node scripts/browser-mobile-webkit.cjs
```

Optioneel wijst `EMBERWILD_WEBKIT_PATH` naar een bestaande compatibele WebKit-startwrapper. Dit is uitsluitend een testinstelling.

## Uitgevoerde mobiele scenario's en grenzen

De Chromium-test gebruikt een Android-telefoonprofiel met native CDP-touchinput en onafhankelijke vingers. Hij controleert acht joystickrichtingen, stoppen, tegelijk lopen/camera draaien, NPC-selectie op afstand, routes, dialoog, questacceptatie, echte aanvallen op wolven, blijvende lichamen, individuele questloot, alles verzamelen, onmiddellijke trackerupdates en inleveren bij Rowan. De test vecht daadwerkelijk en verzamelt tien tanden. Tussen gevechten wordt uitsluitend de bestaande respawnklok versneld om geen minuten per respawn te wachten. Questvoortgang wordt niet rechtstreeks ingevuld.

Aanvullende Chromium-profielen controleren een nieuwe Magiër in portretstand, een tablet in beide oriëntaties, barrière/drank/Blink, gelijktijdige joystick en spreuk, native menu-interactie, een geladen trainingspijl, gesloten en geopende worteldeur, een verdwijnend lichaam, de handmatige instelling en toetsenbord/muis terwijl touch beschikbaar blijft.

De afzonderlijke Linux-WebKit-test gebruikt iPhone- en iPad-profielen, echte WebGL en native touchscreen-taps voor NPC's, questacceptatie, spreuken en menu's. Joystick- en veegpaden worden daarin met Pointer Events aangeboden: Playwrights publieke WebKit-touchscreen-API ondersteunt alleen taps. Chromium controleert die bewegingen wel met native multitouchinput.

**Er zijn geen fysieke Android-telefoons, iPhones of iPads en geen Safari op een echt iOS-apparaat getest.** Browseremulatie bewijst geen apparaatframerate, thermisch gedrag of alle browserbalk-/safe-area-varianten. Test daarom de featurebranch ook op echte apparaten voordat je deze naar productie brengt. Er is geen afzonderlijke openbaar gehoste featurepreview ingesteld; de bestaande GitHub Pages-publicatie volgt `main`.
