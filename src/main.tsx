import { StrictMode, useMemo, useState } from "react";\nimport type { DragEvent } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type ComponentType =
  | "banner" | "category" | "product" | "text" | "image"
  | "button" | "search" | "whatsapp" | "video";

type BuilderComponent = {
  id: string;
  type: ComponentType;
  title: string;
  data: Record<string, string>;
};

type Tab = "content" | "style" | "action" | "visibility";

const palette: { type: ComponentType; label: string; icon: string; group: string }[] = [
  { type: "banner", label: "Banner / Slider", icon: "▧", group: "Commerce" },
  { type: "category", label: "Category Box", icon: "▦", group: "Commerce" },
  { type: "product", label: "Product List", icon: "◇", group: "Commerce" },
  { type: "search", label: "Camera Search", icon: "⌕", group: "Commerce" },
  { type: "whatsapp", label: "WhatsApp Share", icon: "◉", group: "Engagement" },
  { type: "text", label: "Text / Heading", icon: "T", group: "Content" },
  { type: "image", label: "Image", icon: "▨", group: "Content" },
  { type: "button", label: "Button", icon: "→", group: "Content" },
  { type: "video", label: "Video", icon: "▶", group: "Content" },
];

const initialComponents: BuilderComponent[] = [
  { id: "cat-1", type: "category", title: "Shop by Category", data: { items: "Men Fashion|Women Fashion|Home & Living|More" } },
  { id: "banner-1", type: "banner", title: "New Arrival", data: { subtitle: "Latest Collection Now in Stock", button: "Shop Now" } },
  { id: "text-1", type: "text", title: "New Arrival", data: { align: "left" } },
  { id: "products-1", type: "product", title: "Featured Products", data: { items: "Smart Watch|Sports Shoes", prices: "₹1,999|₹2,499" } },
];

const defaults: Record<ComponentType, Record<string, string>> = {
  banner: { subtitle: "Fresh collection for your customers", button: "Shop Now" },
  category: { items: "Category 1|Category 2|Category 3|More" },
  product: { items: "Product One|Product Two", prices: "₹999|₹1,499" },
  text: { align: "left" },
  image: { url: "" },
  button: { label: "View Products" },
  search: { title: "Find Products by Photo" },
  whatsapp: { label: "Share on WhatsApp" },
  video: { title: "Featured Video" },
};

const icon = (name: string) => <span className="ico">{name}</span>;

