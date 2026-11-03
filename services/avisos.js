import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { criarAvisos } from '../utils/notificacoes';

// A atualização e o aviso são confirmados juntos pelo Firestore.
export function registrarAvisos(lote, origem, origemId, anterior, atual, remetenteId) {
  const avisos = criarAvisos(origem, origemId, anterior, atual, remetenteId);
  for (const aviso of avisos) lote.set(doc(collection(database, 'notificacoes')), { ...aviso, criadoEm: serverTimestamp() });
}
