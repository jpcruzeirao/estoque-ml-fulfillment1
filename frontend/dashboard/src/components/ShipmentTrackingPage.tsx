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

interface Shipment {
  id: number;
  status: 'draft' | 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  estimated_delivery: string;
  tracking_number: string;
  destination_warehouse: string;
  notes: string;
  items: {
    product_id: number;
    product_title: string;
    quantity: number;
  }[];
}

const ShipmentTrackingPage: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      
      // Em uma implementação real, buscaríamos os envios do backend
      // Por enquanto, vamos gerar dados de exemplo
      
      const mockShipments: Shipment[] = [
        {
          id: 1001,
          status: 'in_transit',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 dias atrás
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 horas atrás
          estimated_delivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 dia depois
          tracking_number: 'MLSHIP123456',
          destination_warehouse: 'CD São Paulo - Vila Guilherme',
          notes: 'Reposição de produtos com estoque baixo',
          items: [
            { product_id: 1, product_title: 'Smartphone Galaxy A54', quantity: 10 },
            { product_id: 4, product_title: 'Fone de Ouvido JBL', quantity: 15 }
          ]
        },
        {
          id: 1002,
          status: 'delivered',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 dias atrás
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 dias atrás
          estimated_delivery: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 dias atrás
          tracking_number: 'MLSHIP789012',
          destination_warehouse: 'CD Cajamar',
          notes: 'Envio mensal programado',
          items: [
            { product_id: 2, product_title: 'Notebook Dell Inspiron', quantity: 5 },
            { product_id: 3, product_title: 'Smart TV LG 50"', quantity: 3 },
            { product_id: 5, product_title: 'Câmera Canon EOS', quantity: 8 }
          ]
        },
        {
          id: 1003,
          status: 'pending',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 horas atrás
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 horas atrás
          estimated_delivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 dias depois
          tracking_number: 'MLSHIP345678',
          destination_warehouse: 'CD Rio de Janeiro',
          notes: 'Produtos para campanha promocional',
          items: [
            { product_id: 1, product_title: 'Smartphone Galaxy A54', quantity: 20 },
            { product_id: 4, product_title: 'Fone de Ouvido JBL', quantity: 30 }
          ]
        },
        {
          id: 1004,
          status: 'draft',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
          updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
          estimated_delivery: '',
          tracking_number: '',
          destination_warehouse: 'CD Extrema',
          notes: 'Rascunho - Reposição programada',
          items: [
            { product_id: 2, product_title: 'Notebook Dell Inspiron', quantity: 8 },
            { product_id: 5, product_title: 'Câmera Canon EOS', quantity: 12 }
          ]
        }
      ];
      
      setShipments(mockShipments);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar envios:', err);
      setError('Não foi possível carregar os envios. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
  };

  const handleCloseDetails = () => {
    setSelectedShipment(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'pending':
        return 'Pendente';
      case 'in_transit':
        return 'Em Trânsito';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'status-draft';
      case 'pending':
        return 'status-pending';
      case 'in_transit':
        return 'status-in-transit';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getTotalItems = (shipment: Shipment) => {
    return shipment.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const filteredShipments = statusFilter === 'all' 
    ? shipments 
    : shipments.filter(shipment => shipment.status === statusFilter);

  if (loading) return <div className="loading">Carregando envios...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="shipment-tracking-page">
      <h2>Acompanhamento de Envios</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="draft">Rascunho</option>
            <option value="pending">Pendente</option>
            <option value="in_transit">Em Trânsito</option>
            <option value="delivered">Entregue</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        
        <button className="btn-primary" onClick={() => window.location.href = '/shipment/new'}>
          Novo Envio
        </button>
      </div>
      
      {filteredShipments.length === 0 ? (
        <div className="empty-state">Nenhum envio encontrado com os filtros selecionados.</div>
      ) : (
        <div className="shipments-table-container">
          <table className="shipments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Data de Criação</th>
                <th>Destino</th>
                <th>Rastreamento</th>
                <th>Produtos</th>
                <th>Entrega Estimada</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map(shipment => (
                <tr key={shipment.id}>
                  <td>#{shipment.id}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(shipment.status)}`}>
                      {getStatusLabel(shipment.status)}
                    </span>
                  </td>
                  <td>{formatDate(shipment.created_at)}</td>
                  <td>{shipment.destination_warehouse}</td>
                  <td>{shipment.tracking_number || 'N/A'}</td>
                  <td>{shipment.items.length} produtos ({getTotalItems(shipment)} itens)</td>
                  <td>{shipment.estimated_delivery ? formatDate(shipment.estimated_delivery) : 'N/A'}</td>
                  <td>
                    <button 
                      className="btn-action"
                      onClick={() => handleViewDetails(shipment)}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedShipment && (
        <div className="shipment-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Detalhes do Envio #{selectedShipment.id}</h3>
              <button className="btn-close" onClick={handleCloseDetails}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="shipment-info">
                <div className="info-group">
                  <h4>Informações Gerais</h4>
                  <p><strong>Status:</strong> <span className={`status-badge ${getStatusClass(selectedShipment.status)}`}>{getStatusLabel(selectedShipment.status)}</span></p>
                  <p><strong>Criado em:</strong> {formatDate(selectedShipment.created_at)}</p>
                  <p><strong>Última atualização:</strong> {formatDate(selectedShipment.updated_at)}</p>
                  <p><strong>Entrega estimada:</strong> {selectedShipment.estimated_delivery ? formatDate(selectedShipment.estimated_delivery) : 'N/A'}</p>
                </div>
                
                <div className="info-group">
                  <h4>Destino e Rastreamento</h4>
                  <p><strong>Centro de Distribuição:</strong> {selectedShipment.destination_warehouse}</p>
                  <p><strong>Número de rastreamento:</strong> {selectedShipment.tracking_number || 'N/A'}</p>
                  {selectedShipment.tracking_number && (
                    <a 
                      href={`https://www.mercadolivre.com.br/envios/tracking/${selectedShipment.tracking_number}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="tracking-link"
                    >
                      Acompanhar no Mercado Livre
                    </a>
                  )}
                </div>
                
                {selectedShipment.notes && (
                  <div className="info-group">
                    <h4>Observações</h4>
                    <p>{selectedShipment.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="shipment-items">
                <h4>Produtos no Envio</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedShipment.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_title}</td>
                        <td>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td><strong>{getTotalItems(selectedShipment)}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="shipment-timeline">
                <h4>Linha do Tempo</h4>
                <ul className="timeline">
                  <li className={`timeline-item ${selectedShipment.status !== 'cancelled' ? 'completed' : 'cancelled'}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h5>Criado</h5>
                      <p>{formatDate(selectedShipment.created_at)}</p>
                    </div>
                  </li>
                  
                  <li className={`timeline-item ${['pending', 'in_transit', 'delivered'].includes(selectedShipment.status) ? 'completed' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h5>Pendente</h5>
                      <p>{selectedShipment.status === 'draft' ? 'Aguardando confirmação' : 'Processado'}</p>
                    </div>
                  </li>
                  
                  <li className={`timeline-item ${['in_transit', 'delivered'].includes(selectedShipment.status) ? 'completed' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h5>Em Trânsito</h5>
                      <p>{selectedShipment.status === 'in_transit' ? 'Em rota de entrega' : selectedShipment.status === 'delivered' ? 'Concluído' : 'Aguardando'}</p>
                    </div>
                  </li>
                  
                  <li className={`timeline-item ${selectedShipment.status === 'delivered' ? 'completed' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h5>Entregue</h5>
                      <p>{selectedShipment.status === 'delivered' ? formatDate(selectedShipment.updated_at) : 'Pendente'}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="modal-footer">
              {selectedShipment.status === 'draft' && (
                <>
                  <button className="btn-secondary">Editar</button>
                  <button className="btn-primary">Confirmar Envio</button>
                </>
              )}
              {selectedShipment.status === 'pending' && (
                <button className="btn-secondary">Cancelar Envio</button>
              )}
              <button className="btn-secondary" onClick={handleCloseDetails}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentTrackingPage;
