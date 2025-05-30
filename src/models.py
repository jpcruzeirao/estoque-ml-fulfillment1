# -*- coding: utf-8 -*-
"""Define os modelos de dados (tabelas do banco de dados) para a aplicação usando SQLAlchemy."""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Inicializa a extensão SQLAlchemy (será vinculada ao app Flask em main.py)
db = SQLAlchemy()

class User(db.Model):
    """Modelo para usuários do sistema."""
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    # Adicionar campos para senha (hashed), email, etc. posteriormente
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos (se necessário)
    api_credentials = db.relationship('ApiCredentials', backref='user', uselist=False, lazy=True)
    products = db.relationship('Product', backref='user', lazy=True)

class ApiCredentials(db.Model):
    """Modelo para armazenar credenciais da API do Mercado Livre."""
    __tablename__ = 'api_credentials'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    access_token = db.Column(db.String(255), nullable=False)
    refresh_token = db.Column(db.String(255), nullable=False)
    expires_in = db.Column(db.Integer, nullable=False)
    last_refresh_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class Product(db.Model):
    """Modelo para mapear produtos do sistema com os do Mercado Livre."""
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sku = db.Column(db.String(100), nullable=False) # SKU interno
    ml_item_id = db.Column(db.String(50), nullable=False, index=True) # ID do anúncio ML
    ml_inventory_id = db.Column(db.String(50), nullable=True, index=True) # ID de inventário Full (pode ser nulo)
    title = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    stock_levels = db.relationship('StockLevel', backref='product', lazy=True)
    sales = db.relationship('Sale', backref='product', lazy=True)
    adjustments = db.relationship('StockAdjustment', backref='product', lazy=True)

    # Garante que a combinação user_id e ml_item_id seja única
    __table_args__ = (db.UniqueConstraint('user_id', 'ml_item_id', name='_user_item_uc'),)

class StockLevel(db.Model):
    """Modelo para armazenar histórico de níveis de estoque do Fulfillment."""
    __tablename__ = 'stock_levels'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    total_quantity = db.Column(db.Integer, nullable=False)
    available_quantity = db.Column(db.Integer, nullable=False)
    not_available_quantity = db.Column(db.Integer, nullable=False)
    # Poderíamos adicionar uma coluna JSON para 'not_available_detail' se necessário
    # not_available_detail = db.Column(db.JSON, nullable=True)

class Sale(db.Model):
    """Modelo para registrar histórico de vendas."""
    __tablename__ = 'sales'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    ml_order_id = db.Column(db.String(50), nullable=False, index=True)
    quantity_sold = db.Column(db.Integer, nullable=False)
    sale_timestamp = db.Column(db.DateTime, nullable=False, index=True)
    # Adicionar preço, status do envio, etc. se necessário

class StockAdjustment(db.Model):
    """Modelo para registrar ajustes manuais de estoque."""
    __tablename__ = 'stock_adjustments'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    adjustment_type = db.Column(db.String(50), nullable=False) # Ex: 'entrada_manual', 'saida_manual', 'perda', 'dano'
    quantity = db.Column(db.Integer, nullable=False) # Positivo para entrada, negativo para saída
    reason = db.Column(db.Text, nullable=True)
    adjustment_timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

