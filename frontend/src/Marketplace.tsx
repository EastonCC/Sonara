import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from './utils/api';
import sonaraLogo from './assets/sonara_logo.svg';
import { HomeIcon, TrendingIcon, MusicIcon, MarketplaceIcon, BellIcon, ProfileIcon } from './components/SidebarIcons';
import { getTrackGradient } from './utils/trackGradient';
import { useNotificationStore } from './stores/notificationStore';

interface Track {
  id: number;
  title: string;
  audio_file: string;
  username: string;
  display_name?: string;
  profile_picture: string | null;
  cover_image?: string | null;
  play_count?: number;
  like_count?: number;
  price?: string;
  type: 'track';
}

interface PurchasedItem {
  trackId: number;
  title: string;
  artist: string;
  price: string;
  purchasedAt: string;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [search, setSearch] = useState('');
  const { unreadCount, startPolling } = useNotificationStore();

  // Purchase modal state
  const [buyingTrack, setBuyingTrack] = useState<Track | null>(null);
  const [step, setStep] = useState<'confirm' | 'payment' | 'success'>('confirm');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardError, setCardError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [purchased, setPurchased] = useState<PurchasedItem[]>([]);
  const [showPurchases, setShowPurchases] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState<Set<number>>(new Set());

  useEffect(() => {
    document.title = 'Marketplace | Sonara';
    const token = localStorage.getItem('accessToken');
    if (!token) { navigate('/login'); return; }

    const init = async () => {
      try {
        const profileRes = await apiFetch('/api/auth/profile/');
        if (!profileRes.ok) { navigate('/login'); return; }
        const profileData = await profileRes.json();
        setUsername(profileData.username);
        startPolling();

        // Fetch all public tracks
        const tracksRes = await apiFetch('/api/auth/explore/');
        if (tracksRes.ok) {
          const data = await tracksRes.json();
          const trackList: Track[] = Array.isArray(data)
            ? data.map((t: any) => ({ ...t, type: 'track' as const }))
            : (data.tracks || []).map((t: any) => ({ ...t, type: 'track' as const }));
          setTracks(trackList);
        }

        // Load prior purchases from backend
        const purchasesRes = await apiFetch('/api/auth/purchases/');
        if (purchasesRes.ok) {
          const purchasesData = await purchasesRes.json();
          const ownedIds = new Set<number>(purchasesData.map((p: any) => p.track.id));
          setAlreadyOwned(ownedIds);
          setPurchased(purchasesData.map((p: any) => ({
            trackId: p.track.id,
            title: p.track.title,
            artist: p.track.display_name || p.track.username,
            price: p.amount_paid === '0.00' ? 'Free' : `$${p.amount_paid}`,
            purchasedAt: new Date(p.purchased_at).toLocaleString(),
          })));
        }
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const getPrice = (track: Track) => {
    const p = parseFloat(track.price || '0');
    return p;
  };

  const getPriceLabel = (track: Track) => {
    const p = getPrice(track);
    return p === 0 ? 'Free' : `$${p.toFixed(2)}`;
  };

  const filteredTracks = tracks.filter(t => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'free' && getPrice(t) === 0) ||
      (filter === 'paid' && getPrice(t) > 0);
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.display_name || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const openBuy = (track: Track) => {
    if (alreadyOwned.has(track.id)) return;
    setBuyingTrack(track);
    setStep(getPrice(track) === 0 ? 'confirm' : 'confirm');
    setCardNumber(''); setCardName(''); setCardExpiry(''); setCardCVV(''); setCardError('');
  };

  const closeBuy = () => { setBuyingTrack(null); setProcessing(false); };

  const handleConfirm = () => {
    if (!buyingTrack) return;
    if (getPrice(buyingTrack) === 0) {
      handleFreeDownload();
    } else {
      setStep('payment');
    }
  };

  const handleFreeDownload = async () => {
    if (!buyingTrack) return;
    setProcessing(true);
    try {
      await apiFetch(`/api/auth/tracks/${buyingTrack.id}/purchase/`, { method: 'POST' });
    } catch { /* silent — still show success */ }
    setPurchased(prev => [...prev, {
      trackId: buyingTrack.id,
      title: buyingTrack.title,
      artist: buyingTrack.display_name || buyingTrack.username,
      price: 'Free',
      purchasedAt: new Date().toLocaleString(),
    }]);
    setAlreadyOwned(prev => new Set([...prev, buyingTrack.id]));
    setProcessing(false);
    setStep('success');
  };

  const handlePayment = async () => {
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length !== 16) { setCardError('Please enter a valid 16-digit card number.'); return; }
    if (cardName.trim().length < 2) { setCardError('Please enter the cardholder name.'); return; }
    if (cardExpiry.length < 5) { setCardError('Please enter a valid expiry date (MM/YY).'); return; }
    if (cardCVV.length < 3) { setCardError('Please enter a valid CVV.'); return; }
    setCardError('');
    setProcessing(true);
    try {
      await apiFetch(`/api/auth/tracks/${buyingTrack!.id}/purchase/`, { method: 'POST' });
    } catch { /* silent */ }
    setTimeout(() => {
      setPurchased(prev => [...prev, {
        trackId: buyingTrack!.id,
        title: buyingTrack!.title,
        artist: buyingTrack!.display_name || buyingTrack!.username,
        price: getPriceLabel(buyingTrack!),
        purchasedAt: new Date().toLocaleString(),
      }]);
      setAlreadyOwned(prev => new Set([...prev, buyingTrack!.id]));
      setProcessing(false);
      setStep('success');
    }, 1500);
  };

  const totalSpent = purchased
    .filter(p => p.price !== 'Free')
    .reduce((sum, p) => sum + parseFloat(p.price.replace('$', '')), 0);

  const formatCount = (n?: number) => {
    if (!n) return '0';
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <img src={sonaraLogo} alt="Sonara" style={styles.sidebarLogo} />
        </div>
        <nav style={styles.sidebarNav}>
          <Link to="/" className="sidebar-link" style={styles.sidebarLink}>
            <span style={styles.sidebarIcon}><HomeIcon /></span> Home
          </Link>
          <Link to="/explore" className="sidebar-link" style={styles.sidebarLink}>
            <span style={styles.sidebarIcon}><TrendingIcon /></span> Tracks
          </Link>
          <Link to="/create" className="sidebar-link" style={styles.sidebarLink}>
            <span style={styles.sidebarIcon}><MusicIcon /></span> Create Music
          </Link>
          <div style={{ ...styles.sidebarLink, ...styles.sidebarLinkActive }}>
            <span style={styles.sidebarIcon}><MarketplaceIcon /></span> Marketplace
          </div>
          <Link to="/notifications" className="sidebar-link" style={{ ...styles.sidebarLink, position: 'relative' }}>
            <span style={styles.sidebarIcon}><BellIcon /></span> Notifications
            {unreadCount > 0 && (
              <span style={styles.notifBadge}>{unreadCount}</span>
            )}
          </Link>
          <Link to={username ? `/@${username}` : '/profile'} className="sidebar-link" style={styles.sidebarLink}>
            <span style={styles.sidebarIcon}><ProfileIcon /></span> Profile
          </Link>
          <div style={{ ...styles.sidebarLink, cursor: 'pointer', marginTop: 8 }} onClick={() => setShowPurchases(true)}>
            <span style={styles.sidebarIcon}>🧾</span>
            My Library
            {purchased.length > 0 && <span style={styles.libraryBadge}>{purchased.length}</span>}
          </div>
        </nav>
        <div style={styles.sidebarBottom}>
          <Link to="/create" style={styles.uploadBtn}>+ Upload Track</Link>
        </div>
      </aside>

      {/* Main */}
      <div style={styles.mainArea}>
        {/* Hero */}
        <div style={styles.heroBanner}>
          <div style={styles.heroOverlay} />
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>🛒 Marketplace</h1>
            <p style={styles.heroSubtitle}>Buy tracks directly from artists. Support the music you love.</p>
          </div>
        </div>

        <div style={styles.mainContent}>
          {/* Search + Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <span style={{ opacity: 0.5, fontSize: 14 }}>🔍</span>
              <input
                type="text"
                placeholder="Search tracks or artists..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.filterTabs}>
              {(['all', 'free', 'paid'] as const).map(f => (
                <button
                  key={f}
                  style={{ ...styles.filterTab, ...(filter === f ? styles.filterTabActive : {}) }}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All Tracks' : f === 'free' ? '🎁 Free' : '💰 Paid'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{tracks.length}</span>
              <span style={styles.statLabel}>Total Tracks</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{tracks.filter(t => getPrice(t) === 0).length}</span>
              <span style={styles.statLabel}>Free Tracks</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{tracks.filter(t => getPrice(t) > 0).length}</span>
              <span style={styles.statLabel}>Paid Tracks</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{purchased.length}</span>
              <span style={styles.statLabel}>Your Library</span>
            </div>
          </div>

          {/* Track grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>Loading tracks...</div>
          ) : filteredTracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
              No tracks found. Try a different filter or search.
            </div>
          ) : (
            <div style={styles.trackGrid}>
              {filteredTracks.map(track => {
                const owned = alreadyOwned.has(track.id);
                const isFree = getPrice(track) === 0;
                return (
                  <div key={track.id} style={styles.trackCard}>
                    {/* Cover */}
                    <div style={styles.cardImageWrap} onClick={() => navigate(`/track/${track.id}`)}>
                      {track.cover_image ? (
                        <img src={track.cover_image} alt="" style={styles.cardImage} />
                      ) : (
                        <div style={{ ...styles.cardGradient, background: getTrackGradient(track.id) }} />
                      )}
                      {/* Price badge */}
                      <div style={{ ...styles.priceBadge, background: isFree ? 'rgba(52,211,153,0.9)' : 'rgba(167,139,250,0.9)' }}>
                        {getPriceLabel(track)}
                      </div>
                      {/* Owned badge */}
                      {owned && (
                        <div style={styles.ownedBadge}>✓ Owned</div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={styles.cardBody}>
                      <p style={styles.cardTitle} onClick={() => navigate(`/track/${track.id}`)}>{track.title}</p>
                      <p style={styles.cardArtist} onClick={() => navigate(`/@${track.username}`)}>
                        {track.display_name || track.username}
                      </p>
                      <div style={styles.cardStats}>
                        <span>▶ {formatCount(track.play_count)}</span>
                        <span>♥ {formatCount(track.like_count)}</span>
                      </div>
                    </div>

                    {/* Buy / Get / Owned button */}
                    <button
                      style={{
                        ...styles.buyBtn,
                        ...(owned ? styles.ownedBtn : isFree ? styles.freeBtn : styles.paidBtn),
                      }}
                      onClick={() => !owned && openBuy(track)}
                      disabled={owned}
                    >
                      {owned ? '✓ In Your Library' : isFree ? '🎁 Get Free' : `Buy ${getPriceLabel(track)}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PURCHASE MODAL */}
      {buyingTrack && (
        <div style={styles.modalOverlay} onClick={closeBuy}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>

            {step === 'confirm' && (
              <>
                <h2 style={styles.modalTitle}>
                  {getPrice(buyingTrack) === 0 ? '🎁 Get Free Track' : 'Confirm Purchase'}
                </h2>
                <div style={styles.modalTrackInfo}>
                  <div style={{ ...styles.modalArt, background: getTrackGradient(buyingTrack.id) }}>
                    {buyingTrack.cover_image
                      ? <img src={buyingTrack.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : <span style={{ fontSize: 24 }}>🎵</span>}
                  </div>
                  <div>
                    <p style={styles.modalTrackName}>{buyingTrack.title}</p>
                    <p style={styles.modalTrackArtist}>by {buyingTrack.display_name || buyingTrack.username}</p>
                  </div>
                </div>
                <div style={styles.modalPriceLine}>
                  <span style={styles.modalPriceLabel}>Price</span>
                  <span style={{ ...styles.modalPriceValue, color: getPrice(buyingTrack) === 0 ? '#34d399' : '#a78bfa' }}>
                    {getPriceLabel(buyingTrack)}
                  </span>
                </div>
                <div style={styles.modalButtons}>
                  <button style={styles.cancelBtn} onClick={closeBuy}>Cancel</button>
                  <button style={styles.confirmBtn} onClick={handleConfirm} disabled={processing}>
                    {processing ? 'Processing...' : getPrice(buyingTrack) === 0 ? 'Add to Library' : 'Continue to Payment'}
                  </button>
                </div>
              </>
            )}

            {step === 'payment' && (
              <>
                <h2 style={styles.modalTitle}>Payment Details</h2>
                <div style={styles.modalTrackInfo}>
                  <div style={{ ...styles.modalArt, background: getTrackGradient(buyingTrack.id) }}>
                    {buyingTrack.cover_image
                      ? <img src={buyingTrack.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : <span style={{ fontSize: 20 }}>🎵</span>}
                  </div>
                  <div>
                    <p style={styles.modalTrackName}>{buyingTrack.title}</p>
                    <p style={styles.modalTrackArtist}>by {buyingTrack.display_name || buyingTrack.username} • {getPriceLabel(buyingTrack)}</p>
                  </div>
                </div>

                {/* Mock Card Visual */}
                <div style={styles.mockCard}>
                  <div style={styles.mockCardTop}>
                    <span style={styles.mockCardBank}>SONARA PAY</span>
                    <span style={{ fontSize: 22, color: '#fbbf24' }}>▣</span>
                  </div>
                  <p style={styles.mockCardNumber}>{cardNumber || '•••• •••• •••• ••••'}</p>
                  <div style={styles.mockCardBottom}>
                    <div>
                      <p style={styles.mockCardLabel}>CARD HOLDER</p>
                      <p style={styles.mockCardValue}>{cardName || 'YOUR NAME'}</p>
                    </div>
                    <div>
                      <p style={styles.mockCardLabel}>EXPIRES</p>
                      <p style={styles.mockCardValue}>{cardExpiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Card Number</label>
                  <input style={styles.formInput} placeholder="1234 5678 9012 3456" maxLength={19} value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Cardholder Name</label>
                  <input style={styles.formInput} placeholder="John Doe" value={cardName} onChange={e => setCardName(e.target.value)} />
                </div>
                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>Expiry</label>
                    <input style={styles.formInput} placeholder="MM/YY" maxLength={5} value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} />
                  </div>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.formLabel}>CVV</label>
                    <input style={styles.formInput} placeholder="•••" maxLength={4} type="password" value={cardCVV} onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                  </div>
                </div>
                {cardError && <p style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>{cardError}</p>}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 16 }}>
                  🔒 Mock payment — no real card is charged
                </p>
                <div style={styles.modalPriceLine}>
                  <span style={styles.modalPriceLabel}>Total</span>
                  <span style={styles.modalPriceValue}>{getPriceLabel(buyingTrack)}</span>
                </div>
                <div style={styles.modalButtons}>
                  <button style={styles.cancelBtn} onClick={() => setStep('confirm')}>Back</button>
                  <button style={styles.confirmBtn} onClick={handlePayment} disabled={processing}>
                    {processing ? 'Processing...' : `Pay ${getPriceLabel(buyingTrack)}`}
                  </button>
                </div>
              </>
            )}

            {step === 'success' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h2 style={styles.modalTitle}>
                  {getPrice(buyingTrack) === 0 ? 'Added to Library!' : 'Purchase Complete!'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 20 }}>
                  You now own <strong>{buyingTrack.title}</strong> by {buyingTrack.display_name || buyingTrack.username}
                </p>
                <div style={styles.modalPriceLine}>
                  <span style={styles.modalPriceLabel}>Amount Paid</span>
                  <span style={{ ...styles.modalPriceValue, color: getPrice(buyingTrack) === 0 ? '#34d399' : '#a78bfa' }}>
                    {getPriceLabel(buyingTrack)}
                  </span>
                </div>
                {totalSpent > 0 && (
                  <div style={styles.modalPriceLine}>
                    <span style={styles.modalPriceLabel}>Total Spent (All Time)</span>
                    <span style={styles.modalPriceValue}>${totalSpent.toFixed(2)}</span>
                  </div>
                )}
                <button style={{ ...styles.confirmBtn, width: '100%', marginTop: 16 }} onClick={closeBuy}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY LIBRARY MODAL */}
      {showPurchases && (
        <div style={styles.modalOverlay} onClick={() => setShowPurchases(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>🧾 My Library</h2>
            {purchased.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '20px 0' }}>
                Your library is empty — go grab some tracks!
              </p>
            ) : (
              <>
                {purchased.map((p, i) => (
                  <div key={i} style={styles.purchaseRow}>
                    <div style={{ ...styles.purchaseArt, background: getTrackGradient(p.trackId) }}>🎵</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{p.title}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>by {p.artist}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.purchasedAt}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: p.price === 'Free' ? '#34d399' : '#a78bfa', flexShrink: 0 }}>
                      {p.price}
                    </span>
                  </div>
                ))}
                {totalSpent > 0 && (
                  <div style={{ ...styles.modalPriceLine, marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                    <span style={styles.modalPriceLabel}>Total Spent</span>
                    <span style={styles.modalPriceValue}>${totalSpent.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <button style={{ ...styles.confirmBtn, width: '100%', marginTop: 16 }} onClick={() => setShowPurchases(false)}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.35); }
        input:focus { outline: none; border-color: #a78bfa !important; }
        .sidebar-link:hover { background: rgba(167,139,250,0.1); color: #fff !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.4); border-radius: 2px; }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: { display: 'flex', minHeight: '100vh', background: '#0f0f1a', fontFamily: "'Poppins', sans-serif", color: 'white' },
  sidebar: { width: 240, flexShrink: 0, background: '#13131f', borderRight: '1px solid rgba(167,139,250,0.15)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 },
  sidebarTop: { padding: '24px 20px 16px', borderBottom: '1px solid rgba(167,139,250,0.1)' },
  sidebarLogo: { height: 36, width: 'auto' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 12px', flex: 1 },
  sidebarLink: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer' },
  sidebarLinkActive: { color: '#ffffff', background: 'rgba(167,139,250,0.15)' },
  sidebarIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  sidebarBottom: { padding: '16px 12px 24px', borderTop: '1px solid rgba(167,139,250,0.1)' },
  uploadBtn: { display: 'block', textAlign: 'center', padding: '12px 20px', borderRadius: 9999, background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  notifBadge: { marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: '#fff', minWidth: 20, textAlign: 'center' },
  libraryBadge: { marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, background: '#ec4899', color: '#fff' },
  mainArea: { flex: 1, marginLeft: 240, minHeight: '100vh', overflowY: 'auto' },
  heroBanner: { position: 'relative', height: 180, background: 'linear-gradient(135deg, #1c1c2e 0%, #312e81 50%, #4c1d95 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'rgba(15,15,26,0.4)', pointerEvents: 'none' },
  heroContent: { position: 'relative', zIndex: 1, textAlign: 'center' },
  heroTitle: { fontSize: 34, fontWeight: 800, marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.65)' },
  mainContent: { padding: '28px 32px 100px' },
  filterBar: { display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: 10, background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', flex: 1, minWidth: 200 },
  searchInput: { background: 'transparent', border: 'none', color: 'white', fontSize: 14, fontFamily: "'Poppins', sans-serif", width: '100%' },
  filterTabs: { display: 'flex', gap: 8 },
  filterTab: { padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' },
  filterTabActive: { background: 'rgba(167,139,250,0.15)', border: '1px solid #a78bfa', color: '#a78bfa' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: { background: '#1c1c2e', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 },
  statNum: { fontSize: 26, fontWeight: 800, color: '#a78bfa' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  trackGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 },
  trackCard: { background: '#1c1c2e', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(167,139,250,0.12)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' },
  cardImageWrap: { position: 'relative', aspectRatio: '1', cursor: 'pointer', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardGradient: { width: '100%', height: '100%' },
  priceBadge: { position: 'absolute', top: 8, left: 8, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'white' },
  ownedBadge: { position: 'absolute', bottom: 8, right: 8, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'white', background: 'rgba(52,211,153,0.9)' },
  cardBody: { padding: '12px 14px 8px' },
  cardTitle: { fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3, cursor: 'pointer' },
  cardArtist: { fontSize: 12, color: '#ec4899', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', marginBottom: 6 },
  cardStats: { display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  buyBtn: { margin: '8px 14px 14px', padding: '10px', borderRadius: 10, border: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' },
  freeBtn: { background: 'linear-gradient(135deg, #34d399, #10b981)', color: 'white' },
  paidBtn: { background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: 'white' },
  ownedBtn: { background: 'rgba(52,211,153,0.1)', color: '#34d399', cursor: 'default', border: '1px solid rgba(52,211,153,0.3)' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
  modal: { background: '#1a1a2e', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 20, padding: 32, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: 'white' },
  modalTrackInfo: { display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 20 },
  modalArt: { width: 56, height: 56, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
  modalTrackName: { fontSize: 16, fontWeight: 700, color: 'white' },
  modalTrackArtist: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  modalPriceLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalPriceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  modalPriceValue: { fontSize: 22, fontWeight: 800, color: '#a78bfa' },
  modalButtons: { display: 'flex', gap: 12 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #a78bfa, #ec4899)', color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  mockCard: { background: 'linear-gradient(135deg, #312e81, #4c1d95, #7c3aed)', borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0 8px 32px rgba(124,58,237,0.4)' },
  mockCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  mockCardBank: { fontSize: 13, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.9)' },
  mockCardNumber: { fontSize: 18, fontWeight: 600, letterSpacing: 3, color: 'white', marginBottom: 20, fontFamily: 'monospace' },
  mockCardBottom: { display: 'flex', gap: 40 },
  mockCardLabel: { fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  mockCardValue: { fontSize: 13, fontWeight: 600, color: 'white', textTransform: 'uppercase' },
  formGroup: { marginBottom: 14 },
  formRow: { display: 'flex', gap: 12 },
  formLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 },
  formInput: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 14, fontFamily: "'Poppins', sans-serif" },
  purchaseRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  purchaseArt: { width: 42, height: 42, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
};

export default Marketplace;