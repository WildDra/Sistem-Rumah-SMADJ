import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBK-cXOazu5JkOhqh7JFrsMsgeagLrs9Sg",
  authDomain: "sistem-rumah-smadj.firebaseapp.com",
  projectId: "sistem-rumah-smadj",
  storageBucket: "sistem-rumah-smadj.firebasestorage.app",
  messagingSenderId: "613765067244",
  appId: "1:613765067244:web:3aaef4309a427e483c10c9",
  measurementId: "G-SVRHNDZNRK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
