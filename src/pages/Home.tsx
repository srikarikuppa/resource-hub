import { useState, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Sparkles, X, Brain } from 'lucide-react';
import ResourceCard from '@/components/ResourceCard';
import FilterBar from '@/components/FilterBar';
import { Resource, SUBJECTS } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
// AI search logic moved to secure backend to protect credentials
import { toast } from 'sonner';

const Home = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('search') || '';

  const [year, setYear] = useState('all');
  const [branch, setBranch] = useState('all');
  const [subject, setSubject] = useState('all');
  const [type, setType] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiHighlightedIds, setAiHighlightedIds] = useState<string[] | null>(null);
  const [aiReason, setAiReason] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<'AI' | 'LOCAL' | null>(null);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  useEffect(() => {
    const isSemantic = searchParams.get('mode') === 'semantic';

    if (isSemantic && searchQuery && resources.length > 0) {
      performSemanticSearch(searchQuery);
    } else {
      // Very important: explicitly clear these to ensure the dashboard reverts to normal view
      setAiHighlightedIds(null);
      setAiReason(null);
      setIsAILoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchParams, resources.length]);

  const performSemanticSearch = async (query: string) => {
    setIsAILoading(true);
    setAiHighlightedIds([]);
    setAiReason(null);

    const catalogData = resources.map(r => ({
      id: r.id,
      title: r.title,
      subject: r.subject,
      branch: r.branch,
      description: r.description,
      type: r.type
    }));

    try {
      // Use relative path for production reliability
      const response = await fetch('/api/search', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, catalog: catalogData })
      });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Backend search failed");
    }

    const data = await response.json();
    setAiHighlightedIds(data.ids || []);
    setAiReason(data.reason || null);
    setSearchSource(data.source || 'AI');

    if (data.ids.length === 0) {
      toast.info("AI couldn't find an exact semantic match, try a broader description.");
    }
    } catch (err: unknown) {
      console.error("Semantic Search Error:", err);
      setAiHighlightedIds(null);
      
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes("429")) {
      toast.error("AI Quota Exceeded. Please wait a minute.");
    } else {
      toast.error(`AI Search Error: ${errorMsg || "Check if backend is running."}`);
    }
  } finally {
    setIsAILoading(false);
  }
};

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
  // If we have AI highlights, show ONLY those
  if (aiHighlightedIds !== null) {
    return resources.filter(r => aiHighlightedIds.includes(r.id));
  }

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
}, [year, branch, subject, type, searchQuery, resources, aiHighlightedIds]);

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

      {aiReason && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${searchSource === 'LOCAL' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
              {searchSource === 'LOCAL' ? (
                <Brain className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">
              <span className={searchSource === 'LOCAL' ? 'text-blue-500 mr-1' : 'text-primary mr-1'}>
                {searchSource === 'LOCAL' ? 'Keyword Match:' : 'AI Reasoning:'}
              </span>
              {aiReason}
            </p>
          </div>
          <button
            onClick={() => { setAiHighlightedIds(null); setAiReason(null); }}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>

    {isAILoading ? (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 scale-150"></div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
            <Brain className="h-8 w-8" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">AI is thinking...</h3>
        <p className="text-sm text-muted-foreground max-w-xs">Scanning the entire catalog to find your specific request.</p>
      </div>
    ) : isLoading ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[200px] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    ) : filtered.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <p className="text-muted-foreground mb-2">No resources match your filters.</p>
        <button
          onClick={() => {
            setYear('all'); setBranch('all'); setSubject('all'); setType('all');
            navigate('/');
          }}
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
