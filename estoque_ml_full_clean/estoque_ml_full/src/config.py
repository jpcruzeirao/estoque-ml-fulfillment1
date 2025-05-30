# -*- coding: utf-8 -*-
"""Configurações da aplicação Flask."""

import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env (se existir)
load_dotenv()

# Configurações básicas
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__))) # Aponta para a raiz do projeto estoque_ml_full

# Configuração do Banco de Dados (usando SQLite para desenvolvimento inicial)
# O arquivo do banco de dados será criado na raiz do projeto.
SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'estoque_ml_dev.db')}"
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Chave secreta para sessões Flask (deve ser segura em produção)
SECRET_KEY = os.getenv("SECRET_KEY", "uma-chave-secreta-muito-forte-para-dev")

# Configurações da API do Mercado Livre (serão obtidas no processo de autenticação)
# Estas são apenas placeholders, não devem ser hardcoded.
ML_APP_ID = os.getenv("ML_APP_ID", "YOUR_APP_ID")
ML_SECRET_KEY = os.getenv("ML_SECRET_KEY", "YOUR_SECRET_KEY")
ML_REDIRECT_URI = os.getenv("ML_REDIRECT_URI", "http://localhost:5000/callback") # Ajustar conforme a hospedagem

