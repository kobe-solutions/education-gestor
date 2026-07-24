# Logins — Education Gestor (Seed)

> Senha padrão de todos os usuários: **`senha123`**

---

## Admin Global

| Campo | Valor |
|-------|-------|
| Email | `admin@educationgestor.com` |
| Senha | `senha123` |
| Role  | `admin` |

---

## Escolas (Gestores)

| Escola | Email | Senha | Diretor | Coordenador |
|--------|-------|-------|---------|-------------|
| Colégio São Paulo | `gestor@colegiosaopaulo.com` | `senha123` | Roberto Almeida | Sandra Lima |
| Colégio Nobre | `gestor@colegionobre.com` | `senha123` | Marcos Ferreira | Cláudia Santos |
| Instituto Educacional Futuro | `gestor@institutofuturo.com` | `senha123` | Ana Paula Costa | Paulo Mendes |

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

## Secretarias

Nenhuma secretaria é criada pelo seed atual.

---

## Dados de Volume (por escola)

| Entidade | Quantidade |
|----------|-----------|
| Períodos letivos | 2 |
| Níveis de ensino | 2 (Fundamental + Médio) |
| Séries | 12 |
| Disciplinas | 12 |
| Professores | 10 |
| Turmas | 12 |
| Alunos | 60 |
| Responsáveis | ~90 |
| Registros de frequência | ~3.600 |
| Notas | ~1.440 por período |
| Mensalidades | 720 |

---

## Comandos

```bash
# Popular o banco
pnpm db:seed

# Limpar tudo
pnpm db:clear -- --confirm
```
