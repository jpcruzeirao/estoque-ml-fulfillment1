import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import '../App.css';

interface Activity {
  id: number;
  type: 'sale' | 'adjustment' | 'sync' | 'stock_change';
  description: string;
  timestamp: string;
  product_id?: number;
  product_title?: string;
  quantity?: number;
}

const ActivityHistoryPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('week');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Em uma implementação real, buscaríamos os dados do backend
    // Por enquanto, vamos gerar dados de exemplo
    generateSampleActivities();
  }, [filterType, dateRange]);

  const generateSampleActivities = () => {
    setLoading(true);
    
    // Gerar dados de exemplo para demonstração
    const sampleActivities: Activity[] = [];
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
    
    // Gerar vendas de exemplo
    for (let i = 0; i < 15; i++) {
      const activityDate = new Date(
        startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
      );
      
      sampleActivities.push({
        id: i + 1,
        type: 'sale',
        description: `Venda realizada pelo Mercado Livre`,
        timestamp: activityDate.toISOString(),
        product_id: Math.floor(Math.random() * 10) + 1,
        product_title: `Produto ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
        quantity: Math.floor(Math.random() * 3) + 1
      });
    }
    
    // Gerar ajustes de estoque de exemplo
    for (let i = 0; i < 5; i++) {
      const activityDate = new Date(
        startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
      );
      
      const adjustmentType = Math.random() > 0.5 ? 'entrada_manual' : 'saida_manual';
      const quantity = adjustmentType === 'entrada_manual' 
        ? Math.floor(Math.random() * 10) + 1 
        : -1 * (Math.floor(Math.random() * 3) + 1);
      
      sampleActivities.push({
        id: i + 16,
        type: 'adjustment',
        description: `Ajuste manual de estoque: ${adjustmentType === 'entrada_manual' ? 'Entrada' : 'Saída'}`,
        timestamp: activityDate.toISOString(),
        product_id: Math.floor(Math.random() * 10) + 1,
        product_title: `Produto ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
        quantity: quantity
      });
    }
    
    // Gerar sincronizações de exemplo
    for (let i = 0; i < 3; i++) {
      const activityDate = new Date(
        startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
      );
      
      sampleActivities.push({
        id: i + 21,
        type: 'sync',
        description: `Sincronização com Mercado Livre`,
        timestamp: activityDate.toISOString()
      });
    }
    
    // Gerar mudanças de estoque de exemplo
    for (let i = 0; i < 8; i++) {
      const activityDate = new Date(
        startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime())
      );
      
      sampleActivities.push({
        id: i + 24,
        type: 'stock_change',
        description: `Atualização de estoque no Fulfillment`,
        timestamp: activityDate.toISOString(),
        product_id: Math.floor(Math.random() * 10) + 1,
        product_title: `Produto ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
        quantity: Math.floor(Math.random() * 20) - 10
      });
    }
    
    // Ordenar por data (mais recente primeiro)
    sampleActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Aplicar filtro por tipo
    let filteredActivities = sampleActivities;
    if (filterType !== 'all') {
      filteredActivities = sampleActivities.filter(activity => activity.type === filterType);
    }
    
    // Aplicar filtro de busca
    if (searchTerm) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.product_title && activity.product_title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setActivities(filteredActivities);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return '💰';
      case 'adjustment':
        return '✏️';
      case 'sync':
        return '🔄';
      case 'stock_change':
        return '📦';
      default:
        return '📝';
    }
  };

  const getActivityClass = (type: string) => {
    switch (type) {
      case 'sale':
        return 'activity-sale';
      case 'adjustment':
        return 'activity-adjustment';
      case 'sync':
        return 'activity-sync';
      case 'stock_change':
        return 'activity-stock';
      default:
        return '';
    }
  };

  if (loading) return <div className="loading">Carregando histórico de atividades...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="activity-history-page">
      <h2>Histórico de Atividades</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Tipo:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="sale">Vendas</option>
            <option value="adjustment">Ajustes</option>
            <option value="sync">Sincronizações</option>
            <option value="stock_change">Mudanças de Estoque</option>
          </select>
        </div>
        
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
            placeholder="Buscar atividades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {activities.length === 0 ? (
        <div className="empty-state">Nenhuma atividade encontrada para os filtros selecionados.</div>
      ) : (
        <div className="activity-timeline">
          {activities.map(activity => (
            <div key={activity.id} className={`activity-item ${getActivityClass(activity.type)}`}>
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-content">
                <div className="activity-header">
                  <span className="activity-time">{formatDate(activity.timestamp)}</span>
                  <span className="activity-type">{activity.type === 'sale' ? 'Venda' : 
                                                  activity.type === 'adjustment' ? 'Ajuste' : 
                                                  activity.type === 'sync' ? 'Sincronização' : 
                                                  'Mudança de Estoque'}</span>
                </div>
                <div className="activity-description">
                  {activity.description}
                </div>
                {activity.product_title && (
                  <div className="activity-details">
                    <span className="product-name">{activity.product_title}</span>
                    {activity.quantity !== undefined && (
                      <span className={`quantity ${activity.quantity >= 0 ? 'positive' : 'negative'}`}>
                        {activity.quantity >= 0 ? '+' : ''}{activity.quantity} unidades
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="activity-summary">
        <p>Total de atividades: <strong>{activities.length}</strong></p>
        <p>Vendas: <strong>{activities.filter(a => a.type === 'sale').length}</strong></p>
        <p>Ajustes: <strong>{activities.filter(a => a.type === 'adjustment').length}</strong></p>
        <p>Sincronizações: <strong>{activities.filter(a => a.type === 'sync').length}</strong></p>
        <p>Mudanças de Estoque: <strong>{activities.filter(a => a.type === 'stock_change').length}</strong></p>
      </div>
    </div>
  );
};

export default ActivityHistoryPage;
