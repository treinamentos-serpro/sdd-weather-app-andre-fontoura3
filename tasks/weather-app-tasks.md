# Backlog de Tarefas — Weather App

## Entrega 1 — Fundações (tipos + funções puras)

### T-01 — Definir tipos do domínio
- **Tipo:** Data
- **Descrição:** Criar `src/types/weather.ts` com `Unit`, `City`, `CurrentWeather`, `ForecastDay`, `WeatherData`.
- **Critérios:** tipos compilam em strict; refletem o modelo de dados do plano.
- **Dependências:** —
- **Arquivos:** `src/types/weather.ts`

### T-02 — Conversão de temperatura (função pura)
- **Tipo:** Data
- **Descrição:** `src/lib/temperature.ts` com `toFahrenheit`, `formatTemperature(value, unit)`.
- **Critérios:** 0°C→32°F, 100°C→212°F, -40°C→-40°F; arredondamento consistente.
- **Dependências:** T-01
- **Arquivos:** `src/lib/temperature.ts`

### T-03 — Mapa de códigos de clima
- **Tipo:** Data
- **Descrição:** `src/lib/weatherCodes.ts` mapeando weather_code → rótulo pt-BR + ícone.
- **Critérios:** cobre os códigos principais da Open-Meteo; fallback para desconhecido.
- **Dependências:** —
- **Arquivos:** `src/lib/weatherCodes.ts`

### T-04 — Formatação de datas
- **Tipo:** Data
- **Descrição:** `src/lib/format.ts` com rótulo de dia (Hoje, Amanhã, dia da semana).
- **Critérios:** primeiro dia = "Hoje"; segundo = "Amanhã"; demais = dia abreviado.
- **Dependências:** —
- **Arquivos:** `src/lib/format.ts`

## Entrega 2 — Acesso a dados

### T-05 — Service de geocoding
- **Tipo:** Data
- **Descrição:** `searchCities(name)` em `src/services/weatherService.ts`.
- **Critérios:** retorna `City[]`; trata vazio e erro; usa `AbortController`.
- **Dependências:** T-01
- **Arquivos:** `src/services/weatherService.ts`

### T-06 — Service de forecast
- **Tipo:** Data
- **Descrição:** `getWeather(lat, lon)` mapeando `current` + `daily` e retornando `{current, forecast}` (o hook compõe o `WeatherData` com a `City`). Absorve a parte de dados de T-18 (timeout e resposta parcial).
- **Critérios:** retorna `{current, forecast}` com 5 dias; mapeia campos; trata erro, timeout (com `AbortController`) e resposta parcial (campo ausente → `—`, sem quebrar).
- **Dependências:** T-01, T-05
- **Arquivos:** `src/services/weatherService.ts`

### T-07 — Hook `useWeather`
- **Tipo:** Data
- **Descrição:** orquestra busca/seleção/forecast; expõe `state`, `data`, `error`, ações.
- **Critérios:** máquina `idle|loading|success|error|empty|selecting`; 1 resultado seleciona automaticamente; >1 resultado entra em `selecting`; 0 resultados entra em `empty`; `retry` repete a etapa que falhou (busca ou forecast).
- **Dependências:** T-05, T-06
- **Arquivos:** `src/hooks/useWeather.ts`

## Entrega 3 — UI

### T-08 — Componente `SearchBar`
- **Tipo:** UI
- **Critérios:** input acessível (label/role); dispara busca; bloqueia input vazio.
- **Dependências:** T-07
- **Arquivos:** `src/components/SearchBar.tsx`

### T-08b — Componente `CitySuggestions`
- **Tipo:** UI
- **Descrição:** lista de sugestões de cidades exibida quando a busca retorna mais de 1 resultado; props `cities` e `onSelect`.
- **Critérios:** cada item mostra nome com país/estado; acessível (role `listbox`/`option` ou lista de botões, rótulo, foco visível); navegação e seleção por teclado; chama `onSelect(city)`.
- **Dependências:** T-01
- **Arquivos:** `src/components/CitySuggestions.tsx`

### T-09 — Componentes de estado (Loading/Error/Empty)
- **Tipo:** UI
- **Critérios:** cada estado tem mensagem clara; Error tem "tentar novamente".
- **Dependências:** —
- **Arquivos:** `src/components/states/*`

### T-10 — `CurrentWeather`
- **Tipo:** UI
- **Critérios:** hero com temperatura grande, condição, umidade, vento, pressão, precip.
- **Dependências:** T-01, T-02, T-03
- **Arquivos:** `src/components/CurrentWeather.tsx`

### T-11 — `ForecastList` + `ForecastCard`
- **Tipo:** UI
- **Critérios:** grid responsivo de 5 cards (2/3/5 colunas); cada card com min/max.
- **Dependências:** T-01, T-02, T-03, T-04
- **Arquivos:** `src/components/ForecastList.tsx`, `src/components/ForecastCard.tsx`

### T-12 — `UnitToggle`
- **Tipo:** UI
- **Critérios:** alterna C/F; acessível por teclado; reflete em todos os valores.
- **Dependências:** T-02
- **Arquivos:** `src/components/UnitToggle.tsx`

### T-13 — Integrar tudo no `App`
- **Tipo:** UI
- **Critérios:** layout completo conforme spec; estados conectados ao hook.
- **Dependências:** T-07..T-12
- **Arquivos:** `src/App.tsx`

## Entrega 4 — Testes

### T-14 — Testes unitários (lib + service)
- **Tipo:** Test
- **Critérios:** conversão, weatherCodes, service com mock de fetch (sucesso/erro).
- **Dependências:** T-02..T-06
- **Arquivos:** `tests/unit/*`

### T-15 — Testes de componentes
- **Tipo:** Test
- **Critérios:** estados loading/erro/vazio/sucesso; toggle converte valores.
- **Dependências:** T-08..T-13
- **Arquivos:** `tests/unit/*`

### T-16 — Testes E2E (Playwright)
- **Tipo:** Test
- **Critérios:** fluxo completo + viewport mobile; `page.route` determinístico.
- **Dependências:** T-13
- **Arquivos:** `tests/e2e/*`

## Entrega 5 — Hardening

### T-17 — Acessibilidade e foco
- **Tipo:** UI
- **Critérios:** navegação por teclado, roles/labels, foco visível, contraste.
- **Dependências:** T-13

### T-18 — Resiliência e edge cases
- **Tipo:** Data/UI
- **Descrição:** timeout e resposta parcial passam a ser tratados em T-06; aqui ficam as mensagens de erro e os testes de resiliência.
- **Critérios:** mensagens de erro claras em pt-BR por tipo de falha; testes cobrem timeout, falha de API e resposta parcial ("—").
- **Dependências:** T-06, T-09
- **Arquivos:** `src/lib/errorMessages.ts`, `tests/unit/*`

---

## Rastreabilidade requisito → tarefa

| Requisito | Tarefas             |
| --------- | ------------------- |
| RF1 busca | T-05, T-08, T-08b   |
| RF2 atual | T-06, T-10          |
| RF3 prev. | T-06, T-11          |
| RF4 C/F   | T-02, T-12          |
| RF5 estados | T-07, T-09, T-18  |
