# Architecture technique de l'application

## Objectif du projet

AnimeInfo est une application Next.js orientee media anime/manga. Elle sert a importer des contenus depuis des flux RSS, enrichir ces contenus dans un espace d'administration, publier des articles SEO-friendly, gerer un catalogue d'animes en cours, et envoyer des notifications aux visiteurs.

L'application suit une architecture simple :

1. des pages publiques rendent les contenus,
2. des routes API alimentent l'admin et les automatisations,
3. MongoDB stocke articles, animes, tendances et abonnements,
4. quelques scripts servent a importer, migrer ou re-traiter les donnees.

## Flux global de fonctionnement

### 1. Import editorial

- Les flux RSS sont lus par les utilitaires de `lib/` et par les routes cron/admin.
- Les articles entrants sont enregistres comme brouillons dans MongoDB.
- Les recommandations et les fiches anime suivent un pipeline voisin mais cible sur leur type de donnees.

### 2. Enrichissement dans l'admin

- Un admin se connecte via `/admin/login`.
- Il ouvre un brouillon, complete le titre, l'extrait, le contenu HTML, le SEO, la cover, les tags et les metadonnees anime.
- Il peut televerser une image via Cloudinary, inserer des images dans le contenu, utiliser les aides IA, previsualiser et publier.

### 3. Publication publique

- Les pages publiques lisent MongoDB.
- Les articles publies sont exposes dans les hubs publics : accueil, news, article, recommandations, categories, tendances, saison, recherche, fiche anime.
- Les flux RSS internes reutilisent aussi les donnees stockees.

### 4. Alertes et automatisation

- Le cron importe les news, met a jour les brouillons, rafraichit des tendances et peut actualiser des fiches anime.
- Les visiteurs peuvent s'abonner a des notifications email et push.

## Arborescence et role de chaque zone

### Racine du projet

- `package.json` : dependances et scripts npm.
- `next.config.ts` : configuration Next.js, redirects et remote images.
- `proxy.ts` : protection des routes admin et en-tetes de securite, y compris CSP.
- `tsconfig.json` : configuration TypeScript.
- `eslint.config.mjs` : configuration lint.
- `postcss.config.mjs` : integration Tailwind/PostCSS.
- `.env.local` : variables d'environnement locales.
- `README.md` : vue d'ensemble du projet et des flux.

## Dossier `app/`

Le dossier `app/` contient les pages App Router, les handlers API et des composants lies a l'UI principale.

### Fichiers structurels principaux

- `app/layout.tsx` : layout racine, structure HTML globale, provider(s), header/footer et enveloppe commune.
- `app/globals.css` : styles globaux, classes de theme, base editoriale et design system local.
- `app/loading.tsx` : etat de chargement global.
- `app/page.tsx` : page d'accueil, hub principal du site.
- `app/icon.tsx` : icone du site.
- `app/apple-icon.tsx` : icone Apple touch.
- `app/opengraph-image.tsx` : image Open Graph globale.
- `app/robots.ts` : regles robots.
- `app/sitemap.ts` : generation du sitemap.

### Pages publiques

- `app/articles/page.tsx` : listing principal des articles.
- `app/articles/loading.tsx` : skeleton/loading du listing articles.
- `app/news/page.tsx` : hub news.
- `app/news/[slug]/page.tsx` : detail d'un article sous l'ancienne convention de route news.
- `app/article/[slug]/page.tsx` : detail article canonique.
- `app/recommendations/page.tsx` : hub des recommandations.
- `app/recommendations/loading.tsx` : loading pour recommandations.
- `app/airing/page.tsx` : page des animes en cours.
- `app/anime/[slug]/page.tsx` : fiche detaillee d'un anime.
- `app/categories/page.tsx` : liste des categories editoriales.
- `app/category/[slug]/page.tsx` : page d'une categorie.
- `app/tag/[slug]/page.tsx` : page d'un tag.
- `app/trending/page.tsx` : page des tendances.
- `app/season/page.tsx` : vue de saison anime.
- `app/explore/page.tsx` : hub d'exploration transversale.
- `app/search/page.tsx` : recherche interne.

### Composants publics de `app/components/`

