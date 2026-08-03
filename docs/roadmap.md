# MetaManager — Roadmap de Produto

> **Roadmap baseado na superfície da Meta Marketing API (v26.0).**
> Este documento mapeia capacidades técnicas dos endpoints para funcionalidades de produto organizadas em fases de entrega.

---

## Índice

| Seção | Descrição |
| --- | --- |
| [1. Resumo Executivo](#1-resumo-executivo) | Visão geral e valor de negócio |
| [2. Matriz de Capacidades](#2-matriz-de-capacidades) | Mapeamento endpoint → capacidade → funcionalidade |
| [3. MVP](#3-mvp) | Fase 1 — Fundação essencial |
| [4. Fase 2](#4-fase-2) | Automação e escala |
| [5. Fase 3](#5-fase-3) | Inteligência e otimização |
| [6. Futuro](#6-futuro) | Inovação e diferenciação |
| [7. Dependências e Riscos](#7-dependências-e-riscos) | Fatores críticos externos |
| [8. Apêndice: Endpoints por Categoria](#8-apêndice-endpoints-por-categoria) | Referência rápida |

---

## 1. Resumo Executivo

### 1.1 Visão Geral

O MetaManager é uma plataforma de gerenciamento de anúncios Meta Ads que abstrai a complexidade da API em funcionalidades intuitivas. Este roadmap cobre **16 categorias de capacidade** extraídas da documentação oficial da Meta Marketing API v26.0, resultando em **45+ funcionalidades** organizadas em 4 fases.

### 1.2 Proposta de Valor

| Pilar | Descrição |
| --- | --- |
| **Eficiência Operacional** | Reduzir tempo de criação de campanhas de horas para minutos através de automação e templates |
| **Inteligência Acionável** | Transformar dados brutos de insights em recomendações práticas de otimização |
| **Governança e Compliance** | Garantir conformidade com políticas de anúncios e regulamentações (DSA, LGPD/GDPR) |
| **Escala Segura** | Permitir gestão de múltiplas contas e grandes volumes sem degradação de performance |

### 1.3 Cronograma Estimado

| Fase | Duração | Funcionalidades | Esforço Total |
| --- | --- | --- | --- |
| **MVP** | 8-10 semanas | 12 funcionalidades | ~320 horas |
| **Fase 2** | 6-8 semanas | 14 funcionalidades | ~280 horas |
| **Fase 3** | 8-10 semanas | 12 funcionalidades | ~360 horas |
| **Futuro** | Contínuo | 8+ funcionalidades | A definir |

---

## 2. Matriz de Capacidades

Mapeamento completo de endpoints → capacidades técnicas → funcionalidades de produto.

### 2.1 Gestão de Estrutura de Campanhas

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `POST /campaigns` | Criar campanha com objetivo, orçamento, schedule | Criador de Campanhas guiado | MVP |
| `GET /campaigns` | Listar campanhas com filtros | Dashboard de Campanhas | MVP |
| `POST /campaigns/{id}` | Atualizar campanha (orçamento, status, schedule) | Editor de Campanha em Lote | Fase 2 |
| `POST /campaigns/{id}/copies` | Duplicar campanha (deep copy até 51 filhos async) | Duplicador de Campanhas | Fase 2 |
| `DELETE /campaigns` | Remover campanhas em batch | Limpeza de Campanhas | Fase 3 |
| `POST /async_batch_requests` | Criação assíncrona em massa | Importação em Massa | Fase 3 |

### 2.2 Gestão de Ad Sets e Targeting

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `POST /adsets` | Criar ad set com budget, bidding, targeting | Criador de Ad Sets | MVP |
| `GET /adsets` | Listar ad sets com filtros de status/date | Lista de Ad Sets | MVP |
| `GET /delivery_estimate` | Estimar reach e delivery por targeting | Estimador de Reach | MVP |
| `GET /targetingsearch` | Buscar interesses, comportamentos, demografia | Explorador de Targeting | Fase 2 |
| `GET /targetingvalidation` | Validar targeting spec | Validador de Targeting | Fase 2 |
| `POST /adsets/{id}/copies` | Duplicar ad sets | Duplicador de Ad Sets | Fase 2 |

### 2.3 Criação e Gestão de Anúncios

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `POST /ads` | Criar anúncio com creative e adset | Criador de Anúncios | MVP |
| `GET /ads` | Listar anúncios por campanha/adset | Lista de Anúncios | MVP |
| `POST /ads/{id}/copies` | Duplicar anúncio | Duplicador de Anúncios | Fase 2 |
| `POST /asyncadrequestsets` | Criação assíncrona de múltiplos ads | Bulk Ad Creator | Fase 3 |
| `GET /generatepreviews` | Preview de criativo antes de criar | Preview de Anúncios | MVP |

### 2.4 Criativos e Assets

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `POST /adcreatives` | Criar criativo com object_story_spec | Biblioteca de Criativos | MVP |
| `GET /adcreatives` | Listar criativos | Galeria de Criativos | MVP |
| `POST /adimages` | Upload de imagens (Base64 ou copy_from) | Upload de Imagens | MVP |
| `POST /advideos` | Upload de vídeos (chunked/resumable) | Upload de Vídeos | Fase 2 |
| `POST /asset_feed_spec` | Dynamic Creative com variações | Gerador de Dynamic Creative | Fase 3 |
| `GET /instagram_accounts` | Listar contas Instagram conectadas | Conector Instagram | MVP |

### 2.5 Audiências e Segmentação

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `POST /customaudiences` | Criar audiência customizada (website, app, engagement, lookalike) | Criador de Audiências | Fase 2 |
| `GET /customaudiences` | Listar audiências com health status | Gestão de Audiências | Fase 2 |
| `POST /customaudiences/{id}/users` | Adicionar usuários hashados (SHA-256) | Upload de Listas de Clientes | Fase 2 |
| `POST /lookalike_spec` | Criar lookalike a partir de origem | Gerador de Lookalikes | Fase 2 |
| `GET /saved_audiences` | Listar audiências salvas | Biblioteca de Audiências Salvas | Fase 3 |
| `GET /broadtargetingcategories` | Explorar categorias de targeting | Explorador de Interesses | Fase 2 |

### 2.6 Insights e Reporting

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `GET /insights` (sync) | Ler métricas síncronas (impressions, spend, clicks, conversions) | Dashboard de Performance | MVP |
| `GET /insights` (async) | Relatório assíncrono para grandes volumes | Relatórios Sob Demanda | Fase 2 |
| `GET /insights` com breakdowns | Segmentar por idade, gênero, dispositivo, placement | Análise Dimensional | Fase 2 |
| `POST /insights` com export | Exportar dados (CSV/XLS) | Exportação de Relatórios | Fase 2 |
| `GET /campaign/{id}/insights` | Insights por nível de campanha | Relatório por Campanha | MVP |
| `GET /adset/{id}/insights` | Insights por nível de ad set | Relatório por Ad Set | MVP |
| `GET /ad/{id}/insights` | Insights por nível de anúncio | Relatório por Anúncio | MVP |

### 2.7 Conversion Tracking (Pixel + CAPI)

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `GET /adspixels` | Listar pixels da conta | Gestão de Pixels | Fase 2 |
| `POST /adspixels` | Criar novo pixel | Criador de Pixels | Fase 2 |
| `POST /{pixel_id}/events` | Enviar eventos server-side (CAPI) | Integração Conversions API | Fase 3 |
| `GET /customconversions` | Listar conversões customizadas | Gestão de Conversões | Fase 2 |
| `POST /customconversions` | Criar regra de conversão customizada | Criador de Regras de Conversão | Fase 3 |

### 2.8 Automação e Regras

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `POST /adrules_library` | Criar regra automatizada (schedule, filters, execution) | Construtor de Regras | Fase 3 |
| `GET /adrules_library` | Listar regras ativas | Gestão de Regras | Fase 3 |
| `POST /adrules/{id}/execute` | Executar regra manualmente | Executor Manual de Regras | Fase 3 |
| `GET /adrules/{id}/history` | Histórico de execuções | Log de Execuções | Fase 3 |
| `POST /adlabels` | Criar labels para organização | Sistema de Labels | Fase 2 |
| `GET /campaignsbylabels` | Filtrar campanhas por label | Filtragem por Labels | Fase 2 |

### 2.9 Catálogos e Commerce

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `GET /owned_product_catalogs` | Listar catálogos de produtos | Gestão de Catálogos | Fase 3 |
| `GET /products` | Listar produtos no catálogo | Catálogo de Produtos | Fase 3 |
| `POST /product_sets` | Criar conjuntos de produtos | Segmentação de Produtos | Fase 3 |
| `GET /external_event_sources` | Fontes de eventos externas | Integração de Sinais | Fase 3 |

### 2.10 Lead Ads

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `GET /ads/{id}/leads` | Listar leads de um anúncio | Captura de Leads | Fase 3 |
| `GET /forms/{id}/leads` | Listar leads por formulário | Gestão de Leads | Fase 3 |
| `GET /leadgen/export_csv` | Exportar leads em CSV | Exportação de Leads | Fase 3 |
| Webhook `leadgen` | Receber leads em tempo real | Webhook de Leads | Futuro |

### 2.11 Business Manager e Governança

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| `GET /owned_ad_accounts` | Listar contas de anúncio | Gestão de Contas | MVP |
| `POST /assigned_users` | Atribuir usuários com permissões | Gestão de Usuários | Fase 2 |
| `GET /assigned_users` | Listar usuários por conta | Auditoria de Acesso | Fase 2 |
| `GET /activities` | Log de atividades da conta | Audit Log | Fase 3 |
| `POST /ad_accounts` | Criar nova conta de anúncio | Provisionamento de Contas | Futuro |

### 2.12 Versionamento e Compatibilidade

| Endpoint | Capacidade Técnica | Funcionalidade Proposta | Fase |
| --- | --- | --- | --- |
| Version pinning (`v26.0`) | Controle explícito de versão | Gerenciador de Versões de API | Fase 2 |
| Monitorar changelog | Detectar breaking changes | Alerta de Depreciação | Fase 3 |

---

## 3. MVP

**Objetivo:** Estabelecer fundação essencial para criação, visualização e gestão básica de campanhas Meta Ads.

### 3.1 Funcionalidades MVP

| # | Funcionalidade | Descrição | Dependências | Esforço |
| --- | --- | --- | --- | --- |
| **MVP-01** | **Dashboard de Campanhas** | Listar todas as campanhas com status, spend, impressions, CTR. Filtros por status (ativo/pausado), data, objetivo. | `GET /campaigns`, `GET /insights` | Média |
| **MVP-02** | **Criador de Campanhas** | Wizard guiado: selecionar objetivo (`OUTCOME_*`), definir orçamento (CBO/ABO), schedule, special_ad_categories. Validação em tempo real. | `POST /campaigns`, `GET /delivery_estimate` | Grande |
| **MVP-03** | **Criador de Ad Sets** | Configurar budget (daily/lifetime), bidding strategy, optimization_goal, targeting básico (geo, idade, gênero). | `POST /adsets`, `GET /targetingsearch` | Grande |
| **MVP-04** | **Criador de Anúncios** | Upload de criativo, definição de nome, status, linking ao adset. Suporte a imagem/vídeo básico. | `POST /ads`, `POST /adcreatives`, `POST /adimages` | Grande |
| **MVP-05** | **Preview de Anúncios** | Visualizar como o anúncio aparece em diferentes placements (Facebook Feed, Instagram Feed, Stories). | `GET /generatepreviews` | Média |
| **MVP-06** | **Gestão de Contas** | Listar ad accounts acessíveis, mostrar currency, balance, status, timezone. | `GET /act_{id}`, `GET /owned_ad_accounts` | Pequena |
| **MVP-07** | **Insights Básicos** | Métricas essenciais por campanha/adset/anúncio: impressions, spend, clicks, CTR, CPC. Período customizável. | `GET /insights` (todos os níveis) | Média |
| **MVP-08** | **Estimador de Reach** | Projetar reach e delivery estimado baseado no targeting e budget antes de publicar. | `GET /delivery_estimate` | Pequena |
| **MVP-09** | **Biblioteca de Criativos** | Listar criativos existentes, mostrar thumbnail, nome, status. Reutilizar criativos em novos anúncios. | `GET /adcreatives` | Pequena |
| **MVP-10** | **Upload de Imagens** | Upload de imagens para criativos (Base64), mostrar hash, URL, dimensões. | `POST /adimages` | Pequena |
| **MVP-11** | **Conector Instagram** | Listar contas Instagram conectadas, selecionar para uso em anúncios. | `GET /instagram_accounts` | Pequena |
| **MVP-12** | **Validação de Campanha** | Dry-run com `validate_only` antes de publicação, mostrar erros de configuração. | `execution_options=['validate_only']` | Pequena |

### 3.2 Critérios de Aceite MVP

- [ ] Criar campanha completa (campanha → adset → anúncio) em menos de 5 minutos
- [ ] Visualizar performance de todas as campanhas em dashboard único
- [ ] Preview de anúncio em 3+ placements diferentes
- [ ] Reach estimate com margem de erro <20% vs delivery real
- [ ] Suportar v26.0 com version pinning explícito

### 3.3 Riscos MVP

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Rate limiting em `GET /insights` | Alto | Implementar cache de 15min (atualização oficial da Meta) |
| Erros de permissão `ads_management` | Alto | Fluxo claro de solicitação de permissões no onboarding |
| Complexidade do wizard de criação | Médio | UX iterativa com usuários beta, tooltips explicativos |
| Breaking changes da API | Médio | Monitorar changelog semanalmente, feature flags por versão |

---

## 4. Fase 2

**Objetivo:** Automação e escala — permitir gestão eficiente de múltiplas campanhas e otimização de fluxo de trabalho.

### 4.1 Funcionalidades Fase 2

| # | Funcionalidade | Descrição | Dependências | Esforço |
| --- | --- | --- | --- | --- |
| **F2-01** | **Duplicador de Campanhas** | Copiar campanha inteira com opção de deep copy (até 51 ad sets async), rename strategy, override de status/orçamento. | `POST /campaigns/{id}/copies`, `POST /async_batch_requests` | Média |
| **F2-02** | **Duplicador de Ad Sets** | Copiar ad sets individualmente ou em batch, preservar targeting e creative specs. | `POST /adsets/{id}/copies` | Pequena |
| **F2-03** | **Duplicador de Anúncios** | Copiar anúncios entre ad sets, preservar creative e tracking specs. | `POST /ads/{id}/copies` | Pequena |
| **F2-04** | **Editor em Lote** | Editar múltiplas campanhas/adsets/anúncios simultaneamente: pause, budget change, status update. | `POST /campaigns`, `POST /adsets`, `POST /ads` | Média |
| **F2-05** | **Explorador de Targeting** | Buscar interesses, comportamentos, demografias, locations com audience size preview. | `GET /targetingsearch`, `GET /broadtargetingcategories` | Média |
| **F2-06** | **Validador de Targeting** | Validar targeting spec antes de salvar, detectar restrições (EU DSA, flagged audiences). | `GET /targetingvalidation` | Pequena |
| **F2-07** | **Criador de Audiências** | Criar custom audiences: website (pixel), app, engagement, customer file, lookalike. Interface para upload de lista hashada. | `POST /customaudiences`, `POST /customaudiences/{id}/users` | Grande |
| **F2-08** | **Gestão de Audiências** | Listar audiências com health status (`operation_status`, `delivery_status`), aprox. count, retention days. | `GET /customaudiences` | Média |
| **F2-09** | **Gerador de Lookalikes** | Criar lookalike audiences a partir de origem (custom audience, pixel, page), selecionar país e ratio. | `POST /customaudiences` com `lookalike_spec` | Média |
| **F2-10** | **Upload de Vídeos** | Upload de vídeos para criativos com suporte a chunked/resumable upload, progress tracking. | `POST /advideos` | Média |
| **F2-11** | **Relatórios por Dimensão** | Breakdown de insights por idade, gênero, dispositivo, placement, região. Visualização em tabelas e gráficos. | `GET /insights` com `breakdowns` | Média |
| **F2-12** | **Exportação de Relatórios** | Exportar dados de insights em CSV ou XLS, agendar exportações recorrentes. | `POST /insights` com `export_format` | Pequena |
| **F2-13** | **Sistema de Labels** | Criar labels, aplicar a campanhas/adsets/anúncios/criativos, filtrar por label. | `POST /adlabels`, `GET /campaignsbylabels` | Pequena |
| **F2-14** | **Gestão de Pixels** | Listar pixels, criar novo pixel, ver código do snippet, status de firing. | `GET /adspixels`, `POST /adspixels` | Pequena |

### 4.2 Critérios de Aceite Fase 2

- [ ] Duplicar campanha com 10+ ad sets em menos de 2 minutos (async)
- [ ] Editar budget de 50+ campanhas em uma única operação
- [ ] Buscar e aplicar 5+ interesses em targeting em menos de 1 minuto
- [ ] Criar lookalike audience em 3 cliques
- [ ] Exportar relatório com 12 meses de dados em menos de 30 segundos

### 4.3 Riscos Fase 2

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Custom audience flagged (integrity policy) | Alto | Alerta preventivo no UI, guia de conformidade |
| Rate limit em bulk operations | Alto | Fila de processamento, backoff exponencial |
| Upload de vídeo falhar (tamanho >10GB) | Médio | Validação prévia, retry automático, fallback para URL |
| Lookalike creation falhar (audiência origem pequena) | Médio | Validar `approximate_count` mínimo antes de criar |

---

## 5. Fase 3

**Objetivo:** Inteligência e otimização — automação avançada, insights acionáveis e gestão proativa.

### 5.1 Funcionalidades Fase 3

| # | Funcionalidade | Descrição | Dependências | Esforço |
| --- | --- | --- | --- | --- |
| **F3-01** | **Construtor de Regras** | Criar regras automatizadas: condições (filters), schedule (daily/hourly), execução (pause, change budget, notify). | `POST /adrules_library` | Grande |
| **F3-02** | **Gestão de Regras** | Listar regras ativas, histórico de execuções, preview de matches, execução manual. | `GET /adrules_library`, `GET /adrules/{id}/history`, `POST /adrules/{id}/execute` | Média |
| **F3-03** | **Bulk Ad Creator** | Criar 100+ anúncios assincronamente via `asyncadrequestsets`, com notification callback. | `POST /asyncadrequestsets` | Grande |
| **F3-04** | **Dynamic Creative Generator** | Construir `asset_feed_spec` com múltiplas variações de imagem, texto, CTA. Preview de combinações. | `POST /adcreatives` com `asset_feed_spec` | Grande |
| **F3-05** | **Integração Conversions API** | Enviar eventos server-side para pixel/dataset, suporte a hashing SHA-256, deduplication com `event_id`. | `POST /{pixel_id}/events` | Grande |
| **F3-06** | **Criador de Regras de Conversão** | Definir custom conversions com regras de URL, event types, default conversion value. | `POST /customconversions` | Média |
| **F3-07** | **Gestão de Catálogos** | Listar catálogos, produtos, product sets. Integrar com campanhas de Product Catalog Sales. | `GET /owned_product_catalogs`, `GET /products` | Média |
| **F3-08** | **Captura de Leads** | Listar leads de anúncios/formulários, exportar em CSV, webhook para tempo real. | `GET /ads/{id}/leads`, `GET /leadgen/export_csv` | Média |
| **F3-09** | **Limpeza de Campanhas** | Deletar campanhas em batch por estratégia (oldest, archived_before), preview do impacto. | `DELETE /campaigns` | Pequena |
| **F3-10** | **Audit Log** | Log de atividades da conta: quem criou/editou/excluiu, timestamp, IP. | `GET /activities` | Pequena |
| **F3-11** | **Alerta de Depreciação** | Monitorar changelog da API, alertar sobre endpoints/fields depreciados em uso. | Web scraping do changelog | Pequena |
| **F3-12** | **Relatórios Assíncronos** | Submeter jobs de relatório grandes, polling de status, notificação ao completar. | `POST /insights` async | Média |

### 5.2 Critérios de Aceite Fase 3

- [ ] Criar regra que pausa anúncio com CPC > R$5 após 1000 impressões
- [ ] Processar 500+ anúncios em bulk em menos de 10 minutos
- [ ] Enviar evento CAPI com latência <2 segundos
- [ ] Gerar relatório assíncrono de 12 meses em menos de 5 minutos
- [ ] Detectar 100% de fields depreciados em uso antes da expiração

### 5.3 Riscos Fase 3

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Regras automatizadas causarem gasto indesejado | Crítico | Sandbox de teste, limite máximo de alteração, aprovação manual opcional |
| Eventos CAPI duplicados (sem dedup) | Alto | Validar `event_id` único, log de duplicatas |
| Webhook de leads falhar (downtime) | Alto | Retry com backoff, fallback para polling |
| Catálogo grande (>10k produtos) travar UI | Médio | Paginação, lazy loading, busca server-side |

---

## 6. Futuro

**Objetivo:** Inovação e diferenciação — funcionalidades que posicionam MetaManager como líder de mercado.

### 6.1 Funcionalidades Futuras

| # | Funcionalidade | Descrição | Dependências | Prioridade |
| --- | --- | --- | --- | --- |
| **FUT-01** | **AI Copywriter** | Gerar textos de anúncio com IA (títulos, descrições, CTAs) baseados no objetivo e público. | Integração com LLM (Claude/GPT) | Alta |
| **FUT-02** | **AI Creative Assistant** | Sugerir combinações de imagem + texto baseadas em performance histórica. | Análise de `asset_feed_spec` winners | Alta |
| **FUT-03** | **Budget Optimizer** | Recomendar realocação de budget entre campanhas baseada em ROAS marginal. | `GET /insights` com `action_values` | Alta |
| **FUT-04** | **Competitor Benchmark** | Comparar performance com benchmarks de indústria (anonimizado/agregado). | Dados agregados de usuários opt-in | Média |
| **FUT-05** | **Smart Scheduling** | Sugerir horários de início/término baseados em histórico de delivery. | `GET /insights` com breakdown hourly | Média |
| **FUT-06** | **Creative Health Score** | Score preditivo de qualidade de criativo antes de publicar. | ML treinado em `quality_ranking` histórico | Alta |
| **FUT-07** | **Multi-Account Sync** | Sincronizar campanhas entre múltiplas contas (agências). | `POST /campaigns/{id}/copies` cross-account | Média |
| **FUT-08** | **WhatsApp Ads Integration** | Criar anúncios com destino WhatsApp (`wamo_whatsapp_identity_spec`). | `POST /adcreatives` com spec específico | Baixa |

### 6.2 Diferenciais Competitivos

| Diferencial | Descrição |
| --- | --- |
| **IA Nativa** | Não apenas automação, mas inteligência generativa integrada ao fluxo |
| **Cross-Account** | Gestão unificada para agências com 10+ contas de anúncio |
| **Compliance First** | Conformidade com DSA, LGPD, GDPR embutida no produto |
| **Real-Time** | Webhooks e atualizações em tempo real, não polling |

---

## 7. Dependências e Riscos

### 7.1 Dependências Externas

| Dependência | Tipo | Criticidade | Mitigação |
| --- | --- | --- | --- |
| **Meta Marketing API** | API externa | Crítica | Monitorar status, fallback para versão anterior |
| **App Review (Advanced Access)** | Aprovação manual | Alta | Iniciar processo cedo, documentar caso de uso |
| **User Access Tokens** | Autenticação | Alta | Fluxo de refresh automático, fallback system user |
| **Rate Limits (BUC)** | Quota | Alta | Cache agressivo, fila de requests, backoff |
| **v26.0+ Breaking Changes** | Versionamento | Média | Feature flags por versão, changelog monitoring |

### 7.2 Riscos Técnicos

| Risco | Probabilidade | Impacto | Plano de Contingência |
| --- | --- | --- | --- |
| API retorna dados inconsistentes | Média | Médio | Validação de schema, retry com backoff |
| Rate limit bloqueia operações críticas | Alta | Alto | Priorização de fila, alerta proativo |
| Token expira durante operação longa | Média | Médio | Refresh preventivo, checkpoint de estado |
| Async job falha sem notificação | Baixa | Médio | Polling de fallback, timeout com retry |

### 7.3 Riscos de Negócio

| Risco | Probabilidade | Impacto | Plano de Contingência |
| --- | --- | --- | --- |
| Concorrente lança feature similar | Média | Médio | Acelerar roadmap, focar em diferenciais (IA, UX) |
| Mudança regulatória (DSA, LGPD) | Alta | Alto | Compliance embutido, atualização contínua |
| Meta remove endpoint crítico | Baixa | Crítico | Abstração de camada API, múltiplos providers |
| churn de usuários por complexidade | Média | Médio | Onboarding guiado, templates, suporte dedicado |

### 7.4 Matriz de Esforço vs. Valor

```
                    VALOR DE NEGÓCIO
                    Baixo     Alto
                    ┌─────────┬─────────┐
              Alto  │ F2-14   │ MVP-01  │
                    │ F3-11   │ MVP-02  │
      ESFORÇO       │         │ FUT-01  │
                    │         │ FUT-03  │
                    ├─────────┼─────────┤
              Baixo │ MVP-11  │ MVP-06  │
                    │ F2-13   │ MVP-07  │
                    │ F3-09   │ F2-01   │
                    │ F3-10   │ F2-07   │
                    └─────────┴─────────┘
```

**Priorização recomendada:** Quadrante Alto Valor / Baixo Esforço primeiro, seguido por Alto Valor / Alto Esforço.

---

## 8. Apêndice: Endpoints por Categoria

### 8.1 Endpoints Core (MVP)

| Categoria | Endpoints |
| --- | --- |
| **Campanhas** | `GET/POST /campaigns`, `POST /campaigns/{id}`, `POST /campaigns/{id}/copies`, `DELETE /campaigns` |
| **Ad Sets** | `GET/POST /adsets`, `POST /adsets/{id}`, `POST /adsets/{id}/copies` |
| **Anúncios** | `GET/POST /ads`, `POST /ads/{id}`, `POST /ads/{id}/copies`, `DELETE /ads` |
| **Criativos** | `GET/POST /adcreatives`, `POST /adcreatives/{id}`, `POST /adimages`, `POST /advideos` |
| **Insights** | `GET /act_{id}/insights`, `GET /{campaign_id}/insights`, `GET /{adset_id}/insights`, `GET /{ad_id}/insights` |
| **Estimates** | `GET /act_{id}/delivery_estimate`, `GET /act_{id}/reachestimate` |
| **Targeting** | `GET /search` (type=adgeolocation, adinterest, adTargetingCategory) |
| **Preview** | `GET /act_{id}/generatepreviews` |

### 8.2 Endpoints Avançados (Fase 2-3)

| Categoria | Endpoints |
| --- | --- |
| **Audiências** | `GET/POST /customaudiences`, `POST /customaudiences/{id}/users`, `DELETE /customaudiences/{id}/users`, `POST /customaudiences/{id}/usersreplace` |
| **Regras** | `GET/POST /adrules_library`, `POST /adrules/{id}`, `POST /adrules/{id}/execute`, `GET /adrules/{id}/history`, `GET /adrules/{id}/preview` |
| **Labels** | `GET/POST /adlabels`, `POST /adlabels/{id}`, `DELETE /adlabels/{id}`, `POST /{object_id}/adlabels` |
| **Pixels** | `GET/POST /adspixels`, `POST /adspixels/{id}`, `POST /{pixel_id}/events` |
| **Conversões** | `GET/POST /customconversions`, `POST /customconversions/{id}`, `DELETE /customconversions/{id}` |
| **Catálogos** | `GET /owned_product_catalogs`, `GET /products`, `POST /product_sets` |
| **Leads** | `GET /ads/{id}/leads`, `GET /forms/{id}/leads`, `GET /leadgen/export_csv/` |
| **Business** | `GET /owned_ad_accounts`, `GET /client_ad_accounts`, `POST /assigned_users`, `GET /activities` |
| **Async** | `POST /act_{id}/async_batch_requests`, `POST /act_{id}/asyncadrequestsets` |

### 8.3 Endpoints Futuros (Inovação)

| Categoria | Endpoints |
| --- | --- |
| **Webhooks** | Subscribe a `leadgen`, `ads_reporting` |
| **Advanced Insights** | `POST /insights` async com `time_ranges`, `summary`, `export_format` |
| **Commerce** | `GET /product_catalogs/{id}/external_event_sources`, `GET /diagnostics` |
| **WhatsApp** | `POST /adcreatives` com `wamo_whatsapp_identity_spec` |

---

## 9. Glossário

| Termo | Definição |
| --- | --- |
| **CBO** | Campaign Budget Optimization — orçamento no nível da campanha |
| **ABO** | Ad Set Budget Optimization — orçamento no nível do ad set |
| **ODAX** | Outcome-Driven Ad Experience — novos objetivos `OUTCOME_*` |
| **CAPI** | Conversions API — envio server-side de eventos |
| **DSA** | Digital Services Act — regulamentação europeia para anúncios |
| **BUC** | Business Use Case — categoria de rate limit na API |
| **HEC-F** | High-Engagement Conversion Funnel — tipo de campanha Advantage+ |
| **SKAdNetwork** | Sistema de atribuição iOS 14+ da Apple |

---

## 10. Referências

- **Documento de Endpoints:** `docs/meta-ads-endpoints.md` (fonte primária)
- **Meta for Developers:** https://developers.facebook.com/docs/marketing-api
- **Graph API Changelog:** https://developers.facebook.com/docs/graph-api/changelog
- **Versioning Guide:** https://developers.facebook.com/docs/graph-api/guides/versioning
- **Rate Limiting:** https://developers.facebook.com/docs/graph-api/overview/rate-limiting
- **Marketing API Access:** https://developers.facebook.com/docs/marketing-api/access

---

*Última atualização: 2026-08-03*
*Versão da API de referência: v26.0*
