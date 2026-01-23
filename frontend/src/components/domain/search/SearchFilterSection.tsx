import SearchFilters from './SearchFilters';
import SearchBar from './SearchBar';

interface SearchFilterSectionProps {
  selectedOttServices: string[];
  searchInput: string;
  placeholder: string;
  onOttFilterChange: (ottService: string) => void;
  onSearchInputChange: (input: string) => void;
  onSearch: () => void;
}

export default function SearchFilterSection({
  selectedOttServices,
  searchInput,
  placeholder,
  onOttFilterChange,
  onSearchInputChange,
  onSearch,
}: SearchFilterSectionProps) {
  return (
    <div className="mt-5 h-[100px] w-full border-t border-gray-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-[852px] flex-col px-6">
        <SearchFilters
          selectedOttServices={selectedOttServices}
          onOttFilterChange={onOttFilterChange}
        />
        <SearchBar
          value={searchInput}
          onChange={onSearchInputChange}
          onSearch={onSearch}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