- `BrandLogo.tsx` : logo de marque.
- `Header.tsx` : en-tete principal.
- `Footer.tsx` : pied de page principal.
- `NavLinks.tsx` : liens de navigation desktop.
- `MobileNav.tsx` : navigation mobile.
- `LanguageProvider.tsx` : contexte de langue.
- `LanguageSwitcher.tsx` : switch visuel FR/EN.
- `ThemeToggle.tsx` : bascule de theme.
- `ArticleCard.tsx` : carte article reutilisable.
- `ArticleExperienceControls.tsx` : controles de lecture/article cote visiteur.
- `CrossLinks.tsx` : bloc de liens croises editoriaux.
- `ConsentBanner.tsx` : consentement utilisateur pour services/ads.
- `AdUnit.tsx` : point d'insertion publicitaire.
- `NotificationSignupForm.tsx` : formulaire d'abonnement aux alertes anime.

### Administration `app/admin/`

- `app/admin/page.tsx` : tableau de bord admin avec compteurs, actions et vues de pilotage.
- `app/admin/login/page.tsx` : page de connexion admin.
- `app/admin/drafts/page.tsx` : liste des brouillons a relire ou traiter.
- `app/admin/edit/[id]/page.tsx` : page d'edition d'un article.
- `app/admin/anime/page.tsx` : liste des fiches anime admin.
- `app/admin/anime/[id]/page.tsx` : edition detaillee d'une fiche anime.
- `app/admin/subscribers/page.tsx` : vue des abonnes notifications.

### Composants admin `app/admin/components/`

- `AdminLoginForm.tsx` : formulaire client de connexion admin.
- `AdminLogoutButton.tsx` : deconnexion admin.
- `CreateDraftButtons.tsx` : actions de creation/import de brouillons.
- `ClearDraftsButton.tsx` : action de purge des brouillons.
- `ProcessDraftsButton.tsx` : lance le traitement des brouillons importes.
- `ImportRecommendationsButton.tsx` : import des recommandations.
- `ImportAnimeFeedsButton.tsx` : import des feeds anime.
- `DraftCard.tsx` : carte de brouillon dans la liste admin.
- `PublishButton.tsx` : publication d'un article.
- `AnimeCard.tsx` : carte anime dans l'admin.
- `AdminAnimeActions.tsx` : actions rapides sur les fiches anime.
- `AdminAnimeEditor.tsx` : formulaire d'edition d'une fiche anime.
- `UploadImage.tsx` : upload signe vers Cloudinary avec progression.
- `Editor.tsx` : coeur du CMS editorial. Gere les localisations, l'edition HTML, le SEO, les apercus, les images, les actions IA, la sauvegarde et les actions de publication.

### API `app/api/`

#### Auth admin

- `app/api/admin/login/route.ts` : ouvre une session admin signee.
- `app/api/admin/logout/route.ts` : ferme la session admin.
- `app/api/admin/session/route.ts` : expose l'etat de session cote client/admin.

#### Articles admin

- `app/api/admin/create-article/route.ts` : cree un article initial.
- `app/api/admin/get-article/route.ts` : recupere un article pour l'admin.
- `app/api/admin/save-article/route.ts` : sauvegarde brouillon/article.
- `app/api/admin/publish/route.ts` : publie un article.
- `app/api/admin/list-drafts/route.ts` : liste les brouillons.
- `app/api/admin/clear-drafts/route.ts` : efface les brouillons.
- `app/api/admin/process-drafts/route.ts` : traite les brouillons importes.
- `app/api/admin/rewrite-article/route.ts` : reecriture IA d'un article.
- `app/api/admin/translate-article/route.ts` : traduction IA d'un article.

#### Anime admin

- `app/api/admin/create-anime/route.ts` : cree une fiche anime.
- `app/api/admin/get-anime/route.ts` : recupere une fiche anime.
- `app/api/admin/save-anime/route.ts` : sauvegarde les modifications anime.
- `app/api/admin/import-anime-feeds/route.ts` : lance l'import des flux anime.
- `app/api/admin/send-release-alerts/route.ts` : envoi des alertes de sortie.

#### Recommendations et contenus externes

