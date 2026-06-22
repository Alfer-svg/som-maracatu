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
  { id: 'Ganho',       ico: '🏆', color: '#16a34a', desc: 'Fechou! O lead vira cliente ativo.' },
  { id: 'Perdido',     ico: '✕',  color: '#dc2626', desc: 'Não avançou — registre o motivo pra aprender e melhorar.' },
];
const SERVICOS = ['Gestão de Redes Sociais', 'Criação de Conteúdo', 'ADS / Tráfego Pago', 'Audiovisual', 'Sites & Apps', 'Branding', 'SEO / Growth', 'Marketing Político', 'Consultoria'];
// Objetivos comuns de agência (sugestões no dropdown; aceita texto livre).
const OBJETIVOS = [
  'Seguidores no Instagram', 'Seguidores no TikTok', 'Inscritos no YouTube', 'Curtidas no Facebook',
  'Engajamento (curtidas/comentários)', 'Alcance / impressões', 'Visualizações de vídeo',
  'Leads gerados por mês', 'Mensagens no WhatsApp', 'Orçamentos / agendamentos', 'Vendas / conversões',
  'Tráfego no site (visitas)', 'Custo por lead (CPL)', 'ROAS (retorno em ADS)', 'Taxa de conversão',
  'Avaliações no Google Meu Negócio', 'Posições no topo do Google (SEO)', 'Reconhecimento de marca',
];
const ORIGENS = ['Instagram', 'Indicação', 'Google', 'WhatsApp', 'Prospecção ativa', 'Site', 'Evento', 'Outros'];
const PROJ_STATUS = [
  { id: 'A Fazer',      color: '#8a8ba3' },
  { id: 'Em Andamento', color: '#2563eb' },
  { id: 'Revisão',      color: '#f59e0b' },
  { id: 'Concluído',    color: '#16a34a' },
];
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
const FORMAS_PAGAMENTO = ['Boleto', 'Pix', 'Cartão de crédito', 'Transferência/TED'];
// Dados oficiais da agência (cabeçalho/rodapé de proposta e contrato).
const EMPRESA = {
  nome: 'Maracatu Digital Intelligence',
  cnpj: '44.258.426/0001-15',
  email: 'laura@maracatumktdigital.com',
  fone: '(11) 96624-9876',
  endereco: 'Av. A, 4165 – Torre 6, Sl 611 e 612 – Paiva, Cabo de Santo Agostinho – PE · CEP 54522-005',
  cidade: 'Cabo de Santo Agostinho/PE',
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
const respVazio = () => ({ id: '', nome: '', cargo: '', whatsapp: '', email: '', nascimento: '', instagram: '', linkedin: '', seguindo: false, notas: '' });
const respMerge = (arr) => (Array.isArray(arr) ? arr : []).slice(0, 5).map(r => ({ ...respVazio(), ...r, id: r.id || MD.uid() }));
// Documentos do cliente (links — contrato, proposta, etc.). Salvo em dados.documentos.
const TIPOS_DOC = ['Contrato', 'Proposta', 'Apresentação', 'Relatório', 'Briefing', 'Identidade visual', 'Outro'];
const TIPOS_INTER = [['Ligação', '📞'], ['WhatsApp', '💬'], ['E-mail', '✉️'], ['Reunião', '🤝'], ['Visita', '📍'], ['Nota', '📝']];
const TIPOS_POST = ['Estático', 'Carrossel', 'Animação', 'Vídeo'];

/* ---------- Pessoal: perfis de acesso (papéis) e o que cada um enxerga ---------- */
const PAPEIS_INFO = [
  { id: 'admin', nome: 'Admin', desc: 'Acesso total + gerencia a equipe', cor: '#7c3aed', bg: '#ede9fe' },
  { id: 'gestor', nome: 'Gestor', desc: 'Tudo, menos gerenciar a equipe', cor: '#2563eb', bg: '#dbeafe' },
  { id: 'comercial', nome: 'Comercial', desc: 'Vendas: CRM, clientes, orçamentos e contratos (sem Financeiro nem Operacional)', cor: '#0d9488', bg: '#ccfbf1' },
  { id: 'colaborador', nome: 'Colaborador', desc: 'Operacional, CRM e Monitoramento (sem Financeiro nem senhas)', cor: '#16a34a', bg: '#dcfce7' },
  { id: 'financeiro', nome: 'Financeiro', desc: 'Financeiro + Dashboard', cor: '#d97706', bg: '#fef3c7' },
];
// '*' = todas as páginas. Demais: lista de páginas liberadas.
const PERMISSOES = {
  admin: '*',
  gestor: ['dashboard', 'crm', 'comercial', 'orcamentos', 'servicos', 'contratos', 'financeiro', 'operacional', 'monitoramento', 'onboarding'],
  comercial: ['dashboard', 'crm', 'comercial', 'orcamentos', 'servicos', 'contratos', 'monitoramento', 'onboarding'],
  colaborador: ['dashboard', 'crm', 'comercial', 'operacional', 'monitoramento', 'onboarding'],
  financeiro: ['dashboard', 'comercial', 'orcamentos', 'contratos', 'financeiro'],
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
    STAGES, SERVICOS, ORIGENS, PROJ_STATUS, FIN_CATEGORIAS, FORN_CATEGORIAS, ORC_STATUS, CONTR_STATUS, PERIODICIDADES, FORMAS_PAGAMENTO, EMPRESA, REDES, ADS, ADS_PLATAFORMAS, ITENS_CRED,
    busca: '',
    monitorSel: '', // id do cliente aberto no fichário de monitoramento
    radarAberto: true, // painel Radar do Monitoramento expandido
    radarSnooze: MD.get('som_radar_snooze', {}), // {chave: data-de-volta} — pendências resolvidas/adiadas
    novaInter: { tipo: 'Ligação', texto: '' }, // form de nova interação na timeline
    radarAutolog: MD.get('som_radar_autolog', true), // auto-registrar ações do Radar no histórico
    TIPOS_INTER,
    // Pessoal — perfis de acesso + gestão de equipe
    PAPEIS_INFO,
    usuarios: [], // equipe completa (só admin lê)
    equipe: [], // equipe enxuta {id,nome,papel} p/ dropdowns (qualquer logado)
    pessoaForm: { id: '', nome: '', email: '', papel: 'colaborador', senha: '', foto: '' },
    pessoaModal: false, pessoaMsg: '',
    fichaForm: { id: '', nome: '', papel: '', foto: '', ficha: {} },
    fichaModal: false, fichaMsg: '',
    comTab: 'lista', // aba ativa em Clientes: 'lista' | 'onboarding'
    verArquivados: false, // lista de Clientes: mostrar arquivados (inativos) em vez dos ativos
    verArquivadosContrato: false, // lista de Contratos: mostrar arquivados (encerrados/vencidos +10d)
    verArquivadosOrc: false, // lista de Orçamentos: mostrar arquivados (recusados/vencidos)
    presenca: [], // quem está online (Operacional); admin vê todos
    opTab: 'quadro', // vista do Operacional: 'quadro' (kanban) | 'semana' (programação) | 'layouts'
    TRELLO_LABELS, dragId: null, dropCol: null, // arrastar cards entre listas (estilo Trello)
    cardModal: false, cardRef: null, labelNames: {}, labelEdit: false, labelDrop: false, novoItemCheck: '', // card-detalhe Trello
    novoComentario: '', novoAnexoNome: '', novoAnexoUrl: '', // comentários + anexos do card
    cloudCfg: { cloud: '', preset: '' }, uploadando: false, // storage de arquivos (Cloudinary)
    cronTick: 0, // tique de 1s pra o cronômetro ao vivo
    quickAddCol: '', quickAddText: '', // adicionar cartão rápido
    layouts: [], layoutModal: false, layoutAtual: null, // layout da semana (Fase 2/3)
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
    modal: null, // 'lead' | 'client' | 'finance' | 'project'
    editing: {},
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
      if (this.token) { this.page = MD.get('som_page', 'dashboard'); this.garantirPaginaPermitida(); this.carregarClientes(); this.carregarOnboardings(); this.carregarColecoes(); this.carregarEquipe(); this.startHeartbeat(); this.startChatMonitor(); this.go(this.page); }
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
        this.loginSenha = ''; this.garantirPaginaPermitida(); this.startHeartbeat(); this.heartbeat(); this.initAudio(); this.pedirNotif(); this.startChatMonitor(); await this.carregarClientes(); this.carregarOnboardings(); this.carregarColecoes(); this.carregarEquipe();
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
      } catch (e) { console.warn('carregarClientes:', e.message); }
      finally { this.carregando = false; }
    },
    // ── CRM (leads) e Operacional (projetos): agora no backend ──
    async carregarLeads() { try { const r = await this.api('GET', '/leads'); this.leads = (r || []).map(x => ({ id: x.id, ...(x.dados || {}) })); } catch { } },
    async carregarProjetos() { try { const r = await this.api('GET', '/projetos'); this.projects = (r || []).map(x => ({ id: x.id, ...(x.dados || {}) })); } catch { } },
    async salvarLeadApi(l) { const { id, ...dados } = l; const r = await this.api('POST', '/leads', { id, dados }); if (r && r.id && !id) l.id = r.id; return r; },
    async salvarProjetoApi(p) { const { id, ...dados } = p; const r = await this.api('POST', '/projetos', { id, dados }); if (r && r.id && !id) p.id = r.id; return r; },
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
    go(p) { if (!this.podeVer(p)) return; this.page = p; MD.set('som_page', p); this.busca = ''; if (p === 'monitoramento' && this.monitorCliente) this.carregarCredenciais(this.monitorCliente.id); if (p === 'comercial') { this.comTab = 'lista'; this.carregarOnboardings(); } if (p === 'crm') this.carregarLeads(); if (p === 'pessoal') { this.carregarUsuarios(); } if (p === 'configuracoes') { this.carregarUsuarios(); this.carregarCloud(); } if (p === 'operacional') { this.carregarPresenca(); this.carregarProjetos(); this.carregarLayouts(); this.carregarLabels(); this.carregarCloud(); } if (p === 'relatorios') this.carregarRelatorio(); },
    // ── Perfis de acesso (RBAC) ──
    get papel() { return (this.usuario && this.usuario.papel) || 'colaborador'; },
    get ehAdmin() { return this.papel === 'admin'; },
    podeVer(p) { const perm = PERMISSOES[this.papel]; return perm === '*' ? true : (Array.isArray(perm) && perm.includes(p)); },
    get paginaInicial() { return this.podeVer('dashboard') ? 'dashboard' : (['operacional', 'monitoramento', 'crm', 'financeiro', 'comercial'].find(p => this.podeVer(p)) || 'dashboard'); },
    garantirPaginaPermitida() { if (this.token && !this.podeVer(this.page)) this.page = this.paginaInicial; },
    // ── Pessoal: gestão de equipe (admin) ──
    papelInfo(id) { return PAPEIS_INFO.find(x => x.id === id) || { nome: id || '—', cor: '#6b7280', bg: '#f1f5f9', desc: '' }; },
    async carregarUsuarios() { if (!this.ehAdmin) return; try { this.usuarios = (await this.api('GET', '/auth/usuarios')) || []; } catch (e) { this.usuarios = []; } },
    async carregarEquipe() { try { this.equipe = (await this.api('GET', '/auth/equipe')) || []; } catch { this.equipe = []; } },
    // ── Presença / online (Operacional) ──
    async heartbeat() { try { await this.api('POST', '/auth/heartbeat', {}); } catch {} },
    async carregarPresenca() { try { this.presenca = (await this.api('GET', '/auth/presenca')) || []; } catch { this.presenca = []; } },
    startHeartbeat() {
      if (this._hbStarted) return; this._hbStarted = true;
      if (this.token) this.heartbeat();
      setInterval(() => {
        if (!this.token) return;
        this.heartbeat();
        if (this.page === 'operacional') this.carregarPresenca(); // mantém os tempos vivos
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
        await this.api('PATCH', '/auth/usuarios/' + f.id, { nome: f.nome, ficha: f.ficha || {} });
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
        if (f.id) await this.api('PATCH', '/auth/usuarios/' + f.id, { nome: f.nome, papel: f.papel, senha: f.senha || undefined, foto: f.foto || '' });
        else await this.api('POST', '/auth/usuarios', { nome: f.nome, email: f.email, papel: f.papel, senha: f.senha, foto: f.foto || '' });
        await this.carregarUsuarios(); this.carregarEquipe(); this.pessoaModal = false;
      } catch (e) { this.pessoaMsg = '⚠ ' + e.message; }
    },
    // foto de perfil: lê arquivo, redimensiona no navegador e guarda como base64
    async lerFotoArquivo(e) {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Selecione uma imagem.'); return; }
      if (this.cloudOk) { // sobe pro Cloudinary (não pesa o banco)
        this.uploadando = true;
        try { const u = await this.uploadArquivo(file); if (u) this.pessoaForm.foto = u; }
        catch (err) { alert(err.message); } finally { this.uploadando = false; e.target.value = ''; }
        return;
      }
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => {
        const S = 240; const cv = document.createElement('canvas'); cv.width = S; cv.height = S; const ctx = cv.getContext('2d');
        const sc = Math.max(S / img.width, S / img.height); const w = img.width * sc, h = img.height * sc;
        ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        this.pessoaForm.foto = cv.toDataURL('image/jpeg', 0.82); URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    fotoDe(nome) { const m = (this.equipe || []).find(x => x.nome === nome) || (this.usuarios || []).find(x => x.nome === nome); return m && m.foto ? m.foto : ''; },
    async removerColaborador(u) {
      if (!confirm('Remover ' + u.nome + ' da equipe? Ele perde o acesso ao sistema.')) return;
      try { await this.api('DELETE', '/auth/usuarios/' + u.id); await this.carregarUsuarios(); }
      catch (e) { alert(e.message); }
    },
    // ── Onboardings recebidos do site ──
    async carregarOnboardings() { try { this.onboardings = (await this.api('GET', '/onboarding/admin')) || []; } catch { this.onboardings = []; } this.autoConverterOnboardings(); },
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
          cnpj: a.empresa_documento || '', razaoSocial: '', empresa: o.empresa, slogan: a.empresa_slogan || '',
          cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
          contato: '', cargo: '', email: '', whatsapp: '', telefone: '', instagram: '',
          servicos: [], redes: redesVazias(), site: { url: a.empresa_site || '', seo: 0, sgo: 0 },
          dominio: { provedor: '', vencimento: '' }, hospedagem: { provedor: '', vencimento: '' }, ads: adsVazio(), objetivos: [],
          briefing: b, responsaveis: [], documentos: docs, mensalidade: 0, status: 'Ativo', desde: MD.today(),
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
          documentos: [], mensalidade: 0, status: 'Ativo', desde: MD.today(),
          notas: (d.gmn && d.gmn.acesso) ? ('Google Meu Negócio: ' + d.gmn.acesso) : '',
        };
      }
      return dados;
    },
    async converterOnboarding(o) {
      // Trava anti-duplicado: se já existe cliente com o mesmo nome, não cria outro.
      const nome = (o.empresa || '').trim().toLowerCase();
      const existe = (this.clients || []).find(c => (c.empresa || '').trim().toLowerCase() === nome);
      if (existe) {
        if (!confirm('Já existe o cliente "' + existe.empresa + '". Não vou duplicar — marco este onboarding como convertido. Ok?')) return;
        try { await this.api('POST', '/onboarding/admin/' + o.id + '/convertido', {}); } catch {}
        this.onbModal = false; await this.carregarOnboardings();
        return;
      }
      const dados = this._dadosDoOnboarding(o);
      try {
        await this.api('POST', '/clientes', { empresa: o.empresa, dados });
        await this.api('POST', '/onboarding/admin/' + o.id + '/convertido', {});
        this.onbModal = false; await this.carregarClientes(); await this.carregarOnboardings();
        alert('Cliente "' + o.empresa + '" criado a partir do onboarding. ✅');
      } catch (e) { alert(e.message || 'Falha ao converter.'); }
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
    get clientesAtivos() { return this.clients.filter(c => c.status !== 'Inativo').length; },
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
    get mrr()        { return this.clients.filter(c => c.status !== 'Inativo').reduce((a, c) => a + (+c.mensalidade || 0), 0); },

    // ───────────────── CRM ─────────────────
    leadsDoEstagio(s) {
      const q = this.busca.toLowerCase();
      return this.leads.filter(l => l.stage === s && (!q || (l.empresa + ' ' + l.contato).toLowerCase().includes(q)));
    },
    stageInfo(s) { return STAGES.find(x => x.id === s) || STAGES[0]; },
    novoLead(stage = 'Novo') { this.editing = { id: '', empresa: '', contato: '', whatsapp: '', email: '', cidade: '', servico: '', origem: 'Instagram', cnpj: '', valor: 0, stage, notas: '', createdAt: MD.today() }; this.cnpjMsg = ''; this.modal = 'lead'; },
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

    // ───────────────── COMERCIAL: clientes ─────────────────
    get clientesFiltrados() {
      const q = this.busca.toLowerCase();
      return this.clients
        .filter(c => this.verArquivados ? (c.status === 'Inativo') : (c.status !== 'Inativo'))
        .filter(c => !q || (c.empresa + ' ' + (c.razaoSocial || '') + ' ' + (c.contato || '')).toLowerCase().includes(q));
    },
    get clientesArquivadosCount() { return this.clients.filter(c => c.status === 'Inativo').length; },
    // Lista de clientes pros dropdowns/datalists dos formulários — só ATIVOS (não Inativo).
    get clientesLista() { return this.clients.filter(c => (c.status || 'Ativo') !== 'Inativo').sort((a, b) => (a.empresa || '').localeCompare(b.empresa || '')); },
    ativarCliente(c) { c.status = 'Ativo'; return this.persistirCliente(c); },
    arquivarCliente(c) { c.status = 'Inativo'; return this.persistirCliente(c); },
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
        mensalidade: 0, status: 'Ativo', desde: MD.today(), notas: '',
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
      this.editing = {
        ...c,
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
    _logInteracao(c, tipo, texto) {
      if (!c) return; if (!Array.isArray(c.timeline)) c.timeline = [];
      c.timeline.unshift({ id: MD.uid(), em: new Date().toISOString(), tipo, texto, por: (this.usuario && this.usuario.nome) || '' });
      this.registrarProducao('atendimento', tipo + (c.empresa ? (' · ' + c.empresa) : ''));
      return this.persistirCliente(c);
    },
    async registrarProducao(tipo, descricao, valor) { try { await this.api('POST', '/producao', { tipo, descricao, valor }); } catch {} },
    async addInteracao() {
      const c = this.monitorCliente; if (!c) return;
      const t = (this.novaInter.texto || '').trim(); if (!t) return alert('Escreva o que aconteceu.');
      await this._logInteracao(c, this.novaInter.tipo, t);
      this.novaInter = { tipo: 'Ligação', texto: '' };
    },
    async removerInteracao(c, id) {
      if (!c || !confirm('Remover este registro do histórico?')) return;
      c.timeline = (c.timeline || []).filter(x => x.id !== id);
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
    mediaRedes(c) { const rs = this.redesDoCliente(c); return rs.length ? Math.round(rs.reduce((a, r) => a + (+c.redes[r.id].score || 0), 0) / rs.length) : 0; },
    get monitorCliente() { const list = this.clientesFiltrados; if (!list.length) return null; return list.find(c => c.id === this.monitorSel) || list[0]; },
    async abrirMonitor(id) { this.monitorSel = id; await this.carregarCredenciais(id); },
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
        this.cnpjMsg = '✓ Preenchido: ' + (d.razao_social || '') + (d.descricao_situacao_cadastral ? ' (' + d.descricao_situacao_cadastral + ')' : '');
      } catch (err) { this.cnpjMsg = '⚠ ' + (err.message || 'Não foi possível consultar.'); }
      finally { this.cnpjLoading = false; }
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
      const resp = prompt('Data da quitação (dd/mm/aaaa):', MD.fmtDate(MD.today()));
      if (resp === null) return; // cancelou: não liquida
      f.pagoEm = this._parseDataBR(resp) || MD.today();
      f.status = 'pago';
      this.persist('finance', this.finance);
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

    // ───────────────── COBRANÇA (fatura, boleto Cora, e-mail, zap) ─────────────────
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
    // Boleto via Cora (backend) — chave configurada por último
    async gerarBoleto(f) {
      if (f.tipo !== 'receita') return alert('Boleto é gerado para receitas (cobrança de cliente).');
      if (!confirm('Gerar boleto na Cora para ' + (f.cliente || 'cliente') + ' — ' + MD.fmtCur(f.valor) + '?')) return;
      f._cobrando = 'boleto';
      try {
        const r = await this.api('POST', '/cobranca/boleto', { financeId: f.id, numero: this.numLancamento(f), cliente: f.cliente, valor: +f.valor, vencimento: f.vencimento, descricao: f.descricao, email: f.emailCobranca, whatsapp: f.whatsappCobranca });
        f.boletoUrl = r.url || r.pdf || ''; f.linhaDigitavel = r.linhaDigitavel || r.barcode || ''; f.pix = r.pix || r.pixCopiaECola || r.pix_copia_cola || ''; f.boletoId = r.id || '';
        this.persist('finance', this.finance);
        alert('Boleto gerado na Cora!' + (f.boletoUrl ? '\n' + f.boletoUrl : ''));
      } catch (err) { alert('Não foi possível gerar o boleto: ' + err.message + '\n\n(Falta configurar a chave da Cora no backend — deixamos pro final.)'); }
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
        await this.api('POST', '/cobranca/email', { financeId: f.id, numero: this.numLancamento(f), email, cliente: f.cliente, valor: +f.valor, vencimento: f.vencimento, descricao: f.descricao, boletoUrl: f.boletoUrl || '', linhaDigitavel: f.linhaDigitavel || '' });
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
    finCardBorder(f) { return 'border-left:3px solid ' + this.finDotCor(f); },
    copiar(txt, label) { if (!txt) return; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => alert((label || 'Texto') + ' copiado!')).catch(() => prompt('Copie:', txt)); },
    abrirUrl(u) { if (u) window.open(u, '_blank'); else alert('Sem link disponível.'); },
    alterarVencimento(f) {
      const resp = prompt('Nova data de vencimento (dd/mm/aaaa):', MD.fmtDate(f.vencimento || MD.today()));
      if (resp === null) return;
      const iso = this._parseDataBR(resp); if (!iso) return alert('Data inválida (use dd/mm/aaaa).');
      f.vencimento = iso; this.persist('finance', this.finance);
    },
    receberPagar(f) { this.togglePago(f); }, // "Receber"/"Pagar" = liquidar (pede a data)
    async sincronizarBoleto(f) {
      if (!f.boletoId) return alert('Boleto sem ID para sincronizar.');
      try { const r = await this.api('GET', '/cobranca/boleto/' + f.boletoId); if (r && (r.status === 'pago' || r.pago)) { f.status = 'pago'; if (!f.pagoEm) f.pagoEm = MD.today(); } this.persist('finance', this.finance); alert('Status sincronizado com a Cora.'); }
      catch (e) { alert('Sincronização indisponível — a Cora ainda não está configurada no servidor.'); }
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
    projStatusInfo(s) { return PROJ_STATUS.find(x => x.id === s) || PROJ_STATUS[0]; },
    // ── Trello: etiquetas + arrastar ──
    labelCor(key) { const l = TRELLO_LABELS.find(x => x.key === key); return l ? l.cor : '#b3b9c4'; },
    labelTextCor(key) { return ['yellow', 'lime', 'sky'].includes(key) ? '#172b4d' : '#fff'; },
    toggleLabel(key) { if (!Array.isArray(this.editing.labels)) this.editing.labels = []; const i = this.editing.labels.indexOf(key); if (i >= 0) this.editing.labels.splice(i, 1); else this.editing.labels.push(key); },
    prazoCor(p) { if (!p.prazo || p.status === 'Concluído') return ''; const s = this.semanaAtual; if (p.prazo < s.ini) return '#eb5a46'; if (p.prazo <= s.fim) return '#ff9f1a'; return ''; },
    iniciais(nome) { return (nome || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase(); },
    avatarBg(nome) { const m = (this.equipe || []).find(x => x.nome === nome); return m ? this.papelInfo(m.papel).bg : '#dfe1e6'; },
    avatarFg(nome) { const m = (this.equipe || []).find(x => x.nome === nome); return m ? this.papelInfo(m.papel).cor : '#5e6c84'; },
    onDropProjeto(status) { const p = this.projects.find(x => x.id === this.dragId); if (p && p.status !== status) this.moverProjeto(p, status); this.dragId = null; this.dropCol = null; },
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
          const envolvido = (d.membros || []).includes(eu) || d.responsavel === eu;
          const aberto = this.cardModal && this.cardRef && this.cardRef.id === r.id;
          if (novas.length && envolvido && !aberto) { const u = novas[novas.length - 1]; this.notificarMsg(d.tema || d.nome || 'Card', u.autor, u.texto); }
        }
        this._chatSeen[r.id] = maxTs;
      }
      this._chatBaseline = true;
    },
    initAudio() { try { this._audioCtx = this._audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (this._audioCtx.state === 'suspended') this._audioCtx.resume(); } catch { } },
    tocarBeep() {
      try {
        const ctx = this._audioCtx; if (!ctx) return; const t = ctx.currentTime;
        const beep = (freq, ini, dur) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t + ini); g.gain.exponentialRampToValueAtTime(0.25, t + ini + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + ini + dur); o.start(t + ini); o.stop(t + ini + dur + 0.02); };
        beep(880, 0, 0.32); beep(1175, 0.16, 0.34);
      } catch { }
    },
    async pedirNotif() { try { if (window.Notification && Notification.permission === 'default') await Notification.requestPermission(); } catch { } },
    notificarMsg(card, autor, texto) {
      this.tocarBeep();
      try {
        if (window.Notification && Notification.permission === 'granted') {
          const n = new Notification(autor + ' · ' + card, { body: texto, icon: new URL('assets/icon.png?v=6', location.href).href, tag: 'som-chat-' + card });
          n.onclick = () => { window.focus(); n.close(); };
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
    // Toast visível dentro do app (some sozinho).
    mostrarToast(msg) { this.toastMsg = msg; clearTimeout(this._toastT); this._toastT = setTimeout(() => { this.toastMsg = ''; }, 8000); },
    toggleLabelCard(key) { const a = this.cardRef.labels; const i = a.indexOf(key); if (i >= 0) a.splice(i, 1); else a.push(key); this.salvarCard(); },
    toggleMembro(nome) { const a = this.cardRef.membros; const i = a.indexOf(nome); if (i >= 0) a.splice(i, 1); else a.push(nome); this.salvarCard(); },
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
    async quickAdd(status) {
      const t = (this.quickAddText || '').trim(); if (!t) { this.quickAddCol = ''; return; }
      try { await this.salvarProjetoApi({ id: '', nome: t, cliente: '', servico: 'Gestão de Redes Sociais', responsavel: '', status, prazo: '', progresso: 0, notas: '', labels: [], membros: [], checklist: [] }); await this.carregarProjetos(); this.quickAddText = ''; }
      catch (e) { alert(e.message); }
    },
    // ── Programação semanal (checklist por colaborador) ──
    get semanaAtual() {
      const hoje = new Date(Date.now() - 3 * 3600 * 1000); const dow = (hoje.getDay() + 6) % 7; // 0=segunda
      const ini = new Date(hoje); ini.setDate(hoje.getDate() - dow);
      const fim = new Date(ini); fim.setDate(ini.getDate() + 6);
      const f = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
      const iso = d => d.toISOString().slice(0, 10);
      return { ini: iso(ini), fim: iso(fim), label: f(ini) + ' a ' + f(fim) };
    },
    // Próxima semana (seg→dom) — sugestão padrão da programação.
    get proximaSemana() {
      const ini = new Date(this.semanaAtual.ini + 'T00:00:00'); ini.setDate(ini.getDate() + 7);
      const fim = new Date(ini); fim.setDate(ini.getDate() + 6);
      const f = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
      const iso = d => d.toISOString().slice(0, 10);
      return { ini: iso(ini), fim: iso(fim), label: f(ini) + ' a ' + f(fim) };
    },
    semanaLabelDe(iniIso) {
      if (!iniIso) return '';
      const ini = new Date(iniIso + 'T00:00:00'); if (isNaN(ini.getTime())) return '';
      const fim = new Date(ini); fim.setDate(ini.getDate() + 6);
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
    progColaboradores() {
      const q = this.busca.toLowerCase();
      const nomes = this.equipe.map(m => m.nome);
      const temSem = this.projects.some(p => !(p.responsavel || '').trim());
      const lista = [...nomes]; if (temSem) lista.push('');
      return lista
        .map(n => ({ nome: n || 'Sem responsável', ref: n, projetos: this.projects.filter(p => (p.responsavel || '') === n && (!q || (p.nome + ' ' + (p.cliente || '')).toLowerCase().includes(q))) }))
        .filter(g => g.projetos.length);
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
    // ── Programação: calendário de posts de redes sociais (vários de uma vez) ──
    TIPOS_POST,
    postVazio() { return { data: (this.progForm && this.progForm.semanaIni) || this.semanaAtual.ini, tipo: 'Estático', tema: '', descricao: '', legenda: '', criativo: '' }; },
    abrirProgramacao() {
      if (!this.equipe.length) this.carregarEquipe();
      // Sugere SEMPRE a próxima semana (seg→dom), editável.
      this.progForm = { cliente: '', responsavel: '', semanaIni: this.proximaSemana.ini };
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
            responsavel: f.responsavel, status: 'A Fazer', prazo: po.data || f.semanaIni || '', progresso: 0, notas: '',
            isPost: true, tipoPost: po.tipo, tema: po.tema, descricao: po.descricao, legenda: po.legenda, criativo: po.criativo,
          });
        }
        await this.carregarProjetos();
        this.progModal = false; this.opTab = 'semana';
      } catch (e) { alert(e.message || 'Falha ao criar a programação.'); }
    },
    // ── Post individual (ver/editar) ──
    diaSemanaLabel(dataStr) { if (!dataStr) return ''; const d = new Date(dataStr + 'T00:00:00'); if (isNaN(d.getTime())) return ''; const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; return dias[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); },
    editarPost(p) { this.postRef = p; this.postForm = { id: p.id, data: p.prazo || '', tipo: p.tipoPost || 'Estático', tema: p.tema || p.nome || '', descricao: p.descricao || '', legenda: p.legenda || '', criativo: p.criativo || '' }; this.postModal = true; },
    async salvarPost() {
      const f = this.postForm, p = this.postRef; if (!p) return;
      p.tipoPost = f.tipo; p.tema = f.tema; p.nome = f.tema || p.nome; p.descricao = f.descricao; p.legenda = f.legenda; p.criativo = f.criativo; p.prazo = f.data;
      try { await this.salvarProjetoApi(p); await this.carregarProjetos(); this.postModal = false; }
      catch (e) { alert(e.message || 'Falha ao salvar o post.'); }
    },
    // ── LAYOUT da semana (Fase 2) ──
    async carregarLayouts() { try { this.layouts = (await this.api('GET', '/layouts')) || []; } catch { this.layouts = []; } },
    postsDoClienteSemana(cliente) {
      const s = this.semanaAtual;
      return this.projects.filter(p => p.isPost && p.cliente === cliente && p.prazo >= s.ini && p.prazo <= s.fim)
        .sort((a, b) => (a.prazo || '') < (b.prazo || '') ? -1 : 1);
    },
    progClientesSemana() {
      const s = this.semanaAtual;
      const cli = [...new Set(this.projects.filter(p => p.isPost && p.prazo >= s.ini && p.prazo <= s.fim).map(p => p.cliente))].filter(Boolean).sort();
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
    // ── Fase 3: enviar pro cliente aprovar (congela um snapshot dos posts da semana) ──
    async enviarLayoutCliente() {
      if (!this.layoutAtual) return;
      const snap = this.layoutPostsAtual.map(p => ({
        prazo: p.prazo, tipoPost: p.tipoPost || 'Estático', tema: p.tema || p.nome || '',
        legenda: p.legenda || '', criativo: p.criativo || '', status: p.status || '',
      }));
      if (!snap.length && !confirm('Não há posts nesta semana. Enviar mesmo assim (só o PDF/observações)?')) return;
      await this.patchLayout({ status: 'ENVIADO', postsSnapshot: snap });
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
    novoProjeto(status = 'A Fazer') { if (!this.equipe.length) this.carregarEquipe(); this.modeloSel = ''; this.editing = { id: '', nome: '', cliente: '', servico: 'Gestão de Redes Sociais', responsavel: '', status, prazo: '', progresso: 0, notas: '', labels: [] }; this.modal = 'project'; },
    editarProjeto(p) { if (!this.equipe.length) this.carregarEquipe(); this.modeloSel = ''; this.editing = { ...p, labels: Array.isArray(p.labels) ? [...p.labels] : [] }; this.modal = 'project'; },
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
    // Arquivado = Recusado OU vencido (passou da validade) e não aprovado.
    orcamentoArquivado(o) { if (o.status === 'Recusado') return true; if (o.status === 'Aprovado') return false; const v = this.validadeData(o); return !!(v && v < MD.today()); },
    get orcamentosArquivadosCount() { return this.proposals.filter(o => this.orcamentoArquivado(o)).length; },
    get orcamentosFiltrados() {
      const q = this.busca.toLowerCase();
      return [...this.proposals]
        .filter(o => this.verArquivadosOrc ? this.orcamentoArquivado(o) : !this.orcamentoArquivado(o))
        .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
        .filter(o => !q || ((o.numero || '') + ' ' + (o.cliente || '') + ' ' + (o.projeto || '') + ' ' + (o.descricao || '')).toLowerCase().includes(q));
    },
    orcStatusInfo(s) { return ORC_STATUS.find(x => x.id === s) || ORC_STATUS[0]; },
    // Total mensal = soma dos serviços (fallback no campo valor legado de orçamentos antigos).
    orcTotal(o) { const s = o && o.servicos; if (Array.isArray(s) && s.length) return s.reduce((a, x) => a + (+x.valor || 0), 0); return +(o && o.valor) || 0; },
    servicoVazio() { return { id: MD.uid(), nome: '', valor: 0, escopo: '', _open: true }; },
    // Acordeão dos serviços: recolher (salva o item visualmente) / abrir (1 por vez)
    recolherServico(s) { if (!s.nome) return alert('Dê um nome ao serviço antes de recolher.'); s._open = false; },
    abrirServico(s) { (this.editing.servicos || []).forEach(x => x._open = false); s._open = true; },
    _projSel(p) { return PROJETO_OPCOES.includes(p) ? p : (p ? 'Outros' : ''); }, // deriva o valor do dropdown a partir do texto salvo
    novoOrcamento() { this.editing = { id: '', numero: this.proximoNumero('ORC', this.proposals), cliente: '', contato: '', email: '', projeto: '', servicos: [this.servicoVazio()], vigenciaMeses: 6, formaPagamento: 'Boleto', diaVencimento: 5, status: 'Rascunho', data: MD.today(), validade: 30, observacoes: '', modoAssinatura: 'presencial' }; this.projetoSel = ''; this.modal = 'orcamento'; },
    editarOrcamento(o) { this.editing = { servicos: [], contato: '', email: '', projeto: '', vigenciaMeses: 6, formaPagamento: 'Boleto', diaVencimento: 5, validade: 30, modoAssinatura: 'presencial', ...o }; if (!Array.isArray(this.editing.servicos) || !this.editing.servicos.length) this.editing.servicos = [{ ...this.servicoVazio(), nome: o.descricao || '', valor: +o.valor || 0 }]; this.editing.servicos = this.editing.servicos.map(s => ({ id: MD.uid(), nome: '', valor: 0, escopo: '', ...s, _open: false })); this.projetoSel = this._projSel(this.editing.projeto); this.modal = 'orcamento'; },
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
      if (saved && saved.status === 'Aprovado' && !saved.financeId) this.lancarOrcamentoFinanceiro(saved);
    },
    async excluirOrcamento(o) { if (!confirm('Excluir o orçamento ' + (o.numero || '') + '?')) return; try { await this.api('DELETE', '/propostas/' + o.id); } catch (e) { return alert('Erro ao excluir: ' + (e.message || e)); } await this.carregarPropostas(); this.modal = null; },
    // Cria a proposta DIGITAL no backend e devolve o link público (aceite online).
    async _criarLinkProposta(o) {
      if (o.status === 'Rascunho' || !o.status) { o.status = 'Enviado'; const i = this.proposals.findIndex(x => x.id === o.id); if (i > -1) this.proposals[i] = { ...o }; } // rascunho → enviado
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
        if (resp.status === 'signed') c.status = 'Assinado';
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
        ct = { id: MD.uid(), numero: this.proximoNumero('CT', this.contracts), cliente: o.cliente || (c && (c.empresa || c.razaoSocial)) || '', documento: (c && (c.cnpj || c.documento || c.cpf)) || '', endereco: this._enderecoCliente(c), representante: o.contato || (resp0 && resp0.nome) || (c && c.contato) || '', projeto: o.projeto || '', objeto, servicos: o.servicos || [], valor: this.orcTotal(o), periodicidade: o.vigenciaMeses == 1 ? 'Único' : 'Mensal', formaPagamento: o.formaPagamento || 'Boleto', diaVencimento: o.diaVencimento || 5, inicio: MD.today(), meses: +o.vigenciaMeses || 6, fidelidadeMeses: 6, multaPercentual: 50, indiceReajuste: 'IPCA', aprovacaoDias: 2, suspensaoDias: 10, foro: EMPRESA.cidade, politico: false, propostaNumero: num, status: 'Rascunho', observacoes: o.observacoes || '' };
        this.contracts.unshift(ct); this.persist('contracts', this.contracts);
      }
      this.editing = { ...ct };
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
      this.persist('contracts', this.contracts); this.modal = null;
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
<h2>Vigência do contrato</h2><div class="bloco">${e(o.vigenciaMeses || 6)} meses via ${e(o.formaPagamento || 'Boleto')}</div>
<h2>Cronograma de cobranças</h2><table><thead><tr><th>Competência / Vencimento</th><th>Mensalidade</th><th>Forma</th></tr></thead><tbody>${cron}</tbody></table>
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
      const meses = +c.meses || 6, fid = +c.fidelidadeMeses || 6, multa = +c.multaPercentual || 50;
      const aprov = +c.aprovacaoDias || 2, susp = +c.suspensaoDias || 10, idx = c.indiceReajuste || 'IPCA';
      const foro = c.foro || EMPRESA.cidade, dia = +c.diaVencimento || 5;
      const valorLabel = MD.fmtCur(c.valor) + (c.periodicidade === 'Mensal' ? '/mês' : '');
      const objeto = String(c.objeto || '').split('\n').filter(Boolean).map(l => `<p>${e(l)}</p>`).join('') || '<p>Conforme Proposta Comercial.</p>';
      const cl = (n, t, ps) => `<div class="clausula"><h3>CLÁUSULA ${n} — ${e(t)}</h3>${ps.map(p => `<p>${p}</p>`).join('')}</div>`;
      const anexoPolitico = c.politico ? `${cl('ANEXO II', 'MARKETING POLÍTICO / ELEITORAL', [
        'Aplica-se quando a CONTRATANTE for candidato(a), partido, federação ou comitê. Regido pela Lei 9.504/1997 e Resolução TSE nº 23.607/2019 e alterações.',
        'Os serviços observarão integralmente a legislação eleitoral. <b>Todo pagamento à CONTRATADA será feito exclusivamente pela conta bancária específica de campanha</b>, e a verba de impulsionamento seguirá as regras e os limites de gastos do TSE para o cargo disputado.',
        'A CONTRATADA fornecerá a documentação necessária à prestação de contas perante a Justiça Eleitoral. O impulsionamento ocorrerá apenas nas formas permitidas, por iniciativa e responsabilidade do candidato/partido.',
        'A CONTRATANTE é a única responsável pelo conteúdo eleitoral, sua veracidade e a observância dos limites de gastos, respondendo por eventuais penalidades (ex.: multa de 100% sobre o excesso de gasto).',
      ])}` : '';
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Contrato ${e(c.numero)}</title><style>${this._cssDoc()}</style></head><body>
${this._docHead('CONTRATO', c.numero, [])}
<div class="ct-title"><span class="ct-kicker">CONTRATO DE</span><div class="ct-name">Prestação de Serviços de Marketing Digital</div></div>
<div class="bloco"><b>CONTRATADA:</b> ${e(EMPRESA.nome)}, CNPJ nº ${e(EMPRESA.cnpj)}, com sede em ${e(EMPRESA.endereco)}.</div>
<div class="bloco"><b>CONTRATANTE:</b> ${e(c.cliente || '—')}${c.documento ? ', CNPJ/CPF nº ' + e(c.documento) : ''}${c.endereco ? ', com sede em ' + e(c.endereco) : ''}${c.representante ? ', neste ato representada por ' + e(c.representante) : ''}.</div>
<p style="color:#333">As partes acima celebram o presente Contrato, que se regerá pelas cláusulas seguintes.</p>
${cl('1', 'DO OBJETO', ['Prestação, pela CONTRATADA, dos serviços de marketing digital descritos na Proposta Comercial' + (c.propostaNumero ? ' nº ' + e(c.propostaNumero) : '') + ' (Anexo I), a saber:' + objeto])}
${cl('2', 'DO ESCOPO E DAS ENTREGAS', ['O escopo, entregáveis e periodicidade são os do Anexo I (Proposta). Serviços não previstos serão objeto de orçamento e aditivo escrito. Os prazos correm a partir do recebimento das informações, materiais, aprovações e acessos sob responsabilidade da CONTRATANTE.'])}
${cl('3', 'DA NATUREZA DA OBRIGAÇÃO', ['Os serviços constituem <b>obrigação de meio, e não de resultado</b>. A CONTRATADA empregará as melhores práticas, <b>não garantindo</b> resultados específicos (vendas, faturamento, seguidores, leads, posições, alcance ou conversões), que dependem de fatores alheios ao seu controle.'])}
${cl('4', 'DAS OBRIGAÇÕES DA CONTRATADA', ['Executar os serviços com zelo e técnica nos prazos acordados; informar por relatórios periódicos; manter sigilo (Cláusula 13); tratar dados conforme a LGPD (Cláusula 14); submeter peças à aprovação prévia quando aplicável.'])}
${cl('5', 'DAS OBRIGAÇÕES DA CONTRATANTE', ['Fornecer em tempo hábil informações, materiais, acessos e aprovações; <b>responsabilizar-se pela veracidade, legalidade e titularidade</b> do material que fornecer; aprovar peças nos prazos da Cláusula 6; efetuar os pagamentos; arcar com a verba de mídia (Cláusula 7).'])}
${cl('6', 'DA APROVAÇÃO DE MATERIAIS', ['As peças que exijam aprovação serão submetidas à CONTRATANTE, que deverá se manifestar em até ' + aprov + ' dias úteis. O silêncio por esse prazo implica <b>aprovação tácita</b>, autorizando a veiculação.'])}
${cl('7', 'DA VERBA DE MÍDIA (TRÁFEGO PAGO)', ['A remuneração da gestão de tráfego pago <b>não inclui</b> a verba de mídia, custeada pela CONTRATANTE e paga diretamente às plataformas ou reembolsada mediante comprovação. A CONTRATADA não responde por suspensão/bloqueio de contas ou anúncios decorrentes das políticas das plataformas, nem por oscilações de custo de mídia.'])}
${cl('8', 'DO PREÇO E PAGAMENTO', ['Pela prestação dos serviços, a CONTRATANTE pagará <b>' + e(valorLabel) + '</b>, conforme o cronograma do Anexo I, via ' + e(c.formaPagamento || 'Boleto') + ', com vencimento no dia ' + dia + ' de cada competência. O atraso sujeita a CONTRATANTE a multa de 2%, juros de 1% ao mês e correção, podendo os serviços ser suspensos após ' + susp + ' dias de inadimplência.'])}
${cl('9', 'DO REAJUSTE', ['Os valores serão reajustados anualmente, a cada 12 meses, pela variação do ' + e(idx) + ' acumulado (ou índice que o substitua).'])}
${cl('10', 'DA VIGÊNCIA', ['Vigência de <b>' + meses + ' meses</b> a partir da assinatura, <b>renovando-se automaticamente por períodos sucessivos de 6 meses</b>, salvo manifestação em contrário com a antecedência da Cláusula 11. A vigência total não excederá 4 anos (art. 598, CC), renovável por novo ajuste.'])}
${cl('11', 'DA RESCISÃO E DA MULTA', ['Qualquer parte poderá rescindir mediante aviso prévio escrito de no mínimo 30 dias. A rescisão imotivada pela CONTRATANTE antes do ' + fid + 'º mês sujeita-a a multa de ' + multa + '% sobre as mensalidades remanescentes do período de fidelidade. A rescisão por inadimplemento não sanado em 10 dias após notificação independe de multa, respondendo a parte inadimplente por perdas e danos. A rescisão não desobriga do pagamento dos serviços já prestados.'])}
${cl('12', 'DA PROPRIEDADE INTELECTUAL', ['Os direitos patrimoniais sobre as peças aprovadas e <b>efetivamente pagas</b> são cedidos à CONTRATANTE para os usos contratados, a partir da quitação. Os direitos morais do autor são inalienáveis (Lei 9.610/1998). Enquanto houver valores em aberto, os materiais permanecem da CONTRATADA. A CONTRATADA poderá usar as peças em seu portfólio, salvo vedação escrita. Em sites/sistemas, transfere-se a licença de uso do produto final; código-base e ferramentas proprietárias permanecem da CONTRATADA; itens de terceiros seguem suas licenças.'])}
${cl('13', 'DA CONFIDENCIALIDADE', ['As partes manterão sigilo sobre informações confidenciais, não as divulgando sem autorização escrita. A obrigação estende-se a sócios, empregados e subcontratados e subsiste por 5 anos após o término.'])}
${cl('14', 'DA PROTEÇÃO DE DADOS (LGPD)', ['No tratamento de dados pessoais para execução deste Contrato, a CONTRATANTE atua como <b>CONTROLADORA</b> e a CONTRATADA como <b>OPERADORA</b> (art. 5º, VI e VII, Lei 13.709/2018), tratando os dados conforme as instruções e finalidades da CONTRATANTE. A CONTRATADA adotará medidas de segurança, manterá sigilo, comunicará incidentes sem demora, auxiliará no atendimento aos direitos dos titulares e eliminará/devolverá os dados ao término. Poderá utilizar suboperadores necessários (ex.: Google, Meta, hospedagem), garantindo proteção equivalente.'])}
${cl('15', 'DA RESPONSABILIDADE PELO CONTEÚDO', ['A CONTRATANTE responde pela veracidade e legalidade das informações e produtos anunciados; a CONTRATADA observará a autorregulamentação publicitária (CONAR) e a legislação aplicável. Quem der causa a violação de direitos de terceiros responderá perante o prejudicado e ressarcirá a outra parte.'])}
${cl('16', 'DA LIMITAÇÃO DE RESPONSABILIDADE', ['Salvo dolo ou culpa grave, a responsabilidade da CONTRATADA por perdas e danos limita-se ao valor dos serviços pagos nos 3 meses anteriores ao evento, excluídos lucros cessantes e danos indiretos.'])}
${cl('17', 'DAS DISPOSIÇÕES GERAIS', ['As partes são independentes, sem vínculo societário ou trabalhista. A tolerância não importa novação. Caso fortuito e força maior excluem responsabilidade pelo período do impedimento. As comunicações usarão os contatos da qualificação/Proposta. As partes reconhecem a validade da assinatura eletrônica (MP 2.200-2/2001 e Lei 14.063/2020).'])}
${cl('18', 'DO FORO', ['Fica eleito o foro da Comarca de ' + e(foro) + ' para dirimir as questões deste Contrato, com renúncia a qualquer outro.'])}
${c.observacoes ? `<div class="bloco"><b>Observações</b>${e(c.observacoes)}</div>` : ''}
<p style="margin-top:18px;color:#333">E por estarem assim justas e contratadas, firmam o presente em via eletrônica. ${e(EMPRESA.cidade)}, ${MD.fmtDate(c.inicio)}.</p>
<div class="assin"><div>${e(EMPRESA.nome)}<br>CONTRATADA</div><div>${e(c.cliente || 'Cliente')}<br>CONTRATANTE</div></div>
<div class="assin assin-test"><div>Testemunha 1<br>Nome / CPF:</div><div>Testemunha 2<br>Nome / CPF:</div></div>
${anexoPolitico}
${this._docFoot()}
</body></html>`;
    },

    // converte lead Ganho → cliente
    async ganharLead(l) {
      const antes = l.stage;
      l.stage = 'Ganho'; try { await this.salvarLeadApi(l); } catch {}
      if (antes !== 'Ganho') this.registrarProducao('negocio', l.empresa || '', +l.valor || 0);
      if (!this.clients.some(c => c.empresa === l.empresa)) {
        const dados = { cnpj: l.cnpj || '', razaoSocial: '', empresa: l.empresa, contato: l.contato, email: l.email, whatsapp: l.whatsapp, cidade: l.cidade, servicos: l.servico ? [l.servico] : [], redes: redesVazias(), site: { url: '', seo: 0, sgo: 0 }, dominio: { provedor: '', vencimento: '' }, hospedagem: { provedor: '', vencimento: '' }, ads: adsVazio(), objetivos: [], briefing: briefingVazio(), slogan: '', responsaveis: (l.contato || l.whatsapp || l.email) ? [{ id: MD.uid(), nome: l.contato || '', cargo: '', whatsapp: l.whatsapp || '', email: l.email || '', nascimento: '', notas: '' }] : [], documentos: [], mensalidade: +l.valor || 0, status: 'Ativo', desde: MD.today(), notas: l.notas };
        try { await this.api('POST', '/clientes', { empresa: l.empresa, dados }); await this.carregarClientes(); } catch (e) { alert('Lead ganho, mas falhou ao criar o cliente: ' + e.message); }
      }
      this.modal = null;
    },
  }));
});
