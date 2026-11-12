import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db/database.js';
import { createApp } from './app.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const DB_FILE = process.env.DB_FILE || path.join(here, '..', 'data', 'hackademy.db');
const STATIC_DIR = path.join(here, '..', '..', 'client', 'dist');

const db = openDatabase(DB_FILE);
const app = createApp({ db, staticDir: STATIC_DIR });

app.listen(PORT, () => {
  const built = fs.existsSync(path.join(STATIC_DIR, 'index.html'));
  console.log('');
  console.log('  ==============================================');
  if (built) {
    console.log(`   HACKADEMY est lance : ouvrez http://localhost:${PORT}`);
  } else {
    console.log('   Le site n\'est pas encore compile : lancez "npm run build"');
    console.log(`   (en developpement : "npm run dev" puis http://localhost:5173)`);
  }
  console.log('   Pour arreter : Ctrl + C dans cette fenetre');
  console.log('  ==============================================');
  console.log(`  (API interne : http://localhost:${PORT}/api - base : ${DB_FILE})`);
  console.log('');
});
