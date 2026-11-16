import { Download } from 'lucide-react';

export type WorkspaceTab = 'studio' | 'voice-leading' | 'challenges' | 'guide' | 'manual';

interface HeaderProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onExportMidi: () => void;
  canExport: boolean;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'voice-leading', label: 'Voice Leading' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'guide', label: 'Theory Guide' },
  { id: 'manual', label: 'Manual' },
];

export function Header({
  activeTab,
  onSelectTab,
  onExportMidi,
  canExport,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('studio');
          }}
          className="flex items-baseline gap-2 shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Chord Compass Pro
          </span>
          <span className="hidden whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:inline">
            created by Ray Foo
          </span>
        </a>

        {/* Zone 2: Clean single-line text navigation */}
        <nav aria-label="Workspace sections" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600 cursor-pointer ${
                  isActive
                    ? 'text-slate-950'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-sky-700"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onExportMidi}
            disabled={!canExport}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Export MIDI</span>
          </button>
        </div>
      </div>

      {/* Mobile compact navigation row */}
      <nav
        aria-label="Mobile sections"
        className="flex md:hidden flex-wrap items-center gap-1.5 border-t border-slate-100 px-4 py-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
