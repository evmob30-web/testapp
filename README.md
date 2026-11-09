# Emberwild — De laatste vonk · versie 1.5

Een originele singleplayer-actie-RPG in 3D: de Schemervallei met een dorp, bos en ruïne, plus de Wortelgrotten met drie verbonden kamers. Versie 1.5 bevat drie classes, een character creator, zichtbare pantseruitrusting, zwaardcombo’s, tactische vijanden en willekeurige buit met zeldzaamheden. De speler gebruikt twee originele GLB-modellen met heroïsche lichaamsverhoudingen, een gevormd gezicht, gebeeldhouwde haarlokken, gelaagde bepantsering en schilderachtige materialen op een vervormbaar skelet. Alle personages, modellen en verhalen zijn eigen werk. Three.js verzorgt WebGL; er worden geen Warcraft-assets gebruikt.

## Starten

Open `index.html` in een recente desktopbrowser met WebGL/hardwareversnelling. Geen installatie, backend, account, externe API of buildstap nodig. Three.js wordt lokaal meegeleverd. Ook geschikt voor GitHub Pages op een subpad. De game is bedoeld voor toetsenbord en muis op een laptop of desktop; er is nog geen mobiele besturing.

## Questonderdelen verschijnen na aannemen

Questobjecten verschijnen pas nadat je hun opdracht hebt aangenomen. Eén gedeelde set regels (`RPG.questVisibility` / `RPG.enemyVisible`) stuurt de wereld, interacties, kaartmarkeringen en projectielbotsingen:

- Wolven verschijnen na het aannemen van Elins eerste opdracht.
- Lichtkristallen verschijnen na het aannemen van de kristallenopdracht; de Doornwachter verschijnt na ontvangst van het sterrenlicht.
- De grotingang verschijnt na het aannemen van de Wortelgrottenopdracht. Het amulet verschijnt na het verslaan van de Wortelmoeder.
- Oefendoelen en de Schildwacht verschijnen na het aannemen van boogtraining, ook als je als Woudloper al een boog hebt.
- Tovin, kruiden en het Verkenning-paneel verschijnen na het aannemen van Mira’s opdracht. Het bloemspoor en heiligdom volgen nadat Tovin zijn aanwijzing geeft.

Opdrachtgevers en gewone werelddecoratie blijven beschikbaar. Onzichtbare questonderdelen geven geen interactieprompt, verschijnen niet op de minimap en blokkeren geen pijlen. Je hoeft geen nieuw avontuur te starten; bestaande voortgang en verdiende beloningen blijven behouden. Een al verdiende Woudzegen uit een oudere opslag blijft geldig, ook als je die destijds vóór Mira’s opdracht vond.

## Classes en een nieuw avontuur

Bij een nieuw avontuur kies je een class. De keuzelijst gebruikt centrale classdata uit `RPG.classes` in `js/core.js`; gezondheid, basissnelheid, ontwijkafkoeltijd, startwapen en classvaardigheid worden daar bepaald.

| Class | Start | Speelstijl |
| --- | --- | --- |
| Wachter | 100 gezondheid, zwaard, Vonkflits | Gevechten van dichtbij met een magische afstandsaanval; kan de boog bij Elin leren |
| Woudloper | 85 gezondheid, boog, Vonkpijl | Snellere beweging en ontwijkrol; kan ook een zwaard gebruiken |
| Magiër | 75 gezondheid, Vonkstaf, 100 mana, Vrieskring | Magische projectielen en een vertragende gebiedsspreuk; mana herstelt tijdens spelen |

De Magiër heeft snelheid 5,1 en 1,25 s ontwijkafkoeltijd. De Woudloper heeft snelheid 5,5 en 1,15 s ontwijkafkoeltijd; de Wachter snelheid 5 en 1,35 s. Vonkpijl vuurt een krachtige magische pijl op een nabije vijand af (4 s afkoeltijd); Vonkflits heeft een afkoeltijd van 3,5 s.

Je class blijft bij het personage. Oudere opslag zonder class wordt als Wachter geladen; opgeslagen Wachters en Woudlopers behouden hun class en voortgang. ‘Ga verder’ laadt je opgeslagen class direct. Via pauze → ‘Nieuw avontuur’ kun je opnieuw kiezen; de nieuwe start vervangt je ene opgeslagen avontuur. Teruggaan uit de classkeuze laat de huidige voortgang intact. Er zijn nog geen meerdere personageslots. De drie classes zijn Wachter, Woudloper en Magiër.

