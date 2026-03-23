import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Users, ChevronRight } from 'lucide-react';
import { mockChannels } from '@/lib/mock-data';

const Channels = () => {
  return (
    <div className="container max-w-2xl py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="animate-fade-up mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1" style={{ lineHeight: '1.15' }}>
          Channels
        </h1>
        <p className="text-sm text-muted-foreground">Subject-based discussion spaces with your teachers</p>
      </div>

      <div className="space-y-3">
        {mockChannels.map((channel, i) => (
          <button
            key={channel.id}
            className={`w-full flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-all hover:shadow-soft-lg hover:-translate-y-0.5 active:scale-[0.98] animate-fade-up stagger-${Math.min(i + 1, 5)}`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-sm font-semibold text-foreground truncate">{channel.name}</h3>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{channel.lastMessageTime}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate mb-1">{channel.lastMessage}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                <span>{channel.teacher}</span>
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {channel.memberCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {channel.unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {channel.unreadCount}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Channels;
