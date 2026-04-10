import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Bookmark, FileText, User, Calendar, HardDrive, Plus, Loader2, ThumbsUp, Trash2 } from 'lucide-react';
import { useResources } from '@/lib/resource-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Resource } from '@/lib/mock-data';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ReviewData {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  likes: number;
  user_id: string;
  liked_by: string[];
}

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const { toggleSave, isSaved } = useResources();
  const saved = resource ? isSaved(resource.id) : false;
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchResourceAndReviews = async () => {
      if (!id) return;
      setIsLoading(true);
      
      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (!resourceError && resourceData) {
        setResource({
          id: resourceData.id,
          title: resourceData.title,
          type: resourceData.type,
          year: resourceData.year,
          branch: resourceData.branch,
          subject: resourceData.subject,
          uploadedBy: resourceData.description?.includes('Uploaded by') ? resourceData.description.split('Uploaded by ')[1] : 'Anonymous',
          fileSize: resourceData.file_size,
          fileUrl: resourceData.file_url,
          rating: 4.5,
          downloads: 42,
          reviewCount: 15,
          description: resourceData.description,
          uploadDate: new Date(resourceData.created_at).toLocaleDateString()
        });
      }

      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('resource_id', id)
        .order('created_at', { ascending: false });

      if (!reviewsError && reviewsData) {
        setReviews(reviewsData);
      }
      
      setIsLoading(false);
    };

    fetchResourceAndReviews();
  }, [id]);

  const handlePostReview = async () => {
    if (!id || !comment.trim()) return;
    if (!user) {
      toast.error('You must be logged in to post a review');
      return;
    }
    
    setIsPosting(true);
    const newReview = {
      resource_id: id,
      user_id: user.uid,
      user_name: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
      rating: 5,
      comment: comment.trim(),
    };

    const { data: insertedReview, error } = await supabase
      .from('reviews')
      .insert(newReview)
      .select()
      .single();

    if (error) {
      toast.error('Failed to post review. Make sure you ran the SQL script.');
      console.error('Error posting review:', error);
    } else if (insertedReview) {
      setReviews([insertedReview, ...reviews]);
      setComment('');
      toast.success('Review posted successfully!');
    }
    
    setIsPosting(false);
  };

  const handleLikeReview = async (reviewId: string, currentLikes: number, likedBy: string[] | undefined) => {
    if (!user) {
      toast.error('You must be logged in to like a comment');
      return;
    }
    
    // Ensure likedBy is an array
    const currentLikedBy = likedBy || [];
    const hasLiked = currentLikedBy.includes(user.uid);

    let newLikedBy;
    let newLikesCount;

    if (hasLiked) {
      // Unlike
      newLikedBy = currentLikedBy.filter(id => id !== user.uid);
      newLikesCount = Math.max(0, (currentLikes || 0) - 1);
    } else {
      // Like
      newLikedBy = [...currentLikedBy, user.uid];
      newLikesCount = (currentLikes || 0) + 1;
    }

    // Optimistic update
    setReviews(reviews.map(r => 
      r.id === reviewId ? { ...r, likes: newLikesCount, liked_by: newLikedBy } : r
    ));

    const { error } = await supabase
      .from('reviews')
      .update({ likes: newLikesCount, liked_by: newLikedBy })
      .eq('id', reviewId);

    if (error) {
      // Revert on error
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, likes: currentLikes, liked_by: currentLikedBy } : r
      ));
      toast.error('Failed to update like');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user) return;
    const previousReviews = [...reviews];
    setReviews(reviews.filter(r => r.id !== reviewId));

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      setReviews(previousReviews);
      toast.error('Failed to delete comment');
    } else {
      toast.success('Comment deleted successfully');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading resource details...</p>
      </div>
    );
  }

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
              <Button 
                size="sm"
                onClick={() => resource.fileUrl && window.open(resource.fileUrl, '_blank')}
                disabled={!resource.fileUrl}
              >
                <Download className="h-4 w-4 mr-1" /> {resource.fileUrl ? 'Download' : 'No File'}
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
                    <span className="text-sm font-medium text-foreground">{review.user_name}</span>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleLikeReview(review.id, review.likes, review.liked_by)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${user && review.liked_by?.includes(user.uid) ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${user && review.liked_by?.includes(user.uid) ? "fill-current" : ""}`} />
                        <span>{review.likes || 0}</span>
                      </button>
                      
                      {user && (!review.user_id || review.user_id === user.uid) && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="Delete comment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <span className="text-xs text-muted-foreground/70 mt-1 block">{new Date(review.created_at).toLocaleDateString()}</span>
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
              onKeyDown={e => e.key === 'Enter' && !isPosting && handlePostReview()}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 transition-all"
            />
            <Button size="sm" onClick={handlePostReview} disabled={!comment.trim() || isPosting}>
              {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
            </Button>
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
