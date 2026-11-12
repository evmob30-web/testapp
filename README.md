# Emberwild — De Gebroken Vonk · reviewbranch


Deze branch **`feature/quest-loot-system`** voegt **De Gebroken Vonk** toe: een vervolgquest na Lyra’s drie magielessen, met de originele miniboss **Vael** en de uitrustbare **Sterrenweversstaf (+12 spreukschade)**. [Quest, aanvallen, beloning en controles](docs/ARCANE_TRIAL.md). Magische barrière op niveau 2 en Blink op niveau 3 zijn onderdeel van de bestaande opleiding. Beoordeel de nieuwe Pull Request voordat je deze uitbreiding met `main` samenvoegt. [Magieopleiding, spreukregels en controles](docs/MAGE_TRAINING.md). Het bestaande quest-, corpse-loot- en respawnsysteem blijft beschikbaar. [Volledige uitleg, bestandsverdeling, data-configuratie, opslagregels en testinstructies](docs/QUEST_LOOT_SYSTEM.md).

Ga naar **Jager Rowan**, ten oosten van het kampvuur. **De wolvenplaag** vraagt tien wolventanden van de al rondlopende grijze wolven (60% dropkans). Open een lichaam met een klik of **E**, pak een item of **Alles verzamelen**, volg de quest met **J** en lever bij Rowan in voor eenmalig **250 XP en 50 goud**. Dieren keren onafhankelijk na **120–180 seconden speeltijd** terug; monsters en eindbazen gebruiken hun eigen instelbare bereik. De wachttijd wordt eenmaal bij de dood gekozen. Opdrachtstatus, materiaal/questinventaris, vaste loot en resterende respawntijd worden per personage opgeslagen. Menu's, gesprekken en offline tijd pauzeren deze klok. De NPC-symbolen volgen direct de actuele queststatus. Het terrein is hersteld met één gesloten oppervlak; de oorspronkelijke groene vlakken en het gele pad blijven behouden. [Oorzaak en terreincontroles](docs/TERRAIN_FIX.md).

Een originele singleplayer-actie-RPG in 3D: de Schemervallei met een dorp, bos en ruïne, plus de Wortelgrotten met drie verbonden kamers. Versie 1.10 bevat vernieuwde Bosgeesten en een vernieuwde Wortelmoeder, een volledig vernieuwde Doornwachter, vernieuwde Bram, Mira en Tovin, een vernieuwde Elin, geanimeerde schemerwolven, drie personageslots met eigen voortgang, drie classes, een character creator, zichtbare pantseruitrusting, zwaardcombo’s, tactische vijanden en willekeurige buit met zeldzaamheden. De speler gebruikt twee originele GLB-modellen met heroïsche lichaamsverhoudingen, een gevormd gezicht, gebeeldhouwde haarlokken, gelaagde bepantsering en schilderachtige materialen op een vervormbaar skelet. Alle personages, modellen en verhalen zijn eigen werk. Three.js verzorgt WebGL; er worden geen Warcraft-assets gebruikt.

Quest-NPC's hebben grote, gefacetteerde gouden symbolen met een donkere rand en zachte gloed. De symbolen blijven op afstand leesbaar en hangen boven hun naamplaatje. Een lopende opdracht toont een zilvergrijs vraagteken; inleveren een gouden vraagteken. [Vormgeving en zichtbaarheid](docs/QUEST_MARKERS.md).

## Starten

Open `index.html` in een recente desktopbrowser met WebGL/hardwareversnelling. Geen installatie, backend, account, externe API of buildstap nodig. Three.js wordt lokaal meegeleverd. Ook geschikt voor GitHub Pages op een subpad. De game is bedoeld voor toetsenbord en muis op een laptop of desktop; er is nog geen mobiele besturing.

## Bosgeest en Wortelmoeder — versie 1.10

De Bosgeest heeft een zwevend, hol wortellichaam met een lichtgevende zaadkern, uitgesneden masker, bladkroon, gelaagde mantel en drie meebewegende wortelstaarten. Hij ademt, zweeft en bereidt zijn schot met een armgebaar en feller licht voor. Dezelfde geestenfamilie verschijnt als Sporenwachter in de Wortelgrotten.

De Wortelmoeder heeft een eigen silhouet met zes wortelpoten, paddenstoelschouders met lichtende sporen, een bloem rond de groene kern en een hoge bladerkroon. De steunpoten blijven bij lopen op hun plek staan. Bij **Zaadsalvo** opent de bloem en kleurt de kern violet; bij **Wortelslag** gaan de armen omhoog en komen de klauwen op het bestaande schademoment omlaag. Bladeren, wortelvingers, terugslag en de tijdelijke instorting animeren afzonderlijk.

Beide modellen worden origineel en lokaal opgebouwd in `js/grove-creatures.js`. De Bosgeest gebruikt 48 botten en 32.012 driehoeken; de Wortelmoeder 66 botten en 63.170 driehoeken. Elk gebruikt zes materiaalbatches met gedeelde geometrie en een gecachete houtnerftextuur; veranderlijke materialen en botten zijn per instantie gescheiden. De animaties verplaatsen de logische vijand niet. Pauze bevriest de animaties, en verslaan levert direct XP en verhaalvoortgang op; goud en voorwerpen verzamel je via het lootvenster. Het tijdelijke visuele model wordt automatisch opgeruimd of bij wisselen gewist.

De **Schildwacht is verwijderd**. De boogtraining bestaat uit de drie oefendoelen en blijft volledig speelbaar. Eerdere overwinningen op de Schildwacht blijven in oude opslag bewaard, evenals goud, XP, voorwerpen, classes en questvoortgang. Het opslagformaat is ongewijzigd.

[Voorbeeld Bosgeest](assets/previews/bosgeest.png) · [Voorbeeld Wortelmoeder](assets/previews/wortelmoeder.png). Deze beelden tonen de echte modellen naast de speler; je hoeft een voltooide save niet opnieuw te beginnen om ze te bekijken.

## Doornwachter — oorspronkelijk eindbaasmodel

De Doornwachter heeft sinds versie 1.9 een eigen vervormbaar model: een doorlopende stam met gelaagde schors en wortelribben, een verzonken amberkern, uitgesneden gezicht, doornige takkenkroon, mos, bladeren, afzonderlijke wortelvingers en brede wortelvoeten. Zijn schors heeft een originele 512 × 512 houtnerfkaart met reliëf. Zowel de geometrie als de textuur worden lokaal en reproduceerbaar opgebouwd in `js/thorn-guardian.js`; er zijn geen externe modellen of downloads nodig.

