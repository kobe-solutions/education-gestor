# Seed para testes manuais

O seed manual cria uma base pequena para explorar a aplicação sem os dados volumosos do seed principal. Ele é independente do comando `pnpm db:seed` e usa o comando `pnpm db:seed:manual`.

## Dados criados

- Uma escola: **Escola de Teste Manual** (`escola-teste-manual`)
- Um ano letivo ativo (2026), um nível de ensino, uma série e uma turma (`5A`)
- Três disciplinas e três professores, cada um vinculado a uma disciplina
- Exatamente 20 alunos, matriculados na turma `5A`

## Acesso

Todos os usuários abaixo usam a senha `senha123`:

- Gestor: `gestor@teste-manual.com`
- Professores: `ana.professora@teste-manual.com`, `bruno.professor@teste-manual.com` e `carla.professora@teste-manual.com`

Os alunos têm e-mails no padrão `alunoNN@teste-manual.com`, de `aluno01` a `aluno20`.

## Executar novamente

O seed não é idempotente: antes de inserir qualquer dado, verifica se já existe a escola com slug `escola-teste-manual`. Se existir, encerra sem inserir registros. Para recriar a base, remova os dados da escola de teste e execute o comando novamente. O seed principal e o comando geral de limpeza não são executados por este seed.
