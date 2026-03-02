import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayerStore } from './stores/playerStore';
import sonaraLogo from './assets/sonara_logo.svg';

interface Track {
  id: number;
  title: string;
  audio_file: string;
  username: string;
  display_name?: string;
  profile_picture: string | null;
  cover_image?: string | null;
  type: 'track' | 'publication';
  play_count?: number;
  like_count?: number;
  uploaded_at?: string;
  published_at?: string;
}

interface SearchUser {
  id: number;
  username: string;
  profile_picture: string | null;
  bio: string;
  role: string;
}

const ListenerHome = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');

  const [trending, setTrending] = useState<Track[]>([]);
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const globalPlayerState = usePlayerStore();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    document.title = 'Home | Sonara';
    const token = localStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return; }

    const init = async () => {
      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/login');
          return;
        }
        const profileData = await profileRes.json();
        setUsername(profileData.username);

        const [trendRes, newRes, exploreRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/auth/trending/`),
          fetch(`${API_BASE_URL}/api/auth/new-releases/`),
          fetch(`${API_BASE_URL}/api/auth/explore/`),
        ]);

        // fmt handles both { tracks, publications } (trending/new-releases)
        // AND a flat array response (explore/ which returns a plain array of tracks)
        const fmt = (d: any): Track[] => {
          if (Array.isArray(d)) {
            // explore/ returns a flat array of tracks
            return d.map((t: any) => ({ ...t, type: (t.type || 'track') as Track['type'] }));
          }
          return [
            ...(d.tracks || []).map((t: any) => ({ ...t, type: 'track' as const })),
            ...(d.publications || []).map((p: any) => ({ ...p, type: 'publication' as const })),
          ];
        };

        if (trendRes.ok) setTrending(fmt(await trendRes.json()));
        if (newRes.ok) setNewReleases(fmt(await newRes.json()));
        if (exploreRes.ok) setAllTracks(fmt(await exploreRes.json()));
      } catch {
        navigate('/login');
      } finally {
        setContentLoading(false);
      }
    };
    init();
  }, [navigate, API_BASE_URL]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchUsers([]); setSearchResults([]); setSearchOpen(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/search/?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchUsers(data.users || []);
        setSearchResults([
          ...(data.publications || []).map((p: any) => ({ ...p, type: 'publication' as const })),
          ...(data.tracks || []).map((t: any) => ({ ...t, type: 'track' as const })),
        ]);
        setSearchOpen(true);
      }
    } catch { /* silent */ } finally { setSearching(false); }
  }, [API_BASE_URL]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) { setSearchUsers([]); setSearchResults([]); setSearchOpen(false); return; }
    searchTimerRef.current = setTimeout(() => runSearch(value), 300);
  };

  const playTrack = (item: Track) => {
    usePlayerStore.getState().play({
      id: item.id,
      type: item.type,
      title: item.title,
      artist: item.display_name || item.username || 'Unknown',
      audioUrl: item.audio_file,
      coverImage: item.cover_image || item.profile_picture || null,
      artistHandle: item.username,
    });
  };

  const handleLogout = () => {
    usePlayerStore.getState().stop();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const isPlaying = (item: Track) =>
    globalPlayerState.currentTrack?.id === item.id &&
    globalPlayerState.currentTrack?.type === item.type &&
    globalPlayerState.isPlaying;

  const formatCount = (n?: number) => {
    if (!n) return '0';
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  };

  // ── Card (carousel) ──────────────────────────────────────────────────────────
  const TrackCard = ({ item }: { item: Track }) => {
    const cover = item.cover_image || item.profile_picture;
    const playing = isPlaying(item);
    return (
      <div style={s.card}>
        <div style={s.cardImgWrap}>
          {cover
            ? <img src={cover} alt="" style={s.cardImg} />
            : <div style={s.cardImgPh}><span style={{ fontSize: 32 }}>🎵</span></div>}
          <button
            className="card-play-btn"
            style={{ ...s.cardPlay, opacity: playing ? 1 : undefined }}
            onClick={() => playing ? globalPlayerState.togglePlayPause() : playTrack(item)}
          >
            {playing ? '⏸' : '▶'}
          </button>
        </div>
        <div style={s.cardInfo} onClick={() => navigate(`/${item.type}/${item.id}`)}>
          <span style={s.cardTitle}>{item.title}</span>
          <span style={s.cardArtist}
            onClick={e => { e.stopPropagation(); navigate(`/@${item.username}`); }}>
            {item.display_name || item.username}
          </span>
        </div>
      </div>
    );
  };

  // ── Track row (feed) ─────────────────────────────────────────────────────────
  const TrackRow = ({ item }: { item: Track }) => {
    const cover = item.cover_image || item.profile_picture;
    const playing = isPlaying(item);
    return (
      <div style={s.row} className="track-row">
        <div style={s.rowThumb}>
          {cover ? <img src={cover} alt="" style={s.rowThumbImg} /> : <div style={s.rowThumbPh}>🎵</div>}
          <button
            style={{ ...s.rowPlay, opacity: playing ? 1 : undefined }}
            onClick={() => playing ? globalPlayerState.togglePlayPause() : playTrack(item)}
          >
            {playing ? '⏸' : '▶'}
          </button>
        </div>
        <div style={s.rowInfo} onClick={() => navigate(`/${item.type}/${item.id}`)}>
          <span style={s.rowTitle}>{item.title}</span>
          <span style={s.rowArtist}
            onClick={e => { e.stopPropagation(); navigate(`/@${item.username}`); }}>
            {item.display_name || item.username}
          </span>
        </div>
        {/* Waveform placeholder */}
        <div style={s.waveWrap}>
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} style={{
              ...s.waveBar,
              height: `${12 + Math.abs(Math.sin(i * 0.8) * 16 + Math.cos(i * 0.3) * 8)}px`,
              background: playing
                ? `rgba(0,212,255,${0.35 + (i % 3) * 0.2})`
                : `rgba(100,150,200,${0.2 + (i % 3) * 0.15})`,
            }} />
          ))}
        </div>
        <span style={s.rowCount}>▶ {formatCount(item.play_count)}</span>
      </div>
    );
  };

  return (
    <div style={s.container}>
      <div style={s.bgOverlay} />

      <div style={s.content}>
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={s.header}>
          <img src={sonaraLogo} alt="Sonara" style={s.logo} />

          <div style={s.searchBar}>
            <div ref={searchWrapRef} style={s.searchWrap}>
              <input
                type="text"
                placeholder="Search tracks or artists..."
                style={s.searchInput}
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setSearchOpen(false);
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                onFocus={() => { if (searchResults.length > 0 || searchUsers.length > 0) setSearchOpen(true); }}
              />
              {searching && <span style={s.searchSpinner}>...</span>}

              {searchOpen && (searchUsers.length > 0 || searchResults.length > 0) && (
                <div style={s.searchDropdown}>
                  {searchUsers.length > 0 && (
                    <>
                      <div style={s.dropLabel}>People</div>
                      {searchUsers.map(u => (
                        <div key={`u-${u.id}`} style={s.dropRow}
                          onClick={() => { setSearchOpen(false); navigate(`/@${u.username}`); }}>
                          {u.profile_picture
                            ? <img src={u.profile_picture} alt="" style={s.dropAvatar} />
                            : <div style={s.dropAvatarPh}>👤</div>}
                          <div>
                            <div style={s.dropName}>{u.username}</div>
                            <div style={s.dropSub}>{u.role === 'both' ? 'Listener & Creator' : u.role}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {searchResults.length > 0 && (
                    <>
                      <div style={s.dropLabel}>Tracks & Posts</div>
                      {searchResults.map(r => (
                        <div key={`r-${r.type}-${r.id}`} style={s.dropRow}>
                          <button style={s.dropPlayBtn} onClick={() => playTrack(r)}>▶</button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={s.dropName}>{r.title}</div>
                            <div style={s.dropSub}
                              onClick={() => { setSearchOpen(false); navigate(`/@${r.username}`); }}>
                              @{r.username}
                            </div>
                          </div>
                          <span style={{ ...s.dropTag, ...(r.type === 'publication' ? s.dropTagPub : {}) }}>
                            {r.type === 'publication' ? 'POST' : 'TRACK'}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  <div style={s.dropSeeAll}
                    onClick={() => { setSearchOpen(false); navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); }}>
                    See all results
                  </div>
                </div>
              )}
            </div>
            <button style={s.settingsBtn}>⚙️</button>
            <button onClick={handleLogout} style={s.logoutBtn}>Logout</button>
          </div>
        </div>

        {/* ── Nav Tabs ──────────────────────────────────────────────────────── */}
        <div style={s.navTabs}>
          <span style={{ ...s.tab, ...s.tabActive }}>Home</span>
          <span style={s.tab}><Link to="/explore" style={s.tabLink}>Explore</Link></span>
          <span style={s.tab}><Link to="/create" style={s.tabLink}>Create</Link></span>
          <span style={s.tab}><Link to={username ? `/@${username}` : '/profile'} style={s.tabLink}>Profile</Link></span>
          <span style={s.tab}><Link to="/library" style={s.tabLink}>Library</Link></span>
        </div>

        {/* ── Main content with proper padding / max-width ─────────────────── */}
        <div style={s.main}>
          {/* ── Hero text ──────────────────────────────────────────────────── */}
          <div style={s.heroText}>
            <h1 style={s.heroTitle}>Listen. Create. Connect.</h1>
            <p style={s.heroSubtitle}>Discover your next favorite sound or make your own.</p>
          </div>

          {/* ── Content ────────────────────────────────────────────────────── */}
          {contentLoading ? (
            <div style={{ textAlign: 'center', margin: '40px 0', opacity: 0.6 }}>
              Loading featured tracks…
            </div>
          ) : (
            <>
              {/* Trending carousel */}
              {trending.length > 0 && (
                <section style={s.section}>
                  <div style={s.sectionHead}>
                    <h2 style={s.sectionTitle}>🔥 Trending Now</h2>
                    <Link to="/explore" style={s.seeAll}>See all</Link>
                  </div>
                  <div style={s.carousel}>
                    {trending.map(item => <TrackCard key={`tr-${item.type}-${item.id}`} item={item} />)}
                  </div>
                </section>
              )}

              {/* New Releases carousel */}
              {newReleases.length > 0 && (
                <section style={s.section}>
                  <div style={s.sectionHead}>
                    <h2 style={s.sectionTitle}>✨ New Releases</h2>
                    <Link to="/explore" style={s.seeAll}>See all</Link>
                  </div>
                  <div style={s.carousel}>
                    {newReleases.map(item => <TrackCard key={`nr-${item.type}-${item.id}`} item={item} />)}
                  </div>
                </section>
              )}

              {/* All tracks feed */}
              <section style={s.section}>
                <h2 style={s.sectionTitle}>All Tracks</h2>
                {allTracks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                    <p style={{ fontSize: 36, marginBottom: 12 }}>🎵</p>
                    <p>No tracks uploaded yet. Be the first!</p>
                    <Link to="/create" style={s.uploadBtn}>Upload a Track</Link>
                  </div>
                ) : (
                  <div style={s.trackList}>
                    {allTracks.map(item => <TrackRow key={`all-${item.type}-${item.id}`} item={item} />)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.6); }
        input:focus { outline: none; border-color: #00d4ff !important; box-shadow: 0 0 15px rgba(0,212,255,0.3); }
        button:hover { transform: translateY(-1px); }
        a.tab-link:hover { color: #00d4ff !important; }
        .card-play-btn { opacity: 0; transition: opacity 0.15s; }
        .card-img-wrap:hover .card-play-btn { opacity: 1 !important; }
        .track-row:hover { background: rgba(255,255,255,0.04) !important; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.4); border-radius: 2px; }
      `}</style>
    </div>
  );
};


