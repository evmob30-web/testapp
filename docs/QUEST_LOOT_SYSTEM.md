# Quest-, loot- en respawnsysteem

Deze wijziging staat op `feature/quest-loot-system`, bovenop Emberwild 1.10. De Pull Request is bedoeld om eerst te beoordelen. De bestaande `main` en live GitHub Pages-versie worden niet aangepast of automatisch gepubliceerd.

## Zelf spelen

Download of checkout deze branch en open `index.html`. De game blijft statisch en werkt ook op GitHub Pages, zonder build, backend, account, betaalde API of externe modellen. Bestaande classes, modellen, animaties, pantser, boogtraining, hoofdverhaal en Wortelgrotten blijven onderdeel van dezelfde game.

- **J** of **Quests**: questlog met actieve en voltooide opdrachten.
- **E** bij een NPC: praten; bij een lichaam: buit bekijken.
- **Klik op een verslagen vijand**: open zijn lootvenster wanneer je binnen 3,1 speleenheden bent.
- Klik op één item of **Alles verzamelen / Loot All**. Het venster sluit wanneer het lichaam leeg is.
- **I**: uitrusting, gevonden pantser, materialen en questitems.
- **Esc**: sluiten of pauzeren. Bestaande besturing blijft werken.

Jager Rowan staat ten oosten van het kampvuur, op `(12, 9)`. Zijn opdracht **De wolvenplaag** vraagt vijf wolventanden van grijze wolven. Drie onafhankelijke spawnplaatsen liggen in het oostelijke woud op `(22, 4)`, `(25, -5)` en `(18, -12)`. Ze zijn al zichtbaar zonder opdracht. Elke geldige dood heeft 60% kans op één questgebonden tand. Een mislukte worp is mogelijk; een nieuwe spawn biedt een nieuwe kans. Reguliere vachten, goud en eventuele uitrusting blijven ook zonder quest beschikbaar.

Bij vijf opgepakte tanden wordt de opdracht `READY_TO_TURN_IN`. Rowan toont een geel vraagteken en geeft bij inleveren precies één keer **250 XP en 50 goud**. De vijf tanden worden verbruikt. Wolven en hun reguliere buit blijven daarna respawnen.

## Bestandsverdeling

| Bestand | Verantwoordelijkheid |
| --- | --- |
| `js/adventure-data.js` | Originele item-, enemy-, loot table-, spawn-, NPC- en questdefinities. |
| `js/quest-system.js` | Pure queststatus, objectives, iteminventaris, afzonderlijke bindingen en beloningen. Geen DOM, opslag of timers. |
| `js/encounters.js` | Persistente enemy instances, unieke spawn-generaties, vaste corpse-loot, onafhankelijke respawnklok en claims. |
| `js/adventure-world.js` | Bestaande 3D-actoren koppelen aan instances, Rowan, NPC-indicatoren, lichamen, glinstering, raycastselectie en rondlopen. |
| `js/adventure-ui.js` | Questlog, tracker, materialen/questitems en het lootvenster. Alle inhoud komt uit definities en spelerstatus. |
| `js/game.js` | Adapter voor bestaande gevechten, invoer, NPC-gesprekken, inventory, HUD en opslaan. |
| `js/core.js` | Compatibele save-migratie, verhaalvlaggen en de nieuwe onafhankelijke vijandzichtbaarheid. |
| `js/loot.js` | Bestaande pantsersystemen; genereert nu ook uitrusting voor een lichaam en ontvangt die veilig in de reistas. |
| `js/forest-actors.js` | Gedeelde originele wolvengeometrie, grijze vachtvariant, death-animatie en herbruikbare ranger-NPC voor Rowan. |
| `js/thorn-guardian.js`, `js/grove-creatures.js` | Bestaande death-animaties kunnen hun ingestorte lichaam vasthouden tot het geloot of verlopen is. |
| `index.html`, `style.css` | Passende, schaalbare RPG-interface en lokale scriptvolgorde. |

De geometrie en materialen van wolven worden per vachtvariant gecachet. Rowan deelt de oorspronkelijke ranger-geometrie met eigen materialen, kort haar en een originele jagershoed. De bestaande boss-modellen blijven behouden. Een levende gevechtsactor verdwijnt direct uit targeting zodra hij dood is; zijn zichtbare lichaam blijft los daarvan in de scene. Nieuwe spawn-generaties kunnen daardoor nooit opnieuw op het oude lichaam worden aangevallen.

## Gegevens en opslag

De bestaande opslagsleutels en saveversie blijven geldig. Elke held in de bestaande drie personageslots krijgt twee extra, gevalideerde onderdelen:

