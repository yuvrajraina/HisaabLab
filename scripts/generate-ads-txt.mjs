import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const publisher = process.env.PUBLIC_ADSENSE_PUBLISHER_ID?.trim();
if (!publisher || !/^ca-pub-\d+$/.test(publisher)) {
  console.error('Set a real PUBLIC_ADSENSE_PUBLISHER_ID such as ca-pub-<digits> after approval. No ads.txt was written.');
  process.exit(1);
}
const numericId = publisher.replace('ca-', '');
await writeFile(resolve('public/ads.txt'), `google.com, ${numericId}, DIRECT, f08c47fec0942fa0\n`, 'utf8');
console.log('Generated public/ads.txt for the configured approved publisher.');
