import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  is_listener: boolean;
  is_creator: boolean;
  header_image: string | null;
  profile_picture: string | null;
  bio: string;
}

interface Track {
  id: number;
  title: string;
  audio_file: string;
  uploaded_at: string;
}

const TABS = ['Posts', 'Tracks', 'Playlists', 'Reposts'] as const;

const ProfilePage = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Posts');
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editIsListener, setEditIsListener] = useState(false);
  const [editIsCreator, setEditIsCreator] = useState(false);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [removeHeader, setRemoveHeader] = useState(false);
  const [removePfp, setRemovePfp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deletingTrackId, setDeletingTrackId] = useState<number | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [publications, setPublications] = useState<any[]>([]);
  const [pubsLoading, setPubsLoading] = useState(false);
  const [deletingPubId, setDeletingPubId] = useState<number | null>(null);
  const [playingPubId, setPlayingPubId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const pfpInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const startEditing = () => {
    setEditBio(user?.bio ?? '');
    setEditIsListener(user?.is_listener ?? false);
    setEditIsCreator(user?.is_creator ?? false);
    setHeaderFile(null);
    setPfpFile(null);
    setRemoveHeader(false);
    setRemovePfp(false);
    setSaveError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setSaveError('');
    setHeaderFile(null);
    setPfpFile(null);
    setRemoveHeader(false);
    setRemovePfp(false);
  };

  const fetchTracks = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    setTracksLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/tracks/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to load tracks');
      const data = await response.json();
      setTracks(data);
    } catch {
      /* silently fail — tracks area will just be empty */
    } finally {
      setTracksLoading(false);
    }
  }, [API_BASE_URL]);

  const fetchPublications = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    setPubsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/publications/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Failed to load publications');
      const data = await response.json();
      setPublications(data);
    } catch {
      /* silently fail */
    } finally {
      setPubsLoading(false);
    }
  }, [API_BASE_URL]);

  const deletePublication = async (pubId: number) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!confirm('Remove this published song?')) return;
    setDeletingPubId(pubId);
    try {
      await fetch(`${API_BASE_URL}/api/auth/publications/${pubId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (playingPubId === pubId) {
        audioRef.current?.pause();
        setPlayingPubId(null);
      }
      setPublications((prev) => prev.filter((p) => p.id !== pubId));
    } catch { /* ignore */ }
    setDeletingPubId(null);
  };

  const togglePlayPub = (pub: any) => {
    if (playingPubId === pub.id) {
      audioRef.current?.pause();
      setPlayingPubId(null);
      return;
    }
    // Stop any playing track too
    setPlayingTrackId(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = new Audio(pub.audio_file);
    } else {
      audioRef.current = new Audio(pub.audio_file);
    }
    audioRef.current.onended = () => setPlayingPubId(null);
    audioRef.current.play();
    setPlayingPubId(pub.id);
  };

  const uploadTrack = async () => {
    if (!trackFile) return;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('audio_file', trackFile);
      formData.append('title', trackTitle.trim() || trackFile.name.replace(/\.[^/.]+$/, ''));
      const response = await fetch(`${API_BASE_URL}/api/auth/tracks/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg =
          (Array.isArray(errData?.audio_file) ? errData.audio_file[0] : null) ||
          (Array.isArray(errData?.title) ? errData.title[0] : null) ||
          errData?.detail ||
          `Upload failed (${response.status})`;
        throw new Error(msg);
      }
      setTrackFile(null);
      setTrackTitle('');
      fetchTracks();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteTrack = async (trackId: number) => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    setDeletingTrackId(trackId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/tracks/${trackId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Delete failed');
      if (playingTrackId === trackId) {
        audioRef.current?.pause();
        setPlayingTrackId(null);
      }
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch {
      /* optionally show error */
    } finally {
      setDeletingTrackId(null);
    }
  };

  const togglePlay = (track: Track) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(track.audio_file);
    audio.addEventListener('ended', () => setPlayingTrackId(null));
    audio.play();
    audioRef.current = audio;
    setPlayingTrackId(track.id);
  };

  const saveProfile = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;
    setSaving(true);
    setSaveError('');
    try {
      const formData = new FormData();
      formData.append('bio', editBio);
      formData.append('is_listener', String(editIsListener));
      formData.append('is_creator', String(editIsCreator));
      if (headerFile) formData.append('header_image', headerFile);
      if (pfpFile) formData.append('profile_picture', pfpFile);
      if (removeHeader) formData.append('remove_header_image', 'true');
      if (removePfp) formData.append('remove_profile_picture', 'true');

      const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg =
          (Array.isArray(errData?.is_listener) ? errData.is_listener[0] : null) ||
          (Array.isArray(errData?.is_creator) ? errData.is_creator[0] : null) ||
          (Array.isArray(errData?.header_image) ? errData.header_image[0] : null) ||
          (Array.isArray(errData?.profile_picture) ? errData.profile_picture[0] : null) ||
          (Array.isArray(errData?.bio) ? errData.bio[0] : null) ||
          errData?.detail ||
          `Failed to update profile (${response.status})`;
        throw new Error(msg);
      }
      const data = await response.json();
      setUser(data);
      setEditing(false);
      setHeaderFile(null);
      setPfpFile(null);
      setRemoveHeader(false);
      setRemovePfp(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        navigate('/login');
        return;
      }
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/api/auth/profile/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        setUser(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // Update document title when user loads
  useEffect(() => {
    if (user?.username) {
      document.title = `${user.username}'s Profile | Sonara`;
    } else {
      document.title = 'Profile | Sonara';
    }
  }, [user?.username]);

  useEffect(() => {
    fetchTracks();
    fetchPublications();
  }, [fetchTracks, fetchPublications]);

  const headerPreviewUrl = useMemo(
    () => (headerFile ? URL.createObjectURL(headerFile) : null),
    [headerFile]
  );
  const pfpPreviewUrl = useMemo(
    () => (pfpFile ? URL.createObjectURL(pfpFile) : null),
    [pfpFile]
  );
  useEffect(() => {
    return () => {
      if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
      if (pfpPreviewUrl) URL.revokeObjectURL(pfpPreviewUrl);
    };
  }, [headerPreviewUrl, pfpPreviewUrl]);

  function getHeaderImageUrl(): string | null {
    if (editing && removeHeader) return null;
    if (editing && headerPreviewUrl) return headerPreviewUrl;
    return user?.header_image ?? null;
  }

  function getPfpImageUrl(): string | null {
    if (editing && removePfp) return null;
    if (editing && pfpPreviewUrl) return pfpPreviewUrl;
    return user?.profile_picture ?? null;
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'); @keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.backgroundOverlay} />
        <div style={styles.loadingWrap}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');`}</style>
        <div style={styles.backgroundOverlay} />
        <div style={styles.errorWrap}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={() => navigate('/login')} style={styles.errorButton}>Go to Login</button>
        </div>
      </div>
    );
  }

  const roleLabel =
    user?.role === 'both'
      ? 'Listener & Creator'
      : user?.role === 'none' || !user?.role
        ? 'No role set'
        : (user?.role ?? 'No role set').charAt(0).toUpperCase() + (user?.role ?? '').slice(1);

  return (
    <div style={styles.page}>
      <div style={styles.backgroundOverlay} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        button:hover { opacity: 0.9; transform: translateY(-2px); }
        button:active { transform: scale(0.98); }
        textarea:focus { outline: none; border-color: #00d4ff; box-shadow: 0 0 15px rgba(0, 212, 255, 0.3); }
        .profile-upload-card:hover { border-color: rgba(0, 212, 255, 0.5); background: rgba(30, 45, 80, 0.6); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Top bar */}
      <header style={styles.topBar}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={styles.backButton}
          aria-label="Back"
        >
          ←
        </button>
        <span style={styles.topBarTitle}>Profile</span>
        <div style={styles.topBarRight} />
      </header>

      {/* Cover — full width edge to edge */}
      <div style={styles.coverWrap}>
        <div
          style={{
            ...styles.cover,
            ...(getHeaderImageUrl()
              ? { backgroundImage: `url(${getHeaderImageUrl()})` }
              : {}),
          }}
        >
          {!getHeaderImageUrl() && (
            <div style={styles.coverPlaceholder}>
              <span style={styles.coverPlaceholderIcon}>🖼</span>
              <span>Header image</span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.main}>
        {/* Profile info block */}
        <div style={styles.profileBlock}>
          <div
            style={{
              ...styles.avatar,
              ...(getPfpImageUrl()
                ? { backgroundImage: `url(${getPfpImageUrl()})` }
                : {}),
            }}
          >
            {!getPfpImageUrl() && <span style={styles.avatarIcon}>👤</span>}
          </div>

          <div style={styles.nameRow}>
            <div style={styles.nameAndEdit}>
              <h1 style={styles.displayName}>{user?.username}</h1>
              {!editing && (
                <button type="button" onClick={startEditing} style={styles.editBtn}>
                  Edit profile
                </button>
              )}
            </div>
            <p style={styles.handle}>@{user?.username}</p>
          </div>

          <div style={styles.rolePill}>{roleLabel}</div>

          {editing ? (
            <div style={styles.editBlock}>
              <div style={styles.editCard}>
                <h4 style={{ ...styles.editCardTitle, ...styles.editCardTitleFirst }}>Role</h4>
                <div style={styles.roleCheckboxRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editIsListener}
                      onChange={(e) => setEditIsListener(e.target.checked)}
                      disabled={saving}
                      style={styles.checkbox}
                    />
                    <span>Listener</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editIsCreator}
                      onChange={(e) => setEditIsCreator(e.target.checked)}
                      disabled={saving}
                      style={styles.checkbox}
                    />
                    <span>Creator</span>
                  </label>
                </div>

                <h4 style={styles.editCardTitle}>Bio</h4>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  style={styles.bioInput}
                  disabled={saving}
                />

                <h4 style={styles.editCardTitle}>Cover photo</h4>
                <div style={styles.uploadRow}>
                  <input
                    ref={headerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setHeaderFile(f);
                      setRemoveHeader(false);
                      e.target.value = '';
                    }}
                    style={styles.hiddenFileInput}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => headerInputRef.current?.click()}
                    className="profile-upload-card"
                    style={styles.uploadCard}
                    disabled={saving}
                  >
                    <span style={styles.uploadIcon}>↑</span>
                    <span style={styles.uploadText}>{headerFile ? headerFile.name : 'Upload cover'}</span>
                  </button>
                  {(user?.header_image || headerFile) && (
                    <button
                      type="button"
                      onClick={() => { setRemoveHeader(true); setHeaderFile(null); }}
                      style={styles.removeBtn}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <h4 style={styles.editCardTitle}>Profile picture</h4>
                <div style={styles.uploadRow}>
                  <input
                    ref={pfpInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setPfpFile(f);
                      setRemovePfp(false);
                      e.target.value = '';
                    }}
                    style={styles.hiddenFileInput}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    onClick={() => pfpInputRef.current?.click()}
                    className="profile-upload-card"
                    style={styles.uploadCard}
                    disabled={saving}
                  >
                    <span style={styles.uploadIcon}>↑</span>
                    <span style={styles.uploadText}>{pfpFile ? pfpFile.name : 'Upload photo'}</span>
                  </button>
                  {(user?.profile_picture || pfpFile) && (
                    <button
                      type="button"
                      onClick={() => { setRemovePfp(true); setPfpFile(null); }}
                      style={styles.removeBtn}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {saveError && <p style={styles.saveError}>{saveError}</p>}
                <div style={styles.editActions}>
                  <button type="button" onClick={cancelEditing} style={styles.cancelBtn} disabled={saving}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveProfile} style={styles.saveBtn} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            user?.bio?.trim() ? (
              <p style={styles.bio}>{user.bio}</p>
            ) : null
          )}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                navigate('/login');
              }}
              style={styles.logoutBtn}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsWrap}>
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {}),
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={styles.tabContent}>
          {activeTab === 'Tracks' ? (
            <div>
              {/* Upload section */}
              <div style={styles.trackUploadSection}>
                <h3 style={styles.trackSectionTitle}>Upload a track</h3>
                <div style={styles.trackUploadForm}>
                  <input
                    ref={trackInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setTrackFile(f);
                        if (!trackTitle) setTrackTitle(f.name.replace(/\.[^/.]+$/, ''));
                      }
                      e.target.value = '';
                    }}
                    style={styles.hiddenFileInput}
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    onClick={() => trackInputRef.current?.click()}
                    className="profile-upload-card"
                    style={styles.uploadCard}
                    disabled={uploading}
                  >
                    <span style={styles.uploadIcon}>♫</span>
                    <span style={styles.uploadText}>{trackFile ? trackFile.name : 'Choose audio file'}</span>
                  </button>
                  {trackFile && (
                    <div style={styles.trackTitleRow}>
                      <input
                        type="text"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        placeholder="Track title"
                        style={styles.trackTitleInput}
                        disabled={uploading}
                      />
                      <button
                        type="button"
                        onClick={uploadTrack}
                        style={styles.trackUploadBtn}
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTrackFile(null); setTrackTitle(''); setUploadError(''); }}
                        style={styles.trackCancelBtn}
                        disabled={uploading}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {uploadError && <p style={styles.saveError}>{uploadError}</p>}
                </div>
              </div>

              {/* Track list */}
              {tracksLoading ? (
                <p style={styles.comingSoon}>Loading tracks...</p>
              ) : tracks.length === 0 ? (
                <p style={styles.comingSoon}>No tracks uploaded yet</p>
              ) : (
                <div style={styles.trackList}>
                  {tracks.map((track) => (
                    <div key={track.id} style={styles.trackCard}>
                      <button
                        type="button"
                        onClick={() => togglePlay(track)}
                        style={styles.playBtn}
                        aria-label={playingTrackId === track.id ? 'Pause' : 'Play'}
                      >
                        {playingTrackId === track.id ? '⏸' : '▶'}
                      </button>
                      <div style={styles.trackInfo}>
                        <span style={styles.trackTitle}>{track.title}</span>
                        <span style={styles.trackDate}>
                          {new Date(track.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteTrack(track.id)}
                        style={styles.trackDeleteBtn}
                        disabled={deletingTrackId === track.id}
                      >
                        {deletingTrackId === track.id ? '...' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'Posts' ? (
            <div>
              {pubsLoading ? (
                <p style={styles.comingSoon}>Loading published songs...</p>
              ) : publications.length === 0 ? (
                <p style={styles.comingSoon}>No published songs yet. Use the DAW to create and publish!</p>
              ) : (
                <div style={styles.trackList}>
                  {publications.map((pub) => (
                    <div key={pub.id} style={styles.trackCard}>
                      <button
                        type="button"
                        onClick={() => togglePlayPub(pub)}
                        style={styles.playBtn}
                        aria-label={playingPubId === pub.id ? 'Pause' : 'Play'}
                      >
                        {playingPubId === pub.id ? '⏸' : '▶'}
                      </button>
                      <div style={styles.trackInfo}>
                        <span style={styles.trackTitle}>{pub.title}</span>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={styles.trackDate}>
                            {new Date(pub.published_at).toLocaleDateString()}
                          </span>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                            ▶ {pub.play_count} plays
                          </span>
                        </div>
                        {pub.description && (
                          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                            {pub.description}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deletePublication(pub.id)}
                        style={styles.trackDeleteBtn}
                        disabled={deletingPubId === pub.id}
                      >
                        {deletingPubId === pub.id ? '...' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={styles.comingSoon}>{activeTab} — Coming soon</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
    fontFamily: "'Poppins', sans-serif",
    color: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(ellipse at 50% 0%, rgba(100, 100, 200, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '12px',
    position: 'relative',
    zIndex: 1,
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(255,255,255,0.2)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '14px',
  },
  errorWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
    padding: '24px',
    position: 'relative',
    zIndex: 1,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: '15px',
  },
  errorButton: {
    padding: '10px 20px',
    borderRadius: '9999px',
    border: 'none',
    background: 'linear-gradient(135deg, #00d4ff 0%, #00b4d8 50%, #0096c7 100%)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
  },
  topBar: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '53px',
    padding: '0 16px',
    background: 'rgba(10, 10, 26, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(100, 150, 200, 0.2)',
  },
  backButton: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: '19px',
    fontWeight: 700,
    color: '#ffffff',
  },
  topBarRight: {
    width: '34px',
  },
  coverWrap: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  cover: {
    width: '100%',
    height: '230px',
    background: 'rgba(30, 45, 80, 0.6)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid rgba(100, 150, 200, 0.3)',
  },
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    marginTop: '-60px',
    position: 'relative',
    zIndex: 1,
    paddingLeft: '24px',
    paddingRight: '24px',
    borderLeft: '1px solid rgba(100, 150, 200, 0.2)',
    borderRight: '1px solid rgba(100, 150, 200, 0.2)',
    minHeight: 'calc(100vh - 53px - 230px + 60px)',
  },
  coverPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '14px',
  },
  coverPlaceholderIcon: {
    fontSize: '32px',
    opacity: 0.7,
  },
  profileBlock: {
    padding: '12px 16px 16px',
    position: 'relative',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'rgba(30, 45, 80, 0.8)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '4px solid #0a0a1a',
    marginTop: '-60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarIcon: {
    fontSize: '48px',
    opacity: 0.6,
  },
  nameRow: {
    marginTop: '12px',
  },
  nameAndEdit: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  displayName: {
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1.2,
    margin: 0,
    color: '#ffffff',
  },
  editBtn: {
    padding: '6px 14px',
    borderRadius: '9999px',
    border: '2px solid rgba(100, 150, 200, 0.3)',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  handle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '15px',
    marginTop: '2px',
  },
  rolePill: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '4px 12px',
    borderRadius: '9999px',
    background: 'rgba(0, 212, 255, 0.2)',
    color: '#00d4ff',
    fontSize: '13px',
    fontWeight: 600,
  },
  bio: {
    marginTop: '12px',
    fontSize: '15px',
    lineHeight: 1.4,
    color: 'rgba(255, 255, 255, 0.9)',
    whiteSpace: 'pre-wrap',
  },
  editBlock: {
    marginTop: '16px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  editCard: {
    width: '100%',
    maxWidth: '520px',
    padding: '24px',
    borderRadius: '16px',
    background: 'rgba(30, 45, 80, 0.4)',
    border: '1px solid rgba(100, 150, 200, 0.2)',
  },
  editCardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '10px',
    marginTop: '20px',
  },
  editCardTitleFirst: {
    marginTop: 0,
  },
  editLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '6px',
  },
  bioInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '2px solid rgba(100, 150, 200, 0.3)',
    background: 'rgba(30, 45, 80, 0.6)',
    color: '#ffffff',
    fontSize: '15px',
    fontFamily: "'Poppins', sans-serif",
    resize: 'vertical',
    minHeight: '100px',
  },
  saveError: {
    color: '#ff6b6b',
    fontSize: '14px',
    marginTop: '8px',
    marginBottom: 0,
  },
  roleCheckboxRow: {
    display: 'flex',
    gap: '24px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#00d4ff',
    cursor: 'pointer',
  },
  uploadRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  hiddenFileInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  uploadCard: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderRadius: '12px',
    border: '2px dashed rgba(100, 150, 200, 0.4)',
    background: 'rgba(30, 45, 80, 0.4)',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  uploadIcon: {
    fontSize: '18px',
    opacity: 0.8,
  },
  uploadText: {
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  removeBtn: {
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 100, 100, 0.5)',
    background: 'transparent',
    color: '#ff6b6b',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  editActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    padding: '8px 18px',
    borderRadius: '9999px',
    border: '2px solid rgba(100, 150, 200, 0.3)',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 18px',
    borderRadius: '9999px',
    border: 'none',
    background: 'linear-gradient(135deg, #00d4ff 0%, #00b4d8 50%, #0096c7 100%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
  },
  actions: {
    marginTop: '16px',
  },
  logoutBtn: {
    padding: '10px 20px',
    borderRadius: '9999px',
    border: 'none',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 50%, #dd4a4a 100%)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(255, 100, 100, 0.3)',
  },
  tabsWrap: {
    display: 'flex',
    borderBottom: '1px solid rgba(100, 150, 200, 0.2)',
  },
  tab: {
    flex: 1,
    padding: '14px 16px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  tabActive: {
    color: '#00d4ff',
    fontWeight: 600,
    boxShadow: 'inset 0 -2px 0 #00d4ff',
  },
  tabContent: {
    padding: '32px 16px',
    minHeight: '200px',
  },
  comingSoon: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '15px',
    textAlign: 'center',
    margin: 0,
  },
  trackUploadSection: {
    marginBottom: '28px',
    padding: '20px',
    borderRadius: '16px',
    background: 'rgba(30, 45, 80, 0.35)',
    border: '1px solid rgba(100, 150, 200, 0.2)',
  },
  trackSectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    margin: '0 0 14px 0',
  },
  trackUploadForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  trackTitleRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  trackTitleInput: {
    flex: 1,
    minWidth: '160px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '2px solid rgba(100, 150, 200, 0.3)',
    background: 'rgba(30, 45, 80, 0.6)',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
    outline: 'none',
  },
  trackUploadBtn: {
    padding: '10px 20px',
    borderRadius: '9999px',
    border: 'none',
    background: 'linear-gradient(135deg, #00d4ff 0%, #00b4d8 50%, #0096c7 100%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
    whiteSpace: 'nowrap' as const,
  },
  trackCancelBtn: {
    padding: '10px 16px',
    borderRadius: '9999px',
    border: '2px solid rgba(100, 150, 200, 0.3)',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  trackList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  trackCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 16px',
    borderRadius: '14px',
    background: 'rgba(30, 45, 80, 0.35)',
    border: '1px solid rgba(100, 150, 200, 0.15)',
    transition: 'background 0.15s',
  },
  playBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: 'none',
    background: 'linear-gradient(135deg, #00d4ff 0%, #0096c7 100%)',
    color: '#ffffff',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 10px rgba(0, 212, 255, 0.25)',
  },
  trackInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    minWidth: 0,
  },
  trackTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  trackDate: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  trackDeleteBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 100, 100, 0.4)',
    background: 'transparent',
    color: '#ff6b6b',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
};

export default ProfilePage;
