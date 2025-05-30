import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getSalesChart } from '../services/api';

interface DailyData {
  date: string;
  quantity: number;
}

interface SalesData {
  id: number;
  title: string;
  total_sold: number;
  daily_data: DailyData[];
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

const SalesChart: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cores para as linhas do gráfico (amarelo e azul escuro como cores principais)
  const colors = ['#FFD700', '#1A365D', '#4299E1', '#ECC94B', '#2D3748'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getSalesChart();
        setSalesData(data);
        
        // Processar dados para o formato do gráfico
        processChartData(data);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados de vendas:', err);
        setError('Não foi possível carregar os dados de vendas. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processChartData = (data: SalesData[]) => {
    if (!data || data.length === 0) return;

    // Criar um mapa de todas as datas
    const dateMap: { [key: string]: ChartData } = {};
    
    // Para cada produto
    data.forEach(product => {
      // Para cada registro diário deste produto
      product.daily_data.forEach(daily => {
        if (!dateMap[daily.date]) {
          dateMap[daily.date] = { date: daily.date };
        }
        
        // Adicionar a quantidade vendida deste produto nesta data
        dateMap[daily.date][product.title] = daily.quantity;
      });
    });
    
    // Converter o mapa em um array e ordenar por data
    const chartData = Object.values(dateMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    setChartData(chartData);
  };

  if (loading) return <div className="loading">Carregando dados de vendas...</div>;
  if (error) return <div className="error">{error}</div>;
  if (chartData.length === 0) return <div className="empty-state">Nenhum dado de vendas disponível.</div>;

  return (
    <div className="chart-container">
      <h3>Vendas por Produto (Últimos 30 dias)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              const d = new Date(date);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [`${value} unidades`, name]}
            labelFormatter={(label) => {
              const d = new Date(label);
              return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            }}
          />
          <Legend />
          {salesData.map((product, index) => (
            <Line
              key={product.id}
              type="monotone"
              dataKey={product.title}
              stroke={colors[index % colors.length]}
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-summary">
        <h4>Produtos mais vendidos:</h4>
        <ul>
          {salesData.map(product => (
            <li key={product.id}>
              <span className="product-title">{product.title}</span>: 
              <span className="product-total"> {product.total_sold} unidades</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SalesChart;
