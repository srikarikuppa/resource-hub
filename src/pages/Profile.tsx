import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Bookmark, Settings, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResources } from '@/lib/resource-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface Resource {
  id: string;
  title: string;
  subject: string;
  created_at: string;
}

const Profile = () => {
  const { savedIds } = useResources();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userUploads, setUserUploads] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const fetchUploads = async () => {
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('uploaded_by', user.uid)
        .order('created_at', { ascending: false });
      
      if (data) setUserUploads(data as Resource[]);
      setIsLoading(false);
    };
    fetchUploads();
  }, [user]);

  if (!user) {
    return (
      <div className="container max-w-2xl py-20 text-center animate-fade-in">
        <p className="text-muted-foreground mb-4">You must be logged in to view your profile</p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="container max-w-2xl py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="animate-fade-up">
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft mb-6">
          <div className="flex items-center gap-4 mb-6">
            {user.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="h-16 w-16 rounded-2xl object-cover border border-border/50" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{displayName}</h1>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Uploads', value: userUploads.length, icon: Upload },
              { label: 'Saved', value: savedIds.size, icon: Bookmark },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3 text-center transition-colors hover:bg-muted">
                <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-semibold text-foreground tabular-nums">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto mt-1" /> : value}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="animate-fade-up stagger-1">
          <h2 className="text-base font-semibold text-foreground mb-3">Your Uploads</h2>
          {isLoading ? (
             <div className="flex justify-center py-8 text-muted-foreground">
               <Loader2 className="h-6 w-6 animate-spin" />
             </div>
          ) : userUploads.length > 0 ? (
            <div className="space-y-3">
              {userUploads.map(r => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-soft group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 bg-muted px-2 py-1 rounded-md">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-xl bg-card">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">You haven't uploaded any resources yet.</p>
              <Link to="/upload" className="text-sm text-primary hover:underline mt-1 inline-block">Upload one now</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
