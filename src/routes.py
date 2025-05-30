# -*- coding: utf-8 -*-
"""Rotas da aplicação Flask para autenticação e API."""

from flask import Blueprint, request, redirect, url_for, jsonify, session, current_app
from .models import db, User, ApiCredentials, Product, StockLevel, Sale, StockAdjustment
from .ml_api import MercadoLivreAPI
import os
from datetime import datetime, timedelta
from sqlalchemy import func

# Criar Blueprint para as rotas de autenticação e API
auth_bp = Blueprint('auth', __name__)
api_bp = Blueprint('api', __name__)

# Instância da API do Mercado Livre
def get_ml_api():
    """Retorna uma instância configurada da API do Mercado Livre."""
    return MercadoLivreAPI(
        app_id=current_app.config.get('ML_APP_ID'),
        client_secret=current_app.config.get('ML_SECRET_KEY'),
        redirect_uri=current_app.config.get('ML_REDIRECT_URI')
    )

@auth_bp.route('/login')
def login():
    """Inicia o fluxo de autenticação com o Mercado Livre."""
    ml_api = get_ml_api()
    auth_url = ml_api.get_auth_url()
    return jsonify({"auth_url": auth_url})

@auth_bp.route('/callback')
def callback():
    """Callback para receber o código de autorização do Mercado Livre."""
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "Código de autorização não fornecido"}), 400
    
    try:
        ml_api = get_ml_api()
        token_data = ml_api.exchange_code_for_token(code)
        
        # Obter informações do usuário
        ml_api.access_token = token_data["access_token"]
        user_info = ml_api.get_user_info()
        
        # Verificar se o usuário já existe
        user = User.query.filter_by(username=user_info["nickname"]).first()
        if not user:
            # Criar novo usuário
            user = User(username=user_info["nickname"])
            db.session.add(user)
            db.session.flush()  # Para obter o ID do usuário
        
        # Atualizar ou criar credenciais
        credentials = ApiCredentials.query.filter_by(user_id=user.id).first()
        if not credentials:
            credentials = ApiCredentials(user_id=user.id)
        
        credentials.access_token = token_data["access_token"]
        credentials.refresh_token = token_data["refresh_token"]
        credentials.expires_in = token_data["expires_in"]
        credentials.last_refresh_time = datetime.utcnow()
        
        db.session.add(credentials)
        db.session.commit()
        
        # Armazenar ID do usuário na sessão
        session['user_id'] = user.id
        
        # Redirecionar para o frontend
        return redirect('/dashboard')
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/user')
def get_user():
    """Retorna informações do usuário autenticado."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuário não encontrado"}), 404
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "created_at": user.created_at.isoformat()
    })

@api_bp.route('/products')
def get_products():
    """Retorna os produtos do usuário."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    products = Product.query.filter_by(user_id=user_id).all()
    result = []
    
    for product in products:
        # Obter o último nível de estoque
        last_stock = StockLevel.query.filter_by(product_id=product.id).order_by(StockLevel.timestamp.desc()).first()
        
        product_data = {
            "id": product.id,
            "sku": product.sku,
            "ml_item_id": product.ml_item_id,
            "ml_inventory_id": product.ml_inventory_id,
            "title": product.title,
            "created_at": product.created_at.isoformat(),
            "stock": {
                "total": last_stock.total_quantity if last_stock else 0,
                "available": last_stock.available_quantity if last_stock else 0,
                "not_available": last_stock.not_available_quantity if last_stock else 0,
                "last_updated": last_stock.timestamp.isoformat() if last_stock else None
            }
        }
        result.append(product_data)
    
    return jsonify(result)

