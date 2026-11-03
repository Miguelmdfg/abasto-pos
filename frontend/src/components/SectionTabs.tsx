export type SectionTab = {
  id: string;
  label: string;
};

export function SectionTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: SectionTab[];
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`${tab.id}-tab`}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          onClick={() => onChange(tab.id)}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
