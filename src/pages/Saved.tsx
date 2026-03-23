import { Link } from 'react-router-dom';
import { ArrowLeft, BookmarkX } from 'lucide-react';
import ResourceCard from '@/components/ResourceCard';
import { mockResources } from '@/lib/mock-data';
import { useResources } from '@/lib/resource-context';

const Saved = () => {
  const { savedIds } = useResources();
  const savedResources = mockResources.filter(r => savedIds.has(r.id));

  return (
    <div className="container py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="animate-fade-up mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1" style={{ lineHeight: '1.15' }}>
          Saved Resources
        </h1>
        <p className="text-sm text-muted-foreground">Your bookmarked materials for quick access</p>
      </div>

      {savedResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <BookmarkX className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-1">No saved resources yet</p>
          <p className="text-sm text-muted-foreground/70">Bookmark resources from the dashboard to find them here</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedResources.map((r, i) => (
            <div key={r.id} className={`animate-fade-up stagger-${Math.min(i + 1, 5)}`}>
              <ResourceCard resource={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved;
