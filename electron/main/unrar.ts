// const { parentPort } = require('worker_threads');
// const unrar = require('node-unrar-js');
// const fs = require('fs');
// const { join, dirname } = require('path');
import { parentPort } from 'worker_threads';
import * as unrar from 'node-unrar-js';
import * as fs from 'fs';
import { join, dirname } from 'path';

parentPort.on('message', async (data) => {
  const { path, fileName, password } = data;
  const filePath = join(path, fileName);
  const targetPath = dirname(filePath);

  try {
    const extractor = await unrar.createExtractorFromFile({
      filepath: filePath,
      password,
      targetPath,
    });

    const extraction = extractor.extract();
    const files = [...extraction.files];

    for (const file of files) {
      if (file.fileHeader.flags.directory) {
        fs.mkdirSync(join(targetPath, file.fileHeader.name), { recursive: true });
      } else {
        const content = file.extraction;
        if (content) {
          const writeStream = fs.createWriteStream(join(targetPath, file.fileHeader.name));
          writeStream.write(Buffer.from(content));
          writeStream.close();
        }
      }
    }

    // fs.unlinkSync(filePath); // Let the main process handle cleanup
    parentPort.postMessage('done');
  } catch (error) {
    parentPort.postMessage(`error: ${error.message}`);
  }
});

async function worker() {
  parentPort.postMessage('started');
}

worker();
