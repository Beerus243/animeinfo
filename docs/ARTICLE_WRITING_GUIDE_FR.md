# Guide de redaction d'un article complet

## Objectif

Ce document explique comment produire un article solide dans l'admin AnimeInfo, depuis l'idee brute jusqu'a la version publiable. Il est ecrit pour un redacteur, un editeur ou un proprietaire de site qui veut garder un niveau pro sans tomber dans le remplissage.

## Ce qu'est un bon article sur ce site

Un bon article AnimeInfo doit faire quatre choses :

1. annoncer clairement le sujet des la premiere ligne,
2. apporter des faits verifiables,
3. donner du contexte utile au lecteur anime/manga,
4. rester lisible sur mobile avec un HTML propre.

## Structure recommandee d'un article complet

### 1. Titre

Le titre doit etre :

- precis,
- lisible,
- centre sur l'information utile,
- sans promesse trompeuse.

Exemples solides :

- `Solo Leveling saison 3 : ce que l'on sait deja sur la suite de l'anime`
- `Demon Slayer Infinity Castle : date, trailer et enjeux du prochain arc`
- `Blue Lock saison 2 : faut-il croire au rebond de l'anime apres les critiques ?`

Exemples faibles :

- `Incroyable nouvelle pour les fans`
- `Vous n'allez pas en revenir`
- `Le meilleur anime de tous les temps revient`

## 2. Extrait

L'extrait sert a resumer la promesse editoriale en 2 ou 3 phrases. Il doit donner envie sans copier le titre.

Exemple solide :

`La saison 3 de Solo Leveling n'a pas encore de date officielle, mais plusieurs indices permettent deja d'anticiper la suite. Entre materiau disponible, succes international et calendrier de production, voici ce qui parait le plus credible.`

## 3. Introduction

L'introduction doit poser le sujet tout de suite.

Modele simple :

1. rappeler l'information principale,
2. dire pourquoi elle compte,
3. annoncer ce que l'article va couvrir.

Exemple :

`Apres le succes massif de ses premieres saisons, Solo Leveling reste l'un des animes les plus attendus du moment. La question d'une saison 3 revient donc avec insistance chez les fans. Entre les indices laisses par la production, le rythme d'adaptation du webtoon et la logique industrielle du projet, plusieurs elements permettent deja de cadrer les attentes.`

## 4. Corps de l'article

Le corps doit etre decoupe en sections `h2`, puis si besoin en `h3`.

Structure type pour une news :

- `Ce qui est officiel`
- `Ce qui reste probable mais non confirme`
- `Pourquoi le sujet est important`
- `Ce que cela change pour les fans`

Structure type pour une analyse :

- `Le contexte`
- `Les forces`
- `Les limites`
- `Ce qu'il faut surveiller ensuite`

## 5. Conclusion

La conclusion ne doit pas repeter tout l'article. Elle doit refermer le sujet avec une idee claire.

Exemple :

`En l'etat, une saison 3 de Solo Leveling parait logique, mais la prudence reste necessaire tant qu'aucune annonce officielle n'a ete publiee. Le plus raisonnable est donc de distinguer les signaux favorables des certitudes, sans gonfler artificiellement les attentes.`

## Methode de redaction pas a pas dans l'admin

### Etape 1. Poser l'angle

Avant d'ecrire, reponds a ces questions :

- Quelle est l'information principale ?
- A qui s'adresse l'article ?
- Le lecteur cherche-t-il une info rapide, une explication, ou une recommandation ?
- Quel est le point de valeur ajoutee de l'article ?

### Etape 2. Remplir les champs dans le CMS

Ordre conseille :

1. `Titre`
2. `Extrait`
3. `Contenu`
4. `Categorie`
5. `Anime`
6. `Tags`
7. `SEO`
8. `Cover`

### Etape 3. Ecrire en HTML propre

Dans cet editeur, le contenu est du HTML editorial. Il faut donc privilegier une structure simple :

```html
<p>Introduction claire et informative.</p>

<h2>Ce qui est officiel</h2>
<p>Les informations confirmees doivent apparaitre ici.</p>

<h2>Pourquoi cette annonce compte</h2>
<p>Ajoute le contexte, les consequences, et ce que cela change.</p>

<blockquote>
  Une citation source ou une formulation cle peut etre mise en avant ici.
</blockquote>

<h2>Ce qu'il faut retenir</h2>
<p>Conclusion breve et propre.</p>
```

## Inserer une image correctement

Une bonne image doit avoir :

- une vraie pertinence editoriale,
- un `alt` descriptif,
- une legende si l'image apporte de l'information,
- un placement coherent dans la lecture.

Exemple solide :

```html
<figure class="article-image align-center size-large">
  <img src="https://res.cloudinary.com/demo/image/upload/sample.jpg" alt="Visuel promotionnel de Solo Leveling saison 3" />
  <figcaption>Le visuel promotionnel relance les attentes autour de la suite de l'anime.</figcaption>
</figure>
```

Exemple faible :

```html
<img src="image.jpg" alt="image" />
```

## Bien utiliser les blocs anime

Le bloc anime sert a resumer rapidement une oeuvre quand l'article en parle beaucoup.

Exemple :

```html
<div class="anime-card">
  <h3>Jujutsu Kaisen</h3>
  <p>Studio : MAPPA</p>
  <p>Sortie : 2023</p>
  <p>Episodes : 24</p>
</div>
```

Utilise ce bloc si le lecteur gagne du temps grace a lui. Ne l'ajoute pas juste pour meubler.

## Regles de style editorial

### A faire

- utiliser des phrases courtes a moyennes,
- annoncer les faits avant les reactions,
- distinguer ce qui est officiel de ce qui est deduit,
- nommer clairement les oeuvres, studios, arcs et plateformes,
- ajouter du contexte plutot que du bruit.

### A eviter

- les titres sensationnalistes,
- les paragraphes enormes,
- les informations sans source ou sans nuance,
- les mots vagues comme `incroyable`, `insane`, `masterclass` sans demonstration,
- les conclusions creuses.

## Modele complet d'article news

Voici un exemple de squelette solide a reutiliser.

```html
<p>Demon Slayer Infinity Castle continue de concentrer l'attention des fans apres une nouvelle communication officielle autour du projet. Date, fenetre de sortie, materiel promotionnel et enjeux narratifs : voici ce qu'il faut retenir sans melanger annonces confirmees et speculation.</p>

<figure class="article-image align-center size-large">
  <img src="https://res.cloudinary.com/demo/image/upload/sample.jpg" alt="Affiche promotionnelle de Demon Slayer Infinity Castle" />
  <figcaption>La communication autour de l'arc Infinity Castle reste l'un des plus gros temps forts de la franchise.</figcaption>
</figure>

<h2>Ce qui a ete annonce officiellement</h2>
<p>Le point central est simple : la communication recente confirme que l'arc Infinity Castle reste le prochain grand rendez-vous de la licence. Les fans disposent donc d'un cadre officiel, meme si certains details restent encore absents.</p>

<h2>Ce que cela implique pour la suite</h2>
<p>Cette etape compte parce qu'elle fixe les attentes sur le rythme de diffusion, le calendrier promotionnel et la facon dont Ufotable entend porter la franchise sur la duree. Pour le public, cela permet surtout de separer les annonces fiables des rumeurs qui circulent deja massivement.</p>

<h2>Pourquoi l'attente reste aussi forte</h2>
<p>L'arc Infinity Castle concentre plusieurs affrontements majeurs et marque un tournant pour l'intrigue. L'enjeu n'est donc pas seulement visuel : c'est aussi un moment narratif determinant pour l'ensemble de la serie.</p>

<blockquote>
  Tant qu'une date precise n'est pas publiee, il faut presenter la situation comme une attente cadre, pas comme une certitude absolue.
</blockquote>

<h2>Ce qu'il faut retenir</h2>
<p>La communication officielle suffit deja a confirmer l'importance strategique d'Infinity Castle pour Demon Slayer. En revanche, il reste indispensable de presenter les informations avec nuance tant que tous les details de sortie n'ont pas ete formalises.</p>
```

## Modele complet d'article recommandation

Pour une recommandation, la structure doit etre differente. Le but n'est pas de raconter l'actualite, mais de convaincre intelligemment.

```html
<p>Si tu cherches un anime sombre, tendu et facile a enchainer, Heavenly Delusion merite une vraie place dans ta watchlist. La serie se distingue par un univers post-apocalyptique dense, une mise en scene precise et un sens du mystere qui tient jusqu'au bout.</p>

<h2>Pourquoi cet anime vaut le detour</h2>
<p>Heavenly Delusion fonctionne d'abord par son ambiance. L'anime installe tres vite une tension constante sans sacrifier la curiosite du spectateur. Chaque episode enrichit le monde et pousse a revoir ses hypotheses.</p>

<h2>Ce qui le rend different</h2>
<p>La serie evite beaucoup de reflexes mecaniques du genre. Elle prefere la suggestion, les ruptures de ton bien dosees et une progression qui recompense l'attention du spectateur.</p>

<h2>Pour quel public</h2>
<p>Cet anime parlera surtout aux viewers qui aiment les recits de survie, les mysteres progressifs et les univers qui se devoilent par couches successives.</p>

<h2>Notre verdict</h2>
<p>Heavenly Delusion est une recommandation forte pour les lecteurs qui veulent une serie prenante, adulte et visuellement maitrisee. Ce n'est pas un anime de fond, c'est un anime qui demande de l'attention et qui la recompense.</p>
```

## Comment remplir le SEO correctement

### Meta title

Bon format :

- reprendre l'idee du titre,
- rester dense,
- eviter les mots inutiles.

Exemple :

- `Solo Leveling saison 3 : date possible, suite et infos a retenir`

### Meta description

Une bonne meta description :

- resout une intention utilisateur,
- tient en une ou deux phrases,
- annonce les benefices de lecture.

Exemple :

`La saison 3 de Solo Leveling n'est pas encore officielle, mais plusieurs indices permettent deja d'anticiper la suite. Voici les informations les plus credibles a retenir.`

### Slug

Un bon slug est court et descriptif.

Exemples :

- `solo-leveling-saison-3`
- `demon-slayer-infinity-castle-date-trailer`

## Checklist avant publication

Avant de publier, controle :

1. le titre est-il clair ?
2. l'extrait apporte-t-il vraiment quelque chose ?
3. le contenu est-il structure avec des `h2` ?
4. l'article distingue-t-il faits, hypothese et opinion ?
5. les images ont-elles un `alt` et une legende utile ?
6. la meta description est-elle propre ?
7. la preview mobile reste-t-elle lisible ?
8. y a-t-il au moins une vraie conclusion ?

## Formule simple pour aller vite sans baisser la qualite

Quand tu manques de temps, utilise cette formule :

1. une intro courte,
2. deux `h2` factuels,
3. une image utile,
4. une conclusion claire,
5. un SEO propre.

Si ces cinq points sont solides, l'article est deja publiable dans de bonnes conditions.
