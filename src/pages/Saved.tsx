import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookmarkX, Loader2 } from 'lucide-react';
import ResourceCard from '@/components/ResourceCard';
import { useResources } from '@/lib/resource-context';
import { supabase } from '@/lib/supabase';
import type { Resource } from '@/lib/mock-data';

const Saved = () => {
  const { savedIds } = useResources();
  const [savedResources, setSavedResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      if (savedIds.size === 0) {
        setSavedResources([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .in('id', Array.from(savedIds));

      if (!error && data) {
        const mapped = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          year: r.year,
          branch: r.branch,
          subject: r.subject,
          uploadedBy: r.description?.includes('Uploaded by') ? r.description.split('Uploaded by ')[1] : 'Unknown',
          fileSize: r.file_size,
          fileUrl: r.file_url,
          rating: 4.5,
          downloads: 42,
          reviewCount: 15,
          description: r.description,
          uploadDate: new Date(r.created_at).toLocaleDateString()
        }));
        setSavedResources(mapped);
      }
      setIsLoading(false);
    };

    fetchSaved();
  }, [savedIds]);

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

      {isLoading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : savedResources.length === 0 ? (
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
