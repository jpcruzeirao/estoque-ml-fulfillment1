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

interface ShipmentItem {
  product_id: number;
  quantity: number;
}

interface Shipment {
  id?: number;
  status: 'draft' | 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  estimated_delivery?: string;
  tracking_number?: string;
  items: ShipmentItem[];
  destination_warehouse: string;
  notes: string;
}

const ShipmentPlanningPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [shipment, setShipment] = useState<Shipment>({
    status: 'draft',
    items: [],
    destination_warehouse: '',
    notes: ''
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([
    'CD São Paulo - Vila Guilherme',
    'CD Cajamar',
    'CD Rio de Janeiro',
    'CD Extrema',
    'CD Recife'
  ]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Identificar produtos com estoque baixo (menos de 5 unidades)
    if (products.length > 0) {
      const lowStock = products.filter(product => product.stock.available < 5);
      setLowStockProducts(lowStock);
    }
  }, [products]);

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

  const handleAddProduct = (productId: number) => {
    // Verificar se o produto já está no envio
    const existingItem = shipment.items.find(item => item.product_id === productId);
    
    if (existingItem) {
      // Se já existe, incrementar a quantidade
      setShipment(prev => ({
        ...prev,
        items: prev.items.map(item => 
          item.product_id === productId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      }));
    } else {
      // Se não existe, adicionar novo item
      setShipment(prev => ({
        ...prev,
        items: [...prev.items, { product_id: productId, quantity: 1 }]
      }));
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setShipment(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product_id !== productId)
    }));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    
    setShipment(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.product_id === productId 
          ? { ...item, quantity } 
          : item
      )
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShipment(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpar mensagens anteriores
    setError(null);
    setSuccessMessage(null);
    
    // Validar formulário
    if (shipment.items.length === 0) {
      setError('Adicione pelo menos um produto ao envio.');
      return;
    }
    
    if (!shipment.destination_warehouse) {
      setError('Selecione o centro de distribuição de destino.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Em uma implementação real, enviaríamos os dados para o backend
      // Por enquanto, apenas simular o envio
      
      // Simular atraso de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular resposta de sucesso
      const mockResponse = {
        id: Math.floor(Math.random() * 10000),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        estimated_delivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 dias depois
        tracking_number: `MLSHIP${Math.floor(Math.random() * 1000000)}`,
        ...shipment
      };
      
      // Exibir mensagem de sucesso
      setSuccessMessage(`Envio #${mockResponse.id} criado com sucesso! Número de rastreamento: ${mockResponse.tracking_number}`);
      
      // Resetar formulário
      setShipment({
        status: 'draft',
        items: [],
        destination_warehouse: '',
        notes: ''
      });
      
      // Atualizar lista de produtos para refletir o novo estoque
      fetchProducts();
      
    } catch (err) {
      console.error('Erro ao criar envio:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar envio. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const getProductById = (productId: number) => {
    return products.find(p => p.id === productId);
  };

  const getTotalItems = () => {
    return shipment.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Carregando produtos...</div>;
  if (error && !products.length) return <div className="error">{error}</div>;

  return (
    <div className="shipment-planning-page">
      <h2>Planejamento de Envios para o Fulfillment</h2>
      
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
      
      <div className="shipment-container">
        <div className="product-selection">
          <h3>Selecione os Produtos</h3>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por título ou SKU"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {lowStockProducts.length > 0 && (
            <div className="low-stock-recommendations">
              <h4>Produtos Recomendados (Estoque Baixo)</h4>
              <ul>
                {lowStockProducts.map(product => (
                  <li key={`low-${product.id}`}>
                    <div className="product-info">
                      <span className="product-title">{product.title}</span>
                      <span className="product-stock low-stock">
                        {product.stock.available} disponíveis
                      </span>
                    </div>
                    <button 
                      className="btn-add"
                      onClick={() => handleAddProduct(product.id)}
                    >
                      Adicionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="all-products">
            <h4>Todos os Produtos</h4>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">Nenhum produto encontrado.</div>
            ) : (
              <ul>
                {filteredProducts.map(product => (
                  <li key={product.id}>
                    <div className="product-info">
                      <span className="product-title">{product.title}</span>
                      <span className="product-sku">SKU: {product.sku}</span>
                      <span className={`product-stock ${product.stock.available < 5 ? 'low-stock' : ''}`}>
                        {product.stock.available} disponíveis
                      </span>
                    </div>
                    <button 
                      className="btn-add"
                      onClick={() => handleAddProduct(product.id)}
                    >
                      Adicionar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="shipment-form">
          <h3>Detalhes do Envio</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="destination_warehouse">Centro de Distribuição:</label>
              <select
                id="destination_warehouse"
                name="destination_warehouse"
                value={shipment.destination_warehouse}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione um CD</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse} value={warehouse}>
                    {warehouse}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Observações:</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={shipment.notes}
                onChange={handleInputChange}
                placeholder="Informações adicionais sobre o envio..."
              />
            </div>
            
            <div className="selected-products">
              <h4>Produtos Selecionados</h4>
              {shipment.items.length === 0 ? (
                <div className="empty-state">Nenhum produto selecionado.</div>
              ) : (
                <ul>
                  {shipment.items.map(item => {
                    const product = getProductById(item.product_id);
                    return product ? (
                      <li key={`selected-${item.product_id}`}>
                        <div className="product-info">
                          <span className="product-title">{product.title}</span>
                          <span className="product-sku">SKU: {product.sku}</span>
                        </div>
                        <div className="quantity-control">
                          <button 
                            type="button"
                            className="btn-quantity"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 0)}
                          />
                          <button 
                            type="button"
                            className="btn-quantity"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <button 
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveProduct(item.product_id)}
                        >
                          Remover
                        </button>
                      </li>
                    ) : null;
                  })}
                </ul>
              )}
            </div>
            
            <div className="shipment-summary">
              <h4>Resumo do Envio</h4>
              <p>
                <strong>Total de produtos:</strong> {shipment.items.length}
              </p>
              <p>
                <strong>Total de itens:</strong> {getTotalItems()}
              </p>
              <p>
                <strong>Destino:</strong> {shipment.destination_warehouse || 'Não selecionado'}
              </p>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting || shipment.items.length === 0}
              >
                {submitting ? 'Processando...' : 'Criar Envio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShipmentPlanningPage;
