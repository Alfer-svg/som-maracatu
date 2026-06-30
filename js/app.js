/* ============================================================
   SOM — Sistema Operacional Maracatu  ·  Maracatu Digital
   App (Alpine.js + localStorage). MVP — refinar depois.
   ============================================================ */

const MD = {
  get: (k, d = null) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  uid: () => 'id' + Math.random().toString(36).slice(2, 10),
  today: () => new Date().toISOString().slice(0, 10),
  daysDiff: (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null,
  fmtDate: (d) => { if (!d) return '—'; const [y, m, dd] = d.slice(0, 10).split('-'); return `${dd}/${m}/${y}`; },
  fmtCur: (n) => 'R$ ' + (Number(n) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  mesAtual: () => new Date().toISOString().slice(0, 7),
};

// Backend (Railway). Clientes + credenciais vivem aqui; login via JWT.
const API_BASE = 'https://som-backend-production-01d8.up.railway.app/api';

/* ---------- Ícones: emoji (usado como chave nos dados) → classe Phosphor ---------- */
const PH_ICON = {
  // navegação / estrutura
  '📊': 'ph ph-chart-bar', '💼': 'ph ph-briefcase', '🎯': 'ph ph-target', '📄': 'ph ph-file-text',
  '🧩': 'ph ph-puzzle-piece', '📝': 'ph ph-scroll', '👥': 'ph ph-users', '💰': 'ph ph-wallet',
  '🚀': 'ph ph-kanban', '🩺': 'ph ph-heartbeat', '📥': 'ph ph-tray', '🧑‍💼': 'ph ph-identification-badge',
  '📡': 'ph ph-broadcast',
  // CRM / comercial
  '📞': 'ph ph-phone', '⭐': 'ph-fill ph-star', '🤝': 'ph ph-handshake', '💬': 'ph ph-chat-circle',
  '🏆': 'ph ph-trophy', '✕': 'ph ph-x', '✉️': 'ph ph-envelope', '📍': 'ph ph-map-pin',
  // áreas de projeto
  '📱': 'ph ph-device-mobile', '🌐': 'ph ph-globe', '🎬': 'ph ph-video-camera', '🎨': 'ph ph-palette', '🗳️': 'ph ph-megaphone',
  // radar / monitoramento
  '🎂': 'ph ph-cake', '🖥️': 'ph ph-hard-drives', '📲': 'ph ph-user-plus', '📋': 'ph ph-clipboard-text', '📎': 'ph ph-paperclip',
  // sinais de saúde (cor aplicada à parte) e diversos
  '🟢': 'ph-fill ph-circle', '🟡': 'ph-fill ph-circle', '🔴': 'ph-fill ph-circle', '⚪': 'ph ph-circle', '✕': 'ph ph-x', '✓': 'ph ph-check',
  '⚠️': 'ph-fill ph-warning', '✨': 'ph ph-sparkle', '🔐': 'ph ph-lock-key', '🔗': 'ph ph-link', '🔒': 'ph ph-lock-key', '🔓': 'ph ph-lock-key-open',
  '✅': 'ph ph-check-circle', '🩹': 'ph ph-bandaids', '🏢': 'ph ph-buildings', '🗣️': 'ph ph-megaphone', '💡': 'ph ph-lightbulb',
  '📈': 'ph ph-trend-up', '📅': 'ph ph-calendar', '🔎': 'ph ph-magnifying-glass', '🥳': 'ph ph-confetti', '🎉': 'ph ph-confetti', '📒': 'ph ph-notebook',
};
const SINAL_COR = { '🟢': '#16a34a', '🟡': '#d97706', '🔴': '#dc2626', '⚪': '#9ca3af' };

/* Valida CNPJ pelos dígitos verificadores (evita consulta inútil). */
function validCNPJ(v) {
  const c = (v || '').replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (len) => { let s = 0, p = len - 7; for (let i = 0; i < len; i++) { s += +c[i] * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
  return calc(12) === +c[12] && calc(13) === +c[13];
}
function fmtCNPJ(raw) { return (raw || '').replace(/\D/g, '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5'); }

/* ---------- CRM: pipeline padrão de agência (8 estágios) ---------- */
const STAGES = [
  { id: 'Novo',        ico: '🎯', color: '#6366f1', desc: 'Lead recém-capturado, ainda sem nenhum contato.' },
  { id: 'Contatado',   ico: '📞', color: '#f59e0b', desc: 'Primeiro contato já feito (mensagem, ligação ou e-mail).' },
  { id: 'Qualificado', ico: '⭐', color: '#8b5cf6', desc: 'Tem fit: necessidade, orçamento e quem decide confirmados.' },
  { id: 'Reunião',     ico: '🤝', color: '#0ea5e9', desc: 'Reunião ou diagnóstico agendado / realizado.' },
  { id: 'Proposta',    ico: '📄', color: '#f97316', desc: 'Proposta comercial enviada, aguardando retorno.' },
  { id: 'Negociação',  ico: '💬', color: '#db2777', desc: 'Ajustes finais de escopo, preço e condições.' },
  { id: 'Ganho',       ico: '🏆', color: '#16a34a', desc: 'Fechou! O lead vira cliente.' },
  { id: 'Perdido',     ico: '✕',  color: '#dc2626', desc: 'Não avançou — registre o motivo pra aprender e melhorar.' },
];
const SERVICOS = ['Gestão de Redes Sociais', 'Criação de Conteúdo', 'ADS / Tráfego Pago', 'Audiovisual', 'Sites & Apps', 'Branding', 'SEO / Growth', 'Marketing Político', 'Consultoria'];
// Tipos de ação/follow-up do lead no CRM (cada uma agendada com data + feedback).
const ACAO_TIPOS = [
  { id: 'Ligar', ico: 'ph-phone-call' },
  { id: 'Reunião', ico: 'ph-handshake' },
  { id: 'Enviar proposta', ico: 'ph-file-text' },
  { id: 'Novo contato', ico: 'ph-chat-circle-dots' },
  { id: 'E-mail', ico: 'ph-envelope-simple' },
  { id: 'Follow-up', ico: 'ph-arrow-clockwise' },
  { id: 'Visita', ico: 'ph-map-pin' },
  { id: 'Outro', ico: 'ph-dot-outline' },
];
// Objetivos comuns de agência (sugestões no dropdown; aceita texto livre).
const OBJETIVOS = [
  'Seguidores no Instagram', 'Seguidores no TikTok', 'Inscritos no YouTube', 'Curtidas no Facebook',
  'Engajamento (curtidas/comentários)', 'Alcance / impressões', 'Visualizações de vídeo',
  'Leads gerados por mês', 'Mensagens no WhatsApp', 'Orçamentos / agendamentos', 'Vendas / conversões',
  'Tráfego no site (visitas)', 'Custo por lead (CPL)', 'ROAS (retorno em ADS)', 'Taxa de conversão',
  'Avaliações no Google Meu Negócio', 'Posições no topo do Google (SEO)', 'Reconhecimento de marca',
];
const ORIGENS = ['Instagram', 'Indicação', 'Google', 'WhatsApp', 'Prospecção ativa', 'Site', 'Evento', 'Outros'];
// Salmos e Provérbios — exibidos aleatoriamente no topo do Operacional (como no SIAGO).
const VERSICULOS = [
  { texto: 'O Senhor é o meu pastor; nada me faltará.', ref: 'Salmos 23:1' },
  { texto: 'Em ti, Senhor, ponho a minha confiança.', ref: 'Salmos 31:1' },
  { texto: 'O Senhor é a minha luz e a minha salvação; a quem temerei?', ref: 'Salmos 27:1' },
  { texto: 'Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.', ref: 'Salmos 103:1' },
  { texto: 'Aquietai-vos, e sabei que eu sou Deus.', ref: 'Salmos 46:10' },
  { texto: 'Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.', ref: 'Salmos 118:24' },
  { texto: 'Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.', ref: 'Salmos 37:5' },
  { texto: 'O Senhor é bom para todos, e as suas misericórdias estão sobre todas as suas obras.', ref: 'Salmos 145:9' },
  { texto: 'Tu és o meu refúgio e a minha fortaleza, ó meu Deus, em quem confio.', ref: 'Salmos 91:2' },
  { texto: 'Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo.', ref: 'Salmos 23:4' },
  { texto: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', ref: 'Salmos 119:105' },
  { texto: 'O Senhor é o meu rochedo, e o meu lugar forte, e o meu libertador.', ref: 'Salmos 18:2' },
  { texto: 'Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.', ref: 'Salmos 37:4' },
  { texto: 'Espera no Senhor, anima-te, e ele fortalecerá o teu coração.', ref: 'Salmos 27:14' },
  { texto: 'Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.', ref: 'Salmos 46:1' },
  { texto: 'Provai, e vede que o Senhor é bom; bem-aventurado o homem que nele confia.', ref: 'Salmos 34:8' },
  { texto: 'Os justos clamam, e o Senhor os ouve, e os livra de todas as suas angústias.', ref: 'Salmos 34:17' },
  { texto: 'Confia no Senhor, e faze o bem; habitarás na terra, e te alimentarás em segurança.', ref: 'Salmos 37:3' },
  { texto: 'Os passos de um homem bom são confirmados pelo Senhor, e deleita-se no seu caminho.', ref: 'Salmos 37:23' },
  { texto: 'Tu me darás a vereda da vida; na tua presença há fartura de alegrias.', ref: 'Salmos 16:11' },
  { texto: 'Os que semeiam em lágrimas, com alegria ceifarão.', ref: 'Salmos 126:5' },
  { texto: 'O Senhor faz prosperar o que empreendes.', ref: 'Salmos 90:17' },
  { texto: 'O temor do Senhor é o princípio da sabedoria.', ref: 'Salmos 111:10' },
  { texto: 'O Senhor abençoará o seu povo com paz.', ref: 'Salmos 29:11' },
  { texto: 'Confiai no Senhor para sempre, porque o Senhor Deus é uma rocha eterna.', ref: 'Salmos 31:14' },
  { texto: 'O temor do Senhor é o princípio do conhecimento; os loucos desprezam a sabedoria e a instrução.', ref: 'Provérbios 1:7' },
  { texto: 'Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento.', ref: 'Provérbios 3:5' },
  { texto: 'Reconhece-o em todos os teus caminhos, e ele endireitará as tuas veredas.', ref: 'Provérbios 3:6' },
  { texto: 'O coração do homem planeja o seu caminho, mas o Senhor lhe dirige os passos.', ref: 'Provérbios 16:9' },
  { texto: 'Entrega ao Senhor as tuas obras, e os teus pensamentos serão estabelecidos.', ref: 'Provérbios 16:3' },
  { texto: 'Melhor é o pouco com o temor do Senhor do que um grande tesouro onde há inquietação.', ref: 'Provérbios 15:16' },
  { texto: 'A resposta branda desvia o furor, mas a palavra dura suscita a ira.', ref: 'Provérbios 15:1' },
  { texto: 'Como o ferro com o ferro se afia, assim o homem afia o rosto do seu amigo.', ref: 'Provérbios 27:17' },
  { texto: 'O nome do Senhor é torre forte; para ela corre o justo, e está seguro.', ref: 'Provérbios 18:10' },
  { texto: 'A bênção do Senhor é que enriquece, e ele não acrescenta dores.', ref: 'Provérbios 10:22' },
  { texto: 'Em todo trabalho há proveito, mas o falar dos lábios só leva à penúria.', ref: 'Provérbios 14:23' },
  { texto: 'O justo cai sete vezes, e se levanta; mas os ímpios tropeçam no mal.', ref: 'Provérbios 24:16' },
  { texto: 'Vês um homem diligente na sua obra? Perante reis será posto; não permanecerá entre os de posição obscura.', ref: 'Provérbios 22:29' },
  { texto: 'Melhor é o fim das coisas do que o seu princípio.', ref: 'Eclesiastes 7:8' },
  { texto: 'Tudo tem o seu tempo determinado, e há tempo para todo o propósito debaixo do céu.', ref: 'Eclesiastes 3:1' },
];
const PROJ_STATUS = [
  { id: 'A Fazer',      color: '#8a8ba3' },
  { id: 'Em Andamento', color: '#2563eb' },
  { id: 'Revisão',      color: '#f59e0b' },
  { id: 'Concluído',    color: '#16a34a' },
];
// Quadro padrão do Operacional — colunas com os MESMOS nomes dos status legados (projetos antigos mapeiam direto).
const BOARD_PADRAO = () => ({ id: 'geral', nome: 'Geral', colunas: PROJ_STATUS.map(s => ({ nome: s.id, cor: s.color })) });
// Etiquetas estilo Trello (mesmas cores, p/ a equipe que já usa)
const TRELLO_LABELS = [
  { key: 'green', cor: '#61bd4f' }, { key: 'yellow', cor: '#f2d600' }, { key: 'orange', cor: '#ff9f1a' },
  { key: 'red', cor: '#eb5a46' }, { key: 'purple', cor: '#c377e0' }, { key: 'blue', cor: '#0079bf' },
  { key: 'sky', cor: '#00c2e0' }, { key: 'lime', cor: '#51e898' }, { key: 'pink', cor: '#ff78cb' },
];
const FIN_CATEGORIAS = ['Mensalidade', 'Mídia/ADS', 'Projeto pontual', 'Salários', 'Ferramentas', 'Impostos', 'Infra', 'Outros'];
const FORN_CATEGORIAS = ['Ferramentas/SaaS', 'Mídia/ADS', 'Terceirizados', 'Infra/Hospedagem', 'Impostos', 'Serviços', 'Outros'];
// Orçamentos (propostas comerciais) — status do funil de proposta.
const ORC_STATUS = [
  { id: 'Rascunho', color: '#8a8ba3' },
  { id: 'Enviado',  color: '#2563eb' },
  { id: 'Aprovado', color: '#16a34a' },
  { id: 'Recusado', color: '#dc2626' },
];
// Tipos de projeto pré-definidos no orçamento ('Outros' libera texto livre).
const PROJETO_OPCOES = ['Gestão + Tráfego', 'Tráfego', 'Gestão'];
// Meses (abas do Financeiro).
const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
// Coleções que sincronizam no backend (compartilhadas por toda a equipe).
// Para tornar QUALQUER coleção compartilhada, basta adicionar a chave aqui.
const COLECOES_SYNC = ['catalogo', 'contracts', 'finance', 'fornecedores'];
// Recadinhos mostrados na tela de login (um aleatório a cada acesso) — leves e com emoji.
const DICAS_LOGIN = [
  '🚀 Orçamento aprovado? Um clique em "Gerar contrato" e tá pronto pra assinar.',
  '🎯 O Radar não deixa follow-up escapar — ele cutuca quem precisa de você.',
  '⚡ Monta orçamento em segundos puxando do catálogo de serviços.',
  '✍️ Mandou o contrato pro ZapSign? Já vai e-mail/WhatsApp pro cliente assinar.',
  '🧠 Cadastro do cliente caprichado = contrato perfeito sem digitar nada.',
  '📈 Lead parado no CRM é grana esfriando. Bora mexer no funil!',
  '💸 Fechou o contrato? Gera o Financeiro e as mensalidades já entram.',
  '📎 Joga o briefing no cadastro pra galera toda saber do cliente.',
  '⏰ De olho nos orçamentos perto de vencer a validade.',
  '🔥 Constância bate esforço: um item do Radar por dia já muda o jogo.',
  '🤝 Contato e e-mail no cadastro = tudo auto-preenchido depois.',
  '☕ Bom te ver! Que tal começar fechando um orçamento parado?',
  '🏆 Cliente bem atendido vira indicação. Capricha no relacionamento.',
];
// Contratos — situação da vigência.
const CONTR_STATUS = [
  { id: 'Rascunho',  color: '#8a8ba3' }, // criado, ainda não enviado p/ assinatura
  { id: 'Pendente',  color: '#f59e0b' }, // enviado, aguardando assinatura
  { id: 'Assinado',  color: '#16a34a' }, // assinado = contrato ativo
  { id: 'Cancelado', color: '#dc2626' }, // cancelado → arquiva
];
const PERIODICIDADES = ['Mensal', 'Único', 'Trimestral', 'Anual'];
const FORMAS_PAGAMENTO = ['Pix', 'Boleto', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Transferência/TED', 'Depósito', 'Cheque', 'Débito Automático', 'Faturado'];
// Condições no padrão Operand: À Vista (1x) · Parcelado (divide o valor final) · demais = recorrente (cada período = valor final).
const CONDICOES_PAGAMENTO = ['À Vista', 'Parcelado', 'Mensal', 'Semanal', 'Quinzenal', 'Trimestral', 'Semestral', 'Anual'];
// Rótulos legíveis das respostas dos onboardings (formato novo: dados.answers por chave data-q).
// Cobre o onboarding de SITE e o de MARKETING. A ORDEM aqui define a ordem de exibição no briefing.
const ONB_LABELS = {
  // — SITE —
  empresa_nome: 'Nome da empresa/marca', empresa_cnpj: 'CNPJ', empresa_razao: 'Razão social', empresa_frase: 'O que a empresa faz (frase)', empresa_tempo: 'Tempo de mercado',
  empresa_historia: 'História da empresa', empresa_missao: 'Missão / valores', empresa_quem: 'Quem está por trás',
  id_logo: 'Já tem logo?', id_cores: 'Cores / estilo', id_evitar: 'O que NÃO quer no visual', id_tratamento: 'Trata o cliente por',
  id_estilo: 'Estilo de comunicação', id_referencias: 'Sites de referência (design)',
  prod_tipo: 'Vende principalmente', prod_lista: 'Produtos / serviços', prod_diferencial: 'Diferenciais',
  prod_setores: 'Setores / perfis de cliente', prod_transformacao: 'Transformação que o cliente sente', prod_precos: 'Mostrar preços no site?',
  pub_ideal: 'Cliente ideal', pub_problema: 'Problema que resolve', pub_atende: 'Onde atende',
  pub_porque: 'Por que escolher você', pub_concorrentes: 'Concorrentes / referências',
  cred_depoimentos: 'Depoimentos', cred_numeros: 'Números de impacto', cred_certificacoes: 'Certificações / prêmios / parcerias',
  cred_secao: 'Mostrar seção de clientes?', cred_empresas: 'Empresas a destacar',
  obj_acao: 'Ação principal do site', obj_whatsapp: 'WhatsApp', obj_telefone: 'Telefone', obj_email: 'E-mail',
  obj_endereco: 'Endereço e horário', obj_redes: 'Redes sociais',
  tec_conteudo: 'O que quer no site', tec_fotos: 'Tem fotos próprias?', tec_blog: 'Quer blog?',
  tec_materiais: 'Link com materiais', tec_dominio: 'Domínio registrado?', tec_dominio_empresa: 'Onde o domínio está registrado',
  tec_hospedagem: 'Hospedagem atual', tec_palavras: 'Palavras-chave do Google',
  // — MARKETING —
  empresa_documento: 'CPF / CNPJ', empresa_site: 'Site', empresa_slogan: 'Slogan', empresa_gmn: 'Google Meu Negócio',
  mat_logo_url: 'Logo (link)', mat_manual_url: 'Manual de marca (link)', mat_fotos: 'Drive de fotos/vídeos', mat_mailing_url: 'Mailing (link)',
  pub_idade: 'Faixa etária', pub_escolaridade: 'Escolaridade', pub_sexo: 'Sexo', pub_alvo: 'Público-alvo',
  neg_descricao: 'Descrição do negócio', neg_concorrentes: 'Concorrentes', neg_percepcao: 'Percepção do produto',
  neg_recorrencia: 'Recorrência de consumo', neg_fechamento: 'Tempo de fechamento da venda',
  hist_gostava: 'Gostava (agência anterior)', hist_faltava: 'Sentia falta',
  est_anuncios: 'Experiência com anúncios', est_campanhas: 'Campanhas / datas',
  cri_linguagem: 'Linguagem', cri_termos_evitar: 'Termos a evitar', cri_hashtags: 'Hashtags / slogan',
  cri_inspiracao: 'Marcas que inspiram', cri_datas_gerais: 'Datas comemorativas', cri_datas_segmento: 'Datas do segmento',
  pal_chave: 'Palavras-chave',
};
// Dados oficiais da agência (cabeçalho/rodapé de proposta e contrato).
const EMPRESA = {
  nome: 'Maracatu Digital Intelligence',
  cnpj: '44.258.426/0001-15',
  email: 'laura@maracatumktdigital.com',
  fone: '(11) 96624-9876',
  endereco: 'Av. A, 4165 – Torre 6, Sl 611 e 612 – Paiva, Cabo de Santo Agostinho – PE · CEP 54522-005',
  cidade: 'Cabo de Santo Agostinho/PE',
  representante: 'Maria Laura Alves Ferreira', // representante legal da Maracatu (CONTRATADA)
  repCpf: '089.974.194-04',                    // CPF da representante da Maracatu
};
// Texto institucional fixo da proposta (modelo Bella Napoli).
const PROPOSTA_INTRO = 'É com satisfação que encaminhamos esta proposta comercial para a sua avaliação. A proposta foi elaborada segundo as melhores práticas profissionais, a fim de atender aos altos padrões de qualidade de serviço. As informações contidas neste documento são confidenciais e de propriedade da Maracatu Digital Intelligence.\n\nEm um mundo que vive quase 100% conectado, a Maracatu Digital Intelligence nasceu para tornar a sua presença on-line cada vez mais forte. Somos uma agência de marketing digital com foco em RESULTADOS. Unimos vibrações, ferramentas atuais, inteligência de mercado e muita criatividade para elevar o potencial do seu negócio.';
// Redes que a Maracatu trabalha. score = nível de preenchimento/qualidade do perfil (0-100).
const REDES = [
  { id: 'instagram', label: 'Instagram', slug: 'instagram', cor: 'E4405F' },
  { id: 'tiktok',    label: 'TikTok',    slug: 'tiktok',    cor: '000000' },
  { id: 'youtube',   label: 'YouTube',   slug: 'youtube',   cor: 'FF0000' },
  { id: 'linkedin',  label: 'LinkedIn',  slug: 'linkedin',  cor: '0A66C2' },
  { id: 'facebook',  label: 'Facebook',  slug: 'facebook',  cor: '1877F2' },
  { id: 'gmn',       label: 'Google Meu Negócio', slug: 'google', cor: '4285F4' },
];
// URL do logo oficial da rede (Simple Icons), colorido pela marca.
// LinkedIn foi removido do Simple Icons (cdn 404) → SVG embutido (funciona offline e no PDF).
const LINKEDIN_ICON = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='%230A66C2'%3E%3Cpath%20d='M20.447%2020.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853%200-2.136%201.445-2.136%202.939v5.667H9.351V9h3.414v1.561h.046c.477-.9%201.637-1.85%203.37-1.85%203.601%200%204.267%202.37%204.267%205.455v6.286zM5.337%207.433a2.062%202.062%200%2001-2.063-2.065%202.064%202.064%200%20112.063%202.065zm1.782%2013.019H3.555V9h3.564v11.452zM22.225%200H1.771C.792%200%200%20.774%200%201.729v20.542C0%2023.227.792%2024%201.771%2024h20.451C23.2%2024%2024%2023.227%2024%2022.271V1.729C24%20.774%2023.2%200%2022.222%200h.003z'/%3E%3C/svg%3E";
const redeIcon = (r) => (r.slug === 'linkedin' ? LINKEDIN_ICON : `https://cdn.simpleicons.org/${r.slug}/${r.cor}`);

// Catálogo inicial de serviços (semeado 1x se o catálogo estiver vazio). Valor em
// branco — o usuário define por proposta. O serviço de redes já vem com o box de redes.
const CATALOGO_SEED = [
  { nome: 'Gestão de Redes Sociais', categoria: 'Social Media', valor: 0, redes: ['instagram', 'facebook', 'tiktok'],
    escopo: 'Planejamento de conteúdo mensal\n12 a 16 criativos por mês (feed + stories)\nCopywriting e legendas\nAgendamento e publicação\nInteração e gestão de comentários e direct\nRelatório mensal de performance' },
  { nome: 'Gestão de Tráfego Pago (Ads)', categoria: 'Tráfego Pago', valor: 0, ads: ['meta', 'google'], verbaAds: {},
    escopo: 'Estruturação de campanhas\nDefinição de público e segmentação\nCriação e otimização de anúncios\nAcompanhamento e otimização contínua\nGestão da verba de impulsionamento (à parte)\nRelatório mensal de resultados (CPL, ROAS)' },
  { nome: 'Captação Audiovisual', categoria: 'Produção', valor: 0,
    escopo: 'Diária de gravação com equipe\nCaptação de fotos e vídeos\nEdição e tratamento do material\nEntrega de Reels e cortes para as redes\nDeslocamento e diárias extras à parte' },
  { nome: 'Criação de Sites', categoria: 'Web', valor: 0,
    escopo: 'Site institucional responsivo\nLayout personalizado da marca\nOtimização básica de SEO\nIntegração com WhatsApp e formulários\nHospedagem e domínio à parte (1º ano)\nTreinamento de uso' },
  { nome: 'Assessoria Digital — Campanha Eleitoral', categoria: 'Político', valor: 0,
    escopo: 'Estratégia digital da campanha\nGestão de redes e conteúdo do candidato\nTráfego pago dentro das regras do TSE\nMonitoramento e gestão de crise\nRelatórios conforme a legislação eleitoral\nPagamento pela conta de campanha e impulsionamento nos limites do TSE' },
  { nome: 'Branding — Identidade Visual', categoria: 'Design', valor: 0,
    escopo: 'Briefing e pesquisa de referências\nCriação de logotipo (versões principal e secundária)\nPaleta de cores e tipografia\nManual de marca (brandbook)\nAplicações (papelaria, redes e assinaturas)' },
  { nome: 'Outros', categoria: 'Outros', valor: 0,
    escopo: 'Serviço personalizado — descrever o escopo na proposta' },
];

// Plataformas de tráfego pago (mesmo padrão de logo das redes).
const ADS = [
  { id: 'google', label: 'Google Ads', slug: 'googleads', cor: '4285F4' },
  { id: 'meta',   label: 'Meta Ads',   slug: 'meta',      cor: '0866FF' },
];
// Principais plataformas de tráfego pago (box de checkbox no serviço de tráfego).
const ADS_PLATAFORMAS = [
  { id: 'meta',      label: 'Meta Ads',      slug: 'meta',      cor: '0866FF' },
  { id: 'google',    label: 'Google Ads',    slug: 'googleads', cor: '4285F4' },
  { id: 'tiktok',    label: 'TikTok Ads',    slug: 'tiktok',    cor: '000000' },
  { id: 'youtube',   label: 'YouTube Ads',   slug: 'youtube',   cor: 'FF0000' },
  { id: 'linkedin',  label: 'LinkedIn Ads',  slug: 'linkedin',  cor: '0A66C2' },
  { id: 'pinterest', label: 'Pinterest Ads', slug: 'pinterest', cor: 'BD081C' },
];
const adsVazio = () => ({ google: { ativo: false, qualidade: 0, saldo: 0 }, meta: { ativo: false, qualidade: 0, saldo: 0 } });

// Itens comuns pra guardar acesso (login/senha) no cofre.
const ITENS_CRED = ['Instagram', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn', 'Google Meu Negócio', 'Google Ads', 'Meta Business', 'Google Analytics', 'Search Console', 'Hospedagem', 'Domínio', 'Site / WordPress', 'E-mail', 'Outro'];
const redesVazias = () => Object.fromEntries(REDES.map(r => [r.id, { tem: false, score: 0, url: '' }]));
// Merge profundo das redes salvas com o padrão (garante {tem,score,url} mesmo em clientes antigos).
const redesMerge = (saved) => { const v = redesVazias(), s = saved || {}, out = {}; for (const k in v) out[k] = { ...v[k], ...(s[k] || {}) }; return out; };
// Briefing/onboarding do cliente (espelha o onboarding da Maracatu Digital). Salvo em dados.briefing.
const briefingVazio = () => ({
  publico: { faixaEtaria: '', escolaridade: '', sexo: '', alvo: '' },
  posicionamento: { descricao: '', concorrentes: '', percepcao: '', recorrencia: '', cicloVenda: '' },
  historico: { gostou: '', melhorar: '' },
  transmissao: { midiasTestadas: '', campanhas: '' },
  criativo: { linguagem: '', evitar: '', hashtags: '', inspiracoes: '', datasComemorativas: '', datasSegmento: '' },
  ativos: { logo: '', manual: '', drive: '' },
  palavrasChave: '',
});
// Deep-merge do briefing salvo com o vazio (garante todas as subseções pra clientes antigos).
const briefingMerge = (b) => { const v = briefingVazio(); b = b || {}; return {
  publico: { ...v.publico, ...(b.publico || {}) },
  posicionamento: { ...v.posicionamento, ...(b.posicionamento || {}) },
  historico: { ...v.historico, ...(b.historico || {}) },
  transmissao: { ...v.transmissao, ...(b.transmissao || {}) },
  criativo: { ...v.criativo, ...(b.criativo || {}) },
  ativos: { ...v.ativos, ...(b.ativos || {}) },
  palavrasChave: b.palavrasChave || '',
}; };
// Responsável/contato do cliente (até 5 por cliente). Salvo em dados.responsaveis.
const respVazio = () => ({ id: '', nome: '', cpf: '', cargo: '', whatsapp: '', email: '', nascimento: '', instagram: '', linkedin: '', seguindo: false, notas: '' });
const respMerge = (arr) => (Array.isArray(arr) ? arr : []).slice(0, 5).map(r => ({ ...respVazio(), ...r, id: r.id || MD.uid() }));
// Documentos do cliente (links — contrato, proposta, etc.). Salvo em dados.documentos.
const TIPOS_DOC = ['Contrato', 'Proposta', 'Apresentação', 'Relatório', 'Briefing', 'Identidade visual', 'Outro'];
const TIPOS_INTER = [['Ligação', '📞'], ['WhatsApp', '💬'], ['E-mail', '✉️'], ['Reunião', '🤝'], ['Visita', '📍'], ['Nota', '📝']];
const TIPOS_POST = ['Estático', 'Carrossel', 'Animação', 'Vídeo'];
// Paleta de cores BEM distintas pras bolinhas (avatares) — uma cor por membro,
// pra diferenciar a equipe (antes a cor vinha do papel = todos iguais). Texto branco.
const AVATAR_CORES = ['#E11D48', '#F97316', '#0EA5E9', '#16A34A', '#7C3AED', '#DB2777', '#0D9488', '#CA8A04', '#2563EB', '#65A30D', '#9333EA', '#0891B2', '#DC2626', '#059669', '#4F46E5', '#C026D3'];

/* ---------- Pessoal: perfis de acesso (papéis) e o que cada um enxerga ---------- */
const PAPEIS_INFO = [
  { id: 'admin', nome: 'Admin', desc: 'Acesso total + gerencia a equipe', cor: '#7c3aed', bg: '#ede9fe' },
  { id: 'gestor', nome: 'Gestor', desc: 'Tudo, menos gerenciar a equipe', cor: '#2563eb', bg: '#dbeafe' },
  { id: 'comercial', nome: 'Comercial', desc: 'Vendas: CRM, clientes, orçamentos e contratos (sem Financeiro nem Operacional)', cor: '#0d9488', bg: '#ccfbf1' },
  { id: 'colaborador', nome: 'Colaborador', desc: 'Operacional e Monitoramento (sem CRM, Financeiro nem senhas)', cor: '#16a34a', bg: '#dcfce7' },
  { id: 'colaborador2', nome: 'Colaborador 2', desc: 'Só o Operacional — e só os trabalhos em que está envolvido', cor: '#0891b2', bg: '#cffafe' },
  { id: 'financeiro', nome: 'Financeiro', desc: 'Financeiro + Dashboard', cor: '#d97706', bg: '#fef3c7' },
];
// '*' = todas as páginas. Demais: lista de páginas liberadas.
const PERMISSOES = {
  admin: '*',
  // Dashboard: SÓ admin e "Master" (= perfil id 'comercial', renomeado p/ Master em ui.papeis). Admin vê as 2 abas; comercial/Master vê só a aba Comercial (ehAdmin gateia a Visão geral). 'pessoal' liberado a todos.
  gestor: ['crm', 'comercial', 'orcamentos', 'servicos', 'contratos', 'financeiro', 'operacional', 'monitoramento', 'onboarding', 'pessoal'],
  comercial: ['dashboard', 'crm', 'comercial', 'orcamentos', 'servicos', 'contratos', 'monitoramento', 'onboarding', 'pessoal'],
  colaborador: ['comercial', 'operacional', 'monitoramento', 'onboarding', 'pessoal'],
  colaborador2: ['operacional', 'pessoal'], // Operacional (só os trabalhos em que está) + a própria ficha
  financeiro: ['comercial', 'orcamentos', 'contratos', 'financeiro', 'pessoal'],
};

/* ---------- Operacional: modelos de projeto comuns de agência ---------- */
const AREAS_PROJETO = ['📱 Redes Sociais', '🎯 Tráfego Pago', '🌐 Sites & Apps', '🎬 Audiovisual', '🎨 Branding', '🗳️ Marketing Político', '🤝 Recorrente'];
const MODELOS_PROJETO = [
  { nome: 'Calendário de conteúdo do mês', area: '📱 Redes Sociais', servico: 'Gestão de Redes Sociais' },
  { nome: 'Produção de posts/criativos do mês', area: '📱 Redes Sociais', servico: 'Criação de Conteúdo' },
  { nome: 'Reels/Stories da semana', area: '📱 Redes Sociais', servico: 'Criação de Conteúdo' },
  { nome: 'Gestão de comunidade (DM/comentários)', area: '📱 Redes Sociais', servico: 'Gestão de Redes Sociais' },
  { nome: 'Relatório mensal de redes', area: '📱 Redes Sociais', servico: 'Gestão de Redes Sociais' },
  { nome: 'Setup de campanha nova', area: '🎯 Tráfego Pago', servico: 'ADS / Tráfego Pago' },
  { nome: 'Otimização semanal de campanhas', area: '🎯 Tráfego Pago', servico: 'ADS / Tráfego Pago' },
  { nome: 'Criativos para anúncios', area: '🎯 Tráfego Pago', servico: 'ADS / Tráfego Pago' },
  { nome: 'Configuração de pixel/conversões/GA4', area: '🎯 Tráfego Pago', servico: 'ADS / Tráfego Pago' },
  { nome: 'Relatório de performance de mídia', area: '🎯 Tráfego Pago', servico: 'ADS / Tráfego Pago' },
  { nome: 'Site institucional', area: '🌐 Sites & Apps', servico: 'Sites & Apps' },
  { nome: 'Landing page de campanha', area: '🌐 Sites & Apps', servico: 'Sites & Apps' },
  { nome: 'E-commerce / loja virtual', area: '🌐 Sites & Apps', servico: 'Sites & Apps' },
  { nome: 'Manutenção e atualização de site', area: '🌐 Sites & Apps', servico: 'Sites & Apps' },
  { nome: 'SEO on-page', area: '🌐 Sites & Apps', servico: 'SEO / Growth' },
  { nome: 'Captação (ensaio foto/vídeo)', area: '🎬 Audiovisual', servico: 'Audiovisual' },
  { nome: 'Edição de vídeo', area: '🎬 Audiovisual', servico: 'Audiovisual' },
  { nome: 'Motion / animação', area: '🎬 Audiovisual', servico: 'Audiovisual' },
  { nome: 'Cobertura de evento', area: '🎬 Audiovisual', servico: 'Audiovisual' },
  { nome: 'Identidade visual / logo', area: '🎨 Branding', servico: 'Branding' },
  { nome: 'Manual de marca', area: '🎨 Branding', servico: 'Branding' },
  { nome: 'Naming', area: '🎨 Branding', servico: 'Branding' },
  { nome: 'Rebranding', area: '🎨 Branding', servico: 'Branding' },
  { nome: 'Plano de comunicação de campanha', area: '🗳️ Marketing Político', servico: 'Marketing Político' },
  { nome: 'Gestão de redes do candidato', area: '🗳️ Marketing Político', servico: 'Marketing Político' },
  { nome: 'Material de campanha (santinho/jingle/adesivo)', area: '🗳️ Marketing Político', servico: 'Marketing Político' },
  { nome: 'Monitoramento e gestão de crise', area: '🗳️ Marketing Político', servico: 'Marketing Político' },
  { nome: 'Onboarding de novo cliente', area: '🤝 Recorrente', servico: 'Consultoria' },
  { nome: 'Reunião de kickoff', area: '🤝 Recorrente', servico: 'Consultoria' },
  { nome: 'Planejamento estratégico trimestral', area: '🤝 Recorrente', servico: 'Consultoria' },
  { nome: 'Renovação de contrato', area: '🤝 Recorrente', servico: 'Consultoria' },
];
const docVazio = () => ({ id: '', nome: '', tipo: 'Contrato', url: '' });
const docMerge = (arr) => (Array.isArray(arr) ? arr : []).map(d => ({ ...docVazio(), ...d, id: d.id || MD.uid() }));

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    page: 'dashboard',
    comOpen: true, // grupo "Comercial" (CRM + Clientes) aberto na barra lateral
    finOpen: false, // grupo "Financeiro" (Lançamentos + Fornecedores)
    STAGES, SERVICOS, ORIGENS, PROJ_STATUS, FIN_CATEGORIAS, FORN_CATEGORIAS, ORC_STATUS, CONTR_STATUS, PERIODICIDADES, FORMAS_PAGAMENTO, CONDICOES_PAGAMENTO, EMPRESA, REDES, ADS, ADS_PLATAFORMAS, ITENS_CRED,
    busca: '',
    monitorSel: '', // id do cliente aberto no fichário de monitoramento
    metaStatus: {},   // {clienteId: {conectado, igUsername, pageName, ...}} — conexão Meta por cliente
    metaMetricas: {}, // {clienteId: {instagram, facebook, posts}} — métricas reais puxadas da Meta
    metaBusy: false,
    radarAberto: true, // painel Radar do Monitoramento expandido
    radarSnooze: MD.get('som_radar_snooze', {}), // {chave: data-de-volta} — pendências resolvidas/adiadas
    novaInter: { tipo: 'Ligação', texto: '', data: '' }, // form de nova interação na timeline (data: opcional, p/ reunião)
    editInter: null, editInterTexto: '', // edição de um registro do histórico (admin)
    radarAutolog: MD.get('som_radar_autolog', true), // auto-registrar ações do Radar no histórico
    TIPOS_INTER,
    // Pessoal — perfis de acesso + gestão de equipe
    PAPEIS_INFO,
    // nomes/descrições editáveis dos perfis (sobrescrevem PAPEIS_INFO; salvos em /config/ui.papeis)
    papeisCustom: PAPEIS_INFO.reduce((m, p) => { m[p.id] = { nome: p.nome, desc: p.desc }; return m; }, {}),
    usuarios: [], // equipe completa (só admin lê)
    equipe: [], // equipe enxuta {id,nome,papel} p/ dropdowns (qualquer logado)
    pessoaForm: { id: '', nome: '', email: '', papel: 'colaborador', senha: '', foto: '' },
    pessoaModal: false, pessoaMsg: '',
    fichaForm: { id: '', nome: '', papel: '', foto: '', ficha: {} },
    fichaModal: false, fichaMsg: '',
    comTab: 'lista', // aba ativa em Clientes: 'lista' | 'onboarding'
    verArquivados: false, // lista de Clientes: mostrar arquivados (inativos) em vez dos ativos
    cliTipoTab: 'recorrente', // aba de tipo na lista de Clientes: 'recorrente' | 'avulso'
    crmTab: 'funil', // CRM: 'funil' (kanban) | 'lista' (tabela de leads)
    verArquivadosContrato: false, // lista de Contratos: mostrar arquivados (encerrados/vencidos +10d)
    orcFiltro: 'ativos', // filtro da lista de Orçamentos: 'ativos' | 'rascunhos' | 'arquivados'
    presenca: [], // quem está online (Operacional); admin vê todos
    opTab: 'quadro', // vista do Operacional: 'quadro' (kanban) | 'semana' (programação) | 'layouts'
    boards: [], boardSel: '', boardEdit: false, // quadros (Trello) — vários, editáveis
    TRELLO_LABELS, dragId: null, dropCol: null, dragColNome: '', // arrastar cards entre listas + arrastar colunas (estilo Trello)
    crmStages: STAGES.map(s => ({ ...s })), crmEdit: false, dragLeadId: null, dropStage: null, dragStageId: '', // CRM: colunas editáveis + drag
    ACAO_TIPOS, novaAcao: { tipo: 'Ligar', data: '', descricao: '' }, mostrarAlertas: true, // CRM: ações/follow-ups do lead + alertas
    cardModal: false, cardRef: null, labelNames: {}, labelEdit: false, labelDrop: false, labelDropProj: false, membroDrop: false, novoItemCheck: '', // card-detalhe Trello
    historicoModal: false, historicoItens: [], historicoCardNome: '', // histórico de criação/alterações do card
    novoComentario: '', novoAnexoNome: '', novoAnexoUrl: '', // comentários + anexos do card
    cloudCfg: { cloud: '', preset: '' }, uploadando: false, // storage de arquivos (Cloudinary)
    cronTick: 0, // tique de 1s pra o cronômetro ao vivo
    quickAddCol: '', quickAddText: '', // adicionar cartão rápido
    layouts: [], layoutModal: false, layoutAtual: null, // layout da semana (Fase 2/3)
    semanaOffset: 0, // navegação de período na programação/layouts (0=atual, +1=próximo, -1=anterior)
    periodo: 'Semanal', // tipo de período da programação: 'Semanal' | 'Quinzenal' | 'Mensal'
    progModal: false, // modal de criar programação (calendário de posts da semana)
    progForm: { cliente: '', responsavel: '' },
    progPosts: [], // posts sendo montados no modal
    postModal: false, postForm: { id: '', data: '', tipo: 'Estático', tema: '', legenda: '', criativo: '' }, postRef: null,
    _hbStarted: false, // guarda do heartbeat
    relatorio: { linhas: [], porDia: [], de: '', ate: '' }, // relatório de equipe (ponto + produção)
    relPeriodo: 'mes', relDe: '', relAte: '',
    // Operacional — modelos de projeto + colaboradores
    MODELOS_PROJETO, AREAS_PROJETO,
    modeloSel: '', // modelo escolhido no dropdown do "Novo projeto"
    modelosFav: MD.get('som_modelos_fav', []), // nomes dos modelos favoritados (sobem no dropdown)
    colaboradores: MD.get('som_colaboradores', []), // nomes da equipe (cresce sozinho ao salvar projeto)
    versiculo: null, // Salmo/Provérbio aleatório do topo do Operacional
    metas: { prospeccoes: 50, contatos: 25, propostas: 2 }, metasEdit: false, metasForm: {}, // metas semanais do comercial (editáveis pelo admin)
    dashTab: 'geral', // aba do Dashboard: 'geral' (visão geral) | 'comercial' (painel + metas)
    comPerTipo: 'semana', comPerOff: 0, // período do painel comercial: 'dia'|'semana'|'mes' + deslocamento (0=atual)
    credenciais: [], credModal: false, credForm: {}, revelar: {}, // cofre de acessos
    cofreMasterDef: null, cofreMaster: '', cofreRevelado: {}, cofreModal: null, cofreA: '', cofreB: '', cofreAtual: '', cofreMsg: '', // senha master do cofre
    onboardings: [], onbModal: false, onbSel: {}, onbLink: 'https://alfer-svg.github.io/som-maracatu/onboarding.html', // fila de onboardings do site
    toastMsg: '', // alerta visível (ex.: novo onboarding convertido em cliente)
    perfilAberto: true, // perfil do cliente (recolhível)
    enriqLoading: false, enriqMsg: '', enriqResult: null, // enriquecimento a partir do site
    psiLoading: false, psiMsg: '', // Google PageSpeed (Lighthouse)
    secCli: 'empresa', // seção aberta no acordeão do modal de cliente

    // dados
    clients: [], leads: [], proposals: [], contracts: [], finance: [], projects: [], catalogo: [], fornecedores: [],
    propostaEnvio: null,
    finTab: 'lancamentos',  // Financeiro: 'lancamentos' | 'fornecedores'
    finMes: new Date().getMonth(), finAno: new Date().getFullYear(), // mês/ano selecionado no Financeiro
    fornForm: {},

    // modais
    modal: null, // 'lead' | 'client' | 'finance' | 'project' | 'venc'
    editing: {},
    vencEdit: {}, // modal de alterar vencimento (calendário + cascata p/ faturas seguintes)
    pagoEdit: {}, // modal de quitação (calendário p/ a data do recebimento/pagamento)
    projetoSel: '', // dropdown de tipo de projeto no orçamento ('Outros' libera texto livre)
    docHtml: '', docTipo: '', docObj: null, // preview de documento pronto (contrato/proposta)
    assinaturaLoading: false, // gerando PDF / enviando p/ ZapSign
    cnpjLoading: false, cnpjMsg: '',
    cepLoading: false, cepMsg: '',

    // ── auth ──
    token: localStorage.getItem('som_token') || '',
    usuario: JSON.parse(localStorage.getItem('som_usuario') || 'null'),
    loginEmail: '', loginSenha: '', loginErro: '', logando: false,
    lembrarLogin: true, recuperarAberto: false, dicaLogin: '',
    senhaModal: false, pwAtual: '', pwNova: '', pwMsg: '',
    carregando: false,

    init() {
      this.versiculo = this.sorteiaVersiculo(); // Salmo/Provérbio do topo do Operacional
      // login: e-mail lembrado + dica de trabalho aleatória
      const emailLembrado = localStorage.getItem('som_login_email') || '';
      this.loginEmail = emailLembrado; this.lembrarLogin = !!emailLembrado || !localStorage.getItem('som_login_visto');
      this.dicaLogin = DICAS_LOGIN[Math.floor(Math.random() * DICAS_LOGIN.length)];
      // CRM (leads) e Operacional (projetos) agora vivem no backend — ver carregarColecoes()
      this.proposals = MD.get('som_proposals', []);
      this.contracts = MD.get('som_contracts', []);
      this.finance   = MD.get('som_finance', []);
      this.fornecedores = MD.get('som_fornecedores', []); // cadastro de fornecedores (despesas)
      this.catalogo  = MD.get('som_catalogo', []); // catálogo de serviços reusável no orçamento (cache; fonte = backend)
      if (this.token) { this.page = MD.get('som_page', 'dashboard'); this.garantirPaginaPermitida(); this.carregarClientes(); this.carregarOnboardings(); this.carregarColecoes(); this.carregarEquipe(); this.carregarPapeis(); this.startHeartbeat(); this.startChatMonitor(); this.startOnboardingMonitor(); this.registrarPush(); this.go(this.page);
        const _card = new URLSearchParams(location.search).get('card'); // abriu pela notificação → vai direto no card
        if (_card) { history.replaceState({}, '', location.pathname); this.$nextTick(() => this.abrirCardPorId(_card)); }
      }
      // Retorno do OAuth da Meta (?meta=ok|erro) — mostra toast, limpa a URL e reabre o cliente
      const _qp = new URLSearchParams(location.search);
      if (_qp.get('meta')) {
        const _ok = _qp.get('meta') === 'ok';
        const _cli = _qp.get('cliente') || localStorage.getItem('som_meta_cli') || '';
        const _motivo = _qp.get('motivo');
        this.mostrarToast(_ok ? '✅ Conta Meta conectada!' : ('❌ Falha ao conectar a conta Meta' + (_motivo ? ' (' + _motivo + ')' : '')));
        localStorage.removeItem('som_meta_cli');
        history.replaceState({}, '', location.pathname);
        if (_ok && _cli && this.token) { this.page = 'monitoramento'; this.$nextTick(() => this.abrirMonitor(_cli)); }
      }
      // áudio e permissão de notificação precisam de um gesto do usuário
      document.addEventListener('click', () => { this.initAudio(); this.pedirNotif(); }, { once: true });
    },

    get autenticado() { return !!this.token; },

    // chamada autenticada à API; 401 → desloga
    async api(method, path, body) {
      const r = await fetch(API_BASE + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: 'Bearer ' + this.token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (r.status === 401) { this.logout(); throw new Error('Sessão expirada — entre de novo.'); }
      if (!r.ok) { let m = 'Erro (' + r.status + ')'; try { m = (await r.json()).message || m; } catch {} throw new Error(m); }
      const t = await r.text(); return t ? JSON.parse(t) : null;
    },
    async fazerLogin() {
      this.loginErro = ''; this.logando = true;
      try {
        const d = await this.api('POST', '/auth/login', { email: this.loginEmail, senha: this.loginSenha });
        this.token = d.token; this.usuario = d.usuario;
        localStorage.setItem('som_token', d.token); localStorage.setItem('som_usuario', JSON.stringify(d.usuario));
        localStorage.setItem('som_login_visto', '1');
        if (this.lembrarLogin) localStorage.setItem('som_login_email', this.loginEmail); else localStorage.removeItem('som_login_email');
        this.loginSenha = ''; this.garantirPaginaPermitida(); this.startHeartbeat(); this.heartbeat(); this.initAudio(); this.pedirNotif(); this.startChatMonitor(); this.startOnboardingMonitor(); this.registrarPush(); await this.carregarClientes(); this.carregarOnboardings(); this.carregarColecoes(); this.carregarEquipe(); this.carregarPapeis();
      } catch (e) { this.loginErro = e.message || 'Falha no login.'; }
      finally { this.logando = false; }
    },
    logout() { this.token = ''; this.usuario = null; localStorage.removeItem('som_token'); localStorage.removeItem('som_usuario'); this.clients = []; },
    async trocarSenha() {
      this.pwMsg = '';
      try { await this.api('POST', '/auth/senha', { atual: this.pwAtual, nova: this.pwNova }); this.pwMsg = '✓ Senha alterada!'; this.pwAtual = ''; this.pwNova = ''; }
      catch (e) { this.pwMsg = '⚠ ' + e.message; }
    },
    async carregarClientes() {
      this.carregando = true;
      try {
        const rows = await this.api('GET', '/clientes');
        this.clients = (rows || []).map(r => ({ id: r.id, ...(r.dados || {}), empresa: (r.dados && r.dados.empresa) || r.empresa }));
        // Enriquecimento automático do monitoramento: se algum cliente tem site mas
        // ainda não foi enriquecido (sem __enriquecidoEm), dispara o backfill no
        // backend (redes/domínio/hospedagem/SEO/contato) UMA vez por sessão e recarrega
        // ~90s depois pra mostrar os campos preenchidos. Sem clique nenhum.
        const pendEnriq = this.clients.some(c => c.site && c.site.url && !c.__enriquecidoEm);
        if (pendEnriq && !this._enriqBackfill) {
          this._enriqBackfill = true;
          this.api('POST', '/clientes/enriquecer-pendentes', {}).catch(() => {});
          setTimeout(() => { this.carregarClientes(); }, 90000);
        }
      } catch (e) { console.warn('carregarClientes:', e.message); }
      finally { this.carregando = false; }
    },
    // ── CRM (leads) e Operacional (projetos): agora no backend ──
    async carregarLeads() { try { const r = await this.api('GET', '/leads'); this.leads = (r || []).map(x => ({ id: x.id, ...(x.dados || {}) })); } catch { } },
    async carregarProjetos() {
      try {
        const r = await this.api('GET', '/projetos');
        let lista = (r || []).map(x => ({ id: x.id, ...(x.dados || {}),
          criadoPorNome: x.criadoPorNome || null, atualizadoPorNome: x.atualizadoPorNome || null,
          _criadoEm: x.createdAt || null, _atualizadoEm: x.updatedAt || null }));
        // Colaborador 2 só enxerga os trabalhos em que está envolvido (responsável ou membro).
        if (this.papel === 'colaborador2') {
          const eu = (this.usuario && this.usuario.nome) || '';
          lista = lista.filter(p => p.responsavel === eu || (Array.isArray(p.membros) && p.membros.includes(eu)));
        }
        this.projects = lista;
      } catch { }
    },
    async salvarLeadApi(l) { const { id, ...dados } = l; const r = await this.api('POST', '/leads', { id, dados }); if (r && r.id && !id) l.id = r.id; return r; },
    async salvarProjetoApi(p) {
      // Tira os campos de metadado/autoria do `dados` (são colunas no backend, não fazem parte do conteúdo do card).
      const { id, criadoPorNome, atualizadoPorNome, _criadoEm, _atualizadoEm, ...dados } = p;
      const r = await this.api('POST', '/projetos', { id, dados });
      if (r && r.id && !id) p.id = r.id;
      // Atualiza autoria/datas locais com o que o backend gravou (pra o rodapé refletir na hora).
      if (r) { p.atualizadoPorNome = r.atualizadoPorNome || p.atualizadoPorNome; p._atualizadoEm = r.updatedAt || p._atualizadoEm; if (!p.criadoPorNome) p.criadoPorNome = r.criadoPorNome || null; if (!p._criadoEm) p._criadoEm = r.createdAt || null; }
      return r;
    },
    // Histórico completo do card (operacional). Abre o modal e carrega do backend.
    async abrirHistorico(p) {
      if (!p || !p.id) { this.historicoItens = []; this.historicoCardNome = (p && (p.nome || p.tema)) || 'Card'; this.historicoModal = true; return; }
      this.historicoCardNome = p.nome || p.tema || 'Card'; this.historicoItens = []; this.historicoModal = true;
      try { this.historicoItens = (await this.api('GET', '/projetos/' + p.id + '/historico')) || []; }
      catch (e) { this.historicoItens = []; }
    },
    fmtDataHora(d) {
      if (!d) return '';
      try { return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
    },
    // migração one-time: o 1º navegador com dados locais semeia o backend; os demais usam o backend
    async migrarColecao(chave, recurso) {
      const locais = MD.get(chave, []);
      if (!Array.isArray(locais) || !locais.length) return 0;
      let remotos = []; try { remotos = (await this.api('GET', recurso)) || []; } catch { return 0; }
      if (remotos.length) { localStorage.setItem(chave + '_bak', JSON.stringify(locais)); localStorage.removeItem(chave); return 0; }
      let n = 0;
      for (const item of locais) { const { id, ...dados } = item; try { await this.api('POST', recurso, { dados }); n++; } catch { } }
      localStorage.setItem(chave + '_bak', JSON.stringify(locais)); localStorage.removeItem(chave);
      return n;
    },
    async carregarColecoes() {
      if (!this.token) return;
      const a = await this.migrarColecao('som_leads', '/leads');
      const b = await this.migrarColecao('som_projects', '/projetos');
      const c = await this.migrarPropostas();
      if (a || b || c) console.info('Migrados pro backend — leads:', a, 'projetos:', b, 'orçamentos:', c);
      await this.carregarLeads(); await this.carregarProjetos(); await this.carregarPropostas();
      await this.carregarColecoesSync(); // contratos, financeiro, catálogo, fornecedores (compartilhados)
      this._aprovarOrcamentosComContrato(); // backfill: orçamento que já virou contrato → Aprovado
      this._ativarContratosRascunho();       // backfill 1x: contratos antigos em Rascunho/Pendente → Assinado (ativo)
    },
    // Backfill ONE-TIME: os contratos que ficaram em Rascunho/Pendente (o fluxo de
    // assinatura digital não foi usado) já estão ativos na prática → marca Assinado.
    // Roda só uma vez por navegador (flag); contratos NOVOS continuam nascendo Rascunho.
    _ativarContratosRascunho() {
      if (localStorage.getItem('som_contr_backfill_ativos_v1')) return;
      let mudou = false;
      for (const c of this.contracts) {
        if (c.status === 'Rascunho' || c.status === 'Pendente' || !c.status) { c.status = 'Assinado'; mudou = true; }
      }
      localStorage.setItem('som_contr_backfill_ativos_v1', '1');
      if (mudou) this.persist('contracts', this.contracts);
    },
    // Backfill: orçamentos que JÁ têm contrato gerado (mesmo propostaNumero) mas
    // ficaram com status antigo (Rascunho/Enviado) → marca Aprovado e persiste.
    // Conserta os que viraram contrato antes desta lógica existir.
    _aprovarOrcamentosComContrato() {
      let mudou = false;
      for (const o of this.proposals) {
        if (o.status === 'Aprovado' || o.status === 'Recusado') continue;
        if (o.numero && this.contracts.some(c => c.propostaNumero === o.numero)) {
          o.status = 'Aprovado'; mudou = true;
          try { const { _token, _envio, ...dados } = o; this.api('POST', '/propostas', { id: o.id || undefined, numero: o.numero, cliente: o.cliente, email: o.email || '', valorTotal: this.orcTotal(o), dados }); } catch (e) { /* offline */ }
        }
      }
      if (mudou) this.persist('proposals', this.proposals);
    },
    // Orçamentos agora ficam no backend (compartilhados entre todos os usuários).
    async carregarPropostas() {
      try {
        const rows = await this.api('GET', '/propostas');
        this.proposals = (rows || []).map(r => ({ ...(r.dados || {}), id: r.id, numero: r.numero || (r.dados && r.dados.numero), cliente: r.cliente || (r.dados && r.dados.cliente), _token: r.token, _envio: r.status }));
      } catch (e) { console.warn('carregarPropostas:', e.message); }
    },
    // migração dos orçamentos locais pro backend: sobe TODO orçamento local que ainda
    // não exista no backend (dedupe por número), mesmo que o backend já tenha outros.
    async migrarPropostas() {
      const locais = MD.get('som_proposals', []);
      if (!Array.isArray(locais) || !locais.length) return 0;
      let remotos = []; try { remotos = (await this.api('GET', '/propostas')) || []; } catch { return 0; }
      const nums = new Set(remotos.map(r => String(r.numero || (r.dados && r.dados.numero) || '').trim()).filter(Boolean));
      let n = 0;
      for (const o of locais) {
        const num = String(o.numero || '').trim();
        if (num && nums.has(num)) continue; // já está no backend
        if (/alfer/i.test((o.cliente || '') + ' ' + (o.empresa || ''))) continue; // descarta orçamentos de teste da Alfer
        const { id, _token, _envio, ...dados } = o;
        try { await this.api('POST', '/propostas', { numero: o.numero, cliente: o.cliente, email: o.email || '', valorTotal: this.orcTotal(o), dados }); n++; } catch { }
      }
      localStorage.setItem('som_proposals_bak', JSON.stringify(locais)); localStorage.removeItem('som_proposals');
      return n;
    },

    // helpers de formatação expostos ao template
    fmtDate: MD.fmtDate, fmtCur: MD.fmtCur, daysDiff: MD.daysDiff, redeIcon,
    ocultarValores: MD.get('som_ocultar_valores', false), // olho do dashboard (estilo banco)
    mascCur(v) { return this.ocultarValores ? '••••••' : MD.fmtCur(v); }, // moeda mascarada quando o olho está fechado
    toggleValores() { this.ocultarValores = !this.ocultarValores; MD.set('som_ocultar_valores', this.ocultarValores); },
    // ícones: classe Phosphor a partir do emoji-chave + cor (p/ sinais de saúde)
    phClass(e) { return PH_ICON[e] || 'ph ph-circle'; },
    phCor(e) { return SINAL_COR[e] || ''; },
    // ícone colorido (Fluent 3D PNG) a partir do emoji-chave
    icoSrc(e) {
      const sinal = { '🟢': 'circle-green', '🟡': 'circle-yellow', '🔴': 'circle-red', '⚪': 'circle-white' };
      if (sinal[e]) return 'assets/icons/' + sinal[e] + '.png?v=7';
      const cls = PH_ICON[e] || 'ph ph-circle';
      const nome = cls.split('ph-').pop();
      return 'assets/icons/' + nome + '.png?v=7';
    },
    sorteiaVersiculo() { return VERSICULOS[Math.floor(Math.random() * VERSICULOS.length)]; },
    go(p) { if (!this.podeVer(p)) return; this.page = p; MD.set('som_page', p); this.busca = ''; if (p === 'monitoramento' && this.monitorCliente) this.carregarCredenciais(this.monitorCliente.id); if (p === 'comercial') { this.comTab = 'lista'; this.carregarOnboardings(); } if (p === 'crm') { this.carregarLeads(); this.carregarCrmStages(); } if (p === 'dashboard') { if (!this.ehAdmin) this.dashTab = 'comercial'; this.carregarCrmStages(); this.carregarPropostas(); this.carregarMetas(); this.carregarLeads().then(() => { if (this.page === 'dashboard' && this.dashTab === 'comercial' && this.motivacao) this.mostrarToast(this.motivacaoMsg); }); } if (p === 'pessoal') { this.carregarUsuarios(); } if (p === 'configuracoes') { this.carregarUsuarios(); this.carregarCloud(); this.carregarPapeis(); } if (p === 'operacional') { this.versiculo = this.sorteiaVersiculo(); if (this.papel === 'colaborador2') this.opTab = 'quadro'; this.carregarPresenca(); this.carregarProjetos(); this.carregarLayouts(); this.carregarLabels(); this.carregarBoards(); this.carregarCloud(); } if (p === 'relatorios') this.carregarRelatorio(); },
    // ── Perfis de acesso (RBAC) ──
    get papel() { return (this.usuario && this.usuario.papel) || 'colaborador'; },
    get ehAdmin() { return this.papel === 'admin'; },
    podeVer(p) { const perm = PERMISSOES[this.papel]; return perm === '*' ? true : (Array.isArray(perm) && perm.includes(p)); },
    get paginaInicial() { return this.podeVer('dashboard') ? 'dashboard' : (['operacional', 'monitoramento', 'crm', 'financeiro', 'comercial', 'pessoal'].find(p => this.podeVer(p)) || 'pessoal'); },
    garantirPaginaPermitida() { if (this.token && !this.podeVer(this.page)) this.page = this.paginaInicial; },
    // ── Pessoal: gestão de equipe (admin) ──
    // PAPEIS_INFO com os nomes/descrições editados aplicados (cor/bg/permissões seguem fixos pelo id).
    get papeis() { return PAPEIS_INFO.map(p => { const o = this.papeisCustom[p.id] || {}; return { ...p, nome: o.nome || p.nome, desc: o.desc || p.desc }; }); },
    papelInfo(id) { return this.papeis.find(x => x.id === id) || { nome: id || '—', cor: '#6b7280', bg: '#f1f5f9', desc: '' }; },
    async carregarPapeis() {
      let custom = {};
      try { const r = await this.api('GET', '/config/ui.papeis'); custom = (r && r.valor) ? JSON.parse(r.valor) : {}; } catch { custom = {}; }
      const m = {};
      PAPEIS_INFO.forEach(p => { const o = custom[p.id] || {}; m[p.id] = { nome: o.nome || p.nome, desc: o.desc || p.desc }; });
      this.papeisCustom = m;
    },
    async salvarPapeis() {
      if (!this.ehAdmin) return;
      try { await this.api('PUT', '/config/ui.papeis', { valor: JSON.stringify(this.papeisCustom) }); try { await this.carregarEquipe(); } catch {} alert('Nomes dos perfis salvos.'); } catch (e) { alert(e.message || e); }
    },
    async carregarUsuarios() {
      try {
        if (this.ehAdmin) this.usuarios = (await this.api('GET', '/auth/usuarios')) || [];
        else { const eu = await this.api('GET', '/auth/me'); this.usuarios = eu ? [eu] : []; } // não-admin: só a própria ficha
      } catch (e) { this.usuarios = []; }
    },
    async carregarEquipe() { try { this.equipe = (await this.api('GET', '/auth/equipe')) || []; } catch { this.equipe = []; } },
    // ── Presença / online (Operacional) ──
    async heartbeat() { try { await this.api('POST', '/auth/heartbeat', {}); } catch {} },
    async carregarPresenca() { try { this.presenca = (await this.api('GET', '/auth/presenca')) || []; } catch { this.presenca = []; } },
    startHeartbeat() {
      if (this._hbStarted) return; this._hbStarted = true;
      this._lastActivity = Date.now();
      const marcar = () => { this._lastActivity = Date.now(); };
      ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(ev => window.addEventListener(ev, marcar, { passive: true }));
      // ao voltar pra aba (foco), conta como atividade e pinga na hora pra reaparecer rápido
      document.addEventListener('visibilitychange', () => { if (!document.hidden && this.token) { this._lastActivity = Date.now(); this.heartbeat(); } });
      if (this.token && !document.hidden) this.heartbeat();
      setInterval(() => {
        if (!this.token) return;
        // Só conta como "online agora" se a aba está VISÍVEL e houve atividade real há < 3min.
        // (Aba aberta/minimizada sem ninguém na frente NÃO mantém o usuário online — evita "logado há 28h".)
        const presente = !document.hidden && (Date.now() - (this._lastActivity || 0) < 180000);
        if (presente) this.heartbeat();
        if (this.page === 'operacional') this.carregarPresenca(); // atualiza a lista de online (GET, não conta presença)
      }, 45000);
    },
    durHuman(iso) { if (!iso) return '—'; let s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); if (h > 0) return h + 'h' + (m ? (' ' + m + 'min') : ''); if (m > 0) return m + 'min'; return 'agora mesmo'; },
    // ── Relatórios (ponto + produção) ──
    durSeg(seg) { seg = +seg || 0; const h = Math.floor(seg / 3600), m = Math.floor((seg % 3600) / 60); return h > 0 ? (h + 'h' + (m ? (' ' + m + 'min') : '')) : (m > 0 ? (m + 'min') : '—'); },
    relHora(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } },
    // Saudação de boas-vindas (Bom dia/tarde/noite no horário de Recife) + 1º nome
    get saudacao() {
      let h = 12; try { h = (+new Date().toLocaleString('en-US', { timeZone: 'America/Recife', hour: 'numeric', hour12: false })) % 24; } catch {}
      const s = h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite');
      const nome = (this.usuario && this.usuario.nome) ? this.usuario.nome.split(' ')[0] : '';
      return s + (nome ? ', ' + nome : '');
    },
    relDataDia(dia) { if (!dia) return '—'; const [y, m, d] = dia.split('-'); return d + '/' + m; },
    relNome(uid) { const u = (this.relatorio.linhas || []).find(x => x.id === uid); return u ? u.nome : '—'; },
    relSetPeriodo(p) {
      this.relPeriodo = p;
      const hoje = new Date(Date.now() - 3 * 3600 * 1000); const iso = d => d.toISOString().slice(0, 10);
      let de;
      if (p === 'hoje') de = iso(hoje);
      else if (p === '7d') { const d = new Date(hoje); d.setDate(d.getDate() - 6); de = iso(d); }
      else if (p === '30d') { const d = new Date(hoje); d.setDate(d.getDate() - 29); de = iso(d); }
      else { de = iso(hoje).slice(0, 8) + '01'; } // mês corrente
      this.relDe = de; this.relAte = iso(hoje); this.carregarRelatorio();
    },
    async carregarRelatorio() {
      if (!this.relDe) { this.relSetPeriodo('mes'); return; }
      try { this.relatorio = (await this.api('GET', '/relatorios/equipe?de=' + this.relDe + '&ate=' + this.relAte)) || { linhas: [], porDia: [] }; }
      catch { this.relatorio = { linhas: [], porDia: [] }; }
    },
    fichaVazia() { return { cargo: '', area: '', admissao: '', demissao: '', regime: 'CLT', cargaHoraria: '', jornada: '', salario: '', pix: '', banco: '', agencia: '', conta: '', cpf: '', rg: '', nascimento: '', sexo: '', estadoCivil: '', telefone: '', emailPessoal: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', emergNome: '', emergFone: '', obs: '' }; },
    // ── Acesso (Configurações › Usuários): login + perfil + senha ──
    novoColaborador() { this.pessoaForm = { id: '', nome: '', email: '', papel: 'colaborador', senha: '', foto: '' }; this.pessoaMsg = ''; this.pessoaModal = true; },
    editarColaborador(u) { this.pessoaForm = { id: u.id, nome: u.nome, email: u.email, papel: u.papel, senha: '', foto: u.foto || '' }; this.pessoaMsg = ''; this.pessoaModal = true; },
    // ── Ficha de registro (Pessoal) — só os campos de RH, não toca no acesso ──
    editarFicha(u) { this.fichaForm = { id: u.id, nome: u.nome, papel: u.papel, foto: u.foto || '', ficha: { ...this.fichaVazia(), ...(u.ficha || {}) } }; this.fichaMsg = ''; this.cepMsg = ''; this.fichaModal = true; },
    async salvarFicha() {
      const f = this.fichaForm; this.fichaMsg = '';
      try {
        // admin edita a ficha de qualquer um; demais editam só a própria (via /auth/me)
        if (this.ehAdmin) await this.api('PATCH', '/auth/usuarios/' + f.id, { nome: f.nome, ficha: f.ficha || {}, foto: f.foto || '' });
        else await this.api('PATCH', '/auth/me', { nome: f.nome, ficha: f.ficha || {}, foto: f.foto || '' });
        await this.carregarUsuarios(); this.carregarEquipe(); this.fichaModal = false;
      } catch (e) { this.fichaMsg = '⚠ ' + e.message; }
    },
    async buscarCepFicha() {
      const fc = this.fichaForm.ficha; const raw = (fc.cep || '').replace(/\D/g, '');
      if (raw.length !== 8) { this.cepMsg = '⚠ CEP precisa ter 8 dígitos.'; return; }
      this.cepLoading = true; this.cepMsg = 'Buscando…'; fc.cep = raw.replace(/^(\d{5})(\d{3})$/, '$1-$2');
      try {
        const r = await fetch('https://brasilapi.com.br/api/cep/v2/' + raw);
        if (r.ok) { const d = await r.json(); fc.logradouro = d.street || fc.logradouro; fc.bairro = d.neighborhood || fc.bairro; fc.cidade = d.city || fc.cidade; fc.uf = d.state || fc.uf; }
        else { const r2 = await fetch('https://viacep.com.br/ws/' + raw + '/json/'); const d2 = await r2.json(); if (d2.erro) throw new Error('CEP não encontrado.'); fc.logradouro = d2.logradouro || fc.logradouro; fc.bairro = d2.bairro || fc.bairro; fc.cidade = d2.localidade || fc.cidade; fc.uf = d2.uf || fc.uf; }
        this.cepMsg = '';
      } catch (e) { this.cepMsg = '⚠ ' + (e.message || 'Falha no CEP'); }
      finally { this.cepLoading = false; }
    },
    // Imprime a ficha de registro do empregado (documento interno de RH).
    imprimirFicha(u) {
      const e = this._esc, f = (u && u.ficha) || {};
      const w = window.open('', '_blank');
      if (!w) return alert('Permita pop-ups neste site pra imprimir a ficha.');
      const papel = this.papelInfo(u.papel).nome;
      const linha = (l, v) => `<tr><td class="lbl">${e(l)}</td><td class="val">${v ? e(v) : '—'}</td></tr>`;
      const dt = (d) => d ? MD.fmtDate(d) : '';
      const grupo = (titulo, linhas) => `<h2>${e(titulo)}</h2><table>${linhas.join('')}</table>`;
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ficha — ${e(u.nome)}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}body{font-family:'Inter',Arial,sans-serif;color:#1f1f1f;margin:0;font-size:13px}
.head{background:#141210;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:24px 40px}
.head .t{font-size:11px;letter-spacing:3px;color:#bdbdbd}.head .n{font-size:22px;font-weight:800;margin-top:3px}
.pad{padding:26px 40px 44px}
.topcli{display:flex;align-items:center;gap:16px;margin-bottom:6px}
.av{width:64px;height:64px;border-radius:50%;background:#ececec;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;color:#999;overflow:hidden}
.av img{width:100%;height:100%;object-fit:cover}
.nome{font-size:20px;font-weight:800}.cargo{color:#666;font-size:13px;margin-top:2px}
h2{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#141210;margin:22px 0 8px;padding-left:10px;border-left:3px solid #141210}
table{width:100%;border-collapse:collapse;margin-bottom:6px}
td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:top}
td.lbl{width:230px;color:#888;font-weight:600}td.val{font-weight:600;color:#141210}
.foot{margin-top:34px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:12px;text-align:center}
.assin{display:flex;justify-content:space-between;gap:48px;margin-top:54px}.assin div{flex:1;text-align:center;border-top:1.5px solid #141210;padding-top:8px;font-size:11px;color:#444}
@media print{.pad{padding:20px 30px}}</style></head>
<body>
<div class="head"><div><div class="t">FICHA DE REGISTRO DO EMPREGADO</div><div class="n">${e(EMPRESA.nome)}</div></div><div style="text-align:right;font-size:10.5px;color:#bdbdbd">CNPJ ${e(EMPRESA.cnpj)}<br>Emitida em ${e(MD.fmtDate(MD.today()))}</div></div>
<div class="pad">
<div class="topcli"><div class="av">${u.foto ? `<img src="${e(u.foto)}">` : e((u.nome || '?').charAt(0).toUpperCase())}</div><div><div class="nome">${e(u.nome)}</div><div class="cargo">${e(f.cargo || '—')}${f.area ? ' · ' + e(f.area) : ''} · Perfil de acesso: ${e(papel)}</div></div></div>
${grupo('Dados profissionais', [linha('Cargo', f.cargo), linha('Área / Departamento', f.area), linha('Regime', f.regime), linha('Admissão', dt(f.admissao)), f.demissao ? linha('Demissão', dt(f.demissao)) : '', linha('Carga horária', f.cargaHoraria && (f.cargaHoraria + 'h/semana')), linha('Jornada / horário', f.jornada), linha('Salário / pró-labore', f.salario && MD.fmtCur(f.salario))])}
${grupo('Pagamento', [linha('Chave PIX', f.pix), linha('Banco', f.banco), linha('Agência', f.agencia), linha('Conta', f.conta)])}
${grupo('Dados pessoais', [linha('CPF', f.cpf), linha('RG', f.rg), linha('Nascimento', dt(f.nascimento)), linha('Sexo', f.sexo), linha('Estado civil', f.estadoCivil)])}
${grupo('Contato', [linha('Telefone / WhatsApp', f.telefone), linha('E-mail pessoal', f.emailPessoal), linha('E-mail de acesso', u.email)])}
${grupo('Endereço', [linha('CEP', f.cep), linha('Logradouro', f.logradouro), linha('Número', f.numero), linha('Complemento', f.complemento), linha('Bairro', f.bairro), linha('Cidade', f.cidade), linha('UF', f.uf)])}
${grupo('Emergência', [linha('Contato', f.emergNome), linha('Telefone', f.emergFone)])}
${f.obs ? grupo('Observações', [`<tr><td colspan="2" class="val" style="font-weight:400;white-space:pre-wrap">${e(f.obs)}</td></tr>`]) : ''}
<div class="assin"><div>${e(u.nome)}<br>Empregado(a)</div><div>${e(EMPRESA.nome)}<br>Empregador</div></div>
<div class="foot">${e(EMPRESA.nome)} · CNPJ ${e(EMPRESA.cnpj)} · ${e(EMPRESA.endereco)}</div>
</div></body></html>`;
      w.document.write(html); w.document.close(); w.focus();
      setTimeout(() => { try { w.print(); } catch (er) {} }, 350);
    },
    async salvarColaborador() {
      const f = this.pessoaForm; this.pessoaMsg = '';
      try {
        if (f.id) await this.api('PATCH', '/auth/usuarios/' + f.id, { nome: f.nome, email: f.email, papel: f.papel, senha: f.senha || undefined, foto: f.foto || '' });
        else await this.api('POST', '/auth/usuarios', { nome: f.nome, email: f.email, papel: f.papel, senha: f.senha, foto: f.foto || '' });
        await this.carregarUsuarios(); this.carregarEquipe(); this.pessoaModal = false;
      } catch (e) { this.pessoaMsg = '⚠ ' + e.message; }
    },
    // foto de perfil: lê arquivo, redimensiona no navegador e guarda como base64.
    // `form` = objeto-alvo (pessoaForm do admin OU fichaForm da própria ficha); default pessoaForm.
    async lerFotoArquivo(e, form) {
      form = form || this.pessoaForm;
      const file = e.target.files && e.target.files[0]; if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Selecione uma imagem.'); return; }
      if (this.cloudOk) { // sobe pro Cloudinary (não pesa o banco)
        this.uploadando = true;
        try { const u = await this.uploadArquivo(file); if (u) form.foto = u; }
        catch (err) { alert(err.message); } finally { this.uploadando = false; e.target.value = ''; }
        return;
      }
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => {
        const S = 240; const cv = document.createElement('canvas'); cv.width = S; cv.height = S; const ctx = cv.getContext('2d');
        const sc = Math.max(S / img.width, S / img.height); const w = img.width * sc, h = img.height * sc;
        ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        form.foto = cv.toDataURL('image/jpeg', 0.82); URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    fotoDe(nome) { const m = (this.equipe || []).find(x => x.nome === nome) || (this.usuarios || []).find(x => x.nome === nome); return m && m.foto ? m.foto : ''; },
    async removerColaborador(u) {
      if (!confirm('Remover ' + u.nome + ' da equipe? Ele perde o acesso ao sistema.')) return;
      try { await this.api('DELETE', '/auth/usuarios/' + u.id); await this.carregarUsuarios(); }
      catch (e) { alert(e.message); }
    },
    async enviarBoasVindas(u) {
      if (!confirm('Enviar e-mail de boas-vindas para ' + u.nome + ' (' + u.email + ')?\n\nA senha dele será redefinida para 123456 e ele receberá as instruções para acessar e cadastrar uma nova senha.')) return;
      try { await this.api('POST', '/auth/usuarios/' + u.id + '/boas-vindas'); alert('E-mail de boas-vindas enviado para ' + u.email + ' ✅'); }
      catch (e) { alert(e.message); }
    },
    // ── Onboardings recebidos do site ──
    async carregarOnboardings() { try { this.onboardings = (await this.api('GET', '/onboarding/admin')) || []; } catch { this.onboardings = []; } }, // não auto-converte: onboarding fica pendente pra você revisar e escolher o tipo
    get onbPendentes() { return (this.onboardings || []).filter(o => o.status === 'pendente'); },
    onbStatusInfo(o) {
      const s = o.status || 'pendente';
      if (s === 'convertido') return { label: 'Virou cliente', cor: 'background:#dcfce7;color:#16a34a' };
      if (s === 'arquivado') return { label: 'Arquivado', cor: 'background:#e5e7eb;color:#6b7280' };
      return { label: 'Pendente', cor: 'background:#fef3c7;color:#a16207' };
    },
    irClienteOnb(o) {
      const nome = (o.empresa || '').trim().toLowerCase();
      const id = (o.dados && o.dados._clienteId) || ((this.clients || []).find(c => (c.empresa || '').trim().toLowerCase() === nome) || {}).id;
      if (!id) return alert('Cliente não encontrado (pode ter sido removido).');
      this.page = 'monitoramento'; this.busca = ''; this.abrirMonitor(id);
    },
    verOnboarding(o) { this.onbSel = o; this.onbModal = true; },
    onbLinhas(o) {
      const d = (o && o.dados) || {}; const out = []; const add = (l, v) => { if (v != null && String(v).trim()) out.push({ label: l, v: String(v) }); };
      // Formato NOVO (site / onboarding atual): respostas por chave em d.answers
      if (d.answers && typeof d.answers === 'object') {
        const a = d.answers, vistos = {};
        Object.keys(ONB_LABELS).forEach(k => { if (a[k] != null && String(a[k]).trim()) { add(ONB_LABELS[k], a[k]); vistos[k] = 1; } });
        // chaves que por acaso não estejam no mapa (humaniza pra não perder nada)
        Object.keys(a).forEach(k => { if (!vistos[k]) add(k.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()), a[k]); });
        (d.fileLinks || []).forEach(f => add('Arquivo', (f.filename || 'arquivo') + (f.url ? (' — ' + f.url) : '')));
        return out;
      }
      add('Site', d.site); add('Slogan', d.slogan); add('Google Meu Negócio', d.gmn && d.gmn.acesso);
      const r = d.responsavel || {}; add('Quem preencheu', [r.nome, r.cargo].filter(Boolean).join(' · ')); add('WhatsApp', r.whatsapp); add('E-mail', r.email);
      this.briefingItens({ briefing: d.briefing, slogan: '' }).forEach(x => out.push(x));
      const a = (d.briefing && d.briefing.ativos) || {}; add('Logo', a.logo); add('Manual de marca', a.manual); add('Drive de mídia', a.drive);
      return out;
    },
    _dadosDoOnboarding(o) {
      const d = o.dados || {};
      const a = d.answers || null; // onboarding novo (maracatumktdigital.com): respostas por chave data-q
      let dados;
      if (a) {
        // ── Mapeia o briefing novo (chaves data-q) → estrutura do Cliente ──
        const b = briefingVazio();
        b.publico = { faixaEtaria: a.pub_idade || '', escolaridade: a.pub_escolaridade || '', sexo: a.pub_sexo || '', alvo: a.pub_alvo || '' };
        b.posicionamento = { descricao: a.neg_descricao || '', concorrentes: a.neg_concorrentes || '', percepcao: a.neg_percepcao || '', recorrencia: a.neg_recorrencia || '', cicloVenda: a.neg_fechamento || '' };
        b.historico = { gostou: a.hist_gostava || '', melhorar: a.hist_faltava || '' };
        b.transmissao = { midiasTestadas: a.est_anuncios || '', campanhas: a.est_campanhas || '' };
        b.criativo = { linguagem: a.cri_linguagem || '', evitar: a.cri_termos_evitar || '', hashtags: a.cri_hashtags || '', inspiracoes: a.cri_inspiracao || '', datasComemorativas: a.cri_datas_gerais || '', datasSegmento: a.cri_datas_segmento || '' };
        b.ativos = { logo: a.mat_logo_url || '', manual: a.mat_manual_url || '', drive: a.mat_fotos || '' };
        b.palavrasChave = a.pal_chave || '';
        // Documentos: arquivos enviados (Cloudinary) + mailing
        const docs = [];
        (d.fileLinks || []).forEach(fl => { if (fl && fl.url) docs.push({ id: MD.uid(), nome: fl.filename || fl.name || 'Arquivo', tipo: 'Identidade visual', url: fl.url }); });
        if (a.mat_mailing_url) docs.push({ id: MD.uid(), nome: 'Mailing de clientes', tipo: 'Outro', url: a.mat_mailing_url });
        dados = {
          cnpj: a.empresa_cnpj || a.empresa_documento || '', razaoSocial: a.empresa_razao || '', empresa: o.empresa, slogan: a.empresa_slogan || '',
          cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
          contato: '', cargo: '', email: '', whatsapp: '', telefone: '', instagram: '',
          servicos: [], redes: redesVazias(), site: { url: a.empresa_site || '', seo: 0, sgo: 0 },
          dominio: { provedor: '', vencimento: '' }, hospedagem: { provedor: '', vencimento: '' }, ads: adsVazio(), objetivos: [],
          briefing: b, responsaveis: [], documentos: docs, mensalidade: 0, tipoCliente: 'recorrente', status: 'Ativo', desde: MD.today(),
          notas: a.empresa_gmn ? ('Google Meu Negócio: ' + a.empresa_gmn) : '',
        };
      } else {
        // ── Formato antigo (fallback) ──
        const r = d.responsavel || {};
        dados = {
          cnpj: '', razaoSocial: '', empresa: o.empresa, slogan: d.slogan || '',
          cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
          contato: r.nome || '', cargo: r.cargo || '', email: r.email || '', whatsapp: r.whatsapp || '', telefone: '', instagram: '',
          servicos: [], redes: redesVazias(), site: { url: d.site || '', seo: 0, sgo: 0 },
          dominio: { provedor: '', vencimento: '' }, hospedagem: { provedor: '', vencimento: '' }, ads: adsVazio(), objetivos: [],
          briefing: briefingMerge(d.briefing),
          responsaveis: (r.nome || r.email || r.whatsapp) ? [{ id: MD.uid(), nome: r.nome || '', cargo: r.cargo || '', whatsapp: r.whatsapp || '', email: r.email || '', nascimento: '', instagram: '', linkedin: '', seguindo: false, notas: '' }] : [],
          documentos: [], mensalidade: 0, tipoCliente: 'recorrente', status: 'Ativo', desde: MD.today(),
          notas: (d.gmn && d.gmn.acesso) ? ('Google Meu Negócio: ' + d.gmn.acesso) : '',
        };
      }
      return dados;
    },
    _cnpjDigitos(v) { return String(v || '').replace(/\D/g, ''); },
    _cnpjDoOnboarding(o) { const d = (o && o.dados) || {}, a = d.answers || {}; return this._cnpjDigitos(a.empresa_cnpj || a.empresa_documento || d.cnpj || ''); },
    // Cliente já cadastrado que casa pelo CNPJ do onboarding (associação automática). null se não houver.
    onbClienteVinculado(o) {
      const cj = this._cnpjDoOnboarding(o); if (cj.length < 11) return null;
      return (this.clients || []).find(c => this._cnpjDigitos(c.cnpj) === cj) || null;
    },
    async converterOnboarding(o) {
      // 1) Associação automática por CNPJ: se já há cliente com o mesmo CNPJ, abre o cadastro DELE (sem duplicar).
      const vinc = this.onbClienteVinculado(o);
      if (vinc) {
        if (!confirm('CNPJ já cadastrado no cliente "' + vinc.empresa + '". Vou abrir o cadastro dele pra revisar/atualizar — ao salvar, este onboarding sai da fila. Ok?')) return;
        this.editarCliente(vinc); this._onbConvertendo = o.id; this.onbModal = false;
        return;
      }
      // 2) Trava anti-duplicado por nome: se já existe cliente com o mesmo nome, não cria outro.
      const nome = (o.empresa || '').trim().toLowerCase();
      const existe = (this.clients || []).find(c => (c.empresa || '').trim().toLowerCase() === nome);
      if (existe) {
        if (!confirm('Já existe o cliente "' + existe.empresa + '". Não vou duplicar — marco este onboarding como convertido. Ok?')) return;
        try { await this.api('POST', '/onboarding/admin/' + o.id + '/convertido', {}); } catch {}
        this.onbModal = false; await this.carregarOnboardings();
        return;
      }
      // Abre o cadastro pré-preenchido pra você ESCOLHER O TIPO (site sugere Avulso) e revisar.
      // Nasce arquivado (Inativo) — vira ativo só ao fechar contrato. Ao salvar, marca o onboarding como convertido.
      this.editing = { id: '', ...this._dadosDoOnboarding(o), empresa: o.empresa,
        tipoCliente: ((o.dados || {}).tipo === 'site') ? 'avulso' : 'recorrente', status: 'Ativo', desde: MD.today() };
      this._onbConvertendo = o.id;
      this.cnpjMsg = ''; this.cepMsg = ''; this.onbModal = false; this.modal = 'client';
    },
    // Auto-converte onboardings pendentes em clientes (roda ao abrir o SOM). Trava anti-duplicado por nome; mantém o registro (status convertido) como histórico.
    async autoConverterOnboardings() {
      if (this._autoConvRodando) return;
      if (!this.ehAdmin && !this.podeVer('comercial')) return; // só quem cria cliente
      const pend = (this.onboardings || []).filter(o => o.status === 'pendente');
      if (!pend.length) return;
      this._autoConvRodando = true;
      try {
        if (!this.clients || !this.clients.length) { try { await this.carregarClientes(); } catch {} }
        const nomes = new Set((this.clients || []).map(c => (c.empresa || '').trim().toLowerCase()).filter(Boolean));
        const novos = [];
        for (const o of pend) {
          const nome = (o.empresa || '').trim().toLowerCase();
          try {
            if (nome && !nomes.has(nome)) { // novo → cria cliente
              await this.api('POST', '/clientes', { empresa: o.empresa, dados: this._dadosDoOnboarding(o) });
              nomes.add(nome); novos.push(o.empresa);
            }
            // duplicado OU já criado → marca convertido pra sair da fila (registro fica como histórico)
            await this.api('POST', '/onboarding/admin/' + o.id + '/convertido', {});
          } catch (e) { /* deixa na fila pra tentar no próximo carregamento */ }
        }
        if (novos.length) {
          await this.carregarClientes();
          const lista = novos.slice(0, 3).join(', ') + (novos.length > 3 ? ` +${novos.length - 3}` : '');
          this.notificarSistema('🎯 Novo onboarding recebido', lista + (novos.length > 1 ? ' — clientes criados' : ' — cliente criado'));
          this.mostrarToast('🎯 Onboarding recebido — cadastro criado: ' + lista);
        }
        try { this.onboardings = (await this.api('GET', '/onboarding/admin')) || []; } catch {}
      } finally { this._autoConvRodando = false; }
    },
    async arquivarOnboarding(o) {
      if (!confirm('Arquivar o onboarding de "' + o.empresa + '"? (sai da fila, sem virar cliente)')) return;
      try { await this.api('POST', '/onboarding/admin/' + o.id + '/arquivar', {}); await this.carregarOnboardings(); } catch (e) { alert(e.message); }
    },
    // Apaga o onboarding de vez (não mexe no cliente já criado, se houver). Ação irreversível.
    async excluirOnboarding(o) {
      if (!confirm('Apagar definitivamente o onboarding de "' + o.empresa + '"?\n\nIsto remove o registro da fila para sempre' + (o.status === 'convertido' ? ' (o cliente já criado NÃO é apagado)' : '') + '. Não dá pra desfazer.')) return;
      try { await this.api('DELETE', '/onboarding/admin/' + o.id); await this.carregarOnboardings(); this.mostrarToast('Onboarding apagado.'); } catch (e) { alert(e.message); }
    },
    // Grava local (cache offline) e, se for coleção compartilhada, sincroniza no backend.
    persist(key, arr) { MD.set('som_' + key, arr); if (this.token && COLECOES_SYNC.includes(key)) this.api('POST', '/colecoes/' + key, { itens: arr }).catch(() => {}); },
    // Remove itens com nome repetido (mantém o 1º) — usado pra limpar catálogo duplicado.
    _dedupePorNome(arr) { const seen = new Set(); return (arr || []).filter(x => { const k = String((x && x.nome) || '').trim().toLowerCase(); if (!k) return true; if (seen.has(k)) return false; seen.add(k); return true; }); },
    // Carrega as coleções compartilhadas — o BACKEND é a fonte de verdade.
    // (Não faz merge do cache local pra cima: isso ressuscitava itens excluídos em outro navegador.)
    async carregarColecoesSync() {
      if (!this.token) return;
      for (const key of COLECOES_SYNC) {
        try {
          let remoto = await this.api('GET', '/colecoes/' + key);
          remoto = Array.isArray(remoto) ? remoto : [];
          const local = MD.get('som_' + key, []);
          // migração SÓ 1 vez (com flag): senão apagar o último item ressuscitaria do cache local.
          const migKey = 'som_' + key + '_migrated';
          if (!localStorage.getItem(migKey)) {
            if (!remoto.length && Array.isArray(local) && local.length) {
              let seed = key === 'catalogo' ? this._dedupePorNome(local) : local;
              await this.api('POST', '/colecoes/' + key, { itens: seed }).catch(() => {});
              remoto = seed;
            }
            localStorage.setItem(migKey, '1');
          }
          // catálogo: dedupe por nome + semeia o padrão na 1ª vez (backend e local vazios)
          if (key === 'catalogo') {
            const dd = this._dedupePorNome(remoto);
            if (dd.length !== remoto.length) { await this.api('POST', '/colecoes/catalogo', { itens: dd }).catch(() => {}); remoto = dd; }
            if (!remoto.length && !localStorage.getItem('som_catalogo_seeded')) {
              remoto = CATALOGO_SEED.map(s => ({ id: MD.uid(), ...s }));
              localStorage.setItem('som_catalogo_seeded', '1');
              await this.api('POST', '/colecoes/catalogo', { itens: remoto }).catch(() => {});
            }
          }
          this[key] = remoto; MD.set('som_' + key, remoto); // backend manda
        } catch (e) { console.warn('colecao', key, e.message); }
      }
    },

    // ───────────────── DASHBOARD ─────────────────
    get clientesAtivos() { return this.clients.filter(c => c.status !== 'Inativo' && this.clienteTipo(c) === 'recorrente').length; }, // recorrentes ativos (KPI)
    get leadsAbertos()   { return this.leads.filter(l => !['Ganho', 'Perdido'].includes(l.stage)).length; },
    get projetosAndamento() { return this.projects.filter(p => p.status !== 'Concluído').length; },
    // chave 'YYYY-MM' do mês selecionado nas abas do Financeiro
    get finMesKey() { return this.finAno + '-' + String(this.finMes + 1).padStart(2, '0'); },
    get finMesLabel() { return MESES_CURTOS[this.finMes].toLowerCase() + '/' + this.finAno; },
    _finNoMes(f) { return String(f.vencimento || f.data || '').slice(0, 7) === this.finMesKey; }, // por vencimento
    get receitaMes() { return this.finance.filter(f => f.tipo === 'receita' && this._finNoMes(f)).reduce((a, f) => a + (+f.valor || 0), 0); },
    get despesaMes() { return this.finance.filter(f => f.tipo === 'despesa' && this._finNoMes(f)).reduce((a, f) => a + (+f.valor || 0), 0); },
    get saldoMes()   { return this.receitaMes - this.despesaMes; },
    get aReceber()   { return this.finance.filter(f => f.tipo === 'receita' && f.status !== 'pago' && this._finNoMes(f)).reduce((a, f) => a + (+f.valor || 0), 0); },
    get aPagar()     { return this.finance.filter(f => f.tipo === 'despesa' && f.status !== 'pago' && this._finNoMes(f)).reduce((a, f) => a + (+f.valor || 0), 0); },
    finMesAnterior() { if (this.finMes === 0) { this.finMes = 11; this.finAno--; } else this.finMes--; },
    finMesProximo() { if (this.finMes === 11) { this.finMes = 0; this.finAno++; } else this.finMes++; },
    // Previsão de caixa: a receber / a pagar com vencimento de hoje até hoje+N dias.
    _dataEm(dias) { const d = new Date(); d.setDate(d.getDate() + dias); return d.toISOString().slice(0, 10); },
    receberEm(dias) { const h = MD.today(), lim = this._dataEm(dias); return this.finance.filter(f => f.tipo === 'receita' && f.status !== 'pago' && f.vencimento && f.vencimento >= h && f.vencimento <= lim).reduce((a, f) => a + (+f.valor || 0), 0); },
    pagarEm(dias)   { const h = MD.today(), lim = this._dataEm(dias); return this.finance.filter(f => f.tipo === 'despesa' && f.status !== 'pago' && f.vencimento && f.vencimento >= h && f.vencimento <= lim).reduce((a, f) => a + (+f.valor || 0), 0); },
    // Cor de fundo da linha: pago = verde levíssimo, atrasado = vermelho levíssimo, senão zebra.
    lancRowBg(f, i) {
      if (f.status === 'pago') return 'background:rgba(34,197,94,.07)';
      if (f.vencimento && f.vencimento < MD.today()) return 'background:rgba(239,68,68,.07)';
      return (i % 2) ? 'background:rgba(0,0,0,.022)' : '';
    },
    get mrr()        { return this.clients.filter(c => c.status !== 'Inativo' && this.clienteTipo(c) === 'recorrente').reduce((a, c) => a + (+c.mensalidade || 0), 0); },

    // ───────────────── PAINEL COMERCIAL ─────────────────
    // Período navegável (dia/semana/mês + deslocamento), em America/Recife.
    get comPeriodo() {
      const base = new Date(Date.now() - 3 * 3600 * 1000);
      const iso = d => d.toISOString().slice(0, 10);
      const t = this.comPerTipo, off = this.comPerOff || 0;
      if (t === 'dia') { const d = new Date(base); d.setDate(base.getDate() + off); return { tipo: t, ini: iso(d), fim: iso(d), dias: 1 }; }
      if (t === 'mes') { const d = new Date(base.getFullYear(), base.getMonth() + off, 1); const f = new Date(base.getFullYear(), base.getMonth() + off + 1, 0); return { tipo: t, ini: iso(d), fim: iso(f), dias: f.getDate() }; }
      const dow = (base.getDay() + 6) % 7; const ini = new Date(base); ini.setDate(base.getDate() - dow + off * 7); const fim = new Date(ini); fim.setDate(ini.getDate() + 6);
      return { tipo: t, ini: iso(ini), fim: iso(fim), dias: 7 };
    },
    get periodoLabel() {
      const p = this.comPeriodo, off = this.comPerOff || 0;
      if (p.tipo === 'dia') { const rel = off === 0 ? 'Hoje' : (off === -1 ? 'Ontem' : (off === 1 ? 'Amanhã' : null)); return (rel ? rel + ' · ' : '') + MD.fmtDate(p.ini); }
      if (p.tipo === 'mes') { const m = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']; const d = new Date(p.ini + 'T12:00:00'); return m[d.getMonth()] + ' de ' + d.getFullYear() + (off === 0 ? ' · este mês' : ''); }
      return MD.fmtDate(p.ini) + ' a ' + MD.fmtDate(p.fim) + (off === 0 ? ' · esta semana' : '');
    },
    get periodoTituloMeta() { return this.comPerTipo === 'dia' ? 'Meta do dia' : (this.comPerTipo === 'mes' ? 'Metas do mês' : 'Metas da semana'); },
    setComPer(tipo) { this.comPerTipo = tipo; this.comPerOff = 0; },
    _noPeriodo(dataISO) { if (!dataISO) return false; const d = String(dataISO).slice(0, 10); const p = this.comPeriodo; return d >= p.ini && d <= p.fim; },
    // meta semanal prorrateada pro período (dia = semana/5 dias úteis; mês = semana × nº de semanas)
    metaDoPeriodo(base) { base = +base || 0; const t = this.comPerTipo; if (t === 'dia') return Math.ceil(base / 5); if (t === 'mes') return base * Math.max(1, Math.round((this.comPeriodo.dias || 30) / 7)); return base; },
    _tiposContato: ['Ligar', 'Novo contato', 'E-mail', 'Reunião', 'Visita', 'Follow-up'],
    // todas as ações de todos os leads, com referência ao lead dono
    get _todasAcoes() { const out = []; for (const l of (this.leads || [])) for (const a of (l.acoes || [])) out.push({ ...a, _lead: l }); return out; },
    // ── métricas do período (numeradores das metas) ──
    get metricaProspeccoes() { return (this.leads || []).filter(l => this._noPeriodo(l.createdAt)).length; },
    get metricaContatos() { return this._todasAcoes.filter(a => a.status === 'feita' && this._tiposContato.includes(a.tipo) && this._noPeriodo(a.feitoEm)).length; },
    get metricaPropostas() { return this._todasAcoes.filter(a => a.status === 'feita' && a.tipo === 'Enviar proposta' && this._noPeriodo(a.feitoEm)).length; },
    pctMeta(atual, meta) { meta = +meta || 0; return meta <= 0 ? 0 : Math.min(100, Math.round((atual / meta) * 100)); },
    get metasCards() {
      const u = this.comPerTipo === 'dia' ? 'hoje' : (this.comPerTipo === 'mes' ? 'neste mês' : 'nesta semana');
      return [
        { key: 'prospeccoes', label: 'Prospecções', ico: 'ph-target',     dica: 'Leads novos criados ' + u + '.', atual: this.metricaProspeccoes, meta: this.metaDoPeriodo(this.metas.prospeccoes), cor: '#818cf8' },
        { key: 'contatos',    label: 'Contatos',     ico: 'ph-phone-call', dica: 'Ações de contato concluídas ' + u + ' (ligação, novo contato, e-mail, reunião, visita, follow-up).', atual: this.metricaContatos, meta: this.metaDoPeriodo(this.metas.contatos), cor: '#fbbf24' },
        { key: 'propostas',   label: 'Propostas',    ico: 'ph-file-text',  dica: 'Ações "Enviar proposta" concluídas ' + u + '.', atual: this.metricaPropostas, meta: this.metaDoPeriodo(this.metas.propostas), cor: '#fb923c' },
      ];
    },
    metaCor(c) { const p = this.pctMeta(c.atual, c.meta); return p >= 100 ? '#22c55e' : (p >= 50 ? c.cor : '#f87171'); },
    // ── funil (panorama) ──
    get funilResumo() {
      const cols = (this.crmStages && this.crmStages.length) ? this.crmStages : STAGES;
      const prim = cols[0].id;
      const ids = cols.map(c => c.id);
      return cols.map(s => {
        const ls = (this.leads || []).filter(l => (ids.includes(l.stage) ? l.stage : prim) === s.id);
        return { id: s.id, ico: s.ico, color: s.color, count: ls.length, valor: ls.reduce((a, l) => a + (+l.valor || 0), 0) };
      });
    },
    get funilMax() { return Math.max(1, ...this.funilResumo.map(f => f.count)); },
    // ── pipeline / conversão ──
    get leadsAbertosArr() { return (this.leads || []).filter(l => !['Ganho', 'Perdido'].includes(l.stage)); },
    get leadsOrdenados() { const q = this.busca.toLowerCase(); return (this.leads || []).filter(l => !q || ((l.empresa || '') + ' ' + (l.contato || '') + ' ' + (l.cnpj || '')).toLowerCase().includes(q)).sort((a, b) => (a.empresa || '').localeCompare(b.empresa || '')); },
    get pipelineValor() { return this.leadsAbertosArr.reduce((a, l) => a + (+l.valor || 0), 0); },
    get ganhosCount() { return (this.leads || []).filter(l => l.stage === 'Ganho').length; },
    get ganhosValor() { return (this.leads || []).filter(l => l.stage === 'Ganho').reduce((a, l) => a + (+l.valor || 0), 0); },
    get perdidosCount() { return (this.leads || []).filter(l => l.stage === 'Perdido').length; },
    get winRate() { const t = this.ganhosCount + this.perdidosCount; return t ? Math.round((this.ganhosCount / t) * 100) : 0; },
    get ticketMedio() { return this.ganhosCount ? Math.round(this.ganhosValor / this.ganhosCount) : 0; },
    // ── origens (de onde vêm e o que converte) ──
    get origemResumo() {
      const m = {};
      for (const l of (this.leads || [])) { const o = l.origem || 'Outros'; (m[o] = m[o] || { origem: o, total: 0, ganho: 0 }); m[o].total++; if (l.stage === 'Ganho') m[o].ganho++; }
      return Object.values(m).map(x => ({ ...x, conv: x.total ? Math.round((x.ganho / x.total) * 100) : 0 })).sort((a, b) => b.total - a.total);
    },
    get origemMax() { return Math.max(1, ...this.origemResumo.map(o => o.total)); },
    // ── alertas que turbinam o processo ──
    get followupsVencidos() { const h = MD.today(); return this._todasAcoes.filter(a => a.status === 'pendente' && a.data && a.data < h).sort((a, b) => (a.data < b.data ? -1 : 1)); },
    get followupsHoje() { const h = MD.today(); return this._todasAcoes.filter(a => a.status === 'pendente' && a.data === h); },
    get leadsSemAcao() { return this.leadsAbertosArr.filter(l => !(l.acoes || []).some(a => a.status === 'pendente')); },
    get leadsParados() { const lim = this._dataEm(-14); return this.leadsAbertosArr.filter(l => String(l.createdAt || '').slice(0, 10) <= lim && ['Novo', 'Contatado'].includes(l.stage) && !(l.acoes || []).some(a => a.status === 'pendente')); },
    get acoesConcluidasSemana() { return this._todasAcoes.filter(a => a.status === 'feita' && this._noPeriodo(a.feitoEm)).length; },
    // ── alerta motivacional: passou do meio-dia e hoje ainda falta atividade ──
    get horaRecife() { try { return (+new Date().toLocaleString('en-US', { timeZone: 'America/Recife', hour: 'numeric', hour12: false })) % 24; } catch { return 12; } },
    get motivacao() {
      if (this.horaRecife < 12) return null; // só depois do meio-dia
      const h = MD.today();
      const naData = (x) => String(x || '').slice(0, 10) === h;
      const prosp = (this.leads || []).filter(l => naData(l.createdAt)).length;
      const cont = this._todasAcoes.filter(a => a.status === 'feita' && this._tiposContato.includes(a.tipo) && naData(a.feitoEm)).length;
      const prop = this._todasAcoes.filter(a => a.status === 'feita' && a.tipo === 'Enviar proposta' && naData(a.feitoEm)).length;
      const faltando = [];
      if (!prosp) faltando.push('prospecção');
      if (!cont) faltando.push('contatos');
      if (!prop) faltando.push('propostas');
      return faltando.length ? { faltando } : null;
    },
    get motivacaoMsg() {
      const m = this.motivacao; if (!m) return '';
      const l = m.faltando;
      const lista = l.length === 1 ? l[0] : (l.slice(0, -1).join(', ') + ' nem ' + l[l.length - 1]);
      return 'Já passou do meio-dia e hoje ainda não registramos ' + lista + '. Bora pra cima — você ainda consegue! 💪';
    },
    // ── metas: carregar/editar (admin) ──
    async carregarMetas() { try { const r = await this.api('GET', '/config/ui.metasComercial'); const v = r && r.valor ? JSON.parse(r.valor) : null; if (v && typeof v === 'object') this.metas = { prospeccoes: +v.prospeccoes || 0, contatos: +v.contatos || 0, propostas: +v.propostas || 0 }; } catch { } },
    abrirEditMetas() { this.metasForm = { ...this.metas }; this.metasEdit = true; },
    async salvarMetas() { const f = this.metasForm; this.metas = { prospeccoes: Math.max(0, +f.prospeccoes || 0), contatos: Math.max(0, +f.contatos || 0), propostas: Math.max(0, +f.propostas || 0) }; this.metasEdit = false; try { await this.api('PUT', '/config/ui.metasComercial', { valor: JSON.stringify(this.metas) }); } catch (e) { alert(e.message); } },
    irLeadCrm(l) { if (!l) return; this.page = 'crm'; MD.set('som_page', 'crm'); this.busca = ''; this.carregarCrmStages(); this.editarLead(l); },

    // ───────────────── CRM ─────────────────
    leadsDoEstagio(s) {
      const q = this.busca.toLowerCase();
      const ids = (this.crmStages || []).map(x => x.id);
      const primeira = ids[0];
      return this.leads.filter(l => {
        const st = ids.includes(l.stage) ? l.stage : primeira; // lead órfão (estágio removido/renomeado) cai na 1ª coluna
        return st === s && (!q || ((l.empresa || '') + ' ' + (l.contato || '')).toLowerCase().includes(q));
      });
    },
    stageInfo(s) { return (this.crmStages || []).find(x => x.id === s) || (this.crmStages || [])[0] || STAGES[0]; },
    novoLead(stage) { stage = stage || ((this.crmStages || [])[0] || {}).id || 'Novo'; this.editing = { id: '', empresa: '', contato: '', whatsapp: '', email: '', cidade: '', servico: '', origem: 'Instagram', cnpj: '', valor: 0, stage, notas: '', createdAt: MD.today() }; this.cnpjMsg = ''; this.modal = 'lead'; },
    // ── CRM: colunas (estágios) editáveis + drag (mesmo padrão do Operacional) ──
    async carregarCrmStages() {
      try { const r = await this.api('GET', '/config/ui.crmStages'); const v = r && r.valor ? JSON.parse(r.valor) : null; if (Array.isArray(v) && v.length) this.crmStages = v; } catch { }
    },
    salvarCrmStages() { try { this.api('PUT', '/config/ui.crmStages', { valor: JSON.stringify(this.crmStages) }); } catch (e) { } },
    addStage() { const id = (prompt('Nome da nova coluna:', 'Nova etapa') || '').trim(); if (!id) return; if (this.crmStages.some(s => s.id === id)) return alert('Já existe uma coluna com esse nome.'); this.crmStages.push({ id, ico: '•', color: '#8a8ba3', desc: '' }); this.salvarCrmStages(); },
    moverStage(s, dir) { const i = this.crmStages.indexOf(s), j = i + dir; if (j < 0 || j >= this.crmStages.length) return; this.crmStages.splice(i, 1); this.crmStages.splice(j, 0, s); this.salvarCrmStages(); },
    async renomearStage(s) {
      const id = (prompt('Nome da coluna:', s.id) || '').trim(); if (!id || id === s.id) return;
      if (this.crmStages.some(x => x.id === id)) return alert('Já existe uma coluna com esse nome.');
      const antigos = this.leads.filter(l => l.stage === s.id); s.id = id; this.salvarCrmStages();
      for (const l of antigos) { l.stage = id; try { await this.salvarLeadApi(l); } catch { } } // migra os leads
    },
    async removerStage(s) {
      if (this.crmStages.length <= 1) return alert('O funil precisa de ao menos uma coluna.');
      const cards = this.leads.filter(l => l.stage === s.id), destino = this.crmStages.find(x => x.id !== s.id);
      if (!confirm('Remover a coluna "' + s.id + '"?' + (cards.length ? (' Os ' + cards.length + ' lead(s) vão pra "' + destino.id + '".') : ''))) return;
      for (const l of cards) { l.stage = destino.id; try { await this.salvarLeadApi(l); } catch { } }
      this.crmStages = this.crmStages.filter(x => x.id !== s.id); this.salvarCrmStages();
    },
    onDropLead(stage) { const l = this.leads.find(x => x.id === this.dragLeadId); if (l && (l.stage || '') !== stage) this.moverLead(l, stage); this.dragLeadId = null; this.dropStage = null; },
    onDropStage(alvoId) {
      const from = this.crmStages.findIndex(s => s.id === this.dragStageId), to = this.crmStages.findIndex(s => s.id === alvoId);
      if (from > -1 && to > -1 && from !== to) { const [st] = this.crmStages.splice(from, 1); this.crmStages.splice(to, 0, st); this.salvarCrmStages(); }
      this.dragStageId = ''; this.dropStage = null;
    },
    editarLead(l) { this.editing = { ...l }; this.cnpjMsg = ''; this.modal = 'lead'; },
    async salvarLead() {
      const e = this.editing;
      if (!e.empresa) return alert('Informe a empresa/nome do lead.');
      try {
        if (e.id) { await this.salvarLeadApi(e); const i = this.leads.findIndex(x => x.id === e.id); if (i > -1) this.leads[i] = { ...e }; }
        else { await this.salvarLeadApi(e); this.leads.unshift({ ...e }); }
        this.modal = null;
      } catch (err) { alert(err.message || 'Falha ao salvar o lead.'); }
    },
    async moverLead(l, stage) { const antes = l.stage; l.stage = stage; try { await this.salvarLeadApi(l); } catch {} if (stage === 'Ganho' && antes !== 'Ganho') this.registrarProducao('negocio', l.empresa || '', +l.valor || 0); },
    async excluirLead(l) { if (!confirm('Excluir o lead ' + l.empresa + '?')) return; try { await this.api('DELETE', '/leads/' + l.id); this.leads = this.leads.filter(x => x.id !== l.id); this.modal = null; } catch (err) { alert(err.message); } },
    // ── CRM: ações/follow-ups do lead (agendamento + feedback + histórico + alertas) ──
    acaoTipoIco(t) { const a = ACAO_TIPOS.find(x => x.id === t); return a ? a.ico : 'ph-dot-outline'; },
    acaoEmDias(d) { const dt = new Date(); dt.setDate(dt.getDate() + d); this.novaAcao.data = dt.toISOString().slice(0, 10); },
    async _salvarLeadInline() {
      try {
        await this.salvarLeadApi(this.editing);
        const i = this.leads.findIndex(x => x.id === this.editing.id);
        if (i > -1) this.leads[i] = { ...this.editing }; else if (this.editing.id) this.leads.unshift({ ...this.editing });
      } catch (e) { alert(e.message || 'Falha ao salvar a ação.'); }
    },
    async addAcao() {
      const l = this.editing;
      if (!l.empresa) return alert('Preencha o nome do lead antes de agendar ações.');
      const na = this.novaAcao;
      if (!na.data) return alert('Escolha a data da ação.');
      if (!Array.isArray(l.acoes)) l.acoes = [];
      l.acoes.push({ id: MD.uid(), tipo: na.tipo, data: na.data, descricao: (na.descricao || '').trim(), status: 'pendente', feedback: '', criadoPorNome: (this.usuario && this.usuario.nome) || 'Alguém', criadoEm: new Date().toISOString() });
      this.novaAcao = { tipo: na.tipo, data: '', descricao: '' };
      await this._salvarLeadInline();
    },
    async concluirAcao(a) {
      const fb = prompt('Feedback da ação (o que aconteceu?):', a.feedback || '');
      if (fb === null) return;
      a.status = 'feita'; a.feedback = (fb || '').trim(); a.feitoPorNome = (this.usuario && this.usuario.nome) || 'Alguém'; a.feitoEm = new Date().toISOString();
      await this._salvarLeadInline();
    },
    async reabrirAcao(a) { a.status = 'pendente'; a.feitoEm = null; await this._salvarLeadInline(); },
    async removerAcao(a) { if (!confirm('Remover esta ação?')) return; this.editing.acoes = (this.editing.acoes || []).filter(x => x.id !== a.id); await this._salvarLeadInline(); },
    // pendentes primeiro (por data), feitas no fim (mais recente primeiro)
    acoesOrdenadas(l) {
      const arr = [...((l && l.acoes) || [])];
      return arr.sort((a, b) => {
        if ((a.status === 'feita') !== (b.status === 'feita')) return a.status === 'feita' ? 1 : -1;
        if (a.status === 'feita') return (b.feitoEm || '') < (a.feitoEm || '') ? -1 : 1;
        return (a.data || '') < (b.data || '') ? -1 : 1;
      });
    },
    proxAcao(l) { return ((l && l.acoes) || []).filter(a => a.status === 'pendente' && a.data).sort((a, b) => (a.data < b.data ? -1 : 1))[0] || null; },
    acaoCor(a) { if (!a || !a.data) return ''; const h = MD.today(); if (a.data < h) return '#dc2626'; if (a.data === h) return '#d97706'; return ''; },
    // alertas: ações pendentes vencendo hoje ou atrasadas (de todos os leads)
    get alertasAcoes() {
      const h = MD.today(); const out = [];
      for (const l of this.leads) for (const a of (l.acoes || [])) if (a.status === 'pendente' && a.data && a.data <= h) out.push({ lead: l, acao: a, atrasada: a.data < h });
      return out.sort((x, y) => (x.acao.data < y.acao.data ? -1 : 1));
    },

    // ───────────────── COMERCIAL: clientes ─────────────────
    clienteTipo(c) { return (c && c.tipoCliente) || 'recorrente'; }, // tipo: recorrente (mensalidade) | avulso (esporádico)
    get clientesFiltrados() {
      const q = this.busca.toLowerCase();
      return this.clients
        .filter(c => this.clienteTipo(c) === this.cliTipoTab) // separa Recorrentes × Avulsos
        .filter(c => this.verArquivados ? (c.status === 'Inativo') : (c.status !== 'Inativo'))
        .filter(c => !q || (c.empresa + ' ' + (c.razaoSocial || '') + ' ' + (c.contato || '')).toLowerCase().includes(q));
    },
    // Ativos por tipo + arquivados do tipo selecionado.
    get clientesRecorrentesCount() { return this.clients.filter(c => c.status !== 'Inativo' && this.clienteTipo(c) === 'recorrente').length; },
    get clientesAvulsosCount() { return this.clients.filter(c => c.status !== 'Inativo' && this.clienteTipo(c) === 'avulso').length; },
    get clientesArquivadosCount() { return this.clients.filter(c => c.status === 'Inativo' && this.clienteTipo(c) === this.cliTipoTab).length; },
    // Lista de clientes pros dropdowns/datalists dos formulários — só ATIVOS (não Inativo).
    get clientesLista() { return this.clients.filter(c => (c.status || 'Ativo') !== 'Inativo').sort((a, b) => (a.empresa || '').localeCompare(b.empresa || '')); },
    // Igual ao clientesLista, mas INCLUI arquivados — usado só no seletor de cliente da proposta:
    // arquivado pode RECEBER proposta; só vira Ativo quando fecha contrato (ver _ativarClienteDoContrato).
    // Seletor de cliente da PROPOSTA: leads + clientes (ativos, avulsos e arquivados), únicos por nome.
    get clientesListaProposta() {
      const map = new Map();
      (this.clients || []).forEach(c => { const n = (c.empresa || '').trim(); if (n) map.set(n.toLowerCase(), { empresa: n, _tipo: this.clienteTipo(c) === 'avulso' ? 'Cliente avulso' : (c.status === 'Inativo' ? 'Cliente arquivado' : 'Cliente') }); });
      (this.leads || []).forEach(l => { const n = (l.empresa || '').trim(); if (n && !map.has(n.toLowerCase())) map.set(n.toLowerCase(), { empresa: n, _tipo: 'Lead' }); });
      return [...map.values()].sort((a, b) => a.empresa.localeCompare(b.empresa));
    },
    ativarCliente(c) { c.status = 'Ativo'; return this.persistirCliente(c); },
    arquivarCliente(c) { c.status = 'Inativo'; return this.persistirCliente(c); },
    // Fechou contrato (Assinado) ⇒ o cliente arquivado é promovido a Ativo. Chamado no aceite digital e na marcação manual.
    _ativarClienteDoContrato(c) {
      if (!c || c.status !== 'Assinado') return;
      const cli = this._clientePorNome(c.cliente);
      if (cli && (cli.status || 'Ativo') === 'Inativo') return this.ativarCliente(cli);
    },
    async puxarDoSite() {
      const url = (this.editing.site && this.editing.site.url) || '';
      if (!url) { this.enriqMsg = 'Informe a URL do site primeiro.'; this.enriqResult = null; return; }
      this.enriqLoading = true; this.enriqMsg = ''; this.enriqResult = null;
      try {
        const r = await this.api('POST', '/enriquecer', { url }) || {};
        const redes = r.redes || {}, dom = r.dominio || {};
        // Reatribui os containers inteiros (força a reatividade do Alpine).
        const novasRedes = { ...this.editing.redes };
        ['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube', 'gmn'].forEach(id => {
          if (redes[id] && novasRedes[id]) novasRedes[id] = { ...novasRedes[id], tem: true, url: redes[id] };
        });
        this.editing.redes = novasRedes;
        this.editing.dominio = {
          ...this.editing.dominio,
          provedor: this.editing.dominio.provedor || dom.provedor || '',
          vencimento: this.editing.dominio.vencimento || dom.vencimento || '',
        };
        const hosp = r.hospedagem || {};
        this.editing.hospedagem = { ...this.editing.hospedagem, provedor: this.editing.hospedagem.provedor || hosp.provedor || '' };
        if (typeof r.seo === 'number' || typeof r.sgo === 'number') {
          this.editing.site = {
            ...this.editing.site,
            seo: typeof r.seo === 'number' ? r.seo : this.editing.site.seo,
            sgo: typeof r.sgo === 'number' ? r.sgo : this.editing.site.sgo,
          };
        }
        if (r.email || r.telefone) {
          const resp = Array.isArray(this.editing.responsaveis) ? [...this.editing.responsaveis] : [];
          if (!resp.length) resp.push({ ...respVazio(), id: MD.uid() });
          resp[0] = { ...resp[0], email: resp[0].email || r.email || '', whatsapp: resp[0].whatsapp || r.telefone || '' };
          this.editing.responsaveis = resp;
        }
        const res = []; const addR = (l, v) => { if (v && String(v).trim()) res.push({ l, v: String(v) }); };
        addR('Instagram', redes.instagram); addR('Facebook', redes.facebook); addR('LinkedIn', redes.linkedin);
        addR('TikTok', redes.tiktok); addR('YouTube', redes.youtube); addR('Google Meu Negócio', redes.gmn);
        addR('Domínio (provedor)', dom.provedor); addR('Vencimento do domínio', dom.vencimento);
        addR('Hospedagem', hosp.provedor);
        if (typeof r.seo === 'number') addR('SEO on-page', r.seo + '%' + ((r.seoFaltam && r.seoFaltam.length) ? ' — falta: ' + r.seoFaltam.join(', ') : ''));
        if (typeof r.sgo === 'number') addR('SGO on-page', r.sgo + '%' + ((r.sgoFaltam && r.sgoFaltam.length) ? ' — falta: ' + r.sgoFaltam.join(', ') : ''));
        addR('E-mail', r.email); addR('Telefone', r.telefone);
        this.enriqResult = res;
        this.enriqMsg = res.length ? '' : 'Não achei dados no site (confira a URL ou preencha à mão).';
      } catch (e) { this.enriqMsg = e.message || 'Falha ao ler o site.'; this.enriqResult = null; }
      finally { this.enriqLoading = false; }
    },
    async avaliarPagespeed() {
      const url = (this.editing.site && this.editing.site.url) || '';
      if (!url) { this.psiMsg = 'Informe a URL do site primeiro.'; return; }
      this.psiLoading = true; this.psiMsg = 'Rodando o Google PageSpeed… (pode levar até 30s)';
      try {
        const r = await this.api('POST', '/enriquecer/pagespeed', { url }) || {};
        if (r.erro) { this.psiMsg = r.erro; return; }
        this.editing.site = {
          ...this.editing.site,
          seo: (r.seo != null ? r.seo : this.editing.site.seo),
          lh: { seo: r.seo, performance: r.performance, acessibilidade: r.acessibilidade, boasPraticas: r.boasPraticas, cwv: r.cwv || {}, em: MD.today() },
        };
        const cwv = r.cwv || {};
        const cwvTxt = [cwv.lcp && ('LCP ' + cwv.lcp), cwv.inp && ('INP ' + cwv.inp), cwv.cls && ('CLS ' + cwv.cls)].filter(Boolean).join(' · ');
        this.psiMsg = '✓ SEO ' + r.seo + '% · Performance ' + r.performance + '% · Acessib. ' + r.acessibilidade + '% · Boas práticas ' + r.boasPraticas + '%' + (cwvTxt ? (' · ' + cwvTxt) : '');
      } catch (e) { this.psiMsg = e.message || 'Falha no PageSpeed.'; }
      finally { this.psiLoading = false; }
    },
    novoCliente() {
      this._onbConvertendo = null; this._leadConvertendo = null;
      this.editing = {
        id: '', cnpj: '', razaoSocial: '', empresa: '', slogan: '', inscEstadual: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
        contato: '', cargo: '', email: '', whatsapp: '', telefone: '', instagram: '',
        servicos: [], redes: redesVazias(),
        site: { url: '', seo: 0, sgo: 0 },
        dominio: { provedor: '', vencimento: '' },
        hospedagem: { provedor: '', vencimento: '' },
        ads: adsVazio(),
        objetivos: [], briefing: briefingVazio(), responsaveis: [], documentos: [],
        mensalidade: 0, tipoCliente: this.cliTipoTab || 'recorrente', status: 'Ativo', desde: MD.today(), notas: '',
      };
      this.cnpjMsg = ''; this.cepMsg = ''; this.modal = 'client';
    },
    // Responsáveis do cliente; se não houver nenhum mas existir contato/e-mail/whats "de topo"
    // (legado de quando era lead), cria o 1º contato com esses dados pra não ficar escondido.
    _responsaveisComLegado(c) {
      const rs = respMerge(c.responsaveis);
      if (rs.length) return rs;
      const fone = c.whatsapp || c.telefone || '';
      if (c.contato || c.email || fone) return [{ ...respVazio(), id: MD.uid(), nome: c.contato || '', email: c.email || '', whatsapp: fone }];
      return rs;
    },
    editarCliente(c) {
      this._onbConvertendo = null; this._leadConvertendo = null;
      this.editing = {
        ...c,
        tipoCliente: c.tipoCliente || 'recorrente',
        servicos: c.servicos || (c.servico ? [c.servico] : []),
        redes: redesMerge(c.redes),
        site: { url: '', seo: 0, sgo: 0, ...(c.site || {}) },
        dominio: { provedor: '', vencimento: '', ...(c.dominio || {}) },
        hospedagem: { provedor: '', vencimento: '', ...(c.hospedagem || {}) },
        ads: { google: { ativo: false, qualidade: 0, saldo: 0, ...((c.ads || {}).google || {}) }, meta: { ativo: false, qualidade: 0, saldo: 0, ...((c.ads || {}).meta || {}) } },
        objetivos: (c.objetivos || []).map(o => ({ id: o.id || MD.uid(), nome: o.nome || '', alvo: +o.alvo || 0, atual: +o.atual || 0, unidade: o.unidade || '' })),
        slogan: c.slogan || '', briefing: briefingMerge(c.briefing), responsaveis: this._responsaveisComLegado(c), documentos: docMerge(c.documentos),
      };
      this.cnpjMsg = ''; this.cepMsg = '';
      // se semeamos o contato a partir de dado antigo "de topo", já abre a seção pra ficar visível
      if (!respMerge(c.responsaveis).length && this.editing.responsaveis.length) this.secCli = 'contato';
      this.modal = 'client';
    },
    // sinalização de condição por % (0-100)
    corScore(n) { n = +n || 0; return n >= 80 ? '#16a34a' : n >= 40 ? '#f59e0b' : '#dc2626'; },
    diasVenc(d) { if (!d) return null; return Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000); },
    corVenc(d) { const n = this.diasVenc(d); if (n === null) return 'var(--text-3)'; return n < 0 ? '#dc2626' : n <= 30 ? '#f59e0b' : '#16a34a'; },
    txtVenc(d) { const n = this.diasVenc(d); if (n === null) return 'sem data'; return n < 0 ? ('vencido há ' + (-n) + 'd') : n === 0 ? 'vence hoje' : ('vence em ' + n + 'd'); },
    corSaldo(n) { n = +n || 0; return n <= 0 ? '#dc2626' : n < 200 ? '#f59e0b' : '#16a34a'; },
    adsAtivos(c) { return ADS.filter(a => c.ads && c.ads[a.id] && c.ads[a.id].ativo); },
    progressoObj(o) { return o && +o.alvo > 0 ? Math.min(100, Math.round((+o.atual || 0) / +o.alvo * 100)) : 0; },
    addObjetivo() { if (!this.editing.objetivos) this.editing.objetivos = []; this.editing.objetivos.push({ id: MD.uid(), nome: '', alvo: 0, atual: 0, unidade: '' }); },
    removeObjetivo(i) { this.editing.objetivos.splice(i, 1); },
    clienteServicos(c) { return (c.servicos && c.servicos.length) ? c.servicos : (c.servico ? [c.servico] : []); },
    redesDoCliente(c) { return REDES.filter(r => c.redes && c.redes[r.id] && c.redes[r.id].tem); },
    // Linhas preenchidas do briefing (só mostra o que tem conteúdo).
    briefingItens(c) {
      const b = c.briefing || {}; const out = []; const add = (label, v) => { if (v != null && String(v).trim()) out.push({ label, v: String(v) }); };
      const P = b.publico || {}, PO = b.posicionamento || {}, H = b.historico || {}, T = b.transmissao || {}, CR = b.criativo || {};
      add('Slogan', c.slogan);
      add('Faixa etária', P.faixaEtaria); add('Escolaridade', P.escolaridade); add('Sexo do público', P.sexo); add('Público-alvo', P.alvo);
      add('Descrição do negócio', PO.descricao); add('Concorrentes diretos', PO.concorrentes); add('Percepção na categoria', PO.percepcao); add('Recorrência de consumo', PO.recorrencia); add('Ciclo médio de venda', PO.cicloVenda);
      add('Gostou (trabalhos anteriores)', H.gostou); add('A melhorar', H.melhorar);
      add('Mídias já testadas', T.midiasTestadas); add('Campanhas/datas previstas', T.campanhas);
      add('Linguagem', CR.linguagem); add('Termos a evitar', CR.evitar); add('Hashtags / slogan', CR.hashtags); add('Marcas/perfis inspiradores', CR.inspiracoes); add('Datas comemorativas', CR.datasComemorativas); add('Datas do segmento', CR.datasSegmento);
      add('Palavras-chave', b.palavrasChave);
      return out;
    },
    briefingAtivos(c) { const a = (c.briefing || {}).ativos || {}; return [
      { label: '🎨 Logo', url: a.logo }, { label: '📖 Manual de marca', url: a.manual }, { label: '🗂️ Drive de mídia', url: a.drive },
    ].filter(x => x.url && x.url.trim()); },
    // ── Responsáveis / contatos ──
    addResponsavel() { if (!Array.isArray(this.editing.responsaveis)) this.editing.responsaveis = []; if (this.editing.responsaveis.length >= 5) return alert('Máximo de 5 responsáveis por cliente.'); this.editing.responsaveis.push({ ...respVazio(), id: MD.uid() }); },
    removeResponsavel(i) { this.editing.responsaveis.splice(i, 1); },
    waLink(num) { const d = String(num || '').replace(/\D/g, ''); return d ? ('https://wa.me/' + (d.length <= 11 ? '55' + d : d)) : ''; },
    igLink(h) { const u = String(h || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/+$/, ''); return u ? ('https://instagram.com/' + u) : ''; },
    liLink(v) { const s = String(v || '').trim(); if (!s) return ''; return /^https?:\/\//i.test(s) ? s : ('https://www.linkedin.com/search/results/all/?keywords=' + encodeURIComponent(s)); },
    buscaPessoa(r, empresa) { return 'https://www.google.com/search?q=' + encodeURIComponent([r.nome, empresa, 'instagram linkedin'].filter(Boolean).join(' ')); },
    // Responsáveis com pelo menos uma rede preenchida (lista "a seguir").
    respComRede(c) { return (c.responsaveis || []).filter(r => (r.instagram && r.instagram.trim()) || (r.linkedin && r.linkedin.trim())); },
    // ── Documentos ──
    addDocumento() { if (!Array.isArray(this.editing.documentos)) this.editing.documentos = []; this.editing.documentos.push({ ...docVazio(), id: MD.uid() }); },
    removeDocumento(i) { this.editing.documentos.splice(i, 1); },
    // ── Resumo de saúde do cliente ──
    saudeCliente(c) {
      const partes = [];
      if (this.redesDoCliente(c).length) partes.push(this.mediaRedes(c));
      if (c.site && c.site.url) partes.push(Math.round((((c.site.seo) || 0) + ((c.site.sgo) || 0)) / 2));
      const objs = c.objetivos || []; if (objs.length) partes.push(Math.round(objs.reduce((a, o) => a + this.progressoObj(o), 0) / objs.length));
      const score = partes.length ? Math.round(partes.reduce((a, b) => a + b, 0) / partes.length) : null;
      return { score, sinal: score == null ? '⚪' : (score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴') };
    },
    // Quanto do cadastro do cliente está preenchido (%) — pros campos que importam no monitoramento.
    completudeCadastro(c) {
      if (!c) return { pct: 0, faltam: [] };
      const has = (v) => v != null && String(v).trim() !== '';
      const resp = c.responsaveis || [], b = c.briefing || {}, cri = b.criativo || {};
      const temRede = (k) => !!(c.redes && c.redes[k] && has(c.redes[k].url));
      const checks = [
        ['CNPJ', has(c.cnpj)],
        ['Razão social', has(c.razaoSocial) || has(c.empresa)],
        ['Cidade/UF', has(c.cidade) && has(c.uf)],
        ['Endereço', has(c.cep) && has(c.logradouro)],
        ['E-mail', has(c.email) || resp.some((r) => has(r.email))],
        ['WhatsApp', has(c.whatsapp) || has(c.telefone) || resp.some((r) => has(r.whatsapp))],
        ['Responsável', has(c.contato) || resp.length > 0],
        ['Site', has(c.site && c.site.url)],
        ['Redes sociais', !!(c.redes && Object.keys(c.redes).some((k) => k !== 'gmn' && temRede(k)))],
        ['Google Meu Negócio', !!(c.gmn && c.gmn.rating != null) || temRede('gmn')],
        ['Serviços', (c.servicos || []).length > 0],
        ['Objetivos', (c.objetivos || []).length > 0],
        ['Mensalidade', Number(c.mensalidade) > 0],
        ['Briefing', has(b.publico) || has(b.posicionamento) || has(cri.linguagem) || has(b.slogan) || has(c.slogan)],
      ];
      const ok = checks.filter((x) => x[1]).length;
      return { pct: Math.round((ok / checks.length) * 100), faltam: checks.filter((x) => !x[1]).map((x) => x[0]) };
    },
    // Passos sugeridos pra MELHORAR A SAÚDE, com estimativa de ganho — simula cada alavanca a 80%.
    passosSaude(c) {
      if (!c) return [];
      const temRedes = this.redesDoCliente(c).length;
      const temSite = !!(c.site && c.site.url);
      const objs = c.objetivos || [];
      const sim = (ov) => {
        const p = [];
        const r = ov.redes != null ? ov.redes : (temRedes ? this.mediaRedes(c) : null); if (r != null) p.push(r);
        const s = ov.site != null ? ov.site : (temSite ? Math.round((((c.site.seo) || 0) + ((c.site.sgo) || 0)) / 2) : null); if (s != null) p.push(s);
        const o = ov.objetivos != null ? ov.objetivos : (objs.length ? Math.round(objs.reduce((a, x) => a + this.progressoObj(x), 0) / objs.length) : null); if (o != null) p.push(o);
        return p.length ? Math.round(p.reduce((a, b) => a + b, 0) / p.length) : 0;
      };
      const atual = this.saudeCliente(c).score || 0;
      const passos = [];
      const push = (label, como, novo) => { const g = novo - atual; if (g > 0) passos.push({ label, como, ganho: g }); };
      const siteVal = temSite ? Math.round((((c.site.seo) || 0) + ((c.site.sgo) || 0)) / 2) : 0;
      const redesVal = temRedes ? this.mediaRedes(c) : 0;
      const objVal = objs.length ? Math.round(objs.reduce((a, x) => a + this.progressoObj(x), 0) / objs.length) : 0;
      const COMO_SITE = 'Cadastre a URL do site no monitoramento e rode o "Avaliar SEO (PageSpeed)". Corrija os pontos vermelhos: títulos e meta-descrições por página, velocidade/Core Web Vitals, versão mobile, HTTPS, conteúdo com palavras-chave e links internos.';
      const COMO_REDES = 'Cadastre os perfis (Instagram/Facebook/YouTube/LinkedIn) na ficha, complete bio, foto e destaques, poste com constância e responda comentários/direct — depois atualize a nota de qualidade de cada rede.';
      const COMO_OBJ = 'Defina metas mensuráveis na seção Objetivos (ex.: seguidores, leads, posts/mês) com alvo e prazo, e vá atualizando o valor "atual" conforme avança — o progresso entra direto na saúde.';
      if (!temSite) push('Cadastrar o site e otimizar o SEO', COMO_SITE, sim({ site: 80 }));
      else if (siteVal < 80) push('Melhorar o SEO/SGO do site (hoje ' + siteVal + '%)', COMO_SITE, sim({ site: 80 }));
      if (!temRedes) push('Cadastrar e qualificar as redes sociais', COMO_REDES, sim({ redes: 80 }));
      else if (redesVal < 80) push('Subir a qualidade das redes sociais (hoje ' + redesVal + '%)', COMO_REDES, sim({ redes: 80 }));
      if (!objs.length) push('Definir objetivos/metas e acompanhar', COMO_OBJ, sim({ objetivos: 80 }));
      else if (objVal < 80) push('Avançar nos objetivos definidos (hoje ' + objVal + '%)', COMO_OBJ, sim({ objetivos: 80 }));
      return passos.sort((a, b) => b.ganho - a.ganho);
    },
    // Busca de perfil de uma pessoa restrita a uma rede (Google site:) — sugestão pro cadastro.
    buscaRede(r, empresa, dominio) { return 'https://www.google.com/search?q=' + encodeURIComponent([r && r.nome, empresa].filter(Boolean).join(' ') + ' site:' + dominio); },
    saudeAlertas(c) {
      const a = [];
      if (!(c.responsaveis || []).length) a.push('Sem responsáveis');
      if (!this.briefingItens(c).length) a.push('Briefing vazio');
      const aniv = (c.responsaveis || []).filter(r => { const d = this.diasAniver(r.nascimento); return d != null && d <= 30; }).length;
      if (aniv) a.push(aniv + ' aniversário(s) ≤30d');
      const naoSeg = this.respComRede(c).filter(r => !r.seguindo).length;
      if (naoSeg) a.push(naoSeg + ' pra seguir');
      if (!(c.documentos || []).length) a.push('Sem documentos');
      return a;
    },
    // ── Radar: pendências acionáveis cruzando TODOS os clientes ──
    diasAte(d) { if (!d) return null; const t = new Date(String(d).slice(0, 10) + 'T00:00:00'); if (isNaN(t.getTime())) return null; const h = new Date(); h.setHours(0, 0, 0, 0); return Math.round((t - h) / 86400000); },
    msgAniversario(r) { const nome = String(r.nome || '').trim().split(/\s+/)[0]; return (nome ? 'Oi ' + nome + '! ' : 'Olá! ') + '🎉 Passando pra te desejar um feliz aniversário, com muita saúde e conquistas. Um grande abraço da equipe Maracatu Digital!'; },
    pendenciasCliente(c) {
      // kind+ref formam a chave estável (imune à contagem de dias) usada no snooze/resolver
      const out = []; const add = (nivel, ord, icon, txt, kind, ref, acao) => out.push({ nivel, ord, icon, txt, kind, ref: ref || '', acaoLabel: '', acaoHref: '', acaoFicha: false, ...(acao || {}) });
      // 🎂 Aniversários de responsáveis ≤30d → parabenizar no WhatsApp
      (c.responsaveis || []).forEach(r => {
        const d = this.diasAniver(r.nascimento);
        if (d != null && d <= 30) {
          const quando = d === 0 ? 'hoje' : (d === 1 ? 'amanhã' : 'em ' + d + 'd');
          const wa = r.whatsapp ? (this.waLink(r.whatsapp) + '?text=' + encodeURIComponent(this.msgAniversario(r))) : '';
          add(d <= 3 ? 'alta' : 'media', d, '🎂', 'Aniversário de ' + (r.nome || 'responsável') + ' ' + quando, 'aniver', r.id, wa ? { acaoLabel: 'Parabenizar', acaoHref: wa } : { acaoFicha: true });
        }
      });
      // 🌐 Domínio / 🖥️ Hospedagem vencendo ≤60d
      const venc = (obj, icon, rotulo, kind) => {
        const d = this.diasAte(obj && obj.vencimento);
        if (d != null && d <= 60) add(d <= 15 ? 'alta' : 'media', d, icon, rotulo + (d < 0 ? ' venceu há ' + (-d) + 'd' : ' vence ' + (d === 0 ? 'hoje' : 'em ' + d + 'd')) + (obj.provedor ? ' · ' + obj.provedor : ''), kind, '', { acaoFicha: true });
      };
      venc(c.dominio, '🌐', 'Domínio', 'dom'); venc(c.hospedagem, '🖥️', 'Hospedagem', 'hosp');
      // 🔴 Saúde crítica
      const s = this.saudeCliente(c);
      if (s.score != null && s.score < 40) add('alta', 4, '🔴', 'Saúde crítica (' + s.score + '%) — revisar redes/site/objetivos', 'saude', '', { acaoFicha: true });
      // 📲 Responsáveis com rede pra seguir
      this.respComRede(c).filter(r => !r.seguindo).forEach(r => {
        const ig = this.igLink(r.instagram), li = this.liLink(r.linkedin);
        const href = ig || li; // abre Instagram se houver; senão LinkedIn
        const rede = ig ? ('@' + String(r.instagram).replace(/^@/, '')) : (li ? 'LinkedIn' : '');
        add('media', 40, '📲', 'Seguir ' + (r.nome || 'contato') + (rede ? ' (' + rede + ')' : ''), 'seguir', r.id, href ? { acaoLabel: ig ? 'Abrir Instagram' : 'Abrir LinkedIn', acaoHref: href } : { acaoFicha: true });
      });
      // 🎯 Metas batidas → renovar
      (c.objetivos || []).forEach(o => { if (o.nome && +o.alvo > 0 && this.progressoObj(o) >= 100) add('baixa', 70, '🎯', 'Meta "' + o.nome + '" batida — renovar objetivo', 'meta', o.id, { acaoFicha: true }); });
      // Lacunas de cadastro
      if (!(c.responsaveis || []).length) add('media', 50, '👥', 'Sem responsáveis cadastrados', 'lacuna', 'resp', { acaoFicha: true });
      if (!this.briefingItens(c).length) add('baixa', 80, '📋', 'Briefing vazio', 'lacuna', 'brief', { acaoFicha: true });
      if (!(c.documentos || []).length) add('baixa', 85, '📎', 'Sem documentos anexados', 'lacuna', 'docs', { acaoFicha: true });
      return out;
    },
    get radar() {
      const N = { alta: 0, media: 1, baixa: 2 }; const hoje = MD.today(); const snz = this.radarSnooze || {}; const items = [];
      (this.clients || []).filter(c => (c.status || 'Ativo') !== 'Inativo').forEach(c => this.pendenciasCliente(c).forEach(p => {
        const key = c.id + '|' + p.kind + '|' + p.ref;
        if (snz[key] && snz[key] > hoje) return; // resolvida/adiada e ainda no prazo
        items.push({ ...p, key, cliId: c.id, cliNome: c.empresa });
      }));
      items.sort((a, b) => (N[a.nivel] - N[b.nivel]) || (a.ord - b.ord) || a.cliNome.localeCompare(b.cliNome));
      return items;
    },
    get radarUrgentes() { return this.radar.filter(p => p.nivel === 'alta').length; },
    radarIr(p) { this.page = 'monitoramento'; this.busca = ''; this.abrirMonitor(p.cliId); this.$nextTick(() => { const el = document.querySelector('.ficha'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); },
    resolverPendencia(p, dias) {
      const d = new Date(); d.setDate(d.getDate() + (dias || 30));
      this.radarSnooze = { ...(this.radarSnooze || {}), [p.key]: d.toISOString().slice(0, 10) };
      MD.set('som_radar_snooze', this.radarSnooze);
    },
    // ── Timeline de relacionamento (vive em Cliente.dados.timeline) ──
    interIcon(t) { const m = TIPOS_INTER.find(x => x[0] === t); return m ? m[1] : '📝'; },
    fmtDataHora(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Recife', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; } },
    async persistirCliente(c) {
      const { id, ...dados } = c;
      try { await this.api('POST', '/clientes', { id, empresa: c.empresa, dados }); await this.carregarClientes(); }
      catch (e) { alert(e.message || 'Falha ao salvar o cliente.'); }
    },
    _logInteracao(c, tipo, texto, data) {
      if (!c) return; if (!Array.isArray(c.timeline)) c.timeline = [];
      // data (YYYY-MM-DD) opcional — ex.: reunião agendada/realizada noutro dia. Sem data = agora. Recife (UTC-3).
      const em = data ? new Date(data + 'T12:00:00-03:00').toISOString() : new Date().toISOString();
      c.timeline.unshift({ id: MD.uid(), em, tipo, texto, por: (this.usuario && this.usuario.nome) || '' });
      this.registrarProducao('atendimento', tipo + (c.empresa ? (' · ' + c.empresa) : ''));
      return this.persistirCliente(c);
    },
    async registrarProducao(tipo, descricao, valor) { try { await this.api('POST', '/producao', { tipo, descricao, valor }); } catch {} },
    async addInteracao() {
      const c = this.monitorCliente; if (!c) return;
      const t = (this.novaInter.texto || '').trim(); if (!t) return alert('Escreva o que aconteceu.');
      await this._logInteracao(c, this.novaInter.tipo, t, this.novaInter.data);
      this.novaInter = { tipo: 'Ligação', texto: '', data: '' };
    },
    async removerInteracao(c, id) {
      if (!c || !confirm('Remover este registro do histórico?')) return;
      c.timeline = (c.timeline || []).filter(x => x.id !== id);
      await this.persistirCliente(c);
    },
    // Edição de um registro do histórico (só admin).
    iniciarEditInter(ev) { this.editInter = ev.id; this.editInterTexto = ev.texto || ''; },
    cancelarEditInter() { this.editInter = null; this.editInterTexto = ''; },
    async salvarEditInter(c, ev) {
      const t = (this.editInterTexto || '').trim(); if (!t) return alert('O texto não pode ficar vazio.');
      ev.texto = t; ev.editadoEm = new Date().toISOString(); ev.editadoPor = (this.usuario && this.usuario.nome) || '';
      this.editInter = null; this.editInterTexto = '';
      await this.persistirCliente(c);
    },
    // Registra automaticamente a ação feita pelo Radar (parabéns, seguir…) no histórico do cliente
    toggleRadarAutolog() { this.radarAutolog = !this.radarAutolog; MD.set('som_radar_autolog', this.radarAutolog); },
    registrarAcaoRadar(p) {
      if (!this.radarAutolog) return; // auto-registro desligado pelo usuário
      const c = (this.clients || []).find(x => x.id === p.cliId); if (!c) return;
      const tipo = p.kind === 'aniver' ? 'WhatsApp' : 'Nota';
      const texto = p.kind === 'aniver' ? '🎂 Parabenizou pelo aniversário (via Radar)' : p.kind === 'seguir' ? '📲 Abriu o perfil pra seguir (via Radar)' : '✅ ' + p.txt;
      this._logInteracao(c, tipo, texto);
    },
    // ── Perfil do cliente (uso interno — baliza os contatos) ──
    perfilCliente(c) {
      const b = c.briefing || {}, P = b.publico || {}, PO = b.posicionamento || {}, CR = b.criativo || {};
      const blocos = []; const add = (icon, titulo, texto) => { if (texto && String(texto).trim()) blocos.push({ icon, titulo, texto: String(texto) }); };
      add('🏢', 'Quem é', PO.descricao);
      add('🎯', 'Público', [P.alvo, P.faixaEtaria && ('faixa ' + P.faixaEtaria), P.sexo].filter(Boolean).join(' · '));
      add('🗣️', 'Como abordar', [CR.linguagem && ('linguagem ' + CR.linguagem), CR.evitar && ('evitar: ' + CR.evitar), CR.hashtags && ('tom/slogan: ' + CR.hashtags)].filter(Boolean).join(' · '));
      add('💡', 'Contexto comercial', [PO.recorrencia && ('recorrência ' + PO.recorrencia), PO.cicloVenda && ('ciclo de venda ' + PO.cicloVenda), PO.percepcao, PO.concorrentes && ('concorrentes: ' + PO.concorrentes)].filter(Boolean).join(' · '));
      add('📈', 'Objetivos', (c.objetivos || []).map(o => o.nome).filter(Boolean).join(', '));
      const pessoas = (c.responsaveis || []).map(r => {
        const p = [r.nome]; if (r.cargo) p.push('(' + r.cargo + ')');
        const d = this.diasAniver(r.nascimento); if (d != null && d <= 30) p.push('🎂 ' + (d === 0 ? 'hoje' : 'em ' + d + 'd'));
        if (r.notas) p.push('— ' + r.notas);
        return p.join(' ');
      }).filter(Boolean).join(' · ');
      add('🤝', 'Pessoas-chave', pessoas);
      add('📅', 'Datas relevantes', [CR.datasComemorativas, CR.datasSegmento].filter(Boolean).join(' · '));
      const s = this.saudeCliente(c); const serv = this.clienteServicos(c).join(', ');
      add('🩺', 'Situação', [s.sinal + (s.score != null ? ' ' + s.score + '% de saúde' : ''), serv && ('serviços: ' + serv)].filter(Boolean).join(' · '));
      return blocos;
    },
    diasAniver(nasc) { if (!nasc) return null; const d = new Date(nasc + 'T00:00:00'); if (isNaN(d.getTime())) return null; const h = new Date(); h.setHours(0, 0, 0, 0); let p = new Date(h.getFullYear(), d.getMonth(), d.getDate()); if (p < h) p = new Date(h.getFullYear() + 1, d.getMonth(), d.getDate()); return Math.round((p - h) / 86400000); },
    idadeDe(nasc) { if (!nasc) return null; const d = new Date(nasc + 'T00:00:00'); if (isNaN(d.getTime())) return null; const h = new Date(); let a = h.getFullYear() - d.getFullYear(); const m = h.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && h.getDate() < d.getDate())) a--; return a; },
    mediaRedes(c) { const rs = this.redesDoCliente(c).filter(r => r.id !== 'gmn'); return rs.length ? Math.round(rs.reduce((a, r) => a + (+c.redes[r.id].score || 0), 0) / rs.length) : 0; }, // GMN é nota 0–5, não % — fica fora da média
    get monitorCliente() { const list = this.clientesFiltrados; if (!list.length) return null; return list.find(c => c.id === this.monitorSel) || list[0]; },
    async abrirMonitor(id) { this.monitorSel = id; await this.carregarCredenciais(id); this.carregarMetaStatus(id); },
    // ── Monitoramento Meta (Instagram/Facebook) — OAuth por cliente ──
    async conectarMeta(clienteId) {
      if (!clienteId) return;
      this.metaBusy = true;
      try {
        const { url } = await this.api('GET', '/monitoramento/meta/connect?clienteId=' + clienteId);
        localStorage.setItem('som_meta_cli', clienteId); // reabrir o cliente no retorno
        window.location.href = url; // vai pro login/consentimento da Meta; volta no callback
      } catch (e) { this.mostrarToast('Erro ao conectar: ' + e.message); this.metaBusy = false; }
    },
    async carregarMetaStatus(clienteId) {
      if (!clienteId) return;
      try { this.metaStatus = { ...this.metaStatus, [clienteId]: await this.api('GET', '/monitoramento/meta/status/' + clienteId) }; }
      catch { this.metaStatus = { ...this.metaStatus, [clienteId]: { conectado: false } }; }
      if (this.metaStatus[clienteId] && this.metaStatus[clienteId].conectado) this.carregarMetaMetricas(clienteId);
    },
    async carregarMetaMetricas(clienteId) {
      if (!clienteId) return;
      this.metaBusy = true;
      try { this.metaMetricas = { ...this.metaMetricas, [clienteId]: await this.api('GET', '/monitoramento/meta/' + clienteId) }; }
      catch (e) { this.metaMetricas = { ...this.metaMetricas, [clienteId]: { erro: e.message } }; }
      finally { this.metaBusy = false; }
    },
    async desconectarMeta(clienteId) {
      if (!confirm('Desconectar a conta Meta deste cliente?')) return;
      try {
        await this.api('POST', '/monitoramento/meta/desconectar/' + clienteId);
        this.metaStatus = { ...this.metaStatus, [clienteId]: { conectado: false } };
        this.metaMetricas = { ...this.metaMetricas, [clienteId]: null };
        this.mostrarToast('Conta Meta desconectada.');
      } catch (e) { this.mostrarToast('Erro: ' + e.message); }
    },
    async carregarCredenciais(clienteId) {
      this.revelar = {}; this.cofreRevelado = {};
      if (!clienteId) { this.credenciais = []; return; }
      try { this.credenciais = (await this.api('GET', '/credenciais/cliente/' + clienteId)) || []; } catch { this.credenciais = []; }
      if (this.cofreMasterDef === null) { try { this.cofreMasterDef = (await this.api('GET', '/credenciais/master/status')).definida; } catch {} }
      if (this.cofreMaster) await this._revelarCofre(clienteId);
    },
    // ── Cofre / senha master ──
    get cofreDesbloqueado() { return !!this.cofreMaster; },
    senhaCred(cr) { return this.cofreRevelado[cr.id]; },
    async _revelarCofre(clienteId) {
      try {
        const r = await this.api('POST', '/credenciais/revelar', { clienteId, master: this.cofreMaster });
        const map = {}; (r || []).forEach(x => { map[x.id] = x.senha; }); this.cofreRevelado = map; return true;
      } catch (e) { this.cofreMaster = ''; this.cofreRevelado = {}; this.cofreMsg = e.message || 'Senha master incorreta.'; return false; }
    },
    async abrirCofre() {
      this.cofreA = ''; this.cofreB = ''; this.cofreAtual = ''; this.cofreMsg = '';
      if (this.cofreMasterDef === null) { try { this.cofreMasterDef = (await this.api('GET', '/credenciais/master/status')).definida; } catch {} }
      this.cofreModal = this.cofreMasterDef ? 'desbloquear' : 'definir';
    },
    abrirTrocaMaster() { this.cofreA = ''; this.cofreB = ''; this.cofreAtual = ''; this.cofreMsg = ''; this.cofreModal = 'trocar'; },
    bloquearCofre() { this.cofreMaster = ''; this.cofreRevelado = {}; this.revelar = {}; },
    async confirmarCofre() {
      const m = this.cofreModal;
      if (m === 'desbloquear') {
        if (!this.cofreA) { this.cofreMsg = 'Digite a senha master.'; return; }
        this.cofreMaster = this.cofreA;
        if (await this._revelarCofre(this.monitorCliente.id)) this.cofreModal = null;
      } else { // definir ou trocar
        if (!this.cofreA || this.cofreA.length < 6) { this.cofreMsg = 'A senha master precisa de ao menos 6 caracteres.'; return; }
        if (this.cofreA !== this.cofreB) { this.cofreMsg = 'As senhas não conferem.'; return; }
        try {
          await this.api('POST', '/credenciais/master', { nova: this.cofreA, atual: this.cofreAtual || '' });
          this.cofreMasterDef = true; this.cofreMaster = this.cofreA;
          await this._revelarCofre(this.monitorCliente.id); this.cofreModal = null;
        } catch (e) { this.cofreMsg = e.message || 'Falha ao salvar a senha master.'; }
      }
    },
    novaCredencial() { const c = this.monitorCliente; this.credForm = { id: '', clienteId: c && c.id, item: 'Instagram', login: '', senha: '', url: '', notas: '' }; this.credModal = true; },
    editarCredencial(c) { this.credForm = { ...c, senha: '' }; this.credModal = true; },
    async salvarCredencial() { const f = this.credForm; if (!f.clienteId && this.monitorCliente) f.clienteId = this.monitorCliente.id; if (!f.item) return alert('Informe o item.'); try { await this.api('POST', '/credenciais', f); await this.carregarCredenciais(f.clienteId); this.credModal = false; } catch (e) { alert(e.message); } },
    async excluirCredencial(c) { if (!confirm('Excluir o acesso "' + (c.item || '') + '"?')) return; try { await this.api('DELETE', '/credenciais/' + c.id); await this.carregarCredenciais(c.clienteId); } catch (e) { alert(e.message); } },
    async salvarCliente() {
      const e = this.editing;
      if (!e.empresa) return alert('Informe o nome/empresa do cliente.');
      // 1º contato vira o contato principal (mantém busca/CRM/ficha funcionando).
      const r0 = (e.responsaveis || [])[0];
      if (r0) { e.contato = r0.nome || e.contato; e.cargo = r0.cargo || e.cargo; e.email = r0.email || e.email; e.whatsapp = r0.whatsapp || e.whatsapp; e.instagram = r0.instagram || e.instagram; }
      const { id, ...dados } = e;
      try {
        await this.api('POST', '/clientes', { id: id || undefined, empresa: e.empresa, dados });
        if (this._onbConvertendo) { // veio de um onboarding → tira da fila (marca convertido)
          try { await this.api('POST', '/onboarding/admin/' + this._onbConvertendo + '/convertido', {}); } catch {}
          this._onbConvertendo = null; this.carregarOnboardings();
        }
        if (this._leadConvertendo) { // veio de um lead → marca o lead como Ganho
          const l = (this.leads || []).find(x => x.id === this._leadConvertendo);
          if (l && l.stage !== 'Ganho') { l.stage = 'Ganho'; this.salvarLeadApi(l).catch(() => {}); this.registrarProducao('negocio', l.empresa || '', +l.valor || 0); }
          this._leadConvertendo = null;
        }
        await this.carregarClientes(); this.modal = null;
      } catch (err) { alert(err.message || 'Falha ao salvar o cliente.'); }
    },
    async excluirCliente(c) {
      if (!confirm('Excluir o cliente ' + c.empresa + '?')) return;
      try { await this.api('DELETE', '/clientes/' + c.id); await this.carregarClientes(); this.modal = null; }
      catch (err) { alert(err.message || 'Falha ao excluir.'); }
    },

    // Auto-preenchimento por CNPJ (BrasilAPI) — usado em cliente e lead
    async buscarCnpj() {
      const raw = (this.editing.cnpj || '').replace(/\D/g, '');
      if (raw.length !== 14) { this.cnpjMsg = '⚠ Digite os 14 dígitos do CNPJ.'; return; }
      if (!validCNPJ(raw)) { this.cnpjMsg = '⚠ CNPJ inválido (dígitos não conferem).'; return; }
      this.cnpjLoading = true; this.cnpjMsg = 'Buscando na Receita…';
      try {
        const r = await fetch('https://brasilapi.com.br/api/cnpj/v1/' + raw);
        if (!r.ok) throw new Error(r.status === 404 ? 'CNPJ não encontrado.' : 'Falha na consulta (' + r.status + ').');
        const d = await r.json(); const e = this.editing;
        e.cnpj = fmtCNPJ(raw);
        e.razaoSocial = d.razao_social || e.razaoSocial;
        e.empresa = d.nome_fantasia || d.razao_social || e.empresa;
        // endereço estruturado (quando o objeto tiver esses campos — cliente)
        if ('cep' in e && d.cep) e.cep = String(d.cep).replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2');
        if ('logradouro' in e) e.logradouro = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ') || e.logradouro;
        if ('numero' in e && d.numero) e.numero = d.numero;
        if ('complemento' in e && d.complemento) e.complemento = d.complemento;
        if ('bairro' in e && d.bairro) e.bairro = d.bairro;
        if ('uf' in e && d.uf) e.uf = d.uf;
        e.cidade = d.municipio || e.cidade;
        if ('endereco' in e) e.endereco = [d.descricao_tipo_de_logradouro, d.logradouro, d.numero, d.bairro].filter(Boolean).join(', ') || e.endereco; // legado (lead)
        if (!e.email && d.email) e.email = String(d.email).toLowerCase();
        if (!e.whatsapp && d.ddd_telefone_1) e.whatsapp = String(d.ddd_telefone_1).replace(/\D/g, '');
        if (!e.contato && Array.isArray(d.qsa) && d.qsa[0]) e.contato = d.qsa[0].nome_socio || '';
        this.cnpjMsg = '✓ Receita ok — varrendo a internet (site, redes, Google)…';
        // 2) Varredura na internet: acha site/redes/GMN/telefone/SEO pelo nome+cidade e preenche o resto.
        await this.varrerInternet(e);
      } catch (err) { this.cnpjMsg = '⚠ ' + (err.message || 'Não foi possível consultar.'); }
      finally { this.cnpjLoading = false; }
    },
    // Sweep da internet (usado pela lupa do CNPJ e disponível avulso) — preenche só o que está vazio.
    async varrerInternet(e) {
      try {
        const x = await this.api('POST', '/clientes/descobrir', { empresa: e.empresa || e.razaoSocial || '', cidade: e.cidade || '', uf: e.uf || '', site: (e.site && e.site.url) || '' });
        if (!x) return;
        const achou = [];
        if (x.site && x.site.url) {
          e.site = { ...(e.site || {}), url: (e.site && e.site.url) || x.site.url, seo: (e.site && e.site.seo) || x.site.seo || 0, sgo: (e.site && e.site.sgo) || x.site.sgo || 0 };
          achou.push('site');
        }
        if (x.redes && Object.keys(x.redes).length) {
          e.redes = e.redes || {};
          for (const k in x.redes) {
            const atual = e.redes[k] || {};
            if (!atual.url && !atual.score) e.redes[k] = { ...atual, ...x.redes[k] };
          }
          achou.push('redes');
        }
        if (x.gmn) { e.gmn = { ...(e.gmn || {}), ...x.gmn }; achou.push('Google'); }
        if (x.dominio && !(e.dominio && e.dominio.provedor)) e.dominio = { ...(e.dominio || {}), ...x.dominio };
        if (x.hospedagem && !(e.hospedagem && e.hospedagem.provedor)) e.hospedagem = { ...(e.hospedagem || {}), ...x.hospedagem };
        if (!e.whatsapp && x.telefone) e.whatsapp = String(x.telefone).replace(/\D/g, '');
        if (!e.email && x.email) e.email = x.email;
        this.cnpjMsg = '✓ Preenchido — Receita + varredura' + (achou.length ? ' (' + achou.join(', ') + ')' : ' (nada extra encontrado online)');
      } catch (err) { /* mantém o que a Receita já preencheu */ }
    },

    // Auto-preenche o endereço a partir do CEP (BrasilAPI, com fallback ViaCEP).
    async buscarCep() {
      const raw = (this.editing.cep || '').replace(/\D/g, '');
      if (raw.length !== 8) { this.cepMsg = '⚠ CEP precisa ter 8 dígitos.'; return; }
      this.cepLoading = true; this.cepMsg = 'Buscando endereço…';
      const e = this.editing;
      e.cep = raw.replace(/^(\d{5})(\d{3})$/, '$1-$2');
      try {
        let rua, bairro, cidade, uf;
        const r = await fetch('https://brasilapi.com.br/api/cep/v2/' + raw);
        if (r.ok) { const d = await r.json(); rua = d.street; bairro = d.neighborhood; cidade = d.city; uf = d.state; }
        else { // fallback ViaCEP
          const r2 = await fetch('https://viacep.com.br/ws/' + raw + '/json/');
          const d2 = await r2.json();
          if (d2.erro) throw new Error('CEP não encontrado.');
          rua = d2.logradouro; bairro = d2.bairro; cidade = d2.localidade; uf = d2.uf;
        }
        if (rua) e.logradouro = rua;
        if (bairro) e.bairro = bairro;
        if (cidade) e.cidade = cidade;
        if (uf) e.uf = uf;
        this.cepMsg = '✓ ' + [rua, bairro].filter(Boolean).join(', ') + ' — ' + [cidade, uf].filter(Boolean).join('/');
      } catch (err) { this.cepMsg = '⚠ ' + (err.message || 'Não foi possível consultar o CEP.'); }
      finally { this.cepLoading = false; }
    },

    // ───────────────── FINANCEIRO ─────────────────
    get financeFiltrado() { const q = this.busca.toLowerCase(); return [...this.finance].filter(f => this._finNoMes(f)).sort((a, b) => (a.vencimento || a.data || '').localeCompare(b.vencimento || b.data || '')).filter(f => !q || ((f.descricao || '') + ' ' + (f.cliente || '') + ' ' + (f.categoria || '') + ' ' + (f.tipo || '')).toLowerCase().includes(q)); },
    novoLancamento(tipo = 'receita') { this.editing = { id: '', tipo, descricao: '', valor: 0, categoria: tipo === 'receita' ? 'Mensalidade' : 'Ferramentas', cliente: '', fornecedor: '', emailCobranca: '', whatsappCobranca: '', obs: '', status: 'pendente', vencimento: MD.today(), data: MD.today() }; this.modal = 'finance'; },
    editarLancamento(f) { this.editing = { ...f }; this.modal = 'finance'; },
    salvarLancamento() {
      const e = this.editing; if (!e.descricao) return alert('Informe a descrição.');
      if (e.id) { const i = this.finance.findIndex(x => x.id === e.id); if (i > -1) this.finance[i] = { ...e }; }
      else { e.id = MD.uid(); this.finance.unshift({ ...e }); }
      this.persist('finance', this.finance); this.modal = null;
    },
    // dd/mm/aaaa -> aaaa-mm-dd (retorna '' se inválido)
    _parseDataBR(s) { const m = String(s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (!m) return ''; const d = m[1].padStart(2, '0'), mo = m[2].padStart(2, '0'); return `${m[3]}-${mo}-${d}`; },
    togglePago(f) {
      if (f.status === 'pago') { f.status = 'pendente'; delete f.pagoEm; this.persist('finance', this.finance); return; }
      // Abre o modal com calendário (antes era um prompt de texto dd/mm/aaaa).
      this.pagoEdit = { lancId: f.id, descricao: f.descricao, tipo: f.tipo, data: MD.today() };
      this.modal = 'pago';
    },
    confirmarPago() {
      const pe = this.pagoEdit; if (!pe.data) return alert('Escolha a data.');
      const f = this.finance.find(x => x.id === pe.lancId); if (!f) { this.modal = null; return; }
      f.pagoEm = pe.data; f.status = 'pago';
      this.persist('finance', this.finance); this.modal = null;
    },
    excluirLancamento(f) { if (!confirm('Excluir este lançamento?')) return; this.finance = this.finance.filter(x => x.id !== f.id); this.persist('finance', this.finance); this.modal = null; },

    // ───────────────── FORNECEDORES (despesas) ─────────────────
    get fornecedoresOrd() { const q = this.busca.toLowerCase(); return [...this.fornecedores].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')).filter(f => !q || ((f.nome || '') + ' ' + (f.categoria || '') + ' ' + (f.cnpjCpf || '')).toLowerCase().includes(q)); },
    novoFornecedor() { this.fornForm = { id: '', nome: '', cnpjCpf: '', categoria: 'Ferramentas/SaaS', email: '', whatsapp: '', chavePix: '', site: '', obs: '' }; this.modal = 'fornecedor'; },
    editarFornecedor(f) { this.fornForm = { ...f }; this.modal = 'fornecedor'; },
    salvarFornecedor() {
      const e = this.fornForm; if (!e.nome) return alert('Informe o nome do fornecedor.');
      if (e.id) { const i = this.fornecedores.findIndex(x => x.id === e.id); if (i > -1) this.fornecedores[i] = { ...e }; }
      else { e.id = MD.uid(); this.fornecedores.push({ ...e }); }
      this.persist('fornecedores', this.fornecedores); this.modal = null;
    },
    excluirFornecedor(f) { if (!confirm('Excluir o fornecedor "' + (f.nome || '') + '"?')) return; this.fornecedores = this.fornecedores.filter(x => x.id !== f.id); this.persist('fornecedores', this.fornecedores); this.modal = null; },

    // ───────────────── COBRANÇA (fatura, boleto Banco Inter, e-mail, zap) ─────────────────
    // Nº legível do lançamento (fatura/boleto)
    numLancamento(f) { return 'FAT-' + String(f.id || '').replace(/\D/g, '').slice(-6).padStart(6, '0').toUpperCase(); },
    // Fatura — documento client-side (imprime / Salvar como PDF)
    gerarFatura(f) {
      const w = window.open('', '_blank');
      if (!w) return alert('Permita pop-ups neste site pra gerar a fatura.');
      w.document.write(this._faturaHTML(f)); w.document.close(); w.focus();
      setTimeout(() => { try { w.print(); } catch (e) {} }, 350);
    },
    _faturaHTML(f) {
      const e = this._esc, num = this.numLancamento(f);
      const linha = (l, v) => v ? `<div class="meta-row"><span>${e(l)}</span><b>${e(v)}</b></div>` : '';
      const pagto = [];
      if (f.linhaDigitavel) pagto.push(`<div class="bloco"><b>Boleto — linha digitável</b>${e(f.linhaDigitavel)}</div>`);
      if (f.boletoUrl) pagto.push(`<div class="bloco"><b>Boleto (link)</b><a href="${e(f.boletoUrl)}">${e(f.boletoUrl)}</a></div>`);
      if (EMPRESA.pix) pagto.push(`<div class="bloco"><b>PIX</b>${e(EMPRESA.pix)}</div>`);
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fatura ${e(num)}</title>
<style>${this._cssDoc()}
.fat-wrap{display:flex;justify-content:space-between;gap:30px;flex-wrap:wrap;margin-top:6px}
.meta-row{display:flex;justify-content:space-between;gap:18px;padding:7px 0;border-bottom:1px solid #eee;font-size:13px}.meta-row b{color:#141414}
.fat-total{margin:22px 0;background:#141414;color:#fff;border-radius:14px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center}.fat-total span{font-size:12px;letter-spacing:2px;color:#C9A24B;font-weight:700}.fat-total b{font-size:28px;font-weight:800}
.pagto{background:#fafafa;border:1px solid #eee;border-radius:12px;padding:16px 18px;margin-top:8px}.pagto .bloco{margin:8px 0}.pagto a{color:#141414;word-break:break-all}</style></head>
<body>${this._docHead('FATURA', num, ['Emissão: ' + MD.fmtDate(MD.today()), 'Vencimento: ' + MD.fmtDate(f.vencimento)])}
<div class="pad">
<h2>Cobrança para</h2>
<div class="meta-cli"><b>${e(f.cliente || 'Cliente')}</b></div>
<h2>Descrição</h2>
${linha('Serviço / referência', f.descricao)}
${linha('Categoria', f.categoria)}
${linha('Vencimento', MD.fmtDate(f.vencimento))}
<div class="fat-total"><span>VALOR TOTAL</span><b>${e(MD.fmtCur(f.valor))}</b></div>
${pagto.length ? '<h2>Como pagar</h2><div class="pagto">' + pagto.join('') + '</div>' : ''}
${f.obs ? '<h2>Observações</h2><div class="pagto"><div class="bloco" style="white-space:pre-wrap">' + e(f.obs) + '</div></div>' : ''}
${this._docFoot()}
</div></body></html>`;
    },
    // Boleto via Banco Inter (backend) — chaves configuradas por último.
    // O Inter exige CPF/CNPJ e endereço do pagador: puxamos do cadastro do cliente.
    async gerarBoleto(f) {
      if (f.tipo !== 'receita') return alert('Boleto é gerado para receitas (cobrança de cliente).');
      const nome = ((f.cliente || '').trim().toLowerCase());
      const c = (this.clients || []).find(x => ((x.empresa || x.razaoSocial || '').trim().toLowerCase()) === nome) || {};
      const documento = String(f.documentoCobranca || c.cnpj || '').replace(/\D/g, '');
      if (!documento) return alert('O Banco Inter exige o CPF/CNPJ do pagador.\nCadastre o CNPJ do cliente "' + (f.cliente || '') + '" (aba Clientes) e gere de novo.');
      const endereco = { logradouro: c.logradouro || '', numero: c.numero || '', bairro: c.bairro || '', cidade: c.cidade || '', uf: c.uf || '', cep: String(c.cep || '').replace(/\D/g, '') };
      if (!confirm('Gerar boleto no Banco Inter para ' + (f.cliente || 'cliente') + ' — ' + MD.fmtCur(f.valor) + '?')) return;
      f._cobrando = 'boleto';
      try {
        const r = await this.api('POST', '/cobranca/boleto', { financeId: f.id, numero: this.numLancamento(f), cliente: f.cliente, documento, endereco, valor: +f.valor, vencimento: f.vencimento, descricao: f.descricao, email: f.emailCobranca || this._contatoCliente(f).email || '', whatsapp: f.whatsappCobranca });
        f.boletoUrl = r.url || ''; f.linhaDigitavel = r.linhaDigitavel || r.codigoBarras || ''; f.pix = r.pix || r.pixCopiaECola || ''; f.boletoId = r.id || '';
        this.persist('finance', this.finance);
        alert('Boleto gerado no Banco Inter!' + (f.linhaDigitavel ? '\nLinha digitável: ' + f.linhaDigitavel : ''));
      } catch (err) { alert('Não foi possível gerar o boleto: ' + err.message + '\n\n(Falta configurar as chaves do Banco Inter no backend — INTER_CLIENT_ID/SECRET/CERT/KEY.)'); }
      finally { f._cobrando = ''; }
    },
    // Cobrança por e-mail (Resend, backend) — chave por último
    // Acha o cliente do lançamento (pelo nome) e devolve o melhor contato cadastrado (zap/e-mail), com fallback no 1º responsável.
    _contatoCliente(f) {
      const nome = ((f && f.cliente) || '').trim().toLowerCase();
      if (!nome) return {};
      const c = (this.clients || []).find(x => ((x.empresa || x.razaoSocial || '').trim().toLowerCase()) === nome);
      if (!c) return {};
      const r0 = (c.responsaveis || [])[0] || {};
      return { whatsapp: c.whatsapp || c.telefone || r0.zap || r0.whatsapp || '', email: c.email || r0.email || '' };
    },
    async cobrarEmail(f) {
      const auto = this._contatoCliente(f).email; // puxa do cadastro do cliente se o lançamento não tiver
      const email = (f.emailCobranca || auto || prompt('E-mail do cliente para a cobrança:', '') || '').trim();
      if (!email) return;
      f.emailCobranca = email; this.persist('finance', this.finance);
      f._cobrando = 'email';
      try {
        await this.api('POST', '/cobranca/email', { financeId: f.id, numero: this.numLancamento(f), email, cliente: f.cliente, valor: +f.valor, vencimento: f.vencimento, descricao: f.descricao, boletoUrl: f.boletoUrl || '', linhaDigitavel: f.linhaDigitavel || '', pix: f.pix || '' });
        alert('Cobrança enviada por e-mail para ' + email + '.');
      } catch (err) { alert('Não foi possível enviar o e-mail: ' + err.message + '\n\n(Falta a chave Resend da Maracatu — deixamos pro final.)'); }
      finally { f._cobrando = ''; }
    },
    // Cobrança por WhatsApp — abre o wa.me com a mensagem pronta (funciona já, sem chave)
    cobrarWhatsApp(f) {
      const auto = this._contatoCliente(f).whatsapp; // puxa do cadastro do cliente se o lançamento não tiver
      const num = (f.whatsappCobranca || auto || prompt('WhatsApp do cliente (com DDD):', '') || '').trim();
      if (!num) return;
      f.whatsappCobranca = num; this.persist('finance', this.finance);
      const linhas = ['Olá! Tudo bem? Segue a cobrança da ' + EMPRESA.nome + ':', '', '*' + (f.descricao || 'Serviço') + '*', 'Valor: ' + MD.fmtCur(f.valor), 'Vencimento: ' + MD.fmtDate(f.vencimento)];
      if (f.linhaDigitavel) linhas.push('', 'Linha digitável do boleto:', f.linhaDigitavel);
      if (f.boletoUrl) linhas.push('', 'Boleto: ' + f.boletoUrl);
      window.open(this.waLink(num) + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank');
    },
    // ── helpers do card de lançamento (estilo SIAGO) ──
    finStatus(f) {
      if (f.status === 'pago') return { label: 'Pago', style: 'background:#dcfce7;color:#16a34a' };
      if (f.vencimento && f.vencimento < MD.today()) return { label: 'Vencido', style: 'background:#fee2e2;color:#b91c1c' };
      return { label: f.tipo === 'receita' ? 'A receber' : 'A pagar', style: 'background:#fef3c7;color:#a16207' };
    },
    finDotCor(f) { return f.status === 'pago' ? '#16a34a' : (f.vencimento && f.vencimento < MD.today()) ? '#dc2626' : '#C9A24B'; },
    // Fundo do card: recebido/pago = verde clarinho · atrasado = vermelho clarinho · pendente no prazo = padrão.
    finCardBg(f) {
      if (f.status === 'pago') return '#f0fdf4';
      if (f.vencimento && f.vencimento < MD.today()) return '#fef2f2';
      return '';
    },
    finCardBorder(f) {
      const bg = this.finCardBg(f);
      return 'border-left:3px solid ' + this.finDotCor(f) + (bg ? ';background:' + bg : '');
    },
    copiar(txt, label) { if (!txt) return; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => alert((label || 'Texto') + ' copiado!')).catch(() => prompt('Copie:', txt)); },
    abrirUrl(u) { if (u) window.open(u, '_blank'); else alert('Sem link disponível.'); },
    // Base da série de um lançamento de contrato: tira o sufixo " (n/N)" da
    // descrição, sobrando "Contrato Nº — Cliente". Faturas da mesma série batem.
    _serieBase(desc) { return String(desc || '').replace(/\s*\(\d+\/\d+\)\s*$/, '').trim(); },
    alterarVencimento(f) {
      const base = this._serieBase(f.descricao);
      // Tem faturas SEGUINTES na mesma série (pendentes, venc > esta)?
      const temFuturas = this.finance.some(x => x.id !== f.id && x.tipo === 'receita' && x.status !== 'pago'
        && this._serieBase(x.descricao) === base && (x.vencimento || '') > (f.vencimento || ''));
      this.vencEdit = { lancId: f.id, descricao: f.descricao, base, vencAntigo: f.vencimento || '', nova: f.vencimento || MD.today(), futuras: false, temFuturas };
      this.modal = 'venc';
    },
    salvarVencimento() {
      const ve = this.vencEdit; if (!ve.nova) return alert('Escolha a nova data de vencimento.');
      const f = this.finance.find(x => x.id === ve.lancId); if (!f) { this.modal = null; return; }
      f.vencimento = ve.nova;
      let n = 0;
      if (ve.futuras && ve.temFuturas) {
        const dia = Number(ve.nova.slice(8, 10));
        this.finance.forEach(x => {
          if (x.id === f.id || x.tipo !== 'receita' || x.status === 'pago' || x.boletoId) return; // pagas/com boleto emitido: intactas
          if (this._serieBase(x.descricao) !== ve.base) return;
          if (!((x.vencimento || '') > ve.vencAntigo)) return; // só as seguintes
          const [yy, mm] = x.vencimento.split('-').map(Number);
          const ultimo = new Date(yy, mm, 0).getDate(); // último dia do mês de x
          x.vencimento = `${yy}-${String(mm).padStart(2, '0')}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`;
          n++;
        });
      }
      this.persist('finance', this.finance);
      this.modal = null;
      if (n > 0) alert(`Vencimento alterado. ${n} fatura(s) seguinte(s) também atualizada(s).`);
    },
    receberPagar(f) { this.togglePago(f); }, // "Receber"/"Pagar" = liquidar (pede a data)
    async sincronizarBoleto(f) {
      if (!f.boletoId) return alert('Boleto sem ID para sincronizar.');
      try { const r = await this.api('GET', '/cobranca/boleto/' + f.boletoId); if (r && (r.status === 'pago' || r.pago)) { f.status = 'pago'; if (!f.pagoEm) f.pagoEm = MD.today(); } this.persist('finance', this.finance); alert('Status sincronizado com o Banco Inter' + (r && r.situacao ? ' (' + r.situacao + ')' : '') + '.'); }
      catch (e) { alert('Sincronização indisponível — o Banco Inter ainda não está configurado no servidor.'); }
    },
    // Abre o PDF do boleto (o Inter entrega em base64 por chamada autenticada).
    async baixarBoletoPdf(f) {
      if (!f.boletoId) return alert('Boleto sem ID.');
      try {
        const r = await this.api('GET', '/cobranca/' + f.boletoId + '/pdf');
        if (!r || !r.pdf) return alert('PDF indisponível.');
        const w = window.open('');
        if (!w) return alert('Permita pop-ups pra abrir o PDF.');
        w.document.write('<iframe src="data:application/pdf;base64,' + r.pdf + '" style="width:100%;height:100vh;border:0"></iframe>');
        w.document.close();
      } catch (e) { alert('Não foi possível obter o PDF: ' + e.message); }
    },
    async cancelarBoleto(f) {
      if (!confirm('Cancelar o boleto deste lançamento?')) return;
      try { await this.api('DELETE', '/cobranca/boleto/' + (f.boletoId || 'x')); } catch (e) { /* limpa local mesmo se o backend não responder */ }
      f.boletoUrl = ''; f.linhaDigitavel = ''; f.pix = ''; f.boletoId = ''; this.persist('finance', this.finance);
    },
    // ── Acréscimo / desconto num lançamento ──
    ajusteForm: { f: null, tipo: 'acrescimo', valor: 0, motivo: '' },
    abrirAjuste(f) { this.ajusteForm = { f, tipo: 'acrescimo', valor: 0, motivo: '' }; this.modal = 'ajuste'; },
    get ajusteNovoValor() { const a = this.ajusteForm; if (!a.f) return 0; const v = +a.f.valor || 0, x = +a.valor || 0; return a.tipo === 'acrescimo' ? v + x : Math.max(0, v - x); },
    aplicarAjuste() {
      const a = this.ajusteForm; if (!a.f) return;
      const x = +a.valor || 0; if (x <= 0) return alert('Informe um valor maior que zero.');
      a.f.valor = this.ajusteNovoValor;
      a.f.ajustes = a.f.ajustes || []; a.f.ajustes.push({ tipo: a.tipo, valor: x, motivo: (a.motivo || '').trim(), em: MD.today() });
      this.persist('finance', this.finance); this.modal = null;
    },
    // ── Dashboard financeiro do cliente (popup ao clicar no nome) ──
    finClienteSel: '',
    abrirFinanceCliente(nome) { if (!nome) return; this.finClienteSel = nome; this.modal = 'finCliente'; },
    parcelaDesc(f) { const m = String(f && f.descricao || '').match(/\((\d+)\s*\/\s*(\d+)\)/); return m ? { n: +m[1], total: +m[2] } : null; },
    diasAtraso(f) { if (!f.pagoEm || !f.vencimento) return 0; return Math.round((new Date(f.pagoEm) - new Date(f.vencimento)) / 86400000); },
    get finClienteResumo() {
      const nome = this.finClienteSel, hoje = MD.today();
      const items = this.finance.filter(f => f.tipo === 'receita' && (f.cliente || '') === nome)
        .slice().sort((a, b) => (a.vencimento || a.data || '').localeCompare(b.vencimento || b.data || ''));
      const pagas = items.filter(f => f.status === 'pago');
      const pendentes = items.filter(f => f.status !== 'pago');
      const vencidas = pendentes.filter(f => f.vencimento && f.vencimento < hoje);
      const aVencer = pendentes.filter(f => !f.vencimento || f.vencimento >= hoje);
      const pagasAtraso = pagas.filter(f => f.pagoEm && f.vencimento && f.pagoEm > f.vencimento);
      const sum = arr => arr.reduce((a, f) => a + (+f.valor || 0), 0);
      return {
        nome, items,
        total: items.length, qtdPagas: pagas.length, qtdPendentes: pendentes.length,
        qtdVencidas: vencidas.length, qtdPagasAtraso: pagasAtraso.length,
        totalPago: sum(pagas), totalAReceber: sum(pendentes), totalVencido: sum(vencidas), totalGeral: sum(items),
        proxima: pendentes[0] || null,                          // parcela atual a pagar (mais antiga em aberto)
        ultima: items.length ? items[items.length - 1] : null,  // última parcela (data-fim)
        pontualidade: pagas.length ? Math.round((pagas.length - pagasAtraso.length) / pagas.length * 100) : null,
      };
    },

    // ───────────────── OPERACIONAL: projetos ─────────────────
    projetosDoStatus(s) { const q = this.busca.toLowerCase(); return this.projects.filter(p => p.status === s && (!q || (p.nome + ' ' + p.cliente).toLowerCase().includes(q))); },
    // ───────────────── QUADROS (Trello — vários, editáveis) ─────────────────
    async carregarBoards() {
      try { const r = await this.api('GET', '/config/ui.boards'); this.boards = (r && r.valor) ? JSON.parse(r.valor) : []; } catch { this.boards = []; }
      if (!Array.isArray(this.boards) || !this.boards.length) { this.boards = [BOARD_PADRAO()]; this.salvarBoards(); }
      if (!this.boardSel || !this.boards.find(b => b.id === this.boardSel)) this.boardSel = this.boards[0].id;
    },
    salvarBoards() { try { this.api('PUT', '/config/ui.boards', { valor: JSON.stringify(this.boards) }); } catch (e) { } },
    get boardAtual() { return this.boards.find(b => b.id === this.boardSel) || this.boards[0] || BOARD_PADRAO(); },
    projBoardId(p) { return p.boardId || 'geral'; }, // projetos antigos (sem boardId) caem no quadro 'Geral'
    projetosDoBoard(bid) { return this.projects.filter(p => this.projBoardId(p) === bid); },
    projetosDoBoardStatus(colNome) { const q = this.busca.toLowerCase(); return this.projects.filter(p => this.projBoardId(p) === this.boardSel && (p.status || 'A Fazer') === colNome && !p.arquivado && (!q || ((p.nome || '') + ' ' + (p.tema || '') + ' ' + (p.cliente || '')).toLowerCase().includes(q))); },
    // Resultados da busca no Operacional — INCLUI os arquivados (o board os esconde). Arquivados vão pro fim.
    get buscaCards() { const q = (this.busca || '').toLowerCase().trim(); if (!q || this.page !== 'operacional') return []; return this.projects.filter(p => this.projBoardId(p) === this.boardSel && ((p.nome || '') + ' ' + (p.tema || '') + ' ' + (p.cliente || '')).toLowerCase().includes(q)).sort((a, b) => (a.arquivado ? 1 : 0) - (b.arquivado ? 1 : 0)); },
    async arquivarCard() { const p = this.cardRef; if (!p) return; p.arquivado = !p.arquivado; try { await this.salvarProjetoApi(p); } catch (e) { alert(e.message); } this.cardModal = false; },
    selecionarBoard(id) { this.boardSel = id; this.boardEdit = false; },
    novoBoard() {
      const nome = (prompt('Nome do novo quadro:', 'Novo quadro') || '').trim(); if (!nome) return;
      const id = 'b' + MD.uid();
      this.boards.push({ id, nome, colunas: [{ nome: 'A Fazer', cor: '#8a8ba3' }, { nome: 'Em Andamento', cor: '#2563eb' }, { nome: 'Concluído', cor: '#16a34a' }] });
      this.boardSel = id; this.boardEdit = false; this.salvarBoards();
    },
    renomearBoard() { const b = this.boardAtual; const nome = (prompt('Nome do quadro:', b.nome) || '').trim(); if (!nome) return; b.nome = nome; this.salvarBoards(); },
    async excluirBoard() {
      if (this.boards.length <= 1) return alert('Tem que existir ao menos um quadro.');
      const b = this.boardAtual, qtd = this.projetosDoBoard(b.id).length, outro = this.boards.find(x => x.id !== b.id);
      if (!confirm('Excluir o quadro "' + b.nome + '"?' + (qtd ? (' Os ' + qtd + ' projetos dele vão pro quadro "' + outro.nome + '".') : ''))) return;
      for (const p of this.projetosDoBoard(b.id)) { p.boardId = outro.id; try { await this.salvarProjetoApi(p); } catch { } }
      this.boards = this.boards.filter(x => x.id !== b.id); this.boardSel = outro.id; this.boardEdit = false; this.salvarBoards();
    },
    addColuna() { const b = this.boardAtual; const nome = (prompt('Nome da nova coluna:', 'Nova coluna') || '').trim(); if (!nome) return; if (b.colunas.some(c => c.nome === nome)) return alert('Já existe uma coluna com esse nome.'); b.colunas.push({ nome, cor: '#8a8ba3' }); this.salvarBoards(); },
    async renomearColuna(col) {
      const b = this.boardAtual; const nome = (prompt('Nome da coluna:', col.nome) || '').trim(); if (!nome || nome === col.nome) return;
      if (b.colunas.some(c => c.nome === nome)) return alert('Já existe uma coluna com esse nome.');
      const antigos = this.projetosDoBoardStatus(col.nome); col.nome = nome; this.salvarBoards();
      for (const p of antigos) { p.status = nome; try { await this.salvarProjetoApi(p); } catch { } } // migra os cards
    },
    async removerColuna(col) {
      const b = this.boardAtual; if (b.colunas.length <= 1) return alert('O quadro precisa de ao menos uma coluna.');
      const cards = this.projetosDoBoardStatus(col.nome), primeira = b.colunas.find(c => c.nome !== col.nome);
      if (!confirm('Remover a coluna "' + col.nome + '"?' + (cards.length ? (' Os ' + cards.length + ' cards vão pra "' + primeira.nome + '".') : ''))) return;
      for (const p of cards) { p.status = primeira.nome; try { await this.salvarProjetoApi(p); } catch { } }
      b.colunas = b.colunas.filter(c => c.nome !== col.nome); this.salvarBoards();
    },
    moverColuna(col, dir) { const b = this.boardAtual, i = b.colunas.indexOf(col), j = i + dir; if (j < 0 || j >= b.colunas.length) return; b.colunas.splice(i, 1); b.colunas.splice(j, 0, col); this.salvarBoards(); },
    projStatusInfo(s) { return PROJ_STATUS.find(x => x.id === s) || PROJ_STATUS[0]; },
    // ── Trello: etiquetas + arrastar ──
    labelCor(key) { const l = TRELLO_LABELS.find(x => x.key === key); return l ? l.cor : '#b3b9c4'; },
    labelTextCor(key) { return ['yellow', 'lime', 'sky'].includes(key) ? '#172b4d' : '#fff'; },
    toggleLabel(key) { if (!Array.isArray(this.editing.labels)) this.editing.labels = []; const i = this.editing.labels.indexOf(key); if (i >= 0) this.editing.labels.splice(i, 1); else this.editing.labels.push(key); },
    prazoCor(p) { if (!p.prazo || p.status === 'Concluído') return ''; const s = this.semanaAtual; if (p.prazo < s.ini) return '#eb5a46'; if (p.prazo <= s.fim) return '#ff9f1a'; return ''; },
    iniciais(nome) { return (nome || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase(); },
    // Cor distinta por MEMBRO (índice na equipe → paleta); fallback por hash do nome.
    avatarBg(nome) {
      const eq = this.equipe || [];
      let i = eq.findIndex(x => x.nome === nome);
      if (i < 0) { i = 0; const s = (nome || ''); for (let k = 0; k < s.length; k++) i = (i * 31 + s.charCodeAt(k)) >>> 0; }
      return AVATAR_CORES[i % AVATAR_CORES.length];
    },
    avatarFg() { return '#ffffff'; },
    onDropProjeto(status) { const p = this.projects.find(x => x.id === this.dragId); if (p && p.status !== status) this.moverProjeto(p, status); this.dragId = null; this.dropCol = null; },
    onDropColuna(alvoNome) {
      const b = this.boardAtual, from = b.colunas.findIndex(c => c.nome === this.dragColNome), to = b.colunas.findIndex(c => c.nome === alvoNome);
      if (from > -1 && to > -1 && from !== to) { const [col] = b.colunas.splice(from, 1); b.colunas.splice(to, 0, col); this.salvarBoards(); }
      this.dragColNome = ''; this.dropCol = null;
    },
    // ── Etiquetas nomeadas (compartilhadas) ──
    async carregarLabels() { try { const r = await this.api('GET', '/config/ui.labels'); this.labelNames = r && r.valor ? JSON.parse(r.valor) : {}; } catch { this.labelNames = {}; } },
    // ── Storage de arquivos (Cloudinary) ──
    async carregarCloud() { try { const r = await this.api('GET', '/config/ui.cloudinary'); this.cloudCfg = r && r.valor ? JSON.parse(r.valor) : { cloud: '', preset: '' }; } catch { } },
    async salvarCloud() { try { await this.api('PUT', '/config/ui.cloudinary', { valor: JSON.stringify({ cloud: (this.cloudCfg.cloud || '').trim(), preset: (this.cloudCfg.preset || '').trim() }) }); alert('Configuração salva! Agora dá pra subir arquivos.'); } catch (e) { alert(e.message); } },
    get cloudOk() { return !!(this.cloudCfg.cloud && this.cloudCfg.preset); },
    async uploadArquivo(file) {
      if (!file || !this.cloudOk) return null;
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', this.cloudCfg.preset);
      const r = await fetch('https://api.cloudinary.com/v1_1/' + this.cloudCfg.cloud + '/upload', { method: 'POST', body: fd });
      if (!r.ok) throw new Error('Falha no upload (' + r.status + ')');
      const d = await r.json(); return d.secure_url;
    },
    // sobe um arquivo e seta a URL em obj[campo] (usa Cloudinary; sem config, avisa)
    async uploadParaCampo(e, obj, campo, persistir) {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      if (!this.cloudOk) { alert('Configure o Cloudinary primeiro (Pessoal › Armazenamento de arquivos).'); e.target.value = ''; return; }
      this.uploadando = true;
      try { const url = await this.uploadArquivo(file); if (url) { obj[campo] = url; if (persistir) await persistir(); } }
      catch (err) { alert(err.message); } finally { this.uploadando = false; e.target.value = ''; }
    },
    async salvarLabels() { try { await this.api('PUT', '/config/ui.labels', { valor: JSON.stringify(this.labelNames) }); } catch (e) { alert(e.message); } },
    labelNome(key) { return this.labelNames[key] || ''; },
    // ── Card-detalhe estilo Trello (membros, etiquetas, checklist, data, descrição) ──
    abrirCard(p) {
      if (!this.equipe.length) this.carregarEquipe();
      if (!Array.isArray(p.labels)) p.labels = [];
      if (!Array.isArray(p.membros)) p.membros = [];
      if (!Array.isArray(p.checklist)) p.checklist = [];
      if (!Array.isArray(p.anexos)) p.anexos = [];
      if (!Array.isArray(p.comentarios)) p.comentarios = [];
      if (!Array.isArray(p.sessoes)) p.sessoes = [];
      this.cardRef = p; this.labelEdit = false; this.novoItemCheck = ''; this.novoComentario = ''; this.novoAnexoNome = ''; this.novoAnexoUrl = ''; this.cardModal = true;
      this.scrollChat();
      clearInterval(this._cronTick); this._cronTick = setInterval(() => { this.cronTick++; }, 1000); // cronômetro ao vivo
    },
    async salvarCard() { if (!this.cardRef) return; try { await this.salvarProjetoApi(this.cardRef); } catch (e) { alert(e.message); } },
    fecharCard() { clearInterval(this._cronTick); this.cardModal = false; this.carregarProjetos(); },
    // ── Cronômetro de produção (vira relatório de tempo) ──
    tempoSessao(p) { return p && p.cronInicio ? Math.max(0, Math.floor((Date.now() - new Date(p.cronInicio).getTime()) / 1000)) : 0; },
    tempoTotalCard(p) { return ((p && p.tempoTotal) || 0) + this.tempoSessao(p); },
    fmtDur(s) { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; const mm = String(m).padStart(2, '0'), xx = String(x).padStart(2, '0'); return h > 0 ? (h + ':' + mm + ':' + xx) : (mm + ':' + xx); },
    async iniciarProducao() {
      const p = this.cardRef; if (!p || p.cronInicio) return;
      p.cronInicio = new Date().toISOString(); p.cronAutor = (this.usuario && this.usuario.nome) || '';
      await this.salvarCard();
    },
    async pararProducao() {
      const p = this.cardRef; if (!p || !p.cronInicio) return;
      const seg = this.tempoSessao(p); if (!Array.isArray(p.sessoes)) p.sessoes = [];
      p.sessoes.push({ id: MD.uid(), autor: p.cronAutor || '', inicio: p.cronInicio, fim: new Date().toISOString(), segundos: seg });
      p.tempoTotal = (p.tempoTotal || 0) + seg; p.cronInicio = null; p.cronAutor = null;
      await this.salvarCard();
    },
    // ── Monitor global de mensagens (notifica mesmo com o card fechado) ──
    startChatMonitor() { if (this._chatMonitor) return; this._chatBaseline = false; this._chatSeen = {}; this._chatMonitor = setInterval(() => this.monitorChat(), 8000); this.monitorChat(); },
    async monitorChat() {
      if (!this.token) return;
      let rows; try { rows = await this.api('GET', '/projetos'); } catch { return; }
      const eu = (this.usuario && this.usuario.nome) || '';
      for (const r of (rows || [])) {
        const d = r.dados || {}; const coms = d.comentarios || [];
        const maxTs = coms.reduce((m, c) => Math.max(m, new Date(c.em).getTime() || 0), 0);
        const prev = this._chatSeen[r.id] || 0;
        // card aberto: atualiza as bolhas
        if (this.cardModal && this.cardRef && this.cardRef.id === r.id && JSON.stringify(coms) !== JSON.stringify(this.cardRef.comentarios || [])) { this.cardRef.comentarios = coms; this.scrollChat(); }
        // mensagem nova de OUTRA pessoa, em card onde estou envolvido, e que não está aberto
        if (this._chatBaseline && maxTs > prev) {
          const novas = coms.filter(c => (new Date(c.em).getTime() || 0) > prev && c.autor !== eu);
          // Avisa todos os colaboradores (função colaborador) + quem está no card (membros/responsável).
          const souColaborador = this.papel === 'colaborador';
          const envolvido = souColaborador || (d.membros || []).includes(eu) || d.responsavel === eu;
          const aberto = this.cardModal && this.cardRef && this.cardRef.id === r.id;
          if (novas.length && envolvido && !aberto) { const u = novas[novas.length - 1]; this.notificarMsg(d.tema || d.nome || 'Card', u.autor, u.texto, { id: r.id, ...d }); }
        }
        this._chatSeen[r.id] = maxTs;
      }
      this._chatBaseline = true;
    },
    // Monitor de onboardings: avisa (som + visual) quando um briefing novo é respondido.
    // Roda pra admin e colaboradores que enxergam a fila de Onboardings.
    startOnboardingMonitor() {
      if (this._onbMonitor) return;
      if (!this.ehAdmin && !this.podeVer('onboarding')) return;
      this._onbBaseline = false; this._onbSeen = {};
      this._onbMonitor = setInterval(() => this.monitorOnboardings(), 25000);
      this.monitorOnboardings();
    },
    async monitorOnboardings() {
      if (!this.token) return;
      let lista; try { lista = (await this.api('GET', '/onboarding/admin')) || []; } catch { return; }
      this.onboardings = lista; // mantém a fila e o contador de pendentes vivos
      const pend = lista.filter(o => o.status === 'pendente');
      if (!this._onbBaseline) { pend.forEach(o => this._onbSeen[o.id] = 1); this._onbBaseline = true; return; } // 1ª passada: só marca o que já existe
      const novos = pend.filter(o => !this._onbSeen[o.id]);
      novos.forEach(o => this._onbSeen[o.id] = 1);
      if (novos.length) {
        const nomes = novos.slice(0, 3).map(o => o.empresa).join(', ') + (novos.length > 3 ? ' +' + (novos.length - 3) : '');
        const tSite = (novos.length === 1 && (novos[0].dados || {}).tipo === 'site') ? ' de site' : '';
        this.notificarSistema('📩 Briefing respondido' + tSite, nomes);
        this.mostrarToast('📩 Briefing respondido: ' + nomes);
      }
    },
    initAudio() { try { this._audioCtx = this._audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (this._audioCtx.state === 'suspended') this._audioCtx.resume(); } catch { } },
    tocarBeep() {
      try {
        const ctx = this._audioCtx; if (!ctx) return; const t = ctx.currentTime;
        const beep = (freq, ini, dur) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t + ini); g.gain.exponentialRampToValueAtTime(0.25, t + ini + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + ini + dur); o.start(t + ini); o.stop(t + ini + dur + 0.02); };
        beep(880, 0, 0.32); beep(1175, 0.16, 0.34);
      } catch { }
    },
    async pedirNotif() { try { if (window.Notification && Notification.permission === 'default') await Notification.requestPermission(); } catch { } this.registrarPush(); },
    // ── Web Push (PWA): notificação do sistema mesmo com a aba fechada ──
    async registrarPush() {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
        const reg = await navigator.serviceWorker.register('sw.js');
        if (!this._swMsg) { this._swMsg = true; navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.tipo === 'abrir-card') this.abrirCardPorId(e.data.cardId); }); }
        if (!this.token) return;                                                    // assinatura precisa de login
        if (!window.Notification || Notification.permission !== 'granted') return;  // sem permissão ainda (pedida no 1º clique)
        const r = await this.api('GET', '/push/vapid').catch(() => null);
        const key = r && r.key; if (!key) return;                                   // backend ainda sem VAPID
        let sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this._urlB64ToUint8(key) });
        await this.api('POST', '/push/subscribe', { subscription: sub.toJSON(), ua: navigator.userAgent });
      } catch { /* push é melhoria; nunca pode travar o app */ }
    },
    _urlB64ToUint8(b64) {
      const pad = '='.repeat((4 - (b64.length % 4)) % 4);
      const s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
      const raw = atob(s); const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
      return arr;
    },
    abrirCardPorId(id) {
      if (!id) return;
      const abrir = () => { const p = (this.projects || []).find(x => x.id === id); if (p) { if (this.page !== 'operacional') this.go('operacional'); this.$nextTick(() => this.abrirCard(p)); } };
      if ((this.projects || []).some(x => x.id === id)) abrir();
      else { if (this.page !== 'operacional') this.go('operacional'); this.carregarProjetos().then(abrir); }
    },
    notificarMsg(card, autor, texto, projeto) {
      this.tocarBeep();
      const corte = (texto || '').length > 80 ? (texto.slice(0, 80) + '…') : (texto || '');
      this.mostrarToast('💬 ' + autor + ' · ' + card + ': ' + corte, projeto); // visual garantido dentro do app
      try {
        if (window.Notification && Notification.permission === 'granted') {
          const n = new Notification(autor + ' · ' + card, { body: texto, icon: new URL('assets/icon.png?v=6', location.href).href, tag: 'som-chat-' + card });
          n.onclick = () => { window.focus(); if (projeto) { if (this.page !== 'operacional') this.go('operacional'); this.abrirCard(projeto); } n.close(); };
        }
      } catch { }
    },
    // Alerta de sistema (beep + notificação do navegador) — ex.: novo onboarding.
    notificarSistema(titulo, texto) {
      this.tocarBeep();
      try {
        if (window.Notification && Notification.permission === 'granted') {
          const n = new Notification(titulo, { body: texto, icon: new URL('assets/icon.png?v=6', location.href).href, tag: 'som-sistema' });
          n.onclick = () => { window.focus(); n.close(); };
        }
      } catch { }
    },
    // Toast visível dentro do app (some sozinho). `card` opcional = projeto a abrir ao clicar.
    mostrarToast(msg, card) { this.toastMsg = msg; this._toastCard = card || null; clearTimeout(this._toastT); this._toastT = setTimeout(() => { this.toastMsg = ''; this._toastCard = null; }, 9000); },
    onToastClick() { const c = this._toastCard; this.toastMsg = ''; this._toastCard = null; if (c) { if (this.page !== 'operacional') this.go('operacional'); this.abrirCard(c); } },
    toggleLabelCard(key) { const a = this.cardRef.labels; const i = a.indexOf(key); if (i >= 0) a.splice(i, 1); else a.push(key); this.salvarCard(); },
    toggleMembro(nome) { const a = this.cardRef.membros; const i = a.indexOf(nome); if (i >= 0) a.splice(i, 1); else a.push(nome); this.salvarCard(); },
    get equipeForaDoCard() { const ja = (this.cardRef && this.cardRef.membros) || []; return this.equipe.filter(m => !ja.includes(m.nome)); }, // quem ainda NÃO está no projeto
    addItemCheck() { const t = (this.novoItemCheck || '').trim(); if (!t) return; this.cardRef.checklist.push({ id: MD.uid(), texto: t, feito: false }); this.novoItemCheck = ''; this.salvarCard(); },
    toggleItemCheck(it) { it.feito = !it.feito; this.salvarCard(); },
    removeItemCheck(id) { this.cardRef.checklist = this.cardRef.checklist.filter(x => x.id !== id); this.salvarCard(); },
    checkProgresso(p) { const c = p.checklist || []; const f = c.filter(x => x.feito).length; return { feitos: f, total: c.length, pct: c.length ? Math.round(f / c.length * 100) : 0 }; },
    addComentario() { const t = (this.novoComentario || '').trim(); if (!t) return; this.cardRef.comentarios.push({ id: MD.uid(), autor: (this.usuario && this.usuario.nome) || '—', texto: t, em: new Date().toISOString() }); this.novoComentario = ''; this.salvarCard(); this.scrollChat(); },
    removeComentario(id) { this.cardRef.comentarios = this.cardRef.comentarios.filter(x => x.id !== id); this.salvarCard(); },
    horaCurta(iso) { if (!iso) return ''; try { return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } },
    scrollChat() { this.$nextTick(() => { const el = document.getElementById('chat-scroll'); if (el) el.scrollTop = el.scrollHeight; }); },
    // atualiza só as mensagens do card aberto (sensação de tempo real)
    async atualizarChat() {
      if (!this.cardModal || !this.cardRef) return;
      try {
        const rows = await this.api('GET', '/projetos'); const fresh = (rows || []).find(x => x.id === this.cardRef.id);
        if (fresh && fresh.dados) { const novos = fresh.dados.comentarios || []; if (JSON.stringify(novos) !== JSON.stringify(this.cardRef.comentarios || [])) { this.cardRef.comentarios = novos; this.scrollChat(); } }
      } catch { }
    },
    addAnexo() { const u = (this.novoAnexoUrl || '').trim(); if (!u) return; this.cardRef.anexos.push({ id: MD.uid(), nome: (this.novoAnexoNome || '').trim() || u, url: u, em: new Date().toISOString() }); this.novoAnexoNome = ''; this.novoAnexoUrl = ''; this.salvarCard(); },
    removeAnexo(id) { this.cardRef.anexos = this.cardRef.anexos.filter(x => x.id !== id); this.salvarCard(); },
    async uploadAnexo(e) {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      if (!this.cloudOk) { alert('Configure o Cloudinary primeiro (Pessoal › Armazenamento de arquivos).'); e.target.value = ''; return; }
      this.uploadando = true;
      try { const url = await this.uploadArquivo(file); if (url) { this.cardRef.anexos.push({ id: MD.uid(), nome: file.name || 'arquivo', url, em: new Date().toISOString() }); await this.salvarCard(); } }
      catch (err) { alert(err.message); } finally { this.uploadando = false; e.target.value = ''; }
    },
    // Sobe VÁRIOS arquivos de uma vez (input multiple). Cada um vira SÓ anexo do card.
    // Criativo é separado: só entra no carrossel pelo campo de Criativos (uploadCriativos).
    async uploadAnexos(e) {
      const files = Array.from(e.target.files || []); if (!files.length) return;
      if (!this.cloudOk) { alert('Configure o Cloudinary primeiro (Pessoal › Armazenamento de arquivos).'); e.target.value = ''; return; }
      if (!Array.isArray(this.cardRef.anexos)) this.cardRef.anexos = [];
      this.uploadando = true; let ok = 0, falhou = 0;
      try {
        for (const file of files) {
          try {
            const url = await this.uploadArquivo(file);
            if (!url) { falhou++; continue; }
            this.cardRef.anexos.push({ id: MD.uid(), nome: file.name || 'arquivo', url, em: new Date().toISOString() });
            ok++;
          } catch { falhou++; }
        }
        await this.salvarCard();
        if (falhou) alert(ok + ' enviado(s), ' + falhou + ' falhou(aram).');
      } finally { this.uploadando = false; e.target.value = ''; }
    },
    // ── Galeria de criativos (criativos[]): vários por post → vira carrossel pro cliente ──
    criativosDe(obj) { if (!obj) return []; if (!Array.isArray(obj.criativos)) obj.criativos = obj.criativo ? [obj.criativo] : []; return obj.criativos; },
    async uploadCriativos(e, obj, persistir) {
      const files = Array.from(e.target.files || []); if (!files.length) return;
      if (!this.cloudOk) { alert('Configure o Cloudinary primeiro (Pessoal › Armazenamento de arquivos).'); e.target.value = ''; return; }
      const arr = this.criativosDe(obj);
      this.uploadando = true; let falhou = 0;
      try {
        for (const file of files) {
          try { const url = await this.uploadArquivo(file); if (!url) { falhou++; continue; } arr.push(url); if (!obj.criativo) obj.criativo = url; }
          catch { falhou++; }
        }
        if (persistir) await persistir();
        if (falhou) alert(falhou + ' arquivo(s) não subiram.');
      } finally { this.uploadando = false; e.target.value = ''; }
    },
    addCriativoLink(obj, persistir) {
      const u = (obj._novoCriativo || '').trim(); if (!u) return;
      const arr = this.criativosDe(obj); arr.push(u); if (!obj.criativo) obj.criativo = u;
      obj._novoCriativo = ''; if (persistir) persistir();
    },
    removeCriativo(obj, idx, persistir) {
      const arr = this.criativosDe(obj); arr.splice(idx, 1); obj.criativo = arr[0] || ''; if (persistir) persistir();
    },
    async quickAdd(status) {
      const t = (this.quickAddText || '').trim(); if (!t) { this.quickAddCol = ''; return; }
      try { await this.salvarProjetoApi({ id: '', nome: t, cliente: '', servico: 'Gestão de Redes Sociais', responsavel: '', status, boardId: this.boardSel || 'geral', prazo: '', progresso: 0, notas: '', labels: [], membros: [], checklist: [] }); await this.carregarProjetos(); this.quickAddText = ''; }
      catch (e) { alert(e.message); }
    },
    // ── Programação semanal (checklist por colaborador) ──
    get periodoTipo() { return this.periodo || 'Semanal'; },
    // Calcula o período (ini/fim) num offset, conforme Semanal (7d, seg→dom),
    // Quinzenal (14d) ou Mensal (1º→último dia do mês).
    periodoEm(off) {
      const hoje = new Date(Date.now() - 3 * 3600 * 1000);
      const f = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
      const iso = d => d.toISOString().slice(0, 10);
      let ini, fim;
      if (this.periodoTipo === 'Mensal') {
        ini = new Date(hoje.getFullYear(), hoje.getMonth() + off, 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + off + 1, 0);
      } else {
        const dias = this.periodoTipo === 'Quinzenal' ? 14 : 7;
        const dow = (hoje.getDay() + 6) % 7; // 0=segunda
        ini = new Date(hoje); ini.setDate(hoje.getDate() - dow + off * dias);
        fim = new Date(ini); fim.setDate(ini.getDate() + dias - 1);
      }
      return { ini: iso(ini), fim: iso(fim), label: f(ini) + ' a ' + f(fim) };
    },
    get semanaAtual() { return this.periodoEm(this.semanaOffset || 0); },
    // Próximo período — sugestão padrão da programação.
    get proximaSemana() { return this.periodoEm((this.semanaOffset || 0) + 1); },
    // Navega entre períodos (fecha o layout aberto p/ não misturar).
    mudarSemana(delta) { this.semanaOffset = (this.semanaOffset || 0) + delta; this.layoutModal = false; this.layoutAtual = null; },
    // Troca o tipo de período (Semanal/Quinzenal/Mensal) — zera a navegação.
    mudarPeriodo(p) { this.periodo = p; this.semanaOffset = 0; this.layoutModal = false; this.layoutAtual = null; },
    // Troca o período DENTRO do modal de programação e reposiciona a data sugerida.
    setPeriodoProg(pp) { this.periodo = pp; this.semanaOffset = 0; this.progForm.semanaIni = this.proximaSemana.ini; },
    semanaRotulo() {
      const o = this.semanaOffset || 0;
      const u = this.periodoTipo === 'Mensal' ? 'mês' : this.periodoTipo === 'Quinzenal' ? 'quinzena' : 'semana';
      const up = this.periodoTipo === 'Mensal' ? 'meses' : this.periodoTipo === 'Quinzenal' ? 'quinzenas' : 'semanas';
      if (o === 0) return this.periodoTipo === 'Mensal' ? 'Este mês' : 'Est' + (u === 'mês' ? 'e' : 'a') + ' ' + u;
      if (o === 1) return 'Próxim' + (u === 'mês' ? 'o' : 'a') + ' ' + u;
      if (o === -1) return u.charAt(0).toUpperCase() + u.slice(1) + ' passad' + (u === 'mês' ? 'o' : 'a');
      return (o > 0 ? '+' + o : o) + ' ' + up;
    },
    semanaLabelDe(iniIso) {
      if (!iniIso) return '';
      const ini = new Date(iniIso + 'T00:00:00'); if (isNaN(ini.getTime())) return '';
      let fim;
      if (this.periodoTipo === 'Mensal') fim = new Date(ini.getFullYear(), ini.getMonth() + 1, 0);
      else { fim = new Date(ini); fim.setDate(ini.getDate() + (this.periodoTipo === 'Quinzenal' ? 13 : 6)); }
      const f = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
      return f(ini) + ' a ' + f(fim);
    },
    // ── IA (Claude): elabora descrição/legenda a partir do rascunho; guarda a sugestão em _ia_<campo> pra aprovação. ──
    async gerarIA(obj, campo, tipo) {
      const base = (obj[campo] || '').trim();
      if (!base) return alert('Escreva um rascunho no campo primeiro — a IA elabora a partir dele.');
      obj['_iaLoad_' + campo] = true;
      try {
        const r = await this.api('POST', '/ia/elaborar', { tipo, texto: base, cliente: obj.cliente || (this.progForm && this.progForm.cliente) || '', tema: obj.tema || obj.nome || '' });
        const t = (r && r.texto) || '';
        if (!t) return alert('A IA não retornou texto. Tente de novo.');
        obj['_ia_' + campo] = t;
      } catch (e) { alert('IA: ' + (e.message || 'falha ao gerar')); }
      finally { obj['_iaLoad_' + campo] = false; }
    },
    aprovarIA(obj, campo) { if (obj['_ia_' + campo]) { obj[campo] = obj['_ia_' + campo]; delete obj['_ia_' + campo]; if (obj === this.cardRef) this.salvarCard(); } },
    descartarIA(obj, campo) { delete obj['_ia_' + campo]; },
    // Programação agrupada por MEMBRO (a coluna leva o nome do membro do card).
    progPorMembro() {
      const q = this.busca.toLowerCase();
      const posts = this.projects.filter(p => p.isPost && !p.avulso && !p.arquivado); // criativo avulso e arquivados ficam fora da programação semanal
      const passa = p => !q || (p.nome + ' ' + (p.cliente || '')).toLowerCase().includes(q);
      const SEM = '__sem__';
      const grupos = new Map(); // nome do membro -> { nome, ref, projetos }
      for (const p of posts) {
        if (!passa(p)) continue;
        // pessoas do card = membros; se não houver, cai no responsável.
        const pessoas = (Array.isArray(p.membros) && p.membros.length) ? p.membros : (p.responsavel ? [p.responsavel] : []);
        const key = pessoas.length ? pessoas[0] : SEM; // 1º membro vira a coluna (não duplica o card em várias)
        if (!grupos.has(key)) {
          grupos.set(key, key === SEM
            ? { nome: 'Sem responsável', ref: SEM, projetos: [] }
            : { nome: key, ref: key, projetos: [] });
        }
        grupos.get(key).projetos.push(p);
      }
      return [...grupos.values()].filter(g => g.projetos.length)
        .sort((a, b) => a.ref === SEM ? 1 : b.ref === SEM ? -1 : a.nome.localeCompare(b.nome));
    },
    // projetos ordenados: abertos primeiro (por prazo), concluídos no fim
    progOrdena(arr) {
      const aberto = arr.filter(p => p.status !== 'Concluído').sort((a, b) => (a.prazo || '9999') < (b.prazo || '9999') ? -1 : 1);
      const feito = arr.filter(p => p.status === 'Concluído');
      return [...aberto, ...feito];
    },
    progFeitos(arr) { return arr.filter(p => p.status === 'Concluído').length; },
    prazoNaSemana(p) { const s = this.semanaAtual; return p.prazo && p.prazo >= s.ini && p.prazo <= s.fim; },
    toggleConcluido(p) { this.moverProjeto(p, p.status === 'Concluído' ? 'A Fazer' : 'Concluído'); },
    // Altera a data do post direto pelo card do quadro (sem abrir o modal) e persiste.
    async alterarPrazo(p, val) { p.prazo = val || ''; try { await this.salvarProjetoApi(p); } catch (e) { alert(e.message || 'Falha ao salvar a data.'); } },
    // ── Programação: calendário de posts de redes sociais (vários de uma vez) ──
    TIPOS_POST,
    postVazio() { return { data: (this.progForm && this.progForm.semanaIni) || this.semanaAtual.ini, prazoEntrega: '', tipo: 'Estático', tema: '', responsavel: '', descricao: '', legenda: '', criativo: '', criativos: [], _novoCriativo: '' }; },
    abrirProgramacao() {
      if (!this.equipe.length) this.carregarEquipe();
      // Sugere a semana em foco se o usuário navegou; senão, a próxima (seg→dom). Editável.
      this.progForm = { cliente: '', responsavel: '', semanaIni: this.semanaOffset ? this.semanaAtual.ini : this.proximaSemana.ini };
      this.progPosts = [this.postVazio(), this.postVazio(), this.postVazio()];
      this.progModal = true;
    },
    addPostProg() { this.progPosts.push(this.postVazio()); },
    removePostProg(i) { this.progPosts.splice(i, 1); },
    get progTotal() { return this.progPosts.filter(p => (p.tema || p.legenda || '').trim()).length; },
    async salvarProgramacao() {
      const f = this.progForm;
      if (!f.cliente) return alert('Escolha o cliente.');
      if (!f.responsavel) return alert('Escolha o colaborador responsável.');
      const posts = this.progPosts.filter(p => (p.tema || p.legenda || '').trim());
      if (!posts.length) return alert('Adicione ao menos um post (com tema ou legenda).');
      try {
        for (const po of posts) {
          await this.salvarProjetoApi({
            id: '', nome: po.tema || (po.tipo + ' ' + (po.data || '')), cliente: f.cliente, servico: 'Gestão de Redes Sociais',
            responsavel: po.responsavel || f.responsavel, status: 'A Fazer', boardId: this.boardSel || 'geral', prazo: po.data || f.semanaIni || '', prazoEntrega: po.prazoEntrega || '', progresso: 0, notas: '',
            isPost: true, tipoPost: po.tipo, tema: po.tema, descricao: po.descricao, legenda: po.legenda,
            criativo: po.criativo || (Array.isArray(po.criativos) && po.criativos[0]) || '',
            criativos: Array.isArray(po.criativos) ? po.criativos.filter(Boolean) : [],
          });
        }
        await this.carregarProjetos();
        this.progModal = false; this.opTab = 'semana';
      } catch (e) { alert(e.message || 'Falha ao criar a programação.'); }
    },
    // ── Post individual (ver/editar) ──
    diaSemanaLabel(dataStr) { if (!dataStr) return ''; const d = new Date(dataStr + 'T00:00:00'); if (isNaN(d.getTime())) return ''; const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; return dias[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); },
    editarPost(p) { this.postRef = p; this.postForm = { id: p.id, data: p.prazo || '', prazoEntrega: p.prazoEntrega || '', tipo: p.tipoPost || 'Estático', tema: p.tema || p.nome || '', descricao: p.descricao || '', legenda: p.legenda || '', criativo: p.criativo || '' }; this.postModal = true; },
    async salvarPost() {
      const f = this.postForm, p = this.postRef; if (!p) return;
      p.tipoPost = f.tipo; p.tema = f.tema; p.nome = f.tema || p.nome; p.descricao = f.descricao; p.legenda = f.legenda; p.criativo = f.criativo; p.prazo = f.data; p.prazoEntrega = f.prazoEntrega;
      try { await this.salvarProjetoApi(p); await this.carregarProjetos(); this.postModal = false; }
      catch (e) { alert(e.message || 'Falha ao salvar o post.'); }
    },
    // ── LAYOUT da semana (Fase 2) ──
    async carregarLayouts() { try { this.layouts = (await this.api('GET', '/layouts')) || []; } catch { this.layouts = []; } },
    postsDoClienteSemana(cliente) {
      const s = this.semanaAtual;
      return this.projects.filter(p => p.isPost && !p.avulso && p.cliente === cliente && p.prazo >= s.ini && p.prazo <= s.fim)
        .sort((a, b) => (a.prazo || '') < (b.prazo || '') ? -1 : 1);
    },
    progClientesSemana() {
      const s = this.semanaAtual;
      const cli = [...new Set(this.projects.filter(p => p.isPost && !p.avulso && p.prazo >= s.ini && p.prazo <= s.fim).map(p => p.cliente))].filter(Boolean).sort();
      return cli.map(c => ({ cliente: c, posts: this.postsDoClienteSemana(c) }));
    },
    postsProntos(arr) { return arr.filter(p => p.status === 'Concluído').length; },
    layoutDoCliente(cliente) { const s = this.semanaAtual; return this.layouts.find(l => l.cliente === cliente && l.semanaIni === s.ini); },
    async abrirLayout(cliente) {
      const s = this.semanaAtual;
      try {
        const l = await this.api('POST', '/layouts', { cliente, semanaIni: s.ini, semanaFim: s.fim });
        this.layoutAtual = l;
        const i = this.layouts.findIndex(x => x.id === l.id); if (i >= 0) this.layouts[i] = l; else this.layouts.unshift(l);
        this.layoutModal = true;
      } catch (e) { alert(e.message || 'Falha ao abrir o layout.'); }
    },
    get layoutPostsAtual() { return this.layoutAtual ? this.postsDoClienteSemana(this.layoutAtual.cliente) : []; },
    async patchLayout(campos) {
      if (!this.layoutAtual) return;
      try { const r = await this.api('PATCH', '/layouts/' + this.layoutAtual.id, campos); Object.assign(this.layoutAtual, r); const i = this.layouts.findIndex(x => x.id === r.id); if (i >= 0) this.layouts[i] = r; }
      catch (e) { alert(e.message); }
    },
    ehImagem(url) { return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url || ''); },
    // ── Fase 3: enviar pro cliente aprovar ──
    // Monta o snapshot dos posts da semana com as imagens/legendas ATUAIS, preservando
    // as decisões já tomadas pelo cliente (status/ajuste) — casadas por tema+data.
    montarSnapshot() {
      const old = (this.layoutAtual && Array.isArray(this.layoutAtual.postsSnapshot)) ? this.layoutAtual.postsSnapshot : [];
      return this.layoutPostsAtual.map(p => {
        const chave = (p.tema || p.nome || '') + '|' + (p.prazo || '');
        const dec = old.find(s => ((s.tema || '') + '|' + (s.prazo || '')) === chave) || {};
        return {
          prazo: p.prazo, tipoPost: p.tipoPost || 'Estático', tema: p.tema || p.nome || '',
          legenda: p.legenda || '', criativo: p.criativo || '', formato: p.formato || '',
          criativos: Array.isArray(p.criativos) && p.criativos.length ? p.criativos : (p.criativo ? [p.criativo] : []),
          status: dec.status || '', ajuste: dec.ajuste || null,
        };
      });
    },
    async enviarLayoutCliente() {
      if (!this.layoutAtual) return;
      const snap = this.montarSnapshot();
      if (!snap.length && !confirm('Não há posts nesta semana. Enviar mesmo assim (só o PDF/observações)?')) return;
      await this.patchLayout({ status: 'ENVIADO', postsSnapshot: snap });
      this.copiarLink(this.linkPublicoLayout());
    },
    // Copia o link do cliente SEMPRE com as imagens/legendas atuais (re-sincroniza o snapshot).
    async copiarLinkAtualizado() {
      if (!this.layoutAtual) return;
      try { await this.patchLayout({ postsSnapshot: this.montarSnapshot() }); } catch { }
      this.copiarLink(this.linkPublicoLayout());
    },
    linkPublicoLayout() {
      if (!this.layoutAtual) return '';
      const base = location.origin + location.pathname.replace(/[^/]*$/, '');
      return base + 'layout.html?t=' + this.layoutAtual.token;
    },
    layoutDataHora(dt) { if (!dt) return ''; const d = new Date(dt); if (isNaN(d.getTime())) return ''; return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); },
    layoutStatusLabel(s) { return ({ RASCUNHO: 'Rascunho', APROVADO_GESTAO: 'Aprovado pela gestão', ENVIADO: 'Enviado ao cliente', APROVADO_CLIENTE: 'Aprovado pelo cliente', AJUSTE: 'Ajuste solicitado' })[s] || s; },
    layoutStatusCor(s) { return ({ RASCUNHO: '#8a8ba3', APROVADO_GESTAO: '#2563eb', ENVIADO: '#d97706', APROVADO_CLIENTE: '#16a34a', AJUSTE: '#dc2626' })[s] || '#8a8ba3'; },
    imprimirLayout() { window.print(); },
    novoProjeto(status) { if (!this.equipe.length) this.carregarEquipe(); this.modeloSel = ''; const col = status || (this.boardAtual.colunas[0] && this.boardAtual.colunas[0].nome) || 'A Fazer'; this.editing = { id: '', nome: '', cliente: '', servico: 'Gestão de Redes Sociais', responsavel: '', status: col, boardId: this.boardSel || 'geral', prazo: '', progresso: 0, notas: '', labels: [] }; this.modal = 'project'; },
    editarProjeto(p) { if (!this.equipe.length) this.carregarEquipe(); this.modeloSel = ''; this.editing = { ...p, labels: Array.isArray(p.labels) ? [...p.labels] : [] }; this.modal = 'project'; },
    // + Criativo: cria um card de criativo (igual ao da programação) direto no quadro e já abre pra preencher.
    // Sem dropdown de modelo — já é o card de designer (isPost, com tipo/tema/legenda/criativos).
    async novoCriativo(status) {
      if (!this.equipe.length) this.carregarEquipe();
      const col = status || (this.boardAtual && this.boardAtual.colunas[0] && this.boardAtual.colunas[0].nome) || 'A Fazer';
      const novo = {
        id: '', nome: 'Novo criativo', cliente: '', servico: 'Criação de Conteúdo',
        responsavel: '', status: col, boardId: this.boardSel || 'geral', prazo: '', prazoEntrega: '', progresso: 0, notas: '',
        isPost: true, avulso: true, tipoPost: 'Estático', tema: '', descricao: '', legenda: '', criativo: '', criativos: [],
        labels: [], membros: [], checklist: [],
      };
      try { await this.salvarProjetoApi(novo); this.projects.unshift(novo); this.abrirCard(novo); }
      catch (e) { alert(e.message || 'Falha ao criar o criativo.'); }
    },
    async salvarProjeto() {
      const e = this.editing; if (!e.nome) return alert('Informe o nome do projeto.');
      const resp = (e.responsavel || '').trim();
      if (resp && !this.colaboradores.includes(resp)) { this.colaboradores = [...this.colaboradores, resp].sort((a, b) => a.localeCompare(b)); MD.set('som_colaboradores', this.colaboradores); }
      try {
        if (e.id) { await this.salvarProjetoApi(e); const i = this.projects.findIndex(x => x.id === e.id); if (i > -1) this.projects[i] = { ...e }; }
        else { await this.salvarProjetoApi(e); this.projects.unshift({ ...e }); }
        this.modal = null;
      } catch (err) { alert(err.message || 'Falha ao salvar o projeto.'); }
    },
    // ── Modelos de projeto (dropdown com favoritos no topo) ──
    modelosFavoritos() { return this.MODELOS_PROJETO.filter(m => this.modelosFav.includes(m.nome)); },
    modelosDaArea(area) { return this.MODELOS_PROJETO.filter(m => m.area === area && !this.modelosFav.includes(m.nome)); },
    aplicarModelo() {
      const m = this.MODELOS_PROJETO.find(x => x.nome === this.modeloSel); if (!m) return;
      this.editing.nome = m.nome; this.editing.servico = m.servico;
    },
    favModeloSel() {
      const n = this.modeloSel; if (!n) return alert('Escolha um modelo no menu primeiro.');
      this.modelosFav = this.modelosFav.includes(n) ? this.modelosFav.filter(x => x !== n) : [...this.modelosFav, n];
      MD.set('som_modelos_fav', this.modelosFav);
    },
    async moverProjeto(p, status) { const antes = p.status; p.status = status; if (status === 'Concluído') p.progresso = 100; try { await this.salvarProjetoApi(p); } catch {} if (status === 'Concluído' && antes !== 'Concluído') this.registrarProducao('projeto', p.nome || ''); },
    async excluirProjeto(p) { if (!confirm('Excluir o projeto ' + p.nome + '?')) return; try { await this.api('DELETE', '/projetos/' + p.id); this.projects = this.projects.filter(x => x.id !== p.id); this.modal = null; } catch (err) { alert(err.message); } },

    // ───────────────── COMERCIAL: orçamentos (propostas) ─────────────────
    // Numeração automática: ORC-AAAA-NNN / CT-AAAA-NNN (sequencial por ano).
    proximoNumero(pref, arr) {
      const ano = MD.today().slice(0, 4);
      const base = (pref === 'ORC' || pref === 'CT') ? 500 : 1; // orçamentos e contratos começam em 500
      const re = new RegExp('^' + pref + '-' + ano + '-(\\d+)$');
      const max = (arr || []).reduce((m, x) => { const g = String(x.numero || '').match(re); return g ? Math.max(m, parseInt(g[1], 10)) : m; }, 0);
      const n = Math.max(max + 1, base);
      return pref + '-' + ano + '-' + String(n).padStart(3, '0');
    },
    // Arquivado = Recusado, APROVADO, aceito digitalmente (ACEITA) OU vencido (passou da validade).
    orcamentoArquivado(o) { if (o.status === 'Recusado' || o.status === 'Aprovado') return true; if (o._envio === 'ACEITA') return true; const v = this.validadeData(o); return !!(v && v < MD.today()); },
    orcEhRascunho(o) { return (!o.status || o.status === 'Rascunho') && !this.orcamentoArquivado(o); },
    get orcamentosArquivadosCount() { return this.proposals.filter(o => this.orcamentoArquivado(o)).length; },
    get orcamentosRascunhoCount() { return this.proposals.filter(o => this.orcEhRascunho(o)).length; },
    get orcamentosFiltrados() {
      const q = this.busca.toLowerCase();
      const passa = o => this.orcFiltro === 'arquivados' ? this.orcamentoArquivado(o)
        : this.orcFiltro === 'rascunhos' ? this.orcEhRascunho(o)
        : (!this.orcamentoArquivado(o) && !this.orcEhRascunho(o)); // 'ativos' = enviados, aguardando resposta
      return [...this.proposals]
        .filter(passa)
        .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
        .filter(o => !q || ((o.numero || '') + ' ' + (o.cliente || '') + ' ' + (o.projeto || '') + ' ' + (o.descricao || '')).toLowerCase().includes(q));
    },
    // Marca o orçamento como Aprovado e persiste (chamado ao gerar contrato): sai
    // de "Ativos" e vai pra "Arquivados".
    async _marcarOrcamentoAprovado(o) {
      if (!o || o.status === 'Aprovado') return;
      o.status = 'Aprovado';
      const i = this.proposals.findIndex(x => x.id === o.id);
      if (i > -1) this.proposals[i] = { ...this.proposals[i], status: 'Aprovado' };
      this.persist('proposals', this.proposals);
      try { const { _token, _envio, ...dados } = o; await this.api('POST', '/propostas', { id: o.id || undefined, numero: o.numero, cliente: o.cliente, email: o.email || '', valorTotal: this.orcTotal(o), dados }); } catch (e) { /* offline: localStorage mantém */ }
      this._aoAprovarProposta(o); // aprovou → se o cliente ainda é lead, vira cliente
    },
    orcStatusInfo(s) { return ORC_STATUS.find(x => x.id === s) || ORC_STATUS[0]; },
    // Total mensal = soma dos serviços (fallback no campo valor legado de orçamentos antigos).
    orcTotal(o) { const s = o && o.servicos; if (Array.isArray(s) && s.length) return s.reduce((a, x) => a + (+x.valor || 0), 0); return +(o && o.valor) || 0; },
    // ── Valores (estilo Operand): subtotal → encargos/desconto/honorários → valor final ──
    orcEncargos(o) { return Math.round(this.orcTotal(o) * (+(o && o.encargoPct) || 0)) / 100; },
    orcFinal(o) { return Math.max(0, Math.round((this.orcTotal(o) - (+(o && o.desconto) || 0) + (+(o && o.honorarios) || 0) + this.orcEncargos(o)) * 100) / 100); },
    orcCustosExternos(o) { return ((o && o.custosExternos) || []).reduce((a, x) => a + (+x.valor || 0), 0); },
    orcMargem(o) { return this.orcFinal(o) - this.orcCustosExternos(o); }, // quanto sobra após custos da entrega
    orcFatTotal(o) { return ((o && o.faturamento) || []).reduce((a, x) => a + (+x.valor || 0), 0); }, // soma das parcelas
    // Parcelas conferem se a soma = valor final (Parcelado) OU = final×nº (recorrente).
    orcFatConfere(o) { const s = this.orcFatTotal(o), f = this.orcFinal(o), n = ((o && o.faturamento) || []).length || 1; return Math.abs(s - f) < 0.02 || Math.abs(s - f * n) < 0.02; },
    _condRecorrente(c) { return c === 'Semanal' || c === 'Quinzenal' || c === 'Mensal' || c === 'Trimestral' || c === 'Semestral' || c === 'Anual'; },
    // Gera a tabela de parcelas a partir de condição + nº parcelas + valor final (padrão Operand).
    gerarParcelas() {
      const o = this.editing;
      const cond = o.condicao || 'À Vista';
      const MESES = { Mensal: 1, Trimestral: 3, Semestral: 6, Anual: 12 }; // intervalo em meses
      const recorrente = this._condRecorrente(cond);
      const n = cond === 'À Vista' ? 1 : Math.max(1, Math.min(120, +o.parcelas || 1));
      const final = this.orcFinal(o);
      const cada = Math.floor((final / n) * 100) / 100; // só usado no Parcelado (divide o final)
      const base = o.data ? new Date(o.data + 'T00:00:00') : new Date();
      const diaV = Math.min(28, Math.max(1, +o.diaVencimento || base.getDate()));
      const venc = (i) => {
        if (cond === 'Semanal') { const d = new Date(base.getTime()); d.setDate(d.getDate() + 7 * i); return d; }
        if (cond === 'Quinzenal') { const d = new Date(base.getTime()); d.setDate(d.getDate() + 15 * i); return d; }
        const m = MESES[cond] || 1; // Parcelado e Mensal: 1 mês entre vencimentos
        return new Date(base.getFullYear(), base.getMonth() + m * i, n === 1 ? base.getDate() : diaV);
      };
      const arr = [];
      for (let i = 0; i < n; i++) {
        const val = recorrente ? final : (i === n - 1 ? Math.round((final - cada * (n - 1)) * 100) / 100 : cada);
        arr.push({ id: MD.uid(), vencimento: venc(i).toISOString().slice(0, 10), valor: val, forma: o.formaPagamento || 'Pix', faturamento: '' });
      }
      o.faturamento = arr;
    },
    addParcela() { (this.editing.faturamento = this.editing.faturamento || []).push({ id: MD.uid(), vencimento: MD.today(), valor: 0, forma: this.editing.formaPagamento || 'Pix', faturamento: '' }); },
    removeParcela(i) { this.editing.faturamento.splice(i, 1); },
    addCustoExterno() { (this.editing.custosExternos = this.editing.custosExternos || []).push({ id: MD.uid(), descricao: '', valor: 0 }); },
    removeCustoExterno(i) { this.editing.custosExternos.splice(i, 1); },
    servicoVazio() { return { id: MD.uid(), nome: '', valor: 0, escopo: '', _open: true }; },
    // Acordeão dos serviços: recolher (salva o item visualmente) / abrir (1 por vez)
    recolherServico(s) { if (!s.nome) return alert('Dê um nome ao serviço antes de recolher.'); s._open = false; },
    abrirServico(s) { (this.editing.servicos || []).forEach(x => x._open = false); s._open = true; },
    _projSel(p) { return PROJETO_OPCOES.includes(p) ? p : (p ? 'Outros' : ''); }, // deriva o valor do dropdown a partir do texto salvo
    novoOrcamento() { this.editing = { id: '', numero: this.proximoNumero('ORC', this.proposals), cliente: '', contato: '', email: '', projeto: '', servicos: [this.servicoVazio()], vigenciaMeses: 6, formaPagamento: 'Pix', diaVencimento: 5, status: 'Rascunho', data: MD.today(), validade: 30, observacoes: '', modoAssinatura: 'presencial', desconto: 0, honorarios: 0, encargoPct: 0, condicao: 'À Vista', parcelas: 1, faturamento: [], custosExternos: [], consideracoes: '' }; this.projetoSel = ''; this.modal = 'orcamento'; },
    editarOrcamento(o) { this.editing = { servicos: [], contato: '', email: '', projeto: '', vigenciaMeses: 6, formaPagamento: 'Pix', diaVencimento: 5, validade: 30, modoAssinatura: 'presencial', desconto: 0, honorarios: 0, encargoPct: 0, condicao: 'À Vista', parcelas: 1, faturamento: [], custosExternos: [], consideracoes: '', ...o }; if (!Array.isArray(this.editing.servicos) || !this.editing.servicos.length) this.editing.servicos = [{ ...this.servicoVazio(), nome: o.descricao || '', valor: +o.valor || 0 }]; this.editing.servicos = this.editing.servicos.map(s => ({ id: MD.uid(), nome: '', valor: 0, escopo: '', ...s, _open: false })); this.projetoSel = this._projSel(this.editing.projeto); this.modal = 'orcamento'; },
    addServicoOrc() { if (!Array.isArray(this.editing.servicos)) this.editing.servicos = []; this.editing.servicos.forEach(s => s._open = false); this.editing.servicos.push(this.servicoVazio()); },
    removeServicoOrc(i) { this.editing.servicos.splice(i, 1); if (!this.editing.servicos.length) this.editing.servicos.push(this.servicoVazio()); },
    // Preenche o máximo possível a partir do cliente selecionado (contato/e-mail, com fallback no 1º responsável).
    autoPreencherClienteOrc() {
      const c = this._clientePorNome(this.editing.cliente); if (!c) return;
      const r0 = Array.isArray(c.responsaveis) && c.responsaveis[0] ? c.responsaveis[0] : null;
      if (!this.editing.contato) this.editing.contato = c.contato || (r0 && r0.nome) || '';
      if (!this.editing.email) this.editing.email = c.email || (r0 && r0.email) || c.emailCobranca || '';
      if (!this.editing.whatsapp) this.editing.whatsapp = c.whatsapp || (r0 && r0.whatsapp) || '';
    },
    async salvarOrcamento() {
      const e = this.editing; if (!e.cliente && !(e.servicos || []).some(s => s.nome)) return alert('Informe o cliente e ao menos um serviço.');
      e.servicos = (e.servicos || []).filter(s => s.nome || +s.valor).map(({ _open, ...s }) => s); // tira o flag de UI e serviços vazios
      e.valor = this.orcTotal(e); // mantém o total no campo legado (Financeiro/contrato leem daqui)
      const { _token, _envio, ...dados } = e;
      try {
        // rascunho não precisa do HTML pesado (logo+banner embutidos) — só `dados`; o HTML é gerado ao criar o link público
        const r = await this.api('POST', '/propostas', { id: e.id || undefined, numero: e.numero, cliente: e.cliente, email: e.email || '', valorTotal: e.valor, dados });
        if (r && r.id) e.id = r.id;
      } catch (err) { return alert('Erro ao salvar o orçamento: ' + (err.message || err)); }
      await this.carregarPropostas(); this.modal = null;
      const saved = this.proposals.find(x => x.id === e.id);
      if (saved && saved.status === 'Aprovado') { this._aoAprovarProposta(saved); if (!saved.financeId) this.lancarOrcamentoFinanceiro(saved); }
      else if (e.cliente && (e.status === 'Enviado' || (saved && saved.status === 'Enviado'))) this._moverLeadParaProposta(e.cliente); // orçamento enviado → lead pra coluna Proposta
    },
    async excluirOrcamento(o) { if (!confirm('Excluir o orçamento ' + (o.numero || '') + '?')) return; try { await this.api('DELETE', '/propostas/' + o.id); } catch (e) { return alert('Erro ao excluir: ' + (e.message || e)); } await this.carregarPropostas(); this.modal = null; },
    // Cria a proposta DIGITAL no backend e devolve o link público (aceite online).
    async _criarLinkProposta(o) {
      if (o.status === 'Rascunho' || !o.status) { o.status = 'Enviado'; const i = this.proposals.findIndex(x => x.id === o.id); if (i > -1) this.proposals[i] = { ...o }; } // rascunho → enviado
      this._moverLeadParaProposta(o.cliente); // enviou proposta → lead vai pra coluna Proposta
      const html = this._propostaHTML({ ...o, modoAssinatura: 'digital' });
      const { _token, _envio, ...dados } = o;
      // Atualiza o MESMO orçamento (por id) marcando como ENVIADA — não duplica a linha.
      const r = await this.api('POST', '/propostas', { id: o.id || undefined, numero: o.numero, cliente: o.cliente, email: o.email || '', valorTotal: this.orcTotal(o), html, dados, status: 'ENVIADA' });
      // Resolve relativo à página atual (funciona em subpasta do GitHub Pages e em localhost).
      return new URL('proposta.html?t=' + r.token, location.href).href;
    },
    // Cria a proposta DIGITAL e abre o modal com as opções de envio (link/copiar/wa/email).
    async enviarPropostaDigital(o) {
      try {
        const link = await this._criarLinkProposta(o);
        this.propostaEnvio = { numero: o.numero, cliente: o.cliente || '', email: o.email || '', link };
        this.modal = 'propostaEnvio';
      } catch (e) { alert('Erro ao criar a proposta digital: ' + (e.message || e)); }
    },
    // Envio direto por WhatsApp — gera o link e abre o wa.me com a mensagem pronta.
    async enviarOrcWhatsApp(o) {
      try {
        const link = await this._criarLinkProposta(o);
        const num = (o.whatsapp || prompt('WhatsApp do cliente (com DDD):', '') || '').trim();
        const msg = 'Olá! Segue a proposta da ' + EMPRESA.nome + (o.numero ? ' (' + o.numero + ')' : '') + ':\n' + link;
        window.open((num ? this.waLink(num) : 'https://wa.me/') + '?text=' + encodeURIComponent(msg), '_blank');
      } catch (e) { alert('Erro ao gerar o link da proposta: ' + (e.message || e)); }
    },
    // Envio direto por e-mail — gera o link e abre o cliente de e-mail (mailto).
    async enviarOrcEmail(o) {
      try {
        const link = await this._criarLinkProposta(o);
        const email = (o.email || prompt('E-mail do cliente:', '') || '').trim();
        const subj = 'Proposta ' + (o.numero || '') + ' — ' + EMPRESA.nome;
        const body = 'Olá!\n\nSegue a proposta da ' + EMPRESA.nome + ':\n' + link + '\n\nQualquer dúvida, estou à disposição.';
        window.location.href = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
      } catch (e) { alert('Erro: ' + (e.message || e)); }
    },
    copiarLink(txt) { navigator.clipboard?.writeText(txt).then(() => alert('Link copiado!')).catch(() => prompt('Copie o link:', txt)); },
    // Validade como DATA (a partir de data + N dias) pra exibir no documento.
    validadeData(o) { const dias = +o.validade || 0; const base = o.data ? new Date(o.data + 'T00:00:00') : new Date(); base.setDate(base.getDate() + dias); return base.toISOString().slice(0, 10); },
    // Cronograma de cobranças: N parcelas mensais a partir da data, no valor total.
    cronograma(o) {
      const meses = +o.vigenciaMeses || 1; const total = this.orcTotal(o); const base = o.data ? new Date(o.data + 'T00:00:00') : new Date(); const out = [];
      for (let i = 0; i < meses; i++) { const d = new Date(base.getTime()); d.setMonth(d.getMonth() + i); out.push({ n: i + 1, venc: d.toISOString().slice(0, 10), valor: total }); }
      return out;
    },
    // Cria um CONTRATO completo já preenchido a partir de um orçamento.
    // Acha o cliente cadastrado pelo nome (empresa/fantasia ou razão social).
    _clientePorNome(nome) {
      const n = String(nome || '').trim().toLowerCase(); if (!n) return null;
      return this.clients.find(c => String(c.empresa || '').trim().toLowerCase() === n || String(c.razaoSocial || '').trim().toLowerCase() === n) || null;
    },
    // Monta o endereço completo a partir dos campos do cadastro (ou usa o legado `endereco`).
    _enderecoCliente(c) {
      if (!c) return '';
      const ruaNum = [c.logradouro, c.numero].filter(Boolean).join(', ');
      const cidUf = [c.cidade, c.uf].filter(Boolean).join('/');
      const partes = [ruaNum, c.complemento, c.bairro, cidUf, c.cep && ('CEP ' + c.cep)].filter(Boolean);
      return partes.join(' – ') || c.endereco || '';
    },
    // Texto detalhado dos serviços (nome, valor, plataformas e escopo) p/ o objeto do contrato.
    _servicosTexto(servicos) {
      return (servicos || []).filter(s => s.nome || +s.valor).map((s, i) => {
        const head = (i + 1) + '. ' + (s.nome || '') + (+s.valor ? (' — ' + MD.fmtCur(s.valor) + '/mês') : '');
        const redes = (Array.isArray(s.redes) ? s.redes : []).map(id => { const r = REDES.find(x => x.id === id); return r ? r.label : null; }).filter(Boolean);
        const ads = (Array.isArray(s.ads) ? s.ads : []).map(id => { const a = ADS_PLATAFORMAS.find(x => x.id === id); return a ? a.label : null; }).filter(Boolean);
        const linhas = [head];
        if (redes.length) linhas.push('Redes: ' + redes.join(', '));
        if (ads.length) linhas.push('Anúncios: ' + ads.join(', '));
        String(s.escopo || '').split('\n').map(x => x.replace(/^[-•\s]+/, '').trim()).filter(Boolean).forEach(b => linhas.push('• ' + b));
        return linhas.join('\n');
      }).join('\n');
    },
    // Abre um documento já renderizado (pronto pra imprimir/enviar) na tela.
    verDocumento(tipo, obj) { this.docTipo = tipo; this.docObj = obj; this.docHtml = tipo === 'contrato' ? this._contratoHTML(obj) : this._propostaHTML(obj); this.modal = 'docview'; },
    editarDoc() { const t = this.docTipo, o = this.docObj; this.modal = null; if (t === 'contrato') this.editarContrato(o); else this.editarOrcamento(o); },
    // ── Assinatura eletrônica (ZapSign) ──
    assinaturaLabel(s) { return ({ pending: 'Aguardando assinatura', signed: 'Assinado ✔', refused: 'Recusado', 'new': 'Aguardando assinatura' }[s] || s || '—'); },
    assinaturaCor(s) { return s === 'signed' ? '#16a34a' : s === 'refused' ? '#dc2626' : '#C9A24B'; },
    // Renderiza o HTML do documento num iframe oculto e gera um PDF A4 (base64) via html2canvas+jsPDF.
    async _gerarPdfBase64(html) {
      const ifr = document.createElement('iframe');
      ifr.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;height:1123px;border:0;background:#fff';
      document.body.appendChild(ifr);
      ifr.srcdoc = html;
      await new Promise(res => { ifr.onload = res; setTimeout(res, 1500); });
      await new Promise(r => setTimeout(r, 500)); // dá tempo de carregar logo/banner
      try {
        const canvas = await html2canvas(ifr.contentDocument.body, { scale: 2, useCORS: true, backgroundColor: '#fff', windowWidth: 794 });
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
        const M = 12;                 // margem (mm) em todos os lados
        const cw = pw - 2 * M;        // largura útil
        const cph = ph - 2 * M;       // altura útil por página
        const imgH = canvas.height * cw / canvas.width; // altura total da imagem na largura útil
        const img = canvas.toDataURL('image/jpeg', 0.92);
        let pageStart = 0;
        while (pageStart < imgH - 0.5) {
          if (pageStart > 0) pdf.addPage();
          pdf.addImage(img, 'JPEG', M, M - pageStart, cw, imgH); // posiciona a fatia da página
          // máscara branca cobrindo as 4 margens (jsPDF não recorta a imagem)
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pw, M, 'F');            // topo
          pdf.rect(0, ph - M, pw, M, 'F');       // rodapé (espaço em branco no fim da página)
          pdf.rect(0, 0, M, ph, 'F');            // esquerda
          pdf.rect(pw - M, 0, M, ph, 'F');       // direita
          pageStart += cph;
        }
        return pdf.output('datauristring').split(',')[1];
      } finally { ifr.remove(); }
    },
    async enviarParaAssinatura(c) {
      const cli = this._clientePorNome(c.cliente);
      const r0 = cli && Array.isArray(cli.responsaveis) ? cli.responsaveis[0] : null;
      const nome = c.representante || (r0 && r0.nome) || c.cliente || 'Signatário';
      let email = (cli && cli.email) || (r0 && r0.email) || (cli && cli.emailCobranca) || '';
      let fone = (cli && cli.whatsapp) || (r0 && r0.whatsapp) || '';
      if (!email && !fone) email = (prompt('E-mail do cliente para enviar o contrato para assinatura:', '') || '').trim();
      if (!email && !fone) return;
      let foneNum = (fone || '').replace(/\D/g, ''); if (foneNum.length > 11 && foneNum.startsWith('55')) foneNum = foneNum.slice(2);
      if (!confirm('Enviar o contrato ' + (c.numero || '') + ' para assinatura de ' + nome + (email ? (' (' + email + ')') : (' (WhatsApp ' + foneNum + ')')) + '?')) return;
      this.assinaturaLoading = true;
      try {
        const base64_pdf = await this._gerarPdfBase64(this._contratoHTML(c));
        const resp = await this.api('POST', '/assinatura/contrato', { name: 'Contrato ' + (c.numero || ''), base64_pdf, signers: [{ name: nome, email, phone_number: email ? '' : foneNum }] });
        c.assinatura = { ...resp, enviadoEm: MD.today() };
        if (c.status === 'Rascunho') c.status = 'Pendente'; // enviado p/ assinatura, aguardando assinar
        const i = this.contracts.findIndex(x => x.id === c.id); if (i > -1) this.contracts[i] = { ...c };
        this.persist('contracts', this.contracts);
        if (this.docObj && this.docObj.id === c.id) this.docObj = c;
        alert('Contrato enviado para assinatura ✅' + (email ? ('\nE-mail enviado para ' + email) : ('\nWhatsApp enviado para ' + foneNum)));
      } catch (e) { alert('Erro ao enviar para assinatura: ' + (e.message || e)); }
      finally { this.assinaturaLoading = false; }
    },
    async atualizarAssinatura(c) {
      if (!c.assinatura || !c.assinatura.token) return;
      this.assinaturaLoading = true;
      try {
        const resp = await this.api('POST', '/assinatura/status', { token: c.assinatura.token });
        c.assinatura = { ...c.assinatura, ...resp };
        if (resp.status === 'signed') { c.status = 'Assinado'; this._ativarClienteDoContrato(c); } // contrato fechado ⇒ ativa o cliente
        const i = this.contracts.findIndex(x => x.id === c.id); if (i > -1) this.contracts[i] = { ...c };
        this.persist('contracts', this.contracts);
        if (this.docObj && this.docObj.id === c.id) this.docObj = c;
      } catch (e) { alert('Erro ao atualizar status: ' + (e.message || e)); }
      finally { this.assinaturaLoading = false; }
    },
    linkAssinatura(c) { const s = c && c.assinatura && (c.assinatura.signers || [])[0]; return s ? (s.sign_url || s.signing_link || '') : ''; },
    copiarLinkAssinatura(c) { const l = this.linkAssinatura(c); if (l) { navigator.clipboard.writeText(l); alert('Link de assinatura copiado:\n' + l); } },
    gerarContrato(o) {
      const num = o.numero || '';
      // não duplica: reaproveita o contrato já gerado desse orçamento (e limpa duplicados antigos do mesmo)
      const mesmos = num ? this.contracts.filter(x => x.propostaNumero === num) : [];
      let ct = mesmos.find(x => x.financeLancado) || mesmos[0];
      if (mesmos.length > 1 && ct) { this.contracts = this.contracts.filter(x => x.propostaNumero !== num || x.id === ct.id); this.persist('contracts', this.contracts); }
      if (ct) { alert('Já existe um contrato para este orçamento (' + (ct.numero || '') + '). Abrindo o contrato existente.'); }
      if (!ct) {
        const c = this._clientePorNome(o.cliente); // puxa CNPJ/endereço/representante do cadastro
        const resp0 = c && Array.isArray(c.responsaveis) ? c.responsaveis[0] : null;
        const objeto = this._servicosTexto(o.servicos) || o.descricao || '';
        ct = { id: MD.uid(), numero: this.proximoNumero('CT', this.contracts), cliente: o.cliente || (c && (c.empresa || c.razaoSocial)) || '', documento: (c && (c.cnpj || c.documento || c.cpf)) || '', endereco: this._enderecoCliente(c), representante: o.contato || (resp0 && resp0.nome) || (c && c.contato) || '', representanteCpf: (resp0 && resp0.cpf) || '', projeto: o.projeto || '', objeto, servicos: o.servicos || [], valor: this.orcTotal(o), periodicidade: o.vigenciaMeses == 1 ? 'Único' : 'Mensal', formaPagamento: o.formaPagamento || 'Boleto', diaVencimento: o.diaVencimento || 5, inicio: MD.today(), meses: +o.vigenciaMeses || 6, fidelidadeMeses: 6, multaPercentual: 50, indiceReajuste: 'IPCA', aprovacaoDias: 2, suspensaoDias: 10, foro: EMPRESA.cidade, politico: false, propostaNumero: num, status: 'Rascunho', observacoes: o.observacoes || '' };
        this.contracts.unshift(ct); this.persist('contracts', this.contracts);
        // Avisa quais dados faltam pro contrato sair completo (saem como [preencher] no documento).
        const faltam = [];
        if (!ct.documento) faltam.push('CNPJ/CPF do cliente');
        if (!ct.endereco) faltam.push('endereço do cliente');
        if (!ct.representante) faltam.push('representante do cliente');
        if (!ct.representanteCpf) faltam.push('CPF do representante do cliente');
        if (!EMPRESA.representante || !EMPRESA.repCpf) faltam.push('representante/CPF da Maracatu');
        if (faltam.length) alert('Contrato ' + ct.numero + ' gerado como rascunho.\n\nFaltam dados (complete no cadastro do cliente):\n• ' + faltam.join('\n• '));
      }
      this.editing = { ...ct };
      this._marcarOrcamentoAprovado(o); // orçamento aprovado → sai de Ativos, vai pra Arquivados
      this.verDocumento('contrato', ct); // mostra o contrato pronto pra impressão/envio
    },

    // ───────────────── COMERCIAL: catálogo de serviços ─────────────────
    get catalogoFiltrado() { const q = this.busca.toLowerCase(); return [...this.catalogo].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')).filter(s => !q || ((s.nome || '') + ' ' + (s.categoria || '') + ' ' + (s.escopo || '')).toLowerCase().includes(q)); },
    novoServico() { this.editing = { id: '', nome: '', categoria: '', valor: 0, escopo: '', redes: [], ads: [], verbaAds: {} }; this.modal = 'servico'; },
    editarServico(s) { this.editing = { categoria: '', escopo: '', redes: [], ads: [], verbaAds: {}, ...s }; if (!Array.isArray(this.editing.redes)) this.editing.redes = []; if (!Array.isArray(this.editing.ads)) this.editing.ads = []; if (!this.editing.verbaAds || typeof this.editing.verbaAds !== 'object') this.editing.verbaAds = {}; this.modal = 'servico'; },
    // Marca/desmarca uma rede social no objeto (item do catálogo ou linha do orçamento).
    toggleRede(obj, id) { if (!Array.isArray(obj.redes)) obj.redes = []; const i = obj.redes.indexOf(id); if (i > -1) obj.redes.splice(i, 1); else obj.redes.push(id); },
    redesLabel(ids) { return (ids || []).map(id => { const r = REDES.find(x => x.id === id); return r ? r.label : id; }).join(', '); },
    // Marca/desmarca uma plataforma de tráfego.
    toggleAds(obj, id) { if (!Array.isArray(obj.ads)) obj.ads = []; const i = obj.ads.indexOf(id); if (i > -1) { obj.ads.splice(i, 1); if (obj.verbaAds) delete obj.verbaAds[id]; } else obj.ads.push(id); },
    adsLabel(ids) { return (ids || []).map(id => { const a = ADS_PLATAFORMAS.find(x => x.id === id); return a ? a.label : id; }).join(', '); },
    // Verba de mídia sugerida POR plataforma (não soma no orçamento).
    setVerbaAds(obj, id, val) { if (!obj.verbaAds || typeof obj.verbaAds !== 'object') obj.verbaAds = {}; const n = +val || 0; if (n) obj.verbaAds[id] = n; else delete obj.verbaAds[id]; },
    verbaAdsTotal(obj) { const v = (obj && obj.verbaAds) || {}; return (obj && obj.ads || []).reduce((a, id) => a + (+v[id] || 0), 0); },
    salvarServico() {
      const e = this.editing; if (!e.nome || !e.nome.trim()) return alert('Informe o nome do serviço.');
      e.valor = +e.valor || 0;
      if (e.id) { const i = this.catalogo.findIndex(x => x.id === e.id); if (i > -1) this.catalogo[i] = { ...e }; }
      else { e.id = MD.uid(); this.catalogo.push({ ...e }); }
      this.persist('catalogo', this.catalogo); this.modal = null;
    },
    excluirServico(s) { if (!confirm('Excluir o serviço "' + (s.nome || '') + '" do catálogo?')) return; this.catalogo = this.catalogo.filter(x => x.id !== s.id); this.persist('catalogo', this.catalogo); this.modal = null; },
    // No orçamento: aplica um item do catálogo na linha de serviço (preenche nome, valor e escopo).
    aplicarCatalogo(s, id) { const it = this.catalogo.find(x => x.id === id); if (!it) return; s.nome = it.nome; s.valor = +it.valor || 0; if (it.escopo) s.escopo = it.escopo; if (Array.isArray(it.redes) && it.redes.length) s.redes = [...it.redes]; if (Array.isArray(it.ads) && it.ads.length) { s.ads = [...it.ads]; s.verbaAds = { ...(it.verbaAds || {}) }; } },

    // ───────────────── COMERCIAL: contratos ─────────────────
    // Arquivado = Cancelado OU vencido há mais de 10 dias (mesmo se Assinado).
    contratoArquivado(c) { if (c.status === 'Cancelado') return true; const fim = this.contrFim(c); return !!(fim && fim < this._dataEm(-10)); },
    get contratosArquivadosCount() { return this.contracts.filter(c => this.contratoArquivado(c)).length; },
    get contratosFiltrados() {
      const q = this.busca.toLowerCase();
      return [...this.contracts]
        .filter(c => this.verArquivadosContrato ? this.contratoArquivado(c) : !this.contratoArquivado(c))
        .sort((a, b) => (b.inicio || '').localeCompare(a.inicio || ''))
        .filter(c => !q || ((c.numero || '') + ' ' + (c.cliente || '') + ' ' + (c.objeto || '')).toLowerCase().includes(q));
    },
    contrStatusInfo(s) { return CONTR_STATUS.find(x => x.id === s) || CONTR_STATUS[0]; },
    // Data-fim = início + vigência (meses).
    contrFim(c) { if (!c.inicio || !+c.meses) return ''; const d = new Date(c.inicio + 'T00:00:00'); d.setMonth(d.getMonth() + (+c.meses || 0)); return d.toISOString().slice(0, 10); },
    novoContrato() { this.editing = { id: '', numero: this.proximoNumero('CT', this.contracts), cliente: '', documento: '', endereco: '', representante: '', projeto: '', objeto: '', valor: 0, periodicidade: 'Mensal', formaPagamento: 'Boleto', diaVencimento: 5, inicio: MD.today(), meses: 6, fidelidadeMeses: 6, multaPercentual: 50, indiceReajuste: 'IPCA', aprovacaoDias: 2, suspensaoDias: 10, foro: EMPRESA.cidade, politico: false, propostaNumero: '', status: 'Rascunho', observacoes: '' }; this.modal = 'contrato'; },
    editarContrato(c) { this.editing = { documento: '', endereco: '', representante: '', projeto: '', formaPagamento: 'Boleto', diaVencimento: 5, fidelidadeMeses: 6, multaPercentual: 50, indiceReajuste: 'IPCA', aprovacaoDias: 2, suspensaoDias: 10, foro: EMPRESA.cidade, politico: false, propostaNumero: '', ...c }; this.modal = 'contrato'; },
    salvarContrato() {
      const e = this.editing; if (!e.cliente && !e.objeto) return alert('Informe ao menos o cliente ou o objeto.');
      if (e.id) { const i = this.contracts.findIndex(x => x.id === e.id); if (i > -1) this.contracts[i] = { ...e }; }
      else { e.id = MD.uid(); this.contracts.unshift({ ...e }); }
      this.persist('contracts', this.contracts);
      this._ativarClienteDoContrato(e); // marcado como Assinado manualmente ⇒ ativa o cliente
      this.modal = null;
    },
    excluirContrato(c) { if (!confirm('Excluir o contrato ' + (c.numero || '') + '?')) return; this.contracts = this.contracts.filter(x => x.id !== c.id); this.persist('contracts', this.contracts); this.modal = null; },

    // ── Lançar no Financeiro (orçamento aprovado / mensalidade de contrato) ──
    lancarOrcamentoFinanceiro(o, silent) {
      if (o.financeId && this.finance.some(f => f.id === o.financeId)) { if (!silent) alert('Esse orçamento já foi lançado no Financeiro.'); return; }
      const tot = this.orcTotal(o);
      if (!silent && !confirm('Lançar ' + MD.fmtCur(tot) + ' no Financeiro como receita a receber?')) return;
      const f = { id: MD.uid(), tipo: 'receita', descricao: 'Proposta ' + (o.numero || '') + (o.cliente ? (' — ' + o.cliente) : ''), valor: tot, categoria: 'Mensalidade', cliente: o.cliente || '', status: 'pendente', vencimento: this.validadeData(o), data: MD.today() };
      this.finance.unshift(f); this.persist('finance', this.finance);
      o.financeId = f.id; const i = this.proposals.findIndex(x => x.id === o.id); if (i > -1) this.proposals[i] = { ...o };
      { const { _token, _envio, ...dados } = o; this.api('POST', '/propostas', { id: o.id, numero: o.numero, cliente: o.cliente, email: o.email || '', valorTotal: this.orcTotal(o), dados }).catch(() => {}); }
      if (!silent) alert('Lançado no Financeiro ✅');
    },
    // Cronograma de cobranças do CONTRATO: parcelas conforme periodicidade × vigência,
    // no dia de vencimento, valor = valor do contrato.
    cronogramaContrato(c) {
      const dia = Math.min(28, Math.max(1, +c.diaVencimento || 5)); const total = +c.valor || 0;
      const step = c.periodicidade === 'Trimestral' ? 3 : c.periodicidade === 'Anual' ? 12 : 1; // Mensal = 1
      const n = c.periodicidade === 'Único' ? 1 : Math.max(1, Math.ceil((+c.meses || 1) / step));
      const base = c.inicio ? new Date(c.inicio + 'T00:00:00') : new Date(); const out = [];
      for (let i = 0; i < n; i++) { const d = new Date(base.getFullYear(), base.getMonth() + i * step, dia); out.push({ n: i + 1, venc: d.toISOString().slice(0, 10), valor: total }); }
      return out;
    },
    // Contrato GERA o Financeiro: cria todas as parcelas a receber (idempotente).
    lancarContratoFinanceiro(c) {
      if (!(+c.valor)) return alert('Defina o valor do contrato antes de gerar o Financeiro.');
      if (c.financeLancado && !confirm('Este contrato já gerou lançamentos no Financeiro. Gerar de novo (pode duplicar)?')) return;
      const sched = this.cronogramaContrato(c);
      const cat = c.periodicidade === 'Mensal' ? 'Mensalidade' : 'Projeto pontual';
      if (!confirm('Gerar ' + sched.length + ' lançamento(s) de ' + MD.fmtCur(c.valor) + ' no Financeiro a receber?')) return;
      sched.forEach(p => this.finance.unshift({ id: MD.uid(), tipo: 'receita', descricao: 'Contrato ' + (c.numero || '') + (c.cliente ? (' — ' + c.cliente) : '') + (sched.length > 1 ? ' (' + p.n + '/' + sched.length + ')' : ''), valor: p.valor, categoria: cat, cliente: c.cliente || '', status: 'pendente', vencimento: p.venc, data: MD.today() }));
      this.persist('finance', this.finance);
      c.financeLancado = true; const i = this.contracts.findIndex(x => x.id === c.id); if (i > -1) { this.contracts[i] = { ...c }; this.persist('contracts', this.contracts); }
      alert(sched.length + ' lançamento(s) gerado(s) no Financeiro ✅');
    },

    // ── PDF / impressão — abre janela pronta pra "Salvar como PDF" ──
    imprimirDoc(tipo, o) {
      const w = window.open('', '_blank');
      if (!w) { alert('Permita pop-ups neste site pra gerar o PDF.'); return; }
      const html = tipo === 'orcamento' ? this._propostaHTML(o) : this._contratoHTML(o);
      w.document.write(html); w.document.close(); w.focus();
      setTimeout(() => { try { w.print(); } catch (e) {} }, 350);
    },
    // Documento do briefing do onboarding (mesma identidade dos outros docs) → PDF/impressão.
    _briefingHTML(o) {
      const e = this._esc;
      const d = (o && o.dados) || {};
      const tipo = d.tipo === 'site' ? 'SITE' : 'MARKETING';
      const data = o && o.createdAt ? MD.fmtDate(o.createdAt) : '';
      const rows = this.onbLinhas(o).map(l => `<tr><td style="font-weight:600;width:36%;vertical-align:top;padding:7px 10px;border-bottom:1px solid #eee">${e(l.label)}</td><td style="vertical-align:top;padding:7px 10px;border-bottom:1px solid #eee;white-space:pre-wrap">${e(l.v)}</td></tr>`).join('');
      const logo = (typeof LOGO_DATAURI !== 'undefined' && LOGO_DATAURI) ? `<img class="logo" src="${LOGO_DATAURI}" alt="">` : '<div class="wm">MARACATU DIGITAL<span>INTELLIGENCE</span></div>';
      const banner = (typeof BANNER_DATAURI !== 'undefined' && BANNER_DATAURI) ? `<div class="head-banner"><img src="${BANNER_DATAURI}" alt=""></div>` : '';
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Briefing ${e((o && o.empresa) || '')}</title><style>${this._cssDoc()}</style></head><body>
${banner}<div class="head"><div class="head-brand">${logo}</div><div class="head-doc"><div class="doc-type">BRIEFING · ${tipo}</div>${data ? `<div class="sub">Recebido: ${e(data)}</div>` : ''}</div></div>
<div class="pad">
<h2>${e((o && o.empresa) || 'Onboarding')}</h2>
${rows ? `<table style="width:100%;border-collapse:collapse;font-size:13px">${rows}</table>` : '<div class="bloco">Sem detalhes preenchidos.</div>'}
${this._docFoot()}
</div>
</body></html>`;
    },
    imprimirOnboarding(o) {
      const w = window.open('', '_blank');
      if (!w) { alert('Permita pop-ups neste site pra gerar o PDF.'); return; }
      w.document.write(this._briefingHTML(o)); w.document.close(); w.focus();
      setTimeout(() => { try { w.print(); } catch (e) {} }, 350);
    },
    _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); },
    _cssDoc() {
      return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}body{font-family:'Inter',-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f1f1f;margin:0;padding:0;font-size:13px;line-height:1.55}
.pad{padding:15px 46px 30px}
.head-banner{width:100%;height:108px;overflow:hidden;line-height:0;background:#141414}.head-banner img{width:100%;height:100%;object-fit:cover;object-position:center 32%;display:block;filter:grayscale(100%) contrast(1.05)}
.head{background:#141414;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:30px 46px}
.head-brand{display:flex;align-items:center;gap:14px}.head-brand .logo{height:104px;width:auto;object-fit:contain;background:#fff;border-radius:8px;padding:12px 22px}
.wm{font-size:19px;font-weight:800;letter-spacing:.4px;line-height:1.05}.wm span{display:block;font-size:8.5px;font-weight:600;letter-spacing:2.4px;color:#C9A24B;margin-top:5px}
.head-doc{text-align:right}.head-doc .doc-type{font-size:12px;font-weight:800;letter-spacing:4px;color:#D8B45C}.head-doc .doc-num{font-size:25px;font-weight:800;margin-top:4px;color:#fff}.head-doc .sub{font-size:11.5px;color:#d6d6d6;margin-top:3px}
.empresa-bar{background:#f5f3ee;color:#6f6a5e;font-size:10px;letter-spacing:.2px;padding:8px 46px;border-bottom:2px solid #C9A24B;line-height:1.5}
h2{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;color:#141414;margin:13px 0 8px;padding-left:11px;border-left:3px solid #C9A24B}
.meta-cli{display:flex;flex-wrap:wrap;gap:6px 26px;margin:10px 0 2px;font-size:13px}.meta-cli b{color:#141414}
.intro{white-space:pre-wrap;color:#444;text-align:justify}
.serv{margin:12px 0;padding:14px 16px;background:#fafafa;border:1px solid #eee;border-radius:12px}
.serv-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}.serv-head .n{font-weight:700;font-size:15px;color:#141414}
.serv-val{color:#141414;font-weight:800;white-space:nowrap;font-size:15px}.serv-val small{color:#555;font-weight:700;font-size:11px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0 2px}
.chip{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid #e6e6e6;border-radius:20px;padding:3px 11px 3px 8px;font-size:11px;color:#444}.chip img{width:13px;height:13px}.chip b{font-weight:700;color:#141414}
.verba-nota{font-size:11px;color:#8a7a3e;font-style:italic;margin:7px 0 0}
.serv ul{margin:9px 0 0;padding-left:18px;color:#555;font-size:12px}.serv li{margin:3px 0}
.total{margin:18px 0 6px;background:#141414;color:#fff;border-radius:14px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center}.total span{font-size:12px;letter-spacing:2px;color:#C9A24B;font-weight:700}.total b{font-size:26px;font-weight:800;color:#fff}
.nota-perfil{font-size:11.5px;color:#888;font-style:italic;margin:10px 2px 2px;line-height:1.55}
table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}th,td{text-align:left;padding:9px 12px;border-bottom:1px solid #eee}th{background:#141414;color:#C9A24B;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:700}tbody tr:nth-child(even){background:#fafafa}
.ct-title{text-align:center;margin:26px 0 22px;padding:0 16px}
.ct-title .ct-kicker{display:block;font-size:12px;font-weight:800;letter-spacing:6px;color:#C9A24B;margin-bottom:8px}
.ct-title .ct-name{display:inline-block;font-size:23px;font-weight:800;color:#141414;text-transform:uppercase;letter-spacing:.4px;line-height:1.18;border-top:2px solid #C9A24B;border-bottom:2px solid #C9A24B;padding:11px 6px}
.bloco{margin:10px 0}.bloco b{display:block;margin-bottom:2px;color:#141414}
.clausula{margin:14px 0}.clausula h3{font-size:12.5px;margin:0 0 4px;color:#141414}.clausula p{margin:3px 0;text-align:justify;color:#333}
.midia-card{background:#fbf7ec;border:1px solid #ecdfb8;border-left:3px solid #C9A24B;border-radius:8px;padding:9px 12px;margin:9px 0 2px;font-size:11.5px;color:#7a6a3a;line-height:1.5}
.assin{display:flex;justify-content:space-between;gap:48px;margin-top:70px}.assin div{flex:1;text-align:center;border-top:1.5px solid #141414;padding-top:9px;font-size:11px;color:#444}.assin.assin-test{margin-top:80px}
.sig-digital{display:flex;gap:22px;margin-top:26px;flex-wrap:wrap}
.esig{flex:1;min-width:240px;background:#f1f8f1;border:1px solid #cfe6cf;border-radius:12px;padding:14px 16px}
.esig-tag{font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:#2e7d32}
.esig-co{font-weight:800;color:#141414;margin-top:7px;font-size:13px}.esig-sub{font-size:10.5px;color:#777;margin-top:2px}
.aceite{flex:1;min-width:240px;border:1px dashed #d8c790;border-radius:12px;padding:14px 16px;background:#fcfaf3;display:flex;flex-direction:column;justify-content:center}
.aceite-txt{font-size:11px;color:#7a6a3a;margin-bottom:11px;line-height:1.5}
.btn-aceite{display:block;width:100%;text-align:center;background:#141414;color:#C9A24B;font-weight:800;font-size:13px;text-decoration:none;padding:12px 18px;border-radius:10px;letter-spacing:.3px;border:none;cursor:pointer}
.foot{margin-top:40px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:12px;text-align:center}
@media print{@page{margin:13mm 9mm}.pad{padding:14px 16mm}.head{padding:20px 16mm}.empresa-bar{padding:8px 16mm}
/* só o box do total não pode quebrar; serviços/cláusulas podem fluir entre páginas pra não deixar buraco branco */
.total{break-inside:avoid}
/* títulos e cabeçalho do serviço não ficam órfãos no fim da página */
h2{break-after:avoid}.serv-head{break-after:avoid}.serv{break-inside:auto}
/* título e blocos de assinatura não se partem entre páginas */
.ct-title{break-inside:avoid;break-after:avoid}.assin{break-inside:avoid}.clausula h3{break-after:avoid}}`;
    },
    _docHead(tipo, num, subs) {
      const e = this._esc;
      const emailRemetente = (this.usuario && this.usuario.email) || EMPRESA.email; // quem envia = usuário logado
      const subsHTML = (subs || []).map(s => `<div class="sub">${e(s)}</div>`).join('');
      const logo = (typeof LOGO_DATAURI !== 'undefined' && LOGO_DATAURI) ? `<img class="logo" src="${LOGO_DATAURI}" alt="">` : '';
      const banner = (typeof BANNER_DATAURI !== 'undefined' && BANNER_DATAURI) ? `<div class="head-banner"><img src="${BANNER_DATAURI}" alt=""></div>` : '';
      return `${banner}<div class="head">
<div class="head-brand">${logo || '<div class="wm">MARACATU DIGITAL<span>INTELLIGENCE · MARKETING DIGITAL</span></div>'}</div>
<div class="head-doc"><div class="doc-type">${e(tipo)}</div><div class="doc-num">Nº ${e(num)}</div>${subsHTML}</div>
</div>
<div class="empresa-bar">CNPJ ${e(EMPRESA.cnpj)} · ${e(emailRemetente)} · ${e(EMPRESA.fone)} · ${e(EMPRESA.endereco)}</div>`;
    },
    _docFoot() {
      const e = this._esc;
      const emailRemetente = (this.usuario && this.usuario.email) || EMPRESA.email;
      return `<div class="foot">${e(EMPRESA.nome)} · CNPJ ${e(EMPRESA.cnpj)} · ${e(EMPRESA.fone)} · ${e(emailRemetente)}</div>`;
    },
    // ===== PROPOSTA (modelo Bella Napoli) =====
    // Rodapé da proposta: presencial (linhas pra assinar impresso) ou digital
    // (assinatura eletrônica da agência + botão de aceite do cliente).
    _rodapeAssinatura(o) {
      const e = this._esc;
      if (o.modoAssinatura === 'digital') {
        return `<div class="sig-digital"><div class="esig"><div class="esig-tag">✔ ASSINADO ELETRONICAMENTE</div><div class="esig-co">${e(EMPRESA.nome)}</div><div class="esig-sub">CNPJ ${e(EMPRESA.cnpj)}</div><div class="esig-sub">Emitido em ${e(MD.fmtDate(MD.today()))}${o.numero ? ' · Proposta ' + e(o.numero) : ''}</div></div><div class="aceite"><div class="aceite-txt">Concordando, você aceita os termos desta proposta e autoriza a geração do contrato.</div><button class="btn-aceite" id="btn-aceite" type="button">✔ Estou de acordo — gerar contrato</button></div></div>`;
      }
      return `<div class="assin"><div>${e(EMPRESA.nome)}</div><div>${e(o.cliente || 'Cliente')}${o.contato ? '<br>' + e(o.contato) : ''}</div></div>`;
    },
    _propostaHTML(o) {
      const e = this._esc, total = this.orcTotal(o);
      const servHTML = (o.servicos || []).filter(s => s.nome || s.valor).map((s, i) => {
        const bullets = String(s.escopo || '').split('\n').map(x => x.replace(/^[-•\s]+/, '').trim()).filter(Boolean);
        const redeChips = (Array.isArray(s.redes) ? s.redes : []).map(id => { const r = REDES.find(x => x.id === id); return r ? `<span class="chip"><img src="${redeIcon(r)}">${e(r.label)}</span>` : ''; }).join('');
        const adsChips = (Array.isArray(s.ads) ? s.ads : []).map(id => { const a = ADS_PLATAFORMAS.find(x => x.id === id); const v = (s.verbaAds || {})[id]; return a ? `<span class="chip"><img src="${redeIcon(a)}">${e(a.label)}${v ? ` · <b>${e(MD.fmtCur(+v))}</b>` : ''}</span>` : ''; }).join('');
        const chips = (redeChips || adsChips) ? `<div class="chips">${redeChips}${adsChips}</div>` : '';
        const tot = this.verbaAdsTotal(s);
        const verbaNota = (Array.isArray(s.ads) && s.ads.length && tot) ? `<div class="midia-card">💡 <b>Investimento em mídia sugerido: ${e(MD.fmtCur(tot))}/mês</b> — pago <b>diretamente às plataformas</b> (${e(this.adsLabel(s.ads))}), à parte do fee da agência.</div>` : '';
        return `<div class="serv"><div class="serv-head"><span class="n">${i + 1}. ${e(s.nome)}</span><span class="serv-val">${e(MD.fmtCur(s.valor))}<small>/mês</small></span></div>${chips}${verbaNota}${bullets.length ? `<ul>${bullets.map(b => `<li>${e(b)}</li>`).join('')}</ul>` : ''}</div>`;
      }).join('');
      const cron = this.cronograma(o).map(p => `<tr><td>${p.n}º mês — ${e(MD.fmtDate(p.venc))}</td><td>${e(MD.fmtCur(p.valor))}</td><td>${e(o.formaPagamento || 'Boleto')}</td></tr>`).join('');
      // ── Valores e parcelas (padrão Operand) ──
      const final = this.orcFinal(o), enc = this.orcEncargos(o), desc = +o.desconto || 0, hon = +o.honorarios || 0;
      const parcelas = Array.isArray(o.faturamento) ? o.faturamento : [];
      const temParcelas = parcelas.length > 0;
      const temAjuste = enc > 0 || desc > 0 || hon > 0 || Math.abs(final - total) > 0.01;
      const valoresHTML = (temAjuste || temParcelas) ? `<h2>Resumo de valores</h2><table><tbody>`
        + `<tr><td>Subtotal dos serviços</td><td>${e(MD.fmtCur(total))}</td></tr>`
        + (enc > 0 ? `<tr><td>+ Encargos${o.encargoPct ? ` (${e(o.encargoPct)}%)` : ''}</td><td>${e(MD.fmtCur(enc))}</td></tr>` : '')
        + (hon > 0 ? `<tr><td>+ Honorários</td><td>${e(MD.fmtCur(hon))}</td></tr>` : '')
        + (desc > 0 ? `<tr><td>− Desconto</td><td>− ${e(MD.fmtCur(desc))}</td></tr>` : '')
        + `<tr><td><b>Valor final</b></td><td><b>${e(MD.fmtCur(final))}</b></td></tr>`
        + `</tbody></table>` : '';
      const parcelasHTML = parcelas.map((p, i) => `<tr><td>${i + 1}ª — ${e(MD.fmtDate(p.vencimento))}</td><td>${e(MD.fmtCur(+p.valor || 0))}</td><td>${e(p.forma || o.formaPagamento || 'Pix')}</td></tr>`).join('');
      const pagamentoHTML = temParcelas
        ? `<h2>Condições de pagamento</h2><div class="bloco">${e(o.condicao || 'À Vista')}${parcelas.length > 1 ? ` — ${parcelas.length}×` : ''}</div><table><thead><tr><th>Parcela / Vencimento</th><th>Valor</th><th>Forma</th></tr></thead><tbody>${parcelasHTML}</tbody></table>`
        : `<h2>Cronograma de cobranças</h2><table><thead><tr><th>Competência / Vencimento</th><th>Mensalidade</th><th>Forma</th></tr></thead><tbody>${cron}</tbody></table>`;
      const metaCli = [o.contato && `<span><b>Contato:</b> ${e(o.contato)}</span>`, o.email && `<span><b>E-mail:</b> ${e(o.email)}</span>`].filter(Boolean).join('');
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${e(o.numero)}</title><style>${this._cssDoc()}</style></head><body>
${this._docHead('PROPOSTA', o.numero, ['Data: ' + MD.fmtDate(o.data), 'Validade: ' + (o.validade || 30) + ' dias'])}
<div class="pad">
<div class="meta-cli"><span><b>Cliente:</b> ${e(o.cliente || '—')}</span>${metaCli}</div>
${o.projeto ? `<div class="meta-cli"><span><b>Projeto:</b> ${e(o.projeto)}</span></div>` : ''}
<h2>Introdução</h2><div class="intro">${e(PROPOSTA_INTRO)}</div>
<h2>Serviços incluídos</h2>${servHTML || '<div class="intro">—</div>'}
<div class="total"><span>MENSALIDADE TOTAL</span><b>${e(MD.fmtCur(total))}/mês</b></div>
<div class="nota-perfil">Os valores sugeridos nesta proposta, incluindo a verba de investimento em mídia, foram definidos a partir de uma análise prévia do perfil e dos objetivos do cliente, podendo ser ajustados em conjunto conforme a estratégia acordada.</div>
${valoresHTML}
<h2>Vigência do contrato</h2><div class="bloco">${e(o.vigenciaMeses || 6)} meses via ${e(o.formaPagamento || 'Boleto')}</div>
${pagamentoHTML}
<h2>Considerações finais</h2>
<div class="bloco"><b>Condições Comerciais</b>Os serviços serão remunerados por fee mensal, pelo período de vigência de ${e(o.vigenciaMeses || 6)} meses.</div>
<div class="bloco"><b>Prazo e Rescisão</b>Início a partir da aceitação desta Proposta; vigência de ${e(o.vigenciaMeses || 6)} meses com renovação automática por iguais 6 meses. Rescisão a partir do 6º mês, com aviso prévio de 30 dias; antes do 6º mês, multa de 50% dos fees restantes.</div>
<div class="bloco"><b>Reajuste</b>Reajuste automático após 12 meses, pela variação do IPCA.</div>
<div class="bloco"><b>Validade da Proposta</b>Esta proposta é válida por ${e(o.validade || 30)} dias a partir da data de envio.</div>
${o.observacoes ? `<div class="bloco"><b>Observações</b>${e(o.observacoes)}</div>` : ''}
${this._rodapeAssinatura(o)}
${this._docFoot()}
</div>
</body></html>`;
    },
    // ===== CONTRATO (prestação de serviços de marketing digital — modelo legal) =====
    _contratoHTML(c) {
      const e = this._esc;
      const meses = +c.meses || 12, multa = +c.multaPercentual || 50;
      const foro = c.foro || EMPRESA.cidade, dia = +c.diaVencimento || 5;
      const valorMensal = MD.fmtCur(c.valor);
      const plano = c.plano || c.propostaNumero || 'conforme proposta comercial aprovada';
      const formaPag = c.formaPagamento ? (e(c.formaPagamento) + ', com vencimento no dia ' + dia + ' de cada mês') : ('vencimento no dia ' + dia + ' de cada mês');
      const repContratante = c.representante || '[preencher]';
      const repContratada = EMPRESA.representante || '[preencher]';
      const cpfContratante = c.representanteCpf || '';
      const cpfContratada = EMPRESA.repCpf || '';
      const cl = (n, t, ps) => `<div class="clausula"><h3>${e(n)}. ${e(t)}</h3>${ps.map(p => `<p>${p}</p>`).join('')}</div>`;
      const anexoPolitico = c.politico ? `${cl('ANEXO', 'MARKETING POLÍTICO / ELEITORAL', [
        'Aplica-se quando a CONTRATANTE for candidato(a), partido, federação ou comitê. Regido pela Lei 9.504/1997 e Resolução TSE nº 23.607/2019 e alterações.',
        'Os serviços observarão integralmente a legislação eleitoral. <b>Todo pagamento à CONTRATADA será feito exclusivamente pela conta bancária específica de campanha</b>, e a verba de impulsionamento seguirá as regras e os limites de gastos do TSE para o cargo disputado.',
        'A CONTRATANTE é a única responsável pelo conteúdo eleitoral, sua veracidade e a observância dos limites de gastos.',
      ])}` : '';
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato ${e(c.numero)}</title><style>${this._cssDoc()}</style></head><body>
${this._docHead('CONTRATO', c.numero, [])}
<div class="ct-title"><span class="ct-kicker">CONTRATO DE</span><div class="ct-name">Prestação de Serviços de Marketing Digital</div></div>
<p style="color:#333">Pelo presente instrumento, as partes abaixo identificadas celebram o presente contrato de prestação de serviços de marketing digital, conforme as cláusulas e condições seguintes.</p>
<div class="bloco"><b>CONTRATANTE</b><br>${e(c.cliente || '[preencher]')}<br>CNPJ/CPF: ${e(c.documento || '[preencher]')}<br>Endereço: ${e(c.endereco || '[preencher]')}<br>Representante: ${e(repContratante)}</div>
<div class="bloco"><b>CONTRATADA</b><br>${e(EMPRESA.nome)}<br>CNPJ: ${e(EMPRESA.cnpj)}<br>Endereço: ${e(EMPRESA.endereco)}<br>Representante: ${e(repContratada)}</div>
<div class="bloco"><b>Proposta vinculada:</b> ${e(c.propostaNumero || '[preencher]')}</div>
${cl('1', 'OBJETO', [
  '1.1. O presente contrato tem como objeto a prestação de serviços de marketing digital, conforme proposta comercial aprovada entre as partes, podendo contemplar, conforme o plano contratado: planejamento, criação de conteúdo para canais digitais, gestão de redes sociais, produção de conteúdo audiovisual, gestão de tráfego pago e relatórios de desempenho.',
  '1.2. O valor mensal contratado será de <b>' + e(valorMensal) + '</b>, referente ao plano ' + e(plano) + ', conforme proposta comercial aprovada.',
  '1.3. A mensalidade será paga pela CONTRATANTE da seguinte forma: ' + formaPag + '.',
  '1.4. A atuação da CONTRATADA é voltada ao ambiente digital. Demandas como materiais impressos, stands, ambientações, sinalizações, apresentações, peças offline, reformas, layouts físicos, projetos gráficos especiais ou qualquer solicitação fora do escopo contratado não estão incluídas, salvo se previstas na proposta ou aprovadas em orçamento à parte.',
])}
${cl('2', 'ESCOPO, ENTREGAS E APROVAÇÕES', [
  '2.1. As entregas seguirão o escopo definido na proposta comercial aprovada entre as partes.',
  '2.2. Quando houver gestão de redes sociais, a CONTRATADA poderá apresentar uma programação de conteúdo para aprovação da CONTRATANTE, conforme periodicidade combinada entre as partes.',
  '2.3. Os conteúdos poderão incluir artes estáticas, carrosséis, fotos, vídeos, reels, stories ou outros formatos digitais, de acordo com a estratégia definida.',
  '2.4. A contratação não implica produção exclusiva para cada rede social. O mesmo conteúdo poderá ser utilizado em diferentes plataformas, com adaptações de formato, legenda ou linguagem, quando necessário.',
  '2.5. A CONTRATANTE deverá avaliar os materiais enviados em até 2 dias úteis. A ausência de retorno poderá impactar o calendário de publicações, sem caracterizar falha da CONTRATADA.',
  '2.6. Ajustes simples nas peças estão incluídos, desde que estejam alinhados ao briefing original. Mudança de conceito, refação integral, novo roteiro, nova edição, troca de direção criativa ou adaptação para finalidade não contratada poderão ser orçados à parte.',
])}
${cl('3', 'CAPTAÇÕES AUDIOVISUAIS', [
  '3.1. Caso o serviço de captação audiovisual esteja incluído na proposta, as gravações e fotos deverão ser previamente agendadas entre as partes, respeitando a disponibilidade da equipe e do cliente.',
  '3.2. Caso alguma captação, entrega ou publicação não ocorra por falta de agenda, ausência de retorno, cancelamento, atraso, falta de acesso ou impedimento relacionado à CONTRATANTE, a entrega poderá ser remanejada, sem abatimento ou desconto na mensalidade.',
  '3.3. A CONTRATANTE será responsável por autorizar gravações em seus ambientes, obras, imóveis, escritórios ou locais indicados, bem como obter autorização de uso de imagem de colaboradores, clientes, fornecedores ou terceiros que apareçam nos conteúdos.',
])}
${cl('4', 'TRÁFEGO PAGO', [
  '4.1. Quando contratado, o serviço de gestão de tráfego pago inclui planejamento, configuração, acompanhamento e otimização de campanhas em plataformas como Meta Ads, Google Ads, LinkedIn Ads ou outras previstas na proposta.',
  '4.2. A verba de mídia é de responsabilidade exclusiva da CONTRATANTE e não integra os honorários da CONTRATADA, podendo ser paga diretamente às plataformas ou reembolsada mediante comprovação.',
  '4.3. A CONTRATADA não se responsabiliza por bloqueios, reprovações, instabilidades, restrições, alterações de algoritmo, aumento de custo de mídia ou decisões unilaterais das plataformas.',
  '4.4. A CONTRATADA não garante resultados específicos de vendas, leads, seguidores, engajamento, alcance, visualizações, faturamento ou retorno financeiro, pois tais resultados dependem de fatores externos à sua atuação.',
])}
${cl('5', 'OBRIGAÇÕES DA CONTRATADA', [
  '5.1. Executar os serviços contratados com zelo, técnica e boas práticas profissionais.',
  '5.2. Conduzir as estratégias com liberdade técnica e criativa, respeitando o posicionamento da marca, os objetivos comerciais e as informações fornecidas pela CONTRATANTE.',
  '5.3. Submeter materiais à aprovação prévia quando aplicável.',
  '5.4. Manter sigilo sobre informações estratégicas, comerciais e operacionais da CONTRATANTE.',
  '5.5. Enviar relatórios de desempenho quando previsto na proposta comercial.',
])}
${cl('6', 'OBRIGAÇÕES DA CONTRATANTE', [
  '6.1. Fornecer informações, materiais, acessos, referências, aprovações e retornos necessários à execução dos serviços.',
  '6.2. Garantir acesso às contas, perfis, gerenciadores, páginas, canais e demais ativos digitais necessários.',
  '6.3. Responsabilizar-se pela veracidade das informações, ofertas, preços, promessas comerciais, condições de venda, atendimento ao cliente e execução dos produtos ou serviços divulgados.',
  '6.4. Atrasos, ausência de retorno, falta de acesso, informações incompletas ou mudanças constantes de direcionamento poderão impactar prazos e entregas, sem caracterizar descumprimento da CONTRATADA.',
])}
${cl('7', 'ARQUIVOS, DIREITOS DE USO E PORTFÓLIO', [
  '7.1. Após a quitação dos valores devidos, a CONTRATANTE poderá utilizar os materiais finais aprovados e publicados em seus canais próprios de comunicação.',
  '7.2. Não fazem parte da entrega arquivos brutos, editáveis, projetos abertos, templates, arquivos internos, presets, fontes, bancos de imagem, projetos de edição ou arquivos em Canva, Figma, Photoshop, Illustrator, Premiere ou similares, salvo contratação específica à parte.',
  '7.3. A CONTRATADA mantém a titularidade sobre seus métodos, processos criativos, estratégias, estruturas, templates, fluxos de trabalho e materiais internos.',
  '7.4. A CONTRATADA poderá utilizar os materiais produzidos como portfólio, estudo de caso, apresentação comercial ou divulgação institucional, desde que não exponha informações confidenciais da CONTRATANTE.',
])}
${cl('8', 'PRAZO, PAGAMENTO E RESCISÃO', [
  '8.1. O presente contrato terá vigência mínima de <b>' + meses + ' meses</b>, contados a partir da assinatura ou aceite da proposta.',
  '8.2. O pagamento será realizado conforme valor, forma e vencimento definidos na proposta comercial ou neste contrato.',
  '8.3. O atraso no pagamento poderá acarretar suspensão dos serviços, sem abatimento proporcional da mensalidade, além de multa de 2%, juros de 1% ao mês e correção monetária.',
  '8.4. Após o período mínimo contratado, o contrato seguirá por prazo indeterminado, podendo ser encerrado por qualquer uma das partes mediante aviso prévio escrito de 30 dias.',
  '8.5. A rescisão sem justa causa antes do término do período mínimo contratado sujeitará a parte que der causa ao pagamento de multa equivalente a ' + multa + '% das mensalidades vincendas até o fim do período mínimo, sem prejuízo dos valores já vencidos ou serviços executados.',
  '8.6. Após 12 meses de vigência, os valores poderão ser reajustados conforme índice definido entre as partes ou nova proposta comercial.',
])}
${cl('9', 'CONFIDENCIALIDADE, LGPD E RESPONSABILIDADE', [
  '9.1. As partes comprometem-se a manter sigilo sobre informações estratégicas, comerciais, financeiras, operacionais e dados sensíveis a que tiverem acesso em razão deste contrato.',
  '9.2. No tratamento de dados pessoais, as partes comprometem-se a observar a legislação aplicável, especialmente a Lei Geral de Proteção de Dados - LGPD.',
  '9.3. A responsabilidade da CONTRATADA limita-se à execução dos serviços efetivamente contratados, dentro do escopo aprovado na proposta comercial.',
  '9.4. A CONTRATADA não será responsável por fatores externos à sua atuação, incluindo atendimento comercial da CONTRATANTE, qualidade do produto ou serviço divulgado, reputação da marca, sazonalidade, concorrência, verba insuficiente, instabilidades de plataformas ou comportamento do público.',
])}
${cl('10', 'DISPOSIÇÕES GERAIS', [
  '10.1. Este contrato, juntamente com a proposta comercial aprovada, representa o acordo integral entre as partes.',
  '10.2. Alterações de escopo, valores, prazos ou condições somente terão validade se aprovadas por escrito entre as partes.',
  '10.3. A relação entre as partes é estritamente comercial, não gerando vínculo trabalhista, societário, exclusividade ou subordinação.',
  '10.4. As partes reconhecem a validade da assinatura eletrônica deste contrato.',
  '10.5. Fica eleito o foro da comarca de ' + e(foro) + ', para dirimir eventuais controvérsias, salvo disposição legal obrigatória em sentido diverso.',
])}
${c.observacoes ? `<div class="bloco"><b>Observações</b><br>${e(c.observacoes)}</div>` : ''}
<p style="margin-top:18px;color:#333">E por estarem justas e contratadas, as partes assinam o presente instrumento.</p>
<p style="color:#333">${e(EMPRESA.cidade)}, ${MD.fmtDate(c.inicio)}.</p>
<div class="assin"><div>${e(c.cliente || 'CONTRATANTE')}<br>CONTRATANTE<br>Representante: ${e(repContratante)}<br>CPF: ${e(cpfContratante)}</div><div>${e(EMPRESA.nome)}<br>CONTRATADA<br>Representante: ${e(repContratada)}<br>CPF: ${e(cpfContratada)}</div></div>
<div class="assin assin-test"><div>TESTEMUNHA 1<br>Nome:<br>CPF:</div><div>TESTEMUNHA 2<br>Nome:<br>CPF:</div></div>
${anexoPolitico}
${this._docFoot()}
</body></html>`;
    },

    // converte lead Ganho → cliente
    // Monta o `dados` do cliente a partir de um lead (nasce ATIVO; tipo escolhido).
    _dadosClienteDeLead(l, tipo) {
      return { cnpj: l.cnpj || '', razaoSocial: '', empresa: l.empresa, contato: l.contato, email: l.email, whatsapp: l.whatsapp, cidade: l.cidade, servicos: l.servico ? [l.servico] : [], redes: redesVazias(), site: { url: '', seo: 0, sgo: 0 }, dominio: { provedor: '', vencimento: '' }, hospedagem: { provedor: '', vencimento: '' }, ads: adsVazio(), objetivos: [], briefing: briefingVazio(), slogan: '', responsaveis: (l.contato || l.whatsapp || l.email) ? [{ id: MD.uid(), nome: l.contato || '', cargo: '', whatsapp: l.whatsapp || '', email: l.email || '', nascimento: '', notas: '' }] : [], documentos: [], mensalidade: +l.valor || 0, tipoCliente: tipo || 'recorrente', status: 'Ativo', desde: MD.today(), notas: l.notas };
    },
    // Botão "Tornar cliente": abre o cadastro pré-preenchido do lead (você ESCOLHE o tipo). Ao salvar, marca o lead como Ganho.
    transformarLeadEmCliente(l) {
      const nome = (l.empresa || '').trim().toLowerCase();
      if (this.clients.some(c => (c.empresa || '').trim().toLowerCase() === nome)) { if (!confirm('Já existe um cliente com esse nome. Abrir o cadastro mesmo assim?')) return; }
      this._onbConvertendo = null;
      this.editing = { id: '', ...this._dadosClienteDeLead(l, 'recorrente') };
      this._leadConvertendo = l.id;
      this.cnpjMsg = ''; this.cepMsg = ''; this.modal = 'client';
    },
    // Conversão direta (sem modal) — usada na aprovação automática de proposta.
    async _criarClienteDeLead(l, tipo) {
      if (!l || !l.empresa) return;
      const nome = (l.empresa || '').trim().toLowerCase();
      if (!this.clients.some(c => (c.empresa || '').trim().toLowerCase() === nome)) {
        try { await this.api('POST', '/clientes', { empresa: l.empresa, dados: this._dadosClienteDeLead(l, tipo || 'recorrente') }); await this.carregarClientes(); } catch {}
      }
      if (l.stage !== 'Ganho') { l.stage = 'Ganho'; try { await this.salvarLeadApi(l); } catch {} }
    },
    // Proposta aprovada? Se o cliente dela ainda é um LEAD, vira cliente (Recorrente) automaticamente.
    _aoAprovarProposta(o) {
      if (!o || !o.cliente) return;
      const nome = (o.cliente || '').trim().toLowerCase();
      if (this.clients.some(c => (c.empresa || '').trim().toLowerCase() === nome)) return; // já é cliente
      const lead = (this.leads || []).find(l => (l.empresa || '').trim().toLowerCase() === nome);
      if (lead) this._criarClienteDeLead(lead, 'recorrente');
    },
    // Proposta enviada → o lead vinculado (mesmo nome) vai pra coluna "Proposta" do funil.
    _moverLeadParaProposta(clienteNome) {
      const nome = (clienteNome || '').trim().toLowerCase(); if (!nome) return;
      const lead = (this.leads || []).find(l => (l.empresa || '').trim().toLowerCase() === nome);
      if (!lead) return;
      const ps = ((this.crmStages && this.crmStages.length) ? this.crmStages : STAGES).find(s => /proposta/i.test(s.id));
      const alvo = ps ? ps.id : 'Proposta';
      if (['Ganho', 'Perdido'].includes(lead.stage) || lead.stage === alvo) return; // não rebaixa fechado nem repete
      lead.stage = alvo; this.salvarLeadApi(lead).catch(() => {});
    },
    async ganharLead(l) {
      const antes = l.stage;
      l.stage = 'Ganho'; try { await this.salvarLeadApi(l); } catch {}
      if (antes !== 'Ganho') this.registrarProducao('negocio', l.empresa || '', +l.valor || 0);
      if (!this.clients.some(c => c.empresa === l.empresa)) {
        try { await this.api('POST', '/clientes', { empresa: l.empresa, dados: this._dadosClienteDeLead(l, 'recorrente') }); await this.carregarClientes(); } catch (e) { alert('Lead ganho, mas falhou ao criar o cliente: ' + e.message); }
      }
      this.modal = null;
    },
  }));
});
