import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black dark:text-zinc-50">
            Motor Adaptativo UABC
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Plataforma de evaluación, gestión de sedes, e implementación del MVP para el banco de preguntas.
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-12">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-8 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] sm:w-auto font-medium">
                Iniciar Sesión
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 rounded-full px-6 py-2 shadow-sm">
                <span className="font-medium text-sm text-zinc-600 dark:text-zinc-400">Tu Perfil:</span>
                <UserButton afterSignOutUrl="/" />
              </div>
              <a
                className="flex h-12 w-full items-center justify-center rounded-full bg-blue-600 px-8 text-white transition-colors hover:bg-blue-700 sm:w-auto font-medium shadow-md"
                href="/dashboard"
              >
                Ir al Dashboard
              </a>
            </div>
          </SignedIn>
        </div>
      </main>
    </div>
  );
}
