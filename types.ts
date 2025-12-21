
export interface Movie {
  id: number;
  title: string;
  year: string;
  poster: string;
  rating: number;
  genres: string[];
  overview: string;
  trailerKey?: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  isGuest: boolean;
  stats: {
    voted: number;
    roomsCreated: number;
  };
}

export enum RoomStatus {
  LOBBY = 'lobby',
  ROUND = 'round',
  MATCHED = 'matched',
  FINISHED = 'finished'
}
