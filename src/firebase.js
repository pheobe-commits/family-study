import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBIS1GYuWhKKpLsx-itSum...",
  authDomain: "study-5ec0d.firebaseapp.com",
  projectId: "study-5ec0d",
  storageBucket: "study-5ec0d.firebasestorage.app",
  messagingSenderId: "1050958808678",
  appId: "1:1050958808678:web:d79193a9..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
