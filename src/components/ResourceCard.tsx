import { Link } from 'react-router-dom';
import { FileText, Presentation, BookOpen, ClipboardList, FlaskConical, HelpCircle, Download, Star, Bookmark } from 'lucide-react';
import type { Resource } from '@/lib/mock-data';
import { useResources } from '@/lib/resource-context';

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  presentation: Presentation,
  notes: BookOpen,
  assignment: ClipboardList,
  'lab-manual': FlaskConical,
  'question-paper': HelpCircle,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600',
  presentation: 'bg-amber-50 text-amber-600',
  notes: 'bg-primary/10 text-primary',
  assignment: 'bg-emerald-50 text-emerald-600',
  'lab-manual': 'bg-teal-50 text-teal-600',
  'question-paper': 'bg-orange-50 text-orange-600',
};

const ResourceCard = ({ resource }: { resource: Resource }) => {
  const Icon = typeIcons[resource.type] || FileText;
  const colorClass = typeColors[resource.type] || 'bg-muted text-muted-foreground';
  const { toggleSave, isSaved } = useResources();
  const saved = isSaved(resource.id);

  return (
    <Link
      to={`/resource/${resource.id}`}
      className="group block rounded-xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSave(resource.id); }}
          className={`shrink-0 rounded-lg p-1.5 transition-colors active:scale-[0.9] ${
            saved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <h3 className="text-sm font-semibold text-foreground leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
        {resource.title}
      </h3>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{resource.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
          {resource.year}
        </span>
        <span className="inline-block rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
          {resource.branch}
        </span>
        <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {resource.subject}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
            {resource.rating}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3.5 w-3.5" />
            {resource.downloads}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>{resource.fileSize}</span>
          {resource.fileUrl && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(resource.fileUrl, '_blank');
              }}
              className="rounded-full bg-primary/10 p-1.5 text-primary hover:bg-primary hover:text-white transition-colors"
              title="Download"
            >
              <Download className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ResourceCard;
