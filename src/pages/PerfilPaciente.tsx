import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  ChevronLeft, User, Activity, Clipboard, Plus, Trash2, Edit2, 
  Save, Coffee, Clock, ShieldAlert, Award, FileText, PlusCircle, AlertCircle,
  Mail, Phone, X
} from 'lucide-react';
import Layout from '../components/Layout';
import CustomChart from '../components/CustomChart';

interface Consulta {
  id: string;
  data_consulta: string;
  peso: number | null;
  cintura: number | null;
  quadril: number | null;
  percentual_gordura: number | null;
  observacoes: string | null;
  proximo_retorno: string | null;
}

interface AlimentoItem {
  alimento: string;
  quantidade: string;
}

interface Refeicao {
  nome: string;
  horario: string;
  itens: AlimentoItem[];
}

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
  objetivos: string[] | null;
  objetivo_texto?: string | null;
  objective_texto?: string | null;
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
}

interface PerfilPacienteProps {
  id: string;
}

const SUGESTOES_DIETA: Record<string, Record<string, SugestaoRefeicao[]>> = {
  padrao: {
    "Café da Manhã": [
      { alimentos: [{ alimento: "Ovos mexidos com fio de azeite", quantidade: "2 unidades" }, { alimento: "Pão de fermentação natural tostado", quantidade: "1 fatia" }, { alimento: "Café preto sem açúcar", quantidade: "1 xícara (150ml)" }] },
      { alimentos: [{ alimento: "Iogurte natural integral", quantidade: "1 pote (170g)" }, { alimento: "Granola artesanal de castanhas", quantidade: "2 colheres de sopa" }, { alimento: "Morangos picados", quantidade: "5 unidades" }] },
      { alimentos: [{ alimento: "Panqueca de banana funcional (banana + ovo + aveia)", quantidade: "1 unidade" }, { alimento: "Mel de abelha silvestre", quantidade: "1 colher de chá" }] }
    ],
    "Colação": [
      { alimentos: [{ alimento: "Mix de castanhas do pará e caju", quantidade: "30g" }, { alimento: "Maçã vermelha média", quantidade: "1 unidade" }] },
      { alimentos: [{ alimento: "Whey Protein isolado batido com água", quantidade: "30g (1 scoop)" }, { alimento: "Morangos frescos", quantidade: "5 unidades" }] },
      { alimentos: [{ alimento: "Chocolate 70% cacau", quantidade: "2 quadradinhos (20g)" }, { alimento: "Castanhas de caju", quantidade: "5 unidades" }] }
    ],
    "Almoço": [
      { alimentos: [{ alimento: "Filé de peito de frango grelhado", quantidade: "120g" }, { alimento: "Arroz integral cozido", quantidade: "3 colheres de sopa" }, { alimento: "Feijão preto cozido (caldo leve)", quantidade: "1 concha pequena" }, { alimento: "Salada de folhas verdes com azeite", quantidade: "Livre" }] },
      { alimentos: [{ alimento: "Filé de salmão grelhado", quantidade: "120g" }, { alimento: "Batata doce assada em rodelas", quantidade: "100g (3 fatias)" }, { alimento: "Brócolis no vapor com alho", quantidade: "3 ramos grandes" }] },
      { alimentos: [{ alimento: "Patinho bovino moído refogado", quantidade: "120g" }, { alimento: "Macarrão integral ao dente", quantidade: "80g cozido" }, { alimento: "Molho de tomate caseiro com manjericão", quantidade: "3 colheres de sopa" }] }
    ],
    "Lanche da Tarde": [
      { alimentos: [{ alimento: "Panqueca de aveia proteica (clara de ovo + whey)", quantidade: "1 unidade" }, { alimento: "Pasta de amendoim integral", quantidade: "1 colher de sopa" }] },
      { alimentos: [{ alimento: "Pão de forma integral tostado", quantidade: "2 fatias" }, { alimento: "Queijo branco minas grelhado", quantidade: "1 fatia grossa" }, { alimento: "Chá de hibisco gelado", quantidade: "1 copo (200ml)" }] },
      { alimentos: [{ alimento: "Shake funcional (Whey + leite desnatado + banana)", quantidade: "1 copo (250ml)" }] }
    ],
    "Jantar": [
      { alimentos: [{ alimento: "Filé de peixe branco assado (Saint Peter/Tilápia)", quantidade: "120g" }, { alimento: "Mix de legumes grelhados (abobrinha, cenoura, berinjela)", quantidade: "150g" }] },
      { alimentos: [{ alimento: "Sopa creme de legumes caseira com frango desfiado", quantidade: "1 prato fundo" }, { alimento: "Quinoa cozida na sopa", quantidade: "2 colheres de sopa" }] },
      { alimentos: [{ alimento: "Omelete de forno com frango desfiado e espinafre", quantidade: "3 ovos" }, { alimento: "Salada verde de alface e pepino", quantidade: "Livre" }] }
    ],
    "Ceia": [
      { alimentos: [{ alimento: "Chá de camomila e mulungu morno", quantidade: "1 xícara (200ml)" }, { alimento: "Castanhas do pará", quantidade: "2 unidades" }] },
      { alimentos: [{ alimento: "Abacate amassado com gotas de limão", quantidade: "60g" }, { alimento: "Cacau em pó 100% polvilhado", quantidade: "1 colher de chá" }] },
      { alimentos: [{ alimento: "Kiwi fresco fatiado", quantidade: "1 unidade" }, { alimento: "Sementes de abóbora sem sal", quantidade: "1 colher de sopa" }] }
    ]
  },
  vegano: {
    "Café da Manhã": [
      { alimentos: [{ alimento: "Tofu mexido com cúrcuma e sal negro", quantidade: "120g" }, { alimento: "Torrada de pão integral sourdough", quantidade: "1 fatia" }] },
      { alimentos: [{ alimento: "Iogurte de leite de coco natural", quantidade: "1 pote (150g)" }, { alimento: "Granola vegana sem mel", quantidade: "2 colheres de sopa" }, { alimento: "Morangos ou mirtilos picados", quantidade: "6 unidades" }] },
      { alimentos: [{ alimento: "Bowl de aveia cozida em leite de amêndoas", quantidade: "150g" }, { alimento: "Sementes de chia e linhaça", quantidade: "1 colher de sopa" }, { alimento: "Pasta de amendoim integral", quantidade: "1 colher de sopa" }] }
    ],
    "Colação": [
      { alimentos: [{ alimento: "Mix de castanhas de caju e nozes", quantidade: "30g" }, { alimento: "Pêra williams fresca", quantidade: "1 unidade" }] },
      { alimentos: [{ alimento: "Proteína isolada de ervilha batida com leite de aveia", quantidade: "30g de proteína" }] },
      { alimentos: [{ alimento: "Grão de bico crocante assado com páprica", quantidade: "1/2 xícara" }] }
    ],
    "Almoço": [
      { alimentos: [{ alimento: "Hambúrguer artesanal de lentilha e aveia", quantidade: "1 unidade (120g)" }, { alimento: "Arroz integral com brócolis", quantidade: "3 colheres de sopa" }, { alimento: "Feijão carioca cozido", quantidade: "1 concha pequena" }, { alimento: "Salada de folhas verdes com tomate cereja", quantidade: "Livre" }] },
      { alimentos: [{ alimento: "Tofu grelhado marinado no limão, gengibre e shoyu", quantidade: "130g" }, { alimento: "Batata doce assada com alecrim", quantidade: "100g" }, { alimento: "Aspargos grelhados no azeite", quantidade: "4 unidades" }] },
      { alimentos: [{ alimento: "Estrogonofe de cogumelos com leite de coco", quantidade: "150g" }, { alimento: "Arroz integral", quantidade: "3 colheres de sopa" }, { alimento: "Chips de batata doce assados", quantidade: "30g" }] }
    ],
    "Lanche da Tarde": [
      { alimentos: [{ alimento: "Smoothie cremoso (banana + morangos + leite de amêndoas)", quantidade: "1 copo (250ml)" }, { alimento: "Proteína vegana sabor morango", quantidade: "20g" }] },
      { alimentos: [{ alimento: "Hommus de grão-de-bico clássico", quantidade: "2 colheres de sopa" }, { alimento: "Palitos de cenoura e pepino fresco", quantidade: "80g" }] },
      { alimentos: [{ alimento: "Torrada integral com guacamole fresca", quantidade: "1 fatia grande" }] }
    ],
    "Jantar": [
      { alimentos: [{ alimento: "Tempeh grelhado acebolado", quantidade: "120g" }, { alimento: "Quinoa cozida com ervas", quantidade: "3 colheres de sopa" }, { alimento: "Espinafre refogado no alho", quantidade: "3 colheres de sopa" }] },
      { alimentos: [{ alimento: "Sopa creme de abóbora cabotiá com gengibre", quantidade: "1 prato fundo" }, { alimento: "Sementes de girassol tostadas por cima", quantidade: "1 colher de sopa" }] },
      { alimentos: [{ alimento: "Salada morna de grão-de-bico, quinoa, tomates assados e rúcula", quantidade: "150g" }, { alimento: "Azeite de oliva extravirgem", quantidade: "1 colher de sobremesa" }] }
    ],
    "Ceia": [
      { alimentos: [{ alimento: "Chá de erva-cidreira com camomila", quantidade: "1 xícara" }, { alimento: "Castanhas do pará", quantidade: "2 unidades" }] },
      { alimentos: [{ alimento: "Mix de sementes (girassol e abóbora) tostadas", quantidade: "1 colher de sopa" }, { alimento: "Ameixa preta seca", quantidade: "1 unidade" }] },
      { alimentos: [{ alimento: "Iogurte de coco com raspas de limão", quantidade: "80g" }] }
    ]
  },
  celiaco: {
    "Café da Manhã": [
      { alimentos: [{ alimento: "Tapioca recheada com ovos mexidos (sem glúten)", quantidade: "1 unidade" }, { alimento: "Café com leite de amêndoas", quantidade: "1 xícara" }] },
      { alimentos: [{ alimento: "Panqueca sem glúten (banana + ovo + farinha de aveia sem glúten)", quantidade: "1 unidade" }, { alimento: "Canela em pó polvilhada", quantidade: "1 pitada" }] },
      { alimentos: [{ alimento: "Iogurte natural sem glúten", quantidade: "170g" }, { alimento: "Granola artesanal sem glúten certificada", quantidade: "2 colheres de sopa" }, { alimento: "Banana fatiada", quantidade: "1/2 unidade" }] }
    ],
    "Colação": [
      { alimentos: [{ alimento: "Mix de nozes e castanhas do caju", quantidade: "30g" }, { alimento: "Maçã vermelha média", quantidade: "1 unidade" }] },
      { alimentos: [{ alimento: "Biscoito de arroz integral fino", quantidade: "3 unidades" }, { alimento: "Pasta de amendoim sem glúten", quantidade: "1 colher de sopa" }] },
      { alimentos: [{ alimento: "Salada de frutas fresca (melão, mamão, morango)", quantidade: "100g" }, { alimento: "Sementes de abóbora descascadas", quantidade: "1 colher de sopa" }] }
    ],
    "Almoço": [
      { alimentos: [{ alimento: "Filé de peito de frango grelhado", quantidade: "120g" }, { alimento: "Arroz integral cozido", quantidade: "3 colheres de sopa" }, { alimento: "Feijão preto cozido (sem glúten)", quantidade: "1 concha pequena" }, { alimento: "Salada colorida de alface, cenoura e tomate com azeite", quantidade: "Livre" }] },
      { alimentos: [{ alimento: "Filé de pescada branca grelhado", quantidade: "120g" }, { alimento: "Purê de mandioca cremoso", quantidade: "2 colheres de sopa" }, { alimento: "Abobrinha e cenoura cozidas no vapor com azeite", quantidade: "120g" }] },
      { alimentos: [{ alimento: "Omelete de queijo minas e espinafre (3 ovos)", quantidade: "1 unidade" }, { alimento: "Salada de quinoa com tomate cereja e pepino", quantidade: "100g" }] }
    ],
    "Lanche da Tarde": [
      { alimentos: [{ alimento: "Biscoito de arroz integral médio", quantidade: "3 unidades" }, { alimento: "Queijo cottage sem glúten", quantidade: "2 colheres de sopa" }, { alimento: "Café preto sem açúcar", quantidade: "1 xícara" }] },
      { alimentos: [{ alimento: "Abacate fresco amassado", quantidade: "60g" }, { alimento: "Sementes de chia", quantidade: "1 colher de sopa" }, { alimento: "Mel puro", quantidade: "1 colher de chá" }] },
      { alimentos: [{ alimento: "Muffin funcional de banana caseiro (aveia sem glúten)", quantidade: "1 unidade (40g)" }] }
    ],
    "Jantar": [
      { alimentos: [{ alimento: "Filé de peixe branco assado (Pescada/Tilápia)", quantidade: "120g" }, { alimento: "Batata doce cozida", quantidade: "80g" }, { alimento: "Couve flor e brócolis no vapor com azeite", quantidade: "100g" }] },
      { alimentos: [{ alimento: "Sopa creme de legumes com carne bovina desfiada (sem glúten)", quantidade: "1 prato fundo" }] },
      { alimentos: [{ alimento: "Filé de frango grelhado", quantidade: "120g" }, { alimento: "Arroz de couve-flor refogado com alho", quantidade: "4 colheres de sopa" }, { alimento: "Salada de rúcula com tomate seco", quantidade: "1 prato pequeno" }] }
    ],
    "Ceia": [
      { alimentos: [{ alimento: "Chá de camomila morno", quantidade: "1 xícara" }, { alimento: "Castanhas do pará", quantidade: "2 unidades" }] },
      { alimentos: [{ alimento: "Abacate amassado com sementes de chia", quantidade: "60g" }] },
      { alimentos: [{ alimento: "Banana cozida no microondas polvilhada com canela", quantidade: "1 unidade" }] }
    ]
  }
};

