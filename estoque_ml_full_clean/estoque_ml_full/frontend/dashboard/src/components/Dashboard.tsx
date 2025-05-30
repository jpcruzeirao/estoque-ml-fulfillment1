import React, { useState, useEffect } from 'react';
import { getSalesChartData, getStockChartData } from '../services/api';
import SalesChart from './SalesChart';
import StockChart from './StockChart';
import '../App.css';

const Dashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState({
    product_count: 0,
    available_stock: 0,
    monthly_sales: 0,
    low_stock_alerts: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    // Verificar status de autenticação
    fetch('/api/status')
      .then(response => response.json())
      .then(data => {
        setIsAuthenticated(data.authenticated);
        if (data.authenticated) {
          // Se autenticado, buscar estatísticas e atividades recentes
          fetchStats();
          fetchRecentActivities();
        } else {
          setLoading(false);
          setLoadingActivities(false);
        }
      })
      .catch(error => {
        console.error('Erro ao verificar status:', error);
        setLoading(false);
        setLoadingActivities(false);
      });
  }, []);

  const fetchStats = () => {
    fetch('/api/stats')
      .then(response => response.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erro ao buscar estatísticas:', error);
        setLoading(false);
      });
  };

  const fetchRecentActivities = () => {
    fetch('/api/activities?days=7&limit=5')
      .then(response => response.json())
      .then(data => {
        setRecentActivities(data.slice(0, 5)); // Limitar a 5 atividades mais recentes
        setLoadingActivities(false);
      })
      .catch(error => {
        console.error('Erro ao buscar atividades recentes:', error);
        setLoadingActivities(false);
      });
  };

  const handleConnectML = () => {
    // Iniciar fluxo de autenticação com o Mercado Livre
    fetch('/auth/login')
      .then(response => response.json())
      .then(data => {
        // Redirecionar para a URL de autenticação do Mercado Livre
        window.location.href = data.auth_url;
      })
      .catch(error => {
        console.error('Erro ao iniciar autenticação:', error);
      });
  };

  const handleSyncProducts = () => {
    setLoading(true);
    fetch('/api/sync/products')
      .then(response => response.json())
      .then(data => {
        alert(`Sincronização concluída! ${data.new_products} novos produtos, ${data.updated_products} atualizados.`);
        fetchStats(); // Atualizar estatísticas após sincronização
        fetchRecentActivities(); // Atualizar atividades recentes
      })
      .catch(error => {
        console.error('Erro ao sincronizar produtos:', error);
        setLoading(false);
      });
  };

  const handleSyncStock = () => {
    setLoading(true);
    fetch('/api/sync/stock')
      .then(response => response.json())
      .then(data => {
        alert(`Estoque atualizado para ${data.updated_products} produtos!`);
        fetchStats(); // Atualizar estatísticas após sincronização
        fetchRecentActivities(); // Atualizar atividades recentes
      })
      .catch(error => {
        console.error('Erro ao sincronizar estoque:', error);
        setLoading(false);
      });
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Sistema de Gestão de Estoque - Fulfillment Mercado Livre</h1>
        <div className="user-info">
          <span>Bem-vindo(a)!</span>
          {!isAuthenticated ? (
            <button className="btn-primary" onClick={handleConnectML}>Conectar ao Mercado Livre</button>
          ) : (
            <div className="action-buttons">
              <button className="btn-secondary" onClick={handleSyncProducts}>Sincronizar Produtos</button>
              <button className="btn-secondary" onClick={handleSyncStock}>Atualizar Estoque</button>
            </div>
          )}
        </div>
      </header>
      
      <div className="dashboard-content">
        <aside className="sidebar">
          <nav>
            <ul>
              <li className="active">Dashboard</li>
              <li>Produtos</li>
              <li>Estoque</li>
              <li>Vendas</li>
              <li>Atividades</li>
              <li>Relatórios</li>
              <li>Configurações</li>
            </ul>
          </nav>
        </aside>
        
        <main className="main-content">
          {loading ? (
            <div className="loading">Carregando dados...</div>
          ) : !isAuthenticated ? (
            <div className="auth-message">
              <h2>Bem-vindo ao Sistema de Gestão de Estoque</h2>
              <p>Para começar, conecte sua conta do Mercado Livre clicando no botão acima.</p>
              <p>Isso permitirá que o sistema acesse seus produtos e dados de estoque no Fulfillment.</p>
            </div>
          ) : (
            <>
              <div className="stats-cards">
                <div className="card">
                  <h3>Total de Produtos</h3>
                  <p className="stat">{stats.product_count}</p>
                  <p className="description">Produtos no Fulfillment</p>
                </div>
                
                <div className="card">
                  <h3>Estoque Disponível</h3>
                  <p className="stat">{stats.available_stock}</p>
                  <p className="description">Unidades disponíveis para venda</p>
                </div>
                
                <div className="card">
                  <h3>Vendas do Mês</h3>
                  <p className="stat">{stats.monthly_sales}</p>
                  <p className="description">Unidades vendidas este mês</p>
                </div>
                
                <div className={`card ${stats.low_stock_alerts > 0 ? 'warning' : ''}`}>
                  <h3>Alertas</h3>
                  <p className="stat">{stats.low_stock_alerts}</p>
                  <p className="description">Produtos com estoque baixo</p>
                </div>
              </div>
              
              <div className="charts-section">
                <SalesChart />
                <StockChart />
              </div>
              
              <div className="recent-activity">
                <h3>Atividade Recente</h3>
                <div className="activity-list">
                  {loadingActivities ? (
                    <p className="loading">Carregando atividades recentes...</p>
                  ) : recentActivities.length === 0 ? (
                    <p className="empty-state">Nenhuma atividade recente para exibir.</p>
                  ) : (
                    <ul>
                      {recentActivities.map((activity, index) => (
                        <li key={index} className={`activity-item ${activity.type}`}>
                          <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                          <div className="activity-content">
                            <span className="activity-time">{formatDate(activity.timestamp)}</span>
                            <span className="activity-description">{activity.description}</span>
                            {activity.product_title && (
                              <span className="activity-product">{activity.product_title}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