Het model gebruikt 44 botten en zes samengevoegde materiaalvlakken. Geometrie en houtnerf worden gedeeld; skelet en veranderlijke materialen horen bij de afzonderlijke instantie. Afstandsafhankelijke stappen houden de steunvoeten op de grond. De bestaande 1,15 seconde voorbereiding tilt beide armen op; op het bestaande schademoment slaan de klauwen omlaag en springen schorsdeeltjes weg. Kleine reacties op treffers herstellen vloeiend. Pauze bevriest ook deze animaties.

Bij verslaan volgen XP en verhaalvoortgang direct; goud en voorwerpen blijven in het lootbare lichaam. De logische vijand wordt direct niet meer aanvalbaar. Zijn bestaande instorting blijft zichtbaar als lootbaar lichaam tot het looten of verlopen. De Doornwachter is onafhankelijk van de hoofdopdracht zichtbaar en krijgt dezelfde onafhankelijke respawnlifecycle. Gezondheid, schade, bereik, aanvalstijden en beloningen zijn gelijk gebleven.

[Modelvoorbeeld met de speler als schaalreferentie](assets/previews/doornwachter.png)

## Bram, Mira en Tovin

Versie 1.8 geeft de overige dorpspersonages een eigen uiterlijk op hetzelfde vervormbare skelet als de speler en Elin. Bram draagt een handelsoutfit met baard, schort, beurs, kasboek en drankflesjes. Mira heeft lang kastanjebruin haar, een omslagdoek met bloemenbroche en een geborduurd schort. Tovin heeft zilvergrijs haar, een bril, rugtas, opgerolde deken, kruiden en zijn blauwe lantaarn. Alle accessoires zijn originele Three.js-geometrie; dezelfde GLB-geometrie wordt gedeeld, met eigen materialen per personage. Onderdelen met hetzelfde materiaal en bot worden samengevoegd om het aantal tekenopdrachten te beperken.

De personages ademen rustig, kijken naar een speler in de buurt en maken kleine gebaren tijdens gesprekken. Tovins lantaarn blijft aan zijn hand hangen. Elk gesprek heeft een passende camerastand; tijdens gesprekken met Elin, Bram, Mira en Tovin verdwijnen de speler, naamplaatjes en het spel-HUD tijdelijk uit beeld. Na sluiten komt de normale camera terug en verschijnt het HUD weer. De spelwereld staat stil tijdens het praten; alleen de personages blijven animeren. Pauzeren bevriest ook de animaties.

Tovin verschijnt pas na het aannemen van Mira’s opdracht en staat na zijn redding weer bij het dorp. Opdrachten, handel, beloningen, bestaande opslag en de verbeterde wapengrepen blijven werken zoals voorheen. De nieuwe outfits, accessoires en animaties staan in `js/village-actors.js`; `world.js` registreert de sprekers en `exploration.js` bewaakt Tovins zichtbaarheid en positie.

## Questonderdelen verschijnen na aannemen

Questobjecten verschijnen pas nadat je hun opdracht hebt aangenomen. Eén gedeelde set regels (`RPG.questVisibility` / `RPG.enemyVisible`) stuurt de wereld, interacties, kaartmarkeringen en projectielbotsingen:

- Levende vijanden zijn onafhankelijk van questacceptatie zichtbaar; een eerder behaalde kill verbergt een nieuwe spawn niet.
- Lichtkristallen verschijnen na het aannemen van de kristallenopdracht. De Doornwachter is al zichtbaar; een vroege overwinning blijft geldig voor het verhaal.
- De grotingang verschijnt na het aannemen van de Wortelgrottenopdracht. Het amulet verschijnt na het verslaan van de Wortelmoeder.
- Oefendoelen verschijnen na het aannemen van boogtraining, ook als je als Woudloper al een boog hebt.
- Tovin, kruiden en het Verkenning-paneel verschijnen na het aannemen van Mira’s opdracht. Het bloemspoor en heiligdom volgen nadat Tovin zijn aanwijzing geeft.

Opdrachtgevers en gewone werelddecoratie blijven beschikbaar. Onzichtbare questonderdelen geven geen interactieprompt, verschijnen niet op de minimap en blokkeren geen pijlen. Je hoeft geen nieuw avontuur te starten; bestaande voortgang en verdiende beloningen blijven behouden. Een al verdiende Woudzegen uit een oudere opslag blijft geldig, ook als je die destijds vóór Mira’s opdracht vond.

## Rusthouding en wapengrepen

Sinds versie 1.7.2 hangen de bovenarmen dichter langs het lichaam en wijzen de handpalmen in rust naar de dijen. Zwaard, boog en staf gebruiken een contactpunt tussen duim en vingers en elk een eigen handstand. Het zwaard heeft een zichtbaar handvat en pommel. De staf blijft rechtop met de elleboog bij het lichaam; de boog hangt laag totdat je richt. De trekhand gaat bij het richten naar de pees en keert daarna terug naast het lichaam.

Deze houdingen gelden in het personagevoorbeeld en tijdens het spelen, voor beide outfits. De bestaande GLB-bestanden, rustbotten en opgeslagen personages blijven compatibel. Aanvalstijden, schade en projectielbotsingen veranderen niet; projectielen blijven vanaf de zichtbare pijl of stafkristal vertrekken.

## Classes en een nieuw avontuur

Bij een nieuw avontuur kies je een class. De keuzelijst gebruikt centrale classdata uit `RPG.classes` in `js/core.js`; gezondheid, basissnelheid, ontwijkafkoeltijd, startwapen en classvaardigheid worden daar bepaald.

| Class | Start | Speelstijl |
| --- | --- | --- |
| Wachter | 100 gezondheid, zwaard, Vonkflits | Gevechten van dichtbij met een magische afstandsaanval; kan de boog bij Elin leren |
| Woudloper | 85 gezondheid, boog, Vonkpijl | Snellere beweging en ontwijkrol; kan ook een zwaard gebruiken |
| Magiër | 75 gezondheid, Vonkstaf, 100 mana, Vrieskring | Magische projectielen en een vertragende gebiedsspreuk; mana herstelt tijdens spelen |

De Magiër heeft snelheid 5,1 en 1,25 s ontwijkafkoeltijd. De Woudloper heeft snelheid 5,5 en 1,15 s ontwijkafkoeltijd; de Wachter snelheid 5 en 1,35 s. Vonkpijl vuurt een krachtige magische pijl op een nabije vijand af (4 s afkoeltijd); Vonkflits heeft een afkoeltijd van 3,5 s.