@api_bp.route('/sync/products')
def sync_products():
    """Sincroniza os produtos do usuário com o Mercado Livre."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    credentials = ApiCredentials.query.filter_by(user_id=user_id).first()
    if not credentials:
        return jsonify({"error": "Credenciais não encontradas"}), 404
    
    try:
        ml_api = get_ml_api()
        ml_api.access_token = credentials.access_token
        ml_api.refresh_token = credentials.refresh_token
        
        # Obter informações do usuário
        user_info = ml_api.get_user_info()
        ml_user_id = user_info["id"]
        
        # Obter itens do usuário
        items_result = ml_api.get_user_items(ml_user_id)
        
        new_count = 0
        updated_count = 0
        
        for item_id in items_result.get("results", []):
            # Obter detalhes do item
            item_details = ml_api.get_item_details(item_id)
            
            # Verificar se o item já existe
            product = Product.query.filter_by(user_id=user_id, ml_item_id=item_id).first()
            
            if not product:
                # Criar novo produto
                product = Product(
                    user_id=user_id,
                    sku=item_details.get("seller_custom_field", ""),
                    ml_item_id=item_id,
                    ml_inventory_id=item_details.get("inventory_id"),
                    title=item_details.get("title", "")
                )
                db.session.add(product)
                new_count += 1
            else:
                # Atualizar produto existente
                product.ml_inventory_id = item_details.get("inventory_id")
                product.title = item_details.get("title", "")
                if not product.sku and item_details.get("seller_custom_field"):
                    product.sku = item_details.get("seller_custom_field", "")
                db.session.add(product)
                updated_count += 1
            
            # Se o produto tem inventory_id, sincronizar estoque
            if product.ml_inventory_id:
                try:
                    stock_data = ml_api.get_fulfillment_stock(product.ml_inventory_id)
                    
                    # Registrar nível de estoque
                    stock_level = StockLevel(
                        product_id=product.id,
                        total_quantity=stock_data.get("total", 0),
                        available_quantity=stock_data.get("available_quantity", 0),
                        not_available_quantity=stock_data.get("not_available_quantity", 0)
                    )
                    db.session.add(stock_level)
                except Exception as e:
                    # Continuar mesmo se houver erro em um item específico
                    print(f"Erro ao sincronizar estoque do produto {item_id}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "new_products": new_count,
            "updated_products": updated_count
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/sync/stock')
def sync_stock():
    """Sincroniza o estoque dos produtos com o Mercado Livre."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    credentials = ApiCredentials.query.filter_by(user_id=user_id).first()
    if not credentials:
        return jsonify({"error": "Credenciais não encontradas"}), 404
    
    try:
        ml_api = get_ml_api()
        ml_api.access_token = credentials.access_token
        ml_api.refresh_token = credentials.refresh_token
        
        # Obter produtos com inventory_id
        products = Product.query.filter(
            Product.user_id == user_id,
            Product.ml_inventory_id.isnot(None)
        ).all()
        
        updated_count = 0
        
        for product in products:
            try:
                stock_data = ml_api.get_fulfillment_stock(product.ml_inventory_id)
                
                # Registrar nível de estoque
                stock_level = StockLevel(
                    product_id=product.id,
                    total_quantity=stock_data.get("total", 0),
                    available_quantity=stock_data.get("available_quantity", 0),
                    not_available_quantity=stock_data.get("not_available_quantity", 0)
                )
                db.session.add(stock_level)
                updated_count += 1
            except Exception as e:
                # Continuar mesmo se houver erro em um item específico
                print(f"Erro ao sincronizar estoque do produto {product.ml_item_id}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "updated_products": updated_count
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/stats')
def get_stats():
    """Retorna estatísticas para o dashboard."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    # Contar produtos
    product_count = Product.query.filter_by(user_id=user_id).count()
    
    # Calcular estoque disponível total
    available_stock = db.session.query(db.func.sum(StockLevel.available_quantity)).join(
        Product, Product.id == StockLevel.product_id
    ).filter(
        Product.user_id == user_id
    ).group_by(
        StockLevel.product_id
    ).all()
    
    total_available = sum([stock[0] for stock in available_stock]) if available_stock else 0
    
    # Contar vendas do mês atual
    first_day_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    sales_count = db.session.query(db.func.sum(Sale.quantity_sold)).join(
        Product, Product.id == Sale.product_id
    ).filter(
        Product.user_id == user_id,
        Sale.sale_timestamp >= first_day_of_month
    ).scalar() or 0
    
    # Contar produtos com estoque baixo (menos de 5 unidades disponíveis)
    low_stock_products = db.session.query(Product).join(
        StockLevel, StockLevel.product_id == Product.id
    ).filter(
        Product.user_id == user_id,
        StockLevel.available_quantity < 5
    ).distinct().count()
    
    return jsonify({
        "product_count": product_count,
        "available_stock": total_available,
        "monthly_sales": sales_count,
        "low_stock_alerts": low_stock_products
    })

@api_bp.route('/charts/sales')
def get_sales_chart_data():
    """Retorna dados de vendas dos últimos 30 dias para gráficos."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    # Data de 30 dias atrás
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Buscar os 5 produtos mais vendidos nos últimos 30 dias
    top_products = db.session.query(
        Product.id,
        Product.title,
        func.sum(Sale.quantity_sold).label('total_sold')
    ).join(
        Sale, Sale.product_id == Product.id
    ).filter(
        Product.user_id == user_id,
        Sale.sale_timestamp >= thirty_days_ago
    ).group_by(
        Product.id
    ).order_by(
        func.sum(Sale.quantity_sold).desc()
    ).limit(5).all()
    
    result = []
    
    for product_id, title, total_sold in top_products:
        # Buscar vendas diárias para este produto
        daily_sales = db.session.query(
            func.date(Sale.sale_timestamp).label('date'),
            func.sum(Sale.quantity_sold).label('quantity')
        ).filter(
            Sale.product_id == product_id,
            Sale.sale_timestamp >= thirty_days_ago
        ).group_by(
            func.date(Sale.sale_timestamp)
        ).all()
        
        # Criar dicionário com datas e quantidades
        sales_data = {
            'id': product_id,
            'title': title,
            'total_sold': total_sold,
            'daily_data': [
                {
                    'date': date.strftime('%Y-%m-%d'),
                    'quantity': quantity
                } for date, quantity in daily_sales
            ]
        }
        
        result.append(sales_data)
    
    # Se não houver dados reais, gerar dados de exemplo para visualização
    if not result:
        # Gerar dados de exemplo para demonstração
        example_products = [
            {"id": 1, "title": "Produto A"},
            {"id": 2, "title": "Produto B"},
            {"id": 3, "title": "Produto C"},
            {"id": 4, "title": "Produto D"},
            {"id": 5, "title": "Produto E"}
        ]
        
        import random
        from datetime import date, timedelta
        
        today = date.today()
        
        for product in example_products:
            total_sold = 0
            daily_data = []
            
            for i in range(30):
                day = today - timedelta(days=29-i)
                quantity = random.randint(0, 10)
                total_sold += quantity
                
                daily_data.append({
                    'date': day.strftime('%Y-%m-%d'),
                    'quantity': quantity
                })
            
            result.append({
                'id': product["id"],
                'title': product["title"],
                'total_sold': total_sold,
                'daily_data': daily_data
            })
    
    return jsonify(result)

@api_bp.route('/charts/stock')
def get_stock_chart_data():
    """Retorna dados históricos de estoque para gráficos."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    # Data de 30 dias atrás
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Buscar produtos com mais registros de estoque
    products_with_stock = db.session.query(
        Product.id,
        Product.title,
        func.count(StockLevel.id).label('stock_count')
    ).join(
        StockLevel, StockLevel.product_id == Product.id
    ).filter(
        Product.user_id == user_id,
        StockLevel.timestamp >= thirty_days_ago
    ).group_by(
        Product.id
    ).order_by(
        func.count(StockLevel.id).desc()
    ).limit(5).all()
    
    result = []
    
    for product_id, title, _ in products_with_stock:
        # Buscar níveis de estoque para este produto
        stock_levels = db.session.query(
            StockLevel.timestamp,
            StockLevel.available_quantity,
            StockLevel.total_quantity
        ).filter(
            StockLevel.product_id == product_id,
            StockLevel.timestamp >= thirty_days_ago
        ).order_by(
            StockLevel.timestamp
        ).all()
        
        # Criar dicionário com timestamps e quantidades
        stock_data = {
            'id': product_id,
            'title': title,
            'stock_history': [
                {
                    'date': timestamp.strftime('%Y-%m-%d'),
                    'available': available,
                    'total': total
                } for timestamp, available, total in stock_levels
            ]
        }
        
        result.append(stock_data)
    
    # Se não houver dados reais, gerar dados de exemplo para visualização
    if not result:
        # Gerar dados de exemplo para demonstração
        example_products = [
            {"id": 1, "title": "Produto A"},
            {"id": 2, "title": "Produto B"},
            {"id": 3, "title": "Produto C"},
            {"id": 4, "title": "Produto D"},
            {"id": 5, "title": "Produto E"}
        ]
        
        import random
        from datetime import date, timedelta
        
        today = date.today()
        
        for product in example_products:
            stock_history = []
            
            # Valor inicial de estoque
            total = random.randint(50, 100)
            available = int(total * 0.8)  # 80% disponível inicialmente
            
            for i in range(30):
                day = today - timedelta(days=29-i)
                
                # Simular variações de estoque
                if i > 0:
                    # Reduzir estoque disponível aleatoriamente (simulando vendas)
                    reduction = random.randint(0, 5)
                    available = max(0, available - reduction)
                    total = max(available, total - random.randint(0, 3))  # Às vezes reduz o total também
                
                stock_history.append({
                    'date': day.strftime('%Y-%m-%d'),
                    'available': available,
                    'total': total
                })
            
            result.append({
                'id': product["id"],
                'title': product["title"],
                'stock_history': stock_history
            })
    
    return jsonify(result)

@api_bp.route('/sales')
def get_sales():
    """Retorna o histórico de vendas."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    # Parâmetros de filtro
    days = request.args.get('days', default=30, type=int)
    
    # Data limite para o filtro
    date_limit = datetime.utcnow() - timedelta(days=days)
    
    # Buscar vendas
    sales_query = db.session.query(
        Sale.id,
        Sale.ml_order_id,
        Sale.quantity_sold,
        Sale.sale_timestamp,
        Product.id.label('product_id'),
        Product.title.label('product_title')
    ).join(
        Product, Product.id == Sale.product_id
    ).filter(
        Product.user_id == user_id,
        Sale.sale_timestamp >= date_limit
    ).order_by(
        Sale.sale_timestamp.desc()
    )
    
    # Executar a consulta
    sales = sales_query.all()
    
    # Formatar resultados
    result = []
    for sale in sales:
        result.append({
            'id': sale.id,
            'ml_order_id': sale.ml_order_id,
            'quantity_sold': sale.quantity_sold,
            'sale_timestamp': sale.sale_timestamp.isoformat(),
            'product_id': sale.product_id,
            'product_title': sale.product_title
        })
    
    # Se não houver dados reais, gerar dados de exemplo para visualização
    if not result:
        # Gerar dados de exemplo para demonstração
        import random
        
        products = Product.query.filter_by(user_id=user_id).all()
        
        # Se não houver produtos, usar produtos de exemplo
        if not products:
            example_products = [
                {"id": 1, "title": "Smartphone Galaxy A54"},
                {"id": 2, "title": "Notebook Dell Inspiron"},
                {"id": 3, "title": "Smart TV LG 50\""},
                {"id": 4, "title": "Fone de Ouvido JBL"},
                {"id": 5, "title": "Câmera Canon EOS"}
            ]
            
            for i in range(50):
                product = random.choice(example_products)
                sale_date = date_limit + timedelta(days=random.randint(0, days))
                
                result.append({
                    'id': i + 1,
                    'ml_order_id': f"ML{random.randint(10000000, 99999999)}",
                    'quantity_sold': random.randint(1, 3),
                    'sale_timestamp': sale_date.isoformat(),
                    'product_id': product["id"],
                    'product_title': product["title"]
                })
        else:
            for i in range(50):
                product = random.choice(products)
                sale_date = date_limit + timedelta(days=random.randint(0, days))
                
                result.append({
                    'id': i + 1,
                    'ml_order_id': f"ML{random.randint(10000000, 99999999)}",
                    'quantity_sold': random.randint(1, 3),
                    'sale_timestamp': sale_date.isoformat(),
                    'product_id': product.id,
                    'product_title': product.title
                })
    
    return jsonify(result)

@api_bp.route('/activities')
def get_activities():
    """Retorna o histórico de atividades (vendas, ajustes, sincronizações)."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    # Parâmetros de filtro
    days = request.args.get('days', default=30, type=int)
    activity_type = request.args.get('type', default='all')
    
    # Data limite para o filtro
    date_limit = datetime.utcnow() - timedelta(days=days)
    
    activities = []
    
    # Buscar vendas se o tipo for 'all' ou 'sale'
    if activity_type in ['all', 'sale']:
        sales = db.session.query(
            Sale.id,
            Sale.ml_order_id,
            Sale.quantity_sold,
            Sale.sale_timestamp,
            Product.id.label('product_id'),
            Product.title.label('product_title')
        ).join(
            Product, Product.id == Sale.product_id
        ).filter(
            Product.user_id == user_id,
            Sale.sale_timestamp >= date_limit
        ).all()
        
        for sale in sales:
            activities.append({
                'id': f"sale_{sale.id}",
                'type': 'sale',
                'description': f"Venda realizada pelo Mercado Livre",
                'timestamp': sale.sale_timestamp.isoformat(),
                'product_id': sale.product_id,
                'product_title': sale.product_title,
                'quantity': sale.quantity_sold,
                'reference_id': sale.ml_order_id
            })
    
    # Buscar ajustes de estoque se o tipo for 'all' ou 'adjustment'
    if activity_type in ['all', 'adjustment']:
        adjustments = db.session.query(
            StockAdjustment.id,
            StockAdjustment.adjustment_type,
            StockAdjustment.quantity,
            StockAdjustment.reason,
            StockAdjustment.adjustment_timestamp,
            Product.id.label('product_id'),
            Product.title.label('product_title')
        ).join(
            Product, Product.id == StockAdjustment.product_id
        ).filter(
            Product.user_id == user_id,
            StockAdjustment.adjustment_timestamp >= date_limit
        ).all()
        
        for adjustment in adjustments:
            activities.append({
                'id': f"adjustment_{adjustment.id}",
                'type': 'adjustment',
                'description': f"Ajuste manual de estoque: {adjustment.adjustment_type}",
                'timestamp': adjustment.adjustment_timestamp.isoformat(),
                'product_id': adjustment.product_id,
                'product_title': adjustment.product_title,
                'quantity': adjustment.quantity,
                'reason': adjustment.reason
            })
    
    # Buscar atualizações de estoque se o tipo for 'all' ou 'stock_change'
    if activity_type in ['all', 'stock_change']:
        stock_changes = db.session.query(
            StockLevel.id,
            StockLevel.timestamp,
            StockLevel.available_quantity,
            StockLevel.total_quantity,
            Product.id.label('product_id'),
            Product.title.label('product_title')
        ).join(
            Product, Product.id == StockLevel.product_id
        ).filter(
            Product.user_id == user_id,
            StockLevel.timestamp >= date_limit
        ).all()
        
        for change in stock_changes:
            activities.append({
                'id': f"stock_{change.id}",
                'type': 'stock_change',
                'description': f"Atualização de estoque no Fulfillment",
                'timestamp': change.timestamp.isoformat(),
                'product_id': change.product_id,
                'product_title': change.product_title,
                'available': change.available_quantity,
                'total': change.total_quantity
            })
    
    # Ordenar atividades por data (mais recente primeiro)
    activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Se não houver dados reais, gerar dados de exemplo para visualização
    if not activities:
        # Gerar dados de exemplo para demonstração
        import random
        
        products = Product.query.filter_by(user_id=user_id).all()
        
        # Se não houver produtos, usar produtos de exemplo
        if not products:
            example_products = [
                {"id": 1, "title": "Smartphone Galaxy A54"},
                {"id": 2, "title": "Notebook Dell Inspiron"},
                {"id": 3, "title": "Smart TV LG 50\""},
                {"id": 4, "title": "Fone de Ouvido JBL"},
                {"id": 5, "title": "Câmera Canon EOS"}
            ]
            
            # Gerar vendas de exemplo
            for i in range(15):
                product = random.choice(example_products)
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                activities.append({
                    'id': f"sale_{i+1}",
                    'type': 'sale',
                    'description': "Venda realizada pelo Mercado Livre",
                    'timestamp': activity_date.isoformat(),
                    'product_id': product["id"],
                    'product_title': product["title"],
                    'quantity': random.randint(1, 3),
                    'reference_id': f"ML{random.randint(10000000, 99999999)}"
                })
            
            # Gerar ajustes de estoque de exemplo
            for i in range(5):
                product = random.choice(example_products)
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                adjustment_type = random.choice(['entrada_manual', 'saida_manual'])
                quantity = random.randint(1, 10) if adjustment_type == 'entrada_manual' else -random.randint(1, 3)
                
                activities.append({
                    'id': f"adjustment_{i+1}",
                    'type': 'adjustment',
                    'description': f"Ajuste manual de estoque: {adjustment_type}",
                    'timestamp': activity_date.isoformat(),
                    'product_id': product["id"],
                    'product_title': product["title"],
                    'quantity': quantity,
                    'reason': "Ajuste de demonstração"
                })
            
            # Gerar sincronizações de exemplo
            for i in range(3):
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                activities.append({
                    'id': f"sync_{i+1}",
                    'type': 'sync',
                    'description': "Sincronização com Mercado Livre",
                    'timestamp': activity_date.isoformat()
                })
            
            # Gerar mudanças de estoque de exemplo
            for i in range(8):
                product = random.choice(example_products)
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                activities.append({
                    'id': f"stock_{i+1}",
                    'type': 'stock_change',
                    'description': "Atualização de estoque no Fulfillment",
                    'timestamp': activity_date.isoformat(),
                    'product_id': product["id"],
                    'product_title': product["title"],
                    'available': random.randint(10, 50),
                    'total': random.randint(50, 100)
                })
        else:
            # Usar produtos reais para gerar dados de exemplo
            for i in range(15):
                product = random.choice(products)
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                activities.append({
                    'id': f"sale_{i+1}",
                    'type': 'sale',
                    'description': "Venda realizada pelo Mercado Livre",
                    'timestamp': activity_date.isoformat(),
                    'product_id': product.id,
                    'product_title': product.title,
                    'quantity': random.randint(1, 3),
                    'reference_id': f"ML{random.randint(10000000, 99999999)}"
                })
            
            # Gerar ajustes de estoque de exemplo
            for i in range(5):
                product = random.choice(products)
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                adjustment_type = random.choice(['entrada_manual', 'saida_manual'])
                quantity = random.randint(1, 10) if adjustment_type == 'entrada_manual' else -random.randint(1, 3)
                
                activities.append({
                    'id': f"adjustment_{i+1}",
                    'type': 'adjustment',
                    'description': f"Ajuste manual de estoque: {adjustment_type}",
                    'timestamp': activity_date.isoformat(),
                    'product_id': product.id,
                    'product_title': product.title,
                    'quantity': quantity,
                    'reason': "Ajuste de demonstração"
                })
            
            # Gerar sincronizações de exemplo
            for i in range(3):
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                activities.append({
                    'id': f"sync_{i+1}",
                    'type': 'sync',
                    'description': "Sincronização com Mercado Livre",
                    'timestamp': activity_date.isoformat()
                })
            
            # Gerar mudanças de estoque de exemplo
            for i in range(8):
                product = random.choice(products)
                activity_date = date_limit + timedelta(days=random.randint(0, days))
                
                activities.append({
                    'id': f"stock_{i+1}",
                    'type': 'stock_change',
                    'description': "Atualização de estoque no Fulfillment",
                    'timestamp': activity_date.isoformat(),
                    'product_id': product.id,
                    'product_title': product.title,
                    'available': random.randint(10, 50),
                    'total': random.randint(50, 100)
                })
        
        # Ordenar atividades por data (mais recente primeiro)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return jsonify(activities)

@api_bp.route('/stock/adjust', methods=['POST'])
def adjust_stock():
    """Realiza um ajuste manual de estoque."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"error": "Usuário não autenticado"}), 401
    
    # Obter dados do ajuste
    data = request.json
    if not data:
        return jsonify({"error": "Dados não fornecidos"}), 400
    
    # Validar dados
    required_fields = ['product_id', 'adjustment_type', 'quantity', 'reason']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Campo obrigatório não fornecido: {field}"}), 400
    
    # Verificar se o produto existe e pertence ao usuário
    product = Product.query.filter_by(id=data['product_id'], user_id=user_id).first()
    if not product:
        return jsonify({"error": "Produto não encontrado ou não pertence ao usuário"}), 404
    
    # Validar tipo de ajuste
    valid_adjustment_types = ['entrada_manual', 'saida_manual', 'perda', 'dano']
    if data['adjustment_type'] not in valid_adjustment_types:
        return jsonify({"error": f"Tipo de ajuste inválido. Tipos válidos: {', '.join(valid_adjustment_types)}"}), 400
    
    # Validar quantidade
    quantity = data['quantity']
    if not isinstance(quantity, (int, float)) or quantity == 0:
        return jsonify({"error": "Quantidade inválida. Deve ser um número diferente de zero."}), 400
    
    # Ajustar sinal da quantidade conforme o tipo de ajuste
    if data['adjustment_type'] in ['saida_manual', 'perda', 'dano'] and quantity > 0:
        quantity = -quantity
    elif data['adjustment_type'] == 'entrada_manual' and quantity < 0:
        quantity = abs(quantity)
    
    try:
        # Obter o último nível de estoque
        last_stock = StockLevel.query.filter_by(product_id=product.id).order_by(StockLevel.timestamp.desc()).first()
        
        if not last_stock:
            # Se não houver registro de estoque, criar um com valores zerados
            last_stock = StockLevel(
                product_id=product.id,
                total_quantity=0,
                available_quantity=0,
                not_available_quantity=0,
                timestamp=datetime.utcnow() - timedelta(seconds=1)  # 1 segundo atrás
            )
            db.session.add(last_stock)
            db.session.flush()
        
        # Calcular novo estoque
        new_available = max(0, last_stock.available_quantity + quantity)
        new_total = max(new_available, last_stock.total_quantity + quantity)
        
        # Criar novo registro de estoque
        new_stock = StockLevel(
            product_id=product.id,
            total_quantity=new_total,
            available_quantity=new_available,
            not_available_quantity=new_total - new_available
        )
        db.session.add(new_stock)
        
        # Registrar o ajuste
        adjustment = StockAdjustment(
            product_id=product.id,
            adjustment_type=data['adjustment_type'],
            quantity=quantity,
            reason=data['reason'],
            adjustment_timestamp=datetime.utcnow()
        )
        db.session.add(adjustment)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Ajuste de estoque realizado com sucesso",
            "adjustment_id": adjustment.id,
            "new_stock": {
                "available": new_available,
                "total": new_total,
                "not_available": new_total - new_available
            }
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
