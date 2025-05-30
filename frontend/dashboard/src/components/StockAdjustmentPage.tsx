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

interface AdjustmentFormData {
  product_id: number;
  adjustment_type: string;
  quantity: number;
  reason: string;
}

const StockAdjustmentPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<AdjustmentFormData>({
    product_id: 0,
    adjustment_type: 'entrada_manual',
    quantity: 1,
    reason: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      
      // Selecionar o primeiro produto por padrão se existir
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, product_id: data[0].id }));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Não foi possível carregar os produtos. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      // Garantir que a quantidade seja sempre um número positivo
      const numValue = Math.max(1, parseInt(value) || 1);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar mensagens anteriores
    setError(null);
    setSuccessMessage(null);
    
    // Validar formulário
    if (formData.product_id === 0) {
      setError('Selecione um produto para ajustar o estoque.');
      return;
    }
    
    if (formData.quantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }
    
    if (!formData.reason.trim()) {
      setError('Informe o motivo do ajuste de estoque.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Preparar dados para envio
      const adjustmentData = {
        ...formData,
        // Se for saída manual ou outros tipos de saída, converter para número negativo
        quantity: ['saida_manual', 'perda', 'dano'].includes(formData.adjustment_type) 
          ? -Math.abs(formData.quantity) 
          : Math.abs(formData.quantity)
      };
      
      // Enviar para a API
      const response = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adjustmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao realizar ajuste de estoque');
      }
      
      const result = await response.json();
      
      // Exibir mensagem de sucesso
      setSuccessMessage(`Ajuste de estoque realizado com sucesso! O estoque foi ${formData.quantity > 0 ? 'aumentado' : 'reduzido'} em ${Math.abs(formData.quantity)} unidades.`);
      
      // Resetar formulário
      setFormData({
        product_id: formData.product_id, // Manter o produto selecionado
        adjustment_type: 'entrada_manual',
        quantity: 1,
        reason: ''
      });
      
      // Atualizar lista de produtos para refletir o novo estoque
      fetchProducts();
      
    } catch (err) {
      console.error('Erro ao ajustar estoque:', err);
      setError(err instanceof Error ? err.message : 'Erro ao realizar ajuste de estoque. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedProduct = () => {
    return products.find(p => p.id === formData.product_id);
  };

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada_manual':
        return 'Entrada Manual';
      case 'saida_manual':
        return 'Saída Manual';
      case 'perda':
        return 'Perda';
      case 'dano':
        return 'Dano';
      default:
        return type;
    }
  };

  if (loading) return <div className="loading">Carregando produtos...</div>;
  if (error && !products.length) return <div className="error">{error}</div>;

  return (
    <div className="stock-adjustment-page">
      <h2>Ajuste Manual de Estoque</h2>
      
      <div className="adjustment-container">
        <div className="product-selection">
          <h3>Selecione o Produto</h3>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por título ou SKU"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="products-list">
            {filteredProducts.length === 0 ? (
              <div className="empty-state">Nenhum produto encontrado.</div>
            ) : (
              <ul>
                {filteredProducts.map(product => (
                  <li 
                    key={product.id} 
                    className={formData.product_id === product.id ? 'selected' : ''}
                    onClick={() => setFormData(prev => ({ ...prev, product_id: product.id }))}
                  >
                    <div className="product-info">
                      <span className="product-title">{product.title}</span>
                      <span className="product-sku">SKU: {product.sku}</span>
                    </div>
                    <div className="product-stock">
                      <span className={product.stock.available < 5 ? 'low-stock' : ''}>
                        {product.stock.available} disponíveis
                      </span>
                      <span className="total-stock">
                        {product.stock.total} total
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="adjustment-form">
          <h3>Detalhes do Ajuste</h3>
          
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
          
          <form onSubmit={handleSubmit}>
            <div className="selected-product-info">
              {getSelectedProduct() ? (
                <>
                  <h4>{getSelectedProduct()?.title}</h4>
                  <div className="stock-info">
                    <p>Estoque atual: <strong>{getSelectedProduct()?.stock.available}</strong> disponíveis de <strong>{getSelectedProduct()?.stock.total}</strong> total</p>
                  </div>
                </>
              ) : (
                <p>Selecione um produto na lista ao lado.</p>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="adjustment_type">Tipo de Ajuste:</label>
              <select
                id="adjustment_type"
                name="adjustment_type"
                value={formData.adjustment_type}
                onChange={handleInputChange}
                required
              >
                <option value="entrada_manual">Entrada Manual</option>
                <option value="saida_manual">Saída Manual</option>
                <option value="perda">Perda</option>
                <option value="dano">Dano</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantidade:</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
              <p className="help-text">
                {['saida_manual', 'perda', 'dano'].includes(formData.adjustment_type) 
                  ? 'Esta quantidade será subtraída do estoque.' 
                  : 'Esta quantidade será adicionada ao estoque.'}
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="reason">Motivo:</label>
              <textarea
                id="reason"
                name="reason"
                rows={4}
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Informe o motivo deste ajuste de estoque..."
                required
              />
            </div>
            
            <div className="adjustment-summary">
              <h4>Resumo do Ajuste</h4>
              <p>
                <strong>Tipo:</strong> {getAdjustmentTypeLabel(formData.adjustment_type)}
              </p>
              <p>
                <strong>Quantidade:</strong> {formData.quantity} unidades
              </p>
              <p>
                <strong>Estoque após ajuste:</strong> {
                  getSelectedProduct() 
                    ? ['saida_manual', 'perda', 'dano'].includes(formData.adjustment_type)
                      ? Math.max(0, (getSelectedProduct()?.stock.available || 0) - formData.quantity)
                      : (getSelectedProduct()?.stock.available || 0) + formData.quantity
                    : 'N/A'
                } unidades disponíveis
              </p>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting || !getSelectedProduct()}
              >
                {submitting ? 'Processando...' : 'Confirmar Ajuste'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustmentPage;
