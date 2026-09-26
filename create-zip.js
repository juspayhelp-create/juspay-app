import AdmZip from 'adm-zip';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const zip = new AdmZip();

zip.addLocalFolder(__dirname, '', (filename) => {
  const normalized = filename.replace(/\\/g, '/');
  if (
    normalized.includes('/node_modules/') ||
    normalized.includes('/dist/') ||
    normalized.includes('/.git/') ||
    normalized.endsWith('.zip') ||
    normalized.includes('juspay-production-release.zip')
  ) {
    return false;
  }
  return true;
});

const outputPath = path.join(__dirname, 'public', 'juspay-production-release.zip');
zip.writeZip(outputPath);
console.log('Production release ZIP created successfully at /public/juspay-production-release.zip');
