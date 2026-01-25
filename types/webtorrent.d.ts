declare module 'webtorrent' {
  interface Options {
    maxConns?: number;
    nodeId?: string | Buffer;
    peerId?: string | Buffer;
    tracker?: boolean | object;
    dht?: boolean | object;
    webSeeds?: boolean;
    utp?: boolean;
  }

  interface Instance extends NodeJS.EventEmitter {
    on(event: 'torrent', callback: (torrent: Torrent) => void): this;
    on(event: 'error', callback: (err: Error | string) => void): this;
    add(torrent: string | Buffer, opts?: Options, cb?: (torrent: Torrent) => any): Torrent;
    seed(input: string | Buffer, opts?: Options, cb?: (torrent: Torrent) => any): Torrent;
    remove(torrentId: string | Buffer, callback?: (err: Error | string) => void): void;
    destroy(callback?: (err: Error | string) => void): void;
    readonly torrents: Torrent[];
    readonly downloadSpeed: number;
    readonly uploadSpeed: number;
    readonly progress: number;
    readonly ratio: number;
  }

  interface Torrent extends NodeJS.EventEmitter {
    readonly infoHash: string;
    readonly magnetURI: string;
    readonly torrentFile: Buffer;
    readonly files: any[];
    readonly announce: string[];
    readonly pieces: any[];
    readonly timeRemaining: number;
    readonly received: number;
    readonly downloaded: number;
    readonly uploaded: number;
    readonly downloadSpeed: number;
    readonly uploadSpeed: number;
    readonly progress: number;
    readonly ratio: number;
    readonly length: number;
    readonly pieceLength: number;
    readonly lastPieceLength: number;
    readonly numPeers: number;
    readonly path: string;
    readonly ready: boolean;
    readonly paused: boolean;
    readonly done: boolean;
    readonly name: string;
    readonly created: Date;
    readonly createdBy: string;
    readonly comment: string;
    readonly maxWebConns: number;
    destroy(callback?: (err: Error | string) => void): void;
    addPeer(peer: string): boolean;
    addWebSeed(url: string): void;
    removePeer(peer: string): void;
    select(start: number, end: number, priority?: number, notify?: () => void): void;
    deselect(start: number, end: number, priority: number): void;
    createServer(opts?: any): any;
    pause(): void;
    resume(): void;
    on(event: 'infoHash' | 'metadata' | 'ready' | 'done', callback: () => void): this;
    on(event: 'warning' | 'error', callback: (err: Error | string) => void): this;
    on(event: 'download' | 'upload', callback: (bytes: number) => void): this;
    on(event: 'wire', callback: (wire: any, addr?: string) => void): this;
    on(event: 'noPeers', callback: (announceType: 'tracker' | 'dht') => void): this;
  }

  const WebTorrent: {
    new (config?: Options): Instance;
  };
  export = WebTorrent;
}
