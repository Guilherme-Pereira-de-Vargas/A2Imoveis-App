import { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  Image,
} from 'react-native';

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

import { getAuth } from 'firebase/auth';

import { database } from '../firebaseConfig';


export default function SolicitacoesAnuncios({ navigation }) {

  const [solicitacoes, setSolicitacoes] = useState([]);

  const [carregando, setCarregando] =
    useState(true);

  const [processando, setProcessando] =
    useState(null);

  const [filtro, setFiltro] =
    useState('pendente');

  const [buscaProprietario, setBuscaProprietario] =
    useState('');


  // =====================================================
  // CARREGAR SOLICITAÇÕES
  // =====================================================

  const carregarSolicitacoes = async () => {

    try {

      setCarregando(true);

      const auth = getAuth();

      const usuario =
        auth.currentUser;

      if (!usuario) {

        Alert.alert(
          'Erro',
          'Você precisa estar logado.'
        );

        return;
      }


      const snapshot =
        await getDocs(
          collection(
            database,
            'solicitacoes_anuncios'
          )
        );


      const lista =
        snapshot.docs.map(
          (documento) => ({
            id: documento.id,
            ...documento.data(),
          })
        );


      lista.sort((a, b) => {

        const dataA =
          a.criadoEm?.toDate?.() ||
          new Date(0);

        const dataB =
          b.criadoEm?.toDate?.() ||
          new Date(0);

        return dataB - dataA;

      });


      setSolicitacoes(lista);


    } catch (erro) {

      console.log(
        'ERRO AO CARREGAR SOLICITAÇÕES:',
        erro
      );

      Alert.alert(
        'Erro',
        'Não foi possível carregar as solicitações.'
      );


    } finally {

      setCarregando(false);

    }

  };


  useEffect(() => {

    carregarSolicitacoes();

  }, []);


  // =====================================================
  // ABRIR ARQUIVO
  // =====================================================

  const abrirArquivo = async (url) => {

    if (!url) {

      Alert.alert(
               'Arquivo não encontrado',
        'Este documento não foi enviado.'
      );

      return;
    }


    try {

      await Linking.openURL(url);

    } catch (erro) {

      console.log(
        'ERRO AO ABRIR ARQUIVO:',
        erro
      );

      Alert.alert(
        'Erro',
        'Não foi possível abrir o arquivo.'
      );

    }

  };


  // =====================================================
  // ABRIR FOTO
  // =====================================================

  const abrirFoto = async (url) => {

    if (!url) {
      return;
    }


    try {

      await Linking.openURL(url);

    } catch (erro) {

      console.log(
        'ERRO AO ABRIR FOTO:',
        erro
      );

      Alert.alert(
        'Erro',
        'Não foi possível abrir a imagem.'
      );

    }

  };


  // =====================================================
  // WHATSAPP
  // =====================================================

  const entrarEmContato = async (solicitacao) => {

    if (!solicitacao.telefone) {

      Alert.alert(
        'Telefone não informado',
        'Esta solicitação não possui telefone cadastrado.'
      );

      return;
    }


    const numero =
      String(
        solicitacao.telefone
      ).replace(
        /\D/g,
        ''
      );


    const url =
      `https://wa.me/55${numero}`;


    try {

      await Linking.openURL(url);

    } catch (erro) {

      Alert.alert(
        'Erro',
        'Não foi possível abrir o WhatsApp.'
      );

    }

  };


  // =====================================================
  // APROVAR - CONFIRMAÇÃO
  // =====================================================

  const aprovarAnuncio = (solicitacao) => {

    Alert.alert(
      'Aprovar anúncio',

      `Deseja aprovar o imóvel "${solicitacao.titulo || 'Imóvel sem título'}"?`,

      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Aprovar',

          onPress: () =>
            confirmarAprovacao(
              solicitacao
            ),
        },
      ]
    );

  };


  // =====================================================
  // APROVAR ANÚNCIO
  // =====================================================

  const confirmarAprovacao = async (
    solicitacao
  ) => {

    try {

      setProcessando(
        solicitacao.id
      );


      // =================================================
      // CRIAR IMÓVEL
      // =================================================

      const referenciaImovel =
        doc(
          database,
          'imoveis',
          solicitacao.id
        );


      await setDoc(
        referenciaImovel,
        {

          titulo:
            solicitacao.titulo || '',

          tipo:
            solicitacao.tipo || '',

          finalidade:
            solicitacao.finalidade || '',

          cidade:
            solicitacao.cidade || '',

          bairro:
            solicitacao.bairro || '',

          endereco:
            solicitacao.endereco || '',

          quartos:
            solicitacao.quartos != null
              ? solicitacao.quartos
              : null,

          banheiros:
            solicitacao.banheiros != null
              ? solicitacao.banheiros
              : null,

          vagas:
            solicitacao.vagas != null
              ? solicitacao.vagas
              : null,

          area:
            solicitacao.area != null
              ? solicitacao.area
              : null,

          preco:
            solicitacao.preco || '',

          descricao:
            solicitacao.descricao || '',


          // PROPRIETÁRIO

          proprietarioId:
            solicitacao.proprietarioId || '',

          proprietarioEmail:
            solicitacao.proprietarioEmail || '',

          proprietarioNome:
            solicitacao.proprietarioNome || '',

          telefone:
            solicitacao.telefone || '',


          // FOTOS

          fotos:
            Array.isArray(
              solicitacao.fotos
            )
              ? solicitacao.fotos
              : [],


          // COMPROVANTE

          comprovanteResidencia:
            solicitacao.comprovanteResidencia || '',


          // STATUS

          publicado:
            true,

          status:
            'aprovado',

          solicitacaoId:
            solicitacao.id,

        }
      );


      // =================================================
      // ATUALIZAR SOLICITAÇÃO
      // =================================================

      await updateDoc(
        doc(
          database,
          'solicitacoes_anuncios',
          solicitacao.id
        ),
        {

          status:
            'aprovado',

          publicado:
            true,

          imovelId:
            solicitacao.id,

        }
      );


      // =================================================
      // ATUALIZAR TELA
      // =================================================

      setSolicitacoes(
        (lista) =>

          lista.map(
            (item) =>

              item.id === solicitacao.id

                ? {
                    ...item,

                    status:
                      'aprovado',

                    publicado:
                      true,

                    imovelId:
                      solicitacao.id,
                  }

                : item
          )
      );


      Alert.alert(
        'Anúncio aprovado! 🏠',
        'O imóvel foi publicado com sucesso.'
      );


    } catch (erro) {

      console.log(
        'ERRO AO APROVAR:',
        erro
      );

      Alert.alert(
        'Erro',
        'Não foi possível aprovar o anúncio.'
      );


    } finally {

      setProcessando(null);

    }

  };


  // =====================================================
  // RECUSAR - CONFIRMAÇÃO
  // =====================================================

  const recusarAnuncio = (
    solicitacao
  ) => {

    Alert.alert(
      'Recusar anúncio',

      `Deseja recusar o imóvel "${solicitacao.titulo || 'Imóvel sem título'}"?`,

      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Recusar',

          style: 'destructive',

          onPress: () =>
            confirmarRecusa(
              solicitacao
            ),
        },
      ]
    );

  };


  // =====================================================
  // RECUSAR
  // =====================================================

  const confirmarRecusa = async (
    solicitacao
  ) => {

    try {

      setProcessando(
        solicitacao.id
      );


      await updateDoc(
        doc(
          database,
          'solicitacoes_anuncios',
          solicitacao.id
        ),
        {

          status:
            'recusado',

          publicado:
            false,

        }
      );


      setSolicitacoes(
        (lista) =>

          lista.map(
            (item) =>

              item.id ===
              solicitacao.id

                ? {
                    ...item,

                    status:
                      'recusado',

                    publicado:
                      false,
                  }

                : item
          )
      );


      Alert.alert(
        'Anúncio recusado',
        'A solicitação foi marcada como recusada.'
      );


    } catch (erro) {

      console.log(
        'ERRO AO RECUSAR:',
        erro
      );

      Alert.alert(
        'Erro',
        'Não foi possível recusar o anúncio.'
      );


    } finally {

      setProcessando(null);

    }

  };


  // =====================================================
  // ALTERAR DECISÃO - CONFIRMAÇÃO
  // =====================================================

  const alterarDecisao = (
    solicitacao
  ) => {

    Alert.alert(
      'Alterar decisão',

      `Deseja voltar a solicitação "${solicitacao.titulo || 'Imóvel sem título'}" para pendente?`,

      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Alterar',

          onPress: () =>
            confirmarAlteracaoDecisao(
              solicitacao
            ),
        },
      ]
    );

  };


  // =====================================================
  // ALTERAR DECISÃO
  // =====================================================

  const confirmarAlteracaoDecisao =
    async (solicitacao) => {

      try {

        setProcessando(
          solicitacao.id
        );


        // Se estava aprovado,
        // remove o imóvel publicado.

        if (
          solicitacao.status ===
            'aprovado' ||
          solicitacao.imovelId
        ) {

          const idImovel =
            solicitacao.imovelId ||
            solicitacao.id;


          await deleteDoc(
            doc(
              database,
              'imoveis',
              idImovel
            )
          );

        }


        // Volta a solicitação
        // para pendente.

        await updateDoc(
          doc(
            database,
            'solicitacoes_anuncios',
            solicitacao.id
          ),
          {

            status:
              'pendente',

            publicado:
              false,

            imovelId:
              '',

          }
        );


        // Atualizar tela

        setSolicitacoes(
          (lista) =>

            lista.map(
              (item) =>

                item.id ===
                solicitacao.id

                  ? {
                      ...item,

                      status:
                        'pendente',

                      publicado:
                        false,

                      imovelId:
                        '',
                    }

                  : item
            )
        );


        Alert.alert(
          'Decisão alterada',
          'A solicitação voltou para pendente e pode ser analisada novamente.'
        );


      } catch (erro) {

        console.log(
          'ERRO AO ALTERAR DECISÃO:',
          erro
        );

        Alert.alert(
          'Erro',
          'Não foi possível alterar a decisão.'
        );


      } finally {

        setProcessando(null);

      }

    };


  // =====================================================
  // EXCLUIR - CONFIRMAÇÃO
  // =====================================================

  const excluirSolicitacao = (
    solicitacao
  ) => {

    Alert.alert(
      'Excluir solicitação',

      `Tem certeza que deseja excluir a solicitação "${solicitacao.titulo || 'Imóvel sem título'}"?\n\nEssa ação não poderá ser desfeita.`,

      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Excluir',

          style: 'destructive',

          onPress: () =>
            confirmarExclusao(
              solicitacao
            ),
        },
      ]
    );

  };


  // =====================================================
  // EXCLUIR SOLICITAÇÃO
  // =====================================================

  const confirmarExclusao = async (
    solicitacao
  ) => {

    try {

      setProcessando(
        solicitacao.id
      );


      // Se a solicitação foi aprovada,
      // exclui também o imóvel.

      if (
        solicitacao.status ===
          'aprovado' ||
        solicitacao.imovelId
      ) {

        const idImovel =
          solicitacao.imovelId ||
          solicitacao.id;


        await deleteDoc(
          doc(
            database,
            'imoveis',
            idImovel
          )
        );

      }


      // Exclui a solicitação

      await deleteDoc(
        doc(
          database,
          'solicitacoes_anuncios',
          solicitacao.id
        )
      );


      // Remove da tela

      setSolicitacoes(
        (lista) =>

          lista.filter(
            (item) =>
              item.id !==
              solicitacao.id
          )
      );


      Alert.alert(
        'Solicitação excluída',
        'A solicitação foi excluída com sucesso.'
      );


    } catch (erro) {

      console.log(
        'ERRO AO EXCLUIR SOLICITAÇÃO:',
        erro
      );

      Alert.alert(
        'Erro',
        'Não foi possível excluir a solicitação.'
      );


    } finally {

      setProcessando(null);

    }

  };


  // =====================================================
  // FORMATAR PREÇO
  // =====================================================

  const formatarPreco = (
    preco
  ) => {

    if (
      preco === undefined ||
      preco === null ||
      preco === ''
    ) {

      return 'Não informado';

    }


    if (
      typeof preco ===
      'number'
    ) {

      return preco.toLocaleString(
        'pt-BR',
        {
          style: 'currency',
          currency: 'BRL',
        }
      );

    }


    return String(preco);

  };


  // =====================================================
  // STATUS
  // =====================================================

  const mostrarStatus = (
    status
  ) => {

    if (
      status ===
      'aprovado'
    ) {

      return 'APROVADO';

    }


    if (
      status ===
      'recusado'
    ) {

      return 'RECUSADO';

    }


    return 'PENDENTE';

  };


  // =====================================================
  // FILTROS
  // =====================================================

  const solicitacoesFiltradas =
    solicitacoes.filter(
      (item) => {

        const statusItem =
          item.status ||
          'pendente';


        const atendeStatus =
          filtro === 'todos' ||
          statusItem === filtro;


        const termoBusca =
          buscaProprietario
            .toLowerCase()
            .trim();


        const nomeProprietario =
          String(
            item.proprietarioNome ||
            ''
          ).toLowerCase();


        const emailProprietario =
          String(
            item.proprietarioEmail ||
            ''
          ).toLowerCase();


        const atendeBusca =
          termoBusca === '' ||
          nomeProprietario.includes(
            termoBusca
          ) ||
          emailProprietario.includes(
            termoBusca
          );


        return (
          atendeStatus &&
          atendeBusca
        );

      }
    );


  // =====================================================
  // CARREGANDO
  // =====================================================

  if (carregando) {

    return (

      <ImageBackground
        source={require(
          '../Imagens/fundo-imoveis.png'
        )}
        style={estilos.fundo}
        resizeMode="cover"
      >

        <View
          style={estilos.sombra}
        />


        <TouchableOpacity
          style={estilos.botaoVoltar}
          onPress={() =>
            navigation.goBack()
          }
        >

          <Text
            style={estilos.iconeVoltar}
          >
            ‹
          </Text>

        </TouchableOpacity>


        <View
          style={estilos.carregando}
        >

          <ActivityIndicator
            size="large"
            color="#C9A86A"
          />

          <Text
            style={estilos.textoCarregando}
          >
            Carregando solicitações...
          </Text>

        </View>

      </ImageBackground>

    );

  }


  // =====================================================
  // TELA
  // =====================================================

  return (

    <ImageBackground
      source={require(
        '../Imagens/fundo-imoveis.png'
      )}
      style={estilos.fundo}
      resizeMode="cover"
    >

      <View
        style={estilos.sombra}
      />


      <TouchableOpacity
        style={estilos.botaoVoltar}
        onPress={() =>
          navigation.goBack()
        }
      >

        <Text
          style={estilos.iconeVoltar}
        >
          ‹
        </Text>

      </TouchableOpacity>


      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={
          estilos.conteudo
        }
        showsVerticalScrollIndicator={
          false
        }
      >


        {/* CABEÇALHO */}

        <View
          style={estilos.cabecalho}
        >

          <Text
            style={estilos.logo}
          >
            A2{' '}

            <Text
              style={estilos.logoBranco}
            >
              IMÓVEIS
            </Text>

          </Text>


          <Text
            style={estilos.titulo}
          >
            Solicitações de anúncios
          </Text>


          <Text
            style={estilos.subtitulo}
          >
            Analise os imóveis enviados pelos
            proprietários antes de publicá-los.
          </Text>

        </View>


        {/* BUSCA */}

        <View
          style={estilos.containerBusca}
        >

          <TextInput
            style={estilos.inputBusca}

            placeholder={
              'Buscar por proprietário ou e-mail...'
            }

            placeholderTextColor="#666"

            value={
              buscaProprietario
            }

            onChangeText={
              setBuscaProprietario
            }
          />


          {buscaProprietario.length >
            0 && (

            <TouchableOpacity
              onPress={() =>
                setBuscaProprietario(
                  ''
                )
              }

              style={
                estilos.botaoLimparBusca
              }
            >

              <Text
                style={
                  estilos.textoLimparBusca
                }
              >
                ✕
              </Text>

            </TouchableOpacity>

          )}

        </View>


        {/* FILTROS */}

        <View
          style={
            estilos.containerFiltros
          }
        >

          <TouchableOpacity
            style={[
              estilos.botaoFiltro,

              filtro ===
                'pendente' &&
                estilos.filtroAtivo,
            ]}

            onPress={() =>
              setFiltro(
                'pendente'
              )
            }
          >

            <Text
              style={[
                estilos.textoFiltro,

                filtro ===
                  'pendente' &&
                  estilos.textoFiltroAtivo,
              ]}
            >
              Pendentes
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              estilos.botaoFiltro,

              filtro ===
                'aprovado' &&
                estilos.filtroAtivo,
            ]}

            onPress={() =>
              setFiltro(
                'aprovado'
              )
            }
          >

            <Text
              style={[
                estilos.textoFiltro,

                filtro ===
                  'aprovado' &&
                  estilos.textoFiltroAtivo,
              ]}
            >
              Aprovados
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              estilos.botaoFiltro,

              filtro ===
                'recusado' &&
                estilos.filtroAtivo,
            ]}

            onPress={() =>
              setFiltro(
                'recusado'
              )
            }
          >

            <Text
              style={[
                estilos.textoFiltro,

                filtro ===
                  'recusado' &&
                  estilos.textoFiltroAtivo,
              ]}
            >
              Recusados
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={[
              estilos.botaoFiltro,

              filtro ===
                'todos' &&
                estilos.filtroAtivo,
            ]}

            onPress={() =>
              setFiltro(
                'todos'
              )
            }
          >

            <Text
              style={[
                estilos.textoFiltro,

                filtro ===
                  'todos' &&
                  estilos.textoFiltroAtivo,
              ]}
            >
              Todos
            </Text>

          </TouchableOpacity>

        </View>


        {/* LISTA */}

        {solicitacoesFiltradas.length ===
        0 ? (

          <View
            style={estilos.vazio}
          >

            <Text
              style={
                estilos.iconeVazio
              }
            >
              🏠
            </Text>


            <Text
              style={
                estilos.tituloVazio
              }
            >
              Nenhuma solicitação
            </Text>


            <Text
              style={
                estilos.textoVazio
              }
            >
              Nenhum item encontrado para os
              filtros e busca aplicados.
            </Text>

          </View>

        ) : (

          solicitacoesFiltradas.map(
            (solicitacao) => (

              <View
                key={solicitacao.id}
                style={estilos.card}
              >


                {/* CABEÇALHO */}

                <View
                  style={
                    estilos.cabecalhoCard
                  }
                >

                  <View
                    style={
                      estilos.numero
                    }
                  >

                    <Text
                      style={
                        estilos.numeroTexto
                      }
                    >
                      🏠
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.infoCabecalho
                    }
                  >

                    <Text
                      style={
                        estilos.tituloImovel
                      }
                    >
                      {solicitacao.titulo ||
                        'Imóvel sem título'}
                    </Text>


                    <Text
                      style={
                        estilos.tipoImovel
                      }
                    >
                      {solicitacao.tipo ||
                        'Tipo não informado'}
                    </Text>

                  </View>


                  <View
                    style={[
                      estilos.status,

                      solicitacao.status ===
                        'aprovado' &&
                        estilos.statusAprovado,

                      solicitacao.status ===
                        'recusado' &&
                        estilos.statusRecusado,
                    ]}
                  >

                    <Text
                      style={[
                        estilos.textoStatus,

                        solicitacao.status ===
                          'aprovado' &&
                          estilos.textoStatusAprovado,

                        solicitacao.status ===
                          'recusado' &&
                          estilos.textoStatusRecusado,
                      ]}
                    >
                      {mostrarStatus(
                        solicitacao.status
                      )}
                    </Text>

                  </View>

                </View>


                <View
                  style={
                    estilos.divisor
                  }
                />


                {/* INFORMAÇÕES */}

                <Text
                  style={
                    estilos.tituloSecao
                  }
                >
                  Informações do imóvel
                </Text>


                <View
                  style={estilos.grade}
                >

                  <View
                    style={
                      estilos.infoItem
                    }
                  >

                    <Text
                      style={
                        estilos.label
                      }
                    >
                      CIDADE
                    </Text>

                    <Text
                      style={
                        estilos.valor
                      }
                    >
                      {solicitacao.cidade ||
                        'Não informado'}
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.infoItem
                    }
                  >

                    <Text
                      style={
                        estilos.label
                      }
                    >
                      BAIRRO
                    </Text>

                    <Text
                      style={
                        estilos.valor
                      }
                    >
                      {solicitacao.bairro ||
                        'Não informado'}
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.infoItem
                    }
                  >

                    <Text
                      style={
                        estilos.label
                      }
                    >
                      FINALIDADE
                    </Text>

                    <Text
                      style={
                        estilos.valor
                      }
                    >
                      {solicitacao.finalidade ||
                        'Não informado'}
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.infoItem
                    }
                  >

                    <Text
                      style={
                        estilos.label
                      }
                    >
                      VALOR
                    </Text>

                    <Text
                      style={
                        estilos.valorDestaque
                      }
                    >
                      {formatarPreco(
                        solicitacao.preco
                      )}
                    </Text>

                  </View>

                </View>


                {/* CARACTERÍSTICAS */}

                <View
                  style={
                    estilos.caracteristicas
                  }
                >

                  <View
                    style={
                      estilos.caracteristica
                    }
                  >

                    <Text
                      style={
                        estilos.iconeCaracteristica
                      }
                    >
                      🛏
                    </Text>

                    <Text
                      style={
                        estilos.numeroCaracteristica
                      }
                    >
                      {solicitacao.quartos != null
                        ? solicitacao.quartos
                        : '-'}
                    </Text>

                    <Text
                      style={
                        estilos.nomeCaracteristica
                      }
                    >
                      Quartos
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.caracteristica
                    }
                  >

                    <Text
                      style={
                        estilos.iconeCaracteristica
                      }
                    >
                      🚿
                    </Text>

                    <Text
                      style={
                        estilos.numeroCaracteristica
                      }
                    >
                      {solicitacao.banheiros != null
                        ? solicitacao.banheiros
                        : '-'}
                    </Text>

                    <Text
                      style={
                        estilos.nomeCaracteristica
                      }
                    >
                      Banheiros
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.caracteristica
                    }
                  >

                    <Text
                      style={
                        estilos.iconeCaracteristica
                      }
                    >
                      🚗
                    </Text>

                    <Text
                      style={
                        estilos.numeroCaracteristica
                      }
                    >
                      {solicitacao.vagas != null
                        ? solicitacao.vagas
                        : '-'}
                    </Text>

                    <Text
                      style={
                        estilos.nomeCaracteristica
                      }
                    >
                      Vagas
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.caracteristica
                    }
                  >

                    <Text
                      style={
                        estilos.iconeCaracteristica
                      }
                    >
                      📐
                    </Text>

                    <Text
                      style={
                        estilos.numeroCaracteristica
                      }
                    >
                      {solicitacao.area != null
                        ? solicitacao.area
                        : '-'}
                    </Text>

                    <Text
                      style={
                        estilos.nomeCaracteristica
                      }
                    >
                      m²
                    </Text>

                  </View>

                </View>


                {/* ENDEREÇO */}

                {solicitacao.endereco && (

                  <View
                    style={
                      estilos.blocoTexto
                    }
                  >

                    <Text
                      style={
                        estilos.label
                      }
                    >
                      ENDEREÇO
                    </Text>

                    <Text
                      style={
                        estilos.texto
                      }
                    >
                      {solicitacao.endereco}
                    </Text>

                  </View>

                )}


                {/* DESCRIÇÃO */}

                {solicitacao.descricao && (

                  <View
                    style={
                      estilos.blocoTexto
                    }
                  >

                    <Text
                      style={
                        estilos.label
                      }
                    >
                      DESCRIÇÃO
                    </Text>

                    <Text
                      style={
                        estilos.texto
                      }
                    >
                      {solicitacao.descricao}
                    </Text>

                  </View>

                )}


                <View
                  style={
                    estilos.divisor
                  }
                />


                {/* PROPRIETÁRIO */}

                <Text
                  style={
                    estilos.tituloSecao
                  }
                >
                  Proprietário
                </Text>


                <View
                  style={
                    estilos.proprietario
                  }
                >

                  <View
                    style={
                      estilos.avatar
                    }
                  >

                    <Text
                      style={
                        estilos.avatarTexto
                      }
                    >
                      👤
                    </Text>

                  </View>


                  <View
                    style={
                      estilos.infoProprietario
                    }
                  >

                    {solicitacao.proprietarioNome && (

                      <Text
                        style={
                          estilos.nomeProprietario
                        }
                      >
                        {solicitacao.proprietarioNome}
                      </Text>

                    )}


                    <Text
                      style={
                        estilos.email
                      }
                    >
                      {solicitacao.proprietarioEmail ||
                        'E-mail não informado'}
                    </Text>


                    <Text
                      style={
                        estilos.telefone
                      }
                    >
                      {solicitacao.telefone ||
                        'Telefone não informado'}
                    </Text>

                  </View>

                </View>


                <View
                  style={
                    estilos.divisor
                  }
                />


                {/* DOCUMENTOS */}

                <Text
                  style={
                    estilos.tituloSecao
                  }
                >
                  Documentos
                </Text>


                <TouchableOpacity
                  style={
                    estilos.botaoDocumento
                  }

                  onPress={() =>
                    abrirArquivo(
                      solicitacao.comprovanteResidencia
                    )
                  }
                >

                  <Text
                    style={
                      estilos.iconeDocumento
                    }
                  >
                    📄
                  </Text>


                  <View
                    style={
                      estilos.infoDocumento
                    }
                  >

                    <Text
                      style={
                        estilos.nomeDocumento
                      }
                    >
                      Comprovante de residência
                    </Text>


                    <Text
                      style={
                        estilos.subDocumento
                      }
                    >
                      Abrir comprovante
                    </Text>

                  </View>


                  <Text
                    style={
                      estilos.seta
                    }
                  >
                    ›
                  </Text>

                </TouchableOpacity>


                {/* FOTOS */}

                {Array.isArray(
                  solicitacao.fotos
                ) &&
                solicitacao.fotos.length >
                  0 && (

                  <View>

                    <Text
                      style={
                        estilos.tituloFotos
                      }
                    >
                      FOTOS DO IMÓVEL
                    </Text>


                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={
                        false
                      }
                      style={
                        estilos.listaFotos
                      }
                    >

                      {solicitacao.fotos.map(
                        (foto, index) => (

                          <TouchableOpacity
                            key={index}
                            onPress={() =>
                              abrirFoto(
                                foto
                              )
                            }
                          >

                            <Image
                              source={{
                                uri: foto,
                              }}

                              style={
                                estilos.foto
                              }
                            />

                          </TouchableOpacity>

                        )
                      )}

                    </ScrollView>

                  </View>

                )}


                {/* ================================================= */}
                {/* BOTÕES */}
                {/* ================================================= */}

                <View
                  style={
                    estilos.botoes
                  }
                >


                  {/* WHATSAPP */}

                  <TouchableOpacity
                    style={
                      estilos.botaoContato
                    }

                    onPress={() =>
                      entrarEmContato(
                        solicitacao
                      )
                    }

                    disabled={
                      processando ===
                      solicitacao.id
                    }
                  >

                    <Text
                      style={
                        estilos.textoBotaoContato
                      }
                    >
                      WHATSAPP
                    </Text>

                  </TouchableOpacity>


                  {/* ================================================= */}
                  {/* PENDENTE */}
                  {/* ================================================= */}

                  {solicitacao.status !==
                    'aprovado' &&
                  solicitacao.status !==
                    'recusado' && (

                    <>

                      <TouchableOpacity
                        style={
                          estilos.botaoRecusar
                        }

                        onPress={() =>
                          recusarAnuncio(
                            solicitacao
                          )
                        }

                        disabled={
                          processando ===
                          solicitacao.id
                        }
                      >

                        <Text
                          style={
                            estilos.textoBotaoRecusar
                          }
                        >
                          RECUSAR
                        </Text>

                      </TouchableOpacity>


                      <TouchableOpacity
                        style={
                          estilos.botaoAceitar
                        }

                        onPress={() =>
                          aprovarAnuncio(
                            solicitacao
                          )
                        }

                        disabled={
                          processando ===
                          solicitacao.id
                        }
                      >

                        {processando ===
                        solicitacao.id ? (

                          <ActivityIndicator
                            color="#111"
                            size="small"
                          />

                        ) : (

                          <Text
                            style={
                              estilos.textoBotaoAceitar
                            }
                          >
                            ACEITAR
                          </Text>

                        )}

                      </TouchableOpacity>

                    </>

                  )}


                  {/* ================================================= */}
                  {/* ALTERAR DECISÃO */}
                  {/* ================================================= */}

                  {(solicitacao.status ===
                    'aprovado' ||
                  solicitacao.status ===
                    'recusado') && (

                    <TouchableOpacity
                      style={
                        estilos.botaoAlterar
                      }

                      onPress={() =>
                        alterarDecisao(
                          solicitacao
                        )
                      }

                      disabled={
                        processando ===
                        solicitacao.id
                      }
                    >

                      <Text
                        style={
                          estilos.textoBotaoAlterar
                        }
                      >
                        ALTERAR DECISÃO
                      </Text>

                    </TouchableOpacity>

                  )}


                  {/* ================================================= */}
                  {/* EXCLUIR */}
                  {/* ================================================= */}

                  <TouchableOpacity
                    style={
                      estilos.botaoExcluir
                    }

                    onPress={() =>
                      excluirSolicitacao(
                        solicitacao
                      )
                    }

                    disabled={
                      processando ===
                      solicitacao.id
                    }
                  >

                    {processando ===
                    solicitacao.id ? (

                      <ActivityIndicator
                        color="#e88a8a"
                        size="small"
                      />

                    ) : (

                      <Text
                        style={
                          estilos.textoBotaoExcluir
                        }
                      >
                        EXCLUIR
                      </Text>

                    )}

                  </TouchableOpacity>


                </View>

              </View>

            )
          )

        )}

      </ScrollView>

    </ImageBackground>

  );

}


