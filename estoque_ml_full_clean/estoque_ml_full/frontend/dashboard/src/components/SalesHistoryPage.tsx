import React, { useState, useEffect } from 'react';
import '../App.css';

interface Sale {
  id: number;
  product_id: number;
  product_title: string;
  ml_order_id: string;
  quantity_sold: number;
  sale_timestamp: string;
  price?: number;
}

const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'sale_timestamp' | 'quantity_sold'>('sale_timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Em uma implementação real, buscaríamos os dados do backend
    // Por enquanto, vamos gerar dados de exemplo
    generateSampleSales();
  }, [dateRange]);

  const generateSampleSales = () => {
    setLoading(true);
    
    // Gerar dados de exemplo para demonstração
    const sampleSales: Sale[] = [];
    const now = new Date();
    
    // Determinar a data de início com base no filtro de período
    let startDate = new Date();
    if (dateRange === 'day') {
      startDate.setDate(now.getDate() - 1);
    } else if (dateRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    // Produtos de exemplo
    const products = [
      { id: 1, title: 'Smartphone Galaxy A54' },
      { id: 2, title: 'Notebook Dell Inspiron' },
      { id: 3, title: 'Smart TV LG 50"' },
      { id: 4, title: 'Fone de Ouvido JBL' },
      { id: 5, title: 'Câmera Canon EOS' }
    ];
    
    // Gerar vendas de exemplo
    for (let i = 0; i < 50; i++) {
      const saleDate = new Date(
        startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
      );
      
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = Math.floor(Math.random() * 1000) + 100;
      
      sampleSales.push({
        id: i + 1,
        product_id: product.id,
        product_title: product.title,
        ml_order_id: `ML${Math.floor(Math.random() * 10000000)}`,
        quantity_sold: quantity,
        sale_timestamp: saleDate.toISOString(),
        price: price
      });
    }
    
    // Aplicar filtro de busca
    let filteredSales = sampleSales;
    if (searchTerm) {
      filteredSales = filteredSales.filter(sale => 
        sale.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.ml_order_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Ordenar vendas
    filteredSales.sort((a, b) => {
      if (sortField === 'sale_timestamp') {
        const dateA = new Date(a.sale_timestamp).getTime();
        const dateB = new Date(b.sale_timestamp).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortDirection === 'asc' 
          ? a.quantity_sold - b.quantity_sold 
          : b.quantity_sold - a.quantity_sold;
      }
    });
    
    setSales(filteredSales);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSort = (field: 'sale_timestamp' | 'quantity_sold') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: 'sale_timestamp' | 'quantity_sold') => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getTotalSales = () => {
    return sales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
  };

  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + (sale.price || 0) * sale.quantity_sold, 0);
  };

  const getProductSalesSummary = () => {
    const summary: { [key: string]: { quantity: number, revenue: number } } = {};
    
    sales.forEach(sale => {
      if (!summary[sale.product_title]) {
        summary[sale.product_title] = { quantity: 0, revenue: 0 };
      }
      
      summary[sale.product_title].quantity += sale.quantity_sold;
      summary[sale.product_title].revenue += (sale.price || 0) * sale.quantity_sold;
    });
    
    return Object.entries(summary)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5);
  };

  if (loading) return <div className="loading">Carregando histórico de vendas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="sales-history-page">
      <h2>Histórico de Vendas</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Período:</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="day">Último dia</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
            <option value="year">Último ano</option>
          </select>
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por produto ou pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="export-buttons">
          <button className="btn-secondary">Exportar PDF</button>
          <button className="btn-secondary">Exportar Excel</button>
        </div>
      </div>
      
      <div className="sales-summary">
        <div className="summary-card">
          <h3>Resumo de Vendas</h3>
          <p>Total de vendas: <strong>{sales.length}</strong></p>
          <p>Unidades vendidas: <strong>{getTotalSales()}</strong></p>
          <p>Receita total: <strong>{formatCurrency(getTotalRevenue())}</strong></p>
        </div>
        
        <div className="summary-card">
          <h3>Produtos Mais Vendidos</h3>
          <ul className="top-products">
            {getProductSalesSummary().map(([product, data], index) => (
              <li key={index}>
                <span className="product-name">{product}</span>
                <span className="product-stats">
                  {data.quantity} unidades | {formatCurrency(data.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {sales.length === 0 ? (
        <div className="empty-state">Nenhuma venda encontrada para o período selecionado.</div>
      ) : (
        <div className="sales-table-container">
          <table className="sales-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('sale_timestamp')} className="sortable">
                  Data {getSortIcon('sale_timestamp')}
                </th>
                <th>Produto</th>
                <th>Pedido ML</th>
                <th onClick={() => handleSort('quantity_sold')} className="sortable">
                  Quantidade {getSortIcon('quantity_sold')}
                </th>
                <th>Valor</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>{formatDate(sale.sale_timestamp)}</td>
                  <td>{sale.product_title}</td>
                  <td>
                    <a 
                      href={`https://www.mercadolivre.com.br/vendas/${sale.ml_order_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {sale.ml_order_id}
                    </a>
                  </td>
                  <td>{sale.quantity_sold}</td>
                  <td>{formatCurrency(sale.price)}</td>
                  <td>{formatCurrency((sale.price || 0) * sale.quantity_sold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
