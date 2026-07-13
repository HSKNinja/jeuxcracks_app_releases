import { join, basename, dirname } from 'path';
import * as fs from 'fs';
import { getMainWindow } from '..';
import { ChildProcess, spawn, exec } from 'child_process';
import { app } from 'electron';
import * as sudo from 'sudo-prompt';
import FileDownloader from 'nodejs-file-downloader';

// ==========================================
// Types
// ==========================================

export interface ExtractionOptions {
  archivePath: string;       // Full path to the first archive file
  outputDir: string;         // Destination directory
  gameId?: string;           // For IPC progress events
  gameTitle?: string;        // For logging
  password?: string;         // Archive password
  deleteAfter?: boolean;     // Delete archives after extraction (default: true)
}

interface ExtractionJob {
  id: string;
  options: ExtractionOptions;
  status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  process?: ChildProcess;
  retries: number;
}

// ==========================================
// ExtractionService
// ==========================================

class ExtractionService {
  private queue: ExtractionJob[] = [];
  private isProcessing = false;
  private jobCounter = 0;
  private readonly MAX_RETRIES = 2;

  /**
   * Get the path to the 7z binary.
   * IMPORTANT: 7za.exe (standalone from 7zip-bin) does NOT support RAR.
   * We need the full 7z.exe from a system installation for RAR support.
   */
  private get7zPath(): string {
    const systemPaths = [
      'C:\\Program Files\\7-Zip\\7z.exe',
      'C:\\Program Files (x86)\\7-Zip\\7z.exe',
      // Check if we already downloaded it to userData
      join(app.getPath('userData'), 'bin', '7z.exe'),
    ];

    for (const p of systemPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return '';
  }

  /**
   * Ensures 7-Zip is installed. If not, downloads and installs it silently.
   */
  public async ensureDependencies(): Promise<void> {
    const p = this.get7zPath();
    if (p) return;

    console.log('🌐 7-Zip manquant. Démarrage de l\'installation automatique...');
    const win = getMainWindow();
    win?.webContents.send('dependency-install-start', { name: '7-Zip (Full)' });

    const tempDir = join(app.getPath('temp'), 'JeuxCracks-Deps');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const installerPath = join(tempDir, '7z_setup.exe');
    const downloader = new FileDownloader({
      url: 'https://www.7-zip.org/a/7z2408-x64.exe', // Stable version
      directory: tempDir,
      fileName: '7z_setup.exe',
      cloneFiles: false,
    });

    try {
      await downloader.download();
      console.log('✅ Installation de 7-Zip en cours (Silencieux)...');
      
      return new Promise((resolve, reject) => {
          const options = { name: 'JeuxCracks Launcher' };
          sudo.exec(`"${installerPath}" /S`, options, (error, stdout, stderr) => {
              if (error) {
                  console.error('❌ Échec installation 7-Zip:', error);
                  reject(error);
                  return;
              }
              console.log('✅ 7-Zip installé avec succès !');
              win?.webContents.send('dependency-install-end', { name: '7-Zip' });
              resolve();
          });
      });
    } catch (e) {
      console.error('❌ Erreur lors du téléchargement de 7-Zip:', e);
      throw e;
    }
  }

  /**
   * Scan extractions for Redistributables and run them.
   */
  public async checkAndInstallRedists(gamePath: string): Promise<void> {
      const redistFolders = ['Redist', '_CommonRedist', 'Dependencies', 'redist'];
      const foundRedists: string[] = [];

      const scan = (dir: string) => {
          if (!fs.existsSync(dir)) return;
          const items = fs.readdirSync(dir, { withFileTypes: true });
          for (const item of items) {
              const fullPath = join(dir, item.name);
              if (item.isDirectory()) {
                  if (redistFolders.includes(item.name)) {
                      // Found a redist folder, look for executables inside
                      this.findInstallers(fullPath, foundRedists);
                  } else {
                      scan(fullPath);
                  }
              }
          }
      };

      scan(gamePath);

      if (foundRedists.length > 0) {
          console.log(`🎁 ${foundRedists.length} dépendances trouvées pour le jeu. Installation...`);
          const win = getMainWindow();
          
          for (const setup of foundRedists) {
              const name = basename(setup);
              console.log(`🔧 Installation de la dépendance: ${name}`);
              win?.webContents.send('dependency-install-start', { name });

              await new Promise<void>((resolve) => {
                  const options = { name: 'JeuxCracks Launcher' };
                  // Many redists support /passive or /quiet or /s
                  let args = '/passive /norestart'; 
                  if (name.toLowerCase().includes('directx')) args = '/silent';
                  
                  sudo.exec(`"${setup}" ${args}`, options, (error) => {
                      if (error) console.warn(`⚠️ Échec (non-critique) pour ${name}:`, error.message);
                      else console.log(`✅ ${name} installé.`);
                      win?.webContents.send('dependency-install-end', { name });
                      resolve();
                  });
              });
          }
      }
  }

  private findInstallers(dir: string, results: string[]) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
          const fullPath = join(dir, item.name);
          if (item.isDirectory()) {
              this.findInstallers(fullPath, results);
          } else {
              const ext = item.name.substring(item.name.lastIndexOf('.')).toLowerCase();
              if (['.exe', '.msi'].includes(ext) && !item.name.toLowerCase().includes('unins')) {
                  results.push(fullPath);
              }
          }
      }
  }

  /**
   * Add an extraction job to the queue.
   * Returns a promise that resolves when extraction is complete.
   */
  async extract(options: ExtractionOptions): Promise<string> {
    const jobId = `extract-${++this.jobCounter}-${Date.now()}`;
    
    const job: ExtractionJob = {
      id: jobId,
      options: {
        ...options,
        deleteAfter: options.deleteAfter !== false, // default true
      },
      status: 'queued',
      progress: 0,
      message: 'En attente...',
      retries: 0,
    };

    this.queue.push(job);
    console.log(`📋 Job ${jobId} ajouté à la queue (${this.queue.length} en attente)`);
    
    this.sendProgress(job);

    // Process queue
    return this.processQueue(jobId);
  }

  /**
   * Cancel a running or queued extraction.
   */
  cancel(jobId: string): void {
    const job = this.queue.find(j => j.id === jobId);
    if (!job) return;

    console.log(`🛑 Annulation du job ${jobId}`);
    job.status = 'cancelled';

    // Kill the process if running
    if (job.process && !job.process.killed) {
      job.process.kill('SIGKILL');
    }

    // Remove from queue
    this.queue = this.queue.filter(j => j.id !== jobId);
    
    this.sendProgress(job);
  }

  /**
   * Cancel all jobs for a specific game.
   */
  cancelByGameId(gameId: string): void {
    const jobs = this.queue.filter(j => j.options.gameId === gameId);
    jobs.forEach(j => this.cancel(j.id));
  }

  /**
   * Get current queue status.
   */
  getQueue(): ExtractionJob[] {
    return this.queue.map(j => ({ ...j, process: undefined }));
  }

  // ==========================================
  // Queue Processing
  // ==========================================

  private async processQueue(targetJobId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const checkAndProcess = async () => {
        const job = this.queue.find(j => j.id === targetJobId);
        if (!job) return reject(new Error('Job not found'));
        if (job.status === 'cancelled') return reject(new Error('Cancelled'));

        if (this.isProcessing) {
          // Wait and retry
          setTimeout(checkAndProcess, 1000);
          return;
        }

        this.isProcessing = true;
        job.status = 'running';
        job.message = 'Extraction en cours...';
        this.sendProgress(job);

        try {
          const result = await this.runExtraction(job);
          job.status = 'done';
          job.progress = 100;
          job.message = 'Terminé';
          this.sendProgress(job);
          
          // Remove from queue
          this.queue = this.queue.filter(j => j.id !== targetJobId);
          this.isProcessing = false;
          
          // Process next job if any
          this.processNextInQueue();
          
          resolve(result);
        } catch (error) {
          // Check if job was cancelled during extraction
          if ((job.status as string) === 'cancelled') {
            this.isProcessing = false;
            this.processNextInQueue();
            return reject(new Error('Cancelled'));
          }

          // Retry logic
          if (job.retries < this.MAX_RETRIES) {
            job.retries++;
            console.log(`🔄 Retry ${job.retries}/${this.MAX_RETRIES} pour ${job.options.gameTitle}`);
            job.status = 'queued';
            job.message = `Nouvelle tentative (${job.retries}/${this.MAX_RETRIES})...`;
            this.sendProgress(job);
            this.isProcessing = false;
            
            // Delay before retry (longer for file lock issues)
            const retryDelay = 10000;
            console.log(`⏳ Attente de ${retryDelay / 1000}s avant retry...`);
            setTimeout(() => checkAndProcess(), retryDelay);
            return;
          }

          job.status = 'failed';
          job.message = `Échec: ${error.message}`;
          this.sendProgress(job);
          
          // Cleanup partial files on failure
          this.cleanupOnFailure(job);
          
          this.queue = this.queue.filter(j => j.id !== targetJobId);
          this.isProcessing = false;
          this.processNextInQueue();
          
          reject(error);
        }
      };

      checkAndProcess();
    });
  }

  private processNextInQueue(): void {
    const nextJob = this.queue.find(j => j.status === 'queued');
    if (nextJob) {
      console.log(`📋 Prochain job en queue: ${nextJob.options.gameTitle}`);
      // The promise for this job is already waiting in processQueue
    }
  }

  // ==========================================
  // Core Extraction Logic
  // ==========================================

  private async runExtraction(job: ExtractionJob): Promise<string> {
    const { archivePath, outputDir, password } = job.options;
    
    console.log(`📦 Extraction: ${basename(archivePath)}`);
    console.log(`📂 Destination: ${outputDir}`);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Ensure Dependencies (7-Zip) are present AVANT tout ce qui utilise 7z
    // (waitForFileUnlock et run7z l'utilisent — sinon spawnSync('') plante).
    await this.ensureDependencies();

    // Vérifier que 7-Zip est bien disponible ; sinon message clair (les .rar exigent le vrai 7z.exe).
    if (!this.get7zPath()) {
      throw new Error("7-Zip est requis pour extraire ce jeu (.rar) mais n'a pas pu être installé. Installez 7-Zip (https://www.7-zip.org) puis relancez l'installation.");
    }

    // Explicitly wait for OS / Anti-virus / Aria2c to release the file handles
    await this.waitForFileUnlock(archivePath, password, 20, 1000);

    // Split ZIP needs special handling: concatenate first
    if (/\.zip\.\d{3}$/i.test(archivePath)) {
      return this.extractSplitZip(job);
    }

    // All other formats: use 7z directly
    const result = await this.run7z(job);
    
    // Check for redists inside the extracted folder
    await this.checkAndInstallRedists(outputDir);

    return result;
  }

  /**
   * Waits until the file is no longer locked by another process (Aria2c/Defender).
   */
  private async waitForFileUnlock(filePath: string, password?: string, maxAttempts = 15, delayMs = 2000): Promise<void> {
    const { spawnSync } = require('child_process');
    const sevenZipPath = this.get7zPath();

    // Garde : sans binaire 7z, spawnSync('') planterait. On saute simplement le test de verrou.
    if (!sevenZipPath) {
        console.warn('⚠️ waitForFileUnlock: 7z introuvable — test de verrou ignoré.');
        return;
    }

    for (let i = 0; i < maxAttempts; i++) {
        const args = ['l'];
        if (password) args.push(`-p${password}`);
        args.push(filePath);

        const result = spawnSync(sevenZipPath, args, { windowsHide: true });
        
        if (result.status === 0) {
            console.log(`✅ Fichier ${basename(filePath)} est déverrouillé et lisible par 7z !`);
            return; 
        } else {
            console.log(`⏳ Fichier en cours d'analyse ou verrouillé (Code ${result.status}). Attente de libération (${i + 1}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
  }

  /**
   * Run 7z extraction with progress parsing.
   */
  private run7z(job: ExtractionJob): Promise<string> {
    return new Promise((resolve, reject) => {
      const { archivePath, outputDir, password } = job.options;
      const sevenZipPath = this.get7zPath();

      // Garde : sans 7z, spawn('') planterait avec une erreur cryptique.
      if (!sevenZipPath) {
        return reject(new Error("7-Zip introuvable : impossible d'extraire l'archive."));
      }

      const args = [
        'x',                          // Extract with full paths
        archivePath,                  // Archive path
        `-o${outputDir}`,            // Output directory
        '-aoa',                       // Overwrite all
        '-y',                         // Yes to all prompts
      ];

      if (password) {
        args.push(`-p${password}`);
      }

      console.log(`🔧 7z ${args.join(' ')}`);

      const child = spawn(sevenZipPath, args, {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      job.process = child;
      let stderr = '';

      // Parse stdout for progress
      child.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        
        // 7z outputs lines like "  42% 3 - folder/file.ext"
        const progressMatch = text.match(/(\d+)%/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1], 10);
          if (progress !== job.progress) {
            job.progress = progress;
            job.message = `Extraction: ${progress}%`;
            this.sendProgress(job);
          }
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        job.process = undefined;

        if (job.status === 'cancelled') {
          return reject(new Error('Cancelled'));
        }

        if (code === 0) {
          console.log('✅ 7z extraction complete');
          
          // Cleanup archives
          if (job.options.deleteAfter) {
            this.cleanupArchives(job.options.archivePath);
          }
          
          resolve(outputDir);
        } else {
          console.error(`❌ 7z exited with code ${code}:`, stderr);
          reject(new Error(`7z error (code ${code}): ${stderr.substring(0, 200)}`));
        }
      });

      child.on('error', (err) => {
        job.process = undefined;
        console.error('❌ 7z process error:', err);
        reject(new Error(`7z process error: ${err.message}`));
      });
    });
  }

  /**
   * Handle split ZIP: concatenate parts with streaming, then extract.
   */
  private async extractSplitZip(job: ExtractionJob): Promise<string> {
    const { archivePath, outputDir } = job.options;
    const dir = dirname(archivePath);
    const baseName = basename(archivePath).replace(/\.zip\.\d{3}$/, '');
    
    // Find all parts
    const allFiles = fs.readdirSync(dir);
    const parts = allFiles
      .filter(f => f.startsWith(baseName) && /\.zip\.\d{3}$/i.test(f))
      .sort();

    console.log(`📦 Split ZIP: ${parts.length} parties trouvées`);
    
    job.message = `Assemblage de ${parts.length} parties...`;
    this.sendProgress(job);

    // 1. Concatenate using STREAMS (memory efficient)
    const combinedPath = join(dir, `${baseName}.zip`);
    const writeStream = fs.createWriteStream(combinedPath);
    
    for (let i = 0; i < parts.length; i++) {
      const partPath = join(dir, parts[i]);
      
      await new Promise<void>((resolve, reject) => {
        const readStream = fs.createReadStream(partPath);
        readStream.on('error', reject);
        readStream.on('end', resolve);
        readStream.pipe(writeStream, { end: false });
      });
      
      job.progress = Math.round(((i + 1) / parts.length) * 40);
      job.message = `Assemblage ${i + 1}/${parts.length}...`;
      this.sendProgress(job);
    }

    // Close write stream
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });

    console.log('✅ Concaténation terminée');

    // 2. Extract combined zip with 7z
    job.options.archivePath = combinedPath;
    job.message = 'Extraction...';
    job.progress = 45;
    this.sendProgress(job);

    const result = await this.run7z(job);

    // 3. Delete the combined zip (parts are cleaned by run7z via cleanupArchives)
    try {
      if (fs.existsSync(combinedPath)) fs.unlinkSync(combinedPath);
    } catch (e) {}
    
    // Delete original split parts
    for (const part of parts) {
      try { fs.unlinkSync(join(dir, part)); } catch (e) {}
    }

    return result;
  }

  // ==========================================
  // IPC Progress
  // ==========================================

  private sendProgress(job: ExtractionJob): void {
    const win = getMainWindow();
    if (!win) return;

    win.webContents.send('install-progress', {
      progress: job.progress,
      message: job.message,
      gameID: job.options.gameId,
      gameTitle: job.options.gameTitle,
    });

    // Taskbar progress
    if (job.status === 'running') {
      if (job.progress > 0) {
        win.setProgressBar(job.progress / 100, { mode: 'normal' });
      } else {
        win.setProgressBar(0, { mode: 'indeterminate' });
      }
    } else if (job.status === 'done') {
      win.setProgressBar(1, { mode: 'normal' });
      setTimeout(() => win.setProgressBar(-1), 1500);
    } else if (job.status === 'failed') {
      win.setProgressBar(1, { mode: 'error' });
      setTimeout(() => win.setProgressBar(-1), 5000);
    }
  }

  // ==========================================
  // Cleanup
  // ==========================================

  /**
   * Delete the archive + any related multi-part files.
   */
  private cleanupArchives(archivePath: string): void {
    try {
      const dir = dirname(archivePath);
      const base = basename(archivePath);
      
      // Determine the base pattern for multi-part cleanup
      // e.g. "Game-OFME.part1.rar" → "Game-OFME.part"
      // e.g. "Game-OFME.rar" → "Game-OFME"zip
      
      let pattern: string;
      if (/\.part\d+\.rar$/i.test(base)) {
        pattern = base.replace(/\.part\d+\.rar$/i, '.part');
      } else if (/\.zip\.\d{3}$/i.test(base)) {
        pattern = base.replace(/\.zip\.\d{3}$/i, '.zip.');
      } else {
        // Single archive — just delete it
        try { fs.unlinkSync(archivePath); } catch (e) {}
        console.log('🗑️ Archive supprimée:', base);
        return;
      }

      // Delete all files matching the pattern
      const allFiles = fs.readdirSync(dir);
      let deleted = 0;
      for (const file of allFiles) {
        if (file.startsWith(pattern.split('.')[0]) && 
            (file.includes('.part') && file.endsWith('.rar') || file.match(/\.zip\.\d{3}$/))) {
          try {
            fs.unlinkSync(join(dir, file));
            deleted++;
          } catch (e) {}
        }
      }
      
      // Also delete the main archive file itself
      try { fs.unlinkSync(archivePath); } catch (e) {}
      
      console.log(`🗑️ ${deleted + 1} fichier(s) archive(s) supprimé(s)`);
    } catch (e) {
      console.warn('⚠️ Cleanup error:', e.message);
    }
  }

  /**
   * Cleanup partial extracted files on failure.
   */
  private cleanupOnFailure(job: ExtractionJob): void {
    // Don't delete the archives on failure — user might want to retry manually
    console.log('⚠️ Extraction failed, archives conservées pour retry manuel');
  }
}

// Singleton
export const extractionService = new ExtractionService();