## Besturing

| Invoer | Actie |
| --- | --- |
| WASD / pijltjes | Bewegen ten opzichte van de camera |
| Shift | Rennen |
| Rechtermuis slepen | Camera draaien en kantelen; met een zwaard werkt links slepen ook |
| Muiswiel | In- en uitzoomen |
| 1 / linkermuisknop | Zwaard: slaan; boog: vasthouden en loslaten; staf: direct een Vonkbol schieten in de richting van de muis |
| Muis bewegen met boog | Richten met het vizier |
| F | Beschikbare wapens wisselen; Magiër: staf → zwaard → boog (na boogtraining) → staf |
| 2 | Classvaardigheid: Vonkflits (Wachter), Vonkpijl (Woudloper) of Vrieskring (Magiër) |
| Spatie | Voorwaartse ontwijkrol in je bewegingsrichting; 0,38 s bescherming, afkoeltijd afhankelijk van class |
| Q | Levensdrank; herstelt tot 70 gezondheid |
| E | Praten, verzamelen, deur openen of gebied betreden/verlaten |
| I | Inventaris en uitrusting |
| Esc | Pauze / menu sluiten |

## Magiër — Vonkbol, mana en Vrieskring

Kies **Magiër** bij **Nieuw avontuur**. Je begint met 75 gezondheid, een zichtbare kristalstaf en 100 mana. De bestaande kapsels, kleuren en beide cosmetische outfits blijven beschikbaar. Classes kun je alleen bij een nieuw avontuur kiezen; uiterlijk aanpassen via I behoudt je class. Beginnen vervangt de ene lokale save pas nadat je bewust de nieuwe class start.

- **Vonkbol — 1 / linksklik:** richt met de muis en schiet direct een magisch projectiel. Kost 8 mana, heeft 0,65 seconde afkoeltijd en een bereik van circa 24 speleenheden. Basisschade is 32 en groeit met level, sterrenlicht, pantserbonussen en Hartamulet. De zwaardbonus van Doornlicht telt voor je zwaard.
- **Vrieskring — 2:** een ijsring treft zichtbare vijanden binnen 4,8 speleenheden voor 75% van je spreukschade. Kost 24 mana en heeft 8 seconden afkoeltijd. Gewone vijanden bewegen 3 seconden op 45% snelheid; eindbazen 1,5 seconde op 72% snelheid. Aanvalsaankondigingen blijven actief. De ring treft rondom een schild, maar niet door muren of andere vaste obstakels.
- **Mana:** herstelt met 7 per spelseconde, bij een herstelplek met nog eens 20 per seconde. Pauze en menu's stoppen herstel en spreuken. Een level erbij, sterrenlicht, Woudzegen en terugkeer na een nederlaag vullen mana aan. Maximale mana groeit met 5 per level. Huidige mana wordt opgeslagen en begrensd hersteld.

Een directe Vonkbol botst met bomen, grotwanden, oefendoelen en vijanden; een schild kan hem van voren blokkeren. Verborgen questonderdelen kunnen geen schade krijgen. Magie telt niet mee voor de boogtraining: neem Elins training aan en gebruik daarvoor geladen pijlen. Met **F** wissel je tussen staf, zwaard en de vrijgespeelde boog. In I kun je ook rechtstreeks je staf of boog uitrusten.

## Boogtraining en de Schildwacht

Je bestaande Wachter kan de boog leren zonder opnieuw te beginnen. Praat met Elin en kies in haar gesprek **‘Boogtraining bij Elin’**. Neem de training aan. Je krijgt toegang tot een oefenboog; Woudlopers gebruiken hun eigen startboog.

De drie rieten doelen staan ten noorden van het dorp. Richt met de muis, houd links of 1 ongeveer 1,2 seconde vast tot de balk vol is en laat los. Raak ieder doel eenmaal met een geladen pijl. Korte schoten richten wel schade aan, maar tellen niet voor deze opdracht. Keer na drie treffers terug naar Elin en kies **‘Rond boogtraining af’**. Je verdient de Bosboog met extra schade, 50 XP en 20 goud. Dit is een afzonderlijke opdracht en verandert de hoofdverhaallijn niet.

