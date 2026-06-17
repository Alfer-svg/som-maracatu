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
    STAGES, SERVICOS, ORIGENS, PROJ_STATUS, FIN_CATEGORIAS, REDES, ADS, ITENS_CRED,
    busca: '',
    monitorSel: '', // id do cliente aberto no fichário de monitoramento
    credenciais: [], credModal: false, credForm: {}, revelar: {}, // cofre de acessos
    cofreMasterDef: null, cofreMaster: '', cofreRevelado: {}, cofreModal: null, cofreA: '', cofreB: '', cofreAtual: '', cofreMsg: '', // senha master do cofre
    onboardings: [], onbModal: false, onbSel: {}, onbLink: 'https://alfer-svg.github.io/som-maracatu/onboarding.html', // fila de onboardings do site
    perfilAberto: true, // perfil do cliente (recolhível)
    enriqLoading: false, enriqMsg: '', enriqResult: null, // enriquecimento a partir do site
    secCli: 'empresa', // seção aberta no acordeão do modal de cliente

    // dados
    clients: [], leads: [], proposals: [], finance: [], projects: [],

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
      this.finance   = MD.get('som_finance', []);
      this.projects  = MD.get('som_projects', []);
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
        addR('E-mail', r.email); addR('Telefone', r.telefone);
        this.enriqResult = res;
        this.enriqMsg = res.length ? '' : 'Não achei dados no site (confira a URL ou preencha à mão).';
      } catch (e) { this.enriqMsg = e.message || 'Falha ao ler o site.'; this.enriqResult = null; }
      finally { this.enriqLoading = false; }
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
