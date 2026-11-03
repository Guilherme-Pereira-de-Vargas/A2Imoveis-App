import { File } from 'expo-file-system';
import { fetch } from 'expo/fetch';

const CLOUD_NAME = 'boycvhni';
const UPLOAD_PRESET = 'a2_imoveis';

export async function uploadImagem(uri) {
  const arquivo = new File(uri);
  const form = new FormData();
  form.append('file', arquivo);
  form.append('upload_preset', UPLOAD_PRESET);
  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  const dados = await resposta.json();
  if (!resposta.ok || !dados.secure_url) throw new Error(dados.error?.message || 'Não foi possível enviar a imagem.');
  return dados.secure_url;
}