De boog gebruikt zichtbare projectielen met botsingen tegen vijanden, bomen en grotwanden. Je hebt onbeperkt pijlen. Een volgeladen schot doet meer schade; lopen tijdens het laden gaat langzamer. Pauzeren, praten, rollen, inventaris openen en wapen wisselen breken het laden af. Loslaten daarna vuurt geen onbedoelde pijl af. Je uitgeruste zwaard en de boog blijven apart bewaard; F wisselt tussen beide.

Een **Schildwacht** patrouilleert in het oostelijke bos (bij 17, -24). Hij blokkeert aanvallen van voren, inclusief pijlen, en draait langzaam. Beweeg of rol naar zijn zijkant of achter hem en raak hem daar. Hij is optioneel en telt niet mee voor de wolvenopdracht.

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

Automatische localStorage-opslag iedere vijf spelseconden en na belangrijke acties, gebiedswissels en pauzeren. Opslagsleutel: `emberwild-save-v1`. Oudere saves blijven bruikbaar en worden aangevuld met standaardwaarden voor uiterlijk, pantser en loot. Hoofdstuk 2 begint pas nadat je de nieuwe opdracht aanneemt. Je hoeft niet opnieuw te beginnen. De versie van dit opslagformaat staat los van het versienummer van de game.

‘Ga verder’ verschijnt bij een bruikbare opslag. ‘Nieuw avontuur’ vervangt de voortgang; tijdens spelen wordt hiervoor bevestiging gevraagd. Voortgang is gebonden aan dezelfde browser en hetzelfde site-adres. Bij geblokkeerde opslag blijft spelen mogelijk voor de huidige sessie. Geen cloudopslag of multiplayer.

Geluiden worden via Web Audio gemaakt na een gebruikersactie. Met ‘Geluid aan/uit’ kun je dempen; de voorkeur blijft lokaal bewaard. Er is geen achtergrondmuziek. In de vallei hoor je zachte procedurele wind en vogels; in de Wortelgrotten hoor je zachte ruis en druppels met korte echo’s. Omgevingsgeluid start na gebruikersinvoer, pauzeert tijdens menu’s of verlies van vensterfocus en wordt samen met de effecten gedempt. Eén hergebruikte ruislus en enkele korte tonen houden het audiowerk beperkt.

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
- `js/combat.js`: ontwijkregels, afkoeltijden, eerste projectieltreffers, schildhoeken en begrensd draaien.
- `js/enemy-ai.js`: vijandprofielen, groepswaarschuwingen, flanken, aanvalsaankondigingen en pijlontwijking.
- `js/archery.js`: boogmodel, boogpees, herbruikbare pijlmodellen en oefendoelen.
- `js/mage.js`: mana verbruiken/herstellen, tijdelijke vertraging, originele staf en herbruikbare spreukeffecten.
- `js/world.js`: procedurele vallei, modellen, animaties en gevechtseffecten.
- `js/dungeon.js`: drie kamers, vloeren, wanden, deur, sleutel, altaar, gebiedsweergave en loopruimte.
- `js/exploration.js`: Mira, Tovin, kruiden, heiligdom en bloemspoor.
- `js/audio.js`: procedurele geluidseffecten, omgevingsgeluid en dempknop.
- `js/game.js`: camera, invoer, gevechten, gebiedswissels, interacties, HUD en opslag.
- `assets/characters/*.glb`: de twee volledige 3D-personages met skelet, botgewichten en ingesloten PNG-textuur.
- `scripts/build-character-assets.cjs`: originele model- en textuurgenerator; uitvoeren met Node.js na bronwijzigingen.
- `vendor/three.min.js`, `vendor/GLTFLoader.js`: Three.js 0.160.1 en de officiële GLTFLoader, MIT-licentie in `vendor/THREE-LICENSE.txt`.
- `tests/`: Node.js-tests.
- `scripts/browser-start.cjs`: Playwright-smoketest voor starten, character creator, combo’s, pantser, loot en opslagherstel.
- `.github/workflows/`: automatische Node.js- en browsercontroles in GitHub Actions.

## Controle

Met Node.js 18+: `node --test tests/*.cjs`.

