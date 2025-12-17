import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function useAuth({ allConfigs, favorites, unit, setAllConfigs, setFavorites, setUnit }) {
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { console.error("Error login:", e); alert("Error al iniciar sesión."); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setDataLoaded(false); }
    catch (error) { console.error("Error logout:", error); }
  };

  // --- CARGAR DATOS ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setIsSaving(true);
        try {
          const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'data', 'preferences');
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Restaurar configuración completa (Multi-función)
            if (data.allConfigs && setAllConfigs) setAllConfigs(data.allConfigs);
            if (data.favorites && setFavorites) setFavorites(data.favorites);
            if (data.unit && setUnit) setUnit(data.unit);
          }
          setDataLoaded(true);
        } catch (error) {
          console.error("Error loading:", error);
          setDataLoaded(true);
        }
        setIsSaving(false);
      } else {
        setDataLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- GUARDADO AUTOMÁTICO ---
  useEffect(() => {
    if (!user || !dataLoaded) return;

    const saveData = setTimeout(async () => {
      setIsSaving(true);
      try {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'preferences');

        await setDoc(docRef, {
          allConfigs, // Guardamos el objeto multiverso
          favorites,
          unit
        }, { merge: true });

      } catch (error) { console.error("Error saving:", error); }
      setIsSaving(false);
    }, 2000);

    return () => clearTimeout(saveData);
  }, [allConfigs, favorites, unit, user, dataLoaded]);

  return { user, isSaving, handleLogin, handleLogout };
}