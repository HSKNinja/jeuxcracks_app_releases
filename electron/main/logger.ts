import log from 'electron-log';

// Capture tous les console.log / warn / error du process principal (aria2, installation, etc.)
// vers un fichier: <userData>/logs/main.log — tout en gardant l'affichage dans le terminal.
// Ce module est importé en TOUT PREMIER dans index.ts pour que la redirection soit active
// avant l'initialisation des services (torrentService).
try {
  log.transports.file.level = 'info';
  log.transports.console.level = 'info';
  Object.assign(console, log.functions);
  console.log('📝 electron-log actif — fichier:', log.transports.file.getFile?.().path);
} catch (e) {
  // Non bloquant : en cas d'échec on garde le console standard.
}

export {};
