import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';

import { auth, database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

const TIPOS = {
  cliente: {
    nome: 'Cliente',
    plural: 'Clientes',
  },
  proprietario: {
    nome: 'Proprietário',
    plural: 'Proprietários',
  },
  corretor: {
    nome: 'Corretor',
    plural: 'Corretores',
  },
  admin: {
    nome: 'Administrador',
    plural: 'Administradores',
  },
  dono: {
    nome: 'Dono',
    plural: 'Dono',
  },
  outro: {
    nome: 'Outro',
    plural: 'Outros',
  },
};

function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function tipoUsuario(usuario) {
  const tipo = normalizar(
    usuario.tipo ||
    usuario.role ||
    usuario.perfil ||
    'cliente'
  );

  if (tipo === 'administrador') {
    return 'admin';
  }

  return Object.prototype.hasOwnProperty.call(TIPOS, tipo)
    ? tipo
    : 'outro';
}

function iniciais(nome) {
  const partes = String(nome || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!partes.length) {
    return '?';
  }

  return (
    partes[0].charAt(0) +
    (
      partes.length > 1
        ? partes[partes.length - 1].charAt(0)
        : ''
    )
  ).toUpperCase();
}

function filtrarUsuarios(usuarios, busca, filtro, ordem) {
  const texto = normalizar(busca);
  const termos = texto.split(/\s+/).filter(Boolean);

  const somenteTelefone = /^[\d\s()+.\-]+$/.test(
    String(busca).trim()
  );

  const digitos = String(busca).replace(/\D/g, '');

  const telefoneBusca = /^55\d{10,11}$/.test(digitos)
    ? digitos.slice(2)
    : digitos;

  return usuarios
    .filter((usuario) => {
      if (
        filtro !== 'todos' &&
        tipoUsuario(usuario) !== filtro
      ) {
        return false;
      }

      const conteudo = normalizar(
        `${usuario.nome || ''} ` +
        `${usuario.email || ''} ` +
        `${usuario.telefone || ''}`
      );

      const correspondeTexto = termos.every(
        (termo) => conteudo.includes(termo)
      );

      const correspondeTelefone =
        somenteTelefone &&
        telefoneBusca.length > 0 &&
        String(usuario.telefone || '')
          .replace(/\D/g, '')
          .includes(telefoneBusca);

      return correspondeTexto || correspondeTelefone;
    })
    .sort((a, b) => {
      const comparacao = normalizar(a.nome).localeCompare(
        normalizar(b.nome),
        'pt-BR'
      );

      return ordem === 'za'
        ? -comparacao
        : comparacao;
    });
}

function textoErro(erro) {
  return String(erro?.code).includes('permission-denied')
    ? 'Sua conta não tem permissão para consultar os usuários.'
    : 'Não foi possível carregar a lista. Verifique sua conexão e tente novamente.';
}

function Estado({
  titulo,
  texto,
  carregando = false,
  acao,
  onPress,
}) {
  return (
    <View style={s.estado}>
      {carregando && (
        <ActivityIndicator
          size="large"
          color="#C9A86A"
        />
      )}

      <Text style={s.tituloEstado}>
        {titulo}
      </Text>

      {!!texto && (
        <Text style={s.textoEstado}>
          {texto}
        </Text>
      )}

      {!!acao && (
        <TouchableOpacity
          style={s.botaoPrincipal}
          activeOpacity={0.85}
          accessibilityRole="button"
          onPress={onPress}
        >
          <Text style={s.textoBotao}>
            {acao}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CadastroAdm({ navigation }) {
  const { isGuest } = useContext(AuthContext);

  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [ordem, setOrdem] = useState('az');

  const [carregando, setCarregando] = useState(true);
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    let versao = 0;
    let pararLista = () => {};

    const pararAuth = onAuthStateChanged(
      auth,
      async (usuario) => {
        const atual = ++versao;

        pararLista();
        pararLista = () => {};

        setUsuarios([]);
        setErro('');
        setAutorizado(false);
        setUsuarioAtual(usuario);

        if (!usuario || isGuest) {
          setVerificando(false);
          setCarregando(false);
          return;
        }

        setVerificando(true);
        setCarregando(true);

        try {
          const perfil = await getDoc(
            doc(database, 'usuarios', usuario.uid)
          );

          if (!ativo || atual !== versao) {
            return;
          }

          const permitido = ['admin', 'dono'].includes(
            perfil.data()?.tipo
          );

          setAutorizado(permitido);
          setVerificando(false);

          if (!permitido) {
            setCarregando(false);
            return;
          }

          pararLista = onSnapshot(
            collection(database, 'usuarios'),

            (snapshot) => {
              if (!ativo || atual !== versao) {
                return;
              }

              setUsuarios(
                snapshot.docs.map((documento) => ({
                  ...documento.data(),
                  id: documento.id,
                }))
              );

              setErro('');
              setCarregando(false);
            },

            (falha) => {
              if (!ativo || atual !== versao) {
                return;
              }

              setUsuarios([]);
              setErro(textoErro(falha));
              setCarregando(false);
            }
          );
        } catch (falha) {
          if (!ativo || atual !== versao) {
            return;
          }

          setErro(textoErro(falha));
          setVerificando(false);
          setCarregando(false);
        }
      }
    );

    return () => {
      ativo = false;
      versao++;
      pararLista();
      pararAuth();
    };
  }, [isGuest, tentativa]);

  const contagem = useMemo(() => {
    const resultado = {
      todos: usuarios.length,
    };

    Object.keys(TIPOS).forEach((tipo) => {
      resultado[tipo] = 0;
    });

    usuarios.forEach((usuario) => {
      resultado[tipoUsuario(usuario)]++;
    });

    return resultado;
  }, [usuarios]);

  const resultados = useMemo(
    () => filtrarUsuarios(usuarios, busca, filtro, ordem),
    [usuarios, busca, filtro, ordem]
  );

  const filtros = [
    'todos',
    'cliente',
    'proprietario',
    'corretor',
    'admin',
    'dono',
  ];

  if (contagem.outro > 0) {
    filtros.push('outro');
  }

  function limparFiltros() {
    setBusca('');
    setFiltro('todos');
    Keyboard.dismiss();
  }

  function abrirUsuario(usuario) {
    Keyboard.dismiss();

    navigation.navigate('DetalhesUsuario', {
      usuarioId: usuario.id,
      dados: usuario,
    });
  }

  const cabecalho = (
    <View>
      <Text style={s.sobretitulo}>
        GESTÃO DE USUÁRIOS
      </Text>

      <Text style={s.titulo}>
        Consultar usuários
      </Text>

      <Text style={s.descricao}>
        Encontre cadastros e abra os detalhes para
        gerenciar cada usuário.
      </Text>

      <View style={s.resumo}>
        {[
          ['todos', 'Total'],
          ['cliente', 'Clientes'],
          ['proprietario', 'Proprietários'],
        ].map(([tipo, nome]) => (
          <View key={tipo} style={s.cardResumo}>
            <Text style={s.numeroResumo}>
              {carregando || erro ? '—' : contagem[tipo]}
            </Text>

            <Text style={s.labelResumo}>
              {nome}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.cardBusca}>
        <Text style={s.label}>
          BUSCAR USUÁRIO
        </Text>

        <View style={s.linhaBusca}>
          <Text style={s.iconeBusca}>⌕</Text>

          <TextInput
            style={s.input}
            value={busca}
            onChangeText={setBusca}
            accessibilityLabel="Buscar por nome, e-mail ou telefone"
            placeholder="Nome, e-mail ou telefone"
            placeholderTextColor="#777"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />

          {!!busca && (
            <TouchableOpacity
              style={s.limparBusca}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              onPress={() => setBusca('')}
            >
              <Text style={s.iconeLimpar}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={s.dica}>
          Os resultados mudam enquanto você digita.
        </Text>

        <Text style={[s.label, s.labelFiltro]}>
          TIPO DE USUÁRIO
        </Text>

        <View style={s.filtros}>
          {filtros.map((tipo) => (
            <TouchableOpacity
              key={tipo}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={
                tipo === 'todos'
                  ? 'Todos'
                  : TIPOS[tipo].plural
              }
              accessibilityState={{
                selected: filtro === tipo,
              }}
              onPress={() => setFiltro(tipo)}
              style={[
                s.filtro,
                filtro === tipo && s.filtroAtivo,
              ]}
            >
              <Text
                style={[
                  s.textoFiltro,
                  filtro === tipo && s.textoFiltroAtivo,
                ]}
              >
                {tipo === 'todos'
                  ? 'Todos'
                  : TIPOS[tipo].plural}
              </Text>

              <Text
                style={[
                  s.numeroFiltro,
                  filtro === tipo && s.textoFiltroAtivo,
                ]}
              >
                {contagem[tipo]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.barraResultados}>
        <View style={s.resumoResultados}>
          <Text style={s.tituloResultados}>
            {filtro === 'todos'
              ? 'Todos os usuários'
              : TIPOS[filtro].plural}
          </Text>

          <Text style={s.descricaoResultados}>
            {carregando
              ? 'Atualizando lista...'
              : erro
                ? 'Consulta indisponível'
                : `${resultados.length} ${
                    resultados.length === 1
                      ? 'cadastro encontrado'
                      : 'cadastros encontrados'
                  }`}
          </Text>
        </View>

        <TouchableOpacity
          style={s.botaoOrdenar}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Inverter ordem alfabética"
          onPress={() =>
            setOrdem((valor) =>
              valor === 'az' ? 'za' : 'az'
            )
          }
        >
          <Text style={s.textoOrdenar}>
            Nome {ordem === 'az' ? 'A–Z' : 'Z–A'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.botaoAtualizar}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Atualizar usuários"
          accessibilityState={{
            disabled: carregando,
          }}
          disabled={carregando}
          onPress={() =>
            setTentativa((valor) => valor + 1)
          }
        >
          <Text style={s.iconeAtualizar}>↻</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const vazio = carregando ? (
    <Estado
      titulo="Carregando usuários..."
      carregando
    />
  ) : erro ? (
    <Estado
      titulo="Não foi possível carregar"
      texto={erro}
      acao="Tentar novamente"
      onPress={() =>
        setTentativa((valor) => valor + 1)
      }
    />
  ) : (
    <Estado
      titulo={
        busca || filtro !== 'todos'
          ? 'Nenhum resultado encontrado'
          : 'Nenhum usuário cadastrado'
      }
      texto={
        busca || filtro !== 'todos'
          ? 'Tente outro termo ou selecione outro tipo de usuário.'
          : 'Os cadastros aparecerão aqui assim que forem criados.'
      }
      acao={
        busca || filtro !== 'todos'
          ? 'Limpar filtros'
          : undefined
      }
      onPress={limparFiltros}
    />
  );

  return (
    <ImageBackground
      source={require('../Imagens/fundo-cadastro.png')}
      style={s.fundo}
    >
      <View style={s.sombra} />

      <SafeAreaView style={s.areaSegura}>
        <View style={s.topo}>
          <TouchableOpacity
            style={s.botaoVoltar}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => navigation.goBack()}
          >
            <Text style={s.setaVoltar}>‹</Text>
          </TouchableOpacity>

          <View style={s.marca}>
            <Text style={s.logo}>
              A2 <Text style={s.logoBranco}>IMÓVEIS</Text>
            </Text>

            <Text style={s.slogan}>
              REALIZANDO SONHOS
            </Text>
          </View>

          <View style={s.espacoTopo} />
        </View>

        {verificando ? (
          <View style={s.areaCentral}>
            <Estado
              titulo="Verificando acesso..."
              carregando
            />
          </View>
        ) : !autorizado ? (
          <View style={s.conteudo}>
            <Estado
              titulo={
                erro
                  ? 'Não foi possível abrir a consulta'
                  : 'Acesso restrito'
              }
              texto={
                erro ||
                'A consulta de usuários é exclusiva do administrador e do dono.'
              }
              acao={
                erro ? 'Tentar novamente' : undefined
              }
              onPress={() =>
                setTentativa((valor) => valor + 1)
              }
            />
          </View>
        ) : (
          <FlatList
            style={s.lista}
            data={resultados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.conteudo}
            ListHeaderComponent={cabecalho}
            ListEmptyComponent={vazio}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            windowSize={7}
            renderItem={({ item }) => {
              const tipo = tipoUsuario(item);

              return (
                <TouchableOpacity
                  style={s.cardUsuario}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    `Consultar ${item.nome || 'usuário'}, ` +
                    TIPOS[tipo].nome
                  }
                  onPress={() => abrirUsuario(item)}
                >
                  <View style={s.avatar}>
                    <Text style={s.iniciais}>
                      {iniciais(item.nome)}
                    </Text>
                  </View>

                  <View style={s.dadosUsuario}>
                    <Text
                      style={s.nomeUsuario}
                      numberOfLines={1}
                    >
                      {String(
                        item.nome || 'Nome não informado'
                      )}
                    </Text>

                    <View style={s.linhaTipo}>
                      <View style={s.badge}>
                        <Text style={s.textoBadge}>
                          {TIPOS[tipo].nome}
                        </Text>
                      </View>

                      {item.id === usuarioAtual?.uid && (
                        <Text style={s.suaConta}>
                          Sua conta
                        </Text>
                      )}
                    </View>

                    <Text
                      style={s.email}
                      numberOfLines={1}
                    >
                      {String(
                        item.email || 'E-mail não informado'
                      )}
                    </Text>

                    {!!item.telefone && (
                      <Text style={s.telefone}>
                        {String(item.telefone)}
                      </Text>
                    )}
                  </View>

                  <Text style={s.seta}>›</Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: '#111',
  },
  areaSegura: {
    flex: 1,
  },
  sombra: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 22,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  botaoVoltar: {
    width: 44,
    height: 44,
    borderRadius: 23,
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setaVoltar: {
    color: '#C9A86A',
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },
  marca: {
    alignItems: 'center',
  },
  logo: {
    color: '#C9A86A',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 3,
  },
  logoBranco: {
    color: '#fff',
  },
  slogan: {
    color: '#C9A86A',
    fontSize: 7,
    fontWeight: 'bold',
    letterSpacing: 2.5,
    marginTop: 3,
  },
  espacoTopo: {
    width: 44,
  },
  lista: {
    flex: 1,
  },
  conteudo: {
    paddingHorizontal: 22,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexGrow: 1,
  },
  sobretitulo: {
    color: '#C9A86A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  titulo: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '700',
  },
  descricao: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9,
  },
  resumo: {
    flexDirection: 'row',
    gap: 9,
    marginVertical: 20,
  },
  cardResumo: {
    flex: 1,
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  numeroResumo: {
    color: '#C9A86A',
    fontSize: 25,
    fontWeight: '800',
  },
  labelResumo: {
    color: '#aaa',
    fontSize: 10,
    marginTop: 5,
  },
  cardBusca: {
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    color: '#C9A86A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 9,
  },
  linhaBusca: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    paddingHorizontal: 12,
  },
  iconeBusca: {
    color: '#C9A86A',
    fontSize: 25,
    marginRight: 9,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    color: '#fff',
    fontSize: 13,
    paddingVertical: 10,
  },
  limparBusca: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#292929',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  iconeLimpar: {
    color: '#aaa',
    fontSize: 22,
    lineHeight: 25,
  },
  dica: {
    color: '#888',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 8,
  },
  labelFiltro: {
    marginTop: 18,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filtro: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    backgroundColor: '#181818',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filtroAtivo: {
    backgroundColor: '#C9A86A',
    borderColor: '#C9A86A',
  },
  textoFiltro: {
    color: '#C9A86A',
    fontSize: 11,
    fontWeight: '700',
  },
  numeroFiltro: {
    color: '#C9A86A',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 7,
  },
  textoFiltroAtivo: {
    color: '#111',
  },
  barraResultados: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  resumoResultados: {
    flex: 1,
  },
  tituloResultados: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  descricaoResultados: {
    color: '#999',
    fontSize: 10,
    marginTop: 5,
  },
  botaoOrdenar: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoOrdenar: {
    color: '#C9A86A',
    fontSize: 10,
    fontWeight: '800',
  },
  botaoAtualizar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeAtualizar: {
    color: '#C9A86A',
    fontSize: 24,
  },
  cardUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 17,
    padding: 15,
    marginBottom: 11,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201,168,106,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: {
    color: '#C9A86A',
    fontSize: 17,
    fontWeight: '800',
  },
  dadosUsuario: {
    flex: 1,
    marginLeft: 12,
  },
  nomeUsuario: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  linhaTipo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 7,
  },
  badge: {
    borderRadius: 6,
    backgroundColor: 'rgba(201,168,106,0.10)',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  textoBadge: {
    color: '#C9A86A',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  suaConta: {
    color: '#888',
    fontSize: 9,
  },
  email: {
    color: '#aaa',
    fontSize: 11,
    marginTop: 7,
  },
  telefone: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  seta: {
    color: '#C9A86A',
    fontSize: 30,
    marginLeft: 10,
  },
  areaCentral: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
  },
  estado: {
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  tituloEstado: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  textoEstado: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
  },
  botaoPrincipal: {
    minHeight: 48,
    width: '100%',
    backgroundColor: '#C9A86A',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginTop: 18,
  },
  textoBotao: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});