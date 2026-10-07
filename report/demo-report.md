# Relatório de demonstração — WeatherView

- **Data:** 2026-10-07
- **Ambiente:** `pnpm dev` (Vite, `http://localhost:5173`), browser interno do VS Code
- **Viewports:** desktop 1280 px; mobile 375 px e 320 px
- **Dados:** API real da Open-Meteo nos cenários de sucesso. Nos cenários de exceção, as respostas foram interceptadas no browser com `page.route` (falha HTTP, rede, atraso, campos nulos).
- **Evidências:** [`report/screenshots/`](screenshots/)

> A interação foi feita por teclado (foco + Enter), porque os cliques com ponteiro no browser interno atingiam o elemento errado. Isso também demonstra a navegação por teclado.

## Resumo

| # | Cenário | Requisito | Resultado |
| - | ------- | --------- | --------- |
| 1 | Estado inicial | RF5 | OK |
| 2 | Input vazio não dispara busca | Edge case | OK (ver observação 1) |
| 3 | Busca com vários resultados mostra lista com estado/país | RF1 | OK |
| 4 | Seleção de sugestão por teclado | RNF acessibilidade | OK |
| 5 | Clima atual e previsão de 5 dias em °C | RF2, RF3 | OK |
| 6 | Alternar para °F sem novo request | RF4 | OK |
| 7 | Cidade inexistente | RF1, RF5 | OK |
| 8 | Indicador de loading | RF5 | OK |
| 9 | Timeout de rede | RF5, RNF resiliência | OK |
| 10 | "Tentar novamente" após timeout | RF5 | OK |
| 11 | Falha HTTP 500 no forecast | RF5 | OK |
| 12 | Falha de rede (sem conexão) | RF5 | OK |
| 13 | "Tentar novamente" repete a busca | RF5 | OK |
| 14 | Cidade única (seleção automática) e resposta parcial ("—") | RF1, edge case | OK |
| 15 | Mobile 375 px | RNF responsividade | OK |
| 16 | Mobile 320 px | RNF responsividade | OK |
| 17 | Lista de sugestões em mobile | RF1, RNF responsividade | OK |

## Fluxo principal

### 1. Estado inicial
Busca desabilitada, °C selecionado e mensagem orientando a buscar uma cidade.

![Estado inicial](screenshots/01-estado-inicial.png)

### 2. Input vazio
Com o campo contendo apenas espaços, o botão "Buscar" permanece desabilitado e nenhuma requisição é feita.

![Input vazio bloqueado](screenshots/02-input-vazio-bloqueado.png)

### 3. Lista de sugestões (vários resultados)
A busca por "Santa Maria" retornou 5 cidades. Cada item mostra nome, estado e país para desambiguar homônimos. Um anúncio `aria-live` informa "5 cidades encontradas. Selecione uma."

![Lista de sugestões](screenshots/03-lista-sugestoes.png)

### 4. Foco por teclado
Foco visível na sugestão "Santa Maria, Rio Grande do Sul, Brasil".

![Foco por teclado](screenshots/04-sugestao-foco-teclado.png)

### 5. Clima atual e previsão (°C)
Selecionada a cidade, aparecem temperatura, condição, umidade, vento, precipitação e pressão. A previsão tem 5 cards (Hoje, Amanhã e mais 3 dias) com máx., mín. e probabilidade de chuva.

![Clima em Celsius](screenshots/05-clima-celsius.png)

### 6. Alternância para °F
A temperatura atual passou de 27 °C para 80 °F. Nenhuma requisição à Open-Meteo foi disparada na troca (0 requests contados).

![Clima em Fahrenheit](screenshots/06-clima-fahrenheit.png)

## Cenários de exceção

### 7. Cidade inexistente
A busca por "Xyzqwkjhg" mostra o estado vazio "Nenhuma cidade encontrada".

![Cidade inexistente](screenshots/07-cidade-inexistente.png)

### 8. Loading
Com a resposta do forecast pendente, aparece "Carregando dados do clima..." e a busca fica desabilitada.

![Loading](screenshots/08-loading.png)

### 9. Timeout
Sem resposta em 10 s, aparece "A requisição demorou demais para responder. Tente novamente." com o botão "Tentar novamente".

![Erro de timeout](screenshots/09-erro-timeout.png)

### 10. Retry após timeout
Removido o bloqueio, "Tentar novamente" repete só o forecast da cidade já escolhida e exibe o clima.

![Retry com sucesso](screenshots/10-retry-sucesso.png)

### 11. Falha HTTP no forecast
Resposta 500 mostra "O serviço de clima está indisponível no momento. Tente novamente mais tarde."

![Erro HTTP](screenshots/11-erro-http-forecast.png)

### 12. Falha de rede
Com o geocoding abortado, aparece "Sem conexão com a internet. Verifique sua rede e tente novamente."

![Erro de rede](screenshots/12-erro-rede.png)

### 13. Retry da busca
Restabelecida a rede, "Tentar novamente" refaz a busca e a lista de sugestões aparece.

![Retry da busca](screenshots/13-retry-busca-recuperada.png)

### 14. Cidade única e resposta parcial
Com 1 único resultado de geocoding, o clima carrega direto, sem lista. Os campos ausentes (umidade, vento, pressão, máx./mín. de Amanhã e probabilidade de sexta) aparecem como "—" sem quebrar o layout.

![Cidade única e resposta parcial](screenshots/14-cidade-unica-resposta-parcial.png)

## Responsividade

Nos dois viewports, `scrollWidth` igualou a largura da janela (sem scroll horizontal).

### 15. 375 px
![Mobile 375 clima](screenshots/15-mobile-375-clima.png)

### 16. 320 px
O botão "Buscar" vai para uma linha própria e a previsão usa 2 colunas.

![Mobile 320 clima](screenshots/16-mobile-320-clima.png)

### 17. Sugestões em 375 px
![Mobile 375 sugestões](screenshots/17-mobile-375-sugestoes.png)

## Observações

1. **Input vazio:** a spec pede que o usuário seja "orientado". Hoje o app só desabilita o botão e mantém a mensagem inicial, sem texto específico para o caso.
2. **Primeiro resultado do geocoding:** "Santa Maria" retornou "Oaxaca de Juárez" (México) em primeiro lugar, por ranking da Open-Meteo. A lista com estado/país evita escolha errada.
3. **Browser interno:** cliques com ponteiro falharam por interceptação de eventos no viewport embutido; o fluxo foi feito por teclado. Os testes Playwright (`pnpm test:e2e`) já cobrem o mesmo fluxo com cliques.
4. **Prints:** o browser interno gera a imagem em escala diferente do viewport, então alguns prints têm área escura à direita ou abaixo do conteúdo.
