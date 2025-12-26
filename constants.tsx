
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

// Film di default per ogni genere - usati immediatamente mentre si caricano i film da TMDB
export const DEFAULT_MOVIES_BY_GENRE: Record<number, any[]> = {
  // Azione (28)
  28: [
    { id: 550, title: "Fight Club", year: "1999", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 8.8, genres: ["Azione", "Drammatico"], overview: "Un impiegato di ufficio insonne e un fabbricante di sapone formano un club di combattimento sotterraneo che si evolve in qualcosa di molto più grande." },
    { id: 245891, title: "John Wick", year: "2014", poster: "https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg", rating: 7.4, genres: ["Azione", "Thriller"], overview: "Un ex sicario torna alla vita criminale dopo che un boss mafioso ruba la sua auto e uccide il cane che gli aveva regalato la moglie defunta." },
    { id: 335983, title: "Venom", year: "2018", poster: "https://image.tmdb.org/t/p/w500/2uNW4WbgBXL00B31IIhlJcF9jse.jpg", rating: 6.7, genres: ["Azione", "Sci-Fi"], overview: "Un giornalista si lega a un simbionte alieno che gli dà superpoteri, mentre il corpo del simbionte controlla il suo corpo e lo spinge a mangiare teste." },
    { id: 335984, title: "Blade Runner 2049", year: "2017", poster: "https://image.tmdb.org/t/p/w500/gajva2L0RZYbYL7f5fQq3dJF3xL.jpg", rating: 8.0, genres: ["Azione", "Sci-Fi"], overview: "Un giovane Blade Runner scopre un segreto che potrebbe gettare nel caos la società e spinge il detective K a trovare Rick Deckard, che è scomparso da 30 anni." },
    { id: 335985, title: "Mad Max: Fury Road", year: "2015", poster: "https://image.tmdb.org/t/p/w500/hA2ple9q4mMD4JN6d2Q7qrmMqoH.jpg", rating: 7.6, genres: ["Azione", "Avventura"], overview: "In un mondo post-apocalittico, Max si unisce a una ribelle per fuggire da un tiranno in un inseguimento attraverso il deserto." }
  ],
  // Commedia (35)
  35: [
    { id: 19404, title: "Dilwale Dulhania Le Jayenge", year: "1995", poster: "https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg", rating: 8.7, genres: ["Commedia", "Romantico"], overview: "Raj è un giovane ricco che si innamora di Simran durante un viaggio in Europa. Ma il padre di Simran ha già promesso la figlia in matrimonio." },
    { id: 13, title: "Forrest Gump", year: "1994", poster: "https://image.tmdb.org/t/p/w500/arw2vcBve2OVz6P6N1qJi1nXZP6.jpg", rating: 8.8, genres: ["Commedia", "Drammatico"], overview: "La storia di Forrest Gump, un uomo con un QI basso ma buon cuore, che è involontariamente coinvolto in alcuni degli eventi più importanti della storia americana." },
    { id: 105, title: "Back to the Future", year: "1985", poster: "https://image.tmdb.org/t/p/w500/fNOH9f1aB7tRHgC8nZ9pfCNwxol.jpg", rating: 8.3, genres: ["Commedia", "Sci-Fi"], overview: "Marty McFly, un tipico adolescente degli anni '80, viene accidentalmente spedito 30 anni nel passato in una macchina del tempo inventata dal suo amico scienziato Doc Brown." },
    { id: 106, title: "Predator", year: "1987", poster: "https://image.tmdb.org/t/p/w500/9uGHEgsiUXjCNq8wdq4r49YL8A1.jpg", rating: 7.6, genres: ["Azione", "Thriller"], overview: "Un team di commandos viene inviato in una giungla centroamericana per salvare dei piloti, ma si ritrova a essere cacciato da un alieno invisibile." },
    { id: 107, title: "Snatch", year: "2000", poster: "https://image.tmdb.org/t/p/w500/on5JlbDFjrr5jA8f0p3XhAlA5vO.jpg", rating: 8.3, genres: ["Commedia", "Crime"], overview: "Un gruppo di criminali londinesi si intreccia in una serie di eventi che coinvolgono un diamante, un pugile e un bookmaker." }
  ],
  // Horror (27)
  27: [
    { id: 694, title: "The Shining", year: "1980", poster: "https://image.tmdb.org/t/p/w500/9fgh3Ns1iRzlQNYuJyK0ARQZUuj.jpg", rating: 8.4, genres: ["Horror", "Thriller"], overview: "Jack Torrance accetta un lavoro come custode invernale in un hotel isolato. Un male soprannaturale influenza Jack verso la violenza." },
    { id: 539, title: "Psycho", year: "1960", poster: "https://image.tmdb.org/t/p/w500/81q8T6v2T0a0qN6yKn6R2PzJDVx.jpg", rating: 8.5, genres: ["Horror", "Thriller"], overview: "Una segretaria ruba 40.000 dollari dal suo datore di lavoro e fugge, ma si ferma in un motel isolato dove incontra il proprietario inquietante Norman Bates." },
    { id: 694, title: "The Exorcist", year: "1973", poster: "https://image.tmdb.org/t/p/w500/4ucLGcXVVSVnsfkGtbLY4XAius8w.jpg", rating: 8.1, genres: ["Horror", "Thriller"], overview: "Quando una giovane ragazza viene posseduta da un'entità misteriosa, sua madre cerca disperatamente l'aiuto di due preti per salvare sua figlia." },
    { id: 694, title: "Get Out", year: "2017", poster: "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg", rating: 7.8, genres: ["Horror", "Thriller"], overview: "Un giovane afroamericano visita la famiglia della sua ragazza bianca per un weekend, ma scopre presto che la situazione è molto più sinistra di quanto sembri." },
    { id: 694, title: "Hereditary", year: "2018", poster: "https://image.tmdb.org/t/p/w500/4GFPuL14eXi66V6xOJei0xCDMvw.jpg", rating: 7.3, genres: ["Horror", "Thriller"], overview: "Dopo la morte della nonna, la famiglia Graham inizia a rivelare segreti oscuri e un destino terribile che non possono controllare." }
  ],
  // Drammatico (18)
  18: [
    { id: 278, title: "The Shawshank Redemption", year: "1994", poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", rating: 9.3, genres: ["Drammatico", "Crime"], overview: "Due uomini imprigionati si legano nel corso di diversi anni, trovando consolazione e, infine, redenzione attraverso atti di decenza comune." },
    { id: 238, title: "The Godfather", year: "1972", poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", rating: 9.2, genres: ["Drammatico", "Crime"], overview: "Il patriarca di una dinastia criminale organizza il trasferimento del controllo del suo impero mafioso al figlio riluttante." },
    { id: 240, title: "The Godfather: Part II", year: "1974", poster: "https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FhHcKXJjTvZtZ8.jpg", rating: 9.0, genres: ["Drammatico", "Crime"], overview: "Il primo episodio della saga della famiglia Corleone racconta la storia di un giovane immigrato siciliano che costruisce un impero criminale." },
    { id: 424, title: "Schindler's List", year: "1993", poster: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg", rating: 8.9, genres: ["Drammatico", "Storico"], overview: "Nella Polonia occupata dai nazisti durante la seconda guerra mondiale, Oskar Schindler diventa sempre più preoccupato per i suoi lavoratori ebrei." },
    { id: 129, title: "Spirited Away", year: "2001", poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", rating: 8.6, genres: ["Animazione", "Drammatico"], overview: "Durante la sua famiglia si trasferisce in un nuovo quartiere, una ragazza di 10 anni si avventura in un mondo governato da dei, streghe e spiriti." }
  ],
  // Sci-Fi (878)
  878: [
    { id: 550, title: "Fight Club", year: "1999", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 8.8, genres: ["Sci-Fi", "Drammatico"], overview: "Un impiegato di ufficio insonne e un fabbricante di sapone formano un club di combattimento sotterraneo che si evolve in qualcosa di molto più grande." },
    { id: 157336, title: "Interstellar", year: "2014", poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", rating: 8.6, genres: ["Sci-Fi", "Drammatico"], overview: "Le avventure di un gruppo di esploratori che fanno uso di un wormhole appena scoperto per superare i limiti del viaggio spaziale umano." },
    { id: 27205, title: "Inception", year: "2010", poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", rating: 8.8, genres: ["Sci-Fi", "Azione"], overview: "Un ladro che ruba segreti aziendali attraverso l'uso della tecnologia di condivisione dei sogni riceve l'incarico inverso di piantare un'idea nella mente di un CEO." },
    { id: 603, title: "The Matrix", year: "1999", poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", rating: 8.7, genres: ["Sci-Fi", "Azione"], overview: "Un programmatore informatico viene a sapere che la realtà che percepisce è una simulazione creata da macchine maligne." },
    { id: 181808, title: "Star Wars: The Last Jedi", year: "2017", poster: "https://image.tmdb.org/t/p/w500/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg", rating: 6.9, genres: ["Sci-Fi", "Azione"], overview: "Rey sviluppa le sue abilità con la Forza con l'aiuto di Luke Skywalker, mentre la Resistenza si prepara per la battaglia con il Primo Ordine." }
  ],
  // Animazione (16)
  16: [
    { id: 129, title: "Spirited Away", year: "2001", poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", rating: 8.6, genres: ["Animazione", "Drammatico"], overview: "Durante la sua famiglia si trasferisce in un nuovo quartiere, una ragazza di 10 anni si avventura in un mondo governato da dei, streghe e spiriti." },
    { id: 12444, title: "Shrek", year: "2001", poster: "https://image.tmdb.org/t/p/w500/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg", rating: 7.9, genres: ["Animazione", "Commedia"], overview: "Un orco verde e scontroso scopre che la sua palude è stata invasa da creature delle fiabe cacciate dalla terra dal malvagio Lord Farquaad." },
    { id: 12, title: "Finding Nemo", year: "2003", poster: "https://image.tmdb.org/t/p/w500/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg", rating: 8.2, genres: ["Animazione", "Avventura"], overview: "Un pesce pagliaccio di nome Marlin viaggia attraverso l'oceano per trovare suo figlio Nemo." },
    { id: 508442, title: "Soul", year: "2020", poster: "https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIma5gwhpUTH3.jpg", rating: 8.1, genres: ["Animazione", "Commedia"], overview: "Joe è un insegnante di musica delle scuole medie che ha perso la passione per la musica. Il suo sogno diventa realtà quando ottiene l'opportunità di suonare con la migliore band jazz della città." },
    { id: 324857, title: "Spider-Man: Into the Spider-Verse", year: "2018", poster: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg", rating: 8.4, genres: ["Animazione", "Azione"], overview: "Miles Morales diventa Spider-Man e deve unire le forze con cinque Spider-People da altre dimensioni per fermare una minaccia per tutte le realtà." }
  ],
  // Thriller (53)
  53: [
    { id: 550, title: "Fight Club", year: "1999", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 8.8, genres: ["Thriller", "Drammatico"], overview: "Un impiegato di ufficio insonne e un fabbricante di sapone formano un club di combattimento sotterraneo che si evolve in qualcosa di molto più grande." },
    { id: 680, title: "Pulp Fiction", year: "1994", poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", rating: 8.9, genres: ["Thriller", "Crime"], overview: "Le vite di due sicari della mafia, un pugile, la moglie di un gangster e due banditi si intrecciano in quattro storie di violenza e redenzione." },
    { id: 475557, title: "Joker", year: "2019", poster: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", rating: 8.2, genres: ["Thriller", "Drammatico"], overview: "Durante gli anni '80, un comico fallito viene guidato alla follia e trasforma la sua vita in un caos di crimine e caos." },
    { id: 496243, title: "Parasite", year: "2019", poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", rating: 8.5, genres: ["Thriller", "Drammatico"], overview: "Tutti i membri della famiglia Ki-taek sono disoccupati. Quando il figlio Ki-woo ottiene un lavoro ben pagato come tutor, la famiglia vede un'opportunità." },
    { id: 49026, title: "The Dark Knight Rises", year: "2012", poster: "https://image.tmdb.org/t/p/w500/85cWkCV1e9v2dm3AxAFzS3ni0qk.jpg", rating: 8.4, genres: ["Thriller", "Azione"], overview: "Otto anni dopo gli eventi di The Dark Knight, il terrorista Bane costringe Batman a uscire dal suo esilio autoimposto per salvare Gotham City." }
  ],
  // Documentario (99)
  99: [
    { id: 550, title: "Fight Club", year: "1999", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 8.8, genres: ["Documentario", "Drammatico"], overview: "Un impiegato di ufficio insonne e un fabbricante di sapone formano un club di combattimento sotterraneo che si evolve in qualcosa di molto più grande." },
    { id: 550, title: "Planet Earth", year: "2006", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 9.5, genres: ["Documentario"], overview: "Una serie documentaristica che esplora la diversità della vita sulla Terra in diversi habitat." },
    { id: 550, title: "The Act of Killing", year: "2012", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 8.2, genres: ["Documentario", "Crimine"], overview: "I carnefici del genocidio indonesiano del 1965-66 vengono intervistati e invitati a ricreare i loro omicidi in vari generi cinematografici." },
    { id: 550, title: "March of the Penguins", year: "2005", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 7.6, genres: ["Documentario"], overview: "Un documentario che segue il viaggio annuale dei pinguini imperatori in Antartide." },
    { id: 550, title: "Won't You Be My Neighbor?", year: "2018", poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", rating: 8.3, genres: ["Documentario"], overview: "Un documentario che esplora la vita e la filosofia di Fred Rogers, il creatore e conduttore di Mister Rogers' Neighborhood." }
  ]
};

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
