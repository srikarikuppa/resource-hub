import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ResourceCard from '@/components/ResourceCard';
import FilterBar from '@/components/FilterBar';
import { Resource, SUBJECTS } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

const Home = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [year, setYear] = useState('all');
  const [branch, setBranch] = useState('all');
  const [subject, setSubject] = useState('all');
  const [type, setType] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
      } else if (data) {
        // Map snake_case to camelCase
        const mappedResources: Resource[] = data.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          year: r.year,
          branch: r.branch,
          subject: r.subject,
          uploadedBy: r.description?.includes('Uploaded by') ? r.description.split('Uploaded by ')[1] : 'Unknown',
          uploadedByUid: r.uploaded_by,
          uploadDate: new Date(r.created_at).toISOString().split('T')[0],
          downloads: 0,
          rating: 0,
          reviewCount: 0,
          description: r.description || '',
          fileSize: r.file_size || '0 MB',
          fileUrl: r.file_url
        }));
        setResources(mappedResources);
      }
      setIsLoading(false);
    };

    fetchResources();
  }, []);

  const availableSubjects = useMemo(() => {
    let mockData: string[] = [];
    if (branch !== 'all') {
      mockData = SUBJECTS[branch] || [];
    }
    
    const uploadedSubjects = resources
      .filter(r => branch === 'all' || r.branch === branch)
      .map(r => r.subject)
      .filter(Boolean);
      
    return Array.from(new Set([...mockData, ...uploadedSubjects])).sort();
  }, [resources, branch]);

  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (year !== 'all' && r.year !== year) return false;
      if (branch !== 'all' && r.branch !== branch) return false;
      if (subject !== 'all' && r.subject !== subject) return false;
      if (type !== 'all' && r.type !== type) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const text = `${r.title} ${r.subject} ${r.branch} ${r.description} ${r.type}`.toLowerCase();
        return q.split(/\s+/).every(word => text.includes(word));
      }
      return true;
    });
  }, [year, branch, subject, type, searchQuery, resources]);

  return (
    <div className="container py-8">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1" style={{ lineHeight: '1.15' }}>
          Resource Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          {searchQuery
            ? `Showing results for "${searchQuery}"`
            : 'Browse and discover academic resources shared by your community'}
        </p>
      </div>

      <div className="mb-6 animate-fade-up stagger-1">
        <FilterBar
          year={year} branch={branch} subject={subject} type={type}
          onYearChange={setYear} onBranchChange={setBranch}
          onSubjectChange={setSubject} onTypeChange={setType}
          dynamicSubjects={availableSubjects}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[200px] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <p className="text-muted-foreground mb-2">No resources match your filters.</p>
          <button
            onClick={() => { setYear('all'); setBranch('all'); setSubject('all'); setType('all'); }}
            className="text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r, i) => (
            <div key={r.id} className={`animate-fade-up stagger-${Math.min(i + 1, 5)}`}>
              <ResourceCard resource={r} />
            </div>
          ))}
        </div>
      )}

      <Link
        to="/upload"
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-lg transition-all hover:shadow-glow hover:scale-105 active:scale-95 z-40"
        title="Upload Resource"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
};

export default Home;
