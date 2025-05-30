import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import '../App.css';

interface Product {
  id: number;
  sku: string;
  ml_item_id: string;
  ml_inventory_id: string;
  title: string;
  created_at: string;
  stock: {
    total: number;
    available: number;
    not_available: number;
    last_updated: string | null;
  };
}

interface AlertSettings {
  enabled: boolean;
  threshold: number;
  notification_email: string;
  notification_dashboard: boolean;
}

const AlertSettingsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<AlertSettings>({
    enabled: true,
    threshold: 5,
    notification_email: '',
    notification_dashboard: true
  });
  const [productSettings, setProductSettings] = useState<{[key: number]: AlertSettings}>({});
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchAlertSettings();
  }, []);

  useEffect(() => {
    // Identificar produtos com estoque baixo
    if (products.length > 0) {
      const lowStock = products.filter(product => {
        const productThreshold = productSettings[product.id]?.threshold || globalSettings.threshold;
        return product.stock.available <= productThreshold;
      });
      setLowStockProducts(lowStock);
    }
  }, [products, productSettings, globalSettings]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Não foi possível carregar os produtos. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const fetchAlertSettings = async () => {
    try {
      // Em uma implementação real, buscaríamos as configurações do backend
      // Por enquanto, vamos usar valores padrão
      
      // Simular busca de configurações globais
      const mockGlobalSettings: AlertSettings = {
        enabled: true,
        threshold: 5,
        notification_email: 'usuario@exemplo.com',
        notification_dashboard: true
      };
      
      setGlobalSettings(mockGlobalSettings);
      
      // Simular busca de configurações específicas por produto
      const mockProductSettings: {[key: number]: AlertSettings} = {};
      
      // Configurar alguns produtos com valores personalizados
      if (products.length > 0) {
        // Primeiro produto com threshold mais baixo
        if (products[0]) {
          mockProductSettings[products[0].id] = {
            ...mockGlobalSettings,
            threshold: 3
          };
        }
        
        // Segundo produto com threshold mais alto
        if (products[1]) {
          mockProductSettings[products[1].id] = {
            ...mockGlobalSettings,
            threshold: 10
          };
        }
      }
      
      setProductSettings(mockProductSettings);
      
    } catch (err) {
      console.error('Erro ao buscar configurações de alertas:', err);
    }
  };

  const handleGlobalSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setGlobalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductSettingChange = (productId: number, field: keyof AlertSettings, value: any) => {
    setProductSettings(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { ...globalSettings }),
        [field]: value
      }
    }));
  };

  const handleResetProductSettings = (productId: number) => {
    setProductSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[productId];
      return newSettings;
    });
  };

  const handleSaveSettings = async () => {
    try {
      // Em uma implementação real, enviaríamos as configurações para o backend
      // Por enquanto, apenas simular o salvamento
      
      setSuccessMessage('Configurações de alertas salvas com sucesso!');
      
      // Limpar a mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError('Não foi possível salvar as configurações. Tente novamente mais tarde.');
      
      // Limpar a mensagem de erro após alguns segundos
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const getProductThreshold = (productId: number) => {
    return productSettings[productId]?.threshold !== undefined 
      ? productSettings[productId].threshold 
      : globalSettings.threshold;
  };

  if (loading) return <div className="loading">Carregando configurações de alertas...</div>;
  if (error && !products.length) return <div className="error">{error}</div>;

  return (
    <div className="alert-settings-page">
      <h2>Configurações de Alertas de Estoque Baixo</h2>
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="settings-container">
        <div className="global-settings">
          <h3>Configurações Globais</h3>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="enabled"
                checked={globalSettings.enabled}
                onChange={handleGlobalSettingsChange}
              />
              Ativar alertas de estoque baixo
            </label>
          </div>
          
          <div className="form-group">
            <label htmlFor="threshold">Limite de estoque baixo (unidades):</label>
            <input
              type="number"
              id="threshold"
              name="threshold"
              min="1"
              value={globalSettings.threshold}
              onChange={handleGlobalSettingsChange}
            />
            <p className="help-text">
              Produtos com estoque disponível abaixo deste valor serão marcados como estoque baixo.
            </p>
          </div>
          
          <div className="form-group">
            <label htmlFor="notification_email">Email para notificações:</label>
            <input
              type="email"
              id="notification_email"
              name="notification_email"
              value={globalSettings.notification_email}
              onChange={handleGlobalSettingsChange}
              placeholder="seu@email.com"
            />
          </div>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="notification_dashboard"
                checked={globalSettings.notification_dashboard}
                onChange={handleGlobalSettingsChange}
              />
              Mostrar alertas no dashboard
            </label>
          </div>
        </div>
        
        <div className="product-specific-settings">
          <h3>Configurações por Produto</h3>
          <p className="help-text">
            Defina limites específicos para produtos individuais. Se não configurado, será usado o limite global.
          </p>
          
          <div className="products-list">
            {products.length === 0 ? (
              <div className="empty-state">Nenhum produto encontrado.</div>
            ) : (
              <ul>
                {products.map(product => (
                  <li key={product.id} className={product.stock.available <= getProductThreshold(product.id) ? 'low-stock' : ''}>
                    <div className="product-info">
                      <span className="product-title">{product.title}</span>
                      <span className="product-stock">
                        Estoque atual: <strong>{product.stock.available}</strong> unidades
                      </span>
                    </div>
                    
                    <div className="product-settings">
                      <div className="setting-group">
                        <label>Limite específico:</label>
                        <input
                          type="number"
                          min="1"
                          value={productSettings[product.id]?.threshold !== undefined 
                            ? productSettings[product.id].threshold 
                            : ''}
                          onChange={(e) => handleProductSettingChange(
                            product.id, 
                            'threshold', 
                            e.target.value === '' ? undefined : parseInt(e.target.value)
                          )}
                          placeholder={`Global (${globalSettings.threshold})`}
                        />
                      </div>
                      
                      {productSettings[product.id] && (
                        <button 
                          className="btn-reset" 
                          onClick={() => handleResetProductSettings(product.id)}
                        >
                          Resetar para global
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="low-stock-summary">
        <h3>Produtos com Estoque Baixo</h3>
        
        {lowStockProducts.length === 0 ? (
          <div className="empty-state success">
            Nenhum produto com estoque baixo no momento. Parabéns!
          </div>
        ) : (
          <div className="low-stock-list">
            <p className="warning-text">
              {lowStockProducts.length} produto(s) com estoque abaixo do limite configurado:
            </p>
            <ul>
              {lowStockProducts.map(product => (
                <li key={product.id}>
                  <span className="product-title">{product.title}</span>
                  <span className="product-stock">
                    <strong>{product.stock.available}</strong> disponíveis
                    (limite: {getProductThreshold(product.id)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="form-actions">
        <button 
          className="btn-primary" 
          onClick={handleSaveSettings}
        >
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default AlertSettingsPage;
