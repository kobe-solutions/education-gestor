---
name: IRIS Educação
description: Gestão escolar clara, organizada por perfil e tarefa.
colors:
  iris-blue: "hsl(209 76% 37%)"
  iris-navy: "#042C53"
  iris-blue-glow: "hsl(209 70% 48%)"
  blue-wash: "hsl(207 75% 95%)"
  app-background: "hsl(210 40% 98%)"
  ink: "hsl(210 28% 18%)"
  muted-surface: "hsl(210 24% 94%)"
  muted-ink: "hsl(215 12% 43%)"
  border: "hsl(214 20% 88%)"
  card: "hsl(0 0% 100%)"
  danger: "hsl(0 84% 60%)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.iris-blue}"
    textColor: "hsl(0 0% 100%)"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  input:
    backgroundColor: "hsl(214 18% 82% / 0.5)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  task-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  login-panel:
    backgroundColor: "{colors.iris-navy}"
    textColor: "hsl(0 0% 100%)"
    typography: "{typography.body}"
    padding: "48px 40px"
  login-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "16px"
    padding: "24px"
---

# Design System: IRIS Educação

## Overview

**Creative North Star: "A escola encontra seu próximo passo"**

IRIS organiza a gestão escolar em uma superfície institucional, familiar e direta. O azul da marca ancora ações e orientação; fundos frios e cartões brancos deixam dados e tarefas legíveis sem competir com o trabalho. A entrada pública combina um painel navy sólido com uma área de formulário centralizada, identidade IRIS e instruções concisas. A linguagem de interface é brasileira, clara e acolhedora, com nomes que descrevem o que cada pessoa veio fazer.

O sistema organiza a navegação conforme o papel da pessoa e reúne tarefas relacionadas em listas agrupadas. A tela inicial destaca prioridades e indicadores; detalhes adicionais ficam sob divulgações explícitas. Formulários longos se dividem em abas numeradas, com rótulos concretos e etapas posteriores bloqueadas até que o cadastro exista. A composição reduz opções concorrentes sem esconder o caminho para as rotinas completas.

**Key Characteristics:**
- Azul institucional IRIS em ações, foco e seleção.
- Navegação curta e filtrada pelo papel da pessoa.
- Listas de tarefas com título, explicação e ação visível.
- Hierarquia progressiva: resumo primeiro, detalhes sob demanda.
- Português brasileiro simples em controles e orientação.
- Entrada pública com painel navy sólido e formulário centralizado responsivo.

## Colors

A paleta combina o azul institucional com superfícies claras e neutros frios; as cores semânticas ficam reservadas a estados e indicadores.

### Primary
- **Azul IRIS** (`colors.iris-blue`): ações principais, links, navegação selecionada e marca.
- **Azul de foco** (`colors.iris-blue-glow`): contorno de foco e realce azul.

### Secondary
- **Lavagem azul** (`colors.blue-wash`): fundos de seleção e tiles de ícone associados à marca.

### Neutral
- **Navy institucional** (`colors.iris-navy`): painel sólido da área pública e textos brancos de alto contraste.
- **Fundo frio** (`colors.app-background`): canvas principal da aplicação.
- **Tinta grafite azulada** (`colors.ink`): texto principal.
- **Superfície suave** (`colors.muted-surface`): controles e áreas de apoio.
- **Texto secundário** (`colors.muted-ink`): descrições e metadados.
- **Linha fria** (`colors.border`): divisórias, contornos e estrutura dos cartões.
- **Branco de superfície** (`colors.card`): cartões e menus.
- **Vermelho de erro** (`colors.danger`): erros e ações destrutivas.

**The Blue Means Action Rule.** Reserve o azul saturado para ações, foco, seleção e orientação da marca; use a lavagem azul para apoio sem competir com o conteúdo.

## Typography

**Display Font:** Plus Jakarta Sans (com sans-serif como fallback)
**Body Font:** Plus Jakarta Sans (com sans-serif como fallback)
**Label/Mono Font:** JetBrains Mono para códigos e identificadores, conforme o guia IRIS.

**Character:** A família geométrica mantém títulos e dados compactos e nítidos. A interface usa uma escala densa, com texto base de 14px, e títulos em pesos 600–700.

### Hierarchy
- **Display** (700, 30px, line-height 1.2): títulos principais de páginas.
- **Headline** (700, 24px, line-height 1.3): títulos de áreas e formulários.
- **Title** (600, 16px, line-height 1.5): títulos de seções e itens de tarefa.
- **Body** (400, 14px, line-height 1.5): texto corrente, descrições e controles.
- **Label** (600, 12px, line-height 1.4): metadados e rótulos de apoio.

**The Plain Language Rule.** Escreva rótulos como tarefas reconhecíveis em português brasileiro; mantenha descrições curtas e factuais.

## Layout

O shell autenticado ocupa a altura da janela, com sidebar fixa de 252px em telas médias ou maiores, cabeçalho de 64px e conteúdo centralizado até 1560px. O conteúdo cresce com o viewport e usa padding de 16px, 24px a partir de `sm` e 32px horizontal em `lg`. O cabeçalho mantém o contexto da área e da escola; a sidebar mostra apenas rotas autorizadas para o papel ativo.

Em telas estreitas, a sidebar autenticada vira um drawer acionado pelo botão de menu, com camada de fundo e fechamento ao navegar. A entrada pública mantém o formulário centralizado em uma coluna com largura máxima de 448px; o painel institucional com resumo dos módulos aparece em telas `lg` ou maiores. Formulários de cadastro usam abas numeradas que se refluem em duas colunas, três em `sm` e até quatro em telas largas. A captura mobile disponível mostra apenas a tela pública de login; ela não comprova a navegação autenticada em mobile.

