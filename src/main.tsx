import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type ComponentType = "banner" | "category" | "product" | "text" | "image" | "button";

type BuilderComponent = {
  id: string;
  type: ComponentType;
  title: string;
  data: Record<string, string>;
};

const palette: { type: ComponentType; label: string; icon: string }[] = [
  { type: "banner", label: "Banner / Slider", icon: "▧" },
  { type: "category", label: "Category Box", icon: "▦" },
  { type: "product", label: "Product Card", icon: "◇" },
  { type: "text", label: "Text / Heading", icon: "T" },
  { type: "image", label: "Image", icon: "▧" },
  { type: "button", label: "Button", icon: "➜" },
];

const seed: BuilderComponent[] = [
  { id: "c1", type: "category", title: "Categories", data: { items: "Men Fashion|Women Fashion|Home & Living|More" } },
  { id: "c2", type: "banner", title: "New Arrival", data: { subtitle: "Latest Collection Now in Stock", button: "Shop Now" } },
  { id: "c3", type: "text", title: "New Arrival", data: { align: "left" } },
  { id: "c4", type: "product", title: "Featured Products", data: { items: "Smart Watch|Sports Shoes", prices: "₹1,999|₹2,499" } },
];

function App() {
  const [client, setClient] = useState("ABC Traders");
  const [components, setComponents] = useState(seed);
  const [selectedId, setSelectedId] = useState("c2");
  const [tab, setTab] = useState<"content" | "style" | "action">("content");
  const [published, setPublished] = useState(false);

  const selected = useMemo(
    () => components.find((item) => item.id === selectedId) ?? components[0],
    [components, selectedId]
  );

  function addComponent(type: ComponentType) {
    const meta = palette.find((item) => item.type === type);
    if (!meta) return;
    const id = `c-${Date.now()}`;
    const defaults: Record<ComponentType, Record<string, string>> = {
      banner: { subtitle: "Fresh collection for your customers", button: "Shop Now" },
      category: { items: "Category 1|Category 2|Category 3|More" },
      product: { items: "Product One|Product Two", prices: "₹999|₹1,499" },
      text: { align: "left" },
      image: { url: "" },
      button: { label: "View Products" },
    };
    const next = { id, type, title: meta.label, data: defaults[type] };
    setComponents((items) => [...items, next]);
    setSelectedId(id);
  }

  function updateSelected(field: string, value: string) {
    if (!selected) return;
    setComponents((items) =>
      items.map((item) =>
        item.id === selected.id
          ? { ...item, title: field === "title" ? value : item.title, data: field === "title" ? item.data : { ...item.data, [field]: value } }
          : item
      )
    );
  }

  function removeSelected() {
    if (!selected) return;
    setComponents((items) => items.filter((item) => item.id !== selected.id));
    const remaining = components.filter((item) => item.id !== selected.id);
    setSelectedId(remaining[0]?.id ?? "");
  }

  function moveSelected(direction: -1 | 1) {
    const index = components.findIndex((item) => item.id === selectedId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= components.length) return;
    const copy = [...components];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setComponents(copy);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">⌂</span><strong>YASH B2B APP Builder</strong><span className="saas">SaaS</span></div>
        <nav className="topnav">
          <span>⌂ Dashboard</span><span>▣ Clients</span><span className="active">♧ App Builder</span><span>▤ Subscriptions</span><span>▥ Reports</span>
        </nav>
        <div className="profile">◉ Yash Mathur⌄</div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          {["Overview", "Clients", "App Builder", "Templates", "Customization", "Settings", "Billing", "Users"].map((item) => (
            <div key={item} className={item === "App Builder" ? "side-item selected" : "side-item"}>{item}</div>
          ))}
          <div className="saas-card">
            <b>♛ SaaS Model</b>
            <div>✓ Multi Client</div><div>✓ Custom App URL</div><div>✓ Full Customization</div><div>✓ Drag & Drop Builder</div>
          </div>
        </aside>

        <main className="main">
          <div className="clientbar">
            <label>Client<select value={client} onChange={(e) => setClient(e.target.value)}><option>ABC Traders</option><option>Global Fashion</option><option>Shree Enterprises</option></select></label>
            <div className="urlbox"><span>App URL (Client Link)</span><b>https://{client.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.b2bapp.in</b><button>↗</button></div>
            <span className="status">● Active</span><button className="ghost">Preview</button><button className="publish" onClick={() => setPublished(true)}>Publish</button>
          </div>

          <div className="builder-grid">
            <section className="panel library">
              <div className="tabs"><button className="tab active">Build</button><button className="tab">Theme</button><button className="tab">Settings</button></div>
              <h3>✣ Drag & Drop Components</h3>
              <div className="palette">
                {palette.map((item) => (
                  <button key={item.type} className="palette-item" draggable onDragEnd={() => addComponent(item.type)} onClick={() => addComponent(item.type)}>
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="preview-area">
              <div className="phone">
                <div className="phone-top"><span>☰</span><b>{client}</b><span>⌕ 🛒</span></div>
                <div className="phone-body">
                  {components.map((item) => (
                    <div key={item.id} className={item.id === selectedId ? "canvas-item selected-canvas" : "canvas-item"} onClick={() => setSelectedId(item.id)}>
                      {item.type === "category" && <div className="categories">{item.data.items.split("|").map((x) => <div className="cat" key={x}><div className="cat-icon">◈</div><b>{x}</b></div>)}</div>}
                      {item.type === "banner" && <div className="banner"><div><h2>{item.title}</h2><p>{item.data.subtitle}</p><button>{item.data.button}</button></div><div className="banner-art">◯</div></div>}
                      {item.type === "text" && <h2 className="mobile-heading">{item.title}</h2>}
                      {item.type === "product" && <div><div className="section-head"><b>{item.title}</b><span>View All →</span></div><div className="products">{item.data.items.split("|").map((x, i) => <div className="product" key={x}><div className="product-img">◇</div><b>{item.data.prices.split("|")[i] ?? "₹999"}</b><span>{x}</span></div>)}</div></div>}
                      {item.type === "image" && <div className="image-block">{item.data.url ? <img src={item.data.url} alt="" /> : "Image placeholder"}</div>}
                      {item.type === "button" && <button className="wide-button">{item.data.label}</button>}
                      {item.id === selectedId && <div className="selection-actions"><button onClick={(e) => { e.stopPropagation(); moveSelected(-1); }}>↑</button><button onClick={(e) => { e.stopPropagation(); moveSelected(1); }}>↓</button><button className="danger" onClick={(e) => { e.stopPropagation(); removeSelected(); }}>×</button></div>}
                    </div>
                  ))}
                  <button className="add-section" onClick={() => addComponent("text")}>＋ Add Section</button>
                </div>
              </div>
            </section>

            <section className="panel inspector">
              <div className="tabs"><button className={tab === "content" ? "tab active" : "tab"} onClick={() => setTab("content")}>Content</button><button className={tab === "style" ? "tab active" : "tab"} onClick={() => setTab("style")}>Style</button><button className={tab === "action" ? "tab active" : "tab"} onClick={() => setTab("action")}>Action</button><button className="tab">Visibility</button></div>
              {!selected ? <div className="empty">Select a component to edit.</div> : tab === "content" ? (
                <div className="inspector-content">
                  <h3>{selected.type === "banner" ? "Banner / Slider Settings" : `${selected.title} Settings`}</h3>
                  <label>Title<input value={selected.title} onChange={(e) => updateSelected("title", e.target.value)} /></label>
                  {selected.type === "banner" && <><label>Sub Text<input value={selected.data.subtitle} onChange={(e) => updateSelected("subtitle", e.target.value)} /></label><label>Button Text<input value={selected.data.button} onChange={(e) => updateSelected("button", e.target.value)} /></label></>}
                  {selected.type === "category" && <label>Categories<input value={selected.data.items} onChange={(e) => updateSelected("items", e.target.value)} /></label>}
                  {selected.type === "product" && <><label>Products<input value={selected.data.items} onChange={(e) => updateSelected("items", e.target.value)} /></label><label>Prices<input value={selected.data.prices} onChange={(e) => updateSelected("prices", e.target.value)} /></label></>}
                  {selected.type === "image" && <label>Image URL<input value={selected.data.url} onChange={(e) => updateSelected("url", e.target.value)} /></label>}
                  {selected.type === "button" && <label>Button Label<input value={selected.data.label} onChange={(e) => updateSelected("label", e.target.value)} /></label>}
                </div>
              ) : tab === "style" ? (
                <div className="inspector-content"><h3>Design Options</h3><label>Border Radius<input type="range" min="0" max="30" /></label><label>Spacing<input type="range" min="0" max="40" /></label><label>Background<select><option>Gradient</option><option>Solid</option><option>Transparent</option></select></label></div>
              ) : (
                <div className="inspector-content"><h3>Action</h3><label>On Tap<select><option>Open Products</option><option>Open Category</option><option>Open Product</option><option>Open WhatsApp</option></select></label><label>Link<input placeholder="/products" /></label></div>
              )}
            </section>
          </div>

          <div className="pagebar"><b>Page Management</b>{["Home (Page 1)", "Category (Page 2)", "Photo Search (Page 3)", "Share Product (Page 4)"].map((x, i) => <button key={x} className={i === 0 ? "page active" : "page"}>{x}</button>)}<button className="page add">＋ Add Page</button></div>
        </main>
      </div>
      {published && <div className="toast" onClick={() => setPublished(false)}>✓ Draft published successfully</div>}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);