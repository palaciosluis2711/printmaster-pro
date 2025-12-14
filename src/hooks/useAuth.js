import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase'; // Ajusta si tu archivo firebase.js está en otra ruta
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function useAuth({ config, favorites, unit, setConfig, setFavorites, setUnit }) {
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- LOGIN ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Error al iniciar sesión:", e);
      alert("No se pudo iniciar sesión.");
    }
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // --- CARGAR DATOS (Firestore o LocalStorage) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 1. Si hay usuario, cargamos desde Firebase
        setIsSaving(true);
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.config && setConfig) setConfig(data.config);
            if (data.favorites && setFavorites) setFavorites(data.favorites);
            if (data.unit && setUnit) setUnit(data.unit);
          } else {
            // Si es usuario nuevo, creamos el documento inicial
            await setDoc(docRef, { config, favorites, unit });
          }
        } catch (error) {
          console.error("Error cargando datos de usuario:", error);
        }
        setIsSaving(false);
      } else {
        // 2. Si NO hay usuario, intentamos cargar favoritos de LocalStorage
        const savedFavs = localStorage.getItem('printmaster_favs');
        if (savedFavs && setFavorites) {
          setFavorites(JSON.parse(savedFavs));
        }
      }
    });

    return () => unsubscribe();
  }, []); // Se ejecuta solo al montar

  // --- GUARDADO AUTOMÁTICO (Config & Unit) ---
  useEffect(() => {
    if (!user) return;

    const saveData = setTimeout(async () => {
      setIsSaving(true);
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { config, unit }, { merge: true });
      } catch (error) {
        console.error("Error guardando config:", error);
      }
      setIsSaving(false);
    }, 1500); // Debounce de 1.5s

    return () => clearTimeout(saveData);
  }, [config, unit, user]);

  // --- GUARDADO AUTOMÁTICO (Favoritos & LocalStorage) ---
  useEffect(() => {
    // Siempre guardar en LocalStorage como backup
    localStorage.setItem('printmaster_favs', JSON.stringify(favorites));

    if (!user) return;

    const saveFavs = async () => {
      setIsSaving(true);
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, { favorites }, { merge: true });
      } catch (error) {
        console.error("Error guardando favoritos:", error);
      }
      setIsSaving(false);
    };

    saveFavs();
  }, [favorites, user]);

  return { user, isSaving, handleLogin, handleLogout };
}