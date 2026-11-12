# Magiër: barrière, Blink en Lyra

Deze uitbreiding blijft op `feature/quest-loot-system`. Samenvoegen en publiceren via `main` gebeurt pas na review.

## Spelersroute

Maak een Magiër of speel verder met een bestaande. Magistra Lyra staat op (-20, 27), in het zuidwesten van het dorp. Drie opeenvolgende, zelfstandig te voltooien lessen laten een nieuwe Magiër niveau 2 en 3 bereiken. Een bestaande Magiër kan dezelfde eenmalige quests volgen; spreuken hangen van het niveau af, niet van het voltooien van de opleiding. Andere classes zien geen Mage-quests of nieuwe actieknoppen.

| Les | Daadwerkelijke actie | Vereiste | Beloning |
| --- | --- | --- | --- |
| Een vonk onder controle | Drie Vonkbolprojectielen raken het kristal | Magiër, niveau 1 | 60 XP, 10 goud |
| De beschermende kring | Een barrière absorbeert een veilige oefenpuls in de kring | Vorige les ingeleverd, niveau 2 | 120 XP, 15 goud |
| Een stap tussen sterren | Blink van de gouden rune naar de blauwe rune | Vorige les ingeleverd, niveau 3 | 90 XP, 25 goud |

Alleen geaccepteerde lessen tonen hun eigen oefenobjecten. Oefenpulsen trekken nooit gezondheid af. Het kristal is geen vijand en levert geen kill-XP of buit op. Lopen, een mislukte Blink of een pijl voltooit geen magiedoel. Inleveren is beschermd tegen dubbele beloningen.

## Regels en opslag

- Barrière: toets 3, niveau 2, 20 mana, 5 s, capaciteit `42 + 3 × niveau`, afkoeltijd 14 s. Pantser wordt eerst verwerkt, dan de barrière en dan eventuele gezondheidsschade. Ontwijken verbruikt geen barrière. Bij een nederlaag verdwijnt de bescherming.
- Blink: toets 4, niveau 3, 18 mana, afkoeltijd 8 s, maximaal 6,5 eenheden. Looprichting gaat voor kijkrichting. De route wordt in stappen van maximaal 0,08 gecontroleerd, inclusief de botsingsstraal van de speler (0,55). Onder 0,75 eenheid vrije ruimte blijft mana/afkoeltijd onaangeroerd. De grot gebruikt dezelfde wand- en deurregels als lopen.
- `magePowers` bewaart de bescherming en absolute deadlines op `encounters.clock`. Deze klok loopt uitsluitend tijdens spelen. Herladen, menu’s en offline wachten geven geen gratis reset en laten de bescherming niet aflopen.
- Oude versie-1-saves blijven bruikbaar. Ontbrekende velden worden aangevuld, ongeldige waarden begrensd. Slots behouden hun eigen questvoortgang, inventaris, spells en deadlines.
- Questdefinities ondersteunen nu optionele `classId`, `minLevel` en `requires`. Een ontbrekende classcontext geeft geen toegang tot classgebonden quests. Bestaande onbeperkte questdefinities werken met dezelfde API.

## Bestanden

`js/mage.js` bevat pure spreukregels, de staf en de hergebruikte barrièrevisual. `js/mage-training.js` bevat voortgangsregels, Lyra en de uitsluitend tijdens lessen zichtbare oefenobjecten. `js/adventure-data.js` beschrijft de lesketen. `js/game.js` verbindt invoer, echte botsingen, schade en HUD. `js/quest-system.js` controleert class, niveau en eerdere lessen. De boomgenerator maakt alleen ruimte bij de nieuwe oefenplekken; het terrein en de andere willekeurige objectposities behouden hun uiterlijk en seedvolgorde.

De questsymbolen hebben ook `frustumCulled=false`: bij een sprite die onderaan verankerd is mag Three.js geen gecentreerde bol gebruiken die het symbool bij de schermrand te vroeg laat verdwijnen.

## Controles

```sh
node --test tests/*.cjs
node --check js/game.js
python3 -m http.server 8765 --bind 127.0.0.1
# In een tweede terminal, met Playwright geïnstalleerd:
node scripts/browser-mage-training.cjs
node scripts/browser-start.cjs
```

`EMBERWILD_CHROMIUM_PATH` kan naar een geïnstalleerde Chrome/Chromium wijzen. `EMBERWILD_BASE_URL` kan een andere lokale server-URL opgeven. De gerichte browsercontrole stuurt echte DOM-knoppen, looptoetsen en spreuktoetsen door de volledige lesketen; alleen tussenliggende GPU-tekenbeurten worden overgeslagen. Zij controleert echte projectieltreffers, onschadelijke pulsen, levels, barrière, Blink, pauze, herladen, eenmalige beloningen en het smalle HUD. Screenshots verschijnen als `/tmp/emberwild-mage-*.png`. De volledige browserworkflow bevat deze controle naast de bestaande quests, gevechten, terrein-, wolf- en questsymboolcontroles, plus direct openen van `index.html`.
