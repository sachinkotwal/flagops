"use client";

import Link from 'next/link';
import { ShieldCheck, Users, ArrowLeft, RefreshCw } from 'lucide-react';
import { useUsers } from '@/hooks/useFlags';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString([], {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function UsersPage() {
  const { data: users = [], isLoading, refetch, isFetching, dataUpdatedAt } = useUsers();

  const lastSync = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="min-h-screen pb-20">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FlagOps</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mt-0.5">Optimizely Governance</p>
            </div>
          </Link>
          <div className="h-5 w-px bg-border/40 mx-2" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">Users</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest">
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">Last Sync</p>
            <p className="text-xs font-medium text-foreground mt-1">
              {lastSync ? lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-full border-border/20 bg-white/5 hover:bg-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 mt-10 space-y-8">
        {/* Stat card */}
        <div className="grid grid-cols-4 gap-6">
          <div className="glass rounded-lg p-7 relative overflow-hidden animate-fade-up opacity-0 fill-mode-forwards col-span-1">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#60a0ff]" />
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Users</span>
            </div>
            <div className="text-4xl font-bold font-code text-foreground leading-none mb-2">
              {isLoading ? '—' : users.length}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Extracted from flag creators</div>
          </div>
        </div>

        {/* Users table */}
        <div className="glass rounded-2xl border-border/20 shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-border/10">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3 h-3" /> User Roster
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Populated from <code className="bg-white/5 px-1 rounded text-[11px]">created_by_user_email</code> in Optimizely flag data. Never deleted — additive only.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Users className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">No users yet.</p>
              <p className="text-xs">Users are populated automatically when flags are synced from Optimizely.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-border/10 hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-12 w-8 pl-8">#</TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-12">Email</TableHead>
                  <TableHead className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest h-12">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.email} className="border-border/5 hover:bg-white/[0.03] transition-colors">
                    <TableCell className="pl-8 text-xs text-muted-foreground font-code">{index + 1}</TableCell>
                    <TableCell className="py-4">
                      <span className="text-sm font-medium text-foreground">{user.email}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.lastSeenAt ? formatDate(user.lastSeenAt) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
