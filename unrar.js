"use strict";
const worker_threads = require("worker_threads");
const unrar = require("node-unrar-js");
const fs = require("fs");
const path = require("path");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const unrar__namespace = /* @__PURE__ */ _interopNamespaceDefault(unrar);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
worker_threads.parentPort.on("message", async (data) => {
  const { path: path$1, fileName, password } = data;
  const filePath = path.join(path$1, fileName);
  const targetPath = path.dirname(filePath);
  try {
    const extractor = await unrar__namespace.createExtractorFromFile({
      filepath: filePath,
      password,
      targetPath
    });
    const extraction = extractor.extract();
    const files = [...extraction.files];
    for (const file of files) {
      if (file.fileHeader.flags.directory) {
        fs__namespace.mkdirSync(path.join(targetPath, file.fileHeader.name), { recursive: true });
      } else {
        const content = file.extraction;
        if (content) {
          const writeStream = fs__namespace.createWriteStream(path.join(targetPath, file.fileHeader.name));
          writeStream.write(Buffer.from(content));
          writeStream.close();
        }
      }
    }
    fs__namespace.unlinkSync(filePath);
    worker_threads.parentPort.postMessage("done");
  } catch (error) {
    worker_threads.parentPort.postMessage(`error: ${error.message}`);
  }
});
async function worker() {
  worker_threads.parentPort.postMessage("started");
}
worker();
//# sourceMappingURL=unrar.js.map
