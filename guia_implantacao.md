# Guia de Implantação: Sistema de Gestão de Estoque - Fulfillment Mercado Livre

Este guia contém instruções detalhadas para implantar o sistema de gestão de estoque para o Fulfillment do Mercado Livre em um ambiente de produção.

## Pré-requisitos

- Servidor com sistema operacional Linux (Ubuntu 20.04 ou superior recomendado)
- Python 3.8 ou superior
- Node.js 14 ou superior
- Banco de dados SQLite (para ambiente de teste) ou PostgreSQL (para produção)
- Credenciais de API do Mercado Livre (Client ID e Client Secret)

## Estrutura do Projeto

O sistema é composto por duas partes principais:

1. **Backend (Flask API)**
   - Localizado na pasta `/src/`
   - Gerencia a comunicação com a API do Mercado Livre
   - Armazena dados no banco de dados
   - Fornece endpoints REST para o frontend

2. **Frontend (React)**
   - Localizado na pasta `/frontend/dashboard/`
   - Interface de usuário para interação com o sistema
   - Visualização de dados, gráficos e relatórios
   - Gerenciamento de estoque e envios

## Passos para Implantação

### 1. Configuração do Backend

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/estoque-ml-full.git
   cd estoque-ml-full
   ```

2. Crie e ative um ambiente virtual Python:
   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows: venv\Scripts\activate
   ```

3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure as variáveis de ambiente:
   ```bash
   export FLASK_APP=src/main.py
   export FLASK_ENV=production
   export ML_APP_ID=seu_client_id
   export ML_SECRET_KEY=seu_client_secret
   export ML_REDIRECT_URI=https://seu-dominio.com/auth/callback
   ```

5. Inicialize o banco de dados:
   ```bash
   flask db upgrade
   ```

6. Inicie o servidor:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 "src.main:app"
   ```

### 2. Configuração do Frontend

1. Navegue até a pasta do frontend:
   ```bash
   cd frontend/dashboard
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo de ambiente:
   ```bash
   # Crie um arquivo .env com o seguinte conteúdo:
   VITE_API_URL=https://seu-dominio.com/api
   ```

4. Construa a versão de produção:
   ```bash
   npm run build
   ```

5. Sirva os arquivos estáticos com um servidor web como Nginx ou Apache.

### 3. Configuração do Servidor Web (Nginx)

1. Instale o Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Configure o Nginx para servir o frontend e fazer proxy para o backend:
   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com;

       location / {
           root /caminho/para/estoque-ml-full/frontend/dashboard/dist;
           try_files $uri /index.html;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       location /auth {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. Reinicie o Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### 4. Configuração do SSL (Recomendado)

1. Instale o Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtenha um certificado SSL:
   ```bash
   sudo certbot --nginx -d seu-dominio.com
   ```

3. Siga as instruções na tela para configurar o redirecionamento HTTPS.

## Manutenção e Monitoramento

### Backup do Banco de Dados

Para SQLite:
```bash
cp instance/database.db backup/database_$(date +%Y%m%d).db
```

Para PostgreSQL:
```bash
pg_dump -U usuario -d estoque_ml > backup/estoque_ml_$(date +%Y%m%d).sql
```

### Logs

Os logs do aplicativo são armazenados em:
- Backend: `/var/log/estoque-ml/backend.log`
- Frontend: Logs do navegador do cliente
- Nginx: `/var/log/nginx/access.log` e `/var/log/nginx/error.log`

### Atualização do Sistema

1. Pare os serviços:
   ```bash
   sudo systemctl stop estoque-ml-backend
   ```

2. Faça backup do banco de dados.

3. Atualize o código:
   ```bash
   git pull origin main
   ```

4. Atualize as dependências:
   ```bash
   pip install -r requirements.txt
   cd frontend/dashboard && npm install
   ```

5. Construa o frontend:
   ```bash
   npm run build
   ```

6. Reinicie os serviços:
   ```bash
   sudo systemctl start estoque-ml-backend
   ```

## Solução de Problemas

### Problemas de Conexão com a API do Mercado Livre

1. Verifique se as credenciais estão corretas.
2. Verifique se o URI de redirecionamento está configurado corretamente no Mercado Livre.
3. Verifique os logs do backend para mensagens de erro específicas.

### Problemas de Banco de Dados

1. Verifique as permissões do arquivo de banco de dados (SQLite).
2. Verifique a conexão com o banco de dados (PostgreSQL).
3. Execute as migrações pendentes: `flask db upgrade`.

### Problemas de Frontend

1. Limpe o cache do navegador.
2. Verifique se o arquivo `.env` está configurado corretamente.
3. Verifique os logs do console do navegador para erros.

## Contato e Suporte

Para obter suporte adicional, entre em contato com:
- Email: suporte@exemplo.com
- Telefone: (11) 1234-5678
