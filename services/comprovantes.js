import { File } from 'expo-file-system';
import { Linking } from 'react-native';
import { uploadImagem } from './cloudinary';

export async function enviarComprovante(asset) {
  const tamanho = new File(asset.uri).size;
  if (!Number.isFinite(tamanho) || tamanho <= 0) throw new Error('Não foi possível ler o comprovante selecionado.');
  if (tamanho > 5 * 1024 * 1024) throw new Error('O comprovante deve ter no máximo 5 MB.');
  if (asset.mimeType && !asset.mimeType.startsWith('image/')) throw new Error('Selecione uma imagem do comprovante.');
  return uploadImagem(asset.uri);
}
export async function abrirComprovante(pedido) {
  const url = pedido.comprovanteResidencia;
  if (typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/boycvhni/image/upload/')) throw new Error('Comprovante não encontrado ou link inválido.');
  await Linking.openURL(url);
}
