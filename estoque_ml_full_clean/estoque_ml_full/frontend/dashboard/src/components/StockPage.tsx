import React, { useState, useEffect } from 'react';
import { getProducts, syncStock } from '../services/api';
import '../App.css';
import { exportStockToPDF } from '../utils/pdfExport';
import { exportStockToExcel } from '../utils/excelExport';

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

const StockPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingStock, setSyncingStock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'available' | 'total' | 'not_available'>('available');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterLowStock, setFilterLowStock] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Não foi possível carregar os dados de estoque. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const handleSyncStock = async () => {
    try {
      setSyncingStock(true);
      const result = await syncStock();
      alert(`Estoque atualizado para ${result.updated_products} produtos!`);
      fetchProducts(); // Recarregar produtos após sincronização
    } catch (err) {
      console.error('Erro ao sincronizar estoque:', err);
      setError('Não foi possível sincronizar o estoque. Tente novamente mais tarde.');
      setSyncingStock(false);
    }
  };

  const handleSort = (field: 'available' | 'total' | 'not_available') => {
    if (field === sortField) {
      // Se já estiver ordenando por este campo, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Caso contrário, ordena por este campo em ordem descendente (mais estoque primeiro)
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredProducts = [...products]
    .filter(product => 
      (product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       product.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!filterLowStock || product.stock.available < 5)
    )
    .sort((a, b) => {
      const valueA = a.stock[sortField];
      const valueB = b.stock[sortField];
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const getSortIcon = (field: 'available' | 'total' | 'not_available') => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const handleExportPDF = () => {
    exportStockToPDF(filteredProducts, 'Relatório de Estoque');
  };

  const handleExportExcel = () => {
    exportStockToExcel(filteredProducts);
  };

  if (loading) return <div className="loading">Carregando dados de estoque...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="stock-page">
      <div className="page-header">
        <h2>Gestão de Estoque</h2>
        <button 
          className="btn-primary" 
          onClick={handleSyncStock} 
          disabled={syncingStock}
        >
          {syncingStock ? 'Sincronizando...' : 'Sincronizar Estoque'}
        </button>
      </div>
      
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por título ou SKU"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <label>
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
            />
            Mostrar apenas produtos com estoque baixo
          </label>
        </div>
        
        <div className="export-buttons">
          <button className="btn-secondary" onClick={handleExportPDF}>Exportar PDF</button>
          <button className="btn-secondary" onClick={handleExportExcel}>Exportar Excel</button>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="empty-state">Nenhum produto encontrado com os filtros atuais.</div>
      ) : (
        <div className="stock-table-container">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th onClick={() => handleSort('available')} className="sortable">
                  Disponível {getSortIcon('available')}
                </th>
                <th onClick={() => handleSort('not_available')} className="sortable">
                  Não Disponível {getSortIcon('not_available')}
                </th>
                <th onClick={() => handleSort('total')} className="sortable">
                  Total {getSortIcon('total')}
                </th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className={product.stock.available < 5 ? 'low-stock' : ''}>
                  <td>{product.title}</td>
                  <td>{product.sku}</td>
                  <td>{product.stock.available}</td>
                  <td>{product.stock.not_available}</td>
                  <td>{product.stock.total}</td>
                  <td>{formatDate(product.stock.last_updated)}</td>
                  <td>
                    <button className="btn-action">Histórico</button>
                    <button className="btn-action">Ajustar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="stock-summary">
        <div className="summary-card">
          <h3>Resumo do Estoque</h3>
          <p>Total de produtos: <strong>{products.length}</strong></p>
          <p>Produtos com estoque baixo: <strong>{products.filter(p => p.stock.available < 5).length}</strong></p>
          <p>Estoque total disponível: <strong>{products.reduce((sum, p) => sum + p.stock.available, 0)}</strong> unidades</p>
          <p>Estoque total não disponível: <strong>{products.reduce((sum, p) => sum + p.stock.not_available, 0)}</strong> unidades</p>
        </div>
        
        <div className="summary-card">
          <h3>Recomendações</h3>
          {products.filter(p => p.stock.available < 5).length > 0 ? (
            <>
              <p>Produtos que precisam de reposição:</p>
              <ul>
                {products
                  .filter(p => p.stock.available < 5)
                  .slice(0, 5)
                  .map(p => (
                    <li key={p.id}>
                      <strong>{p.title}</strong>: {p.stock.available} disponíveis
                    </li>
                  ))}
                {products.filter(p => p.stock.available < 5).length > 5 && (
                  <li>... e mais {products.filter(p => p.stock.available < 5).length - 5} produtos</li>
                )}
              </ul>
            </>
          ) : (
            <p>Todos os produtos têm níveis adequados de estoque.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockPage;