De huidige testsuite bevat 73 tests. Die controleren quests en gebiedswissels, classkeuze, oude en nieuwe opslag, boogschieten, rollen, projectielbotsingen, questafscherming, audio en beide eindbazen. Aanvullende tests controleren het gedeelde skelet, Flame Guardian, uiterlijkkeuzes, pantserbonussen, de drie zwaardcombo’s, tactische vijand-AI en willekeurige loot. Aanvullende bewegingscontroles meten voetcontact bij verschillende tijdstappen, draaien, blokkeringen, teleports, rolrichting, boog/pees/handposities en de stafmonding. De gameplaytest controleert het slagmoment, annuleren en projectielen bij een dichtbij gelegen muur of vijand. De modeltests controleren de GLB-bestanden, gewichten, werkelijke vervorming, grondcontact, proporties, gedeelde kapselgeometrie, afzonderlijke previewmaterialen en het reservemodel bij laadproblemen. De integratietest bouwt de echte Three.js-wereld op en doorloopt het avontuur met gesimuleerde invoer.

De Node.js-integratietest vervangt DOM en WebGL-renderer en controleert geen uiteindelijke pixels of hardwareprestaties. De aparte Playwright-smoketest gebruikt wel een echte Chromium-browser en controleert het echte laden van beide GLB-modellen, de creator, preview, combo-HUD, pantser, lootinteracties en opslag na herladen. Screenshots worden als workflow-artifact bewaard. De workflow installeert daarvoor Playwright en Chromium; lokaal moet ook een HTTP-server op `127.0.0.1:8765` draaien. Vloertegels in de grot worden in twee InstancedMesh-batches getekend om het aantal tekenaanroepen klein te houden.

De huidige game heeft twee gebieden, drie classes en twee korte hoofdstukken, met een character creator, modulair pantser, willekeurige loot en tactische vijanden. Meerdere personageslots, sprongen, multiplayer en extra kerkers zijn nog niet geïmplementeerd.

## Herbruikbaar 3D-personageskelet en skins

`js/character-rig.js` biedt `EmberCharacterRig.create(THREE, {skin:'guardian'})`. Het retourneert een `group`, `model`, `joints`, een `THREE.Skeleton`, `animate(time,moving,attacking)` en `setSkin(name)`. De benoemde `THREE.Bone`-gewrichten omvatten heupen, rug, borstkas, nek, hoofd, schouders, ellebogen, handen, dijen, knieën, voeten en `weapon_r` / `back` voor uitrusting.

De speler gebruikt dit gedeelde skelet. Wachter en Woudloper zijn classes; **klassiek** en **Flame Guardian** zijn cosmetische uiterlijkkeuzes. Flame Guardian heeft inmiddels eigen procedureel gemodelleerde pantserdelen, gezichtsdetails, haarlokken, cape en lichtgevende kristallen. Kapsels en kleuren worden door de character creator toegepast; verzameld pantser staat los van het basiskostuum.

De twee echte glTF 2.0-bestanden staan in `assets/characters/`: `ember-adventurer.glb` en `flame-guardian.glb`. Het lijf heeft doorlopende geometrie met genormaliseerde botgewichten bij romp, ellebogen en knieën. Gezicht, vingers, kledingnaden, gespen, laarzen en mantel geven meer detail; Flame Guardian heeft een gesmeed pantser, goudranden, gravures, een rode tabberd en lichtgevende kristallen. De originele materiaalatlas van 512 × 256 pixels bevat stof, leer, geborsteld staal, goud en mantelpatronen. Hij is in ieder model ingesloten. Vertexkleuren versterken de vorm met subtiele geschilderde schaduw en highlights. Dit is originele gestileerde art, gemaakt met de meegeleverde generator.

`EmberModelAssets` laadt via de lokaal meegeleverde officiële GLTFLoader. De `SkinnedMesh`-geometrie wordt aan de bestaande benoemde botten gekoppeld. De personagepreview en de speler delen onveranderlijke geometrie, maar hebben eigen materialen en botten. Haaropties, wapens, verzameld pantser en het Hartamulet gebruiken hun bestaande bevestigingspunten. Classes, bonussen en het opslagformaat veranderen niet. NPC's en vijanden behouden hun bestaande lichte procedurele modellen.

Voor rechtstreeks openen van `index.html` en offline gebruik bevat `js/character-assets-data.js` dezelfde GLB-bytes. Er zijn geen externe modelverzoeken of extra installaties nodig. Bij een laadprobleem blijft het procedurele reservemodel zichtbaar. De generator maakt zowel de losse GLBs als de identieke offlineversie opnieuw: `node scripts/build-character-assets.cjs`. Zie ook [de assetdocumentatie](assets/characters/README.md).

## Heroïsche heldenstijl

