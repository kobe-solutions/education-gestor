# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Gestores escolares que administram uma escola e precisam acompanhar pessoas, estrutura, rotina acadêmica e financeiro.
- Secretarias municipais ou intermunicipais de Educação que administram uma rede de escolas vinculadas e alternam entre elas.
- Professores que acessam suas turmas e registram atividades acadêmicas e frequência.
- Administradores da plataforma que gerenciam escolas e secretarias.

Os usuários prioritários desta refatoração não devem precisar de conhecimento de tecnologia ou programação.

## Product Purpose

IRIS Educação é um sistema web de gestão escolar para colégios de pequeno e médio porte. Reúne rotinas de pessoas, turmas, vida acadêmica, frequência, calendário, mensalidades e administração de escolas. O sucesso desta refatoração é permitir que cada perfil encontre o lugar certo e conclua seu fluxo de trabalho com clareza, sem se perder entre páginas ou etapas.

## Positioning

Uma plataforma compartilhada para redes e escolas, com acesso isolado por escola e experiências ajustadas aos papéis de gestor, secretaria, professor e administrador.

## Operating Context

- Interface e conteúdo em português brasileiro.
- Gestores realizam tarefas administrativas de uma escola; Secretarias de Educação administram uma rede municipal ou intermunicipal e alternam entre as escolas vinculadas.
- Quando uma escola está em uso, as tarefas e os dados exibidos pertencem àquela escola. A Secretaria de Educação pode trocar a escola pelo seletor do cabeçalho.
- A organização deve priorizar tarefas completas por perfil e tornar evidente onde encontrar cada função.

## Capabilities and Constraints

- Aplicação web SPA: React 19, TypeScript, Vite, React Router, TanStack Query, shadcn/ui e Tailwind CSS v4.
- API: Fastify, Zod, Drizzle ORM e PostgreSQL; os fluxos atuais e suas permissões precisam continuar funcionando.
- Produto multi-tenant: cada escola acessa seus próprios dados; permissões e rotas existentes são restrições funcionais.
- A refatoração solicitada cobre os perfis e telas existentes, com prioridade em localização de páginas, conclusão de tarefas com várias etapas e redução de sobrecarga de informação.
- Nenhuma alteração de regras de negócio ou capacidades de API foi solicitada.

## Brand Commitments

- O produto usa a marca IRIS Educação e possui guia de identidade e logos em `docs/new_design_iris/`.
- O idioma é português brasileiro, com voz institucional, direta e acolhedora.
- Usar Plus Jakarta Sans, Lucide e a paleta institucional azul da IRIS conforme `docs/new_design_iris/README.md`.
- Preservar o formato brasileiro para datas, moeda e notas.

## Evidence on Hand

- Rotas e componentes atuais em `apps/web/src/`.
- Logos da marca em `docs/new_design_iris/assets/logos/`.
- Guia, tokens e protótipo de interface anterior em `docs/new_design_iris/`.
- O repositório não contém relatos de usuários ou pesquisa de uso além das observações fornecidas pelo usuário nesta conversa.

## Product Principles

- Organizar a navegação a partir do trabalho que cada perfil precisa concluir.
- Manter poucas opções visíveis por vez e usar nomes que descrevem tarefas conhecidas.
- Conduzir tarefas com várias etapas, explicando progresso, próximos passos e resultado.
- Dar prioridade à clareza da informação e às ações necessárias em cada tela.
- Preservar capacidades existentes, dados, permissões e identidade da IRIS.
