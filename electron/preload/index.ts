function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)

// Expose l'API Electron de façon sécurisée
try {
  const { contextBridge, ipcRenderer } = require('electron');

  const allowedSendChannels = [
    'minimize-window', 'maximize-window', 'close-window', 'launch-game',
    'open-game-emplacement', 'remove-game', 'restart-app', 'open-external',
    'auth-success', 'auth-token-refresh', 'update-setting', 'check-for-update',
    'set-download-limit', 'set-upload-limit', 'pause-torrent', 'resume-torrent',
    'cancel-torrent', 'remove-torrent', 'stop-torrent', 'download',
    'pause-download', 'stop-torrent-by-id', 'cancel-download', 'set-exe-file',
    'retry-extraction', 'cancel-extraction'
  ];

  const allowedInvokeChannels = [
    'get-save-path', 'choose-exe-file', 'open-navigator', 'read-downloads',
    'force-library-sync', 'get-settings', 'get-app-version', 'get-download-limits',
    'open-data-folder', 'get-electron-version', 'get-library-stats', 'get-libraries',
    'get-cache-sizes', 'open-temp-folder', 'clear-temp-files', 'clear-image-cache',
    'verify-library-integrity', 'get-all-user-stats', 'add-library', 'open-dialog',
    'get-files', 'get-game-stats', 'is-game-installed', 'get-game-install-info',
    'get-total-user-stats', 'remove-library', 'set-default-library', 'rename-library',
    'scan-unextracted-games'
  ];

  const allowedOnChannels = [
    'main-process-message', 'enter-full-screen', 'game-removed', 'setting-changed',
    'checking-for-update', 'update-not-available', 'update-available',
    'update-downloaded', 'update-error', 'download-progress', 'download-done',
    'torrent-error', 'verify-progress', 'verify-done', 'install-start',
    'install-progress', 'install-done', 'install-failed', 'error', 'find-many-exe',
    'token-expired'
  ];

  contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel: string, ...args: any[]) => {
      if (allowedSendChannels.includes(channel)) ipcRenderer.send(channel, ...args);
    },
    invoke: (channel: string, ...args: any[]) => {
      if (allowedInvokeChannels.includes(channel)) return ipcRenderer.invoke(channel, ...args);
      return Promise.reject(`IPC channel "${channel}" not allowed`);
    },
    on: (channel: string, listener: (...args: any[]) => void) => {
      if (allowedOnChannels.includes(channel)) {
        const subscription = (event: any, ...args: any[]) => listener(event, ...args);
        ipcRenderer.on(channel, subscription);
        return () => ipcRenderer.removeListener(channel, subscription);
      }
    },
    removeAllListeners: (channel: string) => {
      if (allowedOnChannels.includes(channel)) ipcRenderer.removeAllListeners(channel);
    },
    // Window Controls
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
    launchGame: (path: string) => ipcRenderer.send('launch-game', path),
  });
} catch (e) {
  // Pas dans Electron, ne rien faire
}
