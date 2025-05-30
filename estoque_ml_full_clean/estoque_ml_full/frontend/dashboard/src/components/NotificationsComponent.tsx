import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import '../App.css';

interface Notification {
  id: number;
  type: 'low_stock' | 'stock_change' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  product_id?: number;
  product_title?: string;
}

const NotificationsComponent: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Calcular contagem de não lidas
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Em uma implementação real, buscaríamos as notificações do backend
      // Por enquanto, vamos gerar dados de exemplo
      
      const mockNotifications: Notification[] = [
        {
          id: 1,
          type: 'low_stock',
          title: 'Estoque Baixo',
          message: 'Smartphone Galaxy A54 está com apenas 2 unidades disponíveis.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
          read: false,
          product_id: 1,
          product_title: 'Smartphone Galaxy A54'
        },
        {
          id: 2,
          type: 'low_stock',
          title: 'Estoque Baixo',
          message: 'Fone de Ouvido JBL está com apenas 3 unidades disponíveis.',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 horas atrás
          read: false,
          product_id: 4,
          product_title: 'Fone de Ouvido JBL'
        },
        {
          id: 3,
          type: 'stock_change',
          title: 'Estoque Atualizado',
          message: 'Estoque de Notebook Dell Inspiron foi atualizado para 15 unidades.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 horas atrás
          read: true,
          product_id: 2,
          product_title: 'Notebook Dell Inspiron'
        },
        {
          id: 4,
          type: 'system',
          title: 'Sincronização Concluída',
          message: 'Sincronização com Mercado Livre concluída com sucesso.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 horas atrás
          read: true
        },
        {
          id: 5,
          type: 'low_stock',
          title: 'Estoque Crítico',
          message: 'Câmera Canon EOS está com estoque zerado!',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 minutos atrás
          read: false,
          product_id: 5,
          product_title: 'Câmera Canon EOS'
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError('Não foi possível carregar as notificações. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} min atrás`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else {
      return date.toLocaleString('pt-BR');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return '⚠️';
      case 'stock_change':
        return '📦';
      case 'system':
        return '🔔';
      default:
        return '📝';
    }
  };

  return (
    <div className="notifications-component">
      <div className="notifications-icon" onClick={handleToggleNotifications}>
        <span className="icon">🔔</span>
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </div>
      
      {showNotifications && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notificações</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={handleMarkAllAsRead}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {loading ? (
              <div className="loading">Carregando notificações...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">Nenhuma notificação para exibir.</div>
            ) : (
              <ul>
                {notifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <span className="notification-title">{notification.title}</span>
                        <span className="notification-time">{formatDate(notification.timestamp)}</span>
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      {notification.product_title && (
                        <div className="notification-product">
                          Produto: {notification.product_title}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="notifications-footer">
            <button className="view-all">Ver todas as notificações</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsComponent;