// ─── Styles (matching ExplorePage) ──────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', width: '100%', background: 'linear-gradient(180deg,#0a0a1a 0%,#1a1a2e 50%,#16213e 100%)', fontFamily: "'Poppins',sans-serif", color: '#ffffff', position: 'relative' },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 50% 0%,rgba(100,100,200,0.1) 0%,transparent 50%)', pointerEvents: 'none' },
  content: { position: 'relative', zIndex: 1 },

  header: { position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 24px', background: 'rgba(10,10,26,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(100,150,200,0.2)' },
  logo: { height: 32, width: 'auto', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15))' },
  searchBar: { display: 'flex', alignItems: 'center', gap: 12 },
  searchWrap: { position: 'relative' },
  searchInput: { padding: '9px 18px', borderRadius: 12, border: '1.5px solid rgba(100,150,200,0.3)', background: 'rgba(30,45,80,0.6)', color: 'white', width: 300, fontSize: 14, fontFamily: "'Poppins',sans-serif", transition: 'all 0.3s ease' },
  searchSpinner: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 13, pointerEvents: 'none' },
  searchDropdown: { position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 360, overflowY: 'auto', background: 'rgba(10,10,26,0.97)', border: '1px solid rgba(100,150,200,0.25)', borderRadius: 12, zIndex: 100, backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  dropLabel: { padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  dropRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', transition: 'background 0.1s', borderBottom: '1px solid rgba(100,150,200,0.08)' },
  dropAvatar: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  dropAvatarPh: { width: 34, height: 34, borderRadius: '50%', background: 'rgba(30,45,80,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 },
  dropName: { fontSize: 13, fontWeight: 600, color: '#fff' },
  dropSub: { fontSize: 11, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' },
  dropPlayBtn: { width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#00d4ff,#0096c7)', color: '#fff', fontSize: 11, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropTag: { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6, background: 'rgba(100,150,200,0.25)', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, textTransform: 'uppercase' },
  dropTagPub: { background: 'rgba(155,89,182,0.3)', color: 'rgba(200,150,255,0.9)' },
  dropSeeAll: { padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#00d4ff', cursor: 'pointer', borderTop: '1px solid rgba(100,150,200,0.12)' },
  settingsBtn: { background: 'rgba(30,45,80,0.6)', border: '1.5px solid rgba(100,150,200,0.3)', borderRadius: 10, color: 'white', fontSize: '1.1em', cursor: 'pointer', padding: '8px 12px', transition: 'all 0.2s', lineHeight: 1 },
  logoutBtn: { padding: '9px 20px', borderRadius: 9999, border: 'none', background: 'linear-gradient(135deg,#ff6b6b,#dd4a4a)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Poppins',sans-serif", boxShadow: '0 3px 12px rgba(255,100,100,0.25)', transition: 'all 0.2s' },

  navTabs: { display: 'flex', gap: 32, padding: '0 24px', borderBottom: '1px solid rgba(100,150,200,0.2)', background: 'rgba(10,10,26,0.6)', backdropFilter: 'blur(8px)' },
  tab: { color: 'rgba(255,255,255,0.6)', cursor: 'pointer', paddingBottom: 14, paddingTop: 14, fontSize: 15, fontWeight: 500, transition: 'color 0.2s', borderBottom: '2px solid transparent', display: 'inline-block' },
  tabActive: { color: '#00d4ff', borderBottom: '2px solid #00d4ff' },
  tabLink: { color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontFamily: "'Poppins',sans-serif", fontSize: 15, fontWeight: 500 },

  main: { maxWidth: 1100, margin: '0 auto', padding: '32px 24px 120px', position: 'relative', zIndex: 1 },

  heroText: { textAlign: 'center', marginBottom: 36 },
  heroTitle: { fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg,#fff,#00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)' },

  section: { marginBottom: 44 },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#fff' },
  seeAll: { fontSize: 13, color: '#00d4ff', fontWeight: 600, textDecoration: 'none' },

  carousel: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 },
  card: { flexShrink: 0, width: 160 },
  cardImgWrap: { position: 'relative', width: 160, height: 160, borderRadius: 12, overflow: 'hidden', marginBottom: 10, background: 'rgba(30,45,80,0.35)', border: '1px solid rgba(100,150,200,0.15)', transition: 'transform 0.2s' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPh: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: 'rgba(255,255,255,0.15)' },
  cardPlay: { position: 'absolute', bottom: 8, right: 8, width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#00d4ff,#0096c7)', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,212,255,0.3)', transition: 'opacity 0.15s' },
  cardInfo: { cursor: 'pointer' },
  cardTitle: { display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 },
  cardArtist: { display: 'block', fontSize: 12, color: 'rgba(0,212,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' },

  trackList: { display: 'flex', flexDirection: 'column', gap: 10 },
  row: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 16, background: 'rgba(30,45,80,0.35)', border: '1px solid rgba(100,150,200,0.15)', transition: 'background 0.2s,transform 0.2s', cursor: 'default' },
  rowThumb: { position: 'relative', width: 52, height: 52, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(30,45,80,0.6)' },
  rowThumbImg: { width: 52, height: 52, objectFit: 'cover' },
  rowThumbPh: { width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.15)' },
  rowPlay: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#00d4ff', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.15s' },
  rowInfo: { width: 190, flexShrink: 0, cursor: 'pointer' },
  rowTitle: { display: 'block', fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 },
  rowArtist: { display: 'block', fontSize: 12, color: 'rgba(0,212,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' },
  waveWrap: { flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, height: 36, overflow: 'hidden', opacity: 0.7 },
  waveBar: { width: 3, borderRadius: 2, flexShrink: 0, transition: 'background 0.3s' },
  rowCount: { flexShrink: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 56, textAlign: 'right' },

  uploadBtn: { display: 'inline-block', marginTop: 16, padding: '12px 28px', borderRadius: 9999, background: 'linear-gradient(135deg,#00d4ff,#0096c7)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,212,255,0.3)' },
};

export default ListenerHome;
