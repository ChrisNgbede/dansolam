import React, { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown, Check } from 'lucide-react';
import { COUNTRIES, STATES_BY_COUNTRY } from '../../utils/geoData';

export default function LocationMultiSelect({
  selected = [],
  onChange,
  domesticCountry = 'United Kingdom',
  placeholder = 'Select areas...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalize selected value
  const selectedList = Array.isArray(selected) ? selected : [];

  // Generate options based on domestic country
  const states = STATES_BY_COUNTRY[domesticCountry] || [];
  const otherCountries = COUNTRIES.filter(c => c.name !== domesticCountry).map(c => c.name);

  // Combined options grouped
  const domesticOptions = [
    { name: domesticCountry, type: 'country', isDomestic: true },
    ...states.map(s => ({ name: s, type: 'state', isDomestic: true }))
  ];

  const internationalOptions = otherCountries.map(c => ({
    name: c,
    type: 'country',
    isDomestic: false
  }));

  // Filter options based on search query
  const filteredDomestic = domesticOptions.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredInternational = internationalOptions.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (name) => {
    let newSelected;
    if (selectedList.includes(name)) {
      newSelected = selectedList.filter(item => item !== name);
    } else {
      newSelected = [...selectedList, name];
    }
    onChange(newSelected);
  };

  const handleSelectAll = (isDomesticOnly = false) => {
    let toAdd = [];
    if (isDomesticOnly) {
      toAdd = domesticOptions.map(o => o.name);
    } else {
      toAdd = [...domesticOptions.map(o => o.name), ...internationalOptions.map(o => o.name)];
    }
    
    // Union with existing
    const newSelected = Array.from(new Set([...selectedList, ...toAdd]));
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className="relative w-full font-sans">
      {/* Input container acting as multi-select field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[38px] w-full px-3 py-1.5 rounded-lg border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 bg-white text-gray-800 flex flex-wrap gap-1.5 items-center cursor-pointer select-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      >
        {selectedList.length === 0 ? (
          <span className="text-gray-400 text-xs">{placeholder}</span>
        ) : (
          selectedList.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/20 dark:bg-primary/20 dark:text-primary-light"
            >
              {item}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(item);
                }}
                className="text-primary/70 hover:text-primary hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))
        )}
        <div className="ml-auto flex items-center gap-1 shrink-0 text-gray-405">
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="text-[10px] font-bold text-gray-400 hover:text-red-500 px-1 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto flex flex-col dark:bg-gray-800 dark:border-gray-700">
          {/* Search bar inside dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 sticky top-0 bg-white dark:bg-gray-800 dark:border-gray-700 z-10">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs focus:outline-none bg-transparent text-gray-800 dark:text-gray-200"
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick options action bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 dark:bg-gray-900/50 dark:border-gray-700">
            <span className=" text-[9px] tracking-wider">Select options</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-primary hover:underline cursor-pointer"
              >
                All Domestic
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-primary hover:underline cursor-pointer"
              >
                All Global
              </button>
            </div>
          </div>

          {/* Options list */}
          <div className="flex flex-col p-1 text-xs">
            {/* Domestic Section */}
            {filteredDomestic.length > 0 && (
              <div className="flex flex-col">
                <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">
                  Domestic ({domesticCountry})
                </div>
                {filteredDomestic.map(o => {
                  const isChecked = selectedList.includes(o.name);
                  return (
                    <button
                      key={o.name}
                      type="button"
                      onClick={() => toggleOption(o.name)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full cursor-pointer ${
                        isChecked ? 'bg-primary/5 text-primary font-semibold dark:bg-primary/10' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {o.type === 'country' ? (
                          <span className="font-bold">{o.name} (Whole Country)</span>
                        ) : (
                          <span>{o.name}</span>
                        )}
                      </span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* International Section */}
            {filteredInternational.length > 0 && (
              <div className="flex flex-col mt-1.5">
                <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">
                  International Countries
                </div>
                {filteredInternational.map(o => {
                  const isChecked = selectedList.includes(o.name);
                  return (
                    <button
                      key={o.name}
                      type="button"
                      onClick={() => toggleOption(o.name)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full cursor-pointer ${
                        isChecked ? 'bg-primary/5 text-primary font-semibold dark:bg-primary/10' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{o.name}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredDomestic.length === 0 && filteredInternational.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 italic">
                No matching locations found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
