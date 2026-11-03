import Toque from '../Componentes/Toque';
import React, { useContext, useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';
import { useColecao } from '../hooks/useColecao';
import { Atalho, Badge, Botao, BotaoIcone, Campo, Card, cores, Estado, Icone, ItemMenu, Mensagem, Pagina, s, TituloSecao } from '../Componentes/UI';
import ImovelCard, { Caracteristicas } from '../Componentes/ImovelCard';
import { disponivel, equipe, erroAmigavel, filtrarImoveis, fotosImovel, moeda, numero, TIPOS_IMOVEL } from '../utils/domain';

export function Catalogo({ navigation }) {
  const { user } = useContext(AuthContext);
  const lista = useColecao('imoveis', [['publicado', '==', true], ['catalogoSeguro', '==', true]]);
  const [f, setF] = useState({}), [avancado, setAvancado] = useState(false);
  const campo = (id) => (valor) => setF((atual) => ({ ...atual, [id]: valor }));
  const erroFiltro = (f.min && !Number.isFinite(numero(f.min))) || (f.max && !Number.isFinite(numero(f.max)))
    ? 'Informe valores válidos para o filtro de preço.' : f.min && f.max && numero(f.min) > numero(f.max) ? 'O valor mínimo deve ser menor ou igual ao máximo.' : '';
  const itens = erroFiltro ? [] : filtrarImoveis(lista.itens.filter(disponivel), f);
  return <Pagina navigation={navigation} inicio titulo={'Encontre seu\npróximo imóvel'} descricao="Um novo endereço para viver seus planos." sobretitulo="BEM-VINDO À A2 IMÓVEIS">
    {user && <View style={[s.linha, { marginBottom: 16 }]}>
      <Atalho titulo="Minhas propostas" icone="documents-outline" onPress={() => navigation.navigate('Propostas')} />
      {user.tipo === 'proprietario' ? <Atalho titulo="Meus anúncios" icone="megaphone-outline" onPress={() => navigation.navigate('MeusAnuncios')} /> :
        (equipe(user.tipo) || user.tipo === 'corretor') && <Atalho titulo="Painel da equipe" icone="grid-outline" onPress={() => navigation.navigate('InicialAdm')} />}
    </View>}
    <Card style={{ padding: 15, marginVertical: 0 }}>
      <Campo label="Qual imóvel você procura?" icone="search-outline" valor={f.busca} alterar={campo('busca')} placeholder="Cidade, bairro ou tipo de imóvel" />
      <View style={v.finalidades}>
        {[['', 'Todos'], ['Venda', 'Comprar'], ['Locação', 'Alugar']].map(([valor, texto]) => <Toque accessibilityRole="button" accessibilityState={{ selected: (f.finalidade || '') === valor }} key={valor} onPress={() => campo('finalidade')(valor)} style={[v.segmento, (f.finalidade || '') === valor && v.segmentoAtivo]}>
          <Text style={[v.segmentoTexto, (f.finalidade || '') === valor && { color: cores.fundo }]}>{texto}</Text>
        </Toque>)}
        <BotaoIcone icone="options-outline" label={avancado ? 'Ocultar filtros' : 'Mais filtros'} destaque={avancado} onPress={() => setAvancado(!avancado)} />
      </View>
      {avancado && <View style={{ marginTop: 15 }}><Campo label="Categoria" valor={f.tipo || ''} alterar={campo('tipo')} opcoes={[{ valor: '', texto: 'Todas' }, ...TIPOS_IMOVEL]} />
        <Campo label="Cidade" valor={f.cidade} alterar={campo('cidade')} /><Campo label="Bairro" valor={f.bairro} alterar={campo('bairro')} />
        <View style={s.linha}><View style={{ flex: 1 }}><Campo label="Valor mínimo (R$)" numero valor={f.min} alterar={campo('min')} /></View><View style={{ flex: 1 }}><Campo label="Valor máximo (R$)" numero valor={f.max} alterar={campo('max')} /></View></View>
        <Campo label="Ordenar por" valor={f.ordem || 'Mais recentes'} alterar={campo('ordem')} opcoes={['Mais recentes', 'Menor preço', 'Maior preço']} />
        <Botao secundario texto="Limpar filtros" icone="refresh-outline" onPress={() => setF({})} />
      </View>}
    </Card>
    <Mensagem erro texto={erroFiltro} /><TituloSecao titulo="Imóveis disponíveis" descricao="Conheça as oportunidades da A2." quantidade={itens.length} />
    <Estado {...lista} vazio={!itens.length && !erroFiltro} />
    {itens.map((i) => <ImovelCard key={i.id} imovel={i} onPress={() => navigation.navigate('DetalhesImovel', { imovelId: i.id })} />)}
    <TituloSecao titulo="Como podemos ajudar?" descricao="Conte com a nossa equipe em cada etapa." />
    {[['Terreno + Construção', 'TerrenoConstrucao', 'construct-outline', 'Seu projeto começa aqui.'], ['Avaliação de imóveis', 'AvaliacaoImovel', 'home-outline', 'Conheça o valor do seu patrimônio.'], ['Agendar visita', 'AgendarVisita', 'calendar-outline', 'Conheça seu próximo imóvel de perto.'], ['Fale com um corretor', 'Atendimento', 'chatbubble-ellipses-outline', 'Atendimento para suas dúvidas e planos.']].map(([titulo, tela, icone, descricao]) =>
      <ItemMenu key={tela} titulo={titulo} descricao={descricao} icone={icone} onPress={() => navigation.navigate(user ? tela : 'Login')} />)}
  </Pagina>;
}
export function Detalhes({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const id = route.params?.imovelId || route.params?.imovel?.id;
  const [imovel, setImovel] = useState(null), [carregando, setCarregando] = useState(true), [erro, setErro] = useState(''), [foto, setFoto] = useState(0);
  useEffect(() => {
    if (!id) { setErro('Imóvel não encontrado.'); setCarregando(false); return; }
    return onSnapshot(doc(database, 'imoveis', id), (snap) => {
      setImovel(snap.exists() ? { ...snap.data(), id: snap.id } : null); setCarregando(false);
    }, (e) => { setErro(erroAmigavel(e)); setImovel(null); setCarregando(false); });
  }, [id]);
  const fotos = fotosImovel(imovel || {});
  const abrir = async (url) => { try { await Linking.openURL(url); } catch { setErro('Não foi possível abrir o contato ou mapa.'); } };
  return <Pagina navigation={navigation} titulo={imovel?.titulo || 'Detalhes do imóvel'} sobretitulo={imovel?.tipo}>
    <Estado carregando={carregando} erro={erro} vazio={!imovel} />
    {imovel && <>
      <View style={v.galeria}><Image source={fotos.length ? { uri: fotos[foto % fotos.length] } : require('../Imagens/fundo-imoveis.png')} style={v.fotoPrincipal} resizeMode="cover" />
        <View style={v.finalidadeImagem}><Badge texto={imovel.finalidade} /></View>
        {fotos.length > 1 && <View style={v.controlesFoto}><BotaoIcone icone="chevron-back" label="Foto anterior" onPress={() => setFoto((foto + fotos.length - 1) % fotos.length)} /><Text style={v.contadorFoto}>{foto % fotos.length + 1} / {fotos.length}</Text><BotaoIcone icone="chevron-forward" label="Próxima foto" onPress={() => setFoto((foto + 1) % fotos.length)} /></View>}
      </View>
      {fotos.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={v.miniaturas}>{fotos.map((url, indice) => <Toque key={`${url}-${indice}`} accessibilityRole="button" accessibilityLabel={`Ver foto ${indice + 1}`} accessibilityState={{ selected: indice === foto % fotos.length }} onPress={() => setFoto(indice)} style={[v.miniatura, indice === foto % fotos.length && { borderColor: cores.ouro }]}><Image source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: 9 }} /></Toque>)}</ScrollView>}
      <Card><Text style={s.label}>{imovel.finalidade === 'Locação' ? 'VALOR MENSAL' : 'VALOR DO IMÓVEL'}</Text><Text style={v.valorImovel}>{moeda(imovel.preco)}</Text>
        <View style={v.localizacao}><Icone nome="location-outline" tamanho={17} /><Text style={[s.muted, { flex: 1 }]}>{[imovel.endereco, imovel.bairro, imovel.cidade].filter(Boolean).join(', ')}</Text></View>
        <Text style={v.codigo}>REF. {imovel.codigo || id}</Text>
      </Card>
      <Card><Caracteristicas imovel={imovel} grande /></Card>
      <TituloSecao titulo="Sobre o imóvel" icone="home-outline" /><Text style={s.texto}>{imovel.descricao || 'Consulte nossa equipe para mais informações.'}</Text>
      <ItemMenu titulo="Ver localização no mapa" descricao={[imovel.bairro, imovel.cidade].filter(Boolean).join(' · ')} icone="map-outline" onPress={() => abrir(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([imovel.endereco, imovel.bairro, imovel.cidade].filter(Boolean).join(', '))}`)} />
      {!!imovel.corretorNome && <Card><View style={s.linha}><View style={s.tileIcone}><Icone nome="person-outline" /></View><View style={{ flex: 1 }}><Text style={s.label}>CORRETOR RESPONSÁVEL</Text><Text style={s.texto}>{imovel.corretorNome}</Text></View></View></Card>}
      <TituloSecao titulo="Gostou deste imóvel?" descricao="Dê o próximo passo com a nossa equipe." />
      {!disponivel(imovel) ? <Mensagem erro texto="Este imóvel não está disponível para novas visitas ou propostas." /> : <>
        <Botao texto="Agendar visita" icone="calendar-outline" onPress={() => navigation.navigate(user ? 'AgendarVisita' : 'Login', user ? { imovel } : undefined)} />
        {user?.uid !== imovel.proprietarioId && <Botao secundario texto="Enviar proposta" icone="document-text-outline" onPress={() => navigation.navigate(user ? 'NovaProposta' : 'Login', user ? { imovelId: id } : undefined)} />}
        <Botao secundario texto="Solicitar atendimento" onPress={() => navigation.navigate(user ? 'Atendimento' : 'Login')} />
      </>}
      {!!imovel.telefone && <Botao secundario texto="Conversar pelo WhatsApp" onPress={() => {
        const digits = String(imovel.telefone).replace(/\D/g, ''); const phone = digits.length > 11 && digits.startsWith('55') ? digits : `55${digits}`;
        abrir(`https://wa.me/${phone}?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel ${imovel.titulo} (código ${imovel.codigo || id}).`)}`);
      }} />}
      <Text style={[s.muted, { fontSize: 10, textAlign: 'center', marginTop: 18 }]}>Valores e disponibilidade sujeitos à confirmação pela A2 Imóveis.</Text>
    </>}
  </Pagina>;
}
const v = StyleSheet.create({
  finalidades: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }, segmento: { flex: 1, paddingVertical: 13, borderRadius: 13, alignItems: 'center', backgroundColor: '#10130E' }, segmentoAtivo: { backgroundColor: cores.ouro }, segmentoTexto: { color: '#9BA48D', fontSize: 11, fontWeight: '700' },
  galeria: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#1D2416' }, fotoPrincipal: { width: '100%', height: 300 }, finalidadeImagem: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(15,20,10,0.85)', borderRadius: 20 }, controlesFoto: { position: 'absolute', bottom: 14, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, contadorFoto: { color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 15, backgroundColor: 'rgba(10,15,5,0.8)' },
  miniaturas: { gap: 8, paddingVertical: 12 }, miniatura: { width: 65, height: 52, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', padding: 1 }, valorImovel: { color: cores.claro, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginBottom: 10 }, localizacao: { flexDirection: 'row', alignItems: 'center', gap: 8 }, codigo: { color: '#737E65', fontSize: 9, letterSpacing: 1, marginTop: 7 },
});
