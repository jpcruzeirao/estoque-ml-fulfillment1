import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { getStockChart } from '../services/api';

interface StockHistoryItem {
  date: string;
  available: number;
  total: number;
}

interface StockData {
  id: number;
  title: string;
  stock_history: StockHistoryItem[];
}

const StockChart: React.FC = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [chartData, setChartData] = useState<StockHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cores para o gráfico (amarelo e azul escuro como cores principais)
  const colors = {
    available: '#FFD700', // Amarelo
    total: '#1A365D'      // Azul escuro
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getStockChart();
        setStockData(data);
        
        // Selecionar o primeiro produto por padrão
        if (data && data.length > 0) {
          setSelectedProduct(data[0].id);
          setChartData(data[0].stock_history);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar dados de estoque:', err);
        setError('Não foi possível carregar os dados de estoque. Tente novamente mais tarde.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = (productId: number) => {
    setSelectedProduct(productId);
    const product = stockData.find(p => p.id === productId);
    if (product) {
      setChartData(product.stock_history);
    }
  };

  if (loading) return <div className="loading">Carregando dados de estoque...</div>;
  if (error) return <div className="error">{error}</div>;
  if (stockData.length === 0) return <div className="empty-state">Nenhum dado de estoque disponível.</div>;

  return (
    <div className="chart-container">
      <h3>Nível de Estoque</h3>
      
      <div className="product-selector">
        <label htmlFor="product-select">Selecione um produto: </label>
        <select 
          id="product-select"
          value={selectedProduct || ''}
          onChange={(e) => handleProductChange(Number(e.target.value))}
        >
          {stockData.map(product => (
            <option key={product.id} value={product.id}>
              {product.title}
            </option>
          ))}
        </select>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
            formatter={(value, name) => {
              const label = name === 'available' ? 'Disponível' : 'Total';
              return [`${value} unidades`, label];
            }}
            labelFormatter={(label) => {
              const d = new Date(label);
              return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
            }}
          />
          <Legend 
            formatter={(value) => value === 'available' ? 'Disponível' : 'Total'}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stackId="1" 
            stroke={colors.total} 
            fill={colors.total} 
            fillOpacity={0.3}
          />
          <Area 
            type="monotone" 
            dataKey="available" 
            stackId="2" 
            stroke={colors.available} 
            fill={colors.available} 
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="chart-summary">
        <h4>Resumo do estoque:</h4>
        {selectedProduct && (
          <div className="stock-summary">
            <p>
              <strong>Produto:</strong> {stockData.find(p => p.id === selectedProduct)?.title}
            </p>
            <p>
              <strong>Último registro:</strong> {
                chartData.length > 0 
                  ? `${chartData[chartData.length - 1].available} unidades disponíveis de ${chartData[chartData.length - 1].total} totais`
                  : 'Sem dados'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockChart;
