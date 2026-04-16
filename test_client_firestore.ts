import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log('Users count:', snap.size);
    snap.forEach(doc => console.log(doc.id, doc.data().username));
  } catch (e: any) {
    console.error('Firestore error:', e.message);
  }
}

test();
