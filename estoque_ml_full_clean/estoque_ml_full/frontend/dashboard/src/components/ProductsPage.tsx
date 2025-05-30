import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import '../App.css';
import { exportProductsToPDF } from '../utils/pdfExport';
import { exportProductsToExcel } from '../utils/excelExport';

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

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Product | 'stock.available'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
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

    fetchProducts();
  }, []);

  const handleSort = (field: keyof Product | 'stock.available') => {
    if (field === sortField) {
      // Se já estiver ordenando por este campo, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Caso contrário, ordena por este campo em ordem ascendente
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let valueA, valueB;

    if (sortField === 'stock.available') {
      valueA = a.stock.available;
      valueB = b.stock.available;
    } else {
      valueA = a[sortField];
      valueB = b[sortField];
    }

    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredProducts = sortedProducts.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.ml_item_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortIcon = (field: keyof Product | 'stock.available') => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleExportPDF = () => {
    exportProductsToPDF(filteredProducts, 'Relatório de Produtos');
  };

  const handleExportExcel = () => {
    exportProductsToExcel(filteredProducts);
  };

  if (loading) return <div className="loading">Carregando produtos...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="products-page">
      <h2>Produtos no Fulfillment</h2>
      
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por título, SKU ou ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="export-buttons">
          <button className="btn-secondary" onClick={handleExportPDF}>Exportar PDF</button>
          <button className="btn-secondary" onClick={handleExportExcel}>Exportar Excel</button>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="empty-state">Nenhum produto encontrado.</div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>
                  ID {getSortIcon('id')}
                </th>
                <th onClick={() => handleSort('title')}>
                  Título {getSortIcon('title')}
                </th>
                <th onClick={() => handleSort('sku')}>
                  SKU {getSortIcon('sku')}
                </th>
                <th onClick={() => handleSort('ml_item_id')}>
                  ID Mercado Livre {getSortIcon('ml_item_id')}
                </th>
                <th onClick={() => handleSort('stock.available')}>
                  Estoque Disponível {getSortIcon('stock.available')}
                </th>
                <th>Estoque Total</th>
                <th>Última Atualização</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className={product.stock.available < 5 ? 'low-stock' : ''}>
                  <td>{product.id}</td>
                  <td>{product.title}</td>
                  <td>{product.sku}</td>
                  <td>
                    <a 
                      href={`https://www.mercadolivre.com.br/item/${product.ml_item_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {product.ml_item_id}
                    </a>
                  </td>
                  <td>{product.stock.available}</td>
                  <td>{product.stock.total}</td>
                  <td>
                    {product.stock.last_updated 
                      ? new Date(product.stock.last_updated).toLocaleString('pt-BR')
                      : 'Nunca'}
                  </td>
                  <td>
                    <button className="btn-action">Detalhes</button>
                    <button className="btn-action">Histórico</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="summary">
        <p>Total de produtos: <strong>{products.length}</strong></p>
        <p>Produtos com estoque baixo: <strong>{products.filter(p => p.stock.available < 5).length}</strong></p>
        <p>Estoque total disponível: <strong>{products.reduce((sum, p) => sum + p.stock.available, 0)}</strong></p>
      </div>
    </div>
  );
};

export default ProductsPage;