Versie 1.3 geeft de speler langere benen en armen, een kleiner hoofd, een gevormde kaak/neus en kleine amandelvormige ogen. De reiziger draagt een passend leren vest, een schuine draagriem, een verstevigde schouder, gespen en reistasjes. Flame Guardian draagt een gebogen borstplaat, overlappende buik-/schouder-/armplaten, goudinleg, sintelkristallen en een lange geborduurde mantel. De drie kapsels bestaan uit taps toelopende haarlokken; hun geometrie is per kapsel samengevoegd tot één drawcall en wordt tussen speler en preview gedeeld.

Verzamelde helmen, schouders, borstpantser, handschoenen en laarzen gebruiken dezelfde vormtaal en passen op de nieuwe verhoudingen. Het zwaard heeft een scherpe punt, een geslepen doorsnede en een gevormde pareerstang. De character creator toont de juiste classkleuren met zachter studiolicht en een draaiplateau. Het zijn originele gestileerde fantasy-modellen; de wereld en NPC's behouden hun bestaande stijl.

Botnamen, bevestigingspunten en de grondpositie van de voeten blijven bruikbaar voor de bestaande animaties en uitrusting. De rustverhoudingen en GLB-bindmatrices zijn samen bijgewerkt. Het opslagformaat en de spelregels veranderen niet; een bestaand avontuur kan direct verder.

## Karakteranimaties

Versie 1.5 gebruikt afstandgestuurde loop- en rencycli, vloeiende overgangen en tweebots-IK: een steunvoet blijft op dezelfde plek in de wereld staan terwijl de knie meebuigt. De heupen volgen het steunbeen. Draaien gaat vloeiend; stilstaan tegen een obstakel speelt geen renanimatie af. Teleports en gebiedswissels resetten de voetankers. De voorwaartse rol vouwt knieën, armen en mantel in en keert daarna terug naar de gewone houding.

De drie zwaardaanvallen hebben een voorbereiding, slag en herstel. Schade, geluid en de slagboog volgen na 0,105 seconde (slag 1/2) of 0,16 seconde (finish). Pauze, rollen en een wapenwissel annuleren een voorbereide slag. Vijanden reageren met een korte, gedempte beweging.

De Woudloper houdt de boog in de linkerhand en trekt met de rechterhand de pees terug; de pijlnok volgt de pees. Bij loslaten verschijnt de vliegende pijl op de plek van de vastgehouden pijl. De Magiër houdt de staf met een gebogen arm vast en spreuken vertrekken uit het kristal. De eerste botsingscontrole omvat ook het stuk tussen speler en wapen, zodat dichtbij gelegen obstakels en vijanden geraakt blijven worden. De character creator toont het juiste startwapen voor iedere class.

De gewogen modellen volgen alle procedurele animaties. Botgewichten laten romp en ledematen meebuigen. Haar en mantel krijgen lichte secundaire beweging. De mantel gebruikt het `back`-bot; harde pantserdelen blijven aan hun betreffende bot bevestigd. Er zijn geen losse externe animatiebestanden nodig.

## Character creator

Bij een nieuw avontuur open je de character creator na **Kies je class**. In een aparte realtime Three.js-preview kies je een klassiek uiterlijk of Flame Guardian, drie kapsels (kort, lang, vlecht), vijf haarkleuren, vier huidtinten en vier oogkleuren. Met de knoppen onder de preview draai je je personage. De klasse bepaalt de gameplay en blijft losstaan van het cosmetische uiterlijk.

In een bestaand avontuur: druk op **I → Personage aanpassen**. Je kunt daar je uiterlijk bijstellen zonder je klasse, level, quests of uitrusting te verliezen. Wijzigingen worden pas opgeslagen met **Bewaar uiterlijk**; **Terug** annuleert ze. Je oude save wordt automatisch uitgebreid met veilige standaardwaarden. De bestaande `skinId` blijft ondersteund, en aanvullende keuzes worden opgeslagen onder `appearance`. De nieuwe UI gebruikt één gedeelde `EmberAppearance`-module voor gamepersonage en preview; geen buildstap of extra externe dependencies.

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
- Schildwachters houden hun schildgerichte houding, kondigen zware klappen duidelijk aan en kunnen een volgende pijl zijwaarts ontwijken.
- Bosgeesten proberen op afstand te blijven, tonen een paarse waarschuwing voordat ze hun projectiel lanceren en wijken terug wanneer je dichtbij komt.
- Elke gewone melee-aanval toont eerst een gekleurde, pulserende waarschuwingsring op de grond. Beweeg of rol uit het bereik voordat de slag valt; een eigen melee-treffer kan de voorbereiding van de tegenstander onderbreken.
- Verrassingsschoten met een boog blijven raakbaar van buiten detectieafstand. Eerder gealarmeerde vijanden mogen volgende pijlen proberen te ontwijken; botsingen en blokkeringen blijven leidend.
- De bestaande aanvallen en telegraphs van Doornwachter en Wortelmoeder blijven behouden. Quests, loot en save-indeling veranderen niet. De AI-status bestaat alleen gedurende de huidige speelsessie.