// =====================================================
// ESTILOS
// =====================================================

const estilos = StyleSheet.create({

  fundo: {
    flex: 1,
    backgroundColor: '#111',
  },


  sombra: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:
      'rgba(0,0,0,0.68)',
  },


  scroll: {
    flex: 1,
  },


  conteudo: {
    padding: 20,
    paddingTop: 115,
    paddingBottom: 60,
  },


  // =====================================================
  // VOLTAR
  // =====================================================

  botaoVoltar: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor:
      'rgba(10,10,10,0.80)',
    borderWidth: 1,
    borderColor:
      'rgba(201,168,106,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },


  iconeVoltar: {
    color: '#C9A86A',
    fontSize: 38,
    lineHeight: 40,
    marginTop: -5,
  },


  // =====================================================
  // CABEÇALHO
  // =====================================================

  cabecalho: {
    marginBottom: 15,
  },


  logo: {
    color: '#C9A86A',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 18,
  },


  logoBranco: {
    color: '#fff',
  },


  titulo: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },


  subtitulo: {
    color: '#999',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },


  // =====================================================
  // BUSCA
  // =====================================================

  containerBusca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b0b0b',
    borderWidth: 1,
    borderColor:
      'rgba(201,168,106,0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },


  inputBusca: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 13,
  },


  botaoLimparBusca: {
    padding: 5,
  },


  textoLimparBusca: {
    color: '#888',
    fontSize: 14,
  },


  // =====================================================
  // FILTROS
  // =====================================================

  containerFiltros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },


  botaoFiltro: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#0b0b0b',
    alignItems: 'center',
  },


  filtroAtivo: {
    borderColor: '#C9A86A',
    backgroundColor:
      'rgba(201,168,106,0.15)',
  },


  textoFiltro: {
    color: '#777',
    fontSize: 10,
    fontWeight: '700',
  },


  textoFiltroAtivo: {
    color: '#C9A86A',
  },


  // =====================================================
  // CARD
  // =====================================================

  card: {
    backgroundColor:
      'rgba(15,15,15,0.96)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      'rgba(201,168,106,0.25)',
    padding: 18,
    marginBottom: 20,
  },


  cabecalhoCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  numero: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor:
      'rgba(201,168,106,0.12)',
    borderWidth: 1,
    borderColor:
      'rgba(201,168,106,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },


  numeroTexto: {
    fontSize: 20,
  },


  infoCabecalho: {
    flex: 1,
    marginLeft: 12,
  },


  tituloImovel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },


  tipoImovel: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },


  status: {
    backgroundColor:
      'rgba(201,168,106,0.12)',
    borderWidth: 1,
    borderColor:
      'rgba(201,168,106,0.30)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },


  statusAprovado: {
    borderColor:
      'rgba(100,180,100,0.45)',
    backgroundColor:
      'rgba(100,180,100,0.10)',
  },


  statusRecusado: {
    borderColor:
      'rgba(200,80,80,0.45)',
    backgroundColor:
      'rgba(200,80,80,0.10)',
  },


  textoStatus: {
    color: '#C9A86A',
    fontSize: 8,
    fontWeight: '900',
  },


  textoStatusAprovado: {
    color: '#8fd18f',
  },


  textoStatusRecusado: {
    color: '#e88a8a',
  },


  divisor: {
    height: 1,
    backgroundColor: '#292929',
    marginVertical: 18,
  },


  // =====================================================
  // INFORMAÇÕES
  // =====================================================

  tituloSecao: {
    color: '#C9A86A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 14,
  },


  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },


  infoItem: {
    width: '48%',
    marginBottom: 15,
  },


  label: {
    color: '#666',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 5,
  },


  valor: {
    color: '#ddd',
    fontSize: 13,
  },


  valorDestaque: {
    color: '#C9A86A',
    fontSize: 13,
    fontWeight: '800',
  },


  // =====================================================
  // CARACTERÍSTICAS
  // =====================================================

  caracteristicas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0b0b0b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginTop: 5,
  },


  caracteristica: {
    alignItems: 'center',
    flex: 1,
  },


  iconeCaracteristica: {
    fontSize: 17,
    marginBottom: 5,
  },


  numeroCaracteristica: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },


  nomeCaracteristica: {
    color: '#777',
    fontSize: 8,
    marginTop: 3,
  },


  // =====================================================
  // TEXTO
  // =====================================================

  blocoTexto: {
    marginTop: 15,
  },


  texto: {
    color: '#bbb',
    fontSize: 12,
    lineHeight: 19,
  },


  // =====================================================
  // PROPRIETÁRIO
  // =====================================================

  proprietario: {
    flexDirection: 'row',
    alignItems: 'center',
  },


  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0b0b0b',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },


  avatarTexto: {
    fontSize: 18,
  },


  infoProprietario: {
    marginLeft: 12,
    flex: 1,
  },


  nomeProprietario: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },


  email: {
    color: '#ddd',
    fontSize: 12,
  },


  telefone: {
    color: '#777',
    fontSize: 11,
    marginTop: 4,
  },


  // =====================================================
  // DOCUMENTOS
  // =====================================================

  botaoDocumento: {
    minHeight: 62,
    backgroundColor: '#0b0b0b',
    borderWidth: 1,
    borderColor: '#292929',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },


  iconeDocumento: {
    fontSize: 22,
    width: 40,
    textAlign: 'center',
  },


  infoDocumento: {
    flex: 1,
    marginLeft: 8,
  },


  nomeDocumento: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },


  subDocumento: {
    color: '#777',
    fontSize: 9,
    marginTop: 4,
  },


  seta: {
    color: '#C9A86A',
    fontSize: 28,
  },


  // =====================================================
  // FOTOS
  // =====================================================

  tituloFotos: {
    color: '#666',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 8,
  },


  listaFotos: {
    marginBottom: 8,
  },


  foto: {
    width: 110,
    height: 90,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#222',
  },


  // =====================================================
  // BOTÕES
  // =====================================================

  botoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },


  botaoContato: {
    flex: 1,
    minWidth: '22%',
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
  },


  textoBotaoContato: {
    color: '#ddd',
    fontSize: 9,
    fontWeight: '900',
  },


  botaoRecusar: {
    flex: 1,
    minWidth: '22%',
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      'rgba(200,80,80,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
  },


  textoBotaoRecusar: {
    color: '#e88a8a',
    fontSize: 9,
    fontWeight: '900',
  },


  botaoAceitar: {
    flex: 1,
    minWidth: '22%',
    height: 45,
    borderRadius: 10,
    backgroundColor: '#C9A86A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },


  textoBotaoAceitar: {
    color: '#111',
    fontSize: 9,
    fontWeight: '900',
  },


  // =====================================================
  // ALTERAR DECISÃO
  // =====================================================

  botaoAlterar: {
    flex: 1,
    minWidth: '22%',
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      'rgba(201,168,106,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
  },


  textoBotaoAlterar: {
    color: '#C9A86A',
    fontSize: 9,
    fontWeight: '900',
  },


  // =====================================================
  // EXCLUIR
  // =====================================================

  botaoExcluir: {
    flex: 1,
    minWidth: '22%',
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor:
      'rgba(200,80,80,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 6,
  },


  textoBotaoExcluir: {
    color: '#e88a8a',
    fontSize: 9,
    fontWeight: '900',
  },


  // =====================================================
  // VAZIO
  // =====================================================

  vazio: {
    backgroundColor:
      'rgba(15,15,15,0.94)',
    borderWidth: 1,
    borderColor:
      'rgba(201,168,106,0.2)',
    borderRadius: 18,
    padding: 45,
    alignItems: 'center',
  },


  iconeVazio: {
    fontSize: 45,
    marginBottom: 15,
  },


  tituloVazio: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },


  textoVazio: {
    color: '#777',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },


  // =====================================================
  // CARREGANDO
  // =====================================================

  carregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },


  textoCarregando: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 15,
  },

});