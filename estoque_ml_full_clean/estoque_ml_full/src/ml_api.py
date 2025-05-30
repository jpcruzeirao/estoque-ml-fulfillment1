# -*- coding: utf-8 -*-
"""Módulo para integração com a API do Mercado Livre."""

import os
import requests
import json
from datetime import datetime, timedelta
from urllib.parse import urlencode

class MercadoLivreAPI:
    """Classe para gerenciar a integração com a API do Mercado Livre."""
    
    # URLs base da API
    BASE_URL = "https://api.mercadolibre.com"
    AUTH_URL = "https://auth.mercadolibre.com.ar/authorization"
    TOKEN_URL = "https://api.mercadolibre.com/oauth/token"
    
    def __init__(self, app_id, client_secret, redirect_uri):
        """Inicializa a classe com as credenciais da aplicação."""
        self.app_id = app_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.access_token = None
        self.refresh_token = None
        self.token_expires = None
    
    def get_auth_url(self):
        """Gera a URL para autenticação do usuário."""
        params = {
            "response_type": "code",
            "client_id": self.app_id,
            "redirect_uri": self.redirect_uri
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"
    
    def exchange_code_for_token(self, code):
        """Troca o código de autorização por tokens de acesso."""
        data = {
            "grant_type": "authorization_code",
            "client_id": self.app_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri
        }
        
        response = requests.post(self.TOKEN_URL, data=data)
        
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data["access_token"]
            self.refresh_token = token_data["refresh_token"]
            self.token_expires = datetime.now() + timedelta(seconds=token_data["expires_in"])
            return token_data
        else:
            raise Exception(f"Erro ao obter token: {response.status_code} - {response.text}")
    
    def refresh_access_token(self):
        """Atualiza o token de acesso usando o refresh token."""
        if not self.refresh_token:
            raise Exception("Refresh token não disponível")
        
        data = {
            "grant_type": "refresh_token",
            "client_id": self.app_id,
            "client_secret": self.client_secret,
            "refresh_token": self.refresh_token
        }
        
        response = requests.post(self.TOKEN_URL, data=data)
        
        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data["access_token"]
            self.refresh_token = token_data["refresh_token"]
            self.token_expires = datetime.now() + timedelta(seconds=token_data["expires_in"])
            return token_data
        else:
            raise Exception(f"Erro ao atualizar token: {response.status_code} - {response.text}")
    
    def check_token_validity(self):
        """Verifica se o token está válido e o atualiza se necessário."""
        if not self.access_token or not self.token_expires:
            return False
        
        # Se o token expira em menos de 10 minutos, atualiza
        if datetime.now() + timedelta(minutes=10) >= self.token_expires:
            self.refresh_access_token()
        
        return True
    
    def api_get(self, endpoint, params=None):
        """Realiza uma requisição GET para a API do Mercado Livre."""
        if not self.check_token_validity():
            raise Exception("Token de acesso inválido ou expirado")
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        url = f"{self.BASE_URL}{endpoint}"
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Erro na requisição GET: {response.status_code} - {response.text}")
    
    def api_post(self, endpoint, data):
        """Realiza uma requisição POST para a API do Mercado Livre."""
        if not self.check_token_validity():
            raise Exception("Token de acesso inválido ou expirado")
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        url = f"{self.BASE_URL}{endpoint}"
        
        response = requests.post(url, headers=headers, data=json.dumps(data))
        
        if response.status_code in [200, 201]:
            return response.json()
        else:
            raise Exception(f"Erro na requisição POST: {response.status_code} - {response.text}")
    
    def get_user_info(self):
        """Obtém informações do usuário autenticado."""
        return self.api_get("/users/me")
    
    def get_user_items(self, user_id, offset=0, limit=50):
        """Obtém os itens do usuário."""
        params = {
            "seller_id": user_id,
            "offset": offset,
            "limit": limit
        }
        return self.api_get("/items/search", params)
    
    def get_item_details(self, item_id):
        """Obtém detalhes de um item específico."""
        return self.api_get(f"/items/{item_id}")
    
    def get_fulfillment_stock(self, inventory_id):
        """Obtém o estoque de um item no Fulfillment."""
        return self.api_get(f"/inventories/{inventory_id}/stock/fulfillment")
    
    def get_orders(self, seller_id, offset=0, limit=50):
        """Obtém os pedidos do vendedor."""
        params = {
            "seller": seller_id,
            "offset": offset,
            "limit": limit
        }
        return self.api_get("/orders/search", params)
    
    def get_order_details(self, order_id):
        """Obtém detalhes de um pedido específico."""
        return self.api_get(f"/orders/{order_id}")
