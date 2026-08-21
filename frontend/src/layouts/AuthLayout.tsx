import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="paper-grain min-h-dvh">
      <div className="mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="hidden flex-col justify-between p-10 text-chamber lg:flex">
          <p className="font-mono text-[11px] tracking-[0.22em] text-seal">SECUREWORKSPACE</p>
          <div>
            <h1 className="font-display text-6xl leading-[0.95] tracking-display">
              Pregúntale a tu workspace.
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink/70">
              En lugar de buscar entre cientos de documentos, pregunta por un acuerdo, una fecha o una obligación.
            </p>
          </div>
          <p className="font-mono text-xs text-ink/45">Archivo privado · conocimiento autorizado</p>
        </aside>
        <main className="flex items-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <Link to="/login" className="mb-8 block font-display text-2xl tracking-display lg:hidden">
              SecureWorkspace
            </Link>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