Je class blijft bij het personage. Oudere opslag zonder class wordt als Wachter geladen. Via **Kies je personage →** open je het overzicht met drie opslagplaatsen. Kies **Maak personage →** bij een lege plek, geef je held een naam en kies class en uiterlijk. Pas met **Begin als …** wordt de held opgeslagen. Teruggaan bewaart geen concept en verandert je andere personages niet.

Elk personage bewaart eigen level, gezondheid/mana, locatie, quests, uitrusting, loot en uiterlijk. Je mag ook meerdere helden met dezelfde class maken. **Verder spelen →** hervat de gekozen held. Wisselen kan tijdens het spelen via **Esc → Personages kiezen**; de huidige held wordt eerst opgeslagen. De wereld, questobjecten, vijanden en grondeffecten worden vervolgens uit de gekozen opslag hersteld.

Je bestaande avontuur wordt automatisch als **Aerin** naar de eerste plek overgenomen, inclusief voortgang en uitrusting. De twee andere plekken zijn vrij. De oorspronkelijke save blijft als reservekopie bewaard. Via **I → Personage aanpassen** kun je ook de naam wijzigen.

Een volle plek wordt nooit door een nieuwe held vervangen. **Verwijderen** opent een bevestiging met de naam van de held. **Bewaar personage** of **Esc** annuleert; **Verwijder definitief** maakt alleen die plek vrij. Ook als alle plekken leeg zijn gemaakt, verschijnt de oude reservekopie niet automatisch opnieuw.


## Besturing

**J** opent het nieuwe questlog; **E** of een klik op een lichaam opent de buit.

| Invoer | Actie |
| --- | --- |
| WASD / pijltjes | Bewegen ten opzichte van de camera |
| Shift | Rennen |
| Rechtermuis slepen | Camera draaien en kantelen; met een zwaard werkt links slepen ook |
| Muiswiel | In- en uitzoomen |
| 1 / linkermuisknop | Zwaard: slaan; boog: vasthouden en loslaten; staf: direct een Vonkbol schieten in de richting van de muis |
| Muis bewegen met boog | Richten met het vizier |
| F | Beschikbare wapens wisselen; Magiër: staf → zwaard → boog (na boogtraining) → staf |
| 3 | Magische barrière voor Magiërs vanaf niveau 2 |
| 4 | Blink voor Magiërs vanaf niveau 3; looprichting of de richting waarin je personage kijkt |
| 2 | Classvaardigheid: Vonkflits (Wachter), Vonkpijl (Woudloper) of Vrieskring (Magiër) |
| Spatie | Voorwaartse ontwijkrol in je bewegingsrichting; 0,38 s bescherming, afkoeltijd afhankelijk van class |
| Q | Levensdrank; herstelt tot 70 gezondheid |
| E | Praten, verzamelen, deur openen of gebied betreden/verlaten |
| I | Inventaris en uitrusting |
| Esc | Pauze / menu sluiten |

## Magiër — spreuken en opleiding

Kies **Magiër** wanneer je een personage in een lege plek maakt. Je begint met 75 gezondheid, een zichtbare kristalstaf en 100 mana. De bestaande kapsels, kleuren en beide cosmetische outfits blijven beschikbaar. Classes kun je alleen bij een nieuw avontuur kiezen; uiterlijk aanpassen via I behoudt je class. De nieuwe Magiër krijgt eigen voortgang; de andere personages blijven bewaard.

- **Vonkbol — 1 / linksklik:** richt met de muis en schiet direct een magisch projectiel. Kost 8 mana, heeft 0,65 seconde afkoeltijd en een bereik van circa 24 speleenheden. Basisschade is 32 en groeit met level, sterrenlicht, pantserbonussen en Hartamulet. De zwaardbonus van Doornlicht telt voor je zwaard.
- **Vrieskring — 2:** een ijsring treft zichtbare vijanden binnen 4,8 speleenheden voor 75% van je spreukschade. Kost 24 mana en heeft 8 seconden afkoeltijd. Gewone vijanden bewegen 3 seconden op 45% snelheid; eindbazen 1,5 seconde op 72% snelheid. Aanvalsaankondigingen blijven actief. De ring treft niet door muren of andere vaste obstakels.
- **Mana:** herstelt met 7 per spelseconde, bij een herstelplek met nog eens 20 per seconde. Pauze en menu's stoppen herstel en spreuken. Een level erbij, sterrenlicht, Woudzegen en terugkeer na een nederlaag vullen mana aan. Maximale mana groeit met 5 per level. Huidige mana wordt opgeslagen en begrensd hersteld.

- **Magische barrière — 3, vanaf niveau 2:** kost 20 mana en duurt maximaal 5 seconden. Vangt `42 + 3 × niveau` schade op nadat je pantser is meegerekend. Overtollige schade gaat naar je gezondheid. Afkoeltijd: 14 seconden vanaf het uitspreken. Tijdens een ontwijkrol verbruik je geen bescherming. Je ziet de overgebleven bescherming en tijd bij je levensbalk.
- **Blink — 4, vanaf niveau 3:** kost 18 mana en verplaatst je maximaal 6,5 speleenheden in je looprichting. Zonder looptoets gebruik je de richting waarin je personage kijkt. De hele route wordt gecontroleerd op bomen, gebouwen, grotwanden, gesloten deuren en wereldgrenzen. Is er minder dan 0,75 eenheid ruimte, dan kost de poging geen mana of afkoeltijd. Afkoeltijd: 8 seconden.

Praat met **Magistra Lyra in het zuidwesten van Lindehaard**, links achter de huizen. Haar opleiding is alleen beschikbaar voor Magiërs:

1. **Een vonk onder controle:** accepteer de les en raak het oefenkristal ten noordwesten van Lyra drie keer met een Vonkbol. Lever in voor 60 XP en 10 goud; een nieuwe Magiër bereikt niveau 2.
2. **De beschermende kring:** accepteer de volgende les, ga in de blauwe kring ten westen van Lyra staan en gebruik 3 om een oefenpuls op te vangen. Zonder barrière zijn oefenpulsen onschadelijk. Beloning: 120 XP en 15 goud; een nieuwe Magiër bereikt niveau 3.
3. **Een stap tussen sterren:** accepteer de laatste les, ga op de gouden startrune staan, kijk naar de blauwe eindrune en gebruik 4. Je kunt ook W ingedrukt houden tijdens Blink. Lopen naar de eindrune telt niet. Beloning: 90 XP en 25 goud.

