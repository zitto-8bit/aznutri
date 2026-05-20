import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import NutritionMascot from '../components/NutritionMascot';

interface Paciente {
  id: string;
  nome: string;
}

interface Consulta {
  data_consulta: string;
  proximo_retorno: string | null;
  paciente_id: string;
}

const Dashboard: React.FC = () => {
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [consultasSemana, setConsultasSemana] = useState(0);
  const [pacientesSemRetorno, setPacientesSemRetorno] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userPrefixo, setUserPrefixo] = useState('Dra.');
  const [userPronome, setUserPronome] = useState('a');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pegar nome da nutricionista
      const { data: nutri } = await supabase
        .from('nutricionistas')
        .select('nome, prefixo, pronome')
        .eq('id', user.id)
        .single();
      
      if (nutri) {
        setUserName(nutri.nome);
        setUserPrefixo(nutri.prefixo !== undefined ? nutri.prefixo : 'Dra.');
        setUserPronome(nutri.pronome || 'a');
      }

      // 1. Total de pacientes ativos
      const { count: countPacientes } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('nutricionista_id', user.id);
      
      setTotalPacientes(countPacientes || 0);

      // 2. Consultas da semana
      const today = new Date();
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay())); // Domingo
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6)); // Sábado
      
      const startStr = firstDay.toISOString().split('T')[0];
      const endStr = lastDay.toISOString().split('T')[0];

      const { count: countConsultas } = await supabase
        .from('consultas')
        .select('*, pacientes!inner(nutricionista_id)', { count: 'exact', head: true })
        .eq('pacientes.nutricionista_id', user.id)
        .gte('data_consulta', startStr)
        .lte('data_consulta', endStr);
      
      setConsultasSemana(countConsultas || 0);

      // 3. Pacientes sem retorno (> 30 dias e sem próximo retorno)
      // Buscamos pacientes e suas consultas
      const { data: pacientesData } = await supabase
        .from('pacientes')
        .select('id, nome, consultas(data_consulta, proximo_retorno)')
        .eq('nutricionista_id', user.id);

      if (pacientesData) {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        const hoje = new Date();

        const semRetorno = pacientesData.filter(p => {
          const consultas = p.consultas as unknown as Consulta[];
          if (!consultas || consultas.length === 0) return false;

          // Encontrar a consulta mais recente
          const ultimaConsulta = [...consultas].sort((a, b) => 
            new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
          )[0];

          const dataUltima = new Date(ultimaConsulta.data_consulta);
          
          // Verificar se há algum retorno agendado para o futuro
          const temRetornoAgendado = consultas.some(c => 
            c.proximo_retorno && new Date(c.proximo_retorno) > hoje
          );

          return dataUltima < trintaDiasAtras && !temRetornoAgendado;
        });

        setPacientesSemRetorno(semRetorno.map(p => ({ id: p.id, nome: p.nome })));
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            {userPronome === 'a' && 'Bem-vinda, '}
            {userPronome === 'o' && 'Bem-vindo, '}
            {userPronome === 'e' && 'Bem-vinde, '}
            {userPronome === 'neutro' && 'Olá, '}
            {userPrefixo && !userName.toLowerCase().startsWith(userPrefixo.toLowerCase()) ? `${userPrefixo} ` : ''}
            {userName || 'Nutricionista'}
          </p>
        </div>
      </div>

      <NutritionMascot />

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-green">
            <Users size={24} />
          </div>
          <div className="stat-label">Total de Pacientes</div>
          <div className="stat-value">{loading ? '...' : totalPacientes}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper icon-orange">
            <Calendar size={24} />
          </div>
          <div className="stat-label">Consultas da Semana</div>
          <div className="stat-value">{loading ? '...' : consultasSemana}</div>
        </div>

        <div className="stat-card list-card">
          <div className="stat-icon-wrapper icon-blue">
            <AlertCircle size={24} />
          </div>
          <div className="stat-label">Pacientes sem Retorno (mais de 30 dias)</div>
          
          <div className="patient-list">
            {loading ? (
              <div className="empty-state">Carregando pacientes...</div>
            ) : pacientesSemRetorno.length > 0 ? (
              pacientesSemRetorno.map(p => (
                <a href={`/paciente/${p.id}`} key={p.id} className="patient-item">
                  <span className="patient-name">{p.nome}</span>
                  <ChevronRight size={18} color="var(--gray-200)" />
                </a>
              ))
            ) : (
              <div className="empty-state">Nenhum paciente sem retorno no momento</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