- `app/api/admin/import-recommendations/route.ts` : importe les recommandations depuis les feeds sources.
- `app/api/rss/fetch/route.ts` : recupere/normalise des flux RSS cote serveur.
- `app/rss/[feed]/route.ts` : expose les flux RSS internes de l'application.

#### Uploads, sante, consentement, notifications

- `app/api/upload/image/route.ts` : genere une signature Cloudinary pour un upload client securise.
- `app/api/health/db/route.ts` : verifie la connectivite MongoDB.
- `app/api/ads/consent/route.ts` : persistance/gestion du consentement ads.
- `app/api/notifications/subscribe/route.ts` : abonnement email/notification anime.
- `app/api/notifications/push-config/route.ts` : expose la configuration push publique.
- `app/api/notifications/push-subscribe/route.ts` : enregistre un abonnement web push.

#### Cron

- `app/api/cron/import-news/route.ts` : point d'entree automatise pour importer news, tendances et donnees anime.

## Dossier `components/`

Ces composants sont hors `app/` car ils sont reutilisables et plus specialises sur le CMS.

- `WysiwygEditor.tsx` : editeur HTML simplifie avec toolbar texte.
- `SeoPanel.tsx` : panneau SEO avec generation de slug, meta title, meta description et image OG.
- `ImageGallery.tsx` : extrait et liste les images deja presentes dans le contenu.
- `AnimeBlock.tsx` : bloc editorial anime reutilisable si consomme par le CMS/public.

## Dossier `lib/`

Le dossier `lib/` contient la logique metier et les integrations externes.

- `mongodb.ts` : connexion MongoDB/Mongoose.
- `adminAuth.ts` : session admin, signature HMAC, verification des cookies.
- `cloudinary.ts` : signature d'upload et helpers Cloudinary.
- `slugify.ts` : generation de slugs coherents.
- `seo.ts` : metadonnees SEO, canoniques, schema ou helpers associes.
- `ads.ts` : logique liee aux publicites et au consentement.
- `socialLinks.ts` : centralisation des liens sociaux.
- `webPush.ts` : configuration et envoi de notifications push.
- `notifications.ts` : orchestration des inscriptions et notifications.
- `releaseAlerts.ts` : logique des alertes d'episodes/sorties anime.
- `articleImport.ts` : import d'articles depuis flux RSS ou sources externes.
- `articleDrafts.ts` : gestion des brouillons.
- `articleLocalization.ts` : transformations des champs localises.
- `articleTranslation.ts` : traduction/reecriture par IA et detection de configuration IA.
- `recommendationClassifier.ts` : classification de recommandations.
- `rssParser.ts` : parsing RSS principal.
- `rssXml.ts` : generation de flux RSS/XML internes.
- `rssTrends.ts` : calcul/stockage des tendances RSS.
- `animeFeedImport.ts` : import des flux anime.
- `airingAnime.ts` : logique des animes en cours.
- `animeAdmin.ts` : logique metier admin autour des fiches anime.
- `animeSeason.ts` : calculs lies aux saisons anime.
- `icotaku.ts` : integration ou parsing de source Icotaku.
- `voiranime.ts` : integration ou parsing de source Voiranime.
- `i18n/messages.ts` : dictionnaire FR/EN de l'application.
- `i18n/server.ts` : resolution de langue cote serveur.

## Dossier `models/`

- `Article.ts` : schema Mongoose des articles avec statut, section, SEO, tags et localisations.
- `Anime.ts` : schema des fiches anime, statut de diffusion, saison et popularite.
- `NotificationSubscription.ts` : abonnements visiteurs aux alertes anime.
- `WebPushSubscription.ts` : abonnements web push navigateur.
- `NotificationDeliveryLog.ts` : journalisation des envois de notifications.
- `TrendSnapshot.ts` : instantanes de tendances RSS.
- `Source.ts` : metadonnees de source/import si utilisees par le pipeline.

## Dossier `scripts/`