Elke les toont uitsluitend zijn eigen geaccepteerde oefenobjecten. Beloningen krijg je eenmaal per personage. Je kunt de spreuken ook via andere quests of gevechten vrijspelen; bestaande Magiërs van niveau 2/3 krijgen ze vanzelf. Bescherming en resterende afkoeltijden worden per personage bewaard op dezelfde speeltijdklok als respawns. Menu’s, gesprekken en offline tijd verbruiken die tijd niet. Bij een nederlaag vervalt je actieve barrière; de afkoeltijd blijft behouden.

Een directe Vonkbol botst met bomen, grotwanden, oefendoelen en vijanden. Verborgen questonderdelen kunnen geen schade krijgen. Magie telt niet mee voor de boogtraining: neem Elins training aan en gebruik daarvoor geladen pijlen. Met **F** wissel je tussen staf, zwaard en de vrijgespeelde boog. In I kun je ook rechtstreeks je staf of boog uitrusten.

## Vervolgquest — De Gebroken Vonk

Na **Een stap tussen sterren** biedt Lyra **De Gebroken Vonk** aan voor Magiërs vanaf niveau 3. Accepteer de opdracht en volg vanaf het oefenkristal de westelijke bosrand naar het noorden. Vael wacht in een runenkring op de open plek. De tegenstander en zijn arena verschijnen uitsluitend tijdens deze geaccepteerde opdracht.

- **Sterrenlans:** een baan met pijlen toont 1,15 seconde vooraf waar hij schiet. Gebruik **3** voor een barrière of stap opzij. De richting volgt je niet meer nadat de waarschuwing begint.
- **Breukkring:** een oranje cirkel markeert je positie 1,65 seconde vooraf. Gebruik **4** om uit de cirkel te Blinken of loop op tijd weg.
- **Herstel:** na iedere aanval heeft Vael een rustmoment. Gebruik dat om Vonkbollen te schieten, mana te herstellen of een levensdrank te gebruiken.

Een nederlaag of ver terugtrekken herstelt Vaels gezondheid en verwijdert zijn lopende aanvallen. De geaccepteerde quest blijft staan. Pauze bevriest het gevecht; herladen bewaart zijn gezondheid en geeft een korte aanlooptijd voor nieuwe aanvallen.

Keer na de overwinning terug naar Lyra voor eenmalig **180 XP, 40 goud en de Sterrenweversstaf**. Deze wordt meteen uitgerust. In **I** kun je tussen je basisstaf en de nieuwe staf kiezen. De Sterrenweversstaf heeft een gouden maankroon met lichtgevende kristallen en geeft **+12 spreukschade** bovenop je bestaande bonussen. Beide staven blijven beschikbaar, ook als je reistas vol is. De tegenstander geeft geen extra willekeurige buit en keert na het voltooien niet terug.

## Boogtraining

Je bestaande Wachter kan de boog leren zonder opnieuw te beginnen. Praat met Elin en kies in haar gesprek **‘Boogtraining bij Elin’**. Neem de training aan. Je krijgt toegang tot een oefenboog; Woudlopers gebruiken hun eigen startboog.

De drie rieten doelen staan ten noorden van het dorp. Richt met de muis, houd links of 1 ongeveer 1,2 seconde vast tot de balk vol is en laat los. Raak ieder doel eenmaal met een geladen pijl. Korte schoten richten wel schade aan, maar tellen niet voor deze opdracht. Keer na drie treffers terug naar Elin en kies **‘Rond boogtraining af’**. Je verdient de Bosboog met extra schade, 50 XP en 20 goud. Dit is een afzonderlijke opdracht en verandert de hoofdverhaallijn niet.

De boog gebruikt zichtbare projectielen met botsingen tegen vijanden, bomen en grotwanden. Je hebt onbeperkt pijlen. Een volgeladen schot doet meer schade; lopen tijdens het laden gaat langzamer. Pauzeren, praten, rollen, inventaris openen en wapen wisselen breken het laden af. Loslaten daarna vuurt geen onbedoelde pijl af. Je uitgeruste zwaard en de boog blijven apart bewaard; F wisselt tussen beide.


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
5. Onderzoek het heiligdom met E en ontvang de **Woudzegen**: permanent +20 maximale gezondheid, eenmalig volledig herstel, 50 XP en 25 goud. Dit stapelt met het Hartamulet en hoeft niet apart uitgerust te worden. De beloning kun je maar één keer ontvangen. Het heiligdom en het bloemspoor verschijnen nadat je Tovin hebt gevonden en zijn aanwijzing hebt gekregen.

**Kruiden en drankjes:** acht goudbloesemplanten staan verspreid door de vallei. Na het aannemen van Mira’s opdracht verschijnen de kruiden. Pluk met E. Nabije planten verschijnen als kleine geelgroene punten op de minimap. Iedere plant geeft één kruid en blijft daarna geplukt in je opslag. In het gesprek met Bram kun je kiezen tussen een levensdrank kopen voor 15 goud en een drank maken van drie kruiden zonder goudkosten. De maakknop is uitgeschakeld als je te weinig kruiden hebt. Inventaris I toont je kruidenvoorraad.

De extra opdracht staat onder ‘Verkenning’ in de HUD en vervangt je hoofdopdracht niet. Verkenningsvoortgang, geplukte planten, kruidenvoorraad en Woudzegen blijven bewaard bij reizen, doodgaan en herladen.

## Opslag en geluid

Automatische localStorage-opslag iedere vijf spelseconden en na belangrijke acties, gebiedswissels en pauzeren. De drie personages staan samen onder `emberwild-characters-v1`: `{version:1, active:0, slots:[{name,state},null,null]}`. `active` is de laatst gekozen plek (0–2, of `null`); elke `state` gebruikt het bestaande spelopslagformaat met `version:1`.

Bij de eerste start wordt `emberwild-save-v1` eenmalig ingelezen als die bestaat en er nog geen personageoverzicht is. Dit oorspronkelijke bestand wordt niet gewijzigd of verwijderd. Alle drie de plekken worden samen in één localStorage-bewerking opgeslagen. Een mislukte opslag wist de bestaande gegevens niet. Onleesbare of onbekende personageopslag wordt behouden en niet automatisch overschreven. De versie van het opslagformaat staat los van het versienummer van de game.

Voortgang is gebonden aan dezelfde browser en hetzelfde site-adres. Bij geblokkeerde opslag blijft spelen en wisselen tijdens de huidige sessie mogelijk; een melding geeft aan dat opslaan niet lukt. Als de personageopslag in een ander tabblad wordt veranderd, stopt dit tabblad met schrijven en vraagt de game om te herladen. Zo schrijft een verouderd overzicht de nieuwere gegevens niet terug. Gebruik één speltabblad tegelijk. Geen cloudopslag of multiplayer.

