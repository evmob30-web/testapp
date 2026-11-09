# Emberwild — De laatste vonk · versie 0.5.2

Een originele singleplayer-actie-RPG in 3D: de Schemervallei met een dorp, bos en ruïne, plus de Wortelgrotten met drie verbonden kamers. Alle personages, modellen en verhalen zijn eigen werk. Three.js verzorgt WebGL; er worden geen Warcraft-assets gebruikt.

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

De Woudloper heeft snelheid 5,5 en 1,15 s ontwijkafkoeltijd; de Wachter snelheid 5 en 1,35 s. Vonkpijl vuurt een krachtige magische pijl op een nabije vijand af (4 s afkoeltijd); Vonkflits heeft een afkoeltijd van 3,5 s.

Je class blijft bij het personage. Bestaande opslag wordt als Wachter geladen zonder verlies van voortgang. ‘Ga verder’ laadt je opgeslagen class direct. Via pauze → ‘Nieuw avontuur’ kun je opnieuw kiezen; de nieuwe start vervangt je ene opgeslagen avontuur. Teruggaan uit de classkeuze laat de huidige voortgang intact. Er zijn nog geen meerdere personageslots of classes buiten deze twee.

## Besturing

| Invoer | Actie |
| --- | --- |
| WASD / pijltjes | Bewegen ten opzichte van de camera |
| Shift | Rennen |
| Rechtermuis slepen | Camera draaien en kantelen; met een zwaard werkt links slepen ook |
| Muiswiel | In- en uitzoomen |
| 1 / linkermuisknop | Zwaard: slaan; boog: vasthouden om te laden en loslaten om te schieten |
| Muis bewegen met boog | Richten met het vizier |
| F | Wisselen tussen zwaard en boog, zodra de boog beschikbaar is |
| 2 | Classvaardigheid: Vonkflits (Wachter) of Vonkpijl (Woudloper) |
| Spatie | Voorwaartse ontwijkrol in je bewegingsrichting; 0,38 s bescherming, afkoeltijd afhankelijk van class |
| Q | Levensdrank; herstelt tot 70 gezondheid |
| E | Praten, verzamelen, deur openen of gebied betreden/verlaten |
| I | Inventaris en uitrusting |
| Esc | Pauze / menu sluiten |

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

Automatische localStorage-opslag iedere vijf spelseconden en na belangrijke acties, gebiedswissels en pauzeren. Opslagsleutel: `emberwild-save-v1`. Oudere opslag van versie 0.1/0.2/0.3/0.4 blijft bruikbaar; hoofdstuk 2 begint pas nadat je de nieuwe opdracht aanneemt. Je hoeft niet opnieuw te beginnen.

‘Ga verder’ verschijnt bij een bruikbare opslag. ‘Nieuw avontuur’ vervangt de voortgang; tijdens spelen wordt hiervoor bevestiging gevraagd. Voortgang is gebonden aan dezelfde browser en hetzelfde site-adres. Bij geblokkeerde opslag blijft spelen mogelijk voor de huidige sessie. Geen cloudopslag of multiplayer.

Geluiden worden via Web Audio gemaakt na een gebruikersactie. Met ‘Geluid aan/uit’ kun je dempen; de voorkeur blijft lokaal bewaard. Er is geen achtergrondmuziek. In de vallei hoor je zachte procedurele wind en vogels; in de Wortelgrotten hoor je zachte ruis en druppels met korte echo’s. Omgevingsgeluid start na gebruikersinvoer, pauzeert tijdens menu’s of verlies van vensterfocus en wordt samen met de effecten gedempt. Eén hergebruikte ruislus en enkele korte tonen houden het audiowerk beperkt.

## Bestanden

- `index.html`, `style.css`: interface en menu's.
- `js/core.js`: spelregels, opdrachten, uitrusting, beloningen en opslagvalidatie.
- `js/combat.js`: ontwijkregels, afkoeltijden, eerste projectieltreffers, schildhoeken en begrensd draaien.
- `js/archery.js`: boogmodel, boogpees, herbruikbare pijlmodellen en oefendoelen.
- `js/world.js`: procedurele vallei, modellen, animaties en gevechtseffecten.
- `js/dungeon.js`: drie kamers, vloeren, wanden, deur, sleutel, altaar, gebiedsweergave en loopruimte.
- `js/exploration.js`: Mira, Tovin, kruiden, heiligdom en bloemspoor.
- `js/audio.js`: procedurele geluidseffecten, omgevingsgeluid en dempknop.
- `js/game.js`: camera, invoer, gevechten, gebiedswissels, interacties, HUD en opslag.
- `vendor/three.min.js`: Three.js 0.160.1, MIT-licentie in `vendor/THREE-LICENSE.txt`.
- `tests/`: Node.js-tests.

