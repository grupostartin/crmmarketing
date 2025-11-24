import React from 'react';
import { TrendingUp, Users, DollarSign, Activity, CheckSquare } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PixelCard from '../components/ui/PixelCard';
import PixelButton from '../components/ui/PixelButton';

const data = [
  { name: 'Sem1', leads: 40, sales: 24 },
  { name: 'Sem2', leads: 30, sales: 13 },
  { name: 'Sem3', leads: 55, sales: 38 },
  { name: 'Sem4', leads: 80, sales: 50 },
  { name: 'Sem5', leads: 65, sales: 45 },
  { name: 'Sem6', leads: 90, sales: 70 },
];

const pieData = [
  { name: 'Novos', value: 400 },
  { name: 'Qualificados', value: 300 },
  { name: 'Fechados', value: 300 },
];

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
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-header text-3xl text-retro-fg">Dashboard Executivo</h1>
        <div className="flex gap-4">
            <PixelButton variant="secondary">Exportar Relatório</PixelButton>
            <PixelButton variant="primary">+ Adicionar Widget</PixelButton>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total de Leads" value="1.248" trend="15,2%" icon={Users} color="text-retro-cyan" />
        <StatCard title="Conversão" value="62%" trend="3,1%" icon={Activity} color="text-retro-pink" />
        <StatCard title="Valor Pipeline" value="R$ 85k" trend="12,5%" icon={DollarSign} color="text-retro-green" />
        <StatCard title="Contratos" value="12" trend="20%" icon={CheckSquare} color="text-retro-purple" />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <PixelCard title="Curva de Crescimento de Leads">
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
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
                </div>
            </PixelCard>
        </div>
      </div>

      {/* Alert Section */}
      <div className="bg-retro-red/20 border-4 border-retro-red p-6 flex justify-between items-center shadow-pixel">
        <div className="flex gap-4 items-center">
            <div className="bg-retro-red text-black p-2 font-header text-2xl">!</div>
            <div>
                <h3 className="font-header text-retro-red text-lg">8 Leads Estagnados Detectados</h3>
                <p className="text-retro-fg text-lg">Estes leads estão parados em 'Contatado' há mais de 7 dias.</p>
            </div>
        </div>
        <PixelButton variant="danger">Ver Leads</PixelButton>
      </div>
    </div>
  );
};

export default Dashboard;