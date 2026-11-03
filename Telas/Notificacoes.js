import Toque from '../Componentes/Toque';
import React, { useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NotificacoesContext } from '../contexts/NotificacoesContext';
import { BotaoIcone, Campo, Card, cores, Estado, Icone, Mensagem, Pagina, s } from '../Componentes/UI';
import { destinoAviso, iconeAviso } from '../utils/notificacoes';

export default function Notificacoes({ navigation }) {
  const { itens, naoLidas, carregando, erro, recarregar, marcarLida, marcarTodas } = useContext(NotificacoesContext);
  const [filtro, setFiltro] = useState('todas'), [salvando, setSalvando] = useState(false), [erroAcao, setErroAcao] = useState('');
  const abrir = (aviso) => {
    marcarLida(aviso.id).catch(() => setErroAcao('Não foi possível marcar esta notificação como lida.'));
    const destino = destinoAviso(aviso);
    if (destino) navigation.navigate(destino.tela, destino.parametros);
  };
  const lista = itens.filter((n) => filtro === 'todas' || !n.lidaEm);
  return <Pagina navigation={navigation} titulo="Notificações" descricao="As novidades dos seus imóveis e atendimentos, em um só lugar." mostrarSino={false}>
    <Card><View style={n.resumo}><View style={s.tileIcone}><Icone nome="notifications-outline" tamanho={24} /></View><View style={{ flex: 1 }}><Text style={s.menuTitulo}>{naoLidas ? `${naoLidas} ${naoLidas === 1 ? 'novidade para você' : 'novidades para você'}` : 'Tudo em dia por aqui'}</Text><Text style={s.menuDescricao}>Seus avisos ficam guardados nesta central.</Text></View></View>
      <Text style={s.muted}>Sempre que entrar no aplicativo, confira aqui os retornos da equipe e as atualizações dos seus pedidos.</Text>
    </Card>
    <View style={n.filtros}><View style={{ flex: 1 }}><Campo label="Exibir" valor={filtro} alterar={setFiltro} opcoes={[{ valor: 'todas', texto: 'Todas' }, { valor: 'nao_lidas', texto: 'Não lidas' }]} /></View>
      {!!naoLidas && <BotaoIcone icone="checkmark-done-outline" label="Marcar todas como lidas" desativado={salvando} onPress={async () => {
        setSalvando(true); setErroAcao(''); try { await marcarTodas(); } catch { setErroAcao('Não foi possível marcar as notificações como lidas.'); } finally { setSalvando(false); }
      }} />}
    </View>
    <Mensagem erro texto={erroAcao} /><Estado carregando={carregando} erro={erro} recarregar={recarregar} />
    {!carregando && !erro && !lista.length && <View style={n.vazio}><View style={n.sinoVazio}><Icone nome="notifications-off-outline" tamanho={34} /></View><Text style={s.menuTitulo}>{filtro === 'nao_lidas' ? 'Nenhuma notificação não lida' : 'Suas novidades vão aparecer aqui'}</Text><Text style={[s.muted, { textAlign: 'center' }]}>Confirmações de visitas, anúncios publicados e retornos da equipe ficam disponíveis nesta central.</Text></View>}
    {lista.map((aviso) => <Toque key={aviso.id} accessibilityRole="button" accessibilityLabel={`${aviso.lidaEm ? '' : 'Não lida. '}${aviso.titulo}. ${aviso.mensagem}`} activeOpacity={0.8} onPress={() => abrir(aviso)} style={[n.item, !aviso.lidaEm && n.naoLida]}>
      <View style={s.tileIcone}><Icone nome={iconeAviso(aviso.tipo)} /></View><View style={{ flex: 1 }}><View style={n.tituloLinha}><Text style={[s.menuTitulo, { flex: 1 }]}>{aviso.titulo}</Text>{!aviso.lidaEm && <View style={n.ponto} />}</View>
        <Text style={[s.menuDescricao, { marginTop: 7 }]}>{aviso.mensagem}</Text><Text style={n.data}>{aviso.criadoEm?.toDate?.().toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) || 'Agora'}</Text>
      </View><Icone nome="chevron-forward" tamanho={15} cor="#7D806F" />
    </Toque>)}
  </Pagina>;
}
const n = StyleSheet.create({
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 13 }, filtros: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, marginVertical: 6, backgroundColor: '#171A14', borderWidth: 1, borderColor: 'rgba(201,168,106,0.1)' }, naoLida: { backgroundColor: '#1C2016', borderColor: 'rgba(201,168,106,0.32)' },
  tituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 }, ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: cores.ouro }, data: { color: '#828D75', fontSize: 9, marginTop: 10 }, vazio: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 15, gap: 12 }, sinoVazio: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(201,168,106,0.05)', marginBottom: 8 },
});
