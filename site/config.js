// =====================================================================
//  CONFIGURATION — le SEUL fichier à modifier
//  Tant que Supabase n'est pas rempli, le site tourne en MODE DÉMO
//  (tout fonctionne, les données restent dans ton navigateur).
// =====================================================================
window.APP_CONFIG = {
  // ---------- Identité ----------
  SITE_NAME: "Siba Cash Empire",
  // Les mots entre *étoiles* s'affichent en dégradé de couleur
  HERO_EYEBROW: "Accompagnement TikTok & YouTube faceless",
  HERO_TITLE: "Zéro visage. Zéro excuse. Des vidéos qui *rapportent*.",
  HERO_SUBTITLE: "Je t'accompagne pour créer des chaînes *TikTok* et *YouTube* faceless rentables, sans jamais montrer ton visage. Méthode pas à pas, coachs, communauté et lives.",
  // Vidéo de présentation : se règle maintenant dans Admin › Page d'accueil.
  // Ce lien n'est utilisé que si rien n'est réglé dans l'Admin.
  HERO_VIDEO: "https://youtu.be/IQJhluLQ2T0",
  CTA_LABEL: "Je rejoins l'accompagnement",

  // ---------- Prix ----------
  PRICE_LABEL: "99 €",
  // Montant réellement encaissé par SasPay (en FCFA). 65 000 FCFA ≈ 99 €.
  // À changer AUSSI dans Supabase > Edge Functions > Secrets > PRICE_XOF.
  PRICE_LOCAL_LABEL: "65 000 FCFA",
  OLD_PRICE_LABEL: "",                 // ex. "197 €" (prix barré) — laisse "" si pas de promo
  PRICE_NOTE: "Paiement unique · Accès à vie · Accès immédiat",
  // Message sur l'évolution du prix (affiché dans la section Prix). "" pour le masquer.
  PRICE_INCREASE_NOTE: "Le prix augmentera au fur et à mesure qu'on ajoute des modules et des lives. Si tu rejoins maintenant, tu paies une seule fois ce prix-là et tu gardes l'accès à vie, y compris à tout ce qui sera ajouté ensuite.",
  // Date de fin d'une VRAIE offre (ex. "2026-11-30T23:59:00"). null = pas de compte à rebours.
  OFFER_END: null,

  // ---------- Branchements (voir README) ----------
  // Clé "anon" : publique par conception (protégée par les règles de sécurité de la base)
  SUPABASE_URL: "https://kveaxksjniqsmyhivvqx.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWF4a3Nqbmlxc215aGl2dnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjU5MDcsImV4cCI6MjA5OTQ0MTkwN30.CAqCL1PncYif7Y0Wk3-3p_obgK7WwCifF2twKq1nMYk",
  // Paiement : "saspay" (mobile money + cartes, Afrique et international) ou "stripe"
  PAYMENT_PROVIDER: "saspay",
  STRIPE_PAYMENT_LINK: "https://buy.stripe.com/VOTRE_LIEN",

  // ---------- Contact ----------
  CONTACT_EMAIL: "contact@exemple.fr",
  WHATSAPP: "",                        // ex. "33612345678" (bouton WhatsApp flottant). "" = masqué
  // Tes liens (laisse "" pour masquer l'icône)
  SOCIALS: { tiktok: "https://www.tiktok.com/", youtube: "https://www.youtube.com/" },

  // ---------- Contenu de la page d'accueil ----------
  // Chiffres affichés sous le titre : mets-les à jour pour qu'ils restent vrais
  STATS: [
    { value: "16", label: "modules vidéo" },
    { value: "6", label: "parcours : TikTok, YouTube, Afrique…" },
    { value: "0", label: "visage à montrer" },
    { value: "∞", label: "accès à vie" },
  ],

  // Le programme affiché sur l'accueil, par parcours (les vraies vidéos s'ajoutent dans Admin)
  PROGRAM: [
    { title: "Commencer ici", desc: "Le mode d'emploi de l'accompagnement et les bases du contenu faceless.", duration: "Parcours", lessons: "2 modules" },
    { title: "TikTok faceless", desc: "Compte, niche, scripts, voix off, montage et algorithme : tout pour exploser sur TikTok sans visage.", duration: "Parcours", lessons: "4 modules" },
    { title: "TikTok depuis l'Afrique", desc: "Ce qui marche quand tu crées depuis l'Afrique, et comment monétiser ton audience concrètement.", duration: "Parcours", lessons: "2 modules" },
    { title: "YouTube faceless", desc: "Chaîne, vidéos longues en voix off, miniatures, Shorts et Programme Partenaire YouTube.", duration: "Parcours", lessons: "5 modules" },
    { title: "Monétisation", desc: "Affiliation, partenariats de marque et vente de tes propres produits digitaux.", duration: "Parcours", lessons: "2 modules" },
    { title: "Bonus face caméra", desc: "Pour ceux qui veulent aussi se montrer : tourner, parler et monter.", duration: "Bonus", lessons: "1 module" },
  ],

  // Miniatures des modules dans l'espace membre : le module dont le titre commence par "match"
  // affiche cette image en haut de sa carte (images dans assets/covers/, format 16:9).
  MODULE_COVERS: [
    { match: "Bienvenue", image: "assets/covers/bienvenue.jpg" },
    { match: "Passeport TikTok", image: "assets/covers/passeport-tiktok.jpg" },
    { match: "Positionnement", image: "assets/covers/positionnement.jpg" },
    { match: "Contenu viral", image: "assets/covers/contenu-viral.jpg" },
    { match: "Montage vidéo", image: "assets/covers/montage-viral.jpg" },
  ],

  // Encadrés « 📖 » affichés en bas de la liste des leçons d'un module (le module dont le titre commence par "match")
  MODULE_NOTES: [
    {
      match: "Passeport TikTok",
      title: "Tu vis en France ?",
      subtitle: "Réservé aux personnes qui vivent en France",
      paragraphs: [
        "Si tu vis en France et que tu as une carte SIM française, tu n'as pas besoin de suivre les étapes de ce module.",
        "Tu peux créer ton compte TikTok directement, comme la plupart des gens : télécharge TikTok sur l'App Store ou Google Play, puis choisis comment t'inscrire selon le pays que tu veux viser :",
        "🇫🇷 Tu veux cibler la France ? Inscris-toi directement avec ton numéro de téléphone français.",
        "🌍 Tu veux cibler un autre pays que la France ? Inscris-toi avec ton adresse Gmail.",
        "Besoin d'aide ? Tape simplement sur YouTube « comment créer un compte TikTok depuis la France » : tu trouveras des tutos pas à pas.",
      ],
    },
    {
      match: "Positionnement",
      title: "La liste des niches qui marchent",
      subtitle: "Les 30 meilleures niches faceless + ta fiche à remplir",
      paragraphs: [
        "Étape 1 : ouvre la liste des niches. Pour chacune des 30 niches : les sous-niches, des idées de vidéos prêtes à faire et des captures de vrais comptes qui cartonnent.",
        "Étape 2 : choisis ta niche, puis remplis ta fiche « Ma niche ». Tes réponses m'arrivent directement en message privé : je te connais avant notre échange et je t'aide à rendre ta niche virale.",
        "Rappel : tu t'inspires de la recette des comptes, tu ne reposts jamais leurs vidéos.",
      ],
      links: [
        { label: "📄 Ouvrir la liste des niches", url: "https://docs.google.com/document/d/1PnPJAyJLbWNJ2nF4ZZMqO94anYg3g2hi90ive_OmM9M/edit?usp=sharing" },
        { label: "📝 Remplir ma fiche niche", url: "#/ma-niche" },
      ],
    },
  ],

  // Les 30 niches proposées dans le formulaire « Ma niche » (même ordre que le Google Doc)
  NICHES: [
    "Football", "Sports de combat", "Chiens", "Chevaux", "Animaux sauvages",
    "Cuisine", "Nettoyage de piscine", "Nettoyage de WC publics", "Nettoyage de plage", "Nettoyage de maison et de tapis",
    "Restauration d'objets", "Voitures", "Motos", "Aménagement de camping-car et camions", "Construction et chantiers",
    "Bricolage", "Jardinage", "Coiffure", "Tatouage", "Voyage",
    "Corée et Japon", "Armée et militaire", "Histoire", "Faits divers et mystères", "Quiz et culture générale",
    "Argent et milliardaires", "IA avec Claude", "Séduction", "Psychologie et motivation", "Sons relaxants et ASMR",
  ],

  // icônes possibles : play, chat, coach, live, chart, infinity
  BENEFITS: [
    { icon: "play", title: "Des vidéos de formation courtes", text: "Chaque leçon va droit au but. Tu regardes, tu appliques, tu publies." },
    { icon: "chat", title: "Une communauté de créateurs faceless", text: "Partage tes vidéos, reçois des retours et échange tes niches et tes outils." },
    { icon: "coach", title: "Des coachs en message privé", text: "Envoie ta vidéo ou ta question, un coach te répond directement." },
    { icon: "live", title: "Des lives chaque semaine", text: "Analyse de chaînes en direct, questions/réponses et défis de publication." },
    { icon: "chart", title: "Ta progression suivie", text: "Tu sais toujours où tu en es et tu reprends là où tu t'es arrêté." },
    { icon: "infinity", title: "Accès à vie", text: "Un seul paiement. Les nouveaux modules sont inclus dès leur sortie." },
  ],

  FOR_YOU: [
    "Tu veux créer une source de revenus en ligne sans montrer ton visage",
    "Tu veux lancer une chaîne TikTok ou YouTube faceless (ou en relancer une)",
    "Tu veux une méthode claire plutôt que des conseils au hasard",
    "Tu es prêt à publier régulièrement et à progresser vidéo après vidéo",
  ],
  NOT_FOR_YOU: [
    "Tu cherches de l'argent facile du jour au lendemain, sans effort",
    "Tu n'as pas l'intention de publier de vidéos",
    "Tu veux seulement « regarder » sans jamais appliquer",
  ],

  COMPARISON: [
    "Trouver une niche faceless rentable",
    "Savoir quoi publier chaque semaine",
    "Comprendre pourquoi une vidéo ne marche pas",
    "Des retours sur tes vidéos",
    "Des créateurs qui avancent avec toi",
    "Des lives avec les coachs",
  ],

  // Avis de VRAIS clients uniquement. La section est masquée tant que la liste est vide.
  // Exemple : { name: "Prénom N.", role: "Freelance", text: "Ce que la personne a dit…" }
  TESTIMONIALS: [],

  FAQ: [
    { q: "Quand est-ce que j'ai accès au contenu ?", a: "Immédiatement après ton paiement. Tu es automatiquement redirigé vers ton espace membre." },
    { q: "Comment je me connecte ?", a: "En un clic avec ton compte Google (Gmail). Pas de mot de passe à retenir." },
    { q: "Est-ce un abonnement ?", a: "Non. C'est un paiement unique, et tu gardes l'accès à vie, mises à jour comprises." },
    { q: "Le prix va-t-il changer ?", a: "Oui, il augmentera à mesure que la formation s'enrichit. Mais une fois que tu as payé, tu ne repaies jamais : ton accès à vie est garanti au prix de ton inscription." },
    { q: "Qui m'aide si je bloque ?", a: "Tu peux écrire en privé aux coachs, poser ta question dans la communauté, ou venir aux lives." },
    { q: "Dois-je montrer mon visage ?", a: "Non. La formation est centrée sur le faceless : voix off, visuels et montage, sans jamais apparaître. Si un jour tu veux te montrer, un module bonus t'apprend le face caméra." },
    { q: "Il me faut du matériel ?", a: "Non. Un ordinateur ou un smartphone suffit, et on utilise des outils gratuits comme CapCut." },
    { q: "Est-ce que je vais forcément gagner de l'argent ?", a: "On t'apprend les méthodes qui permettent de monétiser une chaîne faceless. Les résultats dépendent de ton travail et de ta régularité : personne ne peut te garantir un revenu." },
    { q: "Je débute complètement, c'est pour moi ?", a: "Oui. On part de zéro, et si tu publies déjà, les modules avancés t'aident à passer un cap." },
    { q: "Combien de temps dois-je y consacrer ?", a: "Les leçons sont courtes. Avec 2 à 3 heures par semaine, tu avances déjà très bien." },
    { q: "Comment je peux payer ?", a: "Par mobile money : Wave, Orange Money, MTN MoMo, Moov Money ou Djamo (Côte d'Ivoire, Sénégal, Bénin, Burkina Faso, Cameroun et d'autres pays d'Afrique). Le paiement se fait sur une page sécurisée. Tu n'as pas de mobile money ? Écris-nous, on trouve une solution." },
  ],
};
