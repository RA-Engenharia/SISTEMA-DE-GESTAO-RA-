# Sistema de Gestao RA

Sistema completo de gestao de projetos de engenharia desenvolvido para a RA Engenharia.

[![CI](https://github.com/RA-Engenharia/SISTEMA-DE-GESTAO-RA-/actions/workflows/ci.yml/badge.svg)](https://github.com/RA-Engenharia/SISTEMA-DE-GESTAO-RA-/actions/workflows/ci.yml)
[![Security](https://github.com/RA-Engenharia/SISTEMA-DE-GESTAO-RA-/actions/workflows/codeql.yml/badge.svg)](https://github.com/RA-Engenharia/SISTEMA-DE-GESTAO-RA-/actions/workflows/codeql.yml)

## Funcionalidades

- **Gestao de Projetos**: Crie, acompanhe e gerencie projetos de engenharia
- **Gestao de Tarefas**: Organize tarefas com prioridades, prazos e responsaveis
- **Gestao de Clientes**: Cadastre e gerencie informacoes de clientes
- **Controle de Documentos**: Upload e organizacao de documentos por projeto
- **Dashboard**: Visao geral com estatisticas e atividades recentes
- **Autenticacao JWT**: Sistema seguro de login com refresh tokens
- **Controle de Acesso**: Roles e permissoes (Admin, Manager, Engineer, Technician, Viewer)
- **Notificacoes**: Alertas para tarefas atribuidas e prazos

## Tecnologias

### Backend
- **Node.js 20** + **TypeScript**
- **Express.js** - Framework web
- **Prisma ORM** - Acesso ao banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticacao
- **Zod** - Validacao de dados
- **Winston** - Logging
- **Helmet** - Seguranca HTTP

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilizacao
- **React Query** - Gerenciamento de estado servidor
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado cliente
- **React Hook Form** - Formularios

### DevOps
- **Docker** + **Docker Compose**
- **GitHub Actions** - CI/CD
- **Dependabot** - Atualizacao de dependencias
- **CodeQL** - Analise de seguranca

## Requisitos

- Node.js 20+
- PostgreSQL 16+
- Docker e Docker Compose (opcional)

## Instalacao

### Desenvolvimento Local

1. Clone o repositorio:
```bash
git clone https://github.com/RA-Engenharia/SISTEMA-DE-GESTAO-RA-.git
cd SISTEMA-DE-GESTAO-RA-
```

2. Instale as dependencias:
```bash
# Backend
npm install

# Frontend
cd frontend && npm install
```

3. Configure as variaveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas configuracoes
```

4. Inicie o banco de dados (Docker):
```bash
docker-compose -f docker-compose.dev.yml up -d
```

5. Execute as migracoes:
```bash
npx prisma migrate dev
npx prisma db seed  # Dados de exemplo
```

6. Inicie a aplicacao:
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

7. Acesse:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Adminer (DB): http://localhost:8080

### Docker (Producao)

```bash
# Build e inicie todos os servicos
docker-compose up -d

# Acesse em http://localhost
```

## Variaveis de Ambiente

| Variavel | Descricao | Padrao |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente (development/production) | development |
| `PORT` | Porta do backend | 3001 |
| `DATABASE_URL` | URL de conexao PostgreSQL | - |
| `JWT_SECRET` | Chave secreta JWT (min 32 chars) | - |
| `JWT_EXPIRES_IN` | Tempo de expiracao do token | 7d |
| `CORS_ORIGIN` | Origem permitida para CORS | http://localhost:5173 |
| `RATE_LIMIT_MAX_REQUESTS` | Limite de requisicoes | 100 |

## Scripts Disponiveis

### Backend
```bash
npm run dev          # Desenvolvimento com hot-reload
npm run build        # Build para producao
npm run start        # Inicia servidor de producao
npm run test         # Executa testes
npm run lint         # Verifica codigo com ESLint
npm run typecheck    # Verifica tipos TypeScript
npm run db:migrate   # Executa migracoes
npm run db:seed      # Popula banco com dados de exemplo
npm run db:studio    # Abre Prisma Studio
```

### Frontend
```bash
npm run dev          # Desenvolvimento com hot-reload
npm run build        # Build para producao
npm run preview      # Preview do build
npm run lint         # Verifica codigo com ESLint
npm run typecheck    # Verifica tipos TypeScript
```

## Estrutura do Projeto

```
SISTEMA-DE-GESTAO-RA-/
├── .github/                 # Configuracoes GitHub
│   ├── workflows/           # GitHub Actions
│   ├── ISSUE_TEMPLATE/      # Templates de issues
│   └── PULL_REQUEST_TEMPLATE.md
├── frontend/                # Aplicacao React
│   ├── src/
│   │   ├── components/      # Componentes reutilizaveis
│   │   ├── pages/           # Paginas da aplicacao
│   │   ├── services/        # Servicos de API
│   │   ├── store/           # Estado global (Zustand)
│   │   ├── types/           # Tipos TypeScript
│   │   └── utils/           # Utilitarios
│   ├── package.json
│   └── vite.config.ts
├── prisma/                  # Prisma ORM
│   ├── schema.prisma        # Schema do banco
│   └── seed.ts              # Dados de exemplo
├── src/                     # Codigo backend
│   ├── config/              # Configuracoes
│   ├── middleware/          # Middlewares Express
│   ├── routes/              # Rotas da API
│   └── test/                # Testes
├── docker-compose.yml       # Producao
├── docker-compose.dev.yml   # Desenvolvimento
├── Dockerfile               # Build backend
└── package.json
```

## API Endpoints

### Autenticacao
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Usuario atual
- `POST /api/auth/change-password` - Alterar senha

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obter usuario
- `POST /api/users` - Criar usuario (admin)
- `PATCH /api/users/:id` - Atualizar usuario
- `DELETE /api/users/:id` - Deletar usuario (admin)

### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Obter cliente
- `POST /api/clients` - Criar cliente
- `PATCH /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Deletar cliente

### Projetos
- `GET /api/projects` - Listar projetos
- `GET /api/projects/:id` - Obter projeto
- `POST /api/projects` - Criar projeto
- `PATCH /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto

### Tarefas
- `GET /api/tasks` - Listar tarefas
- `GET /api/tasks/my-tasks` - Minhas tarefas
- `GET /api/tasks/:id` - Obter tarefa
- `POST /api/tasks` - Criar tarefa
- `PATCH /api/tasks/:id` - Atualizar tarefa
- `DELETE /api/tasks/:id` - Deletar tarefa

### Documentos
- `GET /api/documents` - Listar documentos
- `POST /api/documents` - Upload documento
- `GET /api/documents/:id/download` - Download documento
- `DELETE /api/documents/:id` - Deletar documento

### Dashboard
- `GET /api/dashboard/stats` - Estatisticas gerais
- `GET /api/dashboard/activity` - Atividade recente
- `GET /api/dashboard/notifications` - Notificacoes

## Credenciais de Teste

Apos executar `npm run db:seed`:

| Usuario | Email | Senha | Role |
|---------|-------|-------|------|
| Administrador | admin@ra-engenharia.com | admin123 | ADMIN |
| Gerente | gerente@ra-engenharia.com | manager123 | MANAGER |
| Engenheiro | engenheiro@ra-engenharia.com | engineer123 | ENGINEER |

## Seguranca

- Autenticacao JWT com refresh tokens
- Senhas hasheadas com bcrypt (12 rounds)
- Validacao de entrada com Zod
- Rate limiting em todas as rotas
- Headers de seguranca com Helmet
- Protecao CORS configuravel
- Queries parametrizadas via Prisma (previne SQL injection)
- Analise de codigo com CodeQL
- Dependabot para atualizacoes de seguranca

Veja [SECURITY.md](SECURITY.md) para mais detalhes.

## Contribuindo

1. Fork o repositorio
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudancas: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## Licenca

Este projeto esta licenciado sob a Boost Software License 1.0 - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Desenvolvido por RA Engenharia