interface SugestaoRefeicao {
  alimentos: AlimentoItem[];
}

const OBJETIVOS_SUGERIDOS = ['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'];
const PATOLOGIAS_SUGERIDAS = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
const ALERGIAS_SUGERIDAS = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];
const RESTRICOES_SUGERIDAS = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar', 'Vegano', 'Vegetariano'];

const PerfilPaciente: React.FC<PerfilPacienteProps> = ({ id }) => {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planoAlimentar, setPlanoAlimentar] = useState<Refeicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'anamnese' | 'consultas' | 'plano'>('anamnese');

  // Funções utilitárias auxiliares de UX e Clínicas
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



  // Modal Consulta
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [consultaDate, setConsultaDate] = useState(new Date().toISOString().split('T')[0]);
  const [consultaPeso, setConsultaPeso] = useState('');
  const [consultaCintura, setConsultaCintura] = useState('');
  const [consultaQuadril, setConsultaQuadril] = useState('');
  const [consultaGordura, setConsultaGordura] = useState('');
  const [consultaObs, setConsultaObs] = useState('');
  const [consultaProximo, setConsultaProximo] = useState('');
  const [consultaLoading, setConsultaLoading] = useState(false);

  // Editor do Plano Alimentar
  const [isEditingPlano, setIsEditingPlano] = useState(false);
  const [planoLoading, setPlanoLoading] = useState(false);

  // Estados do Modal de Edição do Paciente
  const [isPacienteModalOpen, setIsPacienteModalOpen] = useState(false);
  const [formTab, setFormTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Campos do formulário do paciente
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Leve');
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

  // Arrays de Tags do paciente
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [newObjetivo, setNewObjetivo] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [newPatologia, setNewPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [newRestricao, setNewRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [newAlergia, setNewAlergia] = useState('');

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

  const obterPerfilObjetivo = (): 'emagrecer' | 'hipertrofia' | 'geral' => {
    if (!paciente) return 'geral';
    
    const metas = [
      ...(paciente.objetivos || []),
      paciente.objective_texto || '',
      paciente.objetivo_texto || ''
    ].map(m => m.toLowerCase()).join(' ');

    if (metas.includes('emagrecer') || metas.includes('perda') || metas.includes('peso') || metas.includes('gordura') || metas.includes('definir') || metas.includes('definitivo') || metas.includes('seca')) {
      return 'emagrecer';
    }
    if (metas.includes('hipertrofia') || metas.includes('ganho') || metas.includes('massa') || metas.includes('músculo') || metas.includes('musculo') || metas.includes('forte')) {
      return 'hipertrofia';
    }
    return 'geral';
  };

  const perfilObjetivo = obterPerfilObjetivo();

  const obterPerfilEconomico = (): boolean => {
    if (dietaBaixoCusto) return true;
    if (!paciente) return false;
    if (paciente.dieta_baixo_custo) return true;
    const metas = [
      ...(paciente.objetivos || []),
      paciente.objective_texto || '',
      paciente.objetivo_texto || '',
      paciente.observacoes || ''
    ].map(t => t.toLowerCase()).join(' ');

    return metas.includes('baixo custo') || 
           metas.includes('economico') || 
           metas.includes('econômico') || 
           metas.includes('barat') || 
           metas.includes('orçament') || 
           metas.includes('orcament') ||
           metas.includes('poupar') ||
           metas.includes('dinheiro') ||
           metas.includes('financeir') ||
           metas.includes('custo');
  };

  const perfilEconomico = obterPerfilEconomico();

  const adaptarAlimento = (item: AlimentoItem, objetivo: 'emagrecer' | 'hipertrofia' | 'geral', economico?: boolean): AlimentoItem => {
    let novaQtd = item.quantidade;
    let novoAlimento = item.alimento;

    // 1. Adaptações de Porções por Objetivo Clínico
    if (objetivo === 'emagrecer') {
      novaQtd = novaQtd
        .replace(/3 colheres de sopa/i, '2 colheres de sopa')
        .replace(/2 fatias/i, '1 fatia')
        .replace(/100g/i, '70g')
        .replace(/80g cozido/i, '50g cozido')
        .replace(/2 colheres de chá/i, '1 colher de chá')
        .replace(/30g/i, '20g')
        .replace(/1 pote \(170g\)/i, '1/2 pote (85g)')
        .replace(/2 conchas/i, '1 concha')
        .replace(/1 concha pequena/i, '1/2 concha pequena');
    } else if (objetivo === 'hipertrofia') {
      novaQtd = novaQtd
        .replace(/120g/i, '160g')
        .replace(/3 colheres de sopa/i, '5 colheres de sopa')
        .replace(/1 fatia/i, '2 fatias')
        .replace(/100g/i, '150g')
        .replace(/80g cozido/i, '120g cozido')
        .replace(/30g \(1 scoop\)/i, '45g (1.5 scoop)')
        .replace(/2 colheres de sopa/i, '4 colheres de sopa')
        .replace(/1 concha pequena/i, '1.5 concha');
      
      if (novoAlimento.toLowerCase().includes('ovo')) {
        novoAlimento = novoAlimento.replace(/2 unidades/i, '3 unidades').replace(/ovos mexidos/i, '3 ovos mexidos');
      }
    }

    // 2. Adaptações Econômicas (Substituições de Baixo Custo)
    if (economico) {
      // Substituições de alimentos caros por opções baratas equivalentes
      novoAlimento = novoAlimento
        .replace(/Pão de fermentação natural/i, 'Pão de forma integral')
        .replace(/sourdough/i, 'pão de forma integral')
        .replace(/Granola artesanal de castanhas/i, 'Aveia em flocos')
        .replace(/Granola vegana sem mel/i, 'Aveia em flocos')
        .replace(/Morangos picados|Morangos frescos|Morangos ou mirtilos picados|Morangos|mirtilos/gi, 'Banana fatiada')
        .replace(/Mel de abelha silvestre|Mel puro|Mel de abelha/gi, 'Melado de cana')
        .replace(/Mix de castanhas do pará e caju|Mix de castanhas|Castanhas do pará|Castanhas de caju|Mix de nozes e castanhas/gi, 'Amendoim torrado sem sal')
        .replace(/Chocolate 70% cacau/i, 'Banana fatiada')
        .replace(/Whey Protein isolado|Whey Protein|Whey/gi, 'Ovos cozidos')
        .replace(/Proteína isolada de ervilha|Proteína vegana/gi, 'Proteína texturizada de soja (PTS)')
        .replace(/Filé de salmão grelhado|Filé de peixe branco assado \(Saint Peter\/Tilápia\)|Filé de pescada branca/gi, 'Filé de peito de frango grelhado')
        .replace(/Patinho bovino moído|Patinho/gi, 'Carne moída (acém/músculo)')
        .replace(/Pasta de amendoim integral|Pasta de amendoim/gi, 'Amendoim torrado')
        .replace(/Queijo branco minas grelhado|Queijo branco minas|Queijo cottage/gi, 'Ricota fresca')
        .replace(/Aspargos grelhados/i, 'Repolho cozido no vapor')
        .replace(/Estrogonofe de cogumelos|Cogumelos|Tempeh grelhado|Tempeh/gi, 'Lentilha ou feijão refogado')
        .replace(/leite de amêndoas|leite de amêndoa|leite de aveia|leite de coco/gi, 'Leite de vaca desnatado (ou água)');

      // Ajustes específicos de porção caso tenha mudado Whey para ovos cozidos
      if (item.alimento.match(/Whey/i) && novoAlimento.includes('Ovos cozidos')) {
        novaQtd = '2 unidades';
      }
    }

    return {
      alimento: novoAlimento,
      quantidade: novaQtd
    };
  };


  const handleToggleRestricaoRapida = (tag: string, checked: boolean) => {
    if (checked) {
      if (!restricoes.some(r => r.toLowerCase() === tag.toLowerCase())) {
        setRestricoes([...restricoes, tag]);
      }
    } else {
      setRestricoes(restricoes.filter(r => r.toLowerCase() !== tag.toLowerCase()));
    }
  };

  const handleOpenEditPaciente = () => {
    if (!paciente) return;
    setNome(paciente.nome || '');
    setEmail(paciente.email || '');
    setTelefone(paciente.telefone || '');
    setWhatsapp(paciente.whatsapp || '');
    setDataNascimento(paciente.data_nascimento || '');
    setSexo(paciente.sexo || 'Feminino');
    setPesoInicial(paciente.peso_inicial ? paciente.peso_inicial.toString() : '');
    setAltura(paciente.altura ? Math.round(paciente.altura * 100).toString() : '');
    setObjetivos(paciente.objetivos || []);
    setObjetivoTexto(paciente.objective_texto || paciente.objetivo_texto || '');
    setNivelAtividade(paciente.nivel_atividade || 'Leve');
    setPatologias(paciente.patologias || []);
    setRestricoes(paciente.restricoes_alimentares || []);
    setAlergias(paciente.alergias || []);
    setMedicamentos(paciente.medicamentos || '');
    setSuplementos(paciente.suplementos || '');
    setRefeicoesPorDia(paciente.refeicoes_por_dia ? paciente.refeicoes_por_dia.toString() : '5');
    setHorarioAcorda(paciente.horario_acorda || '');
    setHorarioDorme(paciente.horario_dorme || '');
    setLitrosAgua(paciente.litros_agua ? paciente.litros_agua.toString() : '2');
    setAtividadeFisica(paciente.atividade_fisica || false);
    setAtividadeFisicaDescricao(paciente.atividade_fisica_descricao || '');
    setObservacoes(paciente.observacoes || '');
    setDietaBaixoCusto(paciente.dieta_baixo_custo || false);

    setFormTab('pessoal');
    setFormError(null);
    setIsPacienteModalOpen(true);
  };

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const payload = {
        nome,
        email: email || null,
        telefone: telefone || null,
        whatsapp: whatsapp || null,
        data_nascimento: dataNascimento || null,
        sexo,
        peso_inicial: pesoInicial ? parseFloat(pesoInicial) : null,
        altura: altura ? parseFloat(altura) / 100 : null,
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

      const { error } = await supabase
        .from('pacientes')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      setIsPacienteModalOpen(false);
      fetchPacienteData();
      alert('Dados do paciente atualizados com sucesso!');
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar o paciente. Verifique os dados.');
    } finally {
      setFormLoading(false);
    }
  };

  // Analisa as restrições alimentares do paciente para adaptar sugestões
  const obterPerfilRestricao = (): string => {
    if (!paciente || !paciente.restricoes_alimentares) return 'padrao';
    
    const restricoesStr = paciente.restricoes_alimentares.map(r => r.toLowerCase()).join(' ');
    
    if (restricoesStr.includes('vegano') || restricoesStr.includes('vegana') || restricoesStr.includes('vegetariano') || restricoesStr.includes('vegetariana')) {
      return 'vegano';
    }
    if (restricoesStr.includes('celíaco') || restricoesStr.includes('celíaca') || restricoesStr.includes('glúten') || restricoesStr.includes('gluten') || restricoesStr.includes('sem glúten')) {
      return 'celiaco';
    }
    
    return 'padrao';
  };

  const perfilRestricao = obterPerfilRestricao();

  // Aplica as sugestões de dieta no plano
  const handleAplicarSugestao = (mealName: string, alimentosSugestao: AlimentoItem[]) => {
    const novoPlano = planoAlimentar.map(meal => {
      if (meal.nome === mealName) {
        return {
          ...meal,
          itens: alimentosSugestao.map(item => ({ ...item }))
        };
      }
      return meal;
    });
    setPlanoAlimentar(novoPlano);
  };

  useEffect(() => {
    fetchPacienteData();
  }, [id]);

  const fetchPacienteData = async () => {
    try {
      setLoading(true);
      // 1. Buscar paciente
      const { data: pacienteData, error: pacError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (pacError) throw pacError;
      setPaciente(pacienteData as Paciente);

      // 2. Buscar consultas
      const { data: consultasData, error: consError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', id)
        .order('data_consulta', { ascending: false });

      if (consError) throw consError;
      setConsultas(consultasData as Consulta[] || []);

      // 3. Buscar plano alimentar recente
      const { data: planoData, error: planError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false });

      if (planError) throw planError;
      if (planoData && planoData.length > 0) {
        setPlanoAlimentar(planoData[0].conteudo as Refeicao[]);
      } else {
        // Criar plano padrão vazio para edição
        const defaultPlano: Refeicao[] = [
          { nome: "Café da Manhã", horario: "07:30", itens: [{ alimento: "", quantidade: "" }] },
          { nome: "Colação", horario: "10:00", itens: [{ alimento: "", quantidade: "" }] },
          { nome: "Almoço", horario: "12:30", itens: [{ alimento: "", quantidade: "" }] },
          { nome: "Lanche da Tarde", horario: "16:00", itens: [{ alimento: "", quantidade: "" }] },
          { nome: "Jantar", horario: "19:30", itens: [{ alimento: "", quantidade: "" }] },
          { nome: "Ceia", horario: "22:00", itens: [{ alimento: "", quantidade: "" }] }
        ];
        setPlanoAlimentar(defaultPlano);
      }

    } catch (error) {
      console.error('Erro ao buscar dados do paciente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cadastrar Consulta
  const handleSaveConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsultaLoading(true);

    try {
      const payload = {
        paciente_id: id,
        data_consulta: consultaDate,
        peso: consultaPeso ? parseFloat(consultaPeso) : null,
        cintura: consultaCintura ? parseFloat(consultaCintura) : null,
        quadril: consultaQuadril ? parseFloat(consultaQuadril) : null,
        percentual_gordura: consultaGordura ? parseFloat(consultaGordura) : null,
        observacoes: consultaObs || null,
        proximo_retorno: consultaProximo || null
      };

      const { error } = await supabase.from('consultas').insert([payload]);
      if (error) throw error;

      setIsConsultaModalOpen(false);
      resetConsultaForm();
      fetchPacienteData();
    } catch (err: any) {
      alert('Erro ao registrar consulta: ' + err.message);
    } finally {
      setConsultaLoading(false);
    }
  };

  // Excluir Consulta
  const handleDeleteConsulta = async (consId: string) => {
    const confirmar = window.confirm("Deseja realmente excluir esta consulta do histórico?");
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('consultas').delete().eq('id', consId);
      if (error) throw error;
      fetchPacienteData();
    } catch (err: any) {
      alert('Erro ao excluir consulta: ' + err.message);
    }
  };

  const resetConsultaForm = () => {
    setConsultaDate(new Date().toISOString().split('T')[0]);
    setConsultaPeso('');
    setConsultaCintura('');
    setConsultaQuadril('');
    setConsultaGordura('');
    setConsultaObs('');
    setConsultaProximo('');
  };

  // Salvar Plano Alimentar
  const handleSavePlano = async () => {
    setPlanoLoading(true);
    try {
      // Filtrar refeições vazias para não salvar lixo
      const planoFiltrado = planoAlimentar.map(ref => ({
        ...ref,
        itens: ref.itens.filter(it => it.alimento.trim() !== '')
      }));

      const { error } = await supabase
        .from('planos_alimentares')
        .insert([{
          paciente_id: id,
          conteudo: planoFiltrado
        }]);

      if (error) throw error;

      setIsEditingPlano(false);
      fetchPacienteData();
      alert('Plano alimentar salvo com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar plano alimentar: ' + err.message);
    } finally {
      setPlanoLoading(false);
    }
  };

  // Auxiliares do editor de plano
  const handleAlimentoChange = (mealIndex: number, itemIndex: number, field: keyof AlimentoItem, val: string) => {
    const novoPlano = [...planoAlimentar];
    novoPlano[mealIndex].itens[itemIndex][field] = val;
    setPlanoAlimentar(novoPlano);
  };

  const addAlimentoRow = (mealIndex: number) => {
    const novoPlano = [...planoAlimentar];
    novoPlano[mealIndex].itens.push({ alimento: "", quantidade: "" });
    setPlanoAlimentar(novoPlano);
  };

  const removeAlimentoRow = (mealIndex: number, itemIndex: number) => {
    const novoPlano = [...planoAlimentar];
    novoPlano[mealIndex].itens = novoPlano[mealIndex].itens.filter((_, i) => i !== itemIndex);
    // Se esvaziou tudo, garante que pelo menos 1 linha vazia fique lá
    if (novoPlano[mealIndex].itens.length === 0) {
      novoPlano[mealIndex].itens.push({ alimento: "", quantidade: "" });
    }
    setPlanoAlimentar(novoPlano);
  };

  const handleMealTimeChange = (mealIndex: number, val: string) => {
    const novoPlano = [...planoAlimentar];
    novoPlano[mealIndex].horario = val;
    setPlanoAlimentar(novoPlano);
  };

  // Cálculos Clínicos
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

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  // Peso atual e IMC
  const pesoAtual = consultas.length > 0 && consultas[0].peso ? consultas[0].peso : paciente?.peso_inicial;
  const imc = pesoAtual && paciente?.altura 
    ? (pesoAtual / (paciente.altura * paciente.altura)).toFixed(1) 
    : null;

  const classificarIMC = (imcVal: number) => {
    if (imcVal < 18.5) return { label: 'Abaixo do peso', class: 'badge-orange' };
    if (imcVal < 25) return { label: 'Eutrofia (Normal)', class: 'badge-green' };
    if (imcVal < 30) return { label: 'Sobrepeso', class: 'badge-orange' };
    return { label: 'Obesidade', class: 'badge-red' };
  };

  // Preparar dados para o gráfico de peso
  const chartData = [...consultas]
    .reverse() // Do mais antigo ao mais recente
    .map(c => ({
      label: formatarData(c.data_consulta).slice(0, 5), // Ex: "12/04"
      value: c.peso || 0,
      secondaryValue: c.percentual_gordura || undefined
    }))
    .filter(pt => pt.value > 0);

  // Incluir peso inicial como ponto de partida se não houver consultas suficientes
  if (chartData.length < 2 && paciente?.peso_inicial) {
    chartData.unshift({
      label: "Inicial",
      value: paciente.peso_inicial,
      secondaryValue: undefined
    });
  }

  if (loading || !paciente) {
    return (
      <Layout>
        <div className="empty-state" style={{ padding: '80px' }}>Carregando prontuário eletrônico do paciente...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="perfil-container">
        
        {/* Voltar e Header do Perfil */}
        <div>
          <a href="/pacientes" className="btn-secondary" style={{ width: 'fit-content', marginBottom: '20px', padding: '8px 16px' }}>
            <ChevronLeft size={16} />
            Voltar para Pacientes
          </a>

          <div className="perfil-header-card">
            <div className="perfil-info-block">
              <div className="perfil-avatar">
                {paciente.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1 className="perfil-title" style={{ margin: 0 }}>{paciente.nome}</h1>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', height: 'fit-content', marginTop: 0 }}
                    onClick={handleOpenEditPaciente}
                    title="Editar Cadastro"
                  >
                    <Edit2 size={13} />
                    <span>Editar Cadastro</span>
                  </button>
                </div>
                <div className="perfil-subtitle-row">
                  <span className="perfil-subtitle-item">
                    <User size={14} />
                    {paciente.sexo} | {calcularIdade(paciente.data_nascimento)}
                  </span>
                  {paciente.email && (
                    <span className="perfil-subtitle-item">
                      <Mail size={14} />
                      {paciente.email}
                    </span>
                  )}
                  {(paciente.telefone || paciente.whatsapp) && (
                    <span className="perfil-subtitle-item">
                      <Phone size={14} />
                      {paciente.whatsapp || paciente.telefone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ficha Rápida IMC */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ backgroundColor: 'var(--gray-50)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--gray-200)', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>Peso Atual</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gray-800)', marginTop: '2px' }}>
                  {pesoAtual ? `${pesoAtual} kg` : 'N/I'}
                </div>
              </div>
              {imc && (
                <div style={{ backgroundColor: 'var(--gray-50)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--gray-200)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase' }}>IMC</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gray-800)', marginTop: '2px' }}>
                    {imc}
                  </div>
                  <span className={`badge ${classificarIMC(parseFloat(imc)).class}`} style={{ fontSize: '10px', marginTop: '4px', padding: '2px 6px' }}>
                    {classificarIMC(parseFloat(imc)).label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sistema de Abas do Perfil */}
        <div>
          <div className="tabs-navigation">
            <button 
              className={`tab-btn ${activeTab === 'anamnese' ? 'active' : ''}`}
              onClick={() => setActiveTab('anamnese')}
            >
              <Clipboard size={18} />
              Anamnese & Rotina
            </button>
            <button 
              className={`tab-btn ${activeTab === 'consultas' ? 'active' : ''}`}
              onClick={() => setActiveTab('consultas')}
            >
              <Activity size={18} />
              Consultas & Progresso ({consultas.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'plano' ? 'active' : ''}`}
              onClick={() => setActiveTab('plano')}
            >
              <FileText size={18} />
              Plano Alimentar
            </button>
          </div>
        </div>

        {/* ========================================================
            CONTEÚDO ABA 1: ANAMNESE
            ======================================================== */}
        {activeTab === 'anamnese' && (
          <div className="tab-content-panel info-cards-grid">
            
            {/* Card Metas */}
            <div className="info-section-card">
              <div className="info-card-header">
                <Award size={20} />
                <h3 className="info-card-title">Metas & Objetivos</h3>
              </div>
              <div className="info-data-list">
                <div>
                  <div className="info-data-label" style={{ marginBottom: '8px' }}>Objetivos Principais</div>
                  <div className="tag-list">
                    {paciente.objetivos?.map((obj, i) => (
                      <span key={i} className="badge badge-green">{obj}</span>
                    )) || <span style={{ color: 'var(--gray-500)', fontStyle: 'italic', fontSize: '13px' }}>Nenhum objetivo selecionado</span>}
                  </div>
                </div>
                {paciente.objetivo_texto && (
                  <div style={{ marginTop: '10px' }}>
                    <div className="info-data-label" style={{ marginBottom: '4px' }}>Detalhamento Clínico</div>
                    <p style={{ fontSize: '13.5px', color: 'var(--gray-800)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{paciente.objetivo_texto}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Card Rotina e Estilo de Vida */}
            <div className="info-section-card">
              <div className="info-card-header">
                <Coffee size={20} />
                <h3 className="info-card-title">Rotina & Estilo de Vida</h3>
              </div>
              <div className="info-data-list">
                <div className="info-data-row">
                  <span className="info-data-label">Refeições por dia</span>
                  <span className="info-data-value">{paciente.refeicoes_por_dia || 'N/I'}</span>
                </div>
                <div className="info-data-row">
                  <span className="info-data-label">Rotina de sono</span>
                  <span className="info-data-value">
                    {paciente.horario_acorda && paciente.horario_dorme 
                      ? `${paciente.horario_acorda} às ${paciente.horario_dorme}` 
                      : 'N/I'}
                  </span>
                </div>
                <div className="info-data-row">
                  <span className="info-data-label">Consumo de água</span>
                  <span className="info-data-value">{paciente.litros_agua ? `${paciente.litros_agua}L/dia` : 'N/I'}</span>
                </div>
                <div className="info-data-row">
                  <span className="info-data-label">Nível de Atividade</span>
                  <span className="info-data-value">{paciente.nivel_atividade || 'Leve'}</span>
                </div>
                <div className="info-data-row" style={{ flexDirection: 'column', gap: '4px', borderBottom: 'none' }}>
                  <span className="info-data-label">Atividade Física Regular?</span>
                  <span className="info-data-value" style={{ textAlign: 'left', maxWidth: '100%', marginTop: '2px' }}>
                    {paciente.atividade_fisica ? (
                      <span className="badge badge-green">Sim: {paciente.atividade_fisica_descricao}</span>
                    ) : (
                      <span className="badge badge-orange">Não</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Histórico Clínico */}
            <div className="info-section-card">
              <div className="info-card-header">
                <ShieldAlert size={20} />
                <h3 className="info-card-title">Histórico Clínico</h3>
              </div>
              <div className="info-data-list">
                <div className="info-data-row" style={{ flexDirection: 'column', gap: '6px' }}>
                  <span className="info-data-label">Patologias (Doenças/Condições)</span>
                  <div className="tag-list">
                    {paciente.patologias?.map((pat, i) => (
                      <span key={i} className="badge badge-red">{pat}</span>
                    )) || <span style={{ color: 'var(--gray-500)', fontSize: '13px', fontStyle: 'italic' }}>Nenhuma patologia relatada</span>}
                  </div>
                </div>
                <div className="info-data-row" style={{ flexDirection: 'column', gap: '6px' }}>
                  <span className="info-data-label">Restrições Alimentares</span>
                  <div className="tag-list">
                    {paciente.restricoes_alimentares?.map((rest, i) => (
                      <span key={i} className="badge badge-orange">{rest}</span>
                    )) || <span style={{ color: 'var(--gray-500)', fontSize: '13px', fontStyle: 'italic' }}>Nenhuma restrição</span>}
                  </div>
                </div>
                <div className="info-data-row" style={{ flexDirection: 'column', gap: '6px' }}>
                  <span className="info-data-label">Alergias Alimentares</span>
                  <div className="tag-list">
                    {paciente.alergias?.map((al, i) => (
                      <span key={i} className="badge badge-red">{al}</span>
                    )) || <span style={{ color: 'var(--gray-500)', fontSize: '13px', fontStyle: 'italic' }}>Nenhuma alergia relatada</span>}
                  </div>
                </div>
                <div className="info-data-row">
                  <span className="info-data-label">Medicamentos em uso</span>
                  <span className="info-data-value">{paciente.medicamentos || 'Nenhum'}</span>
                </div>
                <div className="info-data-row">
                  <span className="info-data-label">Suplementação em uso</span>
                  <span className="info-data-value">{paciente.suplementos || 'Nenhuma'}</span>
                </div>
                {paciente.observacoes && (
                  <div style={{ marginTop: '6px' }}>
                    <div className="info-data-label" style={{ marginBottom: '4px' }}>Observações da Nutricionista</div>
                    <p style={{ fontSize: '13px', color: 'var(--gray-500)', lineHeight: '1.4' }}>{paciente.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            CONTEÚDO ABA 2: CONSULTAS & EVOLUÇÃO
            ======================================================== */}
        {activeTab === 'consultas' && (
          <div className="tab-content-panel evolution-grid">
            
            {/* Gráfico à esquerda */}
            <div className="chart-card">
              <CustomChart data={chartData} title="Evolução do Peso Corporal" yUnit="kg" />
            </div>

            {/* Timeline à direita */}
            <div className="timeline-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="info-card-title" style={{ color: 'var(--gray-800)', border: 'none', padding: 0, margin: 0 }}>Histórico de Consultas</h3>
                <button className="btn-primary" style={{ marginTop: 0, padding: '8px 12px', fontSize: '13px' }} onClick={() => setIsConsultaModalOpen(true)}>
                  <Plus size={16} />
                  <span>Nova Consulta</span>
                </button>
              </div>

              <div className="timeline">
                {consultas.length > 0 ? (
                  consultas.map((c) => (
                    <div className="timeline-item" key={c.id}>
                      <div className="timeline-dot">
                        <Activity size={16} />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-date">{formatarData(c.data_consulta)}</span>
                          <button 
                            style={{ background: 'none', color: 'var(--gray-500)' }} 
                            onClick={() => handleDeleteConsulta(c.id)}
                            title="Excluir Consulta"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="timeline-metrics">
                          {c.peso && <span>{c.peso} kg</span>}
                          {c.percentual_gordura && <span>{c.percentual_gordura}% fat</span>}
                          {c.cintura && <span>C: {c.cintura}cm</span>}
                          {c.quadril && <span>Q: {c.quadril}cm</span>}
                        </div>
                        {c.observacoes && <p className="timeline-obs">{c.observacoes}</p>}
                        {c.proximo_retorno && (
                          <div style={{ fontSize: '11px', color: 'var(--primary-orange)', fontWeight: 'bold', marginTop: '6px' }}>
                            Próximo retorno: {formatarData(c.proximo_retorno)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    Nenhuma consulta registrada para este paciente. Crie a primeira consulta para iniciar o monitoramento!
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            CONTEÚDO ABA 3: PLANO ALIMENTAR
            ======================================================== */}
        {activeTab === 'plano' && (
          <div className="tab-content-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="info-card-title" style={{ fontSize: '18px', border: 'none', margin: 0, padding: 0 }}>Plano Alimentar Ativo</h2>
              
              {!isEditingPlano ? (
                <button className="btn-primary" style={{ marginTop: 0, padding: '10px 18px' }} onClick={() => setIsEditingPlano(true)}>
                  <Edit2 size={16} />
                  <span>Editar Plano Alimentar</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-secondary" onClick={() => { setIsEditingPlano(false); fetchPacienteData(); }}>
                    Cancelar
                  </button>
                  <button className="btn-primary" style={{ marginTop: 0 }} onClick={handleSavePlano} disabled={planoLoading}>
                    <Save size={16} />
                    <span>{planoLoading ? 'Salvando...' : 'Salvar Plano'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* MODO EDITOR */}
            {isEditingPlano ? (
              <div className="meals-editor-container">
                {planoAlimentar.map((meal, mealIdx) => (
                  <div className="meal-card" key={mealIdx}>
                    <div className="meal-header">
                      <div className="meal-title-group">
                        <Coffee size={20} className="meal-icon" />
                        <span className="meal-name">{meal.nome}</span>
                      </div>
                      <div className="meal-title-group">
                        <Clock size={16} color="var(--gray-500)" />
                        <input
                          type="text"
                          className="meal-time"
                          style={{ width: '80px', border: '1px solid var(--gray-200)', borderRadius: '4px', textAlign: 'center' }}
                          value={meal.horario}
                          onChange={(e) => handleMealTimeChange(mealIdx, e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="meal-body">
                      <div className="meal-alimentos-list">
                        {meal.itens.map((item, itemIdx) => (
                          <div className="alimento-row" key={itemIdx}>
                            <div className="alimento-field">
                              <input
                                type="text"
                                className="alimento-input"
                                placeholder="Alimento / Refeição (ex: Ovo cozido)"
                                value={item.alimento}
                                onChange={(e) => handleAlimentoChange(mealIdx, itemIdx, 'alimento', e.target.value)}
                              />
                            </div>
                            <div className="quantidade-field">
                              <input
                                type="text"
                                className="alimento-input"
                                placeholder="Quantidade (ex: 2 unidades)"
                                value={item.quantidade}
                                onChange={(e) => handleAlimentoChange(mealIdx, itemIdx, 'quantidade', e.target.value)}
                              />
                            </div>
                            <button 
                              type="button" 
                              className="btn-remove-alimento"
                              onClick={() => removeAlimentoRow(mealIdx, itemIdx)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button 
                        type="button" 
                        className="btn-add-alimento"
                        onClick={() => addAlimentoRow(mealIdx)}
                      >
                        <PlusCircle size={16} />
                        <span>Adicionar Alimento</span>
                      </button>

                      {/* Painel de Sugestões de Dieta Premium Adaptativas */}
                      <div className="sugestoes-panel" style={{ marginTop: '20px', borderTop: '1px dotted var(--gray-200)', paddingTop: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-green)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                          <span>💡 Sugestões Clínicas ({perfilRestricao === 'vegano' ? 'Veganas 🌿' : perfilRestricao === 'celiaco' ? 'Sem Glúten 🌾' : 'Padrão Saudável 🥗'})</span>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 'bold', 
                            color: perfilEconomico ? '#0f5132' : (perfilObjetivo === 'emagrecer' ? '#e67e22' : perfilObjetivo === 'hipertrofia' ? '#2e7d32' : 'var(--gray-600)'),
                            backgroundColor: perfilEconomico ? '#d1e7dd' : (perfilObjetivo === 'emagrecer' ? '#fff3eb' : perfilObjetivo === 'hipertrofia' ? '#e8f5e9' : 'var(--gray-100)'),
                            padding: '3px 8px',
                            borderRadius: '12px',
                            border: `1px solid ${perfilEconomico ? '#badbcc' : (perfilObjetivo === 'emagrecer' ? '#ffd8be' : perfilObjetivo === 'hipertrofia' ? '#c8e6c9' : 'var(--gray-200)')}`
                          }}>
                            {perfilEconomico && (
                              <span>💰 Foco: Dieta Econômica ({perfilObjetivo === 'emagrecer' ? 'Emagrecimento' : perfilObjetivo === 'hipertrofia' ? 'Hipertrofia' : 'Geral'})</span>
                            )}
                            {!perfilEconomico && perfilObjetivo === 'emagrecer' && '⚡ Foco: Emagrecimento'}
                            {!perfilEconomico && perfilObjetivo === 'hipertrofia' && '💪 Foco: Hipertrofia'}
                            {!perfilEconomico && perfilObjetivo === 'geral' && '🥗 Foco: Geral'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {SUGESTOES_DIETA[perfilRestricao]?.[meal.nome]?.map((sug, sugIdx) => {
                            const alimentosAdaptados = sug.alimentos.map(it => adaptarAlimento(it, perfilObjetivo, perfilEconomico));
                            return (
                              <div 
                                key={sugIdx} 
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  padding: '8px 12px', 
                                  backgroundColor: 'var(--gray-50)', 
                                  borderRadius: '6px', 
                                  border: '1px solid var(--gray-200)',
                                  transition: 'var(--transition)'
                                }}
                                className="sugestao-row"
                              >
                                <div style={{ fontSize: '12.5px', color: 'var(--gray-800)', lineHeight: '1.5', flex: 1, paddingRight: '12px' }}>
                                  {alimentosAdaptados.map((it, idx) => (
                                    <span key={idx} style={{ fontWeight: '500' }}>
                                      {it.alimento} <span style={{ color: 'var(--gray-500)', fontSize: '11.5px', fontWeight: 'normal' }}>({it.quantidade})</span>
                                      {idx < alimentosAdaptados.length - 1 ? ' + ' : ''}
                                    </span>
                                  ))}
                                </div>
                                <button 
                                  type="button" 
                                  className="btn-primary" 
                                  style={{ marginTop: 0, padding: '4px 10px', fontSize: '11px', width: 'fit-content', fontWeight: 'bold' }}
                                  onClick={() => handleAplicarSugestao(meal.nome, alimentosAdaptados)}
                                >
                                  + Aplicar
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // MODO VISUALIZAÇÃO
              <div className="info-cards-grid">
                {planoAlimentar.some(m => m.itens.length > 0) ? (
                  planoAlimentar.map((meal, idx) => (
                    meal.itens.length > 0 && (
                      <div className="meal-view-card" key={idx}>
                        <div className="meal-view-header">
                          <span className="meal-view-title">
                            <Coffee size={18} color="var(--primary-orange)" />
                            {meal.nome}
                          </span>
                          <span className="meal-view-time">{meal.horario}</span>
                        </div>
                        <div className="meal-view-items">
                          {meal.itens.map((item, i) => (
                            <div className="meal-view-item" key={i}>
                              <span style={{ fontWeight: '700' }}>{item.alimento}</span> - <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>{item.quantidade}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))
                ) : (
                  <div className="empty-state" style={{ gridColumn: 'span 3', padding: '60px' }}>
                    Nenhum plano alimentar cadastrado ainda. Clique em "Editar Plano Alimentar" para estruturar as refeições do seu paciente!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================
          MODAL DE CADASTRO DE CONSULTA
          ======================================================== */}
      {isConsultaModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleSaveConsulta} className="modal-content medium">
            <div className="modal-header">
              <h2 className="modal-title">Registrar Nova Consulta</h2>
              <button type="button" className="modal-close" onClick={() => setIsConsultaModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Data da Consulta *</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  value={consultaDate}
                  onChange={(e) => setConsultaDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                    placeholder="Ex: 65.4"
                    value={consultaPeso}
                    onChange={(e) => setConsultaPeso(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gordura Corporal (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                    placeholder="Ex: 22.5"
                    value={consultaGordura}
                    onChange={(e) => setConsultaGordura(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                    placeholder="Ex: 74"
                    value={consultaCintura}
                    onChange={(e) => setConsultaCintura(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Quadril (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    style={{ paddingLeft: '14px' }}
                    placeholder="Ex: 98"
                    value={consultaQuadril}
                    onChange={(e) => setConsultaQuadril(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data do Próximo Retorno (Agendamento)</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ paddingLeft: '14px' }}
                  value={consultaProximo}
                  onChange={(e) => setConsultaProximo(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observações Clínicas</label>
                <textarea
                  className="form-textarea"
                  placeholder="Evolução, dificuldades, novas queixas..."
                  value={consultaObs}
                  onChange={(e) => setConsultaObs(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsConsultaModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" style={{ marginTop: 0 }} disabled={consultaLoading}>
                {consultaLoading ? 'Salvando...' : 'Registrar Consulta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE PACIENTE (PRONTUÁRIO) */}
      {isPacienteModalOpen && (
        <div className="modal-overlay">
          <form onSubmit={handleSavePaciente} className="modal-content" style={{ maxWidth: '750px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Dados do Paciente: {nome}</h2>
              <button type="button" className="modal-close" onClick={() => setIsPacienteModalOpen(false)}>
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
                    
                    {/* Seleção Rápida de Restrições */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {[
                        { label: 'Vegano 🌿', tag: 'Vegano' },
                        { label: 'Vegetariano 🥗', tag: 'Vegetariano' },
                        { label: 'Celíaco 🌾', tag: 'Celíaco' },
                        { label: 'Sem Lactose 🥛', tag: 'Intolerante a Lactose' }
                      ].map((item) => {
                        const isChecked = restricoes.some(r => r.toLowerCase() === item.tag.toLowerCase());
                        return (
                          <label key={item.tag} style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            padding: '6px 14px', 
                            backgroundColor: isChecked ? '#fff3eb' : '#f8f9fa', 
                            border: `1px solid ${isChecked ? 'var(--primary-orange, #ff6b00)' : '#dee2e6'}`, 
                            borderRadius: '20px', 
                            fontSize: '12.5px', 
                            cursor: 'pointer',
                            fontWeight: isChecked ? '600' : 'normal',
                            color: isChecked ? 'var(--primary-orange, #ff6b00)' : '#495057',
                            transition: 'all 0.2s ease',
                            userSelect: 'none'
                          }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              style={{ display: 'none' }}
                              onChange={(e) => handleToggleRestricaoRapida(item.tag, e.target.checked)}
                            />
                            <span>{item.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {RESTRICOES_SUGERIDAS.filter(r => !['vegano', 'vegetariano', 'celíaco', 'lactose'].includes(r.toLowerCase())).map((rest) => {
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
              <button type="button" className="btn-secondary" onClick={() => setIsPacienteModalOpen(false)}>
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
                  {formLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

    </Layout>
  );
};

export default PerfilPaciente;
