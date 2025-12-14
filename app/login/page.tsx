import { signIn } from "@/auth"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TestLoginButton from "./TestLoginButton"
import { Flame } from "lucide-react"

export default async function LoginPage() {
  // Check if user is already logged in
  const session = await auth();
  
  if (session?.user?.id) {
    redirect('/');
  }

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      {/* Dynamic Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-rose-900/10 to-zinc-950 pointer-events-none"></div>
      
      {/* Test Login Button - Top Left Corner */}
      <div className="absolute top-6 left-6 z-30">
        <TestLoginButton />
      </div>
      
      {/* Main Login Card */}
      <div className="w-full max-w-sm rounded-3xl bg-zinc-900/80 backdrop-blur-md p-8 border border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-20 animate-fade-in overflow-hidden">
        {/* Decorative Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
        
        <div className="text-center relative z-10 mb-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/30 to-amber-500/30 rounded-full blur-xl"></div>
              <div className="relative bg-gradient-to-br from-rose-500/20 to-amber-500/20 p-4 rounded-full border border-rose-500/30">
                <Flame className="w-8 h-8 text-rose-400 fill-rose-400" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-black tracking-tight text-stone-200 mb-2 break-words">
            Welcome to Hyve
          </h2>
          <p className="text-sm text-zinc-400 font-medium break-words">
            Sign in to start your journey
          </p>
        </div>
        
        <div className="relative z-10">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-zinc-800 border border-zinc-700 px-6 py-4 text-sm font-bold text-stone-200 shadow-lg hover:bg-zinc-700 hover:border-rose-500/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all active:scale-[0.98] group"
            >
              <svg className="h-5 w-5 flex-shrink-0" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="group-hover:text-rose-200 transition-colors whitespace-nowrap">Sign in with Google</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


