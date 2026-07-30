import { Outlet } from 'react-router'
import { useTheme } from '../../contexts/ThemeContext'

export function PublicLayout() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ background: 'hsl(var(--background))' }}
    >
      {/* Branding panel - hidden on mobile */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col items-center justify-center relative overflow-hidden p-12"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, hsl(245 58% 16%), hsl(230 25% 12%))'
            : 'linear-gradient(135deg, hsl(245 58% 51%), hsl(230 67% 40%))',
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-1/4 -left-16 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(0 0% 100% / 0.3), transparent)' }}
        />
        <div
          className="absolute bottom-1/4 -right-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(0 0% 100% / 0.2), transparent)' }}
        />

        <div className="relative text-center max-w-md">
          <svg width="80" height="80" viewBox="0 0 120 120" className="mx-auto mb-6" aria-label="IRIS">
            <ellipse cx="60" cy="60" rx="46" ry="24" fill="none" stroke="white" strokeWidth="3.4" opacity="0.6" />
            <circle cx="60" cy="60" r="18" fill="white" opacity="0.9" />
            <circle cx="60" cy="60" r="12" fill="white" opacity="0.7" />
            <circle cx="60" cy="60" r="7" fill="white" />
          </svg>

          <h1 className="text-4xl font-extrabold text-white tracking-wider mb-2">IRIS</h1>
          <p className="text-white/80 text-lg font-light tracking-widest mb-6">EDUCAÇÃO</p>

          <p className="text-white/70 text-base leading-relaxed">
            Gestão escolar completa para instituições de ensino.
          </p>

          <div className="mt-10 space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Multi-tenancy</p>
                <p className="text-white/60 text-xs mt-0.5">Gerencie múltiplas escolas em uma única plataforma</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Gestão Acadêmica</p>
                <p className="text-white/60 text-xs mt-0.5">Alunos, professores, turmas, notas e frequência</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Financeiro</p>
                <p className="text-white/60 text-xs mt-0.5">Controle de mensalidades, boletos e recebimentos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-screen md:min-h-0">
        <Outlet />
      </div>
    </div>
  )
}
