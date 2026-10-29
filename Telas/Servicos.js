import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, database } from '../firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

const CONFIG = {
  terreno: {
    titulo: 'Terreno + Construção',
    descricao:
      'Conte o que procura. Nossa equipe vai analisar seu projeto e entrar em contato.',
    campos: [
      {
        id: 'situacao',
        label: 'Você já tem terreno?',
        opcoes: ['Já tenho terreno', 'Ainda procuro um terreno'],
      },
      { id: 'cidade', label: 'Cidade de interesse' },
      { id: 'endereco', label: 'Bairro ou endereço', opcional: true },
      {
        id: 'area',
        label: 'Área que deseja construir (m²)',
        numero: true,
        opcional: true,
      },
      {
        id: 'orcamento',
        label: 'Orçamento aproximado (R$)',
        numero: true,
        opcional: true,
      },
      {
        id: 'observacoes',
        label: 'Conte mais sobre seu projeto',
        longo: true,
        opcional: true,
      },
    ],
  },

  avaliacao: {
    titulo: 'Avaliação de imóveis',
    descricao:
      'Solicite uma avaliação para venda, locação ou uma estimativa de construção.',
    campos: [
      {
        id: 'tipoImovel',
        label: 'Tipo de imóvel',
        opcoes: ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Outro'],
      },
      {
        id: 'finalidade',
        label: 'Objetivo da avaliação',
        opcoes: ['Venda', 'Locação', 'Construção'],
      },
      { id: 'cidade', label: 'Cidade' },
      { id: 'endereco', label: 'Endereço e bairro' },
      {
        id: 'area',
        label: 'Área aproximada (m²)',
        numero: true,
        opcional: true,
      },
      {
        id: 'observacoes',
        label: 'Características do imóvel ou projeto',
        longo: true,
        opcional: true,
      },
    ],
  },

  visita: {
    titulo: 'Agende uma visita',
    descricao:
      'Escolha o imóvel e sugira uma data. Aguarde a confirmação da equipe antes de comparecer.',
    campos: [
      {
        id: 'data',
        label: 'Data desejada',
        placeholder: 'DD/MM/AAAA',
        limite: 10,
      },
      {
        id: 'horario',
        label: 'Horário desejado',
        opcoes: [
          '09:00', '10:00', '11:00',
          '14:00', '15:00', '16:00', '17:00',
        ],
      },
      {
        id: 'observacoes',
        label: 'Observações',
        longo: true,
        opcional: true,
      },
    ],
  },

  atendimento: {
    titulo: 'Fale com um corretor',
    descricao:
      'Envie sua dúvida ou interesse. Um profissional da equipe dará continuidade ao atendimento.',
    campos: [
      {
        id: 'assunto',
        label: 'Sobre o que deseja conversar?',
        opcoes: ['Comprar', 'Alugar', 'Vender', 'Construir', 'Outras dúvidas'],
      },
      {
        id: 'preferencia',
        label: 'Como prefere receber o contato?',
        opcoes: ['WhatsApp', 'Telefone', 'E-mail'],
      },
      { id: 'mensagem', label: 'Mensagem', longo: true },
    ],
  },
};

const STATUS = {
  pendente: 'Pendente',
  em_atendimento: 'Em atendimento',
  confirmado: 'Visita confirmada',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

function numeroBr(texto) {
  if (/^\d+(?:[.,]\d{1,2})?$/.test(texto)) {
    return Number(texto.replace(',', '.'));
  }

  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto)) {
    return Number(texto.replace(/\./g, '').replace(',', '.'));
  }

  return NaN;
}

function validar(tipo, contato, dados, imovel, agora = new Date()) {
  if (contato.nome.trim().length < 2) {
    return 'Informe seu nome.';
  }

  const telefone = contato.telefone.replace(/\D/g, '');

  if (!/^(?:\d{10,11}|55\d{10,11})$/.test(telefone)) {
    return 'Informe um telefone válido com DDD.';
  }

  for (const campo of CONFIG[tipo].campos) {
    const valor = (dados[campo.id] || '').trim();

    if (!campo.opcional && !valor) {
      return `Preencha: ${campo.label}.`;
    }

    if (valor && campo.opcoes && !campo.opcoes.includes(valor)) {
      return `Selecione: ${campo.label}.`;
    }

    if (
      valor &&
      campo.numero &&
      (!Number.isFinite(numeroBr(valor)) || numeroBr(valor) <= 0)
    ) {
      return `Informe um valor válido em: ${campo.label}.`;
    }
  }

  if (tipo === 'visita') {
    if (!imovel) {
      return 'Escolha um imóvel publicado.';
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dados.data)) {
      return 'Use uma data no formato DD/MM/AAAA.';
    }

    const [dia, mes, ano] = dados.data.split('/').map(Number);
    const [hora, minuto] = dados.horario.split(':').map(Number);
    const data = new Date(ano, mes - 1, dia, hora, minuto);

    if (
      data.getFullYear() !== ano ||
      data.getMonth() !== mes - 1 ||
      data.getDate() !== dia
    ) {
      return 'Informe uma data existente.';
    }

    if (data <= agora) {
      return 'Escolha uma data e um horário futuros.';
    }
  }

  return '';
}