## Controle

Met Node.js 18+: `node --test tests/*.cjs`.

30 tests geslaagd. Ze controleren beide opdrachtketens, kamerbereikbaarheid en deurblokkering, oude en nieuwe opslag, uitrusting, herhaalde beloningen, niveauverhogingen, audio, rollen en projectielbotsingen. De integratietest bouwt de echte Three.js-wereld op en voltooit beide hoofdstukken met gesimuleerde invoer. Hij test ook beide aanvalspatronen van de Wortelmoeder, het amulet, gebiedswissels en doodgaan in de grot, de zijmissie, bereikbare verkenningsplekken, kruiden plukken, drankjes maken en de Woudzegen. Extra controles testen classkeuze en annuleren, legacy-opslag als Wachter, de Woudloper-start, een werkende Vonkpijl, geladen pijlen op echte oefendoelen, boogtraining, schildblokkering en flanktreffers, muisbesturing en het afbreken van laden. Nieuwe regressiecontroles verifiëren verborgen questobjecten vóór aannemen, verschijnen bij voortgang, verborgen interacties/recepten, herstel na gebiedswissels en dat onzichtbare oefendoelen geen pijlen blokkeren. Audiotests controleren ook de omgevingslus, gebiedswissels, pauze en dempen. JavaScript-syntax en relatieve bestandsverwijzingen zijn gecontroleerd.

De test vervangt DOM en WebGL-renderer en controleert geen uiteindelijke pixels of hardwareprestaties. De voorgeschreven browsertool was niet beschikbaar voor een visuele browsercontrole. Vloertegels in de grot worden in twee InstancedMesh-batches getekend om het aantal tekenaanroepen klein te houden.

Dit is een eerste speelbare RPG met twee gebieden, twee classes, twee korte hoofdstukken en eenvoudige modellen en AI. Nog geen uitgebreide uitrustingssystemen, sprongen, multiplayer of extra kerkers.

## Herbruikbaar 3D-personageskelet (experimenteel)

`js/character-rig.js` biedt `EmberCharacterRig.create(THREE, {skin:'guardian'})`. Het retourneert een `group`, `model`, `joints`, een `THREE.Skeleton`, `animate(time,moving,attacking)` en `setSkin(name)`. De benoemde `THREE.Bone`-gewrichten omvatten heupen, rug, borstkas, nek, hoofd, schouders, ellebogen, handen, dijen, knieën, voeten en `weapon_r` / `back` voor uitrusting.

De bestaande speler gebruikt het skelet. `guardian`, `ranger` en `flame_guardian` zijn **voorlopig kleurvarianten van een eenvoudig opgebouwd prototype**; de gedetailleerde Flame Guardian uit de concepttekening is nog niet gemodelleerd. De huidige meshes zijn star aan de botten bevestigd: dit is dus wel een echte bot-hiërarchie maar nog **geen weight-painted, vervormbare SkinnedMesh**. Voor definitieve GLB-skins zijn mesh, weights, UV/texturen en eventueel animatie-retargeting nodig. Questdata, bestaande saves en besturing blijven onveranderd.

Controle: `node --test tests/*.cjs` (ook `tests/character-rig.test.cjs`).

## Stylized character-upgrade

De speler gebruikt nu gladdere procedurele vormen: ellipsoïden voor gezicht/romp/voeten, taps toelopende cilinders voor ledematen en smooth-shaded materialen. De Flame Guardian heeft rondere bepantsering, nieuwe gezichtsdetails en haarlokken van gebogen buizen. Dit alles gebruikt de bestaande botstructuur en skin-wisselaar; de voortgang en classes blijven gelijk. De personages zijn nog opgebouwd uit rigide delen op botten, niet uit één gewichtsgeschilderde SkinnedMesh of geïmporteerde GLB. Voor naadloze vervorming en hoogwaardige handgeschilderde texturen is een volgende stap met een echt art-asset nodig.

## Karakteranimaties v0.6

