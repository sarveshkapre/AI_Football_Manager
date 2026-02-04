import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import { useClipContext } from '../context/ClipContext';
import type { Clip } from '../types';

export const Library = () => {
  const { openClip } = useClipContext();
  const [clips, setClips] = useState<Clip[]>([]);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    api.getClips().then(setClips);
  }, []);

  const tags = useMemo(() => {
    const tagSet = new Set<string>();
    clips.forEach((clip) => clip.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [clips]);

  const filtered = useMemo(() => {
    return clips.filter((clip) => {
      const matchesQuery = clip.title.toLowerCase().includes(query.toLowerCase());
      const matchesTag = activeTag ? clip.tags.includes(activeTag) : true;
      return matchesQuery && matchesTag;
    });
  }, [clips, query, activeTag]);

  return (
    <div className="page-content">
      <SectionHeader
        title="Clip Library"
        subtitle="Search evidence clips and build packs quickly."
        action={<button className="btn primary">New playlist</button>}
      />

      <div className="card surface">
        <div className="library-toolbar">
          <input
            type="search"
            placeholder="Search clips"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="tag-filter">
            <button
              className={`tag-chip ${activeTag === null ? 'active' : ''}`}
              onClick={() => setActiveTag(null)}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`tag-chip ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="library-grid">
          {filtered.map((clip) => (
            <button className="clip-card" key={clip.id} onClick={() => openClip(clip)}>
              <div className="clip-thumb"></div>
              <div className="clip-body">
                <h4>{clip.title}</h4>
                <p>{clip.duration}</p>
                <div className="tag-row">
                  {clip.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
