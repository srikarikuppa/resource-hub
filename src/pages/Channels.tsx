import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Channel {
  id: string;
  name: string;
  subject: string;
  teacher_name: string;
}

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Create Channel State
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelSubject, setNewChannelSubject] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast.error('Failed to fetch channels');
    } else if (data) {
      setChannels(data);
    }
    setIsLoading(false);
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !newChannelSubject.trim() || !user) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsCreating(true);
    const { data, error } = await supabase
      .from('channels')
      .insert({
        name: newChannelName,
        subject: newChannelSubject,
        teacher_name: user.email?.split('@')[0] || 'Teacher',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create channel');
    } else if (data) {
      toast.success('Channel Created successfully!');
      setChannels((prev) => [...prev, data]);
      setIsDialogOpen(false);
      setNewChannelName('');
      setNewChannelSubject('');
      navigate(`/channels/${data.id}`);
    }
    setIsCreating(false);
  };

  return (
    <div className="container max-w-2xl py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1" style={{ lineHeight: '1.15' }}>
            Live Channels
          </h1>
          <p className="text-sm text-muted-foreground">Subject-based real-time discussion spaces</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="rounded-xl shadow-soft-lg transition-all hover:shadow-glow"
              onClick={() => {
                if (!user) {
                  toast.error("You must be logged in to create a channel");
                  return;
                }
                setIsDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Channel
            </Button>
          </DialogTrigger>
          {user && (
            <DialogContent className="sm:max-w-[425px] rounded-2xl border-border bg-card">
              <DialogHeader>
                <DialogTitle>Create New Channel</DialogTitle>
                <DialogDescription>
                  Start a new discussion space for a specific subject or topic.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateChannel} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Channel Name</label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="e.g. Data Structures Help"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Subject / Tag</label>
                  <input
                    type="text"
                    value={newChannelSubject}
                    onChange={(e) => setNewChannelSubject(e.target.value)}
                    placeholder="e.g. CS201"
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Channel
                </Button>
              </form>
            </DialogContent>
          )}
        </Dialog>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
             <div key={i} className="w-full h-24 rounded-xl border border-border bg-muted animate-pulse" />
          ))
        ) : channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xl bg-card">
            <MessageCircle className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">No channels created yet</p>
            <p className="text-sm text-muted-foreground/70">Click 'New Channel' to start one!</p>
          </div>
        ) : (
          channels.map((channel, i) => (
            <Link
              to={`/channels/${channel.id}`}
              key={channel.id}
              className={`w-full flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5 active:scale-[0.98] animate-fade-up stagger-${Math.min(i + 1, 5)} group`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">{channel.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground truncate mb-1">Created by {channel.teacher_name}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {channel.subject}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
