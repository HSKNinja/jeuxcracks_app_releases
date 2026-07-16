=== BINAIRE TRANSMISSION-DAEMON REQUIS ICI ===

Le launcher utilise transmission-daemon comme moteur de telechargement.
Tu dois placer le binaire Windows + ses DLL dans CE dossier (assets/transmission/).

--- Comment l'obtenir ---

1. Telecharge Transmission pour Windows (version Qt/daemon) :
   https://transmissionbt.com/download
   (ou les builds : https://github.com/transmission/transmission/releases)

2. Installe-le (ou ouvre le .zip portable si dispo).

3. Va dans le dossier d'installation (ex: C:\Program Files\Transmission\).

4. COPIE dans ce dossier (assets/transmission/) AU MINIMUM :
   - transmission-daemon.exe
   - TOUS les fichiers .dll presents a cote (libcrypto*.dll, libssl*.dll,
     libcurl*.dll, libevent*.dll, zlib*.dll, etc.)

   En cas de doute, copie TOUT le contenu du dossier d'installation Transmission ici.

--- Verification ---

Depuis ce dossier, ouvre un terminal et lance :
   transmission-daemon.exe --version

Si ca affiche une version, c'est bon. Si ca reclame une DLL manquante,
copie aussi cette DLL depuis le dossier d'installation Transmission.

--- Note ---

Le fichier settings.json du daemon est genere automatiquement par l'app
(dans %APPDATA%/<app>/transmission-config/), ne le mets PAS ici.
