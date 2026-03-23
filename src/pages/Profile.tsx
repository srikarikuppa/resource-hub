import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Bookmark, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockResources } from '@/lib/mock-data';
import { useResources } from '@/lib/resource-context';

const Profile = () => {
  const { savedIds } = useResources();
  const userUploads = mockResources.filter(r => r.uploadedBy === 'Prof. Ananya Sharma');

  return (
    <div className="container max-w-2xl py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="animate-fade-up">
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl font-bold">
              AS
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Prof. Ananya Sharma</h1>
              <p className="text-sm text-muted-foreground">ananya.sharma@university.edu</p>
              <p className="text-xs text-muted-foreground mt-0.5">CSE Department · Faculty</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Uploads', value: userUploads.length, icon: Upload },
              { label: 'Saved', value: savedIds.size, icon: Bookmark },
              { label: 'Downloads', value: '1.2k', icon: Settings },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3 text-center">
                <Icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="animate-fade-up stagger-1">
          <h2 className="text-base font-semibold text-foreground mb-3">Your Uploads</h2>
          {userUploads.length > 0 ? (
            <div className="space-y-3">
              {userUploads.map(r => (
                <Link
                  key={r.id}
                  to={`/resource/${r.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-soft active:scale-[0.98]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.subject} · {r.downloads} downloads</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{r.uploadDate}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No uploads yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