function mensagemErro(erro) {
  return String(erro?.code).includes('permission-denied')
    ? 'Você não tem permissão para acessar este serviço. Tente entrar novamente na sua conta.'
    : 'Não foi possível concluir. Verifique sua conexão e tente novamente.';
}

function useSessao() {
  const { isGuest } = useContext(AuthContext);
  const [sessao, setSessao] = useState({ carregando: true });

  useEffect(() => {
    let ativo = true;
    let versao = 0;

    const sair = onAuthStateChanged(auth, async (usuario) => {
      const atual = ++versao;

      if (!usuario || isGuest) {
        setSessao({ carregando: false, usuario: null });
        return;
      }

      setSessao({ carregando: true });

      try {
        const perfil = await getDoc(
          doc(database, 'usuarios', usuario.uid)
        );

        if (ativo && atual === versao) {
          setSessao({
            carregando: false,
            usuario,
            perfil: perfil.data() || {},
          });
        }
      } catch (erro) {
        if (ativo && atual === versao) {
          setSessao({
            carregando: false,
            erro: mensagemErro(erro),
          });
        }
      }
    });

    return () => {
      ativo = false;
      versao++;
      sair();
    };
  }, [isGuest]);

  return sessao;
}

function Botao({
  texto,
  onPress,
  desativado = false,
  secundario = false,
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: desativado }}
      activeOpacity={0.85}
      disabled={desativado}
      onPress={onPress}
      style={[
        s.botao,
        secundario && s.botaoSecundario,
        desativado && s.desativado,
      ]}
    >
      <Text style={secundario ? s.textoSecundario : s.textoBotao}>
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