Geluidseffecten worden via Web Audio gemaakt na een gebruikersactie, bijvoorbeeld bij aanvallen, spreuken, geraakt worden en verzamelen. Met ‘Geluid aan/uit’ kun je deze effecten dempen; de voorkeur blijft lokaal bewaard. Sinds versie 1.7.1 zijn de achtergrondgeluiden volledig verwijderd: geen wind, vogelgeluiden, omgevingsruis of grotdruppels. Er is ook geen achtergrondmuziek.

## Bestanden

- `index.html`, `style.css`: interface en menu's.
- `js/core.js`: spelregels, opdrachten, uitrusting, beloningen en opslagvalidatie.
- `js/character-rig.js`: gedeeld personageskelet, heroïsche verhoudingen, zwaard, bevestigingspunten en procedurele animaties.
- `js/hero-art.js`: originele geometrie voor gebogen pantserplaten, drie kapsels en de tien verzamelde uitrustingsstukken; gedeeld door de game en modelgenerator.
- `js/flame-guardian.js`: het procedurele Flame Guardian-reservemodel en bron voor het GLB-kostuum.
- `js/model-assets.js`: GLB laden, gedeelde geometrie, eigen materialen en koppeling aan de spelbotten.
- `js/character-assets-data.js`: dezelfde GLBs ingesloten voor offline spelen en rechtstreeks openen.
- `js/appearance.js`: kapsels, kleuren en de afzonderlijke 3D-preview in de character creator.
- `js/equipment.js`: vijf pantserslots, vaste pantserstukken, aankopen, beloningen en zichtbare uitrusting.
- `js/loot.js`: willekeurige drops, zeldzaamheden, itemeigenschappen, statvergelijking en verkoop.
- `js/combat.js`: ontwijkregels, afkoeltijden, eerste projectieltreffers en begrensd draaien.
- `js/enemy-ai.js`: vijandprofielen, groepswaarschuwingen, flanken, aanvalsaankondigingen en pijlontwijking.
- `js/archery.js`: boogmodel, boogpees, herbruikbare pijlmodellen en oefendoelen.
- `js/mage.js`: mana verbruiken/herstellen, tijdelijke vertraging, originele staf en herbruikbare spreukeffecten.
- `js/forest-actors.js`: Elins gedeelde humanoïde skelet, eigen uitrusting en gesprekshouding; originele wolven met losse poten/kaak/oren/staart en afstandgestuurde animatie.
- `js/village-actors.js`: oorspronkelijke outfits, accessoires en gespreksanimaties van Bram, Mira en Tovin.
- `js/thorn-guardian.js`: gedetailleerde Doornwachter, wortelstappen, slagen, instorting en gedeelde schorsdeeltjes.
- `js/grove-creatures.js`: gewogen modellen, materialen en animaties van de Bosgeest en Wortelmoeder.
- `js/adventure-data.js`, `js/quest-system.js`, `js/encounters.js`: contentdefinities, persoonlijke quests/inventaris en onafhankelijke enemy-/loot-/respawnlogica.
- `js/quest-markers.js`: originele gouden/zilveren questsymbolen met contrastrand, gloed en leesbare schermgrootte op afstand.
- `js/adventure-world.js`, `js/adventure-ui.js`: Rowan, lichamen, indicatoren, questlog/tracker en lootvenster.
- `js/terrain.js`: aansluitende gras- en padvlakken zonder overlappende grondpolygonen.
- `js/world.js`: procedurele vallei, modellen, animaties en gevechtseffecten.
- `js/dungeon.js`: drie kamers, vloeren, wanden, deur, sleutel, altaar, gebiedsweergave en loopruimte.
- `js/exploration.js`: Mira, Tovin, kruiden, heiligdom en bloemspoor.
- `js/audio.js`: actiegebonden geluidseffecten en dempknop.
- `js/characters.js`: drie personages, eenmalige migratie, gevalideerde opslag, naamgeving en bescherming tegen verouderde tabbladen.
- `js/character-menu.js`: personagekaarten, kiezen/maken en bevestigen of annuleren van verwijderen.
- `js/game.js`: camera, invoer, gevechten, gebiedswissels, interacties, HUD en opslag.
- `assets/characters/*.glb`: de twee volledige 3D-personages met skelet, botgewichten en ingesloten PNG-textuur.
- `scripts/build-character-assets.cjs`: originele model- en textuurgenerator; uitvoeren met Node.js na bronwijzigingen.
- `vendor/three.min.js`, `vendor/GLTFLoader.js`: Three.js 0.160.1 en de officiële GLTFLoader, MIT-licentie in `vendor/THREE-LICENSE.txt`.
- `tests/`: Node.js-tests, inclusief quest/loot-idempotentie, respawns en compatibele personageopslag.
- `scripts/browser-quest-loot.cjs`: volledig Rowan-traject, echte lichaamselectie, onafhankelijke quests en herladen.
- `scripts/browser-markers.cjs`: leesbaarheid van alle questsymbolen dichtbij/veraf, in mist en bij camera-/vensterwijzigingen.
- `scripts/browser-wolves.cjs`: beide wolventypes, grondcontact, vierfasige stap, draf en echte AI-beweging.
- `scripts/browser-terrain.cjs`: acht camerahoeken, gerenderde kleurcontroles en echt lopen naar de grot.
- `scripts/browser-start.cjs`: Playwright-smoketest voor starten, character creator, combo’s, pantser, loot en opslagherstel.
- `.github/workflows/`: automatische Node.js- en browsercontroles in GitHub Actions.

## Controle

Met Node.js 18+: `node --test tests/*.cjs`.

De huidige testsuite bevat 150 tests. Die controleren quests en gebiedswissels, classkeuze, oude en nieuwe opslag, boogschieten, rollen, projectielbotsingen, questitemafscherming, permanente vijandzichtbaarheid, audio en beide eindbazen. Aanvullende tests controleren het gedeelde skelet, Flame Guardian, uiterlijkkeuzes, pantserbonussen, de drie zwaardcombo’s, tactische vijand-AI en willekeurige loot. Aanvullende bewegingscontroles meten voetcontact bij verschillende tijdstappen, draaien, blokkeringen, teleports, rolrichting, boog/pees/handposities en de stafmonding. De gameplaytest controleert het slagmoment, annuleren en projectielen bij een dichtbij gelegen muur of vijand. De modeltests controleren de GLB-bestanden, gewichten, werkelijke vervorming, grondcontact, proporties, gedeelde kapselgeometrie, afzonderlijke previewmaterialen en het reservemodel bij laadproblemen. Tien opslagtests controleren migratie met behouden reservekopie, onafhankelijke classes/voortgang, drie-plekkenlimiet, annuleren, verwijderen, volle/geblokkeerde opslag, corrupte gegevens, namen en verouderde tabbladen. De integratietest doorloopt de echte Three.js-wereld met gesimuleerde invoer en wisselt daarna tussen alle drie de personages.

De Node.js-integratietest vervangt DOM en WebGL-renderer en controleert geen uiteindelijke pixels of hardwareprestaties. De aparte Playwright-smoketest gebruikt wel een echte Chromium-browser en controleert het echte laden van beide GLB-modellen, de creator, preview, combo-HUD, pantser, lootinteracties en opslag na herladen. Screenshots worden als workflow-artifact bewaard. De workflow installeert Playwright en gebruikt de aanwezige Chrome-/Chromium-browser, of installeert Chromium als die ontbreekt; lokaal moet ook een HTTP-server op `127.0.0.1:8765` draaien. Vloertegels in de grot worden in twee InstancedMesh-batches getekend om het aantal tekenaanroepen klein te houden.

De huidige game heeft twee gebieden, drie classes en twee korte hoofdstukken, met een character creator, modulair pantser, willekeurige loot en tactische vijanden. Er zijn drie lokale personageslots. Sprongen, multiplayer, cloudopslag en extra kerkers zijn nog niet geïmplementeerd.

## Herbruikbaar 3D-personageskelet en skins

`js/character-rig.js` biedt `EmberCharacterRig.create(THREE, {skin:'guardian'})`. Het retourneert een `group`, `model`, `joints`, een `THREE.Skeleton`, `animate(time,moving,attacking)` en `setSkin(name)`. De benoemde `THREE.Bone`-gewrichten omvatten heupen, rug, borstkas, nek, hoofd, schouders, ellebogen, handen, dijen, knieën, voeten en `weapon_r` / `back` voor uitrusting.

De speler gebruikt dit gedeelde skelet. Wachter en Woudloper zijn classes; **klassiek** en **Flame Guardian** zijn cosmetische uiterlijkkeuzes. Flame Guardian heeft inmiddels eigen procedureel gemodelleerde pantserdelen, gezichtsdetails, haarlokken, cape en lichtgevende kristallen. Kapsels en kleuren worden door de character creator toegepast; verzameld pantser staat los van het basiskostuum.

De twee echte glTF 2.0-bestanden staan in `assets/characters/`: `ember-adventurer.glb` en `flame-guardian.glb`. Het lijf heeft doorlopende geometrie met genormaliseerde botgewichten bij romp, ellebogen en knieën. Gezicht, vingers, kledingnaden, gespen, laarzen en mantel geven meer detail; Flame Guardian heeft een gesmeed pantser, goudranden, gravures, een rode tabberd en lichtgevende kristallen. De originele materiaalatlas van 512 × 256 pixels bevat stof, leer, geborsteld staal, goud en mantelpatronen. Hij is in ieder model ingesloten. Vertexkleuren versterken de vorm met subtiele geschilderde schaduw en highlights. Dit is originele gestileerde art, gemaakt met de meegeleverde generator.

`EmberModelAssets` laadt via de lokaal meegeleverde officiële GLTFLoader. De `SkinnedMesh`-geometrie wordt aan de bestaande benoemde botten gekoppeld. De personagepreview en de speler delen onveranderlijke geometrie, maar hebben eigen materialen en botten. Haaropties, wapens, verzameld pantser en het Hartamulet gebruiken hun bestaande bevestigingspunten. Classes, bonussen en het opslagformaat veranderen niet. Elin deelt sinds versie 1.7 de gewogen basisgeometrie, met eigen materialen, vlecht en uitrusting. De schemerwolven hebben een eigen procedureel model; Bram, Mira en Tovin hebben eigen outfits; de Doornwachter, Bosgeest en Wortelmoeder hebben afzonderlijke gewogen modellen.

Voor rechtstreeks openen van `index.html` en offline gebruik bevat `js/character-assets-data.js` dezelfde GLB-bytes. Er zijn geen externe modelverzoeken of extra installaties nodig. Bij een laadprobleem blijft het procedurele reservemodel zichtbaar. De generator maakt zowel de losse GLBs als de identieke offlineversie opnieuw: `node scripts/build-character-assets.cjs`. Zie ook [de assetdocumentatie](assets/characters/README.md).

## Heroïsche heldenstijl

Versie 1.3 geeft de speler langere benen en armen, een kleiner hoofd, een gevormde kaak/neus en kleine amandelvormige ogen. De reiziger draagt een passend leren vest, een schuine draagriem, een verstevigde schouder, gespen en reistasjes. Flame Guardian draagt een gebogen borstplaat, overlappende buik-/schouder-/armplaten, goudinleg, sintelkristallen en een lange geborduurde mantel. De drie kapsels bestaan uit taps toelopende haarlokken; hun geometrie is per kapsel samengevoegd tot één drawcall en wordt tussen speler en preview gedeeld.

Verzamelde helmen, schouders, borstpantser, handschoenen en laarzen gebruiken dezelfde vormtaal en passen op de nieuwe verhoudingen. Het zwaard heeft een scherpe punt, een geslepen doorsnede en een gevormde pareerstang. De character creator toont de juiste classkleuren met zachter studiolicht en een draaiplateau. Het zijn originele gestileerde fantasy-modellen; de wereld en de overige NPC's behouden hun bestaande stijl.

Botnamen, bevestigingspunten en de grondpositie van de voeten blijven bruikbaar voor de bestaande animaties en uitrusting. De rustverhoudingen en GLB-bindmatrices zijn samen bijgewerkt. Het opslagformaat en de spelregels veranderen niet; een bestaand avontuur kan direct verder.

## Karakteranimaties

Versie 1.5 gebruikt afstandgestuurde loop- en rencycli, vloeiende overgangen en tweebots-IK: een steunvoet blijft op dezelfde plek in de wereld staan terwijl de knie meebuigt. De heupen volgen het steunbeen. Draaien gaat vloeiend; stilstaan tegen een obstakel speelt geen renanimatie af. Teleports en gebiedswissels resetten de voetankers. De voorwaartse rol vouwt knieën, armen en mantel in en keert daarna terug naar de gewone houding.

De drie zwaardaanvallen hebben een voorbereiding, slag en herstel. Schade, geluid en de slagboog volgen na 0,105 seconde (slag 1/2) of 0,16 seconde (finish). Pauze, rollen en een wapenwissel annuleren een voorbereide slag. Vijanden reageren met een korte, gedempte beweging.

