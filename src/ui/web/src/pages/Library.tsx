import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/mock';
import { SectionHeader } from '../components/SectionHeader';
import { useClipContext } from '../context/ClipContext';
import { useLibrary } from '../context/LibraryContext';
import type { Clip } from '../types';
import { downloadFile } from '../utils/export';

export const Library = () => {
  const { openClip } = useClipContext();
  const { savedSearches, addSearch, removeSearch } = useLibrary();
  const [clips, setClips] = useState<Clip[]>([]);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');

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

  const applySavedSearch = (id: string) => {
    const search = savedSearches.find((item) => item.id === id);
    if (!search) {
      return;
    }
    setQuery(search.query);
    setActiveTag(search.tag);
  };

  const saveSearch = () => {
    const name = searchName.trim();
    if (!name) {
      return;
    }
    addSearch(name, query, activeTag);
    setSearchName('');
  };

  const exportPlaylist = () => {
    const payload = {
      name: query ? `Search: ${query}` : activeTag ? `Tag: ${activeTag}` : 'Playlist',
      createdAt: new Date().toISOString(),
      query,
      tag: activeTag,
      clips: filtered
    };
    downloadFile('afm-playlist.json', JSON.stringify(payload, null, 2), 'application/json');
  };

  return (
    <div className="page-content">
      <SectionHeader
        title="Clip Library"
        subtitle="Search evidence clips and build packs quickly."
        action={
          <button className="btn primary" onClick={exportPlaylist} disabled={filtered.length === 0}>
            Export playlist
          </button>
        }
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
        <div className="library-actions">
          <input
            type="text"
            placeholder="Save this search as..."
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
          />
          <button className="btn" onClick={saveSearch} disabled={!searchName.trim()}>
            Save search
          </button>
        </div>
        {savedSearches.length > 0 ? (
          <div className="saved-searches">
            {savedSearches.map((search) => (
              <div key={search.id} className="saved-search">
                <button className="btn ghost" onClick={() => applySavedSearch(search.id)}>
                  <div>
                    <h4>{search.name}</h4>
                    <p>
                      {search.query || 'Any query'} · {search.tag ?? 'All tags'}
                    </p>
                  </div>
                  <span className="pill">Apply</span>
                </button>
                <button className="btn ghost" onClick={() => removeSearch(search.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No saved searches yet.</p>
        )}
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
