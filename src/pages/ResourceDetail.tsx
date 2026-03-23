import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Bookmark, Star, FileText, User, Calendar, HardDrive, Plus } from 'lucide-react';
import { mockResources, mockReviews } from '@/lib/mock-data';
import { useResources } from '@/lib/resource-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const resource = mockResources.find(r => r.id === id);
  const reviews = mockReviews.filter(r => r.resourceId === id);
  const { toggleSave, isSaved } = useResources();
  const saved = resource ? isSaved(resource.id) : false;
  const [comment, setComment] = useState('');

  if (!resource) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Resource not found.</p>
        <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">Go back</Link>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to resources
      </Link>

      <div className="animate-fade-up">
        <div className="rounded-xl border border-border bg-card p-6 shadow-soft mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground tracking-tight mb-2" style={{ lineHeight: '1.2' }}>
                {resource.title}
              </h1>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSave(resource.id)}
                className={saved ? 'text-primary border-primary/30' : ''}
              >
                <Bookmark className="h-4 w-4 mr-1" fill={saved ? 'currentColor' : 'none'} />
                {saved ? 'Saved' : 'Save'}
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { icon: FileText, label: 'Type', value: resource.type.replace('-', ' ') },
              { icon: User, label: 'By', value: resource.uploadedBy },
              { icon: Calendar, label: 'Uploaded', value: resource.uploadDate },
              { icon: HardDrive, label: 'Size', value: resource.fileSize },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Icon className="h-3.5 w-3.5" /> <span className="text-xs">{label}</span>
                </div>
                <p className="font-medium text-foreground capitalize text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {[resource.year, resource.branch, resource.subject].map(tag => (
              <span key={tag} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Preview placeholder */}
        <div className="rounded-xl border border-border bg-card p-12 text-center mb-6 animate-fade-up stagger-1">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Document preview will appear here</p>
        </div>

        {/* Reviews */}
        <div className="rounded-xl border border-border bg-card p-6 animate-fade-up stagger-2">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Reviews & Comments ({reviews.length})
          </h2>

          {reviews.length > 0 ? (
            <div className="space-y-4 mb-6">
              {reviews.map(review => (
                <div key={review.id} className="rounded-lg bg-muted/30 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">{review.userName}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? '#f59e0b' : 'none'} color={i < review.rating ? '#f59e0b' : 'hsl(var(--muted-foreground))'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <span className="text-xs text-muted-foreground/70 mt-1 block">{review.date}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">No reviews yet. Be the first to share your thoughts!</p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a comment…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
            <Button size="sm" disabled={!comment.trim()}>Post</Button>
          </div>
        </div>
      </div>

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

export default ResourceDetail;
