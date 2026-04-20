import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bookmark, MessageCircle, User, GraduationCap, LogOut, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';


const Navbar = () => {
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const queryParam = new URLSearchParams(location.search).get('search') || '';

  // Sync internal input state with URL changes (e.g. clicking logo or clearing search)
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent, isSemantic: boolean = false) => {
    e.preventDefault();
    const modeParam = isSemantic ? '&mode=semantic' : '';
    const searchParam = query.trim() ? `search=${encodeURIComponent(query.trim())}` : '';
    
    if (searchParam) {
      navigate(`/?${searchParam}${modeParam}`);
    } else {
      navigate('/');
    }
  };

  const navItems = [
    { to: '/saved', icon: Bookmark, label: 'Saved' },
    { to: '/channels', icon: MessageCircle, label: 'Channels' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary transition-shadow group-hover:shadow-glow group-active:scale-[0.97]">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:block text-base font-semibold text-foreground tracking-tight">
            CampusVault
          </span>
        </Link>

        {location.pathname !== '/auth' && (
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Explain what you're looking for... ✨"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-muted/50 py-2.5 pl-10 pr-24 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40 transition-all"
              />
              <button
                type="button"
                onClick={(e) => handleSearch(e, true)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                <Sparkles className="h-3 w-3" />
                <span className="hidden xs:block">Ask AI</span>
              </button>
            </div>
          </form>
        )}

        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              {navItems.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-[0.95] ${
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                    title={label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
              <button
                onClick={logout}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-[0.95]"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            location.pathname !== '/auth' && (
              <Link
                to="/auth"
                className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-glow active:scale-95"
              >
                Sign In
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
