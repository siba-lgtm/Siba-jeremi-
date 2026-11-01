# Siba-jeremi- — Studio Voix & Vidéo

Petite application web pour créer des **voix off avec ElevenLabs** et des **vidéos** (images/clips + voix off + sous-titres), directement dans le navigateur. Aucun serveur, aucune installation.

## Utilisation

1. Ouvre `index.html` dans Chrome, Edge ou Safari (ou active GitHub Pages, voir plus bas).
2. Colle ta clé API ElevenLabs ([elevenlabs.io → Settings → API Keys](https://elevenlabs.io/app/settings/api-keys)) et clique sur **Connecter**.
3. Choisis une voix, écris ton texte, clique sur **Générer la voix off** → écoute / télécharge le MP3.
4. Ajoute des images et/ou des vidéos, choisis le format (16:9, 9:16, 1:1), un titre, et clique sur **Créer la vidéo**.
5. Télécharge la vidéo (MP4 ou WebM selon le navigateur).

## Mettre en ligne avec GitHub Pages

Sur GitHub : **Settings → Pages → Source : Deploy from a branch**, choisis la branche et le dossier `/ (root)`. L'app sera disponible sur `https://<ton-compte>.github.io/Siba-jeremi-/`.

## Sécurité

- La clé API est stockée **uniquement dans ton navigateur** (localStorage). Elle n'est jamais écrite dans le code ni envoyée ailleurs qu'à `api.elevenlabs.io`.
- Ne partage pas ta clé et ne la mets jamais dans un fichier du dépôt.
- Chaque génération de voix consomme des crédits ElevenLabs.

## Fichiers

- `index.html` — l'interface
- `style.css` — le style (clair / sombre)
- `app.js` — appels à l'API ElevenLabs (voix, synthèse vocale) et montage vidéo (canvas + MediaRecorder)
