# Logins — Education Gestor (Seed)

> Senha padrão de todos os usuários gerados pelo seed: **`senha123`**
>
> Para gerar os dados, execute: `pnpm db:seed` (idempotente — pula o que já existe).

---

## Admin Global

| Campo | Valor |
|-------|-------|
| Email | `admin@educationgestor.com` |
| Senha | `senha123` |
| Role  | `admin` |

> O admin também pode ser criado/recriado a qualquer momento via `pnpm admin:provision`.

---

## Secretarias de Educação

| Secretaria | Email | Responsável | Telefone |
|------------|-------|-------------|----------|
| Secretaria Municipal de Educação de São Paulo | `contato@educacao-saopaulo.sp.gov.br` | Maria Helena de Souza | (11) 3113-0001 |
| Secretaria Municipal de Educação de Campinas | `contato@educacao-campinas.sp.gov.br` | João Pedro Ferreira | (19) 3296-1000 |

Senha de todas as secretarias: **`senha123`**

> A Secretaria de São Paulo está vinculada às 3 escolas do seed. A Secretaria de Campinas está vinculada apenas a Colégio Nobre e Instituto Educacional Futuro.

---

## Escolas (Gestores)

| Escola | Slug | Email | Senha | Diretor | Coordenador |
|--------|------|-------|-------|---------|-------------|
| Colégio São Paulo | `colegio-sao-paulo` | `gestor@colegiosaopaulo.com` | `senha123` | Roberto Almeida | Sandra Lima |
| Colégio Nobre | `colegio-nobre` | `gestor@colegionobre.com` | `senha123` | Marcos Ferreira | Cláudia Santos |
| Instituto Educacional Futuro | `instituto-futuro` | `gestor@institutofuturo.com` | `senha123` | Ana Paula Costa | Paulo Mendes |

---

## Professores

Os professores são gerados com nomes aleatórios pelo seed. O padrão de email é:

```
prof{N}.{nome}.{sobrenome}@{slug-da-escola}.com
```

Exemplos:
- `prof1.lucas.silva@colegio-sao-paulo.com`
- `prof2.ana.oliveira@colegio-nobre.com`

> Para consultar os emails exatos após rodar o seed, acesse o Drizzle Studio:
> ```
> pnpm db:studio
> ```

Senha de todos os professores: **`senha123`**

---

## Secretarias (vinculação)

Nenhuma secretaria adicional além das duas citadas é criada pelo seed. Secretarias adicionais devem ser criadas pelo admin via `POST /secretarias`.

---

## Dados de Volume (por escola)

| Entidade | Quantidade |
|----------|-----------|
| Anos letivos | 1 (2025) |
| Períodos letivos | 4 (bimestres) |
| Níveis de ensino | 2 (Ensino Fundamental + Ensino Médio) |
| Séries | 12 |
| Disciplinas | 12 |
| Períodos de aula (horários) | 6 |
| Professores | 10 |
| Turmas | 12 (4 Fundamental + 4 Médio, com variações de turno) |
| Alunos por turma | 30–35 (aleatório) |
| Alunos totais por escola | ~360–420 |
| Responsáveis | 1 ou 2 por aluno (~70% têm pai) |
| Fichas médicas | geradas para parte dos alunos (alergias, restrições, etc.) |
| Registros de frequência | ~60 dias letivos × alunos por turma |
| Notas | ~4 períodos × 12 disciplinas × alunos por turma |
| Mensalidades | 12 por aluno (uma por mês) |

---

## Comandos

```bash
# Popular o banco (idempotente)
pnpm db:seed

# Limpar tudo (pede confirmação)
pnpm db:clear -- --confirm

# Visualizar/editar dados via GUI
pnpm db:studio
```
