import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { AuthContext } from './AuthContext';
import { ordenarAvisos } from '../utils/notificacoes';

export const NotificacoesContext = createContext({ itens: [], naoLidas: 0 });
export function NotificacoesProvider({ children }) {
  const { user } = useContext(AuthContext);
  const uid = user && !user.perfilPendente && user.ativo !== false ? user.uid : null;
  const [caixa, setCaixa] = useState({ uid: null, itens: [], carregando: false, erro: '' });
  const [tentativa, setTentativa] = useState(0);
  const usuarioAtual = useRef(uid);
  usuarioAtual.current = uid;

  useEffect(() => {
    if (!uid) { setCaixa({ uid: null, itens: [], carregando: false, erro: '' }); return; }
    let ativo = true;
    setCaixa({ uid, itens: [], carregando: true, erro: '' });
    const parar = onSnapshot(query(collection(database, 'notificacoes'), where('destinatarioId', '==', uid)), (snap) => {
      if (!ativo || usuarioAtual.current !== uid) return;
      setCaixa({ uid, itens: ordenarAvisos(snap.docs.map((d) => ({ ...d.data(), id: d.id }))), carregando: false, erro: '' });
    }, () => {
      if (ativo && usuarioAtual.current === uid) setCaixa({ uid, itens: [], carregando: false, erro: 'Não foi possível carregar os avisos. Confira a conexão e tente novamente.' });
    });
    return () => { ativo = false; parar(); };
  }, [uid, tentativa]);

  const itens = caixa.uid === uid ? caixa.itens : [];
  const marcarLida = async (id) => {
    if (!uid || usuarioAtual.current !== uid || !itens.some((n) => n.id === id && !n.lidaEm)) return;
    await updateDoc(doc(database, 'notificacoes', id), { lidaEm: serverTimestamp() });
  };
  const marcarTodas = async () => {
    if (!uid) return;
    const pendentes = itens.filter((n) => !n.lidaEm);
    for (let i = 0; i < pendentes.length; i += 400) {
      if (usuarioAtual.current !== uid) return;
      const lote = writeBatch(database);
      pendentes.slice(i, i + 400).forEach((n) => lote.update(doc(database, 'notificacoes', n.id), { lidaEm: serverTimestamp() }));
      await lote.commit();
    }
  };
  return <NotificacoesContext.Provider value={{ itens, naoLidas: itens.filter((n) => !n.lidaEm).length,
    carregando: caixa.uid === uid && caixa.carregando, erro: caixa.uid === uid ? caixa.erro : '',
    recarregar: () => setTentativa((n) => n + 1), marcarLida, marcarTodas }}>{children}</NotificacoesContext.Provider>;
}