## Loot en progressie

Vijanden kunnen bij verslaan willekeurige uitrusting laten vallen. Gewone vijanden hebben ongeveer 57% dropkans; geesten 78%, schildwachters 70% en eindbazen altijd een drop. De verdeling van gewone drops is 55% **gewoon**, 28% **zeldzaam**, 13% **episch** en 4% **legendarisch**. Eindbazen hebben betere kansen op epische of legendarische stukken. Iedere drop combineert een bestaand van vijf armor-slots (helm, schouders, borst, handschoenen, laarzen) met een zeldzaamheid en een willekeurig kenmerk: Levenskracht, Woede, Scherpschutter, Bescherming of Sintelvuur.

Na het verslaan verschijnt een draaiende 3D-kristal op de grond, gekleurd naar zeldzaamheid. Ga binnen 2,5 speleenheden staan en druk op **E** om de buit op te pakken. Buit die nog op de grond ligt, wordt net als de verzamelde loot opgeslagen bij je avontuur en opnieuw getoond na laden. De inventaris onder **I → Gevonden buit** toont statvergelijkingen met het momenteel uitgeruste item, een knop voor uitrusten/afleggen en een verkoopknop. Er passen maximaal 32 gevonden items in je reistas en 32 zichtbare drops in de wereld. Verkoop is onmogelijk zolang een item is uitgerust.

De gemaakte combinaties zijn cosmetisch zichtbaar via de reeds bestaande 3D-pantsermodellen, nu met hun zeldzaamheidskleur. Basispantser en unieke loot gebruiken hetzelfde armor-slot, dus bonussen tellen niet dubbel. Extra statistieken naast HP en schade zijn **boogschade** (Scherpschutter / Sintelvuur) en **schadevermindering** (Bescherming). De bestaande vijanden, quests, unieke boss-buit, character creator en opslagsleutel blijven intact. Bij het laden worden items en terreinlocaties strikt gevalideerd; savebestanden kunnen geen willekeurige itemnamen, IDs of statistieken injecteren. De waarde van bonussen komt alleen uit vooraf gedefinieerde itemtemplates, niet uit opgeslagen invoer.

Test met `node --test tests/*.cjs`. De browser-smoketest omvat een echte lootinteractie, het vergelijkingspaneel, uitrusten en opnieuw laden.

## Publiceren via GitHub Pages

Zet de volledige repository op GitHub, inclusief `vendor/`, `js/` en `assets/`. Kies bij **Settings → Pages** voor **Deploy from a branch → main → / (root)** en sla op. Er is geen buildstap. De game staat voor deze repository op https://evmob30-web.github.io/testapp/. Bij een oude gecachete versie helpt **Ctrl+F5**. Publiceren vervangt geen lokale spelersvoortgang.

Voor de browser-smoketest kan optioneel `EMBERWILD_CHROMIUM_PATH` naar een bestaande Chromium-installatie verwijzen. Zonder die variabele gebruikt de test de door Playwright geïnstalleerde browser.

Op een beheerde testmachine die `file://`-navigatie blokkeert kan `node scripts/browser-start.cjs --http-only` alleen de HTTP-controles uitvoeren. GitHub Actions gebruikt altijd de volledige test, inclusief rechtstreeks openen.

De browsercontrole omvat ook een afzonderlijk Magiër-avontuur: class/preview, staf en manabalk, beide spreuken, pauze, wapens wisselen, uiterlijk aanpassen en opslagherstel. Voor een lokale HTTP-server op een andere poort kan `EMBERWILD_BASE_URL` worden ingesteld; GitHub Actions gebruikt standaard `http://127.0.0.1:8765/` en blijft rechtstreeks openen mee testen.
