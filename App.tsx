
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
  const [isDarkMode, setIsDarkMode] = useState(true);
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
              if (stats) setUserStats(stats);
            } catch (e) {
              console.warn('Error loading stats:', e);
            }
            
            setCurrentUserId(user.id);
            setActiveTab('home');
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
      }
    };
    
    loadData();
    
    // Listener per cambiamenti auth
    const { data: { subscription } } = authService.onAuthStateChange(async (user) => {
      if (user) {
        setIsGuest(false);
        const profile = await profileService.getCurrentProfile();
        if (profile) {
          setNickname(profile.nickname);
          setBio(profile.bio || '');
          setAvatarUrl(profile.avatar_url || null);
        }
      } else {
        setIsGuest(true);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    if (isSessionActive) return <CardStack movies={currentMovies} onFinish={endSession} isMultiplayer={true} />;
    if (roomViewMode) return <RoomView mode={roomViewMode} onBack={() => setRoomViewMode(null)} onStartSession={(movies) => { setCurrentMovies(movies); setIsSessionActive(true); }} />;

    switch (activeTab) {
      case 'home': return <HomeView onCreateRoom={() => setRoomViewMode('create')} onJoinRoom={() => setRoomViewMode('join')} toggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} isGuest={isGuest} />;
      case 'playlist': return <PlaylistView likedMovies={likedMovies} onRemove={async (id) => { 
        if (!isGuest) {
          await playlistService.removeMovie(id);
        }
        const updated = likedMovies.filter(m => m.id !== id);
        setLikedMovies(updated);
        localStorage.setItem('mm_playlist', JSON.stringify(updated));
      }} />;
      case 'profile': return (
        <div className="flex flex-col h-full bg-black text-white p-6 pt-16 overflow-y-auto pb-32 no-scrollbar">
          <div className="flex flex-col items-center gap-4 mb-8">
             {!isGuest ? (
               <AvatarUpload 
                 currentAvatarUrl={avatarUrl}
                 onAvatarUpdated={(url) => setAvatarUrl(url)}
               />
             ) : (
               <div className="w-24 h-24 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 rounded-[32px] flex items-center justify-center text-3xl font-black italic shadow-2xl border border-white/10">
                 <span>MM</span>
               </div>
             )}
             <div className="text-center">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{isGuest ? 'Account Ospite' : nickname || 'Utente Premium'}</h2>
                <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20">
                  {userStats ? `Match: ${userStats.matches_found} • Film: ${userStats.movies_liked}` : 'Livello Cinefilo: 1'}
                </p>
             </div>
          </div>
          
          {isGuest ? (
            <div className="space-y-4 mb-8">
               <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] text-center mb-2">Registrati per sbloccare tutto</p>
               
               {!showEmailAuth ? (
                 <>
                   <HapticButton 
                    onClick={() => handleSocialLogin('apple')}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
                   >
                      <Apple fill="currentColor" size={20} /> Accedi con Apple
                   </HapticButton>
                   <HapticButton 
                    onClick={() => handleSocialLogin('google')}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-95 transition-all"
                   >
                      <Mail size={20} /> Accedi con Google
                   </HapticButton>
                   <HapticButton 
                    onClick={() => setShowEmailAuth(true)}
                    className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-95 transition-all"
                   >
                      <Mail size={20} /> Accedi con Email
                   </HapticButton>
                 </>
               ) : (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-black uppercase">{isSignUp ? 'Registrati' : 'Accedi'}</h3>
                     <button 
                       onClick={() => {
                         setShowEmailAuth(false);
                         setEmail('');
                         setPassword('');
                         setSignupNickname('');
                         setIsSignUp(false);
                       }}
                       className="text-[10px] font-black opacity-40 hover:opacity-100 transition-opacity"
                     >
                       Indietro
                     </button>
                   </div>
                   
                   {isSignUp && (
                     <div>
                       <label className="text-[9px] font-black opacity-40 uppercase tracking-widest block mb-2">Nickname</label>
                       <NicknameInput
                         value={signupNickname}
                         onChange={setSignupNickname}
                         placeholder="Il tuo nickname"
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 font-bold focus:outline-none focus:border-blue-600/50 transition-colors text-white"
                       />
                     </div>
                   )}
                   
                   <div>
                     <label className="text-[9px] font-black opacity-40 uppercase tracking-widest block mb-2">Email</label>
                     <EmailInput
                       value={email}
                       onChange={setEmail}
                       placeholder="tua@email.com"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-blue-600/50 transition-colors text-white"
                     />
                   </div>
                   
                   <div>
                     <label className="text-[9px] font-black opacity-40 uppercase tracking-widest block mb-2">Password</label>
                     <input
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold focus:outline-none focus:border-blue-600/50 transition-colors"
                     />
                   </div>
                   
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
                     className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loading ? 'Caricamento...' : (isSignUp ? 'Registrati' : 'Accedi')}
                   </HapticButton>
                   
                   <button
                     onClick={() => setIsSignUp(!isSignUp)}
                     className="w-full text-center text-[10px] font-black opacity-40 hover:opacity-100 transition-opacity"
                   >
                     {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
                   </button>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-6 mb-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-1">Nickname per gli amici</label>
                  <input 
                    type="text" 
                    value={nickname} 
                    onChange={(e) => setNickname(e.target.value)}
                    onBlur={saveProfile}
                    placeholder="Il tuo nickname..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 font-bold focus:outline-none focus:border-red-600/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-1">La tua Bio</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    onBlur={saveProfile}
                    placeholder="Scrivi qualcosa su di te..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 font-bold h-24 focus:outline-none focus:border-red-600/50 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-1">Cerca Amici</label>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    type="text" 
                    value={searchFriend}
                    onChange={(e) => setSearchFriend(e.target.value)}
                    placeholder="Nome amico..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-3.5 font-bold focus:outline-none focus:border-blue-600/50 transition-colors"
                  />
                </div>
                {searchFriend && (
                  <div className="space-y-2 bg-white/5 rounded-2xl p-2 border border-white/5 animate-in fade-in slide-in-from-top-2">
                    {loading ? (
                      <p className="text-center py-4 text-[10px] font-black opacity-20 uppercase tracking-widest">Ricerca in corso...</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => {
                        const isCurrentUser = currentUserId && user.id === currentUserId;
                        
                        return (
                          <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
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

          <div className="bg-[#1C1C1E] p-6 rounded-[32px] border border-white/5 space-y-4 shadow-2xl mb-6">
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Film Salvati</span>
               <span className="font-black text-xl text-red-600 italic tracking-tighter">{likedMovies.length}</span>
             </div>
             {userStats && (
               <>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Match Trovati</span>
                   <span className="font-black text-lg text-green-500 italic tracking-tighter">{userStats.matches_found}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Stanze Create</span>
                   <span className="font-black text-lg text-purple-500 italic tracking-tighter">{userStats.rooms_created}</span>
                 </div>
               </>
             )}
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Stato Account</span>
               <span className={`font-black text-[9px] uppercase px-3 py-1 rounded-full ${isGuest ? 'bg-white/5 text-white/30' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'}`}>{isGuest ? 'Limitato' : 'Premium'}</span>
             </div>
          </div>
          
          {!isGuest && (
             <HapticButton 
              onClick={() => {
                authService.signOut();
                setIsGuest(true);
                setActiveTab('home');
              }}
              className="w-full py-4 text-center text-red-600 font-black uppercase text-[10px] tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
             >
               Esci dall'account
             </HapticButton>
          )}
        </div>
      );
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex flex-col bg-black">
      <main className="flex-1 relative overflow-hidden">{renderContent()}</main>
      {!isSessionActive && !roomViewMode && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/80 ios-blur border-t border-white/5 flex items-center justify-around px-8 pb-2 z-[90]">
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
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-red-600 scale-105' : 'text-white/20'}`}
  >
    {icon}<span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
  </HapticButton>
);

export default App;
