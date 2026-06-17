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
];
// URL do logo oficial da rede (Simple Icons), colorido pela marca.
const redeIcon = (r) => `https://cdn.simpleicons.org/${r.slug}/${r.cor}`;
const redesVazias = () => Object.fromEntries(REDES.map(r => [r.id, { tem: false, score: 0 }]));

document.addEventListener('alpine:init', () => {
  Alpine.data('app', () => ({
    page: 'dashboard',
    STAGES, SERVICOS, ORIGENS, PROJ_STATUS, FIN_CATEGORIAS, REDES,
    busca: '',
    monitorSel: '', // id do cliente aberto no fichário de monitoramento

    // dados
    clients: [], leads: [], proposals: [], finance: [], projects: [],

    // modais
    modal: null, // 'lead' | 'client' | 'finance' | 'project'
    editing: {},
    cnpjLoading: false, cnpjMsg: '',
    cepLoading: false, cepMsg: '',

    init() {
      this.clients   = MD.get('som_clients', []);
      this.leads     = MD.get('som_leads', []);
      this.proposals = MD.get('som_proposals', []);
      this.finance   = MD.get('som_finance', []);
      this.projects  = MD.get('som_projects', []);
    },

    // helpers de formatação expostos ao template
    fmtDate: MD.fmtDate, fmtCur: MD.fmtCur, daysDiff: MD.daysDiff, redeIcon,
    go(p) { this.page = p; this.busca = ''; },
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
    novoCliente() {
      this.editing = {
        id: '', cnpj: '', razaoSocial: '', empresa: '', inscEstadual: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
        contato: '', cargo: '', email: '', whatsapp: '', telefone: '', instagram: '',
        servicos: [], redes: redesVazias(), mensalidade: 0, status: 'Ativo', desde: MD.today(), notas: '',
      };
      this.cnpjMsg = ''; this.cepMsg = ''; this.modal = 'client';
    },
    editarCliente(c) {
      this.editing = { ...c, servicos: c.servicos || (c.servico ? [c.servico] : []), redes: { ...redesVazias(), ...(c.redes || {}) } };
      this.cnpjMsg = ''; this.cepMsg = ''; this.modal = 'client';
    },
    // sinalização de condição por % (0-100)
    corScore(n) { n = +n || 0; return n >= 80 ? '#16a34a' : n >= 40 ? '#f59e0b' : '#dc2626'; },
    clienteServicos(c) { return (c.servicos && c.servicos.length) ? c.servicos : (c.servico ? [c.servico] : []); },
    redesDoCliente(c) { return REDES.filter(r => c.redes && c.redes[r.id] && c.redes[r.id].tem); },
    mediaRedes(c) { const rs = this.redesDoCliente(c); return rs.length ? Math.round(rs.reduce((a, r) => a + (+c.redes[r.id].score || 0), 0) / rs.length) : 0; },
    get monitorCliente() { const list = this.clientesFiltrados; if (!list.length) return null; return list.find(c => c.id === this.monitorSel) || list[0]; },
    salvarCliente() {
      const e = this.editing;
      if (!e.empresa) return alert('Informe o nome/empresa do cliente.');
      if (e.id) { const i = this.clients.findIndex(x => x.id === e.id); if (i > -1) this.clients[i] = { ...e }; }
      else { e.id = MD.uid(); this.clients.unshift({ ...e }); }
      this.persist('clients', this.clients); this.modal = null;
    },
    excluirCliente(c) { if (!confirm('Excluir o cliente ' + c.empresa + '?')) return; this.clients = this.clients.filter(x => x.id !== c.id); this.persist('clients', this.clients); this.modal = null; },

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
    ganharLead(l) {
      l.stage = 'Ganho'; this.persist('leads', this.leads);
      if (!this.clients.some(c => c.empresa === l.empresa)) {
        this.clients.unshift({ id: MD.uid(), cnpj: l.cnpj || '', razaoSocial: '', empresa: l.empresa, contato: l.contato, email: l.email, whatsapp: l.whatsapp, cidade: l.cidade, servicos: l.servico ? [l.servico] : [], redes: redesVazias(), mensalidade: +l.valor || 0, status: 'Ativo', desde: MD.today(), notas: l.notas });
        this.persist('clients', this.clients);
      }
      this.modal = null;
    },
  }));
});