function App() {
  const [client, setClient] = useState("ABC Traders");
  const [components, setComponents] = useState(initialComponents);
  const [selectedId, setSelectedId] = useState("banner-1");
  const [tab, setTab] = useState<Tab>("content");
  const [published, setPublished] = useState(false);
  const [activePage, setActivePage] = useState("Home");
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => components.find((item) => item.id === selectedId) ?? null,
    [components, selectedId]
  );

  const filteredPalette = palette.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const slug = client.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function addComponent(type: ComponentType) {
    const meta = palette.find((item) => item.type === type);
    if (!meta) return;
    const id = `${type}-${Date.now()}`;
    const next: BuilderComponent = {
      id,
      type,
      title: meta.label,
      data: { ...defaults[type] },
    };
    setComponents((items) => [...items, next]);
    setSelectedId(id);
  }

  function updateSelected(field: string, value: string) {
    if (!selected) return;
    setComponents((items) =>
      items.map((item) =>
        item.id === selected.id
          ? field === "title"
            ? { ...item, title: value }
            : { ...item, data: { ...item.data, [field]: value } }
          : item
      )
    );
  }

  function moveSelected(direction: -1 | 1) {
    const index = components.findIndex((item) => item.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= components.length) return;
    const copy = [...components];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setComponents(copy);
  }

  function removeSelected() {
    if (!selected) return;
    const next = components.filter((item) => item.id !== selected.id);
    setComponents(next);
    setSelectedId(next[0]?.id ?? "");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const type = event.dataTransfer.getData("component-type") as ComponentType;
    if (type) addComponent(type);
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, type: ComponentType) {
    event.dataTransfer.setData("component-type", type);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">Y</div>
          <div><strong>YASH B2B APP Builder</strong><span className="saas-pill">SaaS</span></div>
        </div>
        <nav className="topnav">
          <span>⌂ Dashboard</span>
          <span>♙ Clients</span>
          <span className="active">✣ App Builder</span>
          <span>▤ Subscriptions</span>
          <span>▥ Reports</span>
        </nav>
        <div className="profile"><div className="avatar">YM</div><b>Yash Mathur</b><span>⌄</span></div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-section">
            {["Overview", "Clients", "App Builder", "Templates", "Customization", "Settings", "Billing", "Users"].map((item) => (
              <div key={item} className={item === "App Builder" ? "side-item selected" : "side-item"}>
                <span>{item === "App Builder" ? "✣" : item === "Clients" ? "♙" : item === "Settings" ? "⚙" : "◫"}</span>{item}
              </div>
            ))}
          </div>
          <div className="saas-card">
            <div className="crown">♛</div><b>SaaS Model</b>
            <div>✓ Multi Client</div><div>✓ Custom App URL</div><div>✓ Full Customization</div><div>✓ Drag & Drop Builder</div>
          </div>
        </aside>

        <main className="main">
          <section className="clientbar">
            <label className="client-select">Client
              <select value={client} onChange={(e) => setClient(e.target.value)}>
                <option>ABC Traders</option><option>Global Fashion</option><option>Shree Enterprises</option>
              </select>
            </label>
            <div className="urlbox">
              <span>App URL (Client Link)</span>
              <b>https://{slug || "shop"}.b2bapp.in</b>
              <button title="Copy link">⧉</button>
              <button title="Open">↗</button>
            </div>
            <span className="status">● Active</span>
            <button className="ghost">◉ Preview</button>
            <button className="publish" onClick={() => setPublished(true)}>⇧ Publish</button>
          </section>

          <section className="builder-grid">
            <section className="panel library">
              <div className="tabs"><button className="tab active">Build</button><button className="tab">Theme</button><button className="tab">Settings</button></div>
              <div className="library-head"><div><h3>Drag & Drop Components</h3><p>Build the shop app your way</p></div></div>
              <div className="component-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search components..." /></div>
              <div className="palette">
                {filteredPalette.map((item) => (
                  <button key={item.type} className="palette-item" draggable onDragStart={(e) => handleDragStart(e, item.type)} onClick={() => addComponent(item.type)}>
                    {icon(item.icon)}<b>{item.label}</b><small>{item.group}</small>
                  </button>
                ))}
              </div>
              <div className="drop-hint">Drag a component and drop it on the mobile preview</div>
            </section>

            <section className="preview-area">
              <div className="device-tools">
                <button className="device active">▯ Mobile</button><button className="device">▯ Tablet</button><span>100%</span></div>
              <div className="phone">
                <div className="phone-top"><span>☰</span><b>{client}</b><span>⌕ 🛒</span></div>
                <div className="phone-body" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                  <div className="app-strip"><span>Welcome to {client}</span><b>●</b></div>
                  {components.map((item) => (
                    <div key={item.id} className={item.id === selectedId ? "canvas-item selected-canvas" : "canvas-item"} onClick={() => setSelectedId(item.id)}>
                      {item.type === "category" && <div className="categories">{item.data.items.split("|").filter(Boolean).map((x) => <div className="cat" key={x}><div className="cat-icon">◇</div><b>{x}</b></div>)}</div>}
                      {item.type === "banner" && <div className="banner"><div><h2>{item.title}</h2><p>{item.data.subtitle}</p><button>{item.data.button} →</button></div><div className="banner-art">◯</div></div>}
                      {item.type === "text" && <h2 className="mobile-heading">{item.title}</h2>}
                      {item.type === "product" && <div><div className="section-head"><b>{item.title}</b><span>View All →</span></div><div className="products">{item.data.items.split("|").filter(Boolean).map((x, i) => <div className="product" key={x}><div className="product-img">◇</div><b>{item.data.prices.split("|")[i] ?? "₹999"}</b><span>{x}</span></div>)}</div></div>}
                      {item.type === "image" && <div className="image-block">{item.data.url ? <img src={item.data.url} alt="" /> : "Image placeholder"}</div>}
                      {item.type === "button" && <button className="wide-button">{item.data.label}</button>}
                      {item.type === "search" && <div className="feature-card"><div className="feature-icon">⌾</div><div><b>{item.data.title}</b><span>Search products using camera</span></div><span>›</span></div>}
                      {item.type === "whatsapp" && <button className="whatsapp-button">◉ {item.data.label}</button>}
                      {item.type === "video" && <div className="video-block">▶ <span>{item.data.title}</span></div>}
                      {item.id === selectedId && <div className="selection-actions"><button onClick={(e) => { e.stopPropagation(); moveSelected(-1); }}>↑</button><button onClick={(e) => { e.stopPropagation(); moveSelected(1); }}>↓</button><button className="danger" onClick={(e) => { e.stopPropagation(); removeSelected(); }}>×</button></div>}
                    </div>
                  ))}
                  <button className="add-section" onClick={() => addComponent("text")}>＋ Add Section</button>
                </div>
              </div>
              <div className="preview-note">Customer view • Live preview</div>
            </section>

            <section className="panel inspector">
              <div className="tabs">
                {(["content", "style", "action", "visibility"] as Tab[]).map((x) => <button key={x} className={tab === x ? "tab active" : "tab"} onClick={() => setTab(x)}>{x[0].toUpperCase() + x.slice(1)}</button>)}
              </div>
              {!selected ? <div className="empty">Select a component to edit.</div> : (
                <div className="inspector-content">
                  <div className="inspector-title"><div><h3>{selected.type === "banner" ? "Banner / Slider Settings" : selected.title + " Settings"}</h3><span>Selected component</span></div><span className="status mini">● Live</span></div>
                  {tab === "content" && <>
                    <Field label="Title" value={selected.title} onChange={(v) => updateSelected("title", v)} />
                    {selected.type === "banner" && <><Field label="Sub Text" value={selected.data.subtitle} onChange={(v) => updateSelected("subtitle", v)} /><Field label="Button Text" value={selected.data.button} onChange={(v) => updateSelected("button", v)} /></>}
                    {selected.type === "category" && <Field label="Categories (use | between items)" value={selected.data.items} onChange={(v) => updateSelected("items", v)} />}
                    {selected.type === "product" && <><Field label="Products (use | between items)" value={selected.data.items} onChange={(v) => updateSelected("items", v)} /><Field label="Prices" value={selected.data.prices} onChange={(v) => updateSelected("prices", v)} /></>}
                    {selected.type === "image" && <Field label="Image URL" value={selected.data.url} onChange={(v) => updateSelected("url", v)} />}
                    {selected.type === "button" && <Field label="Button Label" value={selected.data.label} onChange={(v) => updateSelected("label", v)} />}
                    {selected.type === "search" && <Field label="Heading" value={selected.data.title} onChange={(v) => updateSelected("title", v)} />}
                    {selected.type === "whatsapp" && <Field label="Share Text" value={selected.data.label} onChange={(v) => updateSelected("label", v)} />}
                    {selected.type === "video" && <Field label="Video Title" value={selected.data.title} onChange={(v) => updateSelected("title", v)} />}
                  </>}
                  {tab === "style" && <><h4>Design Options</h4><Range label="Border Radius" min={0} max={30} /><Range label="Spacing" min={0} max={40} /><label className="field">Background<select><option>Gradient</option><option>Solid</option><option>Transparent</option></select></label><div className="two-col"><label className="field">Height<input type="number" defaultValue="220" /></label><label className="field">Padding<input type="number" defaultValue="16" /></label></div></>}
                  {tab === "action" && <><h4>Action on Tap</h4><label className="field">Action<select><option>Open Products</option><option>Open Category</option><option>Open Product</option><option>Open WhatsApp</option><option>Open External Link</option></select></label><Field label="Link / Target" value="/products" onChange={() => {}} /></>}
                  {tab === "visibility" && <><h4>Visibility Rules</h4><label className="toggle-row"><input type="checkbox" defaultChecked /> Visible on Home</label><label className="toggle-row"><input type="checkbox" defaultChecked /> Visible for Customers</label><label className="toggle-row"><input type="checkbox" /> Show only for logged-in customers</label></>}
                </div>
              )}
            </section>
          </section>

          <section className="pagebar">
            <b>Page Management</b>
            {["Home", "Category", "Photo Search", "Share Product"].map((page, i) => <button key={page} className={activePage === page ? "page active" : "page"} onClick={() => setActivePage(page)}>{page} <small>Page {i + 1}</small></button>)}
            <button className="page add" onClick={() => setActivePage("New Page")}>＋ Add Page</button>
          </section>
        </main>
      </div>

      {published && <div className="toast" onClick={() => setPublished(false)}>✓ {client} app draft published successfully</div>}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field">{label}<input value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Range({ label, min, max }: { label: string; min: number; max: number }) {
  return <label className="field">{label}<input type="range" min={min} max={max} defaultValue={Math.round((min + max) / 2)} /></label>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
