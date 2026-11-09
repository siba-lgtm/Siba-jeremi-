# Siba Cash Empire

Copie du site en ligne : https://siba-cash-empire.netlify.app

Récupérée depuis la version déployée sur Netlify le 9 novembre 2026. Le site est statique (HTML/CSS/JS, pas d'étape de build) : le dossier `site/` peut être glissé tel quel dans Netlify.

## Pages
- `site/index.html` — page de vente (vidéo, programme, prix, paiement SasPay, FAQ)
- `site/app.html` — espace membre (formation, communauté, coachs, calendrier, admin)
- `site/contrat.html` — signature du contrat avant paiement
- `site/associe.html` — espace associé
- `site/config.js` — **le seul fichier à modifier** pour les textes, prix, contact, FAQ…

## Ce qui n'est PAS dans ce dépôt
La partie Supabase (tables, règles de sécurité, Edge Function `saspay`, secrets comme `PRICE_XOF`) vit dans le projet Supabase `kveaxksjniqsmyhivvqx` et n'est pas récupérable depuis le site public.

## À compléter dans `site/config.js`
- `CONTACT_EMAIL` est encore `contact@exemple.fr`
- `WHATSAPP` est vide (bouton masqué)
- `SOCIALS` pointe vers tiktok.com / youtube.com génériques
- `TESTIMONIALS` est vide (section masquée)
- Liens Mentions légales / CGV / Confidentialité à vérifier
