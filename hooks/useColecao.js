import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { erroAmigavel } from '../utils/domain';

export function useColecao(nome, condicoes = [], habilitado = true) {
  const chave = JSON.stringify(condicoes);
  const [tentativa, setTentativa] = useState(0);
  const [estado, setEstado] = useState({ itens: [], carregando: true, erro: '' });
  useEffect(() => {
    if (!habilitado) { setEstado({ itens: [], carregando: false, erro: '' }); return; }
    setEstado({ itens: [], carregando: true, erro: '' });
    return onSnapshot(query(collection(database, nome), ...JSON.parse(chave).map((c) => where(...c))),
      (snap) => setEstado({ itens: snap.docs.map((d) => ({ ...d.data(), id: d.id })), carregando: false, erro: '' }),
      (e) => setEstado({ itens: [], carregando: false, erro: erroAmigavel(e) }));
  }, [nome, chave, habilitado, tentativa]);
  return { ...estado, recarregar: useCallback(() => setTentativa((v) => v + 1), []) };
}
