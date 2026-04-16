import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import db from './src/lib/db';
import firebaseConfig from './firebase-applet-config.json';

// Initialize with project ID from config
admin.initializeApp({
  projectId: firebaseConfig.projectId
});

const firestore = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
// Set the database ID if it's a named database
// In firebase-admin, you might need to use a specific settings for named databases
// but usually it uses the default one. 
// Our config has firestoreDatabaseId: "ai-studio-58e4c9ae-1739-4d83-8b93-2dece0ef3443"

async function migrate() {
  const tables = ['users', 'cars', 'clients', 'rentals', 'payments'];
  
  for (const table of tables) {
    console.log(`Migrating ${table}...`);
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all() as any[];
      const collectionRef = firestore.collection(table);
      
      for (const row of rows) {
        const id = row.id.toString();
        const data = { ...row };
        delete data.id;
        
        await collectionRef.doc(id).set(data);
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
