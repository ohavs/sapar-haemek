import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual config from Firebase Console
// For now, we use a placeholder or check if environment variables exist
const firebaseConfig = {
    apiKey: "AIzaSyDNYpEJlr5lGJAILETHWJ7r-7qrJ4BfhW4",
    authDomain: "sapar-haemek.firebaseapp.com",
    projectId: "sapar-haemek",
    storageBucket: "sapar-haemek.firebasestorage.app",
    messagingSenderId: "893833906578",
    appId: "1:893833906578:web:94147c922f1e4b3c77994b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
