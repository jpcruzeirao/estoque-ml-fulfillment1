# -*- coding: utf-8 -*-
"""Ponto de entrada principal da aplicação Flask."""

from flask import Flask, jsonify, session
import os
import sys

# Adiciona o diretório raiz ao PYTHONPATH para permitir imports relativos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.config import SQLALCHEMY_DATABASE_URI, SECRET_KEY
from src.models import db
from src.routes import auth_bp, api_bp

def create_app():
    """Cria e configura a instância da aplicação Flask."""
    app = Flask(__name__)

    # Carrega as configurações do config.py
    app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = SECRET_KEY
    
    # Configurações da API do Mercado Livre
    app.config["ML_APP_ID"] = os.getenv("ML_APP_ID", "YOUR_APP_ID")
    app.config["ML_SECRET_KEY"] = os.getenv("ML_SECRET_KEY", "YOUR_SECRET_KEY")
    app.config["ML_REDIRECT_URI"] = os.getenv("ML_REDIRECT_URI", "http://localhost:5000/callback")

    # Inicializa o SQLAlchemy com a aplicação
    db.init_app(app)

    # Registrar Blueprints (rotas)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    # Cria as tabelas do banco de dados se não existirem
    with app.app_context():
        db.create_all()
        print("Banco de dados inicializado com sucesso!")

    @app.route("/")
    def hello():
        # Rota inicial apenas para teste
        return "Backend do Sistema de Gestão de Estoque - Em construção!"
    
    @app.route("/status")
    def status():
        # Rota para verificar o status da API
        return jsonify({
            "status": "online",
            "version": "1.0.0",
            "authenticated": "user_id" in session
        })

    return app

# Instância da aplicação para ser usada pelo servidor WSGI (como Gunicorn/Uvicorn)
app = create_app()

# Executa o servidor Flask quando este arquivo é executado diretamente
if __name__ == "__main__":
    print("Iniciando servidor Flask na porta 5000...")
    app.run(host="0.0.0.0", port=5000, debug=True)
