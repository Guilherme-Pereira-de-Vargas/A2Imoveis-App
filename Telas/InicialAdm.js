import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { Avatar, Badge, Card, ItemMenu, Pagina, s, TituloSecao } from '../Componentes/UI';
import { equipe } from '../utils/domain';

export default function InicialAdm({ navigation }) {
  const { user } = useContext(AuthContext);
  const abrir = (tela) => () => navigation.navigate(tela);
  const servicos = [
    ['Terreno + Construção', 'TerrenoConstrucaoAdm', 'construct-outline', 'Projetos, estimativas e financiamento.'],
    ['Avaliação de imóveis', 'AvaliacaoImovelAdm', 'home-outline', 'Solicitações e valores estimados.'],
    ['Agenda de visitas', 'AgendaVisitasAdm', 'calendar-outline', 'Datas, horários e confirmações.'],
    ['Atendimentos', 'AtendimentoAdm', 'chatbubble-ellipses-outline', 'Conversas e acompanhamento dos clientes.'],
  ];
  return <Pagina navigation={navigation} inicio titulo={user.tipo === 'corretor' ? 'Área do corretor' : 'Administração'} sobretitulo="PAINEL DA IMOBILIÁRIA">
    <Card><View style={[s.linha, { alignItems: 'center', gap: 15 }]}><Avatar tamanho={48} /><View style={{ flex: 1 }}><Text style={s.menuDescricao}>Bem-vindo de volta,</Text><Text style={s.subtitulo}>{user.nome?.split(' ')[0] || 'equipe'}</Text><Badge texto={user.tipo === 'dono' ? 'Dono' : user.tipo === 'corretor' ? 'Corretor' : 'Administrador'} /></View></View></Card>
    {equipe(user.tipo) && <><TituloSecao titulo="Gestão" descricao="Organize os cadastros e os anúncios." />
      <ItemMenu titulo="Usuários e corretores" descricao="Consultar cadastros e gerenciar acessos." icone="people-outline" onPress={abrir('CadastroAdm')} />
      <ItemMenu titulo="Gerenciar imóveis" descricao="Informações, anúncios e disponibilidade." icone="business-outline" onPress={abrir('GestaoImoveis')} />
      <ItemMenu titulo="Solicitações de anúncios" descricao="Analisar os pedidos dos proprietários." icone="megaphone-outline" onPress={abrir('SolicitacoesAnuncio')} />
    </>}
    <TituloSecao titulo="Serviços e atendimentos" descricao={equipe(user.tipo) ? 'Acompanhe o trabalho da equipe.' : 'Confira os atendimentos atribuídos a você.'} />
    {servicos.map(([titulo, tela, icone, descricao]) => <ItemMenu key={tela} titulo={titulo} descricao={descricao} icone={icone} onPress={abrir(tela)} />)}
    <TituloSecao titulo="Negócios" /><ItemMenu destaque titulo="Propostas e negociações" descricao="Valores, contrapropostas e histórico." icone="documents-outline" onPress={abrir('Propostas')} />
    <TituloSecao titulo="Minha conta" /><ItemMenu titulo="Consultar catálogo" icone="grid-outline" onPress={abrir('Imoveis')} /><ItemMenu titulo="Meu perfil" icone="person-outline" onPress={abrir('Perfil')} />
  </Pagina>;
}
