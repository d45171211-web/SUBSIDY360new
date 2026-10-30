import { useState, useRef, useEffect, useMemo } from "react";

/**
 * Modern, accessible, keyboard-friendly Searchable Dropdown
 * Styled in Soft White, Sage Green, and Deep Olive.
 */
export function SearchableDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  emptyMessage = "No matching options found",
  badgeText,
  disabled = false,
  allowCustom = false,
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options: allow array of strings or { label, value, sub }
  const normalizedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === "string") {
        return { label: opt, value: opt, sub: "" };
      }
      return {
        label: opt.label || opt.value || "",
        value: opt.value ?? opt.label ?? "",
        sub: opt.sub || "",
      };
    });
  }, [options]);

  // Filtered options: If user is searching, filter. Otherwise show all options!
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(q) ||
      (opt.sub && opt.sub.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  const MAX_VISIBLE = 150;
  const visibleOptions = useMemo(() => filtered.slice(0, MAX_VISIBLE), [filtered]);

  // Currently selected option object
  const selectedOpt = useMemo(() => {
    return normalizedOptions.find(opt => opt.value === value || opt.label === value);
  }, [normalizedOptions, value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When opening, scroll to currently selected item
  useEffect(() => {
    if (isOpen && listRef.current) {
      if (value) {
        const selectedIdx = visibleOptions.findIndex(opt => opt.value === value || opt.label === value);
        if (selectedIdx >= 0) {
          setHighlightIndex(selectedIdx);
          const items = listRef.current.querySelectorAll(".sdrop-item");
          if (items[selectedIdx]) {
            items[selectedIdx].scrollIntoView({ block: "nearest" });
          }
        } else {
          setHighlightIndex(0);
        }
      } else {
        setHighlightIndex(0);
      }
    }
  }, [isOpen]);

  // Scroll highlighted item
  useEffect(() => {
    if (isOpen && highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll(".sdrop-item");
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex, isOpen]);

  const handleSelect = (opt) => {
    onChange(opt.value, opt);
    setSearch("");
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("", null);
    setSearch("");
    setHighlightIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightIndex(prev => (prev + 1 < visibleOptions.length ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightIndex(prev => (prev - 1 >= 0 ? prev - 1 : visibleOptions.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightIndex >= 0 && highlightIndex < visibleOptions.length) {
        handleSelect(visibleOptions[highlightIndex]);
      } else if (allowCustom && search.trim()) {
        onChange(search.trim(), { label: search.trim(), value: search.trim() });
        setSearch("");
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
    }
  };

  // Determine current display text in input
  const displayLabel = selectedOpt ? selectedOpt.label : (value || "");
  const displayValue = isOpen ? search : displayLabel;

  return (
    <div
      ref={containerRef}
      className={`sdrop-container ${disabled ? "sdrop-disabled" : ""}`}
      style={{ position: "relative", width: "100%", maxWidth: 460, ...style }}
    >
      <div
        className={`sdrop-input-wrap ${isOpen ? "focused" : ""}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            if (inputRef.current) inputRef.current.focus();
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--panel)",
          border: `1.5px solid ${isOpen ? "var(--em)" : "var(--line2)"}`,
          borderRadius: 6,
          boxShadow: isOpen ? "0 0 0 3px rgba(123, 155, 125, 0.2)" : "var(--card-shadow)",
          padding: "3px 12px",
          cursor: "pointer",
          transition: "border-color .15s ease, box-shadow .15s ease",
        }}
      >
        <span
          style={{
            color: "var(--muted)",
            fontSize: 14,
            marginRight: 8,
            userSelect: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
          aria-hidden="true"
        >
          🔍
        </span>

        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          disabled={disabled}
          placeholder={displayLabel || placeholder}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--txt)",
            font: "500 14px var(--sans)",
            padding: "8px 0",
            minWidth: 0,
            cursor: "text",
          }}
          aria-label={placeholder}
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />

        {(value || search) && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "4px 6px",
              fontSize: 12,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 4,
            }}
            title="Clear selection"
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(o => !o);
              if (!isOpen && inputRef.current) inputRef.current.focus();
            }
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--paper)",
            cursor: "pointer",
            padding: "4px 2px",
            fontSize: 11,
            userSelect: "none",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform .2s ease",
          }}
          aria-label="Toggle dropdown"
          tabIndex={-1}
        >
          ▼
        </button>
      </div>

      {badgeText && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span
            className="badge b-official"
            style={{
              fontSize: 10.5,
              padding: "2px 8px",
              borderRadius: 3,
            }}
          >
            {badgeText}
          </span>
        </div>
      )}

      {isOpen && !disabled && (
        <div
          ref={listRef}
          className="sdrop-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 280,
            overflowY: "auto",
            background: "var(--panel)",
            border: "1px solid var(--line2)",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(31, 59, 46, 0.14)",
            zIndex: 100,
            padding: "4px 0",
          }}
          role="listbox"
        >
          <div
            style={{
              padding: "6px 12px",
              fontFamily: "var(--mono)",
              fontSize: 10.5,
              color: "var(--muted)",
              letterSpacing: ".04em",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg2)",
            }}
          >
            <span>{filtered.length} {filtered.length === 1 ? "OPTION" : "OPTIONS"}</span>
            <span>CLICK OR PRESS ↵</span>
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                padding: "16px 14px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              <div>{emptyMessage}</div>
              {allowCustom && search.trim() && (
                <button
                  type="button"
                  className="btn sec"
                  onClick={() => {
                    handleSelect({ label: search.trim(), value: search.trim() });
                  }}
                  style={{ marginTop: 8, fontSize: 12, padding: "5px 10px" }}
                >
                  Use &quot;{search.trim()}&quot; anyway
                </button>
              )}
            </div>
          ) : (
            <>
              {visibleOptions.map((opt, i) => {
                const isSelected = value === opt.value || value === opt.label;
                const isHighlighted = i === highlightIndex;
                return (
                  <div
                    key={`${opt.value}-${i}`}
                    className="sdrop-item"
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightIndex(i)}
                    role="option"
                    aria-selected={isSelected}
                    style={{
                      padding: "9px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      fontSize: 13.5,
                      color: isSelected ? "var(--paper)" : "var(--txt)",
                      fontWeight: isSelected ? 600 : 500,
                      background: isSelected
                        ? "var(--panel2)"
                        : isHighlighted
                        ? "rgba(123, 155, 125, 0.12)"
                        : "transparent",
                      transition: "background .1s ease",
                    }}
                  >
                    <div>
                      <span>{opt.label}</span>
                      {opt.sub && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            marginLeft: 8,
                            fontFamily: "var(--mono)",
                          }}
                        >
                          ({opt.sub})
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span
                        style={{
                          color: "var(--em)",
                          fontSize: 14,
                          fontWeight: "bold",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
              {filtered.length > MAX_VISIBLE && (
                <div
                  style={{
                    padding: "8px 14px",
                    textAlign: "center",
                    fontSize: 11,
                    color: "var(--muted)",
                    background: "var(--bg2)",
                    borderTop: "1px solid var(--line)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  Showing top {MAX_VISIBLE} of {filtered.length} matching options. Type to narrow search.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
