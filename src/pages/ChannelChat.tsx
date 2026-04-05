import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, MessageCircle, Pencil, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface Message {
  id: string;
  user_id: string;
  user_email: string;
  content: string;
  created_at: string;
}

interface Channel {
  id: string;
  name: string;
  subject: string;
  teacher_name: string;
}

export default function ChannelChat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    // Fetch initial channel info and messages
    const fetchChat = async () => {
      // 1. Fetch channel info
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', id)
        .single();
      
      if (channelError) {
        toast.error('Failed to load channel details');
      } else {
        setChannel(channelData);
      }

      // 2. Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        toast.error('Failed to load messages');
      } else if (messagesData) {
        setMessages(messagesData);
      }

      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    fetchChat();

    // Subscribe to realtime updates for this specific channel
    const subscription = supabase
      .channel(`room:${id}`)
      .on('postgres_changes', { 
        event: '*',  // Listen to ALL events (INSERT, UPDATE, DELETE)
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new as Message : m));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage(''); // optimistic clear

    const { data, error } = await supabase
      .from('messages')
      .insert({
        channel_id: id,
        user_id: user.uid,
        user_email: user.email || 'Anonymous',
        content
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to send message');
      setNewMessage(content); // restore on fail
    } else if (data) {
      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    
    setIsSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    // Optimistic delete
    const originalMessages = [...messages];
    setMessages(prev => prev.filter(m => m.id !== messageId));

    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) {
      toast.error('Failed to delete message');
      setMessages(originalMessages);
    } else {
      toast.success('Message deleted');
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessageId || !editContent.trim()) {
      setEditingMessageId(null);
      return;
    }

    const { error } = await supabase
      .from('messages')
      .update({ content: editContent.trim() })
      .eq('id', editingMessageId);

    if (error) {
      toast.error('Failed to update message');
    } else {
      setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content: editContent.trim() } : m));
      setEditingMessageId(null);
    }
  };

  return (
    <div className="container max-w-4xl py-4 flex flex-col min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/channels" className="p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isLoading ? 'Loading...' : channel?.name || 'Unknown Channel'}
            </h1>
            <p className="text-xs text-muted-foreground">{channel?.subject} • Instructed by {channel?.teacher_name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full pr-2 space-y-4 pb-8 bg-muted/10 rounded-2xl p-4">
        {isLoading ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-sm text-muted-foreground text-center animate-fade-up">
            <MessageCircle className="h-10 w-10 mb-3 opacity-20" />
            No messages yet.<br />Be the first to ask a question!
          </div>
        ) : (
          messages.map((message) => {
            const isMe = user?.uid === message.user_id;
            const isEditing = editingMessageId === message.id;

            return (
              <div key={message.id} className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-up`}>
                <div className="text-[11px] text-muted-foreground mb-1 px-1">
                  {isMe ? 'You' : message.user_email.split('@')[0]}
                </div>
                
                {isEditing ? (
                  <div className="flex flex-col gap-2 max-w-[80%] bg-card border border-border shadow-soft rounded-xl p-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-background border border-border/50 rounded-lg text-sm px-3 py-2 min-h-[60px] focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingMessageId(null)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors" title="Cancel">
                        <X className="h-4 w-4" />
                      </button>
                      <button onClick={handleEditMessage} className="p-1.5 text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-md transition-colors" title="Save Edit">
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`relative flex items-center gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div 
                      className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isMe 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-card border border-border shadow-soft rounded-tl-sm text-foreground'
                      }`}
                      style={{ wordBreak: 'break-word' }}
                    >
                      {message.content}
                    </div>

                    {isMe && (
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 mt-1">
                        <button 
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditContent(message.content);
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors" 
                          title="Edit"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMessage(message.id)} 
                          className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      <div className="mt-4 shrink-0 bg-background pt-2">
        {!user ? (
          <div className="p-4 text-center rounded-xl border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground mb-2">You must be logged in to chat</p>
            <Link to="/auth" className="flex items-center justify-center max-w-[200px] mx-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all">
              Sign In to participate
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-card rounded-2xl border border-border p-2 focus-within:ring-2 focus-within:ring-ring/40 transition-all shadow-soft">
            <textarea
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-32 min-h-[44px]"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              rows={1}
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
