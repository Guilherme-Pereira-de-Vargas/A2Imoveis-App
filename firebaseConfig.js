import { initializeApp } from "firebase/app";
import { obterAuth } from './services/authPersistence';
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDCP5ngc0sUKmN9jvHbw6s5CWfXv_EmqiA",
  authDomain: "a2-imoveis.firebaseapp.com",
  projectId: "a2-imoveis",
  messagingSenderId: "285703062694",
  appId: "1:285703062694:web:97fcc3aa692e40f7c66067",
  measurementId: "G-RBPG1P2K63"
};


export const app = initializeApp(firebaseConfig);

const auth = obterAuth(app);

export { auth };


export const database = getFirestore(app);