De Woudloper houdt de boog in de linkerhand en trekt met de rechterhand de pees terug; de pijlnok volgt de pees. Bij loslaten verschijnt de vliegende pijl op de plek van de vastgehouden pijl. De Magiër houdt de staf met een gebogen arm vast en spreuken vertrekken uit het kristal. De eerste botsingscontrole omvat ook het stuk tussen speler en wapen, zodat dichtbij gelegen obstakels en vijanden geraakt blijven worden. De character creator toont het juiste startwapen voor iedere class.

De gewogen modellen volgen alle procedurele animaties. Botgewichten laten romp en ledematen meebuigen. Haar en mantel krijgen lichte secundaire beweging. De mantel gebruikt het `back`-bot; harde pantserdelen blijven aan hun betreffende bot bevestigd. Er zijn geen losse externe animatiebestanden nodig.

## Character creator

Open **Kies je personage → Maak personage** bij een lege plek om de character creator te gebruiken. In een aparte realtime Three.js-preview kies je een klassiek uiterlijk of Flame Guardian, drie kapsels (kort, lang, vlecht), vijf haarkleuren, vier huidtinten en vier oogkleuren. Met de knoppen onder de preview draai je je personage. De klasse bepaalt de gameplay en blijft losstaan van het cosmetische uiterlijk.

In een bestaand avontuur: druk op **I → Personage aanpassen**. Je kunt daar je naam en uiterlijk bijstellen zonder je klasse, level, quests of uitrusting te verliezen. Wijzigingen worden pas opgeslagen met **Bewaar uiterlijk**; **Terug** annuleert ze. Je oude save wordt automatisch uitgebreid met veilige standaardwaarden. De bestaande `skinId` blijft ondersteund, en aanvullende keuzes worden opgeslagen onder `appearance`. De nieuwe UI gebruikt één gedeelde `EmberAppearance`-module voor gamepersonage en preview; geen buildstap of extra externe dependencies.

Test lokaal met `node --test tests/*.cjs`. De Playwright-smoketest opent daarnaast de creator en controleert de preview, cosmetische keuzes, bewerken vanuit de inventaris en opslag na herladen.

## Pantser en uitrusting

Open tijdens het spelen met **I** de inventaris. Onder **Uitrusting** staan vijf losse slots: hoofd, schouders, borst, handschoenen en laarzen. Selecteer een verzameld pantserstuk om het uit te rusten; klik nogmaals of op het bezette slot om het af te doen. Alle stukken zijn zichtbaar op de overeenkomstige botten van het 3D-personage en kunnen worden gedragen met zowel het klassieke uiterlijk als de Flame Guardian.

Er zijn tien verschillende stukken (reizigers- en vonkensets). Je begint met een borstpantser en laarzen, ontvangt automatisch eenmalige beloningen voor bestaande kisten, vijanden, boogtraining, zijquests, heiligdom en Wortelgrotten en kunt overige stukken met goud kopen in **Bram's pantseraanbod** in je inventaris. Koopbedragen worden maar één keer afgeschreven; een tweede aankoop van hetzelfde stuk is uitgesloten. Pantser verhoogt de maximale gezondheid en/of schade; de boog krijgt dezelfde schadebonus. Hartamulet en wapens blijven aparte systemen.

Veldnamen voor opslag: `armorOwned` is een opgeschoonde lijst met bekende stuk-IDs; `armorEquipped` is een object van vijf slots naar een stuk-ID of `null`. Ongeldige, niet-bezette en niet-bezittende IDs worden tijdens herstel verwijderd. Bestaande saves krijgen gratis basisstukken, behouden level/quests/uiterlijk en ontvangen reeds verdiende beloningen uit hun voortgang, zonder dat hun bestaande uitrusting automatisch verandert.

Losse uitrustingsstukken blijven lichtgewicht meshes op de gedeelde botten. Ze passen over beide GLB-basismodellen en volgen dezelfde bewegingen.

## Gevechten — drie slagen
Zwaardaanvallen volgen een 3-staps combo: **Snelle slag** (100% schade), **Kruisslag** (120%) en **Vuurfinish** (165%). De volgende slag moet binnen 0,9 seconde na de vorige worden uitgevoerd en respecteert een eigen cooldown. Daarna begint de keten opnieuw. Rollen, wapens wisselen en magie gebruiken resetten de keten. De HUD laat de actieve combo zien. Boog en boogtraining blijven beschikbaar voor alle drie classes. Elk stadium heeft eigen zwaard- en lichaamsanimatie, kleur en slagboog; magie heeft gloeiende inslagen. Vijanden tonen een visuele hitreactie en gewone tegenstanders worden kort onderbroken, zonder eindbaaspatronen te veranderen. De combostatus wordt niet opgeslagen en beïnvloedt bestaande saves niet.

## Vijandelijke AI

- Schemerwolven zoeken een flank en nabijgelegen bondgenoten reageren wanneer een wolf geraakt wordt.
- Bosgeesten proberen op afstand te blijven, tonen een paarse waarschuwing voordat ze hun projectiel lanceren en wijken terug wanneer je dichtbij komt.
- Elke gewone melee-aanval toont eerst een gekleurde, pulserende waarschuwingsring op de grond. Beweeg of rol uit het bereik voordat de slag valt; een eigen melee-treffer kan de voorbereiding van de tegenstander onderbreken.
- Verrassingsschoten met een boog blijven raakbaar van buiten detectieafstand. Eerder gealarmeerde vijanden mogen volgende pijlen proberen te ontwijken; botsingen en blokkeringen blijven leidend.
- De bestaande aanvallen en telegraphs van Doornwachter en Wortelmoeder blijven behouden. Quests, loot en save-indeling veranderen niet. De AI-status bestaat alleen gedurende de huidige speelsessie.

## Loot en progressie

Vijanden kunnen bij verslaan willekeurige uitrusting laten vallen. Gewone vijanden hebben ongeveer 57% dropkans; geesten 78% en eindbazen altijd een drop. De verdeling van gewone drops is 55% **gewoon**, 28% **zeldzaam**, 13% **episch** en 4% **legendarisch**. Eindbazen hebben betere kansen op epische of legendarische stukken. Iedere drop combineert een bestaand van vijf armor-slots (helm, schouders, borst, handschoenen, laarzen) met een zeldzaamheid en een willekeurig kenmerk: Levenskracht, Woede, Scherpschutter, Bescherming of Sintelvuur.

