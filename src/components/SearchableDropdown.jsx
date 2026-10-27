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
  allowCustom = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
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

  // Filtered list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(q) ||
      (opt.sub && opt.sub.toLowerCase().includes(q))
    );
  }, [normalizedOptions, query]);

  // Sync query when value changes from outside or dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setQuery(value || "");
    }
  }, [value, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll active item into view
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
    setQuery(opt.label);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("", null);
    setQuery("");
    setHighlightIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightIndex(0);
      } else {
        setHighlightIndex(prev => (prev + 1 < filtered.length ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightIndex(filtered.length - 1);
      } else {
        setHighlightIndex(prev => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightIndex >= 0 && highlightIndex < filtered.length) {
        handleSelect(filtered[highlightIndex]);
      } else if (allowCustom && query.trim()) {
        // Allow custom entry
        onChange(query.trim(), { label: query.trim(), value: query.trim() });
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`sdrop-container ${disabled ? "sdrop-disabled" : ""}`}
      style={{ position: "relative", width: "100%", maxWidth: 440 }}
    >
      <div
        className={`sdrop-input-wrap ${isOpen ? "focused" : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--panel)",
          border: `1.5px solid ${isOpen ? "var(--em)" : "var(--line2)"}`,
          borderRadius: 6,
          boxShadow: isOpen ? "0 0 0 3px rgba(123, 155, 125, 0.2)" : "var(--card-shadow)",
          padding: "3px 10px",
          transition: "border-color .15s ease, box-shadow .15s ease",
        }}
      >
        <span
          style={{
            color: "var(--muted)",
            fontSize: 15,
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
          value={query}
          disabled={disabled}
          placeholder={isOpen ? searchPlaceholder : (value || placeholder)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightIndex(0);
            if (allowCustom) {
              onChange(e.target.value);
            }
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightIndex(-1);
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
          }}
          aria-label={placeholder}
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "4px 6px",
              fontSize: 13,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 4,
            }}
            title="Clear"
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}

        <button
          type="button"
          onClick={() => {
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
              fontSize: 10,
              padding: "2px 7px",
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
            <span>PRESS ↵ TO SELECT</span>
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
              {allowCustom && query.trim() && (
                <button
                  type="button"
                  className="btn sec"
                  onClick={() => {
                    handleSelect({ label: query.trim(), value: query.trim() });
                  }}
                  style={{ marginTop: 8, fontSize: 12, padding: "5px 10px" }}
                >
                  Use &quot;{query.trim()}&quot; anyway
                </button>
              )}
            </div>
          ) : (
            filtered.map((opt, i) => {
              const isSelected = value === opt.value;
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
            })
          )}
        </div>
      )}
    </div>
  );
}