Het gedeelde rig-systeem biedt procedurele idle-ademhaling, een zacht gemengde loop- en renbeweging, kniebeweging, armzwaai en een zwaardaanval met follow-through. De Flame Guardian heeft lichte secundaire beweging op haarlokken en cape. Het huidige 3D-model blijft uit losse, aan botten bevestigde onderdelen bestaan; het is nog geen gewichtsgeschilderde SkinnedMesh. De gameplay- en savestructuur veranderen niet.

## Character creator (v0.7)

Bij een nieuw avontuur open je de character creator na **Kies je class**. In een aparte realtime Three.js-preview kies je een klassiek uiterlijk of Flame Guardian, drie kapsels (kort, lang, vlecht), vijf haarkleuren, vier huidtinten en vier oogkleuren. Met de knoppen onder de preview draai je je personage. De klasse bepaalt de gameplay en blijft losstaan van het cosmetische uiterlijk.

In een bestaand avontuur: druk op **I → Personage aanpassen**. Je kunt daar je uiterlijk bijstellen zonder je klasse, level, quests of uitrusting te verliezen. Wijzigingen worden pas opgeslagen met **Bewaar uiterlijk**; **Terug** annuleert ze. Je oude save wordt automatisch uitgebreid met veilige standaardwaarden. De bestaande `skinId` blijft ondersteund, en aanvullende keuzes worden opgeslagen onder `appearance`. De nieuwe UI gebruikt één gedeelde `EmberAppearance`-module voor gamepersonage en preview; geen buildstap of extra externe dependencies.

Test lokaal met `node --test tests/*.cjs`. De Playwright-smoketest opent daarnaast de creator en controleert de preview, cosmetische keuzes, bewerken vanuit de inventaris en opslag na herladen.

## Pantser en uitrusting (v0.8)

Open tijdens het spelen met **I** de inventaris. Onder **Uitrusting** staan vijf losse slots: hoofd, schouders, borst, handschoenen en laarzen. Selecteer een verzameld pantserstuk om het uit te rusten; klik nogmaals of op het bezette slot om het af te doen. Alle stukken zijn zichtbaar op de overeenkomstige botten van het 3D-personage en kunnen worden gedragen met zowel het klassieke uiterlijk als de Flame Guardian.

Er zijn tien verschillende stukken (reizigers- en vonkensets). Je begint met een borstpantser en laarzen, ontvangt automatisch eenmalige beloningen voor bestaande kisten, vijanden, boogtraining, zijquests, heiligdom en Wortelgrotten en kunt overige stukken met goud kopen in **Bram's pantseraanbod** in je inventaris. Koopbedragen worden maar één keer afgeschreven; een tweede aankoop van hetzelfde stuk is uitgesloten. Pantser verhoogt de maximale gezondheid en/of schade; de boog krijgt dezelfde schadebonus. Hartamulet en wapens blijven aparte systemen.

Veldnamen voor opslag: `armorOwned` is een opgeschoonde lijst met bekende stuk-IDs; `armorEquipped` is een object van vijf slots naar een stuk-ID of `null`. Ongeldige, niet-bezette en niet-bezittende IDs worden tijdens herstel verwijderd. Bestaande saves krijgen gratis basisstukken, behouden level/quests/uiterlijk en ontvangen reeds verdiende beloningen uit hun voortgang, zonder dat hun bestaande uitrusting automatisch verandert.

De uitrusting is gemodelleerd met lichtgewicht afgeronde meshes die aan de gedeelde botten vastzitten. Dit is nog geen gewichtsgeschilderde SkinnedMesh of apart geïmporteerde GLB.

## Gevechten v0.9 — drie slagen
Zwaardaanvallen volgen een 3-staps combo: **Snelle slag** (100% schade), **Kruisslag** (120%) en **Vuurfinish** (165%). De volgende slag moet binnen 0,9 seconde na de vorige worden uitgevoerd en respecteert een eigen cooldown. Daarna begint de keten opnieuw. Rollen, wapens wisselen en magie gebruiken resetten de keten. De HUD laat de actieve combo zien. Boog en boogtraining blijven ongewijzigd. Elk stadium heeft eigen zwaard- en lichaamsanimatie, kleur en slagboog; magie heeft gloeiende inslagen. Vijanden tonen een visuele hitreactie en gewone tegenstanders worden kort onderbroken, zonder eindbaaspatronen te veranderen. De combostatus wordt niet opgeslagen en beïnvloedt bestaande saves niet.