Na het verslaan blijft een lichaam met subtiele glinstering achter. Klik erop of druk binnen 3,1 speleenheden op **E** om het lootvenster te openen en uitrusting, goud, materialen en eventuele geldige questitems te verzamelen. Oude saves met grondkristallen behouden ook de bestaande E-pickup. Buit die nog op de grond ligt, wordt net als de verzamelde loot opgeslagen bij je avontuur en opnieuw getoond na laden. De inventaris onder **I → Gevonden buit** toont statvergelijkingen met het momenteel uitgeruste item, een knop voor uitrusten/afleggen en een verkoopknop. Er passen maximaal 32 gevonden items in je reistas en 32 zichtbare drops in de wereld. Verkoop is onmogelijk zolang een item is uitgerust.

De gemaakte combinaties zijn cosmetisch zichtbaar via de reeds bestaande 3D-pantsermodellen, nu met hun zeldzaamheidskleur. Basispantser en unieke loot gebruiken hetzelfde armor-slot, dus bonussen tellen niet dubbel. Extra statistieken naast HP en schade zijn **boogschade** (Scherpschutter / Sintelvuur) en **schadevermindering** (Bescherming). De bestaande vijanden, quests, unieke boss-buit, character creator en opslagsleutel blijven intact. Bij het laden worden items en terreinlocaties strikt gevalideerd; savebestanden kunnen geen willekeurige itemnamen, IDs of statistieken injecteren. De waarde van bonussen komt alleen uit vooraf gedefinieerde itemtemplates, niet uit opgeslagen invoer.

Test met `node --test tests/*.cjs`. De browser-smoketest omvat een echte lootinteractie, het vergelijkingspaneel, uitrusten en opnieuw laden.

## Publiceren via GitHub Pages

Zet de volledige repository op GitHub, inclusief `vendor/`, `js/` en `assets/`. Kies bij **Settings → Pages** voor **Deploy from a branch → main → / (root)** en sla op. Er is geen buildstap. De game staat voor deze repository op https://evmob30-web.github.io/testapp/. Bij een oude gecachete versie helpt **Ctrl+F5**. Publiceren vervangt geen lokale spelersvoortgang.

Voor de browser-smoketest kan optioneel `EMBERWILD_CHROMIUM_PATH` naar een bestaande Chromium-installatie verwijzen. Zonder die variabele gebruikt de test de door Playwright geïnstalleerde browser.

Op een beheerde testmachine die `file://`-navigatie blokkeert kan `node scripts/browser-start.cjs --http-only` alleen de HTTP-controles uitvoeren. GitHub Actions gebruikt altijd de volledige test, inclusief rechtstreeks openen.

De browsercontrole omvat ook een afzonderlijk Magiër-avontuur: class/preview, staf en manabalk, alle spreuken, Lyra’s drie lessen, schadeopvang, veilige Blink-botsingen, pauze, wapens wisselen, uiterlijk aanpassen en opslagherstel. Voor een lokale HTTP-server op een andere poort kan `EMBERWILD_BASE_URL` worden ingesteld; GitHub Actions gebruikt standaard `http://127.0.0.1:8765/` en blijft rechtstreeks openen mee testen.

De browsercontrole voor versie 1.7 maakt drie echte personages, controleert annuleren, wisselen, naam en uiterlijk, opslag na herladen en verwijderen. Een afzonderlijke context migreert een oude save met uitrusting en controleert dat een verwijderde oude held niet opnieuw wordt geïmporteerd.


## Elin en de schemerwolven — versie 1.7

Elin gebruikt het gedetailleerde gezicht en gedeelde skelet van de oorspronkelijke avonturier, met eigen groene/bronzen materialen, een vlecht, eikenbladspeld, schoudermantel, opgeborgen boog en pijlenkoker. Zij draait rustig naar een speler in de buurt, ademt en beweegt tijdens gesprekken haar hoofd en hand. Op brede schermen staat Elins dialoog naast haar; de camera kiest een positie schuin voor haar en houdt rekening met gebouwen, zodat het model zichtbaar blijft. In deze gespreksshot staat Elin centraal; je held komt na het gesprek weer in beeld. Tijdens gesprekken animeert alleen Elin; de gevechten, regeneratie en timers blijven gepauzeerd.

De vier schemerwolven hebben een gevormde romp en snuit, bek met tanden, oren, klauwen en een staart met drie beweegbare delen. Beide wolventypes gebruiken een korte vierfasige stap bij langzaam rondlopen en diagonale draf bij achtervolgen. De paslengte volgt snelheid en bochten; de voetzolen raken de grond en de poten worden slechts een klein stukje opgetild. Stoppen rondt de laatste stap af en zet de poten afzonderlijk neer. De wolven draaien vloeiend naar de speler. [Technische uitleg en regressiecontroles](docs/WOLF_ANIMATION.md). Gedeelde, onveranderlijke geometrie en materialen houden het aantal tekenaanroepen begrensd; botten en animatiestatus zijn per wolf gescheiden. Lopen en rennen volgen de werkelijk afgelegde afstand, met geplante steunpoten. De wolf zakt tijdens de bestaande waarschuwing door zijn poten en legt zijn oren naar achteren. De beet volgt het bestaande slagmoment; geraakt worden geeft een korte terugslag van kop en romp. Dit beweegt alleen de zichtbare onderdelen, niet het bereik of de positie die de gevechtsregels gebruiken.

Wolven blijven zichtbaar onafhankelijk van quests; questitems vereisen hun eigen actieve objective. Pauze stopt hun animaties. Wisselen van personage, herladen en doodgaan resetten de tijdelijke houdingen. Elin hergebruikt de bestaande ingebedde GLBs; er worden geen extra modellen van internet opgehaald. Spelregels, buit, quests en de drie personagesaves veranderen niet.

Zes aanvullende modeltests controleren gedeelde geometrie met afzonderlijke botten/materialen, voetcontact bij verschillende snelheden en tijdstappen, waarschuwing/beet/terugslag zonder verplaatste spelpositie, resets en Elins gesprekshouding. De volledige gameplaytest controleert gesprekspauze en bevroren wolfanimaties. De Chromium-test controleert Elins geladen model en gesprek, de zichtbaarheid van wolven na acceptatie en een echte waarschuwing/beet in de game.

De modelcontrole voor versie 1.10 controleert huidgewichten, gedeelde geometrie, eigen materialen, voetcontact bij 30 en 120 tijdstappen per seconde, vrij liggende gewogen geometrie boven de vloer, beide aanvalspatronen, terugslag en opruimen/resetten. De gameplaytest controleert werkelijke projectielen, schade, pauze, directe voortgang bij verslaan en behoud van oude Schildwacht-opslag. De browsercontrole voert beide gevechten uit, inclusief waarschuwingen, pauze, verslaan en herladen. Met `node scripts/browser-start.cjs --grove-only` kun je alleen deze twee gevechten controleren tegen de lokale HTTP-server.