O ritmo usa grupos de 8, 12, 16 e 24px. Áreas de conteúdo preferem listas e grades responsivas a blocos de texto longos; a navegação permanece disponível enquanto o conteúdo principal rola.

## Elevation & Depth

O sistema é híbrido, com contornos e superfícies tonais como estrutura principal, além de sombras azuladas discretas para cartões, menus e diálogos. Foco é expresso por anel azul visível; hover pode elevar ligeiramente métricas e cartões interativos.

### Shadow Vocabulary
- **Cartão** (`--shadow-sm`: `0 1px 3px hsl(209 50% 25% / 0.08), 0 1px 2px hsl(209 50% 25% / 0.04)`): cartões de métricas e superfícies selecionadas.
- **Elevação média** (`--shadow-md`: `0 8px 20px -8px hsl(209 50% 25% / 0.16)`): hover e elementos suspensos.
- **Elevação alta** (`--shadow-lg`: `0 16px 40px -16px hsl(209 50% 25% / 0.2)`): diálogos e superfícies elevadas.
- **Foco** (`--shadow-glow`: `0 0 0 3px hsl(207 70% 48% / 0.18)`): destaque de foco azul.

**The Quiet Elevation Rule.** Deixe bordas e diferenças de superfície estabelecerem a hierarquia; aplique sombra azul suave quando a interação ou elevação pedir.

## Shapes

Controles usam cantos compactos; cartões e grupos de tarefas usam cantos mais suaves, normalmente entre 10 e 12px. Campos têm contorno e fundo leve, com anel azul no foco. Itens selecionados recebem lavagem azul e contorno de marca. Evite formas decorativas que desviem atenção de dados e tarefas.

## Components

### Buttons
- **Forma:** retângulo de cantos discretos (6px), com altura padrão de 44px.
- **Principal:** preenchimento azul IRIS, texto branco e padding horizontal de 12px.
- **Hover / Focus:** o preenchimento clareia no hover; foco recebe contorno e anel azul, e pressão desloca o botão 1px.
- **Secundário / Ghost:** contorno ou superfície neutra; ghost ganha fundo neutro no hover.

### Chips
- **Estilo:** estados usam fundos suaves e texto semântico legível; badges pequenos acompanham a informação que qualificam.
- **Uso:** status de matrícula, pagamentos e informações relacionadas; não use cor como único sinal.

### Cards / Containers
- **Cantos:** normalmente 12px (`rounded-xl`), com borda de 1px.
- **Fundo:** branco sobre o fundo frio da aplicação.
- **Profundidade:** sombra pequena em métricas e cartões interativos; listas agrupadas usam borda e divisórias.
- **Padding:** 16–24px conforme a densidade do conteúdo.

### Inputs / Fields
- **Estilo:** campo de 36px, largura total, canto de 8px e preenchimento suave.
- **Foco:** borda e anel azuis claramente visíveis.
- **Erro / Desativado:** vermelho semântico para erro; estado desativado reduz opacidade e impede interação.

### Public Login
- **Painel institucional:** navy sólido em desktop largo, com marca IRIS, resumo breve das áreas do produto e texto branco suave; não use gradiente.
- **Cartão de acesso:** cartão branco centralizado, borda fina, raio de 16px, padding de 24px (32px em telas `sm`) e largura máxima de 448px.
- **Conteúdo:** ícone oficial IRIS, título “Acesse sua conta”, instrução curta, campos E-mail e Senha com ícones Lucide, opção para lembrar e-mail e ação principal em largura total.
- **Chrome:** o tema do navegador usa o azul principal IRIS (`#185fa5`).

### Navigation
- **Estilo:** sidebar branca, rótulos com ícones Lucide de 18px e alvos de pelo menos 44px.
- **Estado:** rota ativa recebe lavagem azul e texto azul; hover usa fundo azul suave.
- **Comportamento:** links são filtrados por papel. No mobile autenticado, a navegação é um drawer; o item ativo fecha o drawer ao navegar.

### Task Lists
- Cada seção apresenta título e descrição opcional; os links agrupados separam linhas por divisórias.
- A linha combina tile de ícone, nome da tarefa e explicação. A ação textual e a seta aparecem em telas maiores; em telas estreitas, fica a seta.
- Mantenha os nomes concretos e agrupe tarefas relacionadas para facilitar a localização.

### Overview Disclosures
- Use um resumo de altura mínima de 56px com rótulo “Mostrar/Ocultar” para expandir indicadores e detalhes secundários.
- Priorize primeiro os indicadores mais acionáveis; não esconda a ação principal dentro da divulgação.

### Form Step Navigation
- Use abas numeradas com nomes descritivos, agrupadas em grade responsiva e com no mínimo 44px de altura.
- Marque a aba ativa com borda azul e fundo azul suave. Etapas que dependem da criação do registro aparecem desativadas até que possam ser usadas.

## Do's and Don'ts

### Do:
- **Do** mantenha Plus Jakarta Sans e o azul IRIS como identidade visual.
- **Do** mostre apenas os destinos permitidos ao papel atual.
- **Do** agrupe tarefas com título, descrição curta e ação reconhecível.
- **Do** revele informações secundárias por divulgações nomeadas “Mostrar/Ocultar”.
- **Do** mantenha alvo de toque confortável e a hierarquia responsiva do shell.
- **Do** use formato brasileiro para datas, moeda e notas.

### Don't:
- **Don't** substitua a identidade azul por paletas roxas ou degradês decorativos.
- **Don't** use navegação genérica que ignore o papel e as tarefas escolares.
- **Don't** apresente toda a densidade de indicadores antes das prioridades.
- **Don't** dependa apenas da cor para comunicar status ou foco.
- **Don't** use linguagem técnica ou promocional nos rótulos de tarefa.
