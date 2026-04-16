import db from './src/lib/db';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function migrate() {
  const tables = ['users', 'cars', 'clients', 'rentals', 'payments'];
  
  for (const table of tables) {
    console.log(`Migrating ${table}...`);
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all() as any[];
      for (const row of rows) {
        const id = row.id.toString();
        const data = { ...row };
        delete data.id; // Firestore uses document ID
        
        // Handle dates/numbers if necessary
        await setDoc(doc(firestore, table, id), data);
      }
      console.log(`Successfully migrated ${rows.length} rows from ${table}`);
    } catch (error) {
      console.error(`Error migrating ${table}:`, error);
    }
  }
  console.log('Migration complete!');
  process.exit(0);
}

migrate();
