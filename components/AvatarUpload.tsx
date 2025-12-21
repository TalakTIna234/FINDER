
// Componente per upload avatar
import React, { useRef, useState } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { HapticButton } from './HapticButton';
import { supabase } from '../services/supabaseClient';
import { profileService } from '../services/profileService';

interface Props {
  currentAvatarUrl?: string | null;
  onAvatarUpdated: (url: string) => void;
}

export const AvatarUpload: React.FC<Props> = ({ currentAvatarUrl, onAvatarUpdated }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validazione
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'immagine deve essere più piccola di 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Seleziona un file immagine');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Devi essere autenticato per caricare un avatar');
        return;
      }

      // Crea nome file univoco
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        alert('Errore nel caricamento dell\'immagine');
        return;
      }

      // Ottieni URL pubblico
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        // Aggiorna profilo
        await profileService.updateAvatar(data.publicUrl);
        onAvatarUpdated(data.publicUrl);
        setPreview(data.publicUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Errore nel caricamento dell\'immagine');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      await profileService.updateAvatar('');
      onAvatarUpdated('');
      setPreview(null);
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <div className="w-24 h-24 bg-gradient-to-br from-red-600 via-purple-700 to-indigo-800 rounded-[32px] flex items-center justify-center text-3xl font-black italic shadow-2xl border border-white/10 overflow-hidden">
        {preview ? (
          <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span>MM</span>
        )}
      </div>
      
      <HapticButton
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-black"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera size={18} />
        )}
      </HapticButton>
      
      {preview && (
        <HapticButton
          onClick={handleRemoveAvatar}
          disabled={uploading}
          className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-black"
        >
          <X size={14} />
        </HapticButton>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

