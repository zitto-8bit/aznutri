import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Plus, ChevronRight, X, Trash2, AlertCircle, Edit2 } from 'lucide-react';
import Layout from '../components/Layout';

interface Paciente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  peso_inicial: number | null;
  altura: number | null;
  created_at: string;
  // Campos de anamnese
  objetivos: string[] | null;
  objetivo_texto: string | null;
  nivel_atividade: string | null;
  patologias: string[] | null;
  restricoes_alimentares: string[] | null;
  alergias: string[] | null;
  medicamentos: string | null;
  suplementos: string | null;
  refeicoes_por_dia: number | null;
  horario_acorda: string | null;
  horario_dorme: string | null;
  litros_agua: number | null;
  atividade_fisica: boolean;
  atividade_fisica_descricao: string | null;
  observacoes: string | null;
  dieta_baixo_custo?: boolean;
  consultas?: { data_consulta: string; proximo_retorno: string | null; }[];
}

const OBJETIVOS_SUGERIDOS = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
const PATOLOGIAS_SUGERIDAS = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
const ALERGIAS_SUGERIDAS = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];
const RESTRICOES_SUGERIDAS = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar', 'Vegano', 'Vegetariano'];

const Pacientes: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemRetorno, setFilterSemRetorno] = useState(false);
  const [nutriId, setNutriId] = useState<string | null>(null);

  // Estados do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTab, setFormTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [editingPacienteId, setEditingPacienteId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState(''); // Armazenada em cm no form!
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Sedentário');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('5');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('2');
  const [atividadeFisica, setAtividadeFisica] = useState(false);
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dietaBaixoCusto, setDietaBaixoCusto] = useState(false);

  // Arrays de Tags (objetivos, patologias, restricoes, alergias)
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [newObjetivo, setNewObjetivo] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [newPatologia, setNewPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [newRestricao, setNewRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [newAlergia, setNewAlergia] = useState('');

  // Funções utilitárias auxiliares de UX
  const formatarTelefone = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 2) return nums;
    if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
  };

  const handleTelefoneChange = (value: string, setter: (v: string) => void) => {
    setter(formatarTelefone(value));
  };

  const formatarHorarioBlur = (val: string, setVal: (v: string) => void) => {
    let clean = val.replace(/\D/g, '');
    if (!clean) return;
    if (clean.length === 1 || clean.length === 2) {
      let hora = parseInt(clean);
      if (hora >= 0 && hora <= 23) {
        setVal(`${hora.toString().padStart(2, '0')}:00`);
      }
    } else if (clean.length === 3 || clean.length === 4) {
      let hora = parseInt(clean.slice(0, clean.length - 2));
      let min = parseInt(clean.slice(clean.length - 2));
      if (hora >= 0 && hora <= 23 && min >= 0 && min <= 59) {
        setVal(`${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      }
    }
  };

  const calcularIMCEmTempoReal = () => {
    const p = parseFloat(pesoInicial);
    const h = parseFloat(altura); // altura em cm
    if (!p || !h) return null;
    const imc = p / ((h / 100) * (h / 100));
    return imc;
  };

  const imcReal = calcularIMCEmTempoReal();

  const obterClassificacaoIMC = (imc: number) => {
    if (imc < 18.5) return { texto: 'Abaixo do peso', cor: '#e67e22' };
    if (imc < 25) return { texto: 'Peso normal', cor: '#2e7d32' };
    if (imc < 30) return { texto: 'Sobrepeso', cor: '#f1c40f' };
    return { texto: 'Obesidade', cor: '#e74c3c' };
  };

  const calcularIdade = (dataNascStr: string | null) => {
    if (!dataNascStr) return 'N/I';
    const nasc = new Date(dataNascStr);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return `${idade} anos`;
  };

  const obterUltimaConsulta = (consultas: { data_consulta: string }[] | undefined) => {
    if (!consultas || consultas.length === 0) return 'Sem consultas';
    const ordenadas = [...consultas].sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime());
    const dataStr = ordenadas[0].data_consulta;
    try {
      const parts = dataStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dataStr).toLocaleDateString('pt-BR');
    } catch (e) {
      return 'Sem consultas';
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setNutriId(user.id);

      // Carregar pacientes da nutricionista
      const { data, error } = await supabase
        .from('pacientes')
        .select('*, consultas(data_consulta, proximo_retorno)')
        .eq('nutricionista_id', user.id)
        .order('nome', { ascending: true });

      if (error) throw error;

      if (data) {
        setPacientes(data as unknown as Paciente[]);
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cadastrar ou Editar Paciente
  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    if (!nutriId) {
      setFormError('Sessão expirada. Faça login novamente.');
      setFormLoading(false);
      return;
    }

    try {
      const payload = {
        nutricionista_id: nutriId,
        nome,
        email: email || null,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        data_nascimento: dataNascimento || null,
        sexo,
        peso_inicial: pesoInicial ? parseFloat(pesoInicial) : null,
        altura: altura ? parseFloat(altura) / 100 : null, // Salvar como metros no banco!
        objetivos: objetivos.length > 0 ? objetivos : null,
        objetivo_texto: objetivoTexto || null,
        nivel_atividade: nivelAtividade,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos || null,
        suplementos: suplementos || null,
        refeicoes_por_dia: parseInt(refeicoesPorDia) || null,
        horario_acorda: horarioAcorda || null,
        horario_dorme: horarioDorme || null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        atividade_fisica: atividadeFisica,
        atividade_fisica_descricao: atividadeFisicaDescricao || null,
        observacoes: observacoes || null,
        dieta_baixo_custo: dietaBaixoCusto
      };

      let query;
      if (editingPacienteId) {
        query = supabase
          .from('pacientes')
          .update(payload)
          .eq('id', editingPacienteId)
          .select();
      } else {
        query = supabase
          .from('pacientes')
          .insert([payload])
          .select();
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const pacienteSalvo = data[0];
        if (!editingPacienteId) {
          // Redirecionamento automático pós-cadastro
          window.location.href = `/paciente/${pacienteSalvo.id}`;
          return;
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchPacientes();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar o paciente. Verifique os dados.');
    } finally {
      setFormLoading(false);
    }
  };

  // Abrir formulário preenchido para Edição de Paciente
  const handleEditPaciente = (p: Paciente) => {
    setEditingPacienteId(p.id);
    setNome(p.nome || '');
    setEmail(p.email || '');
    setTelefone(p.telefone || '');
    setWhatsapp(p.whatsapp || '');
    setDataNascimento(p.data_nascimento || '');
    setSexo(p.sexo || 'Feminino');
    setPesoInicial(p.peso_inicial ? p.peso_inicial.toString() : '');
    setAltura(p.altura ? Math.round(p.altura * 100).toString() : ''); // Multiplicar por 100 para cm!
    setObjetivos(p.objetivos || []);
    setObjetivoTexto(p.objetivo_texto || '');
    setNivelAtividade(p.nivel_atividade || 'Sedentário');
    setPatologias(p.patologias || []);
    setRestricoes(p.restricoes_alimentares || []);
    setAlergias(p.alergias || []);
    setMedicamentos(p.medicamentos || '');
    setSuplementos(p.suplementos || '');
    setRefeicoesPorDia(p.refeicoes_por_dia ? p.refeicoes_por_dia.toString() : '5');
    setHorarioAcorda(p.horario_acorda || '');
    setHorarioDorme(p.horario_dorme || '');
    setLitrosAgua(p.litros_agua ? p.litros_agua.toString() : '2');
    setAtividadeFisica(p.atividade_fisica || false);
    setAtividadeFisicaDescricao(p.atividade_fisica_descricao || '');
    setObservacoes(p.observacoes || '');
    setDietaBaixoCusto(p.dieta_baixo_custo || false);

    setFormTab('pessoal'); // Abre sempre na primeira aba
    setIsModalOpen(true);
  };

  // Deletar Paciente
  const handleDeletePaciente = async (id: string, nomePaciente: string) => {
    const confirmar = window.confirm(`Deseja realmente excluir o(a) paciente "${nomePaciente}"? Esta ação é irreversível.`);
    if (!confirmar) return;

    try {
      // 1. Excluir consultas associadas primeiro devido à chave estrangeira
      await supabase.from('consultas').delete().eq('paciente_id', id);
      // 2. Excluir planos alimentares
      await supabase.from('planos_alimentares').delete().eq('paciente_id', id);
      // 3. Excluir paciente
      const { error } = await supabase.from('pacientes').delete().eq('id', id);

      if (error) throw error;

      fetchPacientes();
    } catch (err: any) {
      alert('Erro ao excluir paciente: ' + err.message);
    }
  };

  // Resetar campos do formulário
  const resetForm = () => {
    setEditingPacienteId(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setWhatsapp('');
    setDataNascimento('');
    setSexo('Feminino');
    setPesoInicial('');
    setAltura('');
    setObjetivoTexto('');
    setNivelAtividade('Leve');
    setMedicamentos('');
    setSuplementos('');
    setRefeicoesPorDia('5');
    setHorarioAcorda('');
    setHorarioDorme('');
    setLitrosAgua('2');
    setAtividadeFisica(false);
    setAtividadeFisicaDescricao('');
    setObservacoes('');
    setDietaBaixoCusto(false);
    setObjetivos([]);
    setPatologias([]);
    setRestricoes([]);
    setAlergias([]);
  };



  // Filtragem local dos pacientes
  const filteredPacientes = pacientes.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterSemRetorno) {
      // Filtrar sem retorno: consultas mais recente > 30 dias, sem proximo_retorno no futuro
      const consultations = (p as any).consultas;
      if (!consultations || consultations.length === 0) return false;

      const hoje = new Date();
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

      const ultimaConsulta = [...consultations].sort((a, b) => 
        new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
      )[0];

      const dataUltima = new Date(ultimaConsulta.data_consulta);
      const temRetornoAgendado = consultations.some((c: any) => 
        c.proximo_retorno && new Date(c.proximo_retorno) > hoje
      );

      return dataUltima < trintaDiasAtras && !temRetornoAgendado;
    }

    return matchesSearch;
  });

  return (
    <Layout>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Pacientes</h1>
          <p className="dashboard-subtitle">Gerencie o prontuário e anamnese dos seus pacientes</p>
        </div>
        <button className="btn-primary" style={{ marginTop: 0 }} onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={20} />
          <span>Novo Paciente</span>
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Pesquisar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-wrapper">
          <button 
            className={`btn-secondary ${!filterSemRetorno ? 'active' : ''}`}
            onClick={() => setFilterSemRetorno(false)}
          >
            Todos
          </button>
          <button 
            className={`btn-secondary ${filterSemRetorno ? 'active' : ''}`}
            onClick={() => setFilterSemRetorno(true)}
          >
            Sem Retorno ({'>'} 30 dias)
          </button>
        </div>
      </div>

      <div className="pacientes-card">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px' }}>Carregando dados dos pacientes...</div>
        ) : filteredPacientes.length > 0 ? (
          <div className="pacientes-table-container">
            <table className="pacientes-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Contato</th>
                  <th>Idade / Sexo</th>
                  <th>Última Consulta</th>
                  <th>Objetivos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPacientes.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="paciente-meta">
                        <div className="paciente-avatar">
                          {p.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="paciente-main-info">
                          <a href={`/paciente/${p.id}`} className="paciente-table-name">{p.nome}</a>
                          <span className="paciente-table-email">{p.email || 'Sem email cadastrado'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px' }}>
                        <span>{p.telefone || p.whatsapp || 'N/I'}</span>
                        {p.whatsapp && <span style={{ color: '#25D366', fontSize: '11px', fontWeight: 'bold' }}>WhatsApp active</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '700' }}>{calcularIdade(p.data_nascimento)}</span>
                        <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{p.sexo}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: p.consultas && p.consultas.length > 0 ? '#fff3eb' : '#f1f3f5',
                        color: p.consultas && p.consultas.length > 0 ? 'var(--primary-orange)' : '#868e96',
                        border: `1px solid ${p.consultas && p.consultas.length > 0 ? '#ffd8be' : '#e9ecef'}`,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {obterUltimaConsulta(p.consultas)}
                      </span>
                    </td>
                    <td>
                      <div className="tag-list">
                        {p.objetivos && p.objetivos.slice(0, 2).map((obj, i) => (
                          <span key={i} className="badge badge-green">{obj}</span>
                        ))}
                        {p.objetivos && p.objetivos.length > 2 && (
                          <span className="badge badge-orange">+{p.objetivos.length - 2}</span>
                        )}
                        {(!p.objetivos || p.objetivos.length === 0) && (
                          <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontStyle: 'italic' }}>Não definido</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <a href={`/paciente/${p.id}`} className="btn-icon" title="Ver Prontuário">
                          <ChevronRight size={18} />
                        </a>
                        <button 
                          className="btn-icon" 
                          title="Editar Paciente"
                          onClick={() => handleEditPaciente(p)}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          className="btn-icon btn-icon-danger" 
                          title="Excluir Paciente"
                          onClick={() => handleDeletePaciente(p.id, p.nome)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '60px' }}>
            Nenhum paciente encontrado.
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO DE PACIENTE */}
      {isModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleSavePaciente} className="modal-content" style={{ maxWidth: '750px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPacienteId ? `Editar Paciente: ${nome}` : 'Cadastrar Novo Paciente'}</h2>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            {/* Abas de Navegação Premium */}
            <div className="modal-tabs" style={{
              display: 'flex',
              borderBottom: '1px solid #e9ecef',
              padding: '0 24px',
              backgroundColor: '#fff',
              gap: '16px'
            }}>
              {(['pessoal', 'clinico', 'habitos'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`modal-tab-btn ${formTab === tab ? 'active' : ''}`}
                  onClick={() => setFormTab(tab)}
                  style={{
                    padding: '14px 18px',
                    border: 'none',
                    background: 'none',
                    borderBottom: formTab === tab ? '3px solid var(--primary-orange)' : '3px solid transparent',
                    color: formTab === tab ? 'var(--primary-orange)' : 'var(--gray-500)',
                    fontWeight: formTab === tab ? '600' : '500',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                >
                  {tab === 'pessoal' && <><span>👤</span> <span>Pessoal</span></>}
                  {tab === 'clinico' && <><span>🩺</span> <span>Clínico</span></>}
                  {tab === 'habitos' && <><span>🍏</span> <span>Hábitos</span></>}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {formError && (
                <div className="error-message" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={20} />
                  <span>{formError}</span>
                </div>
              )}

              {/* ABA 1: PESSOAL */}
              {formTab === 'pessoal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Ex: Maria de Souza Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Gênero</label>
                      <select className="form-select" value={sexo} onChange={(e) => setSexo(e.target.value)}>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Data de Nascimento 
                        {dataNascimento && (
                          <span style={{ marginLeft: '8px', color: 'var(--primary-orange)', fontWeight: '600', fontSize: '12px' }}>
                            ({calcularIdade(dataNascimento)})
                          </span>
                        )}
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="maria@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefone</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="(11) 99999-9999"
                        value={telefone}
                        onChange={(e) => handleTelefoneChange(e.target.value, setTelefone)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">WhatsApp</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="(11) 99999-9999"
                        value={whatsapp}
                        onChange={(e) => handleTelefoneChange(e.target.value, setWhatsapp)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: CLÍNICO */}
              {formTab === 'clinico' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Peso Inicial (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ex: 68.5"
                        value={pesoInicial}
                        onChange={(e) => setPesoInicial(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Altura (cm)</label>
                      <input
                        type="number"
                        step="1"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ex: 165"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                      />
                    </div>
                  </div>

                  {imcReal && (
                    <div className="imc-display" style={{
                      padding: '12px 16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${obterClassificacaoIMC(imcReal).cor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontSize: '13.5px', color: 'var(--gray-600)' }}>
                        IMC Calculado: <strong style={{ fontSize: '15px', color: '#111' }}>{imcReal.toFixed(2)}</strong>
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        color: '#fff', 
                        backgroundColor: obterClassificacaoIMC(imcReal).cor,
                        padding: '4px 10px',
                        borderRadius: '20px'
                      }}>
                        {obterClassificacaoIMC(imcReal).texto}
                      </span>
                    </div>
                  )}

                  {/* Objetivos */}
                  <div className="form-group">
                    <label className="form-label">Objetivos (Seleção rápida ou digite)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {OBJETIVOS_SUGERIDOS.map((obj) => {
                        const isChecked = objetivos.some(o => o.toLowerCase() === obj.toLowerCase());
                        return (
                          <button
                            key={obj}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setObjetivos(objetivos.filter(o => o.toLowerCase() !== obj.toLowerCase()));
                              } else {
                                setObjetivos([...objetivos, obj]);
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: isChecked ? '#fff3eb' : '#f8f9fa',
                              border: `1px solid ${isChecked ? 'var(--primary-orange)' : '#dee2e6'}`,
                              borderRadius: '20px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: isChecked ? '600' : 'normal',
                              color: isChecked ? 'var(--primary-orange)' : '#495057',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {obj}
                          </button>
                        );
                      })}
                    </div>
                    <div className="tags-input-container">
                      {objetivos.filter(o => !OBJETIVOS_SUGERIDOS.some(s => s.toLowerCase() === o.toLowerCase())).map((obj, i) => (
                        <span key={i} className="tag-pill">
                          {obj}
                          <button type="button" className="tag-remove" onClick={() => setObjetivos(objetivos.filter(o => o !== obj))}>
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="tag-input"
                        placeholder="Outro objetivo... (pressione Enter)"
                        value={newObjetivo}
                        onChange={(e) => setNewObjetivo(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newObjetivo.trim() && !objetivos.some(o => o.toLowerCase() === newObjetivo.trim().toLowerCase())) {
                              setObjetivos([...objetivos, newObjetivo.trim()]);
                              setNewObjetivo('');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Detalhamento das Metas / Anamnese</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Descreva observações sobre os objetivos clínicos do paciente..."
                      value={objetivoTexto}
                      onChange={(e) => setObjetivoTexto(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Patologias */}
                  <div className="form-group">
                    <label className="form-label">Patologias (Seleção rápida ou digite)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {PATOLOGIAS_SUGERIDAS.map((pat) => {
                        const isChecked = patologias.some(p => p.toLowerCase() === pat.toLowerCase());
                        return (
                          <button
                            key={pat}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setPatologias(patologias.filter(p => p.toLowerCase() !== pat.toLowerCase()));
                              } else {
                                setPatologias([...patologias, pat]);
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: isChecked ? '#fdebee' : '#f8f9fa',
                              border: `1px solid ${isChecked ? '#f8b4be' : '#dee2e6'}`,
                              borderRadius: '20px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: isChecked ? '600' : 'normal',
                              color: isChecked ? '#d9383a' : '#495057',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {pat}
                          </button>
                        );
                      })}
                    </div>
                    <div className="tags-input-container">
                      {patologias.filter(p => !PATOLOGIAS_SUGERIDAS.some(s => s.toLowerCase() === p.toLowerCase())).map((pat, i) => (
                        <span key={i} className="tag-pill">
                          {pat}
                          <button type="button" className="tag-remove" onClick={() => setPatologias(patologias.filter(p => p !== pat))}>
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="tag-input"
                        placeholder="Outra patologia... (pressione Enter)"
                        value={newPatologia}
                        onChange={(e) => setNewPatologia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newPatologia.trim() && !patologias.some(p => p.toLowerCase() === newPatologia.trim().toLowerCase())) {
                              setPatologias([...patologias, newPatologia.trim()]);
                              setNewPatologia('');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Restrições Alimentares */}
                  <div className="form-group">
                    <label className="form-label">Restrições Alimentares (Seleção rápida ou digite)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {RESTRICOES_SUGERIDAS.map((rest) => {
                        const isChecked = restricoes.some(r => r.toLowerCase() === rest.toLowerCase());
                        return (
                          <button
                            key={rest}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setRestricoes(restricoes.filter(r => r.toLowerCase() !== rest.toLowerCase()));
                              } else {
                                setRestricoes([...restricoes, rest]);
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: isChecked ? '#e6f4ea' : '#f8f9fa',
                              border: `1px solid ${isChecked ? '#b7e1cd' : '#dee2e6'}`,
                              borderRadius: '20px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: isChecked ? '600' : 'normal',
                              color: isChecked ? '#137333' : '#495057',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {rest}
                          </button>
                        );
                      })}
                    </div>
                    <div className="tags-input-container">
                      {restricoes.filter(r => !RESTRICOES_SUGERIDAS.some(s => s.toLowerCase() === r.toLowerCase())).map((rest, i) => (
                        <span key={i} className="tag-pill">
                          {rest}
                          <button type="button" className="tag-remove" onClick={() => setRestricoes(restricoes.filter(r => r !== rest))}>
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="tag-input"
                        placeholder="Outra restrição... (pressione Enter)"
                        value={newRestricao}
                        onChange={(e) => setNewRestricao(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newRestricao.trim() && !restricoes.some(r => r.toLowerCase() === newRestricao.trim().toLowerCase())) {
                              setRestricoes([...restricoes, newRestricao.trim()]);
                              setNewRestricao('');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Alergias Alimentares */}
                  <div className="form-group">
                    <label className="form-label">Alergias Alimentares (Seleção rápida ou digite)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {ALERGIAS_SUGERIDAS.map((al) => {
                        const isChecked = alergias.some(a => a.toLowerCase() === al.toLowerCase());
                        return (
                          <button
                            key={al}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setAlergias(alergias.filter(a => a.toLowerCase() !== al.toLowerCase()));
                              } else {
                                setAlergias([...alergias, al]);
                              }
                            }}
                            style={{
                              padding: '5px 12px',
                              backgroundColor: isChecked ? '#fff3e0' : '#f8f9fa',
                              border: `1px solid ${isChecked ? '#ffe0b2' : '#dee2e6'}`,
                              borderRadius: '20px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: isChecked ? '600' : 'normal',
                              color: isChecked ? '#e65100' : '#495057',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {al}
                          </button>
                        );
                      })}
                    </div>
                    <div className="tags-input-container">
                      {alergias.filter(a => !ALERGIAS_SUGERIDAS.some(s => s.toLowerCase() === a.toLowerCase())).map((al, i) => (
                        <span key={i} className="tag-pill">
                          {al}
                          <button type="button" className="tag-remove" onClick={() => setAlergias(alergias.filter(a => a !== al))}>
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="tag-input"
                        placeholder="Outra alergia... (pressione Enter)"
                        value={newAlergia}
                        onChange={(e) => setNewAlergia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newAlergia.trim() && !alergias.some(a => a.toLowerCase() === newAlergia.trim().toLowerCase())) {
                              setAlergias([...alergias, newAlergia.trim()]);
                              setNewAlergia('');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Medicamentos em uso</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ex: Puran T4, Glifage"
                        value={medicamentos}
                        onChange={(e) => setMedicamentos(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Suplementação em uso</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ex: Creatina, Whey Protein, Vitamina D"
                        value={suplementos}
                        onChange={(e) => setSuplementos(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '15px', backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '12px', border: '1px solid #e9ecef' }}>
                    <div className="switch-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', flexShrink: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={dietaBaixoCusto} 
                          onChange={(e) => setDietaBaixoCusto(e.target.checked)} 
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider" style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: dietaBaixoCusto ? '#2e7d32' : '#ccc',
                          transition: '.3s', borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: '18px', width: '18px', left: dietaBaixoCusto ? '24px' : '3px', bottom: '3px',
                            backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="switch-label" style={{ cursor: 'pointer', fontWeight: '600', fontSize: '14.5px', color: '#1a1a1a' }} onClick={() => setDietaBaixoCusto(!dietaBaixoCusto)}>
                          💰 Dieta de Baixo Custo (Econômica)?
                        </span>
                        <span style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
                          Priorizar alimentos saudáveis com preço acessível, sazonais e substituições inteligentes de baixo custo.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: HÁBITOS */}
              {formTab === 'habitos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Refeições por dia</label>
                      <input
                        type="number"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={refeicoesPorDia}
                        onChange={(e) => setRefeicoesPorDia(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Horário que acorda</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ex: 06:30"
                        value={horarioAcorda}
                        onChange={(e) => setHorarioAcorda(e.target.value)}
                        onBlur={() => formatarHorarioBlur(horarioAcorda, setHorarioAcorda)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Horário que dorme</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Ex: 22:30"
                        value={horarioDorme}
                        onChange={(e) => setHorarioDorme(e.target.value)}
                        onBlur={() => formatarHorarioBlur(horarioDorme, setHorarioDorme)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Consumo de água (L/dia)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        value={litrosAgua}
                        onChange={(e) => setLitrosAgua(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Nível de Atividade Geral</label>
                      <select className="form-select" value={nivelAtividade} onChange={(e) => setNivelAtividade(e.target.value)}>
                        <option value="Sedentário">Sedentário</option>
                        <option value="Leve">Leve (trabalho em pé/caminhadas leves)</option>
                        <option value="Moderado">Moderado (treino moderado 3-5x/sem)</option>
                        <option value="Ativo">Intenso (treino diário de alta intensidade)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <div className="switch-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                        <input 
                          type="checkbox" 
                          checked={atividadeFisica} 
                          onChange={(e) => setAtividadeFisica(e.target.checked)} 
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider" style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: atividadeFisica ? 'var(--primary-orange)' : '#ccc',
                          transition: '.3s', borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute', content: '""', height: '18px', width: '18px', left: atividadeFisica ? '24px' : '3px', bottom: '3px',
                            backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                      <span className="switch-label" style={{ cursor: 'pointer', fontWeight: '500', fontSize: '14.5px' }} onClick={() => setAtividadeFisica(!atividadeFisica)}>
                        Pratica atividade física regularmente?
                      </span>
                    </div>
                  </div>

                  {atividadeFisica && (
                    <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
                      <label className="form-label">Descrição da Atividade Física</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Frequência, modalidade e intensidade (ex: Musculação 4x/semana, corrida 1x/semana)"
                        value={atividadeFisicaDescricao}
                        onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Observações Gerais / Histórico de Hábitos</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Qualidade do sono, comportamento alimentar, preferências e aversões..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e9ecef', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8f9fa' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </button>
              {formTab !== 'habitos' ? (
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ marginTop: 0 }}
                  onClick={() => {
                    if (formTab === 'pessoal') setFormTab('clinico');
                    else if (formTab === 'clinico') setFormTab('habitos');
                  }}
                >
                  Próximo
                </button>
              ) : (
                <button type="submit" className="btn-primary" style={{ marginTop: 0 }} disabled={formLoading}>
                  {formLoading ? 'Salvando...' : editingPacienteId ? 'Salvar Alterações' : 'Salvar Paciente'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};

export default Pacientes;
