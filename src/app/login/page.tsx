import { signIn } from '@/auth';
import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="glass border border-border/20 rounded-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight">FlagOps</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Governance Dashboard</p>
        </div>
        <form
          action={async () => {
            'use server';
            await signIn('okta');
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Sign in with Okta
          </button>
        </form>
      </div>
    </div>
  );
}
