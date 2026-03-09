"use client";

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ShieldCheck, Settings, ArrowLeft, Plus, X, Save, Tag } from 'lucide-react';
import { useSettings, useUpdateTeams } from '@/hooks/useFlags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateTeams = useUpdateTeams();

  const [teams, setTeams] = useState<string[] | null>(null);
  const [newTeam, setNewTeam] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Use local draft if editing, otherwise fall back to loaded settings
  const currentTeams = teams ?? settings?.teams ?? [];

  const handleAddTeam = () => {
    const trimmed = newTeam.trim();
    if (!trimmed) return;
    if (currentTeams.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      toast({ title: 'Team already exists', description: `"${trimmed}" is already in the list.`, variant: 'destructive' });
      return;
    }
    setTeams([...currentTeams, trimmed]);
    setNewTeam('');
    inputRef.current?.focus();
  };

  const handleRemoveTeam = (team: string) => {
    setTeams(currentTeams.filter(t => t !== team));
  };

  const handleSave = () => {
    updateTeams.mutate(currentTeams, {
      onSuccess: () => {
        toast({ title: 'Teams Saved', description: `${currentTeams.length} teams saved successfully.` });
        setTeams(null); // reset draft — settings query will refetch
      },
      onError: () => {
        toast({ title: 'Save Failed', description: 'Could not write to Firestore.', variant: 'destructive' });
      },
    });
  };

  const isDirty = teams !== null;

  return (
    <div className="min-h-screen pb-20">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4">
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
            <Settings className="w-4 h-4" />
            <span className="text-sm font-semibold">Settings</span>
          </div>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-8 mt-10 space-y-8">

        {/* Teams */}
        <div className="glass rounded-2xl border-border/20 shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-border/10 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3 h-3" /> Teams
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Teams available when assigning governance to a flag.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-code text-muted-foreground">{currentTeams.length} teams</span>
              {isDirty && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateTeams.isPending}
                  className="rounded-full px-5 bg-primary hover:bg-primary/80 font-bold text-xs uppercase tracking-widest"
                >
                  <Save className="w-3 h-3 mr-2" />
                  {updateTeams.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Current teams */}
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentTeams.map(team => (
                  <div key={team}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-white/5 border border-border/20 group"
                  >
                    <span className="text-sm font-medium text-foreground/80">{team}</span>
                    <button
                      onClick={() => handleRemoveTeam(team)}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title={`Remove ${team}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {currentTeams.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No teams defined yet.</p>
                )}
              </div>
            )}

            {/* Add new team */}
            <div className="flex gap-3 pt-2 border-t border-border/10">
              <Input
                ref={inputRef}
                value={newTeam}
                onChange={e => setNewTeam(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTeam()}
                placeholder="New team name..."
                className="h-9 rounded-full border-border/20 bg-white/5 focus-visible:ring-primary text-sm"
              />
              <Button
                onClick={handleAddTeam}
                disabled={!newTeam.trim()}
                size="sm"
                variant="outline"
                className="rounded-full px-4 border-border/20 bg-white/5 hover:bg-white/10 font-bold text-xs uppercase tracking-widest shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add
              </Button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
