// AnimeBlock.tsx
import { FC } from "react";

interface AnimeBlockProps {
  title: string;
  studio: string;
  year: string;
  episodes: string;
}

const AnimeBlock: FC<AnimeBlockProps> = ({ title, studio, year, episodes }) => (
  <div className="anime-card rounded-2xl border border-line bg-white/60 p-4 dark:bg-white/10 mt-4">
    <h3 className="text-lg font-bold mb-1">{title}</h3>
    <p className="text-sm">Studio: {studio}</p>
    <p className="text-sm">Sortie: {year}</p>
    <p className="text-sm">Episodes: {episodes}</p>
  </div>
);

export default AnimeBlock;