- `import-example.ts` : exemple local d'import RSS.
- `import-anime-feeds.ts` : import manuel des flux anime.
- `process-ai-drafts.ts` : traitement IA de brouillons.
- `generate-vapid-keys.ts` : genere les cles web push.
- `generate-og.ts` : generation d'assets Open Graph.
- `backfill-recommendation-images.ts` : retro-remplissage d'images pour recommandations.
- `migrate-cloudinary-images.ts` : migration d'images distantes vers Cloudinary.
- `migrate-article-localizations.ts` : migration vers le format d'articles localises.
- `migrate-article-import-keys.ts` : regularisation des cles d'import article.
- `reset-and-import-french-feeds.ts` : reset + reimport de feeds FR.

## Dossier `docs/`

- `AD_SETUP.md` : configuration de la monetiation/publicite.
- `SEO_GUIDE.md` : guide SEO existant.
- `RUNBOOK.md` : procedure d'exploitation/ops.
- `TECHNICAL_ARCHITECTURE_FR.md` : ce document.
- `ARTICLE_WRITING_GUIDE_FR.md` : guide editorial de redaction.

## Base de donnees : schemas utiles a connaitre

### Article

Champs importants :

- `title`, `slug`, `excerpt`, `content`
- `coverImage`, `category`, `anime`, `tags`
- `section`: `news` ou `recommendation`
- `recommendationType`: `anime`, `manga`, `webtoon`
- `status`: `draft`, `review`, `published`
- `aiStatus`, `aiRewritten`
- `seo.metaTitle`, `seo.metaDesc`, `seo.ogImage`
- `localizations.fr` et selon evolution `localizations.en`

### Anime

Champs importants :

- `title`, `slug`, `synopsis`, `coverImage`
- `genres`, `tags`, `seasons`
- `status`: `upcoming`, `airing`, `completed`, `hiatus`
- `currentSeasonLabel`, `releaseDay`, `nextEpisodeAt`
- `popularityScore`, `isPopularNow`, `notificationsEnabled`

## Authentification et securite

- Les pages `/admin` sont protegees par `proxy.ts` et par des verifications serveur.
- `adminAuth.ts` signe les sessions avec `ADMIN_SESSION_SECRET`.
- La CSP autorise explicitement les connexions vers Cloudinary pour l'upload d'images.
- Les routes cron sont protegees par `CRON_SECRET`.

## Upload d'images

Le flux d'upload est le suivant :

1. `UploadImage.tsx` demande une signature a `app/api/upload/image/route.ts`.
2. La route appelle `lib/cloudinary.ts` pour signer la requete.
3. Le navigateur envoie ensuite le fichier directement a `https://api.cloudinary.com`.
4. L'URL retournee est stockee dans l'article puis reinjectee dans le contenu HTML ou la cover.

## Pipeline editorial conseille

1. importer un brouillon,
2. nettoyer le titre et l'angle,
3. remplir extrait et contenu,
4. inserer cover et images inline,
5. remplir SEO,
6. verifier preview desktop/mobile,
7. publier.

## Fichiers les plus critiques en maintenance

Si tu dois deboguer vite, commence ici :

1. `app/admin/components/Editor.tsx` pour tout ce qui touche au CMS.
2. `app/api/admin/save-article/route.ts` pour les problemes de sauvegarde.
3. `app/api/upload/image/route.ts` et `lib/cloudinary.ts` pour les uploads.
4. `proxy.ts` pour auth admin et CSP.
5. `models/Article.ts` si la structure article evolue.
6. `lib/articleImport.ts` et `app/api/cron/import-news/route.ts` pour les imports automatiques.

## Comment lire rapidement le code

### Si tu veux comprendre le front public

Lis dans cet ordre :

1. `app/layout.tsx`
2. `app/page.tsx`
3. `app/components/`
4. les pages verticales comme `app/article/[slug]/page.tsx`, `app/airing/page.tsx`, `app/recommendations/page.tsx`

### Si tu veux comprendre le back-office

Lis dans cet ordre :

1. `app/admin/page.tsx`
2. `app/admin/edit/[id]/page.tsx`
3. `app/admin/components/Editor.tsx`
4. `app/api/admin/*`
5. `models/Article.ts`

### Si tu veux comprendre l'automatisation

Lis dans cet ordre :

1. `app/api/cron/import-news/route.ts`
2. `lib/articleImport.ts`
3. `lib/animeFeedImport.ts`
4. `lib/rssParser.ts`
5. `scripts/`
