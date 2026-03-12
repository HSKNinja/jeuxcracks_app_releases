const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'assets', 'aria2c');
const ZIP_FILE = path.join(__dirname, 'aria2.zip');
const URL = 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip';

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

console.log('Downloading aria2c...');
const file = fs.createWriteStream(ZIP_FILE);
https.get(URL, (response) => {
  response.pipe(file);
  file.on('finish', () => {
    file.close(() => {
      console.log('Download complete. Extracting...');
      try {
        // Using PowerShell to expand archive since it works out of the box on Windows
        execSync(`powershell -Command "Expand-Archive -Force -Path '${ZIP_FILE}' -DestinationPath '${__dirname}/aria2_temp'"`, { stdio: 'inherit' });
        
        const exePath = path.join(__dirname, 'aria2_temp', 'aria2-1.37.0-win-64bit-build1', 'aria2c.exe');
        if (fs.existsSync(exePath)) {
          fs.renameSync(exePath, path.join(ASSETS_DIR, 'aria2c.exe'));
          console.log('Successfully placed aria2c.exe in assets/aria2c/');
        } else {
          console.error('aria2c.exe not found in extracted folder:', exePath);
        }
        
        // Cleanup
        fs.rmSync(path.join(__dirname, 'aria2_temp'), { recursive: true, force: true });
        fs.unlinkSync(ZIP_FILE);
      } catch (err) {
        console.error('Extraction failed:', err);
      }
    });
  });
}).on('error', (err) => {
  fs.unlink(ZIP_FILE, () => {});
  console.error('Download error:', err.message);
});
