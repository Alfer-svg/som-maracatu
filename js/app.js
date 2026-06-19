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
const FIN_CATEGORIAS = ['Mensalidade', 'Mídia/ADS', 'Projeto pontual', 'Salários', 'Ferramentas', 'Impostos', 'Infra', 'Outros'];
// Orçamentos (propostas comerciais) — status do funil de proposta.
const ORC_STATUS = [
  { id: 'Rascunho', color: '#8a8ba3' },
  { id: 'Enviado',  color: '#2563eb' },
  { id: 'Aprovado', color: '#16a34a' },
  { id: 'Recusado', color: '#dc2626' },
];
// Contratos — situação da vigência.
const CONTR_STATUS = [
  { id: 'Ativo',     color: '#16a34a' },
  { id: 'Pausado',   color: '#f59e0b' },
  { id: 'Encerrado', color: '#8a8ba3' },
];
const PERIODICIDADES = ['Mensal', 'Único', 'Trimestral', 'Anual'];
const FORMAS_PAGAMENTO = ['Boleto', 'Pix', 'Cartão de crédito', 'Transferência/TED'];
// Dados oficiais da agência (cabeçalho/rodapé de proposta e contrato).
const EMPRESA = {
  nome: 'Maracatu Digital Intelligence',
  cnpj: '44.258.426/0001-15',
  email: 'laura@maracatumktdigital.com',
  fone: '(81) 99914-3099',
  endereco: 'Av. A, 4165 – Torre 2, Sl 620 – Paiva, Cabo de Santo Agostinho – PE · CEP 54522-005',
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
const redeIcon = (r) => `https://cdn.simpleicons.org/${r.slug}/${r.cor}`;

// Plataformas de tráfego pago (mesmo padrão de logo das redes).
const ADS = [
  { id: 'google', label: 'Google Ads', slug: 'googleads', cor: '4285F4' },
  { id: 'meta',   label: 'Meta Ads',   slug: 'meta',      cor: '0866FF' },
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
const docVazio = () => ({ id: '', nome: '', tipo: 'Contrato', url: '' });
const docMerge = (arr) => (Array.isArray(arr) ? arr : []).map(d => ({ ...docVazio(), ...d, id: d.id || MD.uid() }));

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    page: 'dashboard',
    comOpen: true, // grupo "Comercial" (CRM + Clientes) aberto na barra lateral
    STAGES, SERVICOS, ORIGENS, PROJ_STATUS, FIN_CATEGORIAS, ORC_STATUS, CONTR_STATUS, PERIODICIDADES, FORMAS_PAGAMENTO, EMPRESA, REDES, ADS, ITENS_CRED,
    busca: '',
    monitorSel: '', // id do cliente aberto no fichário de monitoramento
    credenciais: [], credModal: false, credForm: {}, revelar: {}, // cofre de acessos
    cofreMasterDef: null, cofreMaster: '', cofreRevelado: {}, cofreModal: null, cofreA: '', cofreB: '', cofreAtual: '', cofreMsg: '', // senha master do cofre
    onboardings: [], onbModal: false, onbSel: {}, onbLink: 'https://alfer-svg.github.io/som-maracatu/onboarding.html', // fila de onboardings do site
    perfilAberto: true, // perfil do cliente (recolhível)
    enriqLoading: false, enriqMsg: '', enriqResult: null, // enriquecimento a partir do site
    psiLoading: false, psiMsg: '', // Google PageSpeed (Lighthouse)
    secCli: 'empresa', // seção aberta no acordeão do modal de cliente

    // dados
    clients: [], leads: [], proposals: [], contracts: [], finance: [], projects: [], catalogo: [],

    // modais
    modal: null, // 'lead' | 'client' | 'finance' | 'project'
    editing: {},
    cnpjLoading: false, cnpjMsg: '',
    cepLoading: false, cepMsg: '',

    // ── auth ──
    token: localStorage.getItem('som_token') || '',
    usuario: JSON.parse(localStorage.getItem('som_usuario') || 'null'),
    loginEmail: '', loginSenha: '', loginErro: '', logando: false,
    senhaModal: false, pwAtual: '', pwNova: '', pwMsg: '',
    carregando: false,

    init() {
      // CRM / financeiro / operacional ainda locais (migram numa próxima fase)
      this.leads     = MD.get('som_leads', []);
      this.proposals = MD.get('som_proposals', []);
      this.contracts = MD.get('som_contracts', []);
      this.finance   = MD.get('som_finance', []);
      this.projects  = MD.get('som_projects', []);
      this.catalogo  = MD.get('som_catalogo', []); // catálogo de serviços reusável no orçamento
      if (this.token) { this.carregarClientes(); this.carregarOnboardings(); }
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
        this.loginSenha = ''; await this.carregarClientes(); this.carregarOnboardings();
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

    // helpers de formatação expostos ao template
    fmtDate: MD.fmtDate, fmtCur: MD.fmtCur, daysDiff: MD.daysDiff, redeIcon,
    go(p) { this.page = p; this.busca = ''; if (p === 'monitoramento' && this.monitorCliente) this.carregarCredenciais(this.monitorCliente.id); if (p === 'onboarding') this.carregarOnboardings(); },
    // ── Onboardings recebidos do site ──
    async carregarOnboardings() { try { this.onboardings = (await this.api('GET', '/onboarding/admin')) || []; } catch { this.onboardings = []; } },
    verOnboarding(o) { this.onbSel = o; this.onbModal = true; },
    onbLinhas(o) {
      const d = (o && o.dados) || {}; const out = []; const add = (l, v) => { if (v != null && String(v).trim()) out.push({ label: l, v: String(v) }); };
      add('Site', d.site); add('Slogan', d.slogan); add('Google Meu Negócio', d.gmn && d.gmn.acesso);
      const r = d.responsavel || {}; add('Quem preencheu', [r.nome, r.cargo].filter(Boolean).join(' · ')); add('WhatsApp', r.whatsapp); add('E-mail', r.email);
      this.briefingItens({ briefing: d.briefing, slogan: '' }).forEach(x => out.push(x));
      const a = (d.briefing && d.briefing.ativos) || {}; add('Logo', a.logo); add('Manual de marca', a.manual); add('Drive de mídia', a.drive);
      return out;
    },
    async converterOnboarding(o) {
      const d = o.dados || {}; const r = d.responsavel || {};
      const dados = {
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
      try {
        await this.api('POST', '/clientes', { empresa: o.empresa, dados });
        await this.api('POST', '/onboarding/admin/' + o.id + '/convertido', {});
        this.onbModal = false; await this.carregarClientes(); await this.carregarOnboardings();
        alert('Cliente "' + o.empresa + '" criado a partir do onboarding. ✅');
      } catch (e) { alert(e.message || 'Falha ao converter.'); }
    },
    async arquivarOnboarding(o) {
      if (!confirm('Arquivar o onboarding de "' + o.empresa + '"? (sai da fila, sem virar cliente)')) return;
      try { await this.api('POST', '/onboarding/admin/' + o.id + '/arquivar', {}); await this.carregarOnboardings(); } catch (e) { alert(e.message); }
    },
    persist(key, arr) { MD.set('som_' + key, arr); },

    // ───────────────── DASHBOARD ─────────────────
    get clientesAtivos() { return this.clients.filter(c => c.status !== 'Inativo').length; },
    get leadsAbertos()   { return this.leads.filter(l => !['Ganho', 'Perdido'].includes(l.stage)).length; },
    get projetosAndamento() { return this.projects.filter(p => p.status !== 'Concluído').length; },
    get receitaMes() { return this.finance.filter(f => f.tipo === 'receita' && (f.data || '').startsWith(MD.mesAtual())).reduce((a, f) => a + (+f.valor || 0), 0); },
    get despesaMes() { return this.finance.filter(f => f.tipo === 'despesa' && (f.data || '').startsWith(MD.mesAtual())).reduce((a, f) => a + (+f.valor || 0), 0); },
    get saldoMes()   { return this.receitaMes - this.despesaMes; },
    get aReceber()   { return this.finance.filter(f => f.tipo === 'receita' && f.status !== 'pago').reduce((a, f) => a + (+f.valor || 0), 0); },
    get aPagar()     { return this.finance.filter(f => f.tipo === 'despesa' && f.status !== 'pago').reduce((a, f) => a + (+f.valor || 0), 0); },
    get mrr()        { return this.clients.filter(c => c.status !== 'Inativo').reduce((a, c) => a + (+c.mensalidade || 0), 0); },

    // ───────────────── CRM ─────────────────
    leadsDoEstagio(s) {
      const q = this.busca.toLowerCase();
      return this.leads.filter(l => l.stage === s && (!q || (l.empresa + ' ' + l.contato).toLowerCase().includes(q)));
    },
    stageInfo(s) { return STAGES.find(x => x.id === s) || STAGES[0]; },
    novoLead(stage = 'Novo') { this.editing = { id: '', empresa: '', contato: '', whatsapp: '', email: '', cidade: '', servico: '', origem: 'Instagram', cnpj: '', valor: 0, stage, notas: '', createdAt: MD.today() }; this.cnpjMsg = ''; this.modal = 'lead'; },
    editarLead(l) { this.editing = { ...l }; this.cnpjMsg = ''; this.modal = 'lead'; },
    salvarLead() {
      const e = this.editing;
      if (!e.empresa) return alert('Informe a empresa/nome do lead.');
      if (e.id) { const i = this.leads.findIndex(x => x.id === e.id); if (i > -1) this.leads[i] = { ...e }; }
      else { e.id = MD.uid(); this.leads.unshift({ ...e }); }
      this.persist('leads', this.leads); this.modal = null;
    },
    moverLead(l, stage) { l.stage = stage; this.persist('leads', this.leads); },
    excluirLead(l) { if (!confirm('Excluir o lead ' + l.empresa + '?')) return; this.leads = this.leads.filter(x => x.id !== l.id); this.persist('leads', this.leads); this.modal = null; },

    // ───────────────── COMERCIAL: clientes ─────────────────
    get clientesFiltrados() { const q = this.busca.toLowerCase(); return this.clients.filter(c => !q || (c.empresa + ' ' + (c.razaoSocial || '') + ' ' + (c.contato || '')).toLowerCase().includes(q)); },
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
        slogan: c.slogan || '', briefing: briefingMerge(c.briefing), responsaveis: respMerge(c.responsaveis), documentos: docMerge(c.documentos),
      };
      this.cnpjMsg = ''; this.cepMsg = ''; this.modal = 'client';
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
      if (aniv) a.push('🎂 ' + aniv + ' aniversário(s) ≤30d');
      const naoSeg = this.respComRede(c).filter(r => !r.seguindo).length;
      if (naoSeg) a.push('📲 ' + naoSeg + ' pra seguir');
      if (!(c.documentos || []).length) a.push('Sem documentos');
      return a;
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
    get financeFiltrado() { return [...this.finance].sort((a, b) => (b.data || '').localeCompare(a.data || '')); },
    novoLancamento(tipo = 'receita') { this.editing = { id: '', tipo, descricao: '', valor: 0, categoria: tipo === 'receita' ? 'Mensalidade' : 'Ferramentas', cliente: '', status: 'pendente', vencimento: MD.today(), data: MD.today() }; this.modal = 'finance'; },
    editarLancamento(f) { this.editing = { ...f }; this.modal = 'finance'; },
    salvarLancamento() {
      const e = this.editing; if (!e.descricao) return alert('Informe a descrição.');
      if (e.id) { const i = this.finance.findIndex(x => x.id === e.id); if (i > -1) this.finance[i] = { ...e }; }
      else { e.id = MD.uid(); this.finance.unshift({ ...e }); }
      this.persist('finance', this.finance); this.modal = null;
    },
    togglePago(f) { f.status = f.status === 'pago' ? 'pendente' : 'pago'; this.persist('finance', this.finance); },
    excluirLancamento(f) { if (!confirm('Excluir este lançamento?')) return; this.finance = this.finance.filter(x => x.id !== f.id); this.persist('finance', this.finance); this.modal = null; },

    // ───────────────── OPERACIONAL: projetos ─────────────────
    projetosDoStatus(s) { const q = this.busca.toLowerCase(); return this.projects.filter(p => p.status === s && (!q || (p.nome + ' ' + p.cliente).toLowerCase().includes(q))); },
    projStatusInfo(s) { return PROJ_STATUS.find(x => x.id === s) || PROJ_STATUS[0]; },
    novoProjeto(status = 'A Fazer') { this.editing = { id: '', nome: '', cliente: '', servico: 'Redes Sociais', responsavel: '', status, prazo: '', progresso: 0, notas: '' }; this.modal = 'project'; },
    editarProjeto(p) { this.editing = { ...p }; this.modal = 'project'; },
    salvarProjeto() {
      const e = this.editing; if (!e.nome) return alert('Informe o nome do projeto.');
      if (e.id) { const i = this.projects.findIndex(x => x.id === e.id); if (i > -1) this.projects[i] = { ...e }; }
      else { e.id = MD.uid(); this.projects.unshift({ ...e }); }
      this.persist('projects', this.projects); this.modal = null;
    },
    moverProjeto(p, status) { p.status = status; if (status === 'Concluído') p.progresso = 100; this.persist('projects', this.projects); },
    excluirProjeto(p) { if (!confirm('Excluir o projeto ' + p.nome + '?')) return; this.projects = this.projects.filter(x => x.id !== p.id); this.persist('projects', this.projects); this.modal = null; },

    // ───────────────── COMERCIAL: orçamentos (propostas) ─────────────────
    // Numeração automática: ORC-AAAA-NNN / CT-AAAA-NNN (sequencial por ano).
    proximoNumero(pref, arr) { const ano = MD.today().slice(0, 4); const n = (arr || []).filter(x => (x.numero || '').includes('-' + ano + '-')).length + 1; return pref + '-' + ano + '-' + String(n).padStart(3, '0'); },
    get orcamentosFiltrados() { const q = this.busca.toLowerCase(); return [...this.proposals].sort((a, b) => (b.data || '').localeCompare(a.data || '')).filter(o => !q || ((o.numero || '') + ' ' + (o.cliente || '') + ' ' + (o.projeto || '') + ' ' + (o.descricao || '')).toLowerCase().includes(q)); },
    orcStatusInfo(s) { return ORC_STATUS.find(x => x.id === s) || ORC_STATUS[0]; },
    // Total mensal = soma dos serviços (fallback no campo valor legado de orçamentos antigos).
    orcTotal(o) { const s = o && o.servicos; if (Array.isArray(s) && s.length) return s.reduce((a, x) => a + (+x.valor || 0), 0); return +(o && o.valor) || 0; },
    servicoVazio() { return { id: MD.uid(), nome: '', valor: 0, escopo: '' }; },
    novoOrcamento() { this.editing = { id: '', numero: this.proximoNumero('ORC', this.proposals), cliente: '', contato: '', email: '', projeto: '', servicos: [this.servicoVazio()], vigenciaMeses: 6, formaPagamento: 'Boleto', diaVencimento: 5, status: 'Rascunho', data: MD.today(), validade: 30, observacoes: '' }; this.modal = 'orcamento'; },
    editarOrcamento(o) { this.editing = { servicos: [], contato: '', email: '', projeto: '', vigenciaMeses: 6, formaPagamento: 'Boleto', diaVencimento: 5, validade: 30, ...o }; if (!Array.isArray(this.editing.servicos) || !this.editing.servicos.length) this.editing.servicos = [{ ...this.servicoVazio(), nome: o.descricao || '', valor: +o.valor || 0 }]; this.editing.servicos = this.editing.servicos.map(s => ({ id: MD.uid(), nome: '', valor: 0, escopo: '', ...s })); this.modal = 'orcamento'; },
    addServicoOrc() { if (!Array.isArray(this.editing.servicos)) this.editing.servicos = []; this.editing.servicos.push(this.servicoVazio()); },
    removeServicoOrc(i) { this.editing.servicos.splice(i, 1); if (!this.editing.servicos.length) this.editing.servicos.push(this.servicoVazio()); },
    // Preenche contato/e-mail a partir do cliente selecionado.
    autoPreencherClienteOrc() { const c = this.clients.find(c => c.empresa === this.editing.cliente); if (c) { if (!this.editing.contato) this.editing.contato = c.contato || ''; if (!this.editing.email) this.editing.email = c.email || ''; } },
    salvarOrcamento() {
      const e = this.editing; if (!e.cliente && !(e.servicos || []).some(s => s.nome)) return alert('Informe o cliente e ao menos um serviço.');
      e.valor = this.orcTotal(e); // mantém o total no campo legado (Financeiro/contrato leem daqui)
      let saved;
      if (e.id) { const i = this.proposals.findIndex(x => x.id === e.id); if (i > -1) { this.proposals[i] = { ...e }; saved = this.proposals[i]; } }
      else { e.id = MD.uid(); saved = { ...e }; this.proposals.unshift(saved); }
      this.persist('proposals', this.proposals); this.modal = null;
      if (saved && saved.status === 'Aprovado' && !saved.financeId) this.lancarOrcamentoFinanceiro(saved);
    },
    excluirOrcamento(o) { if (!confirm('Excluir o orçamento ' + (o.numero || '') + '?')) return; this.proposals = this.proposals.filter(x => x.id !== o.id); this.persist('proposals', this.proposals); this.modal = null; },
    // Validade como DATA (a partir de data + N dias) pra exibir no documento.
    validadeData(o) { const dias = +o.validade || 0; const base = o.data ? new Date(o.data + 'T00:00:00') : new Date(); base.setDate(base.getDate() + dias); return base.toISOString().slice(0, 10); },
    // Cronograma de cobranças: N parcelas mensais a partir da data, no valor total.
    cronograma(o) {
      const meses = +o.vigenciaMeses || 1; const total = this.orcTotal(o); const base = o.data ? new Date(o.data + 'T00:00:00') : new Date(); const out = [];
      for (let i = 0; i < meses; i++) { const d = new Date(base.getTime()); d.setMonth(d.getMonth() + i); out.push({ n: i + 1, venc: d.toISOString().slice(0, 10), valor: total }); }
      return out;
    },
    // Cria um CONTRATO completo já preenchido a partir de um orçamento.
    gerarContrato(o) {
      const serv = (o.servicos || []).map(s => '• ' + (s.nome || '') + (s.valor ? (' — ' + MD.fmtCur(s.valor) + '/mês') : '')).join('\n');
      this.editing = { id: '', numero: this.proximoNumero('CT', this.contracts), cliente: o.cliente || '', documento: '', endereco: '', representante: o.contato || '', projeto: o.projeto || '', objeto: serv || o.descricao || '', servicos: o.servicos || [], valor: this.orcTotal(o), periodicidade: 'Mensal', formaPagamento: o.formaPagamento || 'Boleto', diaVencimento: o.diaVencimento || 5, inicio: MD.today(), meses: +o.vigenciaMeses || 6, fidelidadeMeses: 6, multaPercentual: 50, indiceReajuste: 'IPCA', aprovacaoDias: 2, suspensaoDias: 10, foro: EMPRESA.cidade, politico: false, propostaNumero: o.numero || '', status: 'Ativo', observacoes: '' };
      this.modal = 'contrato';
    },

    // ───────────────── COMERCIAL: catálogo de serviços ─────────────────
    get catalogoFiltrado() { const q = this.busca.toLowerCase(); return [...this.catalogo].sort((a, b) => (a.nome || '').localeCompare(b.nome || '')).filter(s => !q || ((s.nome || '') + ' ' + (s.categoria || '') + ' ' + (s.escopo || '')).toLowerCase().includes(q)); },
    novoServico() { this.editing = { id: '', nome: '', categoria: '', valor: 0, escopo: '' }; this.modal = 'servico'; },
    editarServico(s) { this.editing = { categoria: '', escopo: '', ...s }; this.modal = 'servico'; },
    salvarServico() {
      const e = this.editing; if (!e.nome || !e.nome.trim()) return alert('Informe o nome do serviço.');
      e.valor = +e.valor || 0;
      if (e.id) { const i = this.catalogo.findIndex(x => x.id === e.id); if (i > -1) this.catalogo[i] = { ...e }; }
      else { e.id = MD.uid(); this.catalogo.push({ ...e }); }
      this.persist('catalogo', this.catalogo); this.modal = null;
    },
    excluirServico(s) { if (!confirm('Excluir o serviço "' + (s.nome || '') + '" do catálogo?')) return; this.catalogo = this.catalogo.filter(x => x.id !== s.id); this.persist('catalogo', this.catalogo); this.modal = null; },
    // No orçamento: aplica um item do catálogo na linha de serviço (preenche nome, valor e escopo).
    aplicarCatalogo(s, id) { const it = this.catalogo.find(x => x.id === id); if (!it) return; s.nome = it.nome; s.valor = +it.valor || 0; if (it.escopo) s.escopo = it.escopo; },

    // ───────────────── COMERCIAL: contratos ─────────────────
    get contratosFiltrados() { const q = this.busca.toLowerCase(); return [...this.contracts].sort((a, b) => (b.inicio || '').localeCompare(a.inicio || '')).filter(c => !q || ((c.numero || '') + ' ' + (c.cliente || '') + ' ' + (c.objeto || '')).toLowerCase().includes(q)); },
    contrStatusInfo(s) { return CONTR_STATUS.find(x => x.id === s) || CONTR_STATUS[0]; },
    // Data-fim = início + vigência (meses).
    contrFim(c) { if (!c.inicio || !+c.meses) return ''; const d = new Date(c.inicio + 'T00:00:00'); d.setMonth(d.getMonth() + (+c.meses || 0)); return d.toISOString().slice(0, 10); },
    novoContrato() { this.editing = { id: '', numero: this.proximoNumero('CT', this.contracts), cliente: '', documento: '', endereco: '', representante: '', projeto: '', objeto: '', valor: 0, periodicidade: 'Mensal', formaPagamento: 'Boleto', diaVencimento: 5, inicio: MD.today(), meses: 6, fidelidadeMeses: 6, multaPercentual: 50, indiceReajuste: 'IPCA', aprovacaoDias: 2, suspensaoDias: 10, foro: EMPRESA.cidade, politico: false, propostaNumero: '', status: 'Ativo', observacoes: '' }; this.modal = 'contrato'; },
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
      o.financeId = f.id; const i = this.proposals.findIndex(x => x.id === o.id); if (i > -1) { this.proposals[i] = { ...o }; this.persist('proposals', this.proposals); }
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
      return `*{box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a1a;margin:0;padding:42px 46px;font-size:13px;line-height:1.5}
.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #111;padding-bottom:14px}
.brand{font-size:20px;font-weight:800;line-height:1.1}.brand small{display:block;font-size:10px;font-weight:500;color:#666;margin-top:3px;letter-spacing:.3px}
.doc-meta{text-align:right}.doc-type{font-size:11px;font-weight:700;color:#888;letter-spacing:2px}.doc-num{font-size:19px;font-weight:800}.doc-meta div.sub{font-size:11px;color:#666;margin-top:2px}
.empresa-line{font-size:10.5px;color:#777;margin-top:8px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#b8860b;margin:24px 0 8px;border-bottom:1px solid #eee;padding-bottom:4px}
.meta-cli{display:flex;flex-wrap:wrap;gap:4px 24px;margin:14px 0;font-size:13px}.meta-cli b{color:#444}
.intro{white-space:pre-wrap;color:#333;text-align:justify}
.serv{margin:10px 0;padding:10px 0;border-bottom:1px solid #f0f0f0}
.serv-head{display:flex;justify-content:space-between;font-weight:700;font-size:14px}
.serv-val{color:#16a34a;white-space:nowrap}
.serv ul{margin:6px 0 0;padding-left:18px;color:#555;font-size:12px}.serv li{margin:2px 0}
.total{margin-top:14px;background:#faf7e6;border:1px solid #f0e6a8;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;font-weight:700}.total b{font-size:22px}
table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #eee}th{background:#f7f7f7;font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:#888}
.bloco{margin:10px 0}.bloco b{display:block;margin-bottom:2px}
.clausula{margin:14px 0}.clausula h3{font-size:12.5px;margin:0 0 4px;color:#111}.clausula p{margin:3px 0;text-align:justify;color:#333}
.assin{display:flex;justify-content:space-between;gap:40px;margin-top:54px}.assin div{flex:1;text-align:center;border-top:1px solid #333;padding-top:6px;font-size:11px}
.foot{margin-top:40px;font-size:10px;color:#999;border-top:1px solid #eee;padding-top:12px;text-align:center}
@media print{body{padding:24px}.serv,.clausula{break-inside:avoid}}`;
    },
    _docHead(tipo, num, subs) {
      const e = this._esc;
      const subsHTML = (subs || []).map(s => `<div class="sub">${e(s)}</div>`).join('');
      return `<div class="head"><div><div class="brand">Maracatu Digital<small>INTELLIGENCE · Marketing Digital</small></div></div>
<div class="doc-meta"><div class="doc-type">${e(tipo)}</div><div class="doc-num">Nº ${e(num)}</div>${subsHTML}</div></div>
<div class="empresa-line">CNPJ ${e(EMPRESA.cnpj)} · ${e(EMPRESA.email)} · ${e(EMPRESA.fone)}<br>${e(EMPRESA.endereco)}</div>`;
    },
    _docFoot() {
      const e = this._esc;
      return `<div class="foot">${e(EMPRESA.nome)} · CNPJ ${e(EMPRESA.cnpj)} · ${e(EMPRESA.fone)} · ${e(EMPRESA.email)}</div>`;
    },
    // ===== PROPOSTA (modelo Bella Napoli) =====
    _propostaHTML(o) {
      const e = this._esc, total = this.orcTotal(o);
      const servHTML = (o.servicos || []).filter(s => s.nome || s.valor).map((s, i) => {
        const bullets = String(s.escopo || '').split('\n').map(x => x.replace(/^[-•\s]+/, '').trim()).filter(Boolean);
        return `<div class="serv"><div class="serv-head"><span>${i + 1}. ${e(s.nome)}</span><span class="serv-val">${e(MD.fmtCur(s.valor))}/mês</span></div>${bullets.length ? `<ul>${bullets.map(b => `<li>${e(b)}</li>`).join('')}</ul>` : ''}</div>`;
      }).join('');
      const cron = this.cronograma(o).map(p => `<tr><td>${p.n}º mês — ${e(MD.fmtDate(p.venc))}</td><td>${e(MD.fmtCur(p.valor))}</td><td>${e(o.formaPagamento || 'Boleto')}</td></tr>`).join('');
      const metaCli = [o.contato && `<span><b>Contato:</b> ${e(o.contato)}</span>`, o.email && `<span><b>E-mail:</b> ${e(o.email)}</span>`].filter(Boolean).join('');
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${e(o.numero)}</title><style>${this._cssDoc()}</style></head><body>
${this._docHead('PROPOSTA', o.numero, ['Data: ' + MD.fmtDate(o.data), 'Validade: ' + (o.validade || 30) + ' dias'])}
<div class="meta-cli"><span><b>Cliente:</b> ${e(o.cliente || '—')}</span>${metaCli}</div>
${o.projeto ? `<div class="meta-cli"><span><b>Projeto:</b> ${e(o.projeto)}</span></div>` : ''}
<h2>Introdução</h2><div class="intro">${e(PROPOSTA_INTRO)}</div>
<h2>Serviços incluídos</h2>${servHTML || '<div class="intro">—</div>'}
<div class="total"><span>MENSALIDADE TOTAL</span><b>${e(MD.fmtCur(total))}/mês</b></div>
<h2>Vigência do contrato</h2><div class="bloco">${e(o.vigenciaMeses || 6)} meses via ${e(o.formaPagamento || 'Boleto')}</div>
<h2>Cronograma de cobranças</h2><table><thead><tr><th>Competência / Vencimento</th><th>Mensalidade</th><th>Forma</th></tr></thead><tbody>${cron}</tbody></table>
<h2>Considerações finais</h2>
<div class="bloco"><b>Condições Comerciais</b>Os serviços serão remunerados por fee mensal, pelo período de vigência de ${e(o.vigenciaMeses || 6)} meses.</div>
<div class="bloco"><b>Prazo e Rescisão</b>Início a partir da aceitação desta Proposta; vigência de ${e(o.vigenciaMeses || 6)} meses com renovação automática por iguais 6 meses. Rescisão a partir do 6º mês, com aviso prévio de 30 dias; antes do 6º mês, multa de 50% dos fees restantes.</div>
<div class="bloco"><b>Reajuste</b>Reajuste automático após 12 meses, pela variação do IPCA.</div>
<div class="bloco"><b>Validade da Proposta</b>Esta proposta é válida por ${e(o.validade || 30)} dias a partir da data de envio.</div>
${o.observacoes ? `<div class="bloco"><b>Observações</b>${e(o.observacoes)}</div>` : ''}
<div class="assin"><div>${e(EMPRESA.nome)}</div><div>${e(o.cliente || 'Cliente')}${o.contato ? '<br>' + e(o.contato) : ''}</div></div>
${this._docFoot()}
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
${this._docHead('CONTRATO', c.numero, ['Início: ' + MD.fmtDate(c.inicio)])}
<h2 style="text-align:center;border:0;color:#111;font-size:14px;margin-top:18px">Contrato de Prestação de Serviços de Marketing Digital</h2>
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
<div class="assin" style="margin-top:36px"><div>Testemunha 1 — CPF:</div><div>Testemunha 2 — CPF:</div></div>
${anexoPolitico}
${this._docFoot()}
</body></html>`;
    },

    // converte lead Ganho → cliente
    async ganharLead(l) {
      l.stage = 'Ganho'; this.persist('leads', this.leads);
      if (!this.clients.some(c => c.empresa === l.empresa)) {
        const dados = { cnpj: l.cnpj || '', razaoSocial: '', empresa: l.empresa, contato: l.contato, email: l.email, whatsapp: l.whatsapp, cidade: l.cidade, servicos: l.servico ? [l.servico] : [], redes: redesVazias(), site: { url: '', seo: 0, sgo: 0 }, dominio: { provedor: '', vencimento: '' }, hospedagem: { provedor: '', vencimento: '' }, ads: adsVazio(), objetivos: [], briefing: briefingVazio(), slogan: '', responsaveis: (l.contato || l.whatsapp || l.email) ? [{ id: MD.uid(), nome: l.contato || '', cargo: '', whatsapp: l.whatsapp || '', email: l.email || '', nascimento: '', notas: '' }] : [], documentos: [], mensalidade: +l.valor || 0, status: 'Ativo', desde: MD.today(), notas: l.notas };
        try { await this.api('POST', '/clientes', { empresa: l.empresa, dados }); await this.carregarClientes(); } catch (e) { alert('Lead ganho, mas falhou ao criar o cliente: ' + e.message); }
      }
      this.modal = null;
    },
  }));
});
