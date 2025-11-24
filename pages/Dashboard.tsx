import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, CheckSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PixelCard from '../components/ui/PixelCard';
import PixelButton from '../components/ui/PixelButton';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#8be9fd', '#ff79c6', '#50fa7b'];

const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
  <PixelCard className="relative overflow-hidden">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-retro-comment text-lg uppercase mb-2">{title}</p>
        <h2 className={`font-header text-2xl ${color}`}>{value}</h2>
      </div>
      <div className="p-2 border-2 border-current text-retro-fg opacity-80">
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <span className="text-retro-green font-bold flex items-center">
        ▲ {trend}
      </span>
      <span className="text-retro-comment text-sm">vs mês anterior</span>
    </div>
  </PixelCard>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalLeadsLastMonth: 0,
    conversion: 0,
    conversionLastMonth: 0,
    pipelineValue: 0,
    pipelineValueLastMonth: 0,
    contracts: 0,
    contractsLastMonth: 0,
  });
  const [weeklyData, setWeeklyData] = useState<Array<{ name: string; leads: number; sales: number }>>([]);
  const [pieData, setPieData] = useState<Array<{ name: string; value: number }>>([]);
  const [stagnantLeads, setStagnantLeads] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Buscar total de leads (mês atual e mês anterior)
      const { data: contactsCurrent } = await supabase
        .from('contacts')
        .select('id, created_at, status')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: contactsLastMonth } = await supabase
        .from('contacts')
        .select('id')
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      // Buscar deals para pipeline e conversão
      const { data: dealsCurrent } = await supabase
        .from('deals')
        .select('value, created_at')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: dealsLastMonth } = await supabase
        .from('deals')
        .select('value')
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      // Buscar contratos
      const { data: contractsCurrent } = await supabase
        .from('contracts')
        .select('id')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: contractsLastMonth } = await supabase
        .from('contracts')
        .select('id')
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', currentMonthStart.toISOString());

      // Calcular pipeline
      const pipelineCurrent = dealsCurrent?.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0;
      const pipelineLastMonth = dealsLastMonth?.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0;

      // Calcular conversão (leads que viraram deals ou contracts)
      const totalLeads = contactsCurrent?.length || 0;
      const convertedLeads = (dealsCurrent?.length || 0) + (contractsCurrent?.length || 0);
      const conversion = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const totalLeadsLastMonth = contactsLastMonth?.length || 0;
      const convertedLeadsLastMonth = (dealsLastMonth?.length || 0) + (contractsLastMonth?.length || 0);
      const conversionLastMonth = totalLeadsLastMonth > 0 ? (convertedLeadsLastMonth / totalLeadsLastMonth) * 100 : 0;

      // Buscar todos os leads para distribuição
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('status');

      // Distribuição por status
      const statusCounts: Record<string, number> = {};
      allContacts?.forEach(contact => {
        const status = contact.status || 'Lead';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const distributionData = [
        { name: 'Novos', value: statusCounts['Lead'] || 0 },
        { name: 'Qualificados', value: statusCounts['Qualificado'] || 0 },
        { name: 'Fechados', value: statusCounts['Fechado'] || 0 },
      ].filter(item => item.value > 0);

      // Dados semanais (últimas 6 semanas)
      const weeklyStats: Array<{ name: string; leads: number; sales: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7 + 6));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const { data: weekContacts } = await supabase
          .from('contacts')
          .select('id')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        const { data: weekDeals } = await supabase
          .from('deals')
          .select('id')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());

        weeklyStats.push({
          name: `Sem${6 - i}`,
          leads: weekContacts?.length || 0,
          sales: weekDeals?.length || 0,
        });
      }

      // Leads estagnados (status "Contatado" há mais de 7 dias)
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const { data: stagnantContacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('status', 'Contatado')
        .lt('created_at', sevenDaysAgo.toISOString());

      setStats({
        totalLeads: totalLeads,
        totalLeadsLastMonth: totalLeadsLastMonth,
        conversion: conversion,
        conversionLastMonth: conversionLastMonth,
        pipelineValue: pipelineCurrent,
        pipelineValueLastMonth: pipelineLastMonth,
        contracts: contractsCurrent?.length || 0,
        contractsLastMonth: contractsLastMonth?.length || 0,
      });
      setWeeklyData(weeklyStats);
      setPieData(distributionData);
      setStagnantLeads(stagnantContacts?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrend = (current: number, lastMonth: number): string => {
    if (lastMonth === 0) return current > 0 ? '100%' : '0%';
    const change = ((current - lastMonth) / lastMonth) * 100;
    return change >= 0 ? `${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const handleExportReport = async () => {
    try {
      // Buscar dados detalhados para o relatório
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Buscar todos os contatos com detalhes
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('name, email, phone, company, status, created_at')
        .order('created_at', { ascending: false });

      // Buscar todos os deals
      const { data: allDeals } = await supabase
        .from('deals')
        .select('title, value, stage, created_at, contact:contacts(name)')
        .order('created_at', { ascending: false });

      // Buscar todos os contratos
      const { data: allContracts } = await supabase
        .from('contracts')
        .select('title, status, mrr, start_date, renewal_date, contact:contacts(name)')
        .order('created_at', { ascending: false });

      // Preparar dados do CSV
      const csvLines: string[] = [];

      // Cabeçalho
      csvLines.push('RELATÓRIO EXECUTIVO - DASHBOARD');
      csvLines.push(`Data de Exportação: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`);
      csvLines.push('');

      // Métricas Principais
      csvLines.push('=== MÉTRICAS PRINCIPAIS ===');
      csvLines.push('Métrica,Valor Atual,Valor Mês Anterior,Tendência');
      csvLines.push(`Total de Leads,${stats.totalLeads},${stats.totalLeadsLastMonth},${calculateTrend(stats.totalLeads, stats.totalLeadsLastMonth)}`);
      csvLines.push(`Conversão,${stats.conversion.toFixed(2)}%,${stats.conversionLastMonth.toFixed(2)}%,${calculateTrend(stats.conversion, stats.conversionLastMonth)}`);
      csvLines.push(`Valor Pipeline,R$ ${stats.pipelineValue.toFixed(2)},R$ ${stats.pipelineValueLastMonth.toFixed(2)},${calculateTrend(stats.pipelineValue, stats.pipelineValueLastMonth)}`);
      csvLines.push(`Contratos,${stats.contracts},${stats.contractsLastMonth},${calculateTrend(stats.contracts, stats.contractsLastMonth)}`);
      csvLines.push('');

      // Distribuição de Leads
      csvLines.push('=== DISTRIBUIÇÃO DE LEADS POR STATUS ===');
      csvLines.push('Status,Quantidade');
      pieData.forEach(item => {
        csvLines.push(`${item.name},${item.value}`);
      });
      csvLines.push('');

      // Crescimento Semanal
      csvLines.push('=== CRESCIMENTO SEMANAL (ÚLTIMAS 6 SEMANAS) ===');
      csvLines.push('Semana,Leads,Vendas');
      weeklyData.forEach(item => {
        csvLines.push(`${item.name},${item.leads},${item.sales}`);
      });
      csvLines.push('');

      // Leads Estagnados
      if (stagnantLeads > 0) {
        csvLines.push('=== LEADS ESTAGNADOS ===');
        csvLines.push(`Total de Leads Estagnados: ${stagnantLeads}`);
        csvLines.push('(Leads com status "Contatado" há mais de 7 dias)');
        csvLines.push('');
      }

      // Função auxiliar para escapar caracteres especiais no CSV
      const escapeCsv = (str: string) => (str || '').replace(/"/g, '""');

      // Lista de Contatos
      csvLines.push('=== LISTA DE CONTATOS ===');
      csvLines.push('Nome,Email,Telefone,Empresa,Status,Data de Criação');
      allContacts?.forEach(contact => {
        const date = new Date(contact.created_at).toLocaleDateString('pt-BR');
        csvLines.push(`"${escapeCsv(contact.name || '')}","${escapeCsv(contact.email || '')}","${escapeCsv(contact.phone || '')}","${escapeCsv(contact.company || '')}","${escapeCsv(contact.status || '')}",${date}`);
      });
      csvLines.push('');

      // Lista de Deals
      csvLines.push('=== LISTA DE NEGÓCIOS ===');
      csvLines.push('Título,Valor,Estágio,Contato,Data de Criação');
      allDeals?.forEach(deal => {
        const contactName = (deal.contact as any)?.name || 'N/A';
        const date = new Date(deal.created_at).toLocaleDateString('pt-BR');
        csvLines.push(`"${escapeCsv(deal.title || '')}",R$ ${Number(deal.value || 0).toFixed(2)},"${escapeCsv(deal.stage || '')}","${escapeCsv(contactName)}",${date}`);
      });
      csvLines.push('');

      // Lista de Contratos
      csvLines.push('=== LISTA DE CONTRATOS ===');
      csvLines.push('Título,Status,MRR,Data Início,Data Renovação,Contato');
      allContracts?.forEach(contract => {
        const contactName = (contract.contact as any)?.name || 'N/A';
        const startDate = contract.start_date ? new Date(contract.start_date).toLocaleDateString('pt-BR') : 'N/A';
        const renewalDate = contract.renewal_date ? new Date(contract.renewal_date).toLocaleDateString('pt-BR') : 'N/A';
        csvLines.push(`"${escapeCsv(contract.title || '')}","${escapeCsv(contract.status || '')}",R$ ${Number(contract.mrr || 0).toFixed(2)},${startDate},${renewalDate},"${escapeCsv(contactName)}"`);
      });

      // Converter para CSV e fazer download
      const csvContent = csvLines.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_dashboard_${now.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-center h-96">
          <p className="text-retro-comment text-xl">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-header text-3xl text-retro-fg">Dashboard Executivo</h1>
        <div className="flex gap-4">
            <PixelButton variant="secondary" onClick={handleExportReport}>Exportar Relatório</PixelButton>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Leads" 
          value={formatNumber(stats.totalLeads)} 
          trend={calculateTrend(stats.totalLeads, stats.totalLeadsLastMonth)} 
          icon={Users} 
          color="text-retro-cyan" 
        />
        <StatCard 
          title="Conversão" 
          value={`${stats.conversion.toFixed(0)}%`} 
          trend={calculateTrend(stats.conversion, stats.conversionLastMonth)} 
          icon={Activity} 
          color="text-retro-pink" 
        />
        <StatCard 
          title="Valor Pipeline" 
          value={formatCurrency(stats.pipelineValue)} 
          trend={calculateTrend(stats.pipelineValue, stats.pipelineValueLastMonth)} 
          icon={DollarSign} 
          color="text-retro-green" 
        />
        <StatCard 
          title="Contratos" 
          value={stats.contracts.toString()} 
          trend={calculateTrend(stats.contracts, stats.contractsLastMonth)} 
          icon={CheckSquare} 
          color="text-retro-purple" 
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <PixelCard title="Curva de Crescimento de Leads">
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#44475a" />
                        <XAxis dataKey="name" stroke="#f8f8f2" fontFamily="VT323" fontSize={16} />
                        <YAxis stroke="#f8f8f2" fontFamily="VT323" fontSize={16} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#282a36', border: '2px solid #bd93f9', borderRadius: '0px' }}
                            itemStyle={{ color: '#f8f8f2', fontFamily: 'VT323' }}
                        />
                        <Line type="monotone" dataKey="leads" stroke="#8be9fd" strokeWidth={3} dot={{ r: 6, fill: '#282a36', strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="sales" stroke="#ff79c6" strokeWidth={3} dot={{ r: 6, fill: '#282a36', strokeWidth: 2 }} />
                    </LineChart>
                    </ResponsiveContainer>
                </div>
            </PixelCard>
        </div>

        <div>
            <PixelCard title="Distribuição de Leads">
                <div className="h-80 w-full flex flex-col items-center justify-center">
                    {pieData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="70%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#282a36" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#282a36', border: '2px solid #fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="w-full px-4">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex justify-between items-center mb-2 text-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border border-black" style={{ backgroundColor: COLORS[index] }}></div>
                                        <span>{entry.name}</span>
                                    </div>
                                    <span className="font-bold">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-retro-comment">Sem dados para exibir</p>
                    )}
                </div>
            </PixelCard>
        </div>
      </div>

      {/* Alert Section */}
      {stagnantLeads > 0 && (
        <div className="bg-retro-red/20 border-4 border-retro-red p-6 flex justify-between items-center shadow-pixel">
          <div className="flex gap-4 items-center">
              <div className="bg-retro-red text-black p-2 font-header text-2xl">!</div>
              <div>
                  <h3 className="font-header text-retro-red text-lg">{stagnantLeads} Leads Estagnados Detectados</h3>
                  <p className="text-retro-fg text-lg">Estes leads estão parados em 'Contatado' há mais de 7 dias.</p>
              </div>
          </div>
          <PixelButton variant="danger" onClick={() => navigate('/contacts')}>Ver Leads</PixelButton>
        </div>
      )}
    </div>
  );
};

export default Dashboard;