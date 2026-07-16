=== MOTEUR TRANSMISSION ===

Le launcher TELECHARGE AUTOMATIQUEMENT transmission-daemon au premier lancement
s'il ne le trouve pas : il recupere le MSI officiel de Transmission, l'extrait
sans l'installer (msiexec /a), et met le binaire dans %APPDATA%/<app>/transmission-bin/.

=> Tu n'as normalement RIEN a faire.

--- Optionnel : bundler le binaire (evite le telechargement au 1er lancement) ---

Si tu veux embarquer le binaire directement dans l'app (pour que ca marche hors-ligne
ou sans le telechargement initial), place ici :
  - transmission-daemon.exe
  - tous les .dll a cote (depuis un dossier d'installation Transmission)

Le launcher utilisera en priorite le binaire bundle ici s'il est present.

--- Source ---

MSI officiel utilise pour le telechargement auto :
  https://github.com/transmission/transmission/releases/download/4.1.3/transmission-4.1.3-x64.msi
