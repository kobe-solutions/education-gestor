/* global React, I */
// ─── Form controls ─────────────────────────────────────────────────────────
// Button · Field · Input · Search · Textarea · Select · Checkbox
// All visually styled by `styles/primitives.css` under the same class names.

function Button({ variant = "primary", size = "md", icon: Icon, children, onClick, type = "button", disabled }) {
  const cls = [
    "btn",
    variant,
    size === "sm" ? "sm" : size === "lg" ? "lg" : "",
    size === "icon" ? "icon" : "",
  ].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
}

function Field({ label, help, error, children }) {
  return (
    <div className="field">
      {label ? <span className="label">{label}</span> : null}
      {children}
      {error ? <span className="err">{error}</span> : help ? <span className="help">{help}</span> : null}
    </div>
  );
}

function Input(props) {
  return <input className={"input" + (props.error ? " error" : "")} {...props} />;
}

function Search({ value, onChange, placeholder = "Buscar…" }) {
  return (
    <div className="search-wrap">
      <span className="icn"><I.Search size={14} /></span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className="textarea"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="select-wrap">
      <select
        className="input select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="select-caret"><I.Chevron size={12} /></span>
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label className="cbox">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="cbox-fake">{checked ? <I.Check size={11} /> : null}</span>
      <span>{label}</span>
    </label>
  );
}

Object.assign(window, { Button, Field, Input, Search, Textarea, Select, Checkbox });
