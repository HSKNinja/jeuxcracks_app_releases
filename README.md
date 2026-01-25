# JeuxCracks application

🥳 Une application pour le site jeuxcracks.fr codé avec ElectronJS et VueJS par Chouette ❤️

## Features

📦 Répertorie tous les jeux du site

🎯 Permet de télécharger n'importe quel jeu en .torrent

🎯 Permet de télécharger n'importe quel jeu en .rar

🎯 Permet d'installer n'importe quel jeu en .torrent

🎯 Permet d'installer n'importe quel jeu en .rar

🎯 Permet de lancer le .exe automatiquement

🌱 Système de connexions

💪 Système de favoris

🔩 Système de bibliothèque des jeux déjà installés

🖥 Permet d'installer les jeux automatiquement après le téléchargemnt des fichiers

## A faire

- Page Catalogue :
  - Faire le système de recherches avancés (Besoin des informations score/views/crédit sur l'API du site pour ça)
- Page Catalogue/:id
  - ~~Bug quand on recherche un jeu via cette page sur la vidéo (Et toute la page en fait, faut remettre le watcheffect)~~
  - ~~Afficher la vitesse de téléchargement / Temps restant / Nombre de Go~~
  - ~~Permettre d'arrêter complètement le téléchargement et de supprimer ce qui a était téléchargé~~
  - ~~Permettre de choisir ou se situe le .exe manuellement~~
  - ~~Afficher le crédit du pack (Fitgirl Repack...etc)~~
  - ~~Pouvoir quitter la page pendant le téléchargement et revenir~~
  - ~~Ajout d'un modal "Paramètres" pour les jeux installés ou en cours d'installation~~
- Page Téléchargement :
  - ~~Afficher les téléchargements en cours~~
  - ~~Pouvoir mettre en pause les téléchargements~~
  - ~~Pouvoir supprimer les téléchargements en cours~~
  - ~~Afficher toutes les informations de téléchargements (vitesse de DL, temps restant, Taille du fichier..etc)~~
- Fonctionnement général :
  - Système de connexion avec Discord
  - Permettre de monter les .iso
  - ~~Ajouter l'installatio en cours à pinia~~
  - Permettre d'installer automatiquement les jeux qui demande de déplacer des dossiers/fichiers
  - Permettre de changer automatiquement la langue en Français dans le .ini des jeux
  - Vérifier avant téléchargement si il y a assez de place
  - Relier la page Favoris au backend
  - ~~L'application se fige et ne répond plus pendant l'extraction d'un fichier .rar~~
  - Bug le launcher ne détecte pas qu'il est passé en fullscreen quand on l'aggrandi d'une autre manière que le bouton aggrandir
- Freemium :
  - Limiter la vitesse de téléchargements
  - Limiter le nombre de jeux dans la bibliothèque
  - Limiter le nombre de jeux dans les favoris ?
  - Afficher le temps de télécharger qu'on aurait mis avec le Premium
  - Faire une page d'abonnements qui compare les offres
  - Relier le système au Discord pour ajouter un badge ?
  - Afficher un popup de temps en temps qui dit de passer en premium
- Page Bibliothèque :
  - ~~Permettre de désinstaller le jeu~~
  - ~~Permettre de voir la page du jeu~~
  - Permettre de choisir le .exe manuellement
  - ~~Permettre d'ouvir la page du dossier d'installation~~
- Page mon compte :
  - Afficher correctement les informations
  - Permettre de changer les informations utilisateur

## Bien démarrer

```sh
# enter the project directory
nvm use 18

# install dependency
yarn install

# develop
yarn dev
```
