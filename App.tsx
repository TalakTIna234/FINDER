
import React, { useState, useEffect } from 'react';
import { HomeView } from './views/HomeView';
import { RoomView } from './views/RoomView';
import { PlaylistView } from './views/PlaylistView';
import { CardStack } from './components/CardStack';
import { Movie } from './types';
import { Home, Bookmark, User as UserIcon, Apple, Mail, Search, UserPlus, Check, X } from 'lucide-react';
import { HapticButton } from './components/HapticButton';
import { authService, AuthUser } from './services/authService';
import { profileService, UserProfile } from './services/profileService';
import { friendsService } from './services/friendsService';
import { playlistService } from './services/playlistService';
import { statsService } from './services/statsService';
import { AvatarUpload } from './components/AvatarUpload';
import { EmailInput } from './components/EmailInput';
import { NicknameInput } from './components/NicknameInput';
import { supabase } from './services/supabaseClient';

type Tab = 'home' | 'playlist' | 'profile';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [currentMovies, setCurrentMovies] = useState<Movie[]>([]);
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [roomViewMode, setRoomViewMode] = useState<'create' | 'join' | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomMembers, setCurrentRoomMembers] = useState<number>(1);
  // Carica dark mode da localStorage o usa default true
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('mm_darkMode');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Salva dark mode in localStorage quando cambia
  useEffect(() => {
    localStorage.setItem('mm_darkMode', isDarkMode.toString());
  }, [isDarkMode]);
  const [isGuest, setIsGuest] = useState(true);

  // Profile States
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchFriend, setSearchFriend] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Email/Password auth states
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupNickname, setSignupNickname] = useState('');

  // Applica dark mode al DOM all'avvio e quando cambia
  useEffect(() => {
    // Applica immediatamente all'avvio
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    console.log('Dark mode applied:', isDarkMode);
  }, [isDarkMode]);
  
  // Sincronizza dark mode all'avvio del componente
  useEffect(() => {
    // Sincronizza con lo stato salvato (già applicato dallo script inline)
    const saved = localStorage.getItem('mm_darkMode');
    const shouldBeDark = saved !== null ? saved === 'true' : true; // Default dark mode
    if (shouldBeDark !== isDarkMode) {
      setIsDarkMode(shouldBeDark);
    }
    // Assicura che la classe sia applicata (backup)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Solo all'avvio
  
  // Funzione per toggle del dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      console.log('Toggling dark mode from', prev, 'to', newValue);
      // Applica immediatamente al DOM
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  };

  useEffect(() => {
    // Gestisci callback OAuth (Supabase può usare hash o query params)
    const handleOAuthCallback = async () => {
      console.log('=== OAUTH CALLBACK HANDLER ===');
      console.log('User Agent:', navigator.userAgent);
      console.log('Is Mobile:', /Mobile|Android|iPhone|iPad/.test(navigator.userAgent));
      console.log('Current URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      console.log('Search:', window.location.search);
      
      // Controlla hash (es: #access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      // Controlla query params (es: ?access_token=...)
      const queryParams = new URLSearchParams(window.location.search);
      
      console.log('Hash params:', Object.fromEntries(hashParams));
      console.log('Query params:', Object.fromEntries(queryParams));
      
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const error = hashParams.get('error') || queryParams.get('error');
      const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
      
      if (error) {
        console.error('=== OAUTH ERROR ===');
        console.error('Error:', error);
        console.error('Error description:', errorDescription);
        // Rimuovi hash/query dalla URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setLoading(false);
        alert(`Errore OAuth: ${error}${errorDescription ? ' - ' + errorDescription : ''}`);
        return;
      }
      
      if (accessToken) {
        console.log('=== OAUTH SUCCESS - ACCESS TOKEN FOUND ===');
        // L'utente è tornato da OAuth
        // Rimuovi hash/query dalla URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setLoading(true);
        
        try {
          // Verifica sessione Supabase prima di aspettare
          console.log('Checking Supabase session...');
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          console.log('Initial session:', initialSession ? 'Found' : 'Not found');
          
          // Aspetta che Supabase processi la sessione (aumentato a 2 secondi)
          console.log('Waiting 2 seconds for Supabase to process session...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verifica sessione dopo l'attesa
          const { data: { session: sessionAfterWait } } = await supabase.auth.getSession();
          console.log('Session after wait:', sessionAfterWait ? 'Found' : 'Not found');
          if (sessionAfterWait) {
            console.log('Session user ID:', sessionAfterWait.user.id);
            console.log('Session expires at:', new Date(sessionAfterWait.expires_at! * 1000).toISOString());
          }
          
          // Prova più volte a ottenere l'utente (retry logic)
          let user = null;
          let retries = 5; // Aumentato a 5 tentativi
          while (!user && retries > 0) {
            console.log(`Attempting to get user... ${retries} attempts left`);
            user = await authService.getCurrentUser();
            if (!user) {
              retries--;
              if (retries > 0) {
                console.log(`Retrying to get user... ${retries} attempts left`);
                // Verifica sessione prima di riprovare
                const { data: { session: retrySession } } = await supabase.auth.getSession();
                console.log('Session on retry:', retrySession ? 'Found' : 'Not found');
                await new Promise(resolve => setTimeout(resolve, 1500)); // Aumentato a 1.5 secondi
              }
            } else {
              console.log('✓ User retrieved successfully:', user.id, user.nickname);
            }
          }
          
          if (user) {
            console.log('=== OAUTH LOGIN SUCCESS ===');
            setIsGuest(false);
            setNickname(user.nickname);
            setAvatarUrl(user.avatar_url || null);
            
            // Carica profilo completo
            const profile = await profileService.getCurrentProfile();
            if (profile) {
              setBio(profile.bio || '');
              setNickname(profile.nickname);
              setAvatarUrl(profile.avatar_url || null);
            }
            
            // Carica playlist da database
            try {
              const dbPlaylist = await playlistService.getPlaylist();
              if (dbPlaylist.length > 0) {
                setLikedMovies(dbPlaylist);
              }
            } catch (e) {
              console.warn('Error loading playlist:', e);
            }
            
            // Carica statistiche
            try {
              const stats = await statsService.getStats();
              if (stats) {
                setUserStats(stats);
                console.log('Stats loaded:', stats);
              } else {
                // Crea statistiche se non esistono
                const newStats = await statsService.createStats(user.id);
                if (newStats) setUserStats(newStats);
              }
            } catch (e) {
              console.warn('Error loading stats:', e);
            }
            
            setCurrentUserId(user.id);
            
            // Forza refresh del profilo se siamo già nel tab profilo
            if (activeTab === 'profile') {
              // Triggera il refresh del profilo
              console.log('User logged in while on profile tab - refreshing...');
            }
            
            setActiveTab('home');
            
            // Forza un re-render aggiornando lo stato
            console.log('✓ User logged in successfully');
          } else {
            console.error('=== OAUTH LOGIN FAILED ===');
            console.error('Failed to get user after OAuth - retries exhausted');
            console.error('Access token present:', !!accessToken);
            console.error('Current URL:', window.location.href);
            
            // Verifica sessione finale
            const { data: { session: finalSession }, error: sessionError } = await supabase.auth.getSession();
            console.error('Final session check:', finalSession ? 'Found' : 'Not found');
            if (sessionError) {
              console.error('Session error:', sessionError);
            }
            
            // Verifica se i cookie sono abilitati
            console.error('Cookies enabled:', navigator.cookieEnabled);
            
            alert('Errore: impossibile eseguire l\'accesso. Verifica:\n1. I cookie sono abilitati nel browser\n2. Non ci sono estensioni che bloccano i cookie\n3. Controlla la console per dettagli.');
          }
        } catch (error) {
          console.error('=== OAUTH CALLBACK EXCEPTION ===');
          console.error('Error:', error);
          console.error('Error details:', error instanceof Error ? error.stack : error);
          alert('Errore durante il login: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No OAuth callback detected');
      }
    };
    
    handleOAuthCallback();
    
    // Carica playlist da database o localStorage (fallback)
    const loadData = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setIsGuest(false);
        
        // Carica profilo da Supabase
        const profile = await profileService.getCurrentProfile();
        if (profile) {
          setNickname(profile.nickname);
          setBio(profile.bio || '');
          setAvatarUrl(profile.avatar_url || null);
        }
        
        // Carica playlist da database
        const dbPlaylist = await playlistService.getPlaylist();
        if (dbPlaylist.length > 0) {
          setLikedMovies(dbPlaylist);
        } else {
          // Fallback a localStorage
          const saved = localStorage.getItem('mm_playlist');
          if (saved) {
            const localMovies = JSON.parse(saved);
            setLikedMovies(localMovies);
            // Sincronizza con database
            await playlistService.syncPlaylist(localMovies);
          }
        }
        
        // Carica statistiche
        const stats = await statsService.getStats();
        if (stats) setUserStats(stats);
        
        // Salva user ID per uso successivo
        setCurrentUserId(user.id);
      } else {
        // Guest mode - usa localStorage
        const saved = localStorage.getItem('mm_playlist');
        if (saved) setLikedMovies(JSON.parse(saved));
        const guestStatus = localStorage.getItem('mm_isGuest');
        if (guestStatus !== null) setIsGuest(guestStatus === 'true');
        const savedNick = localStorage.getItem('mm_nickname');
        if (savedNick) setNickname(savedNick);
        const savedBio = localStorage.getItem('mm_bio');
        if (savedBio) setBio(savedBio);
        
        // Recupera o genera guest ID per multiplayer
        let guestId = localStorage.getItem('mm_guest_id');
        if (!guestId) {
          // Genera UUID v4 per guest
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            guestId = crypto.randomUUID();
          } else {
            // Fallback per browser che non supportano crypto.randomUUID
            guestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          }
          localStorage.setItem('mm_guest_id', guestId);
        }
        setCurrentUserId(guestId);
      }
    };
    
    loadData();
    
    // Listener per cambiamenti auth
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (user) {
        console.log('[Auth State Change] User logged in, updating state...');
        setIsGuest(false);
        const profile = await profileService.getCurrentProfile();
        if (profile) {
          setNickname(profile.nickname);
          setBio(profile.bio || '');
          setAvatarUrl(profile.avatar_url || null);
        }
        // Se siamo nel tab profilo, forza un refresh
        if (activeTab === 'profile') {
          console.log('[Auth State Change] On profile tab - forcing refresh...');
          // Il useEffect con activeTab si attiverà automaticamente
        }
      } else {
        console.log('[Auth State Change] User logged out');
        setIsGuest(true);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh profilo quando si cambia tab al profilo - SEMPRE controlla autenticazione
  useEffect(() => {
    if (activeTab === 'profile') {
      const refreshProfile = async () => {
        try {
          console.log('[Profile] Checking authentication...');
          const user = await authService.getCurrentUser();
          console.log('[Profile] User:', user ? `${user.id} - ${user.nickname}` : 'null');
          
          if (user) {
            console.log('[Profile] User authenticated, loading profile data...');
            setIsGuest(false);
            setNickname(user.nickname);
            setAvatarUrl(user.avatar_url || null);
            
            const profile = await profileService.getCurrentProfile();
            if (profile) {
              setBio(profile.bio || '');
              console.log('[Profile] Profile loaded:', profile.nickname);
            }
            
            const dbPlaylist = await playlistService.getPlaylist();
            if (dbPlaylist.length > 0) {
              setLikedMovies(dbPlaylist);
              console.log('[Profile] Playlist loaded:', dbPlaylist.length, 'movies');
            }
            
            const stats = await statsService.getStats();
            if (stats) {
              setUserStats(stats);
              console.log('[Profile] Stats loaded');
            }
            
            setCurrentUserId(user.id);
            console.log('[Profile] ✓ Profile refresh completed');
          } else {
            console.log('[Profile] No user found, setting as guest');
            setIsGuest(true);
          }
        } catch (error) {
          console.error('[Profile] Error refreshing profile:', error);
          // In caso di errore, controlla comunque se c'è una sessione
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('[Profile] Found session, user is authenticated');
              setIsGuest(false);
            } else {
              console.log('[Profile] No session found, user is guest');
              setIsGuest(true);
            }
          } catch (sessionError) {
            console.error('[Profile] Error checking session:', sessionError);
            setIsGuest(true);
          }
        }
      };
      
      refreshProfile();
    }
  }, [activeTab]); // Rimossa dipendenza isGuest per evitare loop
  
  // Refresh profilo quando isGuest cambia (dopo login/logout)
  useEffect(() => {
    if (activeTab === 'profile' && !isGuest) {
      const refreshProfile = async () => {
        try {
          console.log('[Profile] isGuest changed to false - refreshing...');
          const user = await authService.getCurrentUser();
          if (user) {
            const profile = await profileService.getCurrentProfile();
            if (profile) {
              setNickname(profile.nickname);
              setBio(profile.bio || '');
              setAvatarUrl(profile.avatar_url || null);
            }
            const stats = await statsService.getStats();
            if (stats) setUserStats(stats);
            setCurrentUserId(user.id);
          }
        } catch (error) {
          console.error('[Profile] Error refreshing after isGuest change:', error);
        }
      };
      refreshProfile();
    }
  }, [isGuest, activeTab]);

  const saveProfile = async () => {
    if (isGuest) {
      // Fallback a localStorage per guest
      localStorage.setItem('mm_nickname', nickname);
      localStorage.setItem('mm_bio', bio);
      return;
    }
    
    setLoading(true);
    try {
      await profileService.updateProfile({ nickname, bio });
      // Salva anche in localStorage come backup
    localStorage.setItem('mm_nickname', nickname);
    localStorage.setItem('mm_bio', bio);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToPlaylist = async (movies: Movie[]) => {
    if (isGuest) {
      // Fallback a localStorage per guest
      const updated = [...likedMovies];
      movies.forEach(m => {
        if (!updated.find(um => um.id === m.id)) updated.push(m);
      });
      setLikedMovies(updated);
      localStorage.setItem('mm_playlist', JSON.stringify(updated));
      return;
    }
    
    // Salva su database
    for (const movie of movies) {
      await playlistService.addMovie(movie);
    }
    
    // Aggiorna stato locale
    const updated = [...likedMovies];
    movies.forEach(m => {
      if (!updated.find(um => um.id === m.id)) updated.push(m);
    });
    setLikedMovies(updated);
    
    // Backup su localStorage
    localStorage.setItem('mm_playlist', JSON.stringify(updated));
  };

  const endSession = (finalMovies: Movie[]) => {
    saveToPlaylist(finalMovies);
    setIsSessionActive(false);
    setCurrentMovies([]);
    setRoomViewMode(null);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      // OAuth reindirizza l'utente, quindi non possiamo aspettare il risultato qui
      // L'utente verrà gestito nel callback OAuth
      if (provider === 'google') {
        await authService.signInWithGoogle();
      } else {
        await authService.signInWithApple();
      }
      // Non impostare loading a false qui perché l'utente verrà reindirizzato
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  // Ricerca amici
  useEffect(() => {
    const searchUsers = async () => {
      if (searchFriend.length < 2) {
        setSearchResults([]);
        return;
      }
      
      if (isGuest) {
        setSearchResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const results = await profileService.searchUsers(searchFriend, 10);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchFriend, isGuest]);

  const handleAddFriend = async (friendId: string) => {
    setLoading(true);
    try {
      await friendsService.sendFriendRequest(friendId);
      // Ricarica risultati per aggiornare status
      const results = await profileService.searchUsers(searchFriend, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (isSessionActive) {
      // Ottieni nickname per CardStack
      const nickname = isGuest 
        ? (localStorage.getItem('mm_guest_nickname') || 'Guest')
        : (nickname || 'Tu');
      
      return (
        <CardStack 
          movies={currentMovies} 
          onFinish={endSession} 
          isMultiplayer={true}
          userId={currentUserId || undefined}
          userNickname={nickname}
          totalMembers={currentRoomMembers}
          roomCode={currentRoomCode || undefined}
          roomId={currentRoomId || undefined}
        />
      );
    }
    if (roomViewMode) return <RoomView 
      mode={roomViewMode} 
      onBack={() => {
        setRoomViewMode(null);
        setCurrentRoomCode(null);
        setCurrentRoomId(null);
        setCurrentRoomMembers(1);
      }} 
      onStartSession={async (movies, roomCode, roomId, membersCount) => { 
        console.log('[App] onStartSession called:', {
          moviesCount: movies?.length || 0,
          roomCode,
          roomId,
          membersCount
        });
        
        if (!movies || movies.length === 0) {
          console.error('[App] No movies provided to onStartSession!');
          alert('Errore: nessun film disponibile. Riprova.');
          return;
        }
        
        // Assicurati che currentUserId sia impostato anche per guest
        if (!currentUserId) {
          const user = await authService.getCurrentUser();
          if (user) {
            setCurrentUserId(user.id);
          } else {
            // Recupera o genera guest ID
            let guestId = localStorage.getItem('mm_guest_id');
            if (!guestId) {
              if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                guestId = crypto.randomUUID();
              } else {
                guestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0;
                  const v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
              }
              localStorage.setItem('mm_guest_id', guestId);
            }
            setCurrentUserId(guestId);
          }
        }
        
        setCurrentMovies(movies); 
        setIsSessionActive(true);
        setCurrentRoomCode(roomCode || null);
        setCurrentRoomId(roomId || null);
        setCurrentRoomMembers(membersCount || 1);
      }} 
    />;

    switch (activeTab) {
      case 'home': return <HomeView onCreateRoom={() => setRoomViewMode('create')} onJoinRoom={() => setRoomViewMode('join')} toggleTheme={toggleDarkMode} isDarkMode={isDarkMode} isGuest={isGuest} />;
      case 'playlist': return <PlaylistView likedMovies={likedMovies} onRemove={async (id) => { 
        if (!isGuest) {
          await playlistService.removeMovie(id);
        }
        const updated = likedMovies.filter(m => m.id !== id);
        setLikedMovies(updated);
        localStorage.setItem('mm_playlist', JSON.stringify(updated));
      }} />;
      case 'profile': return (
        <div className="flex flex-col h-full bg-black dark:bg-white text-white dark:text-black p-6 pt-16 overflow-y-auto pb-32 no-scrollbar transition-colors duration-500">
          {/* Header con effetto liquid glass */}
          <div className="flex flex-col items-center gap-5 mb-8">
             {!isGuest ? (
               <div className="relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-purple-700/20 to-indigo-800/20 rounded-[40px] blur-2xl" />
                 <AvatarUpload 
                   currentAvatarUrl={avatarUrl}
                   onAvatarUpdated={(url) => setAvatarUrl(url)}
                 />
               </div>
             ) : (
               <div className="relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-purple-700/30 to-indigo-800/30 rounded-[40px] blur-2xl animate-pulse" />
                 <div className="relative w-28 h-28 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 rounded-[40px] flex items-center justify-center text-4xl font-black italic shadow-2xl border-2 border-white/20 backdrop-blur-xl">
                   <span className="bg-gradient-to-br from-white to-white/80 bg-clip-text text-transparent">MM</span>
                 </div>
               </div>
             )}
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-white via-white/90 to-white/70 dark:from-black dark:via-black/90 dark:to-black/70 bg-clip-text text-transparent transition-all duration-500">
                  {isGuest ? 'Account Ospite' : nickname || 'Utente Premium'}
                </h2>
                {!isGuest && userStats && (
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 dark:opacity-70 text-white dark:text-black transition-opacity duration-500">
                    Match: {userStats.matches_found} • Film: {userStats.movies_liked}
                  </p>
                )}
                {isGuest && (
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 dark:opacity-60 text-white dark:text-black transition-opacity duration-500">
                    Livello Cinefilo: 1
                  </p>
                )}
             </div>
          </div>
          
          {isGuest ? (
            <div className="space-y-6 mb-8">
               {/* Header con effetto glass */}
               <div className="text-center space-y-2 mb-6">
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter bg-gradient-to-r from-white via-white/90 to-white/70 dark:from-black dark:via-black/90 dark:to-black/70 bg-clip-text text-transparent transition-all duration-500">
                   Accedi a MovieMatch
                 </h3>
                 <p className="text-[10px] font-black opacity-40 dark:opacity-60 uppercase tracking-[0.3em] text-white dark:text-black transition-opacity duration-500">
                   Registrati per sbloccare tutto
                 </p>
               </div>
               
               {!showEmailAuth ? (
                 <div className="space-y-4">
                   {/* Apple Login - Stile iOS Liquid Glass */}
                   <HapticButton 
                    onClick={() => handleSocialLogin('apple')}
                    className="group relative w-full py-5 bg-white/95 dark:bg-black/95 backdrop-blur-2xl text-black dark:text-white rounded-[24px] font-black text-base flex items-center justify-center gap-3 active:scale-[0.97] transition-all duration-300 shadow-2xl shadow-white/20 dark:shadow-black/20 border border-white/30 dark:border-black/30 overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/20 dark:from-black/50 dark:to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <Apple fill="currentColor" size={22} className="relative z-10" /> 
                     <span className="relative z-10">Accedi con Apple</span>
                   </HapticButton>
                   
                   {/* Google Login - Stile Netflix */}
                   <HapticButton 
                    onClick={() => handleSocialLogin('google')}
                    className="group relative w-full py-5 bg-gradient-to-br from-red-600/90 via-red-700/90 to-red-800/90 dark:from-red-500/90 dark:via-red-600/90 dark:to-red-700/90 backdrop-blur-2xl rounded-[24px] font-black text-base text-white flex items-center justify-center gap-3 active:scale-[0.97] transition-all duration-300 shadow-2xl shadow-red-600/30 dark:shadow-red-500/30 border border-red-500/30 dark:border-red-400/30 overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <Mail size={22} className="relative z-10" /> 
                     <span className="relative z-10">Accedi con Google</span>
                   </HapticButton>
                   
                   {/* Email Login - Stile Liquid Glass */}
               <HapticButton 
                    onClick={() => {
                      setShowEmailAuth(true);
                      setIsSignUp(false); // Imposta in modalità login
                    }}
                    className="group relative w-full py-5 bg-white/5 dark:bg-black/10 backdrop-blur-2xl border border-white/20 dark:border-black/30 rounded-[24px] font-black text-base text-white dark:text-black flex items-center justify-center gap-3 active:scale-[0.97] transition-all duration-300 shadow-xl shadow-black/20 dark:shadow-white/20 hover:bg-white/10 dark:hover:bg-black/20 hover:border-white/30 dark:hover:border-black/40 overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-black/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <Mail size={22} className="relative z-10" /> 
                     <span className="relative z-10">Accedi con Email</span>
               </HapticButton>
                   
                   {/* Link testo per registrazione */}
                   <div className="text-center pt-3">
                     <span
                       onClick={() => {
                         setShowEmailAuth(true);
                         setIsSignUp(true); // Imposta in modalità registrazione
                       }}
                       className="text-[9px] font-black opacity-50 dark:opacity-60 hover:opacity-100 transition-opacity uppercase tracking-widest text-white dark:text-black cursor-pointer"
                     >
                       Non hai un account? <span className="text-red-500 dark:text-red-400">Registrati</span>
                     </span>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-5">
                   {/* Header con effetto glass */}
                   <div className="flex items-center justify-between mb-2 pb-4 border-b border-white/10">
                     <h3 className="text-lg font-black uppercase italic tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 dark:from-black dark:via-black/90 dark:to-black/70 bg-clip-text text-transparent transition-all duration-500">
                       {isSignUp ? 'Crea Account' : 'Accedi'}
                     </h3>
                     <button 
                       onClick={() => {
                         setShowEmailAuth(false);
                         setEmail('');
                         setPassword('');
                         setSignupNickname('');
                         setIsSignUp(false);
                       }}
                       className="text-[10px] font-black opacity-50 dark:opacity-70 hover:opacity-100 transition-opacity px-3 py-1.5 bg-white/5 dark:bg-black/10 rounded-full border border-white/10 dark:border-black/20 text-white dark:text-black"
                     >
                       ← Indietro
                     </button>
                   </div>
                   
                   {/* Form con effetto liquid glass */}
                   <div className="space-y-4 bg-white/5 dark:bg-black/10 backdrop-blur-2xl rounded-[28px] p-6 border border-white/10 dark:border-black/20 shadow-2xl transition-colors duration-500">
                     {isSignUp && (
                       <div className="space-y-2">
                         <label className="text-[9px] font-black opacity-60 dark:opacity-70 uppercase tracking-widest block px-1 text-white dark:text-black">Nickname</label>
                         <div className="relative">
                           <NicknameInput
                             value={signupNickname}
                             onChange={setSignupNickname}
                             placeholder="Il tuo nickname"
                             className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[20px] px-5 py-4 pr-12 font-bold focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 shadow-lg"
                           />
                         </div>
                       </div>
                     )}
                     
                     <div className="space-y-2">
                       <label className="text-[9px] font-black opacity-60 dark:opacity-70 uppercase tracking-widest block px-1 text-white dark:text-black">Email</label>
                       <EmailInput
                         value={email}
                         onChange={setEmail}
                         placeholder="tua@email.com"
                         className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[20px] px-5 py-4 font-bold focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 shadow-lg"
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <label className="text-[9px] font-black opacity-60 dark:opacity-70 uppercase tracking-widest block px-1 text-white dark:text-black">Password</label>
                       <input
                         type="password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         placeholder="••••••••"
                         className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[20px] px-5 py-4 font-bold focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 shadow-lg"
                       />
                     </div>
                   </div>
                   
                   {/* Submit button con effetto Netflix */}
               <HapticButton 
                     onClick={async () => {
                       if (!email || !password) {
                         alert('Inserisci email e password');
                         return;
                       }
                       
                       if (isSignUp && !signupNickname) {
                         alert('Inserisci un nickname');
                         return;
                       }
                       
                       setLoading(true);
                       
                       // Verifica disponibilità nickname prima di registrare
                       if (isSignUp && signupNickname.length >= 2) {
                         try {
                           const nicknameAvailable = await profileService.isNicknameAvailable(signupNickname);
                           if (!nicknameAvailable) {
                             alert('Questo nickname è già in uso. Scegli un altro nickname.');
                             setLoading(false);
                             return;
                           }
                         } catch (error) {
                           console.error('Error checking nickname:', error);
                           // Continua comunque, il controllo verrà fatto anche lato server
                         }
                       }
                       
                       try {
                         let user: AuthUser | null = null;
                         
                         if (isSignUp) {
                           const result = await authService.signUpWithEmail(email, password, signupNickname);
                           
                           if (result.error === 'EMAIL_EXISTS') {
                             // Email già registrata - suggerisci login
                             const useLogin = confirm(
                               'Questa email è già registrata. Vuoi accedere invece? Clicca OK per accedere o Annulla per provare con un\'altra email.'
                             );
                             
                             if (useLogin) {
                               // Passa alla modalità login
                               setIsSignUp(false);
                               setLoading(false);
                               return;
                             } else {
                               setLoading(false);
                               return;
                             }
                           }
                           
                           if (result.error) {
                             alert('Errore durante la registrazione: ' + result.error);
                             setLoading(false);
                             return;
                           }
                           
                           // Se non c'è errore, la registrazione è andata a buon fine
                           // (anche se result.user è null perché l'email deve essere confermata)
                           if (!result.error) {
                             alert('Registrazione completata! Controlla la tua email per confermare l\'account. Dopo aver cliccato il link nella email, potrai accedere con le tue credenziali.');
                             // Non fare login automatico - l'utente deve confermare l'email
                             setLoading(false);
                             setShowEmailAuth(false);
                             setEmail('');
                             setPassword('');
                             setSignupNickname('');
                             setIsSignUp(false);
                             return;
                           } else {
                             alert('Errore durante la registrazione: ' + result.error);
                             setLoading(false);
                             return;
                           }
                         } else {
                           try {
                             user = await authService.signInWithEmail(email, password);
                             if (!user) {
                               alert('Credenziali non valide. Riprova o verifica di aver confermato l\'email se ti sei appena registrato.');
                               setLoading(false);
                               return;
                             }
                           } catch (error) {
                             // Gestisci errori specifici (es: email non confermata)
                             const errorMessage = error instanceof Error ? error.message : 'Errore durante il login';
                             alert(errorMessage);
                             setLoading(false);
                             return;
                           }
                         }
                         
                         if (user) {
                           setIsGuest(false);
                           setNickname(user.nickname);
                           setAvatarUrl(user.avatar_url || null);
                           
                           const profile = await profileService.getCurrentProfile();
                           if (profile) {
                             setBio(profile.bio || '');
                           }
                           
                           const dbPlaylist = await playlistService.getPlaylist();
                           if (dbPlaylist.length > 0) {
                             setLikedMovies(dbPlaylist);
                           }
                           
                           const stats = await statsService.getStats();
                           if (stats) setUserStats(stats);
                           
                           setCurrentUserId(user.id);
                           setShowEmailAuth(false);
                           setEmail('');
                           setPassword('');
                           setSignupNickname('');
                           setIsSignUp(false);
                           setActiveTab('home');
                         }
                       } catch (error) {
                         console.error('Email auth error:', error);
                         alert('Errore: ' + (error instanceof Error ? error.message : 'Errore sconosciuto'));
                       } finally {
                         setLoading(false);
                       }
                     }}
                     disabled={loading || !email || !password || (isSignUp && !signupNickname)}
                     className="group relative w-full py-5 bg-gradient-to-br from-red-600 via-red-700 to-red-800 dark:from-red-500 dark:via-red-600 dark:to-red-700 text-white rounded-[24px] font-black text-base flex items-center justify-center gap-3 active:scale-[0.97] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-red-600/30 dark:shadow-red-500/30 border border-red-500/30 dark:border-red-400/30 overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     <span className="relative z-10">
                       {loading ? 'Caricamento...' : (isSignUp ? 'Crea Account' : 'Accedi')}
                     </span>
               </HapticButton>
                   
                   {/* Icone registrazione veloce - solo nella sezione registrazione */}
                   {isSignUp && (
                     <div className="space-y-4 pt-2">
                       {/* Testo "Registrati con:" */}
                       <div className="text-center">
                         <p className="text-[10px] font-black opacity-60 dark:opacity-70 uppercase tracking-[0.2em] text-white dark:text-black mb-3">
                           Registrati con:
                         </p>
                       </div>
                       
                       {/* Icone con animazioni eleganti e fluide */}
                       <div className="flex items-center justify-center gap-6">
                         <button
                           onClick={() => handleSocialLogin('google')}
                           className="group relative p-4 bg-white/5 dark:bg-black/10 rounded-full border border-white/10 dark:border-black/20 hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-700 ease-out active:scale-85 hover:scale-110"
                           title="Registrati con Google"
                         >
                           {/* Effetto glow animato al hover */}
                           <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/30 via-orange-500/20 to-yellow-500/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-700 ease-out group-hover:scale-150" />
                           {/* Anello luminoso */}
                           <div className="absolute inset-0 rounded-full border-2 border-red-500/0 group-hover:border-red-500/50 transition-all duration-700 ease-out" />
                           {/* Icona con animazione spring */}
                           <Mail size={22} className="relative z-10 text-white dark:text-black transition-all duration-700 ease-out group-hover:rotate-12 group-hover:scale-110 group-active:rotate-24 group-active:scale-95" />
                           {/* Effetto ping al click con delay */}
                           <div className="absolute inset-0 rounded-full bg-red-500/40 opacity-0 group-active:opacity-100 group-active:animate-ping" style={{ animationDelay: '0ms' }} />
                           {/* Ripple effect */}
                           <div className="absolute inset-0 rounded-full bg-red-500/20 opacity-0 group-active:opacity-100 group-active:animate-ping" style={{ animationDelay: '150ms' }} />
                         </button>
                         
                         <button
                           onClick={() => handleSocialLogin('apple')}
                           className="group relative p-4 bg-white/5 dark:bg-black/10 rounded-full border border-white/10 dark:border-black/20 hover:bg-white/10 dark:hover:bg-black/20 transition-all duration-700 ease-out active:scale-85 hover:scale-110"
                           title="Registrati con Apple"
                         >
                           {/* Effetto glow animato al hover */}
                           <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-300/30 via-gray-500/20 to-gray-700/20 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-700 ease-out group-hover:scale-150" />
                           {/* Anello luminoso */}
                           <div className="absolute inset-0 rounded-full border-2 border-gray-400/0 group-hover:border-gray-400/50 transition-all duration-700 ease-out" />
                           {/* Icona con animazione spring */}
                           <Apple size={22} className="relative z-10 text-white dark:text-black fill-current transition-all duration-700 ease-out group-hover:rotate-12 group-hover:scale-110 group-active:rotate-24 group-active:scale-95" />
                           {/* Effetto ping al click con delay */}
                           <div className="absolute inset-0 rounded-full bg-gray-500/40 opacity-0 group-active:opacity-100 group-active:animate-ping" style={{ animationDelay: '0ms' }} />
                           {/* Ripple effect */}
                           <div className="absolute inset-0 rounded-full bg-gray-500/20 opacity-0 group-active:opacity-100 group-active:animate-ping" style={{ animationDelay: '150ms' }} />
                         </button>
                       </div>
                     </div>
                   )}
                   
                   {/* Link testo per switch login/registrazione */}
                   <div className="text-center pt-4">
                     <span
                       onClick={() => setIsSignUp(!isSignUp)}
                       className="text-[9px] font-black opacity-50 dark:opacity-60 hover:opacity-100 transition-opacity duration-300 uppercase tracking-widest text-white dark:text-black cursor-pointer inline-block hover:scale-105 transition-transform duration-300"
                     >
                       {isSignUp ? (
                         <>Hai già un account? <span className="text-red-500 dark:text-red-400">Accedi</span></>
                       ) : (
                         <>Non hai un account? <span className="text-red-500 dark:text-red-400">Registrati</span></>
                       )}
                     </span>
                   </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-6 mb-8">
              {/* Form profilo con effetto liquid glass */}
              <div className="bg-white/5 dark:bg-black/10 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 dark:border-black/20 shadow-2xl space-y-5 transition-colors duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-60 dark:opacity-70 uppercase tracking-widest px-1 text-white dark:text-black">Nickname per gli amici</label>
                  <input 
                    type="text" 
                    value={nickname} 
                    onChange={(e) => setNickname(e.target.value)}
                    onBlur={saveProfile}
                    placeholder="Il tuo nickname..."
                    className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[20px] px-5 py-4 font-bold focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 shadow-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-60 dark:opacity-70 uppercase tracking-widest px-1 text-white dark:text-black">La tua Bio</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    onBlur={saveProfile}
                    placeholder="Scrivi qualcosa su di te..."
                    className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[20px] px-5 py-4 font-bold h-24 focus:outline-none focus:border-red-600/50 dark:focus:border-red-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 resize-none shadow-lg"
                  />
                </div>
              </div>

              {/* Cerca amici con effetto glass */}
              <div className="bg-white/5 dark:bg-black/10 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 dark:border-black/20 shadow-2xl space-y-4 transition-colors duration-500">
                <label className="text-[10px] font-black opacity-60 dark:opacity-70 uppercase tracking-widest px-1 block text-white dark:text-black">Cerca Amici</label>
                <div className="relative">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 dark:text-black/40 z-10" />
                  <input 
                    type="text" 
                    value={searchFriend}
                    onChange={(e) => setSearchFriend(e.target.value)}
                    placeholder="Nome amico..."
                    className="w-full bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-black/30 rounded-[20px] pl-14 pr-5 py-4 font-bold focus:outline-none focus:border-blue-600/50 dark:focus:border-blue-500/50 focus:bg-white/15 dark:focus:bg-black/25 transition-all duration-300 text-white dark:text-black placeholder:text-white/30 dark:placeholder:text-black/50 shadow-lg"
                  />
                </div>
                {searchFriend && (
                  <div className="space-y-2 bg-white/5 dark:bg-black/10 backdrop-blur-xl rounded-[20px] p-3 border border-white/10 dark:border-black/20 animate-in fade-in slide-in-from-top-2 shadow-lg transition-colors duration-500">
                    {loading ? (
                      <p className="text-center py-4 text-[10px] font-black opacity-20 dark:opacity-40 uppercase tracking-widest text-white dark:text-black">Ricerca in corso...</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => {
                        const isCurrentUser = currentUserId && user.id === currentUserId;
                        
                        return (
                          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5 dark:hover:bg-black/10 rounded-xl transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center font-black text-sm overflow-hidden">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{user.nickname.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="font-bold text-sm block">{user.nickname}</span>
                                {user.bio && (
                                  <span className="text-[10px] opacity-50 line-clamp-1">{user.bio}</span>
                                )}
                              </div>
                            </div>
                            {!isCurrentUser && (
                              <HapticButton 
                                onClick={() => handleAddFriend(user.id)}
                                className="p-2 bg-blue-600 rounded-lg text-white"
                                disabled={loading}
                              >
                          <UserPlus size={16} />
                        </HapticButton>
                            )}
                      </div>
                        );
                      })
                    ) : (
                      <p className="text-center py-4 text-[10px] font-black opacity-20 uppercase tracking-widest">Nessun risultato</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dashboard completa solo se loggato */}
          {!isGuest && (
            <div className="space-y-6 mb-6">
              {/* Statistiche principali */}
              <div className="bg-white/5 dark:bg-black/10 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 dark:border-black/20 shadow-2xl transition-colors duration-500">
                <h3 className="text-sm font-black uppercase italic tracking-tight mb-5 opacity-80 dark:opacity-90 text-white dark:text-black">Statistiche Gioco</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 dark:from-red-500/30 dark:to-red-700/30 backdrop-blur-xl rounded-[24px] p-4 border border-red-500/20 dark:border-red-400/30 transition-colors duration-500">
                    <div className="text-[9px] font-black uppercase opacity-60 dark:opacity-70 tracking-widest mb-1 text-white dark:text-black">Film Salvati</div>
                    <div className="text-3xl font-black italic text-red-500 dark:text-red-600">{likedMovies.length}</div>
                  </div>
                  {userStats && (
                    <>
                      <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 dark:from-green-500/30 dark:to-green-700/30 backdrop-blur-xl rounded-[24px] p-4 border border-green-500/20 dark:border-green-400/30 transition-colors duration-500">
                        <div className="text-[9px] font-black uppercase opacity-60 dark:opacity-70 tracking-widest mb-1 text-white dark:text-black">Match Trovati</div>
                        <div className="text-3xl font-black italic text-green-500 dark:text-green-600">{userStats.matches_found}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 dark:from-purple-500/30 dark:to-purple-700/30 backdrop-blur-xl rounded-[24px] p-4 border border-purple-500/20 dark:border-purple-400/30 transition-colors duration-500">
                        <div className="text-[9px] font-black uppercase opacity-60 dark:opacity-70 tracking-widest mb-1 text-white dark:text-black">Stanze Create</div>
                        <div className="text-3xl font-black italic text-purple-500 dark:text-purple-600">{userStats.rooms_created}</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 dark:from-blue-500/30 dark:to-blue-700/30 backdrop-blur-xl rounded-[24px] p-4 border border-blue-500/20 dark:border-blue-400/30 transition-colors duration-500">
                        <div className="text-[9px] font-black uppercase opacity-60 dark:opacity-70 tracking-widest mb-1 text-white dark:text-black">Stanze Unite</div>
                        <div className="text-3xl font-black italic text-blue-500 dark:text-blue-600">{userStats.rooms_joined}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Generi preferiti */}
              {likedMovies.length > 0 && (() => {
                const genreCount: Record<string, number> = {};
                likedMovies.forEach(movie => {
                  if (movie.genres) {
                    movie.genres.forEach(genre => {
                      genreCount[genre] = (genreCount[genre] || 0) + 1;
                    });
                  }
                });
                const topGenres = Object.entries(genreCount)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5);
                
                return (
                  <div className="bg-white/5 dark:bg-black/10 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 dark:border-black/20 shadow-2xl transition-colors duration-500">
                    <h3 className="text-sm font-black uppercase italic tracking-tight mb-5 opacity-80 dark:opacity-90 text-white dark:text-black">Generi Preferiti</h3>
                    <div className="space-y-3">
                      {topGenres.map(([genre, count], index) => (
                        <div key={genre} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-600/30 to-purple-600/30 dark:from-red-500/40 dark:to-purple-500/40 rounded-full flex items-center justify-center text-xs font-black text-white dark:text-black">
                              {index + 1}
                            </div>
                            <span className="font-bold text-sm text-white dark:text-black">{genre}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-white/5 dark:bg-black/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-600 to-purple-600 dark:from-red-500 dark:to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${(count / likedMovies.length) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-black opacity-60 dark:opacity-70 w-8 text-right text-white dark:text-black">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Film recenti */}
              {likedMovies.length > 0 && (
                <div className="bg-white/5 dark:bg-black/10 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 dark:border-black/20 shadow-2xl transition-colors duration-500">
                  <h3 className="text-sm font-black uppercase italic tracking-tight mb-5 opacity-80 dark:opacity-90 text-white dark:text-black">Film Recenti</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {likedMovies.slice(0, 6).map(movie => (
                      <div key={movie.id} className="relative aspect-[2/3] rounded-[16px] overflow-hidden border border-white/10 dark:border-black/20 group transition-colors duration-500">
                        {movie.poster ? (
                          <img 
                            src={movie.poster} 
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-600/20 to-purple-600/20 flex items-center justify-center">
                            <span className="text-xs font-black opacity-50 text-center px-2">{movie.title}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="text-[9px] font-black truncate">{movie.title}</div>
                            <div className="text-[8px] font-black opacity-60">{movie.year}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Livello utente */}
              {userStats && (() => {
                const totalPoints = (userStats.movies_liked || 0) * 10 + 
                                  (userStats.matches_found || 0) * 50 + 
                                  (userStats.rooms_created || 0) * 30 + 
                                  (userStats.rooms_joined || 0) * 20;
                const level = Math.floor(totalPoints / 100) + 1;
                const progress = (totalPoints % 100);
                
                return (
                  <div className="bg-gradient-to-br from-red-600/20 via-purple-700/20 to-indigo-800/20 dark:from-red-500/30 dark:via-purple-600/30 dark:to-indigo-700/30 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 dark:border-black/20 shadow-2xl transition-colors duration-500">
                    <h3 className="text-sm font-black uppercase italic tracking-tight mb-5 opacity-80 dark:opacity-90 text-white dark:text-black">Livello Cinefilo</h3>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 dark:from-red-500 dark:via-purple-500 dark:to-indigo-500">
                          {level}
                        </div>
                        <div className="text-[10px] font-black uppercase opacity-60 dark:opacity-70 tracking-widest mt-1 text-white dark:text-black">
                          {totalPoints} Punti Totali
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase opacity-60 dark:opacity-70 text-white dark:text-black">
                          <span>Progresso al livello {level + 1}</span>
                          <span>{progress}/100</span>
                        </div>
                        <div className="w-full h-3 bg-white/5 dark:bg-black/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 dark:from-red-500 dark:via-purple-500 dark:to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Stato Account */}
              <div className="bg-white/5 dark:bg-black/10 backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 dark:border-black/20 shadow-2xl transition-colors duration-500">
             <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase opacity-60 dark:opacity-70 tracking-widest text-white dark:text-black">Stato Account</span>
                  <span className="font-black text-[10px] uppercase px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600 text-white shadow-lg shadow-red-600/30 dark:shadow-red-500/30 border border-red-500/30 dark:border-red-400/30">
                    Premium
                  </span>
             </div>
             </div>
          </div>
          )}
          
          {!isGuest && (
             <HapticButton 
              onClick={() => {
                authService.signOut();
                setIsGuest(true);
                setActiveTab('home');
              }}
              className="w-full py-4 text-center text-red-600 dark:text-red-500 font-black uppercase text-[10px] tracking-[0.2em] opacity-40 dark:opacity-60 hover:opacity-100 transition-opacity"
             >
               Esci dall'account
             </HapticButton>
          )}
        </div>
      );
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col bg-black dark:bg-white transition-colors duration-500">
      <main className="flex-1 relative overflow-hidden">{renderContent()}</main>
      {!isSessionActive && !roomViewMode && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 dark:bg-white/90 ios-blur border-t border-white/5 dark:border-black/10 flex items-center justify-around px-8 pb-2 z-[90] transition-colors duration-500">
          <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={22} />} label="Home" />
          <TabButton active={activeTab === 'playlist'} onClick={() => setActiveTab('playlist')} icon={<Bookmark size={22} />} label="Match" />
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon size={22} />} label="Profilo" />
        </nav>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <HapticButton 
    impact="light"
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-red-600 dark:text-red-500 scale-105' : 'text-white/20 dark:text-black/30'}`}
  >
    {icon}<span className={`text-[9px] font-black uppercase tracking-[0.1em] ${active ? 'text-red-600 dark:text-red-500' : 'text-white/20 dark:text-black/30'}`}>{label}</span>
  </HapticButton>
);

export default App;