```js
state.journal = {
  version: 1,
  sequence: 0,       // persoonlijke unieke TALK-/INTERACT-gebeurtenissen
  quests: {},       // per quest: status, objective-tellers en event-/lootreceipts
  inventory: {},    // gewone materiaalstapels
  questItems: {}    // aparte stapel voor questId + objectiveId
};
state.encounters = {
  version: 1,
  worldId: '...',
  clock: 0,
  seed: 123,
  spawns: {}        // per spawn: generatie, instanceId, HP, positie, dood en loot
};
```

De unieke instance-ID bevat wereld, spawn-ID en generatie. Elke bestaande en nieuwe spawn heeft één eigen status en deadline. Er worden geen `setTimeout`-ketens gestart. Een herhaalde update kan daardoor geen dubbele levende vijanden creëren.

Bij dood wordt de loot precies één keer samengesteld en opgeslagen. Het lichaam bevat eigen entry-ID's. Een pickup verwijdert de betreffende entry; opnieuw klikken of opnieuw openen kan haar niet nogmaals geven. Herladen herstelt dezelfde lijst, al verzamelde items blijven verdwenen en de timer behoudt de resterende tijd. Uitrusting in nog niet gelote lichamen reserveert haar UID, zodat latere uitrusting daarmee niet kan botsen.

De standaard respawn is **30 seconden speeltijd vanaf de dood**. Een niet leeggeloot lichaam verdwijnt standaard na 25 seconden; een leeg lichaam verdwijnt meteen. Respawn blijft op de oorspronkelijke 30-seconden-deadline. Een respawn krijgt volledige HP, een nieuwe instance-ID en een nieuwe lootmogelijkheid. Afzonderlijke spawnplaatsen lopen onafhankelijk. Instellingen staan in de data.

**Tijdkeuze:** pauze, gesprekken, questlog, lootvenster en inventaris pauzeren de spelklok, net als andere bestaande spelsystemen. Offline verstreken tijd telt niet mee. Herladen start de timer niet opnieuw. Deze eerste versie is singleplayer met lokale opslag; er is geen server of multiplayer-validatie. Bestaande bescherming tegen overschrijven door een verouderd tabblad blijft gelden.

Bestaande questvlaggen en eerder behaalde verhaalbeloningen blijven bewaard. Ze bepalen niet meer of een nieuwe vijand-instance zichtbaar mag zijn. Elins bestaande verhaal, kristallen, ingang, oefendoelen en verkenningsobjecten behouden hun eigen questvoorwaarden. Een vroeg verslagen Doornwachter blokkeert het verhaal niet: na de kristallen kun je het al behaalde resultaat inleveren.

## Questregels

Beschikbare statussen zijn `NOT_STARTED`, `ACTIVE`, `READY_TO_TURN_IN` en `COMPLETED`. Meerdere quests kunnen tegelijk actief zijn.

| Objective | Configuratie | Voortgang |
| --- | --- | --- |
| `KILL` | `enemyType`, `count` | Eén gebeurtenis per verslagen instance, alleen na acceptatie. |
| `COLLECT` | `itemId`, `count` | Aantal gewone items in de persoonlijke materiaalinventaris; bestaande voorraad mag meetellen. Bij inleveren worden ze verbruikt en worden andere COLLECT-doelen opnieuw berekend. |
| `QUEST_LOOT` | `enemyType`, `itemId`, `chance`, `count` | Alleen door het daadwerkelijk ophalen van een geldige, afzonderlijk gebonden loot-entry. |
| `TALK` | `npcId`, `count` | Een persoonlijk, uniek gesprek met die NPC. |
| `INTERACT` | `objectId`, `count` | Een succesvolle interactie met dat object. |

Bestaande NPC-gesprekken sturen TALK-events. Succesvol gebruikte kist, kristallen, heiligdom, kruiden, ingang/uitgang, wortelsleutel, deur en altaar sturen INTERACT-events. Een mislukte deurpoging of nogmaals geopende kist telt niet.

Questloot wordt uitsluitend gegenereerd wanneer quest én objective geldig zijn, de quest actief is, het juiste enemytype sterft en het vereiste aantal nog niet bereikt is. Daarna wordt de ingestelde kans toegepast: 0% geeft nooit loot, 100% geeft gegarandeerd loot. Bij pickup wordt de binding opnieuw gecontroleerd. Meer tanden oppakken dan nodig kan niet; klaarstaande oude loot wordt dan onbeschikbaar.

