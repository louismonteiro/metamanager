# MetaManager — Roadmap de Produto

> **Roadmap baseado na superfície da Meta Marketing API (v26.0).**
> Este documento mapeia capacidades técnicas dos endpoints para funcionalidades de produto organizadas em fases de entrega.
>
> **Premissa de produto:** o MetaManager é **AI-agent-first**. O usuário humano nunca opera a Meta Marketing API através de formulários, wizards ou editores. Toda a interação de ação acontece por **conversa com um agente de IA**. A única outra tela do produto é um **dashboard de monitoramento** (somente leitura).

---

## Índice

| Seção | Descrição |
| --- | --- |
| [1. Resumo Executivo](#1-resumo-executivo) | Visão geral, valor de negócio e cronograma |
| [2. Arquitetura de Produto](#2-arquitetura-de-produto) | As duas superfícies: chat e dashboard |
| [3. Matriz de Capacidades](#3-matriz-de-capacidades) | Mapeamento endpoint → capacidade → pedido ao agente |
| [4. MVP](#4-mvp) | Fase 1 — Fundação essencial |
| [5. Fase 2](#5-fase-2) | Automação e escala |
| [6. Fase 3](#6-fase-3) | Inteligência e otimização |
| [7. Futuro](#7-futuro) | Inovação e diferenciação |
| [8. Dependências e Riscos](#8-dependências-e-riscos) | Fatores críticos externos |
| [9. Apêndice: Endpoints por Categoria](#9-apêndice-endpoints-por-categoria) | Referência rápida |
| [10. Glossário](#10-glossário) | Termos e siglas |
| [11. Referências](#11-referências) | Fontes |

---

## 1. Resumo Executivo

### 1.1 Visão Geral

O MetaManager é uma plataforma **AI-agent-first** de gerenciamento de anúncios Meta Ads. Em vez de expor a complexidade da API em uma árvore de telas, o produto expõe **um agente de IA conversacional** que traduz pedidos em linguagem natural em chamadas da Meta Marketing API, e **um dashboard de monitoramento** onde o usuário acompanha resultados e recebe insights de melhoria.

Este roadmap cobre **16 categorias de capacidade** extraídas da documentação oficial da Meta Marketing API v26.0, resultando em **46 capacidades** organizadas em 4 fases.

**Moeda de referência do produto: EUR (€).** Todos os valores monetários — orçamentos, gasto, CPC, CPA, ROAS, limites de regras — são apresentados e configurados em euros.

### 1.2 Proposta de Valor

| Pilar | Descrição |
| --- | --- |
| **Zero curva de aprendizagem** | O usuário não aprende a interface: descreve o que quer em linguagem natural e o agente executa contra a API |
| **Eficiência Operacional** | Reduzir tempo de criação de campanhas de horas para minutos — um pedido no chat substitui um wizard de 6 passos |
| **Inteligência Acionável** | O dashboard não mostra apenas números: cada campanha, ad set e anúncio tem um relatório com resumo de performance e insights de melhoria acionáveis |
| **Aprendizagem com os vencedores** | Anúncios de alto desempenho são marcados visualmente e ficam disponíveis como referência tanto para o usuário quanto para o agente de IA |
| **Governança e Compliance** | Garantir conformidade com políticas de anúncios e regulamentações (DSA, LGPD/GDPR) |
| **Escala Segura** | Permitir gestão de múltiplas contas e grandes volumes sem degradação de performance |

### 1.3 Cronograma Estimado

**Premissa de estimativa:** a implementação é feita majoritariamente por **agentes de IA de codificação**, com humanos atuando em especificação, revisão de código, decisões de produto e testes contra a API real. As durações abaixo são **horas humano-equivalentes** e ficam cerca de **4 a 5 vezes menores** do que uma estimativa de desenvolvimento manual tradicional.

| Fase | Duração | Capacidades | Esforço Total |
| --- | --- | --- | --- |
| **MVP** | 2-3 semanas | 12 capacidades | ~72 horas |
| **Fase 2** | 2 semanas | 14 capacidades | ~56 horas |
| **Fase 3** | 2-3 semanas | 12 capacidades | ~76 horas |
| **Futuro** | Contínuo | 8+ capacidades | A definir |
| **Total (MVP → Fase 3)** | **6-8 semanas** | **38 capacidades** | **~204 horas** |

**O que não acelera com IA:** o [App Review da Meta](#81-dependências-externas) para Advanced Access é uma latência externa fixa (tipicamente 2-6 semanas) e deve correr **em paralelo** ao MVP, iniciando no dia 1. Testes de integração contra a API real, aprovação de políticas de anúncios e validação com usuários beta também mantêm duração de calendário independente da velocidade de implementação.

**Escala de esforço por capacidade** (mantida para priorização relativa):

| Esforço | Significado | Horas humano-equivalentes |
| --- | --- | --- |
| **Pequena** | Uma ferramenta do agente ou um bloco de dashboard, sobre endpoints simples | ~2-4 h |
| **Média** | Múltiplos endpoints, estado intermédio ou lógica de agregação | ~5-8 h |
| **Grande** | Orquestração assíncrona, modelagem de domínio nova ou lógica de decisão | ~9-14 h |

---

## 2. Arquitetura de Produto

### 2.1 Princípio: AI-agent-first

O produto tem **exatamente duas superfícies de interface humana**:

| # | Superfície | Natureza | Responsabilidade |
| --- | --- | --- | --- |
| **S1** | **Chat com o agente de IA** | Escrita e leitura | **Única** superfície de ação. Criar, editar, duplicar, pausar, exportar e operar em massa acontece aqui, por linguagem natural |
| **S2** | **Dashboard de monitoramento** | Somente leitura | Acompanhar campanhas, ad sets, anúncios, gasto (€), leads e conversões. Relatórios por objeto com resumo de performance e insights de melhoria. Marcação de anúncios vencedores |

**Não fazem parte do produto:** wizards de criação, formulários de campanha/ad set/anúncio, editores em lote, telas de upload, construtores visuais de targeting, construtores de regras, telas de exportação. Todas essas capacidades existem — mas como **ferramentas (tools) do agente**, invocadas por conversa, não como telas.

```
┌─────────────────────────────┐   ┌──────────────────────────────────┐
│  S1 — CHAT (agente de IA)   │   │  S2 — DASHBOARD (leitura)        │
│                             │   │                                  │
│  "duplica o meu anúncio     │   │  Conta  · gasto (€) · leads      │
│   vencedor e aponta para    │   │  ├─ Campanha  → relatório        │
│   Portugal com €30/dia"     │   │  │   ├─ Ad set → relatório       │
│                             │   │  │   │   ├─ Anúncio 🏆 vencedor  │
│  → confirmação + preview    │   │  │   │   └─ Anúncio ⚠️ fadiga    │
│  → execução na API          │   │                                  │
└─────────────┬───────────────┘   └───────────────┬──────────────────┘
              │                                   │
              │     "Pedir ao agente para aplicar"│
              │◄──────────────────────────────────┘
              ▼
     ┌──────────────────────────────────┐
     │  Camada de ferramentas do agente │
     │  (Meta Marketing API v26.0)      │
     └──────────────────────────────────┘
```

O dashboard e o chat são **circulares**: cada insight de melhoria no dashboard tem uma ação "Pedir ao agente para aplicar", que abre o chat com o pedido pré-preenchido. O usuário revê, ajusta e confirma.

### 2.2 Superfície 1 — Chat com o agente de IA

| Aspecto | Definição |
| --- | --- |
| **Entrada** | Linguagem natural, em texto. Anexos de imagem/vídeo para criativos |
| **Modelos** | **Claude (Anthropic)** como modelo principal de raciocínio e orquestração; **modelos Google (Gemini)** como alternativa configurável e para tarefas multimodais de análise de criativo |
| **Mecanismo** | Tool calling — cada capacidade da Matriz de Capacidades (§3) é exposta ao modelo como uma ferramenta tipada sobre um endpoint da Marketing API |
| **Contexto do agente** | Estrutura da conta (campanhas → ad sets → anúncios), métricas recentes, moeda da conta (`currency`, sempre EUR no produto) e **a lista de anúncios vencedores** (§2.5) |
| **Segurança de escrita** | Nenhuma operação de escrita executa sem confirmação explícita do usuário. Antes de confirmar, o agente mostra um plano legível e, quando aplicável, um dry-run com `execution_options=['validate_only']` e um preview via `GET /act_{id}/generatepreviews` |
| **Operações longas** | Duplicações profundas, criação em massa e relatórios grandes correm de forma assíncrona; o agente informa o progresso e avisa na conclusão |
| **Rastreabilidade** | Cada ação executada fica registrada com o pedido original, as chamadas efetuadas e o resultado |

**Exemplos de pedidos que o produto tem de servir:**

- "Cria uma campanha de leads com €50/dia para Lisboa e Porto, mulheres 25-45."
- "Duplica a campanha *Black Friday* para janeiro, com orçamento de €80/dia e tudo pausado."
- "Quais anúncios têm CPC acima de €2? Pausa-os."
- "Exporta os leads do formulário de contato dos últimos 30 dias em CSV."
- "Usa o meu anúncio vencedor 🏆 como base e cria três variações de texto."

### 2.3 Superfície 2 — Dashboard de monitoramento

Tela única de leitura, com quatro blocos:

| Bloco | Conteúdo | Endpoints |
| --- | --- | --- |
| **B1 — Visão geral da conta** | Gasto no período (€), saldo, `spend_cap`, status da conta, total de leads e conversões, ROAS agregado | `GET /act_{id}`, `GET /act_{id}/insights` |
| **B2 — Árvore de estrutura** | Campanhas → ad sets → anúncios, com status, orçamento (€), gasto (€), impressões, CTR, CPC, resultados e custo por resultado em cada nível | `GET /act_{id}/campaigns`, `/adsets`, `/ads` + `insights` por nível |
| **B3 — Relatório por objeto** | Um relatório para **cada** campanha, **cada** ad set e **cada** anúncio, com resumo de performance e insights de melhoria (§2.4) | `GET /{campaign_id}/insights`, `GET /{adset_id}/insights`, `GET /{ad_id}/insights` |
| **B4 — Leads e conversões** | Volume de leads por formulário/anúncio, conversões por tipo, custo por lead (€) | `GET /{ad_id}/leads`, `GET /{form_id}/leads`, `actions` / `action_values` em insights |

O dashboard **não tem botões de escrita**. Cada recomendação e cada objeto oferecem a ação "Pedir ao agente para aplicar", que transfere o contexto para o chat.

### 2.4 Relatório por objeto (campanha, ad set, anúncio)

Requisito central: **todo objeto dos três níveis tem relatório próprio.** Anatomia:

| Seção do relatório | Conteúdo | Fonte |
| --- | --- | --- |
| **Cabeçalho** | Nome, ID, status, nível, objetivo/optimization goal, período analisado, orçamento (€) | `GET /{object_id}` |
| **Resumo de performance** | `impressions`, `reach`, `frequency`, `spend` (€), `clicks`, `ctr`, `cpc`, `cpm`, `actions`, `conversions`, custo por resultado (€), `purchase_roas` | `GET /{object_id}/insights` |
| **Tendência** | Série temporal do período com `time_increment=1`, para detectar subida de CPA e queda de CTR | `GET /{object_id}/insights` com `time_increment` |
| **Breakdowns** | Idade, gênero, `device_platform`, `publisher_platform`, `platform_position`, `region` — onde o dinheiro (€) está indo e o que está convertendo | `GET /{object_id}/insights` com `breakdowns` |
| **Comparação com pares** | Posição do objeto face à mediana dos irmãos (outros ad sets da campanha, outros anúncios do ad set) | Agregação interna sobre insights |
| **Insights de melhoria** | Diagnóstico + recomendação acionável, cada uma com ação "Pedir ao agente para aplicar" | Motor de regras (§2.4.1) + análise por LLM (Claude / Google) |
| **Referências vencedoras** | Quando o objeto tem desempenho fraco, o relatório mostra o(s) anúncio(s) 🏆 vencedor(es) comparáveis, com o delta de métricas | Marcação de vencedores (§2.5) |

#### 2.4.1 Catálogo inicial de insights de melhoria

| Sinal detectado | Diagnóstico | Recomendação (pedido pré-preenchido no chat) |
| --- | --- | --- |
| `frequency` > 3 e `ctr` em queda ≥ 20% em 7 dias | Fadiga criativa | "Pausa este anúncio e duplica o anúncio vencedor 🏆 para este ad set" |
| `quality_ranking` ou `engagement_rate_ranking` = `BELOW_AVERAGE` | Relevância fraca do criativo | "Cria variações de criativo baseadas no meu anúncio vencedor 🏆" |
| Custo por resultado > 150% da mediana do ad set | Ineficiência de custo | "Pausa este anúncio e realoca o orçamento para o anúncio X" |
| Orçamento diário não gasto e `reach` estagnado | Público estreito demais | "Alarga o targeting deste ad set: adiciona interesses relacionados e sobe a faixa etária" |
| Gasto (€) concentrado em ad set com CPA alto | Má alocação de orçamento | "Baixa o orçamento do ad set X para €Y e sobe o do ad set Z" |
| `publisher_platform` com CPA muito acima dos demais | Placement improdutivo | "Exclui o placement X deste ad set" |
| `actions` sem eventos correspondentes de pixel | Rastreamento quebrado | "Verifica o pixel desta conta e mostra o `last_fired_time`" |
| Anúncio ativo com < 1.000 impressões após 7 dias | Sem entrega (delivery) | "Diagnostica a entrega deste ad set e mostra o delivery estimate" |

### 2.5 Marcação de anúncios vencedores

Anúncios de alto desempenho recebem **marcação visual persistente** no dashboard e ficam disponíveis no contexto do agente de IA como referência.

**Selos:**

| Selo | Significado | Critérios |
| --- | --- | --- |
| 🏆 **Vencedor** | Alto desempenho comprovado e estável | Cumpre volume mínimo + eficiência + estabilidade (abaixo) |
| ⭐ **Alto desempenho** | Bom, mas ainda sem histórico suficiente | Cumpre volume mínimo + eficiência, sem estabilidade |
| ⚠️ **Fadiga** | Foi bom, está degradando | `frequency` subindo e `ctr` caindo ≥ 20% em 7 dias |
| 💤 **Sem sinal** | Dados insuficientes para julgar | Abaixo do volume mínimo |

**Critérios (configuráveis por conta, em EUR):**

| Critério | Regra padrão | Campo de insights |
| --- | --- | --- |
| **Volume mínimo** | ≥ 1.000 impressões **e** ≥ €50 de gasto na janela de 7 dias | `impressions`, `spend` |
| **Eficiência** | Custo por resultado ≤ 75% da mediana do ad set | `cost_per_action_type` |
| **Qualidade** | `quality_ranking` e `engagement_rate_ranking` em `ABOVE_AVERAGE` | `quality_ranking`, `engagement_rate_ranking` |
| **Retorno** | `purchase_roas` ≥ meta da conta, quando há valor de conversão | `purchase_roas`, `action_values` |
| **Estabilidade** | Critérios mantidos em ≥ 2 janelas consecutivas de 7 dias | Série via `time_increment` |

**Consumo pelo agente de IA:** cada anúncio expõe `winner_badge`, `winner_score` e `winner_reasons` no contexto do agente. Isso torna possíveis pedidos como:

- "Duplica o meu anúncio vencedor para a campanha de janeiro."
- "Por que este anúncio é vencedor e o outro não?"
- "Cria três variações de texto a partir do vencedor, mantendo a imagem."
- "Aplica o targeting do vencedor a todos os ad sets desta campanha."

**Consumo pelo humano:** os selos aparecem na árvore (B2), no cabeçalho de cada relatório (B3) e como referência comparativa nos relatórios de objetos com desempenho fraco.

---

## 3. Matriz de Capacidades

Mapeamento completo de endpoints → capacidades técnicas → **pedidos ao agente de IA**.

Convenção de leitura: exceto onde a coluna indicar **Dashboard**, toda capacidade é exposta **apenas** como ferramenta do agente, invocada por conversa. Não existe tela dedicada.

### 3.1 Gestão de Estrutura de Campanhas

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `POST /act_{id}/campaigns` | Criar campanha com objetivo, orçamento, schedule | O usuário pede ao agente para **criar uma campanha** descrevendo objetivo, orçamento (€) e período | MVP |
| `GET /act_{id}/campaigns` | Listar campanhas com filtros | **Dashboard:** árvore de campanhas (B2). O usuário também pode pedir ao agente para listar/filtrar campanhas no chat | MVP |
| `POST /{campaign_id}` | Atualizar campanha (orçamento, status, schedule) | O usuário pede ao agente para **alterar orçamento, status ou período** de uma ou várias campanhas | Fase 2 |
| `POST /{campaign_id}/copies` | Duplicar campanha (deep copy até 51 filhos async) | O usuário pede ao agente para **duplicar uma campanha**, com renomeação, override de orçamento e status | Fase 2 |
| `DELETE /act_{id}/campaigns` | Remover campanhas em batch (`delete_strategy`) | O usuário pede ao agente para **limpar campanhas antigas ou arquivadas**; o agente mostra o impacto e pede confirmação | Fase 3 |
| `POST /act_{id}/async_batch_requests` | Criação assíncrona em massa | O usuário pede ao agente para **criar muitas campanhas de uma vez** a partir de uma descrição ou planilha | Fase 3 |

### 3.2 Gestão de Ad Sets e Targeting

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `POST /act_{id}/adsets` | Criar ad set com budget, bidding, targeting | O usuário pede ao agente para **criar um ad set** descrevendo público, orçamento (€) e otimização | MVP |
| `GET /act_{id}/adsets` | Listar ad sets com filtros de status/date | **Dashboard:** nível intermédio da árvore (B2), com relatório próprio por ad set (B3) | MVP |
| `GET /act_{id}/delivery_estimate` | Estimar reach e delivery por targeting | O usuário pede ao agente para **estimar o alcance** antes de publicar; o agente mostra a estimativa na confirmação | MVP |
| `GET /{version}/search` (`type=adinterest`, `adgeolocation`, …) | Buscar interesses, comportamentos, demografia, geolocalização | O usuário **descreve o público em linguagem natural** e o agente resolve para IDs de targeting, mostrando o que escolheu | Fase 2 |
| `GET /act_{id}/targetingvalidation` | Validar targeting spec | O agente **valida o targeting automaticamente** antes de escrever e reporta restrições (EU DSA, opções depreciadas) | Fase 2 |
| `POST /{adset_id}/copies` | Duplicar ad sets | O usuário pede ao agente para **duplicar ad sets**, preservando targeting e specs | Fase 2 |

### 3.3 Criação e Gestão de Anúncios

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `POST /act_{id}/ads` | Criar anúncio com creative e adset | O usuário pede ao agente para **criar um anúncio**, anexando ou descrevendo o criativo | MVP |
| `GET /act_{id}/ads` | Listar anúncios por campanha/adset | **Dashboard:** nível folha da árvore (B2), com relatório próprio e selo de vencedor (B3, §2.5) | MVP |
| `POST /{ad_id}/copies` | Duplicar anúncio | O usuário pede ao agente para **duplicar um anúncio** — tipicamente "duplica o meu vencedor 🏆 para o ad set X" | Fase 2 |
| `POST /act_{id}/asyncadrequestsets` | Criação assíncrona de múltiplos ads | O usuário pede ao agente para **criar dezenas ou centenas de anúncios** de uma vez; o agente acompanha o job e avisa ao concluir | Fase 3 |
| `GET /act_{id}/generatepreviews` | Preview de criativo antes de criar | O agente **mostra o preview no chat** antes de pedir confirmação, em vários `ad_format` | MVP |

### 3.4 Criativos e Assets

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `POST /act_{id}/adcreatives` | Criar criativo com `object_story_spec` | O usuário pede ao agente para **montar o criativo** descrevendo texto, título, CTA e destino | MVP |
| `GET /act_{id}/adcreatives` | Listar criativos | O usuário pede ao agente para **reutilizar um criativo existente**; o agente lista e sugere, priorizando os de anúncios vencedores | MVP |
| `POST /act_{id}/adimages` | Upload de imagens (Base64 ou `copy_from`) | O usuário **anexa a imagem no chat** e o agente faz o upload e usa o `hash` no criativo | MVP |
| `POST /act_{id}/advideos` | Upload de vídeos (chunked/resumable) | O usuário **anexa o vídeo no chat**; o agente gerencia o upload em chunks e reporta o progresso | Fase 2 |
| `POST /act_{id}/adcreatives` com `asset_feed_spec` | Dynamic Creative com variações | O usuário pede ao agente para **gerar variações** de imagem, texto e CTA; o agente monta o `asset_feed_spec` | Fase 3 |
| `GET /act_{id}/instagram_accounts` | Listar contas Instagram conectadas | O agente **resolve a conta Instagram** a usar; pergunta apenas se houver ambiguidade | MVP |

### 3.5 Audiências e Segmentação

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `POST /act_{id}/customaudiences` | Criar audiência customizada (website, app, engagement, lookalike) | O usuário pede ao agente para **criar uma audiência**, descrevendo a origem e a janela de retenção | Fase 2 |
| `GET /act_{id}/customaudiences` | Listar audiências com health status | O usuário pede ao agente para **mostrar as audiências e a saúde delas** (`operation_status`, `delivery_status`, `approximate_count`) | Fase 2 |
| `POST /{audience_id}/users` | Adicionar usuários hashados (SHA-256) | O usuário **anexa a lista de clientes no chat**; o agente faz o hashing SHA-256 do lado do servidor e envia | Fase 2 |
| `POST /act_{id}/customaudiences` com `lookalike_spec` | Criar lookalike a partir de origem | O usuário pede ao agente para **criar um lookalike**, indicando origem, país e ratio | Fase 2 |
| `GET /act_{id}/saved_audiences` | Listar audiências salvas | O usuário pede ao agente para **reaproveitar uma audiência salva** em um novo ad set | Fase 3 |
| `GET /act_{id}/broadtargetingcategories` | Explorar categorias de targeting | O agente **sugere categorias de targeting** relevantes quando o usuário descreve o público de forma vaga | Fase 2 |

### 3.6 Insights e Reporting

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `GET /act_{id}/insights` (sync) | Ler métricas síncronas (impressions, spend, clicks, conversions) | **Dashboard:** visão geral da conta (B1), em EUR | MVP |
| `GET /{campaign_id}/insights` | Insights por nível de campanha | **Dashboard:** relatório de campanha com resumo de performance e insights de melhoria (B3) | MVP |
| `GET /{adset_id}/insights` | Insights por nível de ad set | **Dashboard:** relatório de ad set com resumo de performance e insights de melhoria (B3) | MVP |
| `GET /{ad_id}/insights` | Insights por nível de anúncio | **Dashboard:** relatório de anúncio com resumo, insights de melhoria e **selo de vencedor** (B3, §2.5) | MVP |
| `GET /{object_id}/insights` com `time_increment` | Série temporal por objeto | **Dashboard:** bloco de tendência de cada relatório; alimenta a detecção de fadiga e de estabilidade do vencedor | MVP |
| `GET /{object_id}/insights` com `breakdowns` | Segmentar por idade, gênero, dispositivo, placement, região | **Dashboard:** bloco de breakdowns de cada relatório. O usuário também pode pedir cortes ad-hoc ao agente | Fase 2 |
| `POST /act_{id}/insights` (async) | Relatório assíncrono para grandes volumes | O usuário pede ao agente um **relatório grande**; o agente submete o job, acompanha `async_status` e entrega ao concluir | Fase 2 |
| `POST /act_{id}/insights` com `export_format` | Exportar dados (CSV/XLS) | O usuário pede ao agente para **exportar os dados**; o agente devolve o ficheiro no chat | Fase 2 |

### 3.7 Conversion Tracking (Pixel + CAPI)

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `GET /act_{id}/adspixels` | Listar pixels da conta | O usuário pede ao agente para **mostrar os pixels e o `last_fired_time`**; usado no diagnóstico de rastreamento quebrado (§2.4.1) | Fase 2 |
| `POST /act_{id}/adspixels` | Criar novo pixel | O usuário pede ao agente para **criar um pixel**; o agente devolve o `code` do snippet no chat | Fase 2 |
| `POST /{pixel_id}/events` | Enviar eventos server-side (CAPI) | O usuário pede ao agente para **configurar o envio server-side**, com hashing SHA-256 e deduplicação por `event_id` | Fase 3 |
| `GET /act_{id}/customconversions` | Listar conversões customizadas | O usuário pede ao agente para **mostrar as conversões customizadas** e a que campanhas estão ligadas | Fase 2 |
| `POST /act_{id}/customconversions` | Criar regra de conversão customizada | O usuário pede ao agente para **criar uma conversão customizada**, descrevendo a regra de URL e o valor padrão (€) | Fase 3 |

### 3.8 Automação e Regras

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `POST /act_{id}/adrules_library` | Criar regra automatizada (`evaluation_spec`, `execution_spec`, `schedule_spec`) | O usuário **descreve a regra em linguagem natural** ("pausa qualquer anúncio com CPC acima de €2 depois de 1.000 impressões") e o agente monta a spec | Fase 3 |
| `GET /act_{id}/adrules_library` | Listar regras ativas | O usuário pede ao agente para **mostrar as regras ativas** e o que cada uma faz, em linguagem simples | Fase 3 |
| `GET /{ad_rule_id}/preview` | Prever quais objetos seriam afetados | O agente **mostra o preview de impacto** antes de o usuário confirmar a criação da regra | Fase 3 |
| `POST /{ad_rule_id}/execute` | Executar regra manualmente | O usuário pede ao agente para **executar uma regra agora** | Fase 3 |
| `GET /{ad_rule_id}/history` | Histórico de execuções | O usuário pede ao agente para **mostrar o que a regra fez** e quando | Fase 3 |
| `POST /act_{id}/adlabels` + `POST /{object_id}/adlabels` | Criar e associar labels | O usuário pede ao agente para **etiquetar objetos** ("marca todos os anúncios de retargeting com a label RTG") | Fase 2 |
| `GET /act_{id}/campaignsbylabels` | Filtrar objetos por label | O usuário pede ao agente para **operar sobre um conjunto por label** ("pausa tudo com a label Black Friday") | Fase 2 |

### 3.9 Catálogos e Commerce

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `GET /owned_product_catalogs` | Listar catálogos de produtos | O usuário pede ao agente para **mostrar os catálogos disponíveis** no Business Manager | Fase 3 |
| `GET /{catalog_id}/products` | Listar produtos no catálogo | O usuário pede ao agente para **procurar produtos** no catálogo por nome, categoria ou disponibilidade | Fase 3 |
| `POST /{catalog_id}/product_sets` | Criar conjuntos de produtos | O usuário pede ao agente para **criar um conjunto de produtos** a partir de um filtro descrito em linguagem natural | Fase 3 |
| `GET /{catalog_id}/external_event_sources` | Fontes de eventos externas | O agente **verifica as fontes de sinal ligadas ao catálogo** ao diagnosticar campanhas de catálogo | Fase 3 |

### 3.10 Lead Ads

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `GET /{ad_id}/leads` | Listar leads de um anúncio | **Dashboard:** bloco de leads e conversões (B4), com custo por lead em euros | Fase 3 |
| `GET /{form_id}/leads` | Listar leads por formulário | **Dashboard:** volume por formulário (B4). O usuário também pode pedir ao agente para filtrar leads no chat | Fase 3 |
| `GET /ads/lead_gen/export_csv/` | Exportar leads em CSV | O usuário pede ao agente para **exportar os leads** de um período; o agente devolve o CSV no chat | Fase 3 |
| Webhook `leadgen` | Receber leads em tempo real | O usuário pede ao agente para **ativar a receção de leads em tempo real**; o dashboard passa a atualizar sem polling | Futuro |

### 3.11 Business Manager e Governança

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| `GET /act_{id}` | Ler metadados, saldo, `currency`, `spend_cap` | **Dashboard:** visão geral da conta (B1). O produto valida que `currency` = `EUR` e alerta quando não for | MVP |
| `GET /{business_id}/owned_ad_accounts` | Listar contas de anúncio | O usuário pede ao agente para **trocar de conta** ou comparar contas; o dashboard reflete a seleção | MVP |
| `POST /{object_id}/assigned_users` | Atribuir usuários com permissões | O usuário pede ao agente para **dar ou remover acesso** a um usuário sobre uma conta ou ativo | Fase 2 |
| `GET /{object_id}/assigned_users` | Listar usuários por conta | O usuário pede ao agente para **auditar quem tem acesso** a quê | Fase 2 |
| `GET /act_{id}/activities` | Log de atividades da conta | O usuário pede ao agente para **investigar quem alterou o quê e quando** | Fase 3 |
| `POST /{business_id}/adaccount` | Criar nova conta de anúncio | O usuário pede ao agente para **provisionar uma nova conta** de anúncio | Futuro |

### 3.12 Versionamento e Compatibilidade

| Endpoint | Capacidade Técnica | Capacidade no produto | Fase |
| --- | --- | --- | --- |
| Version pinning (`v26.0`) | Controle explícito de versão | Camada de API com versão fixada; o agente nunca chama uma versão não pinada | Fase 2 |
| Monitorar changelog | Detectar breaking changes | O agente **avisa no chat** quando um endpoint ou campo em uso entra em depreciação | Fase 3 |

---

## 4. MVP

**Objetivo:** ter as duas superfícies de pé — um agente de IA capaz de criar a estrutura completa de anúncios por conversa, e um dashboard que já traz relatório por objeto e marcação de vencedores.

### 4.1 Capacidades MVP

| # | Capacidade | Descrição | Dependências | Esforço |
| --- | --- | --- | --- | --- |
| **MVP-01** | **Núcleo do agente de IA (chat)** | Interface de chat, loop de tool calling com **Claude (Anthropic)** e **modelos Google (Gemini)** como alternativa, contexto da conta, memória da conversa, fluxo de confirmação antes de qualquer escrita. | Camada de API v26.0, autenticação | Grande |
| **MVP-02** | **Dashboard de monitoramento** | Tela única de leitura: visão geral da conta em euros (B1) e árvore campanhas → ad sets → anúncios com métricas por nível (B2). | `GET /act_{id}`, `/campaigns`, `/adsets`, `/ads`, `/insights` | Grande |
| **MVP-03** | **Relatório por objeto** | Relatório para cada campanha, ad set e anúncio: cabeçalho, resumo de performance (€), tendência e comparação com pares (B3). | `GET /{object_id}/insights`, `time_increment` | Grande |
| **MVP-04** | **Insights de melhoria** | Motor de diagnóstico do catálogo inicial (§2.4.1), com recomendação acionável e ação "Pedir ao agente para aplicar" que pré-preenche o chat. | MVP-03, MVP-01 | Média |
| **MVP-05** | **Marcação de anúncios vencedores** | Cálculo de `winner_score`, atribuição de selos (🏆 ⭐ ⚠️ 💤), exibição no dashboard e injeção de `winner_badge`/`winner_reasons` no contexto do agente. | MVP-03, `quality_ranking`, `cost_per_action_type` | Média |
| **MVP-06** | **Ferramenta: criar campanha** | O agente cria campanhas a partir de descrição em linguagem natural: objetivo `OUTCOME_*`, orçamento CBO/ABO em euros, schedule, `special_ad_categories`. | `POST /act_{id}/campaigns` | Média |
| **MVP-07** | **Ferramenta: criar ad set** | O agente cria ad sets: budget diário/lifetime (€), bidding strategy, `optimization_goal`, targeting básico (geo, idade, gênero). | `POST /act_{id}/adsets` | Média |
| **MVP-08** | **Ferramenta: criar anúncio e criativo** | O agente monta `object_story_spec`, faz upload de imagem anexada no chat e cria o anúncio ligado ao ad set. | `POST /act_{id}/ads`, `/adcreatives`, `/adimages` | Grande |
| **MVP-09** | **Ferramenta: preview no chat** | O agente mostra como o anúncio ficará em vários placements antes da confirmação (Facebook Feed, Instagram Feed, Stories, Reels). | `GET /act_{id}/generatepreviews` | Pequena |
| **MVP-10** | **Ferramenta: consulta de insights** | O usuário faz perguntas de performance no chat e o agente responde com dados reais em euros ("qual campanha teve o CPA mais baixo em julho?"). | `GET /insights` (todos os níveis) | Média |
| **MVP-11** | **Ferramenta: contas, moeda e Instagram** | O agente resolve conta de anúncio, valida `currency` = `EUR` e seleciona a conta Instagram a usar. | `GET /act_{id}`, `/owned_ad_accounts`, `/instagram_accounts` | Pequena |
| **MVP-12** | **Dry-run e estimativa antes de escrever** | Antes de confirmar, o agente valida com `execution_options=['validate_only']` e mostra o delivery estimate do targeting. | `validate_only`, `GET /act_{id}/delivery_estimate` | Pequena |

**Total MVP: ~72 horas humano-equivalentes / 2-3 semanas.**

### 4.2 Critérios de Aceite MVP

- [ ] Criar a estrutura completa (campanha → ad set → anúncio) a partir de **um único pedido em linguagem natural**, em menos de 2 minutos
- [ ] Nenhuma operação de escrita executa sem confirmação explícita, sempre precedida de dry-run e preview
- [ ] Dashboard mostra campanhas, ad sets, anúncios, gasto (€), leads e conversões em uma única tela
- [ ] **Cada** campanha, **cada** ad set e **cada** anúncio tem relatório próprio com resumo de performance e ao menos um insight de melhoria acionável quando aplicável
- [ ] Anúncios vencedores exibem selo 🏆 no dashboard **e** são referenciáveis no chat ("duplica o meu anúncio vencedor")
- [ ] Todos os valores monetários são apresentados em EUR (€)
- [ ] Preview de anúncio em 3+ placements diferentes dentro do chat
- [ ] Reach estimate com margem de erro < 20% vs delivery real
- [ ] Suportar v26.0 com version pinning explícito

### 4.3 Riscos MVP

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Agente executa escrita não intencionada na conta | Crítico | Confirmação obrigatória, `validate_only` antes de toda escrita, teto de orçamento por operação (€), log completo de ações |
| Agente alucina IDs de targeting ou de objetos | Alto | Nenhum ID é gerado pelo modelo — todos vêm de `GET /{version}/search` e das listagens; validação de existência antes de escrever |
| Rate limiting em `GET /insights` | Alto | Cache de 15 min alinhado à atualização oficial da Meta; dashboard lê do cache, não da API |
| Erros de permissão `ads_management` | Alto | Fluxo claro de solicitação de permissões no onboarding; App Review iniciado no dia 1 |
| Marcação de vencedor com falso positivo | Médio | Volume mínimo (1.000 impressões, €50) e exigência de estabilidade em 2 janelas antes do selo 🏆 |
| Ambiguidade em linguagem natural leva a config errada | Médio | O agente restata o plano em linguagem estruturada antes de confirmar; usuários beta em loop de feedback |
| Breaking changes da API | Médio | Monitorar changelog semanalmente, feature flags por versão |

---

## 5. Fase 2

**Objetivo:** automação e escala — o agente passa a operar sobre conjuntos (duplicação, edição em lote, audiências, exportação) e o dashboard ganha profundidade analítica.

### 5.1 Capacidades Fase 2

| # | Capacidade | Descrição | Dependências | Esforço |
| --- | --- | --- | --- | --- |
| **F2-01** | **Duplicar campanhas** | O usuário pede ao agente para duplicar uma campanha, com deep copy (até 3 filhos sync, 51 async), `rename_options`, override de status e de orçamento (€). | `POST /{campaign_id}/copies`, `POST /act_{id}/async_batch_requests` | Média |
| **F2-02** | **Duplicar ad sets** | O usuário pede ao agente para copiar ad sets, individualmente ou em conjunto, preservando targeting. | `POST /{adset_id}/copies` | Pequena |
| **F2-03** | **Duplicar anúncios (a partir do vencedor)** | O usuário pede ao agente para copiar anúncios entre ad sets. Caso de uso principal: "duplica o meu anúncio vencedor 🏆 para o ad set X". | `POST /{ad_id}/copies`, MVP-05 | Pequena |
| **F2-04** | **Editar em lote por conversa** | O usuário pede ao agente para alterar muitos objetos de uma vez ("pausa tudo com CPC acima de €2", "sobe 20% o orçamento das campanhas de Lisboa"); o agente resolve o conjunto, mostra o impacto e executa. | `POST /{campaign_id}`, `/{adset_id}`, `/{ad_id}`, batch | Média |
| **F2-05** | **Targeting por linguagem natural** | O usuário descreve o público e o agente resolve interesses, comportamentos, demografia e geolocalização para IDs reais, mostrando `audience_size` de cada escolha. | `GET /{version}/search`, `GET /act_{id}/broadtargetingcategories` | Média |
| **F2-06** | **Validação automática de targeting** | O agente valida a spec antes de escrever e reporta restrições (EU DSA, opções `DEPRECATING`/`NON-DELIVERABLE`). | `GET /act_{id}/targetingvalidation`, `type=targetingoptionstatus` | Pequena |
| **F2-07** | **Criar audiências por conversa** | O usuário pede ao agente para criar custom audiences (website, app, engagement, customer file) e anexa a lista de clientes no chat; o agente faz o hashing SHA-256 no servidor. | `POST /act_{id}/customaudiences`, `POST /{audience_id}/users` | Grande |
| **F2-08** | **Saúde de audiências** | O usuário pergunta ao agente sobre a saúde das audiências e recebe `operation_status`, `delivery_status`, `approximate_count` e retention days, em linguagem simples. | `GET /act_{id}/customaudiences` | Média |
| **F2-09** | **Criar lookalikes por conversa** | O usuário pede ao agente para gerar lookalikes a partir de uma origem (custom audience, pixel, page), indicando país e ratio. | `POST /act_{id}/customaudiences` com `lookalike_spec` | Média |
| **F2-10** | **Upload de vídeo pelo chat** | O usuário anexa um vídeo; o agente gerencia upload chunked/resumable e reporta progresso. | `POST /act_{id}/advideos` | Média |
| **F2-11** | **Breakdowns no relatório e no chat** | **Dashboard:** bloco de breakdowns em cada relatório por objeto (idade, gênero, `device_platform`, `publisher_platform`, `platform_position`, `region`). No chat, o usuário pede cortes ad-hoc. | `GET /{object_id}/insights` com `breakdowns` | Média |
| **F2-12** | **Exportar relatórios por conversa** | O usuário pede ao agente para exportar dados; o agente submete o job assíncrono quando o volume exige, acompanha `async_status` e devolve o CSV/XLS no chat. | `POST /act_{id}/insights` com `export_format`, async | Média |
| **F2-13** | **Labels por conversa** | O usuário pede ao agente para etiquetar objetos e depois opera sobre conjuntos por label ("pausa tudo com a label Black Friday"). | `POST /act_{id}/adlabels`, `POST /{object_id}/adlabels`, `GET /act_{id}/campaignsbylabels` | Pequena |
| **F2-14** | **Pixels, conversões e acessos** | O usuário pede ao agente para listar/criar pixels, ver o snippet e o `last_fired_time`, listar conversões customizadas e auditar acessos de usuários. | `GET/POST /act_{id}/adspixels`, `GET /act_{id}/customconversions`, `GET/POST /{object_id}/assigned_users` | Média |

**Total Fase 2: ~56 horas humano-equivalentes / 2 semanas.**

### 5.2 Critérios de Aceite Fase 2

- [ ] Duplicar uma campanha com 10+ ad sets a partir de um pedido no chat, em menos de 2 minutos (async, com aviso na conclusão)
- [ ] Alterar o orçamento de 50+ campanhas com **um único pedido** em linguagem natural, com preview do conjunto afetado antes de executar
- [ ] Descrever um público em português corrente e obter 5+ interesses resolvidos para IDs reais em menos de 1 minuto
- [ ] Criar uma lookalike audience com **um pedido** no chat
- [ ] "Duplica o meu anúncio vencedor para o ad set X" funciona sem o usuário precisar indicar IDs
- [ ] Exportar relatório com 12 meses de dados e recebê-lo no chat em menos de 30 segundos (ou com job assíncrono acompanhado)
- [ ] Relatório de cada objeto mostra breakdowns com valores em EUR (€)

### 5.3 Riscos Fase 2

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Operação em lote atinge conjunto maior do que o usuário esperava | Crítico | O agente lista o conjunto resolvido e o gasto diário total afetado (€) antes de executar; confirmação obrigatória |
| Custom audience flagged (integrity policy) | Alto | Alerta preventivo do agente no chat, guia de conformidade, verificação de `delivery_status` |
| Rate limit em bulk operations | Alto | Fila de processamento, backoff exponencial, respeito ao limite de 50 requests por batch |
| Batch com múltiplos ad sets da mesma campanha é rejeitado | Médio | Particionamento automático dos batches por campanha na camada de API |
| Upload de vídeo falhar (tamanho excessivo) | Médio | Validação prévia, retry automático, fallback para URL |
| Lookalike falhar por audiência de origem pequena | Médio | O agente valida `approximate_count` mínimo antes de criar e explica o bloqueio |

---

## 6. Fase 3

**Objetivo:** inteligência e otimização — o agente ganha capacidades de automação persistente, criação em massa e medição server-side; o dashboard incorpora leads e conversões.

### 6.1 Capacidades Fase 3

| # | Capacidade | Descrição | Dependências | Esforço |
| --- | --- | --- | --- | --- |
| **F3-01** | **Regras automatizadas por conversa** | O usuário descreve a regra em linguagem natural ("pausa qualquer anúncio com CPC acima de €2 depois de 1.000 impressões, verificação diária") e o agente monta `evaluation_spec`, `execution_spec` e `schedule_spec`. | `POST /act_{id}/adrules_library` | Grande |
| **F3-02** | **Gerir e explicar regras** | O usuário pede ao agente para listar regras, explicar o que cada uma faz, prever o impacto (`/preview`), executar manualmente e ver o histórico. | `GET /act_{id}/adrules_library`, `GET /{rule_id}/preview`, `/history`, `POST /{rule_id}/execute` | Média |
| **F3-03** | **Criação em massa de anúncios** | O usuário pede dezenas ou centenas de anúncios de uma vez; o agente usa `asyncadrequestsets`, acompanha o job e reporta sucessos e falhas individualmente. | `POST /act_{id}/asyncadrequestsets` | Grande |
| **F3-04** | **Variações de criativo (Dynamic Creative)** | O usuário pede variações a partir de um criativo — tipicamente do anúncio vencedor 🏆 — e o agente monta `asset_feed_spec` e mostra previews das combinações. | `POST /act_{id}/adcreatives` com `asset_feed_spec`, MVP-05 | Grande |
| **F3-05** | **Conversions API (CAPI)** | O usuário pede ao agente para configurar envio server-side de eventos, com hashing SHA-256 e deduplicação por `event_id`. | `POST /{pixel_id}/events` | Grande |
| **F3-06** | **Conversões customizadas por conversa** | O usuário descreve a regra de conversão (URL, tipo de evento, valor padrão em €) e o agente cria a custom conversion. | `POST /act_{id}/customconversions` | Média |
| **F3-07** | **Catálogos e conjuntos de produtos** | O usuário pede ao agente para explorar catálogos, procurar produtos e criar product sets a partir de um filtro descrito em linguagem natural. | `GET /owned_product_catalogs`, `/products`, `POST /product_sets` | Média |
| **F3-08** | **Leads no dashboard e no chat** | **Dashboard:** bloco B4 com leads por formulário/anúncio e custo por lead (€). No chat, o usuário filtra e exporta leads em CSV. | `GET /{ad_id}/leads`, `GET /{form_id}/leads`, `GET /ads/lead_gen/export_csv/` | Média |
| **F3-09** | **Limpeza de campanhas por conversa** | O usuário pede ao agente para remover campanhas antigas ou arquivadas; o agente usa `delete_strategy` e mostra o impacto antes de confirmar. | `DELETE /act_{id}/campaigns` | Pequena |
| **F3-10** | **Auditoria de atividades** | O usuário pergunta ao agente quem alterou o quê e quando; o agente lê o log de atividades e responde em linguagem simples. | `GET /act_{id}/activities` | Pequena |
| **F3-11** | **Alerta de depreciação** | O agente avisa proativamente no chat quando um endpoint ou campo em uso entra em depreciação no changelog da API. | Monitoramento do changelog | Pequena |
| **F3-12** | **Relatórios assíncronos grandes** | O usuário pede um relatório de grande volume; o agente submete o job, faz polling de `async_status` e notifica ao concluir. | `POST /act_{id}/insights` async | Média |

**Total Fase 3: ~76 horas humano-equivalentes / 2-3 semanas.**

### 6.2 Critérios de Aceite Fase 3

- [ ] Criar, a partir de um pedido em português corrente, uma regra que pausa anúncios com **CPC > €5** após 1.000 impressões — com preview de impacto antes de ativar
- [ ] Processar 500+ anúncios em criação assíncrona em menos de 10 minutos, com relatório de falhas individuais no chat
- [ ] Enviar evento CAPI com latência < 2 segundos
- [ ] Gerar relatório assíncrono de 12 meses em menos de 5 minutos, com notificação na conclusão
- [ ] Bloco de leads do dashboard mostra custo por lead em EUR (€) por formulário e por anúncio
- [ ] Detectar 100% dos campos depreciados em uso antes da expiração e avisar no chat

### 6.3 Riscos Fase 3

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| Regra criada por conversa não corresponde à intenção do usuário | Crítico | O agente restata a regra em linguagem estruturada, mostra `/preview` do conjunto afetado e exige confirmação; regras nascem `DISABLED` até aprovação |
| Regras automatizadas causarem gasto indesejado | Crítico | Teto máximo de alteração de orçamento por execução (€), sandbox de teste, notificação a cada execução |
| Eventos CAPI duplicados (sem dedup) | Alto | `event_id` único obrigatório, log de duplicatas, reconciliação com eventos de pixel |
| Webhook de leads falhar (downtime) | Alto | Retry com backoff, fallback para polling |
| Catálogo grande (>10k produtos) degradar a resposta do agente | Médio | Paginação, busca server-side, o agente devolve amostras em vez de listas completas |
| `report_run_id` expirar (30 dias) | Baixo | Não persistir o ID a longo prazo; re-submeter o job quando necessário |

---

## 7. Futuro

**Objetivo:** inovação e diferenciação — capacidades que posicionam o MetaManager como líder de mercado.

### 7.1 Capacidades Futuras

| # | Capacidade | Descrição | Dependências | Prioridade |
| --- | --- | --- | --- | --- |
| **FUT-01** | **Copywriting generativo** | O usuário pede ao agente para gerar títulos, descrições e CTAs a partir do objetivo, do público e do histórico de anúncios vencedores 🏆. | **Claude (Anthropic)** e modelos **Google (Gemini)** | Alta |
| **FUT-02** | **Assistente de criativo multimodal** | O agente analisa as imagens e vídeos dos anúncios vencedores e sugere combinações de criativo + texto com maior probabilidade de desempenho. | Análise multimodal (Claude / Google), `asset_feed_spec`, MVP-05 | Alta |
| **FUT-03** | **Otimizador de orçamento** | O agente recomenda realocação de orçamento (€) entre campanhas com base em ROAS marginal, e executa mediante confirmação. | `GET /insights` com `action_values`, `purchase_roas` | Alta |
| **FUT-04** | **Benchmark de mercado** | O dashboard compara a performance da conta com benchmarks de indústria (anonimizados e agregados). | Dados agregados de usuários opt-in | Média |
| **FUT-05** | **Agendamento inteligente** | O agente sugere horários de início e término com base no histórico de entrega por hora. | `GET /insights` com breakdown `hourly_stats_aggregated_by_advertiser_time_zone` | Média |
| **FUT-06** | **Score preditivo de criativo** | Score de qualidade previsto antes de publicar, exibido no preview do chat e no dashboard. | ML treinado sobre `quality_ranking` histórico | Alta |
| **FUT-07** | **Sincronização multi-conta** | O usuário pede ao agente para replicar campanhas vencedoras entre múltiplas contas (agências). | `POST /{campaign_id}/copies` cross-account | Média |
| **FUT-08** | **Anúncios com destino WhatsApp** | O usuário pede ao agente para criar anúncios com destino WhatsApp. | `POST /act_{id}/adcreatives` com `wamo_whatsapp_identity_spec` | Baixa |

### 7.2 Diferenciais Competitivos

| Diferencial | Descrição |
| --- | --- |
| **Interface conversacional única** | Não é um painel com um chatbot colado ao lado: o chat **é** a interface de operação. Sem wizards, sem formulários |
| **Aprendizagem com vencedores** | Anúncios de alto desempenho são identificados automaticamente e viram referência de primeira classe para o usuário e para o agente |
| **Relatório em todo nível** | Cada campanha, ad set e anúncio tem relatório com diagnóstico e recomendação acionável — não só números |
| **Cross-Account** | Gestão unificada para agências com 10+ contas de anúncio |
| **Compliance First** | Conformidade com DSA, LGPD e GDPR embutida no produto |
| **Real-Time** | Webhooks e atualizações em tempo real, não polling |

---

## 8. Dependências e Riscos

### 8.1 Dependências Externas

| Dependência | Tipo | Criticidade | Mitigação |
| --- | --- | --- | --- |
| **Meta Marketing API** | API externa | Crítica | Monitorar status, fallback para versão anterior |
| **App Review (Advanced Access)** | Aprovação manual | Alta | **Não acelera com IA** — iniciar no dia 1, em paralelo ao MVP; documentar caso de uso |
| **Modelos de IA (Claude / Google)** | Serviço externo | Crítica | Camada de abstração de provedor; Claude como principal e modelos Google como fallback configurável; degradação graciosa para modo somente-leitura se ambos indisponíveis |
| **User Access Tokens** | Autenticação | Alta | Fluxo de refresh automático, fallback para system user |
| **Rate Limits (BUC)** | Quota | Alta | Cache agressivo, fila de requests, backoff |
| **v26.0+ Breaking Changes** | Versionamento | Média | Feature flags por versão, monitoramento de changelog |

### 8.2 Riscos Técnicos

| Risco | Probabilidade | Impacto | Plano de Contingência |
| --- | --- | --- | --- |
| Agente interpreta mal um pedido e escreve na conta errada | Média | Crítico | Conta ativa sempre explícita na confirmação; escrita bloqueada quando há mais de uma conta candidata |
| Agente alucina parâmetros ou IDs | Média | Alto | Ferramentas tipadas com schema estrito; IDs sempre vindos da API; `validate_only` antes de toda escrita |
| API retorna dados inconsistentes | Média | Médio | Validação de schema, retry com backoff |
| Rate limit bloqueia operações críticas | Alta | Alto | Priorização de fila, cache do dashboard, alerta proativo |
| Token expira durante operação longa | Média | Médio | Refresh preventivo, checkpoint de estado |
| Async job falha sem notificação | Baixa | Médio | Polling de fallback, timeout com retry |
| Custo de inferência dos modelos cresce com o uso | Média | Médio | Cache de contexto, roteamento por complexidade entre modelos Claude e Google, limites por conta |

### 8.3 Riscos de Negócio

| Risco | Probabilidade | Impacto | Plano de Contingência |
| --- | --- | --- | --- |
| Usuário não confia em delegar escrita a um agente | Média | Alto | Confirmação obrigatória, preview e dry-run visíveis, log de auditoria completo, modo somente-leitura no onboarding |
| Concorrente lança interface conversacional similar | Média | Médio | Acelerar roadmap; diferenciar pela qualidade dos insights e pela marcação de vencedores |
| Mudança regulatória (DSA, LGPD, GDPR) | Alta | Alto | Compliance embutido, atualização contínua |
| Meta remove endpoint crítico | Baixa | Crítico | Abstração da camada de API, monitoramento de changelog |
| Churn de usuários por respostas imprecisas do agente | Média | Alto | Avaliação contínua da qualidade do agente com conjuntos de teste, telemetria de correções do usuário, fallback para pergunta de esclarecimento em vez de suposição |

### 8.4 Matriz de Esforço vs. Valor

```
                    VALOR DE NEGÓCIO
                    Baixo     Alto
                    ┌─────────┬─────────┐
              Alto  │ F3-07   │ MVP-01  │
                    │ F3-11   │ MVP-02  │
      ESFORÇO       │         │ MVP-03  │
                    │         │ F2-07   │
                    │         │ FUT-01  │
                    ├─────────┼─────────┤
              Baixo │ MVP-11  │ MVP-05  │
                    │ F2-13   │ MVP-04  │
                    │ F3-09   │ F2-03   │
                    │ F3-10   │ F2-01   │
                    └─────────┴─────────┘
```

**Priorização recomendada:** o quadrante Alto Valor / Baixo Esforço primeiro — com destaque para **MVP-05 (marcação de vencedores)** e **MVP-04 (insights de melhoria)**, que são baratos porque assentam sobre insights já lidos para o dashboard e são o que diferencia o produto. Em seguida, Alto Valor / Alto Esforço.

---

## 9. Apêndice: Endpoints por Categoria

### 9.1 Endpoints Core (MVP)

| Categoria | Endpoints |
| --- | --- |
| **Conta** | `GET /act_{AD_ACCOUNT_ID}` (inclui `currency`, `balance`, `spend_cap`), `GET /{BUSINESS_ID}/owned_ad_accounts` |
| **Campanhas** | `GET/POST /act_{AD_ACCOUNT_ID}/campaigns`, `POST /{CAMPAIGN_ID}`, `POST /{CAMPAIGN_ID}/copies`, `DELETE /act_{AD_ACCOUNT_ID}/campaigns` |
| **Ad Sets** | `GET/POST /act_{AD_ACCOUNT_ID}/adsets`, `POST /{ADSET_ID}`, `POST /{ADSET_ID}/copies` |
| **Anúncios** | `GET/POST /act_{AD_ACCOUNT_ID}/ads`, `POST /{AD_ID}`, `POST /{AD_ID}/copies` |
| **Criativos** | `GET/POST /act_{AD_ACCOUNT_ID}/adcreatives`, `POST /act_{AD_ACCOUNT_ID}/adimages`, `POST /act_{AD_ACCOUNT_ID}/advideos` |
| **Insights** | `GET /act_{AD_ACCOUNT_ID}/insights`, `GET /{CAMPAIGN_ID}/insights`, `GET /{ADSET_ID}/insights`, `GET /{AD_ID}/insights` |
| **Estimates** | `GET /act_{AD_ACCOUNT_ID}/delivery_estimate`, `GET /act_{AD_ACCOUNT_ID}/reachestimate`, `GET /act_{AD_ACCOUNT_ID}/minimum_budgets` |
| **Targeting** | `GET /{VERSION}/search` (`type=adgeolocation`, `adinterest`, `adTargetingCategory`) |
| **Preview** | `GET /act_{AD_ACCOUNT_ID}/generatepreviews`, `GET /{AD_ID}/previews` |
| **Instagram** | `GET /act_{AD_ACCOUNT_ID}/instagram_accounts` |

### 9.2 Endpoints Avançados (Fase 2-3)

| Categoria | Endpoints |
| --- | --- |
| **Audiências** | `GET/POST /act_{AD_ACCOUNT_ID}/customaudiences`, `POST /{CUSTOM_AUDIENCE_ID}/users`, `DELETE /{CUSTOM_AUDIENCE_ID}/users`, `POST /{CUSTOM_AUDIENCE_ID}/usersreplace`, `GET /act_{AD_ACCOUNT_ID}/saved_audiences` |
| **Targeting avançado** | `GET /act_{AD_ACCOUNT_ID}/targetingsearch`, `/targetingbrowse`, `/targetingsuggestions`, `/targetingvalidation`, `GET /act_{AD_ACCOUNT_ID}/broadtargetingcategories` |
| **Regras** | `GET/POST /act_{AD_ACCOUNT_ID}/adrules_library`, `POST /{AD_RULE_ID}`, `POST /{AD_RULE_ID}/execute`, `GET /{AD_RULE_ID}/history`, `GET /{AD_RULE_ID}/preview` |
| **Labels** | `GET/POST /act_{AD_ACCOUNT_ID}/adlabels`, `POST /{AD_LABEL_ID}`, `DELETE /{AD_LABEL_ID}`, `POST /{OBJECT_ID}/adlabels`, `GET /act_{AD_ACCOUNT_ID}/campaignsbylabels` |
| **Pixels** | `GET/POST /act_{AD_ACCOUNT_ID}/adspixels`, `POST /{PIXEL_ID}`, `POST /{PIXEL_ID}/events` |
| **Conversões** | `GET/POST /act_{AD_ACCOUNT_ID}/customconversions`, `POST /{CUSTOM_CONVERSION_ID}`, `DELETE /{CUSTOM_CONVERSION_ID}` |
| **Catálogos** | `GET /{BUSINESS_ID}/owned_product_catalogs`, `GET /{CATALOG_ID}/products`, `POST /{CATALOG_ID}/product_sets` |
| **Leads** | `GET /{AD_ID}/leads`, `GET /{FORM_ID}/leads`, `GET /{LEAD_ID}`, `GET /ads/lead_gen/export_csv/` |
| **Business** | `GET /{BUSINESS_ID}/owned_ad_accounts`, `GET /{BUSINESS_ID}/client_ad_accounts`, `GET/POST /{OBJECT_ID}/assigned_users`, `GET /act_{AD_ACCOUNT_ID}/activities` |
| **Async e batch** | `POST /act_{AD_ACCOUNT_ID}/async_batch_requests`, `POST /act_{AD_ACCOUNT_ID}/asyncadrequestsets`, `POST /{VERSION}/?batch=[…]` |

### 9.3 Endpoints Futuros (Inovação)

| Categoria | Endpoints |
| --- | --- |
| **Webhooks** | Subscrição ao campo `leadgen` |
| **Advanced Insights** | `POST /act_{AD_ACCOUNT_ID}/insights` async com `time_ranges`, `summary`, `export_format`; `GET /{REPORT_RUN_ID}`, `GET /{REPORT_RUN_ID}/insights` |
| **Commerce** | `GET /{CATALOG_ID}/external_event_sources`, `GET /{CATALOG_ID}/diagnostics` |
| **WhatsApp** | `POST /act_{AD_ACCOUNT_ID}/adcreatives` com `wamo_whatsapp_identity_spec` |

---

## 10. Glossário

| Termo | Definição |
| --- | --- |
| **AI-agent-first** | Arquitetura de produto em que a interação humana com o sistema acontece por conversa com um agente de IA, e não por telas de operação |
| **Tool calling** | Mecanismo pelo qual o modelo de linguagem invoca funções tipadas — aqui, cada ferramenta encapsula um endpoint da Marketing API |
| **Winner Score** | Pontuação interna que combina volume, eficiência de custo, qualidade e estabilidade para identificar anúncios de alto desempenho (§2.5) |
| **Selo de vencedor** | Marcação visual (🏆 ⭐ ⚠️ 💤) exibida no dashboard e disponível no contexto do agente de IA |
| **Dry-run** | Validação prévia de uma escrita com `execution_options=['validate_only']`, sem efeito na conta |
| **CBO** | Campaign Budget Optimization — orçamento no nível da campanha |
| **ABO** | Ad Set Budget Optimization — orçamento no nível do ad set |
| **ODAX** | Outcome-Driven Ad Experience — objetivos `OUTCOME_*` |
| **CAPI** | Conversions API — envio server-side de eventos |
| **DSA** | Digital Services Act — regulamentação europeia para anúncios |
| **BUC** | Business Use Case — categoria de rate limit na API |
| **SKAdNetwork** | Sistema de atribuição iOS 14+ da Apple |
| **EUR (€)** | Moeda única do produto. Todos os orçamentos, gastos e métricas de custo são apresentados em euros |

---

## 11. Referências

- **Documento de Endpoints:** `docs/meta-ads-endpoints.md` (fonte primária)
- **Meta for Developers:** https://developers.facebook.com/docs/marketing-api
- **Graph API Changelog:** https://developers.facebook.com/docs/graph-api/changelog
- **Versioning Guide:** https://developers.facebook.com/docs/graph-api/guides/versioning
- **Rate Limiting:** https://developers.facebook.com/docs/graph-api/overview/rate-limiting
- **Marketing API Access:** https://developers.facebook.com/docs/marketing-api/access

---

*Última atualização: 2026-08-03*
*Versão da API de referência: v26.0*
