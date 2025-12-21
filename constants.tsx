
import React from 'react';

export const GENRES = [
  { id: 28, name: 'Azione', icon: '🎬' },
  { id: 35, name: 'Commedia', icon: '😂' },
  { id: 27, name: 'Horror', icon: '👻' },
  { id: 18, name: 'Drammatico', icon: '🎭' },
  { id: 878, name: 'Sci-Fi', icon: '🚀' },
  { id: 16, name: 'Animazione', icon: '🦄' },
  { id: 53, name: 'Thriller', icon: '🔪' },
  { id: 99, name: 'Documentario', icon: '🌍' }
];

export const MOCK_MOVIES: any[] = [
  {
    id: 1,
    title: "Inception",
    year: "2010",
    poster: "https://picsum.photos/seed/inception/500/750",
    rating: 8.8,
    genres: ["Sci-Fi", "Azione"],
    overview: "Un ladro che ruba segreti aziendali attraverso l'uso della tecnologia di condivisione dei sogni..."
  },
  {
    id: 2,
    title: "Interstellar",
    year: "2014",
    poster: "https://picsum.photos/seed/interstellar/500/750",
    rating: 8.6,
    genres: ["Sci-Fi", "Drammatico"],
    overview: "Un team di esploratori attraversa un wormhole nello spazio nel tentativo di garantire la sopravvivenza dell'umanità."
  },
  {
    id: 3,
    title: "The Dark Knight",
    year: "2008",
    poster: "https://picsum.photos/seed/batman/500/750",
    rating: 9.0,
    genres: ["Azione", "Crime"],
    overview: "Quando la minaccia nota come Joker emerge dal suo passato misterioso, semina caos e distruzione su Gotham."
  },
  {
    id: 4,
    title: "Pulp Fiction",
    year: "1994",
    poster: "https://picsum.photos/seed/pulp/500/750",
    rating: 8.9,
    genres: ["Crime", "Drammatico"],
    overview: "Le vite di due sicari della mafia, un pugile, la moglie di un gangster e due banditi si intrecciano."
  }
];

export const COLORS = {
  primary: '#FF3B30',
  success: '#30D158',
  info: '#007AFF',
  background: '#1C1C1E',
  gradientEnd: '#0A0E27'
};