Een questitem kan niet via een gewone loot table in de materiaalinventaris terechtkomen. Elke questloot-entry bevat `questId` en `objectiveId`. Twee quests kunnen dezelfde wolf en hetzelfde itemtemplate gebruiken, maar ontvangen afzonderlijke entries en afzonderlijke stapels. Eén tand wordt nooit onbedoeld aan beide quests toegekend. KILL-voortgang is onafhankelijk van de vraag of een questitem dropt of wordt opgepakt.

NPC-indicatoren volgen de persoonlijke voortgang: geel `!` voor een nieuwe opdracht, grijs `?` voor een actieve opdracht en geel `?` voor inleveren. Bij meerdere opdrachten krijgt een in te leveren opdracht voorrang. Het NPC-venster biedt knoppen om tussen zijn opdrachten te kiezen.

## Uitbreiden met data

Voeg een itemtemplate, een loot table, een enemy definition en spawnrecords toe in `adventure-data.js`. De combatcode gebruikt het type en de actorstats; de lifecycle en lootregels hoeven niet te veranderen. De eerste nieuwe visuele enemy is de grijze wolf. Andere bestaande vijanden gebruiken hun bestaande modellen en aanvalspatronen met dezelfde nieuwe corpse-/respawnlifecycle. Een nieuw visueel model heeft uiteraard een renderer/actor nodig; een variant van een bestaand type kan die actor hergebruiken.

Voeg een quest toe aan de `quests`-lijst. De voorbeeldquest staat daar volledig als data. Een tweede opdracht voor dezelfde vijanden kan bijvoorbeeld zijn:

```js
{
  id: 'gray_wolf_hunt',
  title: 'Wolven langs het pad',
  description: 'Versla acht grijze wolven voor Jager Rowan.',
  giver: 'rowan', turnIn: 'rowan',
  objectives: [
    { id: 'wolves', type: 'KILL', enemyType: 'gray_wolf', count: 8,
      label: 'Grijze wolven' }
  ],
  rewards: { xp: 100, gold: 20 }
}
```

De HUD, questlog, Rowan-opties, indicatoren, savevalidatie en killprogress gebruiken die definitie automatisch. Deze extra quest is een configuratievoorbeeld en wordt niet als tweede productiequest meegeleverd. De browsertest voegt een vergelijkbare tweede definitie uitsluitend in haar testcontext toe om onafhankelijkheid van KILL- en QUEST_LOOT-voortgang te controleren.

De bestaande verhaallijn blijft in `core.js`; deze eerste uitbreiding migreert bestaande, verdiende verhaalresultaten niet naar nieuwe quest-ID's. De nieuwe engine is geschikt voor verdere dataquests en enemytypes zonder die verhaalvoortgang te wissen.

## Verificatie

```sh
node --test tests/*.cjs
# Start in een tweede terminal vanuit de projectroot:
python3 -m http.server 8780 --bind 127.0.0.1
# Met een geïnstalleerde Playwright-browser:
EMBERWILD_BASE_URL=http://127.0.0.1:8780/ node scripts/browser-start.cjs
# Alleen het nieuwe volledige questtraject:
EMBERWILD_BASE_URL=http://127.0.0.1:8780/ node scripts/browser-quest-loot.cjs
```

Met `EMBERWILD_CHROMIUM_PATH` kan een bestaande Chromium-installatie worden gebruikt. `--http-only` bij `browser-start.cjs` slaat uitsluitend het file://-gedeelte over voor beheerde browsers die directe lokale navigatie blokkeren. GitHub Actions voert de volledige test uit.

De 130 Node-tests omvatten de bestaande game en 18 extra controles voor kansen, vijf questtypes, meerdere quests, idempotentie, deadlines, reload, inventaristransfers, gear-UID's, gescheiden personages, echte liggende modellen, vaste loot en voltooiing met exact één beloning. De volledige 3D-gameplaytest blijft het oorspronkelijke hoofdverhaal, de grot, classes, magie, uitrusting en opslag uitvoeren met de gewijzigde zichtbaarheid.

De nieuwe Chromium-test voert echte NPC-acties, WASD-beweging, combat, klikselectie, loot per item, Loot All, vijf tanden, tracker, questlog, inleveren en herladen uit. Zij controleert ook een dood vóór acceptatie, geen retroactieve questloot, dubbele clicks, twee onafhankelijke quests en respawn na voltooiing. De loot-RNG krijgt een vaste testseed; de productiekans blijft werkelijk 60%. Voor het overslaan van wachttijd roept alleen de test de echte encounterklok met 30 seconden aan. De Node-tests controleren daarnaast de precieze 29,99/30-seconden-grens. Er worden geen debug- of testbedieningen in de productiegame ingebouwd.
