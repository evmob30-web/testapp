# Questnavigatie

Open **Quests** (op pc ook **J**) en kies **Volgen** bij een actieve opdracht. Het kompas toont de quest, de huidige handeling, een pijl, afstand in speleenheden en de windrichting. De pijl wijst ten opzichte van de werkelijke camera: bij cameradraaien blijft hij naar hetzelfde doel wijzen. De afstand is de rechte afstand tot het doel, geen berekende looproute. Tik of klik op het kompas om terug te gaan naar het questlog.

Bij het doel staat een gouden grondring met vier punten en een klein zwevend kristal. De markering gebruikt één herbruikbaar model en beweegt mee met een geselecteerde vijand. Een verdwenen of vervangen instantie verliest zijn markering direct. Het markeringsmodel blokkeert geen camera, botsing, NPC-selectie of questsymbool.

In het questlog kun je **Toon kompas en doelmarkering** uitschakelen. Je selectie blijft bewaard. **Volgen** maakt de aanwijzer weer zichtbaar. De keuze en zichtbaarheid worden per personage opgeslagen; oude saves krijgen automatisch veilige standaardwaarden.

## Opdrachten en voortgang

Alleen aangenomen opdrachten die nog lopen of ingeleverd kunnen worden, zijn te volgen. Beschikbare vervolgquests krijgen geen bestemmingsmarkering. Zonder actieve quest verdwijnt de aanwijzer. De eerste actieve quest wordt automatisch gevolgd als er nog geen geldige keuze is. Een nieuwe quest vervangt een bestaande geldige keuze niet. Na afronden kiest het systeem een andere reeds actieve quest, of verbergt het zich als er geen meer zijn.

| Opdracht | Huidig doel |
| --- | --- |
| Het pad van de Vonk | Nog benodigde schemerwolven, overgebleven kristallen, Doornwachter of Elin, op basis van de bestaande fase. |
| De Wortelgrotten | Ingang → Sporenwachter → sleutel → deur → Wortelmoeder → amulet → uitgang → Elin. |
| Boogtraining | Een nog niet geraakt doel; na drie geladen treffers Elin. |
| De vermiste kruidenzoeker | Tovin; na redden Mira. |
| De wolvenplaag | Grijze wolf of een lichaam met daadwerkelijk beschikbare wolventand; na tien tanden Rowan. |
| Lyra’s lessen | Het oefenkristal, de barrièrekring of de juiste Blink-rune; na iedere les Lyra. |
| De Gebroken Vonk | Vael tijdens de geaccepteerde opdracht; na verslaan Lyra. |

Een geselecteerd doel blijft stabiel zolang het geldig is. Een andere wolf die iets dichterbij komt, laat de markering daardoor niet heen en weer springen. Echte questbuit krijgt voorrang boven een nieuw gevecht. Een lichaam zonder de benodigde tand wordt niet als questbuit aangewezen. Als de wolven dood zijn en geen bruikbare buit overblijft, verschijnt een wachthint zonder een fictieve bestemmingsmarkering. Bij respawn verschijnt weer een geldig doel.

Voor een doel in de vallei terwijl je in de grot bent, wijst het kompas eerst naar de uitgang. De kerkerquest wijst vanuit de vallei eerst naar de ingang. Binnen de grot blijven de bestaande sleutel- en deurvolgorde gelden.

Het kompas bestuurt de speler niet. De eerder gebouwde tap-interacties en navigatie blijven verantwoordelijk voor automatisch lopen, obstakels en acties binnen bereik. Quests worden niet automatisch aangenomen of ingeleverd.

## Interface en techniek

Op mobiel toont de compacte questtracker de gevolgde opdracht. Alle andere actieve opdrachten blijven in het questlog te vinden. Pc behoudt de bestaande informatie en krijgt het kompas erbij. De weergave houdt ruimte vrij voor gezondheid, mana, vijandbalk, joystick en actieknoppen, ook in korte landscape-vensters.

- `js/quest-guide.js` leest de bestaande RPG- en journalstatus en kiest uitsluitend geldige doelen. Het wijzigt geen questvoortgang, buit, beloningen of gevechtsregels.
- `js/quest-guide-view.js` toont het kompas en het ene wereldmodel. De pijl gebruikt vloeiende rotatie over de kortste hoek; bewegende doelen worden iedere frame uit het bestaande doelregister gelezen.
- `js/core.js` bewaart `questGuide: {version: 1, trackedId, enabled}` in de bestaande personagesave.
- `js/adventure-ui.js`, `js/game.js`, `index.html` en `style.css` koppelen de selectie, tracker en instellingen aan de bestaande game.

Er is geen nieuwe pathfindinglus, physics of backend toegevoegd. De questplanning loopt met de bestaande HUD-update, maximaal ongeveer 12,5 keer per seconde. Het bewegende wereldpunt en de camera-afhankelijke pijl worden per frame bijgewerkt. Geometrie en materialen worden hergebruikt en tekst wordt alleen herschreven wanneer deze verandert.

## Controles

```sh
node --test tests/*.cjs
```

De nieuwe tests doorlopen echte questregels voor verzamelen, questloot, inleveren, alle lesfasen, de kerker, Tovin en boogtraining. Ze controleren ook verborgen vervolgquests, verkeerde classes, verdwenen lichamen, respawns, stabiele doelkeuze, camerahoeken, actuele doelposities, oude saves en onafhankelijke personageslots.

Met Playwright en een statische server op `127.0.0.1:8765`:

```sh
node scripts/browser-start.cjs --quest-guide-only
```

De aparte browsercontrole gebruikt echte muis-/toetsenbordinvoer en native CDP-touchinput. Hij kiest tussen twee actieve quests, verzamelt daadwerkelijk een kristal, controleert direct de nieuwe bestemming Elin en test verbergen, opnieuw inschakelen en herladen. Hij meet overlap met bestaande controls op pc, telefoonportret, telefoonlandscape (ook 667 × 320) en tablet. Screenshots komen in `/tmp/emberwild-guide-*.png` en in het screenshot-artifact van GitHub Actions.

De volledige Chromium-browsercontrole bevat daarnaast het bestaande Rowan-traject met echte gevechten en loot. Daar wordt nu ook gecontroleerd dat tien tanden meteen naar Rowan wijzen en inleveren de bestemmingsmarkering verwijdert. De optionele WebKit-test controleert de aanwijzer en het instellingsvak met native taps in iPhone-/iPad-profielen.

Voor testen op een echte telefoon in hetzelfde lokale netwerk kun je vanuit deze branch een statische server starten die bereikbaar is via je computeradres:

```sh
python3 -m http.server 8765 --bind 0.0.0.0
```

Open op de telefoon `http://<lokaal-ip-van-je-computer>:8765/`. De bestaande browser-/pc-instructies met `127.0.0.1` zijn alleen vanaf de testcomputer zelf bereikbaar. Een statische publicatie via GitHub Pages werkt eveneens.

Er zijn geen fysieke Android- of iOS-apparaten beschikbaar in deze testomgeving. Chromium-apparaatprofielen en Linux WebKit zijn browsercontroles; zij bewijzen geen framerate of alle browserbalk-/safe-area-varianten op echte hardware. WebKit gebruikt native taps en gesimuleerde Pointer Events voor veegpaden. Zie ook [mobiele besturing](MOBILE_CONTROLS.md).