function Campo({ campo, valor, alterar, desativado }) {
  return (
    <View style={s.grupo}>
      <Text style={s.label}>
        {campo.label}
        {campo.opcional ? ' (opcional)' : ' *'}
      </Text>

      {campo.opcoes ? (
        <View style={s.opcoes}>
          {campo.opcoes.map((opcao) => (
            <TouchableOpacity
              key={opcao}
              accessibilityRole="button"
              accessibilityState={{
                selected: valor === opcao,
                disabled: desativado,
              }}
              disabled={desativado}
              activeOpacity={0.85}
              onPress={() => alterar(opcao)}
              style={[
                s.opcao,
                valor === opcao && s.opcaoSelecionada,
              ]}
            >
              <Text
                style={[
                  s.textoOpcao,
                  valor === opcao && s.textoOpcaoAtiva,
                ]}
              >
                {STATUS[opcao] || opcao}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TextInput
          accessibilityLabel={campo.label}
          value={valor}
          onChangeText={alterar}
          editable={!desativado}
          placeholder={campo.placeholder || campo.label}
          placeholderTextColor="#888"
          multiline={!!campo.longo}
          maxLength={
            campo.limite ||
            (campo.longo ? 1500 : campo.numero ? 20 : 160)
          }
          keyboardType={
            campo.numero
              ? 'decimal-pad'
              : campo.teclado || 'default'
          }
          style={[s.input, campo.longo && s.areaTexto]}
        />
      )}
    </View>
  );
}

function Pagina({ navigation, titulo, descricao, children }) {
  return (
    <ImageBackground
      source={require('../Imagens/fundo-imoveis.png')}
      style={s.fundo}
    >
      <View style={s.sombra} />

      <SafeAreaView style={s.fundo}>
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

          <View style={s.logoContainer}>
            <Text style={s.logo}>
              A2 <Text style={s.logoBranco}>IMÓVEIS</Text>
            </Text>

            <Text style={s.slogan}>
              REALIZANDO SONHOS
            </Text>
          </View>

          <View style={s.espacoTopo} />
        </View>

        <KeyboardAvoidingView
          style={s.fundo}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.conteudo}
          >
            <Text style={s.titulo}>{titulo}</Text>

            {!!descricao && (
              <Text style={s.descricao}>{descricao}</Text>
            )}

            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

function Formulario({ tipo, usuario, perfil, imovelInicial }) {
  const config = CONFIG[tipo];

  const [contato, setContato] = useState({
    nome: String(perfil.nome || usuario.displayName || ''),
    telefone: String(perfil.telefone || ''),
  });

  const [dados, setDados] = useState({});
  const [imoveis, setImoveis] = useState([]);
  const [imovelId, setImovelId] = useState(imovelInicial || '');
  const [busca, setBusca] = useState('');

  const [carregandoImoveis, setCarregandoImoveis] = useState(
    tipo === 'visita'
  );

  const [erroImoveis, setErroImoveis] = useState('');
  const [historico, setHistorico] = useState([]);
  const [erroHistorico, setErroHistorico] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const trava = useRef(false);

  useEffect(() => {
    const consulta = query(
      collection(database, 'solicitacoesServicos'),
      where('usuarioId', '==', usuario.uid)
    );

    return onSnapshot(
      consulta,
      (snapshot) => {
        setErroHistorico('');

        setHistorico(
          snapshot.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .filter((p) => p.tipo === tipo)
            .sort(
              (a, b) =>
                (b.criadoEm?.toMillis?.() || 0) -
                (a.criadoEm?.toMillis?.() || 0)
            )
        );
      },
      (e) => setErroHistorico(mensagemErro(e))
    );
  }, [tipo, usuario.uid]);

  useEffect(() => {
    if (tipo !== 'visita') return;

    const consulta = query(
      collection(database, 'imoveis'),
      where('publicado', '==', true)
    );

    return onSnapshot(
      consulta,
      (snapshot) => {
        setImoveis(
          snapshot.docs.map((d) => ({
            ...d.data(),
            id: d.id,
          }))
        );

        setErroImoveis('');
        setCarregandoImoveis(false);
      },
      (e) => {
        setErroImoveis(mensagemErro(e));
        setCarregandoImoveis(false);
      }
    );
  }, [tipo]);

  const imovel = imoveis.find((item) => item.id === imovelId);

  const encontrados = imoveis.filter((item) =>
    `${item.titulo || ''} ${item.cidade || ''} ${item.bairro || ''}`
      .toLowerCase()
      .includes(busca.toLowerCase().trim())
  );

  const bloqueado = enviando || enviado;

  async function enviar() {
    if (trava.current || enviado) return;

    if (auth.currentUser?.uid !== usuario.uid) {
      setErro('Faça login novamente para enviar.');
      return;
    }

    const dadosLimpos = Object.fromEntries(
      config.campos.map((c) => [
        c.id,
        (dados[c.id] || '').trim(),
      ])
    );

    const problema = validar(
      tipo,
      contato,
      dadosLimpos,
      imovel
    );

    if (problema) {
      setErro(problema);
      return;
    }

    trava.current = true;
    setEnviando(true);
    setErro('');

    try {
      await addDoc(
        collection(database, 'solicitacoesServicos'),
        {
          usuarioId: usuario.uid,
          nome: contato.nome.trim(),
          email: usuario.email || '',
          telefone: contato.telefone.trim(),
          tipo,
          dados: dadosLimpos,
          imovelId: imovel?.id || '',
          imovelTitulo: imovel
            ? String(imovel.titulo || 'Imóvel sem título')
            : '',
          status: 'pendente',
          resposta: '',
          atualizadoPor: '',
          criadoEm: serverTimestamp(),
          atualizadoEm: serverTimestamp(),
        }
      );

      setEnviado(true);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      trava.current = false;
      setEnviando(false);
    }
  }

  return (
    <>
      <View style={s.card}>
        <Text style={s.subtitulo}>Seus dados de contato</Text>

        <Campo
          campo={{ label: 'Nome', limite: 100 }}
          valor={contato.nome}
          desativado={bloqueado}
          alterar={(nome) =>
            setContato((atual) => ({ ...atual, nome }))
          }
        />

        <Campo
          campo={{
            label: 'Telefone com DDD',
            teclado: 'phone-pad',
            limite: 20,
          }}
          valor={contato.telefone}
          desativado={bloqueado}
          alterar={(telefone) =>
            setContato((atual) => ({ ...atual, telefone }))
          }
        />

        <Text style={s.descricao}>
          E-mail: {usuario.email || 'Não informado'}
        </Text>

        <Text style={s.subtitulo}>Detalhes da solicitação</Text>

        {tipo === 'visita' && (
          <View style={s.grupo}>
            <Text style={s.label}>Imóvel *</Text>

            {carregandoImoveis && (
              <ActivityIndicator color="#C9A86A" />
            )}

            {!!erroImoveis && (
              <Text style={s.erro}>{erroImoveis}</Text>
            )}

            {!carregandoImoveis && !erroImoveis && (
              <>
                <TextInput
                  style={s.input}
                  value={busca}
                  onChangeText={setBusca}
                  editable={!bloqueado}
                  placeholder="Buscar imóvel, cidade ou bairro"
                  accessibilityLabel="Buscar imóvel"
                  placeholderTextColor="#888"
                />

                {!!imovel && (
                  <Text style={s.sucesso}>
                    Selecionado: {imovel.titulo || 'Imóvel sem título'}
                  </Text>
                )}

                {!!imovelId && !imovel && (
                  <Text style={s.erro}>
                    O imóvel selecionado não está disponível.
                    Escolha outro.
                  </Text>
                )}

                {encontrados.slice(0, 10).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    disabled={bloqueado}
                    onPress={() => setImovelId(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: imovelId === item.id,
                    }}
                    style={[
                      s.itemImovel,
                      imovelId === item.id && s.selecionado,
                    ]}
                  >
                    <Text style={s.texto}>
                      {item.titulo || 'Imóvel sem título'}
                    </Text>

                    <Text style={s.descricao}>
                      {[item.bairro, item.cidade]
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </TouchableOpacity>
                ))}

                {!encontrados.length && (
                  <Text style={s.descricao}>
                    Nenhum imóvel encontrado.
                  </Text>
                )}

                {encontrados.length > 10 && (
                  <Text style={s.descricao}>
                    Mostrando 10 resultados. Use a busca
                    para encontrar outros.
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {config.campos.map((campo) => (
          <Campo
            key={campo.id}
            campo={campo}
            valor={dados[campo.id] || ''}
            desativado={bloqueado}
            alterar={(valor) =>
              setDados((atual) => ({
                ...atual,
                [campo.id]: valor,
              }))
            }
          />
        ))}

        {!!erro && <Text style={s.erro}>{erro}</Text>}

        {enviado ? (
          <>
            <Text style={s.sucesso}>
              Solicitação enviada! Acompanhe o retorno abaixo.
            </Text>

            <Botao
              texto="Nova solicitação"
              secundario
              onPress={() => {
                setDados({});
                setEnviado(false);
                setErro('');
              }}
            />
          </>
        ) : (
          <Botao
            texto={enviando ? 'Enviando...' : 'Enviar solicitação'}
            onPress={enviar}
            desativado={
              enviando ||
              (
                tipo === 'visita' &&
                (carregandoImoveis || !!erroImoveis)
              )
            }
          />
        )}
      </View>

      <Text style={s.subtitulo}>
        Meus pedidos deste serviço
      </Text>

      {!!erroHistorico && (
        <Text style={s.erro}>{erroHistorico}</Text>
      )}

      {!erroHistorico && !historico.length && (
        <Text style={s.descricao}>
          Você ainda não tem solicitações neste serviço.
        </Text>
      )}

      {historico.map((pedido) => (
        <View key={pedido.id} style={s.card}>
          <Text style={s.label}>
            {STATUS[pedido.status] || pedido.status}
          </Text>

          {!!pedido.imovelTitulo && (
            <Text style={s.texto}>{pedido.imovelTitulo}</Text>
          )}

          {pedido.tipo === 'visita' && (
            <Text style={s.texto}>
              {pedido.dados?.data} às {pedido.dados?.horario}
            </Text>
          )}

          <Text style={s.descricao}>
            {pedido.resposta || 'Aguardando retorno da equipe.'}
          </Text>
        </View>
      ))}
    </>
  );
}

function TelaServico({ tipo, route, navigation }) {
  const sessao = useSessao();

  return (
    <Pagina
      navigation={navigation}
      titulo={CONFIG[tipo].titulo}
      descricao={CONFIG[tipo].descricao}
    >
      {sessao.carregando ? (
        <ActivityIndicator color="#C9A86A" />
      ) : sessao.erro ? (
        <Text style={s.erro}>{sessao.erro}</Text>
      ) : !sessao.usuario ? (
        <View style={s.card}>
          <Text style={s.descricao}>
            Entre na sua conta para enviar e acompanhar
            suas solicitações.
          </Text>

          <Botao
            texto="Entrar na conta"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      ) : (
        <Formulario
          key={`${sessao.usuario.uid}-${tipo}-${route?.params?.imovel?.id || ''}`}
          tipo={tipo}
          usuario={sessao.usuario}
          perfil={sessao.perfil}
          imovelInicial={route?.params?.imovel?.id}
        />
      )}
    </Pagina>
  );
}

export function TerrenoConstrucao(props) {
  return <TelaServico {...props} tipo="terreno" />;
}

export function AvaliacaoImovel(props) {
  return <TelaServico {...props} tipo="avaliacao" />;
}

export function AgendarVisita(props) {
  return <TelaServico {...props} tipo="visita" />;
}

export function Atendimento(props) {
  return <TelaServico {...props} tipo="atendimento" />;
}

function PedidoAdmin({ pedido, usuarioId }) {
  const [status, setStatus] = useState(pedido.status);
  const [resposta, setResposta] = useState(pedido.resposta || '');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const trava = useRef(false);

  useEffect(() => {
    setStatus(pedido.status);
    setResposta(pedido.resposta || '');
  }, [pedido.status, pedido.resposta]);

  const config = CONFIG[pedido.tipo];

  const estados = [
    'pendente',
    pedido.tipo === 'visita' ? 'confirmado' : 'em_atendimento',
    'concluido',
    'cancelado',
  ];

  async function salvar() {
    if (trava.current) return;

    if (auth.currentUser?.uid !== usuarioId) {
      setMensagem('Faça login novamente.');
      return;
    }

    trava.current = true;
    setSalvando(true);
    setMensagem('');

    try {
      await updateDoc(
        doc(database, 'solicitacoesServicos', pedido.id),
        {
          status,
          resposta: resposta.trim(),
          atualizadoEm: serverTimestamp(),
          atualizadoPor: usuarioId,
        }
      );

      setMensagem('Alterações salvas.');
    } catch (e) {
      setMensagem(mensagemErro(e));
    } finally {
      trava.current = false;
      setSalvando(false);
    }
  }

  return (
    <View style={s.card}>
      <Text style={s.subtitulo}>
        {pedido.nome || 'Cliente'}
      </Text>

      <Text style={s.label}>
        {STATUS[pedido.status] || pedido.status}
      </Text>

      <Text selectable style={s.descricao}>
        {pedido.telefone} • {pedido.email}
      </Text>

      {!!pedido.imovelTitulo && (
        <Text style={s.label}>
          Imóvel: {pedido.imovelTitulo}
        </Text>
      )}

      {config?.campos.map(
        (campo) =>
          !!pedido.dados?.[campo.id] && (
            <Text key={campo.id} style={s.descricao}>
              {campo.label}: {String(pedido.dados[campo.id])}
            </Text>
          )
      )}

      <Campo
        campo={{ label: 'Situação', opcoes: estados }}
        valor={status}
        desativado={salvando}
        alterar={setStatus}
      />

      <Campo
        campo={{
          label: 'Retorno para o cliente',
          longo: true,
          opcional: true,
        }}
        valor={resposta}
        alterar={setResposta}
        desativado={salvando}
      />

      {!!mensagem && (
        <Text style={s.label}>{mensagem}</Text>
      )}

      <Botao
        texto={salvando ? 'Salvando...' : 'Salvar atendimento'}
        onPress={salvar}
        desativado={salvando}
      />
    </View>
  );
}

function ListaAdmin({ usuarioId, tipo }) {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    setCarregando(true);
    setErro('');

    const consulta = query(
      collection(database, 'solicitacoesServicos'),
      where('tipo', '==', tipo)
    );

    return onSnapshot(
      consulta,
      (snapshot) => {
        setPedidos(
          snapshot.docs
            .map((d) => ({ ...d.data(), id: d.id }))
            .sort(
              (a, b) =>
                (b.criadoEm?.toMillis?.() || 0) -
                (a.criadoEm?.toMillis?.() || 0)
            )
        );

        setCarregando(false);
        setErro('');
      },
      (e) => {
        setErro(mensagemErro(e));
        setCarregando(false);
      }
    );
  }, [tipo]);

  const estados = [
    'todos',
    'pendente',
    tipo === 'visita' ? 'confirmado' : 'em_atendimento',
    'concluido',
    'cancelado',
  ];

  const filtrados = pedidos.filter(
    (p) => filtro === 'todos' || p.status === filtro
  );

  return (
    <>
      <View style={s.opcoes}>
        {estados.map((estado) => (
          <TouchableOpacity
            key={estado}
            onPress={() => setFiltro(estado)}
            accessibilityRole="button"
            accessibilityState={{
              selected: filtro === estado,
            }}
            activeOpacity={0.85}
            style={[
              s.opcao,
              filtro === estado && s.opcaoSelecionada,
            ]}
          >
            <Text
              style={[
                s.textoOpcao,
                filtro === estado && s.textoOpcaoAtiva,
              ]}
            >
              {estado === 'todos' ? 'Todas' : STATUS[estado]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {carregando && (
        <ActivityIndicator color="#C9A86A" />
      )}

      {!!erro && <Text style={s.erro}>{erro}</Text>}

      {!carregando && !erro && !!filtrados.length && (
        <Text style={s.descricao}>
          Solicitações encontradas: {filtrados.length}
        </Text>
      )}

      {!carregando && !erro && !filtrados.length && (
        <Text style={s.descricao}>
          Nenhuma solicitação encontrada.
        </Text>
      )}

      {filtrados.map((pedido) => (
        <PedidoAdmin
          key={pedido.id}
          pedido={pedido}
          usuarioId={usuarioId}
        />
      ))}
    </>
  );
}

export function SolicitacoesServicos({ navigation, route }) {
  const sessao = useSessao();
  const tipo = route?.params?.tipo;
  const valido = Object.keys(CONFIG).includes(tipo);

  const titulos = {
    terreno: 'Terreno + Construção',
    avaliacao: 'Avaliação de imóveis',
    visita: 'Agenda de visitas',
    atendimento: 'Fale com um corretor',
  };

  const autorizado = ['admin', 'dono'].includes(
    sessao.perfil?.tipo
  );

  return (
    <Pagina
      navigation={navigation}
      titulo={valido ? titulos[tipo] : 'Solicitações'}
      descricao={
        tipo === 'visita'
          ? 'Confira os pedidos de visita, confirme os horários e envie um retorno ao cliente.'
          : 'Confira os pedidos deste serviço e envie um retorno aos clientes.'
      }
    >
      {!valido ? (
        <Text style={s.erro}>
          Serviço não encontrado.
          Volte ao menu e escolha uma opção.
        </Text>
      ) : sessao.carregando ? (
        <ActivityIndicator color="#C9A86A" />
      ) : sessao.erro ? (
        <Text style={s.erro}>{sessao.erro}</Text>
      ) : !autorizado ? (
        <Text style={s.erro}>
          Acesso reservado ao administrador e ao dono.
        </Text>
      ) : (
        <ListaAdmin
          key={`${sessao.usuario.uid}-${tipo}`}
          usuarioId={sessao.usuario.uid}
          tipo={tipo}
        />
      )}
    </Pagina>
  );
}

const s = StyleSheet.create({
  fundo: {
    flex: 1,
  },
  sombra: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
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
  logoContainer: {
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
  conteudo: {
    paddingHorizontal: 22,
    paddingBottom: 50,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  titulo: {
    color: '#fff',
    fontSize: 29,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitulo: {
    color: '#C9A86A',
    fontSize: 19,
    fontWeight: '700',
    marginVertical: 14,
  },
  descricao: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 21,
    marginVertical: 6,
  },
  texto: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 18,
    padding: 18,
    marginVertical: 12,
  },
  grupo: {
    marginVertical: 9,
  },
  label: {
    color: '#C9A86A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 13,
    padding: 13,
    color: '#fff',
    fontSize: 14,
  },
  areaTexto: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  opcao: {
    backgroundColor: 'rgba(24,24,24,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  opcaoSelecionada: {
    backgroundColor: '#C9A86A',
    borderColor: '#C9A86A',
  },
  textoOpcao: {
    color: '#C9A86A',
    fontSize: 12,
    fontWeight: '700',
  },
  textoOpcaoAtiva: {
    color: '#111',
  },
  selecionado: {
    borderColor: '#C9A86A',
    backgroundColor: 'rgba(201,168,106,0.12)',
  },
  itemImovel: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
    borderRadius: 13,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#161616',
  },
  botao: {
    minHeight: 53,
    backgroundColor: '#C9A86A',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  textoBotao: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  botaoSecundario: {
    backgroundColor: 'rgba(24,24,24,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,106,0.18)',
  },
  textoSecundario: {
    color: '#C9A86A',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  desativado: {
    opacity: 0.7,
  },
  erro: {
    color: '#FFB4B4',
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 10,
  },
  sucesso: {
    color: '#ADE7BE',
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 10,
  },
});