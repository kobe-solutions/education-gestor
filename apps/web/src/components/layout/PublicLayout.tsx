import { Outlet } from 'react-router'
import { Check } from 'lucide-react'

const areas = [
  { title: 'Pessoas', description: 'Alunos, responsáveis e professores' },
  { title: 'Rotina escolar', description: 'Turmas, horários, notas e frequência' },
  { title: 'Financeiro', description: 'Mensalidades e pagamentos' },
]

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background md:flex-row">
      <aside className="hidden min-h-dvh w-2/5 flex-col justify-between bg-[#042C53] px-10 py-12 text-white lg:flex xl:px-16">
        <div className="flex items-center gap-4">
          <img src="/iris-icon.svg" alt="" className="size-12 rounded-xl bg-white p-1" />
          <div>
            <p className="text-lg font-bold tracking-widest">IRIS</p>
            <p className="text-xs tracking-[0.32em] text-white/75">EDUCAÇÃO</p>
          </div>
        </div>

        <div className="max-w-md py-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">A rotina da escola, mais fácil de acompanhar.</h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-white/75">Acesse as informações e tarefas do seu perfil em um só lugar.</p>
          <ul className="mt-9 space-y-5">
            {areas.map(({ title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check size={14} aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="mt-0.5 block text-sm text-white/70">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/55">IRIS Educação · Gestão escolar</p>
      </aside>

      <main className="flex min-h-dvh flex-1 items-center justify-center bg-[hsl(var(--background))] px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
