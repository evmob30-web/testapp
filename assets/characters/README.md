# Originele Emberwild-personages

Versie 1.2 bevat `ember-adventurer.glb` (klassieke avonturier) en `flame-guardian.glb` (Flame Guardian). Beide zijn zelfstandige glTF 2.0-bestanden met gewogen meshes, twintig benoemde botten, PBR-materialen en een ingesloten originele PNG-oppervlaktetextuur. Er zijn geen gekochte modellen of externe game-assets gebruikt.

De reproduceerbare bron staat in `scripts/build-character-assets.cjs`. Voer vanuit de repository `node scripts/build-character-assets.cjs` uit met Node.js 18+. Alleen Node-standaardmodules en de bestaande lokale Three.js zijn nodig. De generator schrijft ook `js/character-assets-data.js`; werk deze samen met de GLBs bij.

De personages hebben romp-/ledemaatgewichten, gevormde gezichten, irissen, vingers, gestikte kleding, gespen en capes. Harde pantserdelen hebben één botgewicht. Het standaardkapsel maakt de losse bestanden compleet; tijdens het spelen wordt het vervangen door het gekozen kapsel uit `appearance.js`.

De botnamen en rusttransformaties komen uit `character-rig.js`. `model-assets.js` koppelt ingeladen geometrie aan die bestaande botten, zodat animaties, wapens en vijf uitrustingsslots blijven werken. GEEN vervanging van de save-structuur nodig. Geometrie is per bron gedeeld; materialen en skeletonbindings zijn per personage afzonderlijk.

Controle: `node --test tests/model-assets.test.cjs`. De browserworkflow controleert ook de echte GLTFLoader, PNG-decoding, gameplay en de preview. De modellen zijn daarnaast in Blender geïmporteerd en visueel gecontroleerd.
