import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// --- PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE ---
// (La obtienes en la consola de Firebase -> Configuración del proyecto)
const firebaseConfig = {
    apiKey: "AIzaSyBXTAZgXEzBPxfqSnTeY9hflL480EXFF0E",
    authDomain: "printmaster-pro-813b6.firebaseapp.com",
    projectId: "printmaster-pro-813b6",
    storageBucket: "printmaster-pro-813b6.firebasestorage.app",
    messagingSenderId: "167395321212",
    appId: "1:167395321212:web:8c1f739316a52fc3f270f9",
    measurementId: "G-Z40QG5ZRED"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exportar servicios para usarlos en la App
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

