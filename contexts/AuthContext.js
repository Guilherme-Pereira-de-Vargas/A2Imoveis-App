import React, { createContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as sairFirebase } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, database } from '../firebaseConfig';
import { erroAmigavel } from '../utils/domain';

export const AuthContext = createContext({});
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let pararPerfil = () => {};
    const parar = onAuthStateChanged(auth, (conta) => {
      pararPerfil(); setUser(null); setErro('');
      if (!conta) { setCarregando(false); return; }
      setCarregando(true); setIsGuest(false);
      pararPerfil = onSnapshot(doc(database, 'usuarios', conta.uid), (snap) => {
        setUser({ ...snap.data(), uid: conta.uid, email: conta.email, perfilPendente: !snap.exists() });
        setCarregando(false);
      }, (e) => { setErro(erroAmigavel(e)); setCarregando(false); });
    });
    return () => { parar(); pararPerfil(); };
  }, []);
  const signOut = async () => { await sairFirebase(auth); setUser(null); setIsGuest(false); };
  const continueAsGuest = async () => { await signOut(); setIsGuest(true); };
  return <AuthContext.Provider value={{ user, isGuest, carregando, erro, signOut, continueAsGuest }}>{children}</AuthContext.Provider>;
}
export default AuthContext;
