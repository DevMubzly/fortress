const fs = require('fs');
const path = require('path');
const { generateKeyPairSync } = require('crypto');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

const content = 'export const PRIVATE_KEY = `' + privateKey + '`;\nexport const PUBLIC_KEY = `' + publicKey + '`;';

fs.writeFileSync(path.join(__dirname, '../lib/keys.ts'), content, { encoding: 'utf8' });
console.log('Keys generated successfully to lib/keys.ts');
