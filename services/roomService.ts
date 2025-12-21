
// Sistema di stanze multiplayer semplice per beta
// In produzione usare Firebase Realtime Database o Supabase

import { Movie } from '../types';

export interface RoomMember {
  id: string;
  nickname: string;
  isHost: boolean;
  status: 'ready' | 'playing';
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  hostNickname: string;
  movies: Movie[];
  members: RoomMember[];
  status: 'lobby' | 'playing' | 'finished';
  createdAt: number;
}

class RoomService {
  private rooms: Map<string, Room> = new Map();

  createRoom(hostId: string, hostNickname: string, movies: Movie[]): Room {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: Room = {
      id: `room_${Date.now()}`,
      code,
      hostId,
      hostNickname,
      movies,
      members: [{
        id: hostId,
        nickname: hostNickname,
        isHost: true,
        status: 'ready'
      }],
      status: 'lobby',
      createdAt: Date.now()
    };
    
    this.rooms.set(code, room);
    localStorage.setItem(`room_${code}`, JSON.stringify(room));
    return room;
  }

  getRoom(code: string): Room | null {
    // Cerca prima in memoria
    const room = this.rooms.get(code);
    if (room) return room;
    
    // Fallback a localStorage
    const saved = localStorage.getItem(`room_${code}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.rooms.set(code, parsed);
        return parsed;
      } catch (e) {
        console.error('Error parsing room from localStorage:', e);
        return null;
      }
    }
    
    return null;
  }

  joinRoom(code: string, userId: string, nickname: string): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;
    
    // Verifica se l'utente è già membro
    if (room.members.find(m => m.id === userId)) {
      return room; // Già membro
    }
    
    // Aggiungi nuovo membro
    room.members.push({
      id: userId,
      nickname,
      isHost: false,
      status: 'ready'
    });
    
    // Aggiorna storage
    this.rooms.set(code, room);
    localStorage.setItem(`room_${code}`, JSON.stringify(room));
    return room;
  }

  startRoom(code: string): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    
    room.status = 'playing';
    this.rooms.set(code, room);
    localStorage.setItem(`room_${code}`, JSON.stringify(room));
    return true;
  }

  updateMemberStatus(code: string, userId: string, status: 'ready' | 'playing'): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    
    const member = room.members.find(m => m.id === userId);
    if (!member) return false;
    
    member.status = status;
    this.rooms.set(code, room);
    localStorage.setItem(`room_${code}`, JSON.stringify(room));
    return true;
  }
}

export const roomService = new RoomService();

