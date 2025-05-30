# Sistema de Gestão de Estoque - Fulfillment Mercado Livre

Sistema completo para gestão de estoque integrado ao Fulfillment do Mercado Livre, com dashboard intuitivo, relatórios, alertas e planejamento de envios.

## Funcionalidades

- **Dashboard Interativo**: Visualização de estatísticas em tempo real
- **Gestão de Produtos**: Catálogo completo sincronizado com o Mercado Livre
- **Controle de Estoque**: Monitoramento de níveis e histórico de estoque
- **Histórico de Vendas**: Acompanhamento detalhado de todas as vendas
- **Alertas de Estoque Baixo**: Notificações para produtos que precisam de reposição
- **Ajustes Manuais**: Interface para registrar entradas, saídas e perdas
- **Planejamento de Envios**: Criação e acompanhamento de envios para o Fulfillment
- **Relatórios Exportáveis**: Geração de relatórios em PDF e Excel
- **Integração Completa**: Sincronização automática com a API do Mercado Livre

## Estrutura do Projeto

O projeto é dividido em duas partes principais:

### Backend (Flask API)

- **src/**: Código-fonte da API
  - **main.py**: Ponto de entrada da aplicação
  - **config.py**: Configurações do sistema
  - **models.py**: Modelos de dados
  - **routes.py**: Rotas e endpoints da API
  - **ml_api.py**: Integração com a API do Mercado Livre

### Frontend (React Dashboard)

- **frontend/dashboard/**: Interface de usuário
  - **src/components/**: Componentes React
  - **src/services/**: Serviços e integração com o backend
  - **src/App.tsx**: Componente principal da aplicação
  - **src/App.css**: Estilos da aplicação

## Requisitos

### Backend

- Python 3.8+
- Flask
- SQLAlchemy
- Requests

### Frontend

- Node.js 14+
- React 18+
- Recharts (para gráficos)
- TypeScript

## Instalação

### Backend

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/estoque-ml-full.git
   cd estoque-ml-full
   ```

2. Crie e ative um ambiente virtual:
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
   export FLASK_ENV=development
   export ML_APP_ID=seu_client_id
   export ML_SECRET_KEY=seu_client_secret
   export ML_REDIRECT_URI=http://localhost:5000/auth/callback
   ```

5. Inicie o servidor:
   ```bash
   python -m src.main
   ```

### Frontend

1. Navegue até a pasta do frontend:
   ```bash
   cd frontend/dashboard
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   pnpm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou
   pnpm run dev
   ```

## Uso

1. Acesse o frontend em `http://localhost:5173` (ou a porta indicada no terminal)
2. Faça login com sua conta do Mercado Livre
3. Explore as funcionalidades do sistema:
   - Dashboard principal
   - Gestão de produtos
   - Controle de estoque
   - Histórico de vendas
   - Alertas e notificações
   - Planejamento de envios

## Documentação

Para mais informações, consulte:

- [Manual do Usuário](docs/manual_usuario.md)
- [Guia de Implantação](docs/guia_implantacao.md)
- [API Reference](docs/api_reference.md)

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contato

Para suporte ou dúvidas, entre em contato através do email: suporte@exemplo.com
