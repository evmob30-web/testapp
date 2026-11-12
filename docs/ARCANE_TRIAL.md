# De Gebroken Vonk

Een Mage-vervolgquest in de bestaande Schemervallei, op `feature/quest-loot-system`. Er zijn geen nieuwe werelden, externe assets, achtergrondaudio, services of afhankelijkheden toegevoegd.

## Spelersroute

1. Rond Lyra’s drie lessen af en bereik niveau 3.
2. Accepteer **De Gebroken Vonk** bij Lyra. Vael en zijn arena op (-26, 3) verschijnen nu. De route loopt vanaf het oefenkristal langs de westelijke bosrand naar het noorden.
3. Ontwijk zijn vooraf vastgelegde sterrenlans of vang hem op met de barrière. Verlaat de oranje breukkring met Blink of door te lopen. Gebruik zijn herstelmomenten om aan te vallen.
4. Versla Vael en keer terug naar Lyra. Je ontvangt eenmaal 180 XP, 40 goud en de automatisch uitgeruste Sterrenweversstaf. Via I kun je tussen beide staven kiezen.

| Aanval | Waarschuwing | Schade vóór pantser/barrière | Herstel |
| --- | --- | --- | --- |
| Sterrenlans | 1,15 s, vaste baan met randen en pijlen | 26 | 1,8 s |
| Breukkring | 1,65 s, vaste cirkel bij je gemarkeerde positie | 40 | 4,2 s |

Vael heeft 520 gezondheid. De sterrenlans controleert een begrensd lijnsegment van 12 eenheden en 1,05 eenheid straal. De zichtbare baan is 2,1 eenheden breed. De breukkring heeft straal 3,1; bij schade wordt ook de lichaamsstraal meegerekend. De waarschuwingspositie volgt de speler na het aankondigen niet meer. Er zijn alternatieven voor de spreuken: opzij lopen en rollen blijven bruikbaar.

## Voortgang, beloning en herstel

De quest gebruikt de bestaande class-/niveau-/questvoorwaarden en een gewoon KILL-doel. De boss gebruikt de bestaande opgeslagen spawn en gezondheid. Het type `arcane_echo` levert geen losse kill-XP, geld, items of gear op: alleen het eenmalige inleveren geeft de beloning. Zijn model verdwijnt na de overwinning. Een onderliggende spawnrespawn kan hem niet zichtbaar maken zodra de quest READY_TO_TURN_IN of COMPLETED is.

Pauze en menu’s stoppen de aanvalsklok. Tijdens herladen blijven queststatus en gezondheid behouden; lopende aanvallen worden vervangen door een nieuwe aanlooptijd van 1,8 seconde. Dat voorkomt schade uit een waarschuwing die de speler niet heeft gezien. Terugtrekken tot meer dan 9 eenheden afstand of een nederlaag herstelt Vael volledig en verwijdert alle waarschuwingen. Je mag de geaccepteerde opdracht opnieuw proberen.

De staf is een classwapen, net als de bestaande staf en trainingsboog, en gebruikt geen armorplaats of ruimte in de reistas. Eigendom volgt uit de afgeronde quest; de opgeslagen `staffId` bepaalt welke van de twee je hebt uitgerust. Onbekende of niet vrijgespeelde staf-ID’s vallen terug op de basisstaf. De bonus is precies +12 spreukschade en beïnvloedt geen zwaard- of boogschade. Bestaande saves krijgen de basisstaf als standaard. Classes en personageslots behouden hun eigen voortgang.

## Model en terrein

Vael gebruikt het bestaande vervormbare personageskelet met een eigen masker, kroon, kristalpantser, hartkristal, gebroken halo en geanimeerde runen. De voeten blijven op de grond. Het stafmodel heeft een eigen zichtbare maankroon en kristalvleugels; spreuken vertrekken uit het actuele kristal, ook na uitrusten of een ander uiterlijk kiezen.

De oorspronkelijke grondmesh en gekleurde grasvlakken blijven intact. De boomgenerator maakt alleen ruimte rondom de nieuwe arena en verbruikt dezelfde randomwaarden als voorheen. Waarschuwingsvlakken liggen duidelijk boven de grond, schrijven niet naar de depthbuffer en hebben geen strepen- of ruis-shader. De lijnranden en cirkelrand liggen afzonderlijk boven hun vulling.

## Bestanden en controles

`js/arcane-trial.js` bevat de pure aanvalstoestand, trefferregels, het bossmodel en de arena-adapter. `js/adventure-data.js` definieert quest en spawn. `js/core.js` bepaalt stafbezit en de vaste bonus. `js/mage.js` verzorgt de wapenvariant. `js/game.js` verbindt echte schade, bestaande projectielen, beloning en inventaris. `js/adventure-world.js` respecteert de questgebonden zichtbaarheid naast de bestaande permanente vijanden.

```sh
node --test tests/*.cjs
node --check js/arcane-trial.js
node --check js/game.js
python3 -m http.server 8765 --bind 127.0.0.1
# Tweede terminal met Playwright:
node scripts/browser-arcane-trial.cjs
node scripts/browser-start.cjs
```

`EMBERWILD_BASE_URL` en `EMBERWILD_CHROMIUM_PATH` kunnen de lokale URL en geïnstalleerde browser instellen. De gerichte browsercontrole begint met een personage dat de bestaande lessen heeft voltooid. Daarna gebruikt zij echte gesprekken, looptoetsen, barrière, Blink, projectielen en de inventaris voor de volledige vervolgquest. Alleen tussenliggende GPU-tekenbeurten worden overgeslagen. Zij controleert pauze, herladen, terugtrekken, overwinning, eenmalig inleveren, wisselen van staf en outfit, opslag en scheiding tussen classes. De volledige browserworkflow bevat deze controle en de eerdere opleiding, plus bestaande gevechten, quests, terrein, wolven, questsymbolen en direct openen van index.html.

Screenshots staan als `/tmp/emberwild-vael-*.png` en `/tmp/emberwild-starweaver-equipped.png` bij de testresultaten.
