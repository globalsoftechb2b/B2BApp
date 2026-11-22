import { StrictMode, useEffect, useMemo, useState } from "react";
import type { DragEvent, ReactNode, Dispatch, SetStateAction } from "react";
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
type AppView = "overview" | "clients" | "builder" | "shop" | "products" | "customers" | "store" | "orders";
type Client = { id:string; name:string; slug:string; limit:number; status:"Active"|"Inactive"; builder:boolean; products:number; customers:number; ownerEmail?:string; ownerPassword?:string };
type Product = { id:string; name:string; sku:string; category:string; price:string; stock:number; status:"Active"|"Draft"; clientId?:string };
type Customer={id:string;name:string;phone:string;email?:string;address?:string;orders:number;status:"Active"|"Blocked";clientId?:string};
type OrderLine={productId:string;name:string;sku:string;qty:number;unitPrice:number;lineTotal:number};
type Order={id:string;customer:string;phone:string;email?:string;address?:string;customerId?:string;clientId?:string;items:number;lines?:OrderLine[];amount:number;status:"Pending"|"Confirmed"|"Packed"|"Shipped"|"Delivered"|"Cancelled";createdAt:string};

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
  { id: "products-1", type: "product", title: "Featured Products", data: { source: "catalog", items: "Smart Watch|Sports Shoes", prices: "₹1,999|₹2,499" } },
];

const defaults: Record<ComponentType, Record<string, string>> = {
  banner: { subtitle: "Fresh collection for your customers", button: "Shop Now" },
  category: { items: "Category 1|Category 2|Category 3|More" },
  product: { source: "catalog", items: "Product One|Product Two", prices: "₹999|₹1,499" },
  text: { align: "left" },
  image: { url: "" },
  button: { label: "View Products" },
  search: { title: "Find Products by Photo" },
  whatsapp: { label: "Share on WhatsApp" },
  video: { title: "Featured Video" },
};

const icon = (name: string) => <span className="ico">{name}</span>;

const initialClients: Client[] = [{id:"YA-101",name:"ABC Traders",slug:"abc-traders",limit:1000,status:"Active",builder:true,products:124,customers:438,ownerEmail:"owner@abc-traders.b2bapp.in",ownerPassword:"ChangeMe@123"},{id:"YA-102",name:"Global Fashion",slug:"global-fashion",limit:500,status:"Active",builder:true,products:86,customers:217,ownerEmail:"owner@global-fashion.b2bapp.in",ownerPassword:"ChangeMe@123"},{id:"YA-103",name:"Shree Enterprises",slug:"shree-enterprises",limit:250,status:"Inactive",builder:false,products:42,customers:61,ownerEmail:"owner@shree-enterprises.b2bapp.in",ownerPassword:"ChangeMe@123"}];
const initialProducts: Product[] = [{id:"P-1001",name:"Smart Watch",sku:"SW-001",category:"Electronics",price:"₹1,999",stock:84,status:"Active",clientId:"YA-101"},{id:"P-1002",name:"Sports Shoes",sku:"SS-204",category:"Footwear",price:"₹2,499",stock:42,status:"Active",clientId:"YA-101"},{id:"P-1003",name:"Cotton Shirt",sku:"CS-310",category:"Fashion",price:"₹899",stock:126,status:"Active",clientId:"YA-101"},{id:"P-1004",name:"Travel Bag",sku:"TB-118",category:"Bags",price:"₹1,299",stock:0,status:"Draft",clientId:"YA-101"}];

const initialCustomers:Customer[]=[{id:"C-1001",name:"Rahul Traders",phone:"+91 98765 43210",email:"rahul@example.com",address:"Mumbai, Maharashtra",orders:18,status:"Active",clientId:"YA-101"},{id:"C-1002",name:"Sharma Stores",phone:"+91 98200 11223",email:"sharma@example.com",address:"Thane, Maharashtra",orders:11,status:"Active",clientId:"YA-101"},{id:"C-1003",name:"M K Enterprises",phone:"+91 97690 44556",email:"mk@example.com",address:"Kalyan, Maharashtra",orders:7,status:"Active",clientId:"YA-101"}];
const initialOrders:Order[]=[{id:"ORD-1001",customer:"Rahul Traders",phone:"+91 98765 43210",customerId:"C-1001",clientId:"YA-101",items:4,amount:12460,status:"Pending",createdAt:"Today, 10:42 AM"},{id:"ORD-1002",customer:"Sharma Stores",phone:"+91 98200 11223",customerId:"C-1002",clientId:"YA-101",items:7,amount:28750,status:"Confirmed",createdAt:"Today, 09:18 AM"},{id:"ORD-0999",customer:"M K Enterprises",phone:"+91 97690 44556",customerId:"C-1003",clientId:"YA-101",items:3,amount:8490,status:"Packed",createdAt:"Yesterday, 05:31 PM"}];
function loadState<T>(key:string,fallback:T):T{
  try{const raw=localStorage.getItem(key);if(!raw)return fallback;const parsed=JSON.parse(raw);return parsed as T}catch{return fallback}
}
function saveState<T>(key:string,value:T){
  try{localStorage.setItem(key,JSON.stringify(value))}catch{}
}

function RangeField({ label, value, min, max, onChange }: { label:string; value:string; min:number; max:number; onChange:(value:string)=>void }) {
  return <label className="field">{label}<input type="range" min={min} max={max} value={Number(value)} onChange={(e)=>onChange(e.target.value)} /><small>{value}px</small></label>;
}

function BuilderPreviewComponent({ item, products, client, onAction }: { item: BuilderComponent; products: Product[]; client: Client; onAction?: (item:BuilderComponent)=>void }) {
  const radius = Number(item.data.radius || 16);
  const spacing = Number(item.data.spacing || 16);
  const style = {
    borderRadius: radius,
    marginBottom: spacing,
    background: item.data.background === "Solid" ? "#fff" : undefined,
    padding: item.data.padding ? Number(item.data.padding) : undefined,
  };
  const catalogProducts = products.filter((p) => p.status === "Active");
  const manualProducts = item.data.items?.split("|").filter(Boolean).map((name, i) => ({
    id: `manual-${i}`,
    name,
    sku: "",
    category: "Catalog",
    price: item.data.prices?.split("|")[i] || "₹0",
    stock: 99,
    status: "Active" as const,
  })) || [];
  const visibleProducts = item.data.source === "catalog" ? catalogProducts : manualProducts;

  const actionProps = onAction ? { onClick: () => onAction(item), role: "button" as const } : {};
  if (item.type === "banner") return <div className="banner" style={style} {...actionProps}><div><h2>{item.title}</h2><p>{item.data.subtitle}</p><button>{item.data.button} →</button></div><div className="banner-art">◯</div></div>;
  if (item.type === "category") return <div className="categories" style={style} {...actionProps}>{item.data.items.split("|").filter(Boolean).map(x=><div className="cat" key={x}><div className="cat-icon">◇</div><b>{x}</b></div>)}</div>;
  if (item.type === "product") return <div className="product-grid" style={style} {...actionProps}>{visibleProducts.map((p)=><div className="product-card" key={p.id}><div className="product-image">◇</div><b>{p.name}</b><span>{p.price}</span><button disabled={p.stock===0}>Add</button></div>)}{visibleProducts.length===0&&<div className="empty">No active catalog products.</div>}</div>;
  if (item.type === "text") return <h2 className="mobile-heading" {...actionProps} style={{...style,textAlign:(item.data.align as "left"|"center"|"right") || "left"}}>{item.title}</h2>;
  if (item.type === "image") return <div className="image-block" style={style} {...actionProps}>{item.data.url ? <img src={item.data.url} alt={item.title}/> : <div className="image-placeholder">Image</div>}</div>;  if (item.type === "button") return <button className="mobile-cta" style={style} {...actionProps}>{item.data.label}</button>;
  if (item.type === "search") return <BuilderPhotoSearch title={item.data.title} products={catalogProducts} style={style} />;  if (item.type === "whatsapp") return <BuilderProductShare title={item.data.label} products={catalogProducts} client={client} style={style} />;
  return <div className="video-block" style={style}>▶ <span>{item.data.title}</span></div>;
}
function App() {
  const [client, setClient] = useState("ABC Traders");
  const [view, setView] = useState<AppView>("builder");
  const [shopOwnerMode, setShopOwnerMode] = useState(false);
  const [ownerSession, setOwnerSession] = useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerError, setOwnerError] = useState("");
  const [clients, setClients] = useState<Client[]>(() => loadState<Client[]>("b2bapp:clients", initialClients).map((c) => ({ ...c, ownerEmail: c.ownerEmail || `owner@${c.slug}.b2bapp.in`, ownerPassword: c.ownerPassword || "ChangeMe@123" })));
  const [products, setProducts] = useState<Product[]>(() => loadState("b2bapp:products", initialProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => loadState("b2bapp:customers", initialCustomers));
  const [orders, setOrders] = useState<Order[]>(() => loadState("b2bapp:orders", initialOrders));
  useEffect(() => saveState("b2bapp:clients", clients), [clients]);
  useEffect(() => saveState("b2bapp:products", products), [products]);
  useEffect(() => saveState("b2bapp:customers", customers), [customers]);
  useEffect(() => saveState("b2bapp:orders", orders), [orders]);
  useEffect(() => { fetch("/api/auth/me", { credentials: "include" }).then(async (response) => { if (!response.ok) return null; return response.json(); }).then((data) => { if (data?.clientId) { setOwnerSession(data.clientId); setShopOwnerMode(true); setView("shop"); } }).catch(() => {}); }, []);
  useEffect(() => {\n    if (!ownerSession) return;\n    fetch("/api/owner/data", { credentials: "include" })\n      .then(async (response) => response.ok ? response.json() : null)\n      .then((data) => {\n        if (!data || data.clientId !== ownerSession) return;\n        setProducts(data.products ?? []);\n        setCustomers(data.customers ?? []);\n        setOrders(data.orders ?? []);\n      })\n      .catch(() => {});\n  }, [ownerSession]);\n  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientLimit, setNewClientLimit] = useState("1000");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerPassword, setNewOwnerPassword] = useState("ChangeMe@123");
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductStock, setNewProductStock] = useState("0");
  const [activePage, setActivePage] = useState("Home");
  const [pagesByClient, setPagesByClient] = useState<Record<string, Record<string, BuilderComponent[]>>>(() => {
    const saved = loadState<Record<string, Record<string, BuilderComponent[]>>>("b2bapp:pages", {});
    if (Object.keys(saved).length) return saved;
    const legacy = loadState<Record<string, BuilderComponent[]>>("b2bapp:builders", {});
    const ids = Object.keys(legacy);
    if (!ids.length) return {};
    return Object.fromEntries(ids.map((id) => [id, {
      Home: legacy[id]?.length ? legacy[id] : initialComponents,
      Category: legacy[id]?.filter((x) => x.type === "category" || x.type === "product") ?? [],
      "Photo Search": [],
      "Share Product": legacy[id]?.filter((x) => x.type === "product" || x.type === "whatsapp") ?? [],
    }]));
  });
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState<Tab>("content");
  const [published, setPublished] = useState(false);
  const [showBuilderPreview, setShowBuilderPreview] = useState(false);
  const [previewLoggedIn, setPreviewLoggedIn] = useState(false);
  const [showPageForm, setShowPageForm] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => saveState("b2bapp:pages", pagesByClient), [pagesByClient]);

  const selected = useMemo(
    () => components.find((item) => item.id === selectedId) ?? null,
    [components, selectedId]
  );

  const filteredPalette = palette.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const slug = client.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const activeClient = clients.find((item) => item.name === client) ?? clients[0];
  const ownerClient = ownerSession ? clients.find((item) => item.id === ownerSession) : null;
  useEffect(() => {\n    if (shopOwnerMode && ownerSession) {\n      const owner = clients.find((item) => item.id === ownerSession);\n      if (owner && client !== owner.name) setClient(owner.name);\n    }\n  }, [shopOwnerMode, ownerSession, clients, client]);\n  useEffect(() => {
    if (!activeClient) return;
    const savedPages = pagesByClient[activeClient.id];
    const legacy = loadState<Record<string, BuilderComponent[]>>("b2bapp:builders", {})[activeClient.id];
    const home = savedPages?.Home ?? (legacy?.length ? legacy : initialComponents);
    setActivePage("Home");
    setComponents(home);
    setSelectedId(home[0]?.id ?? "");
    setPublished(Boolean(loadState<Record<string, boolean>>("b2bapp:published", {})[activeClient.id]));
  }, [activeClient?.id]);
  const filteredClients = clients.filter((item) => item.name.toLowerCase().includes(clientSearch.toLowerCase()) || item.id.toLowerCase().includes(clientSearch.toLowerCase()));
  const effectiveClientId = shopOwnerMode && ownerSession ? ownerSession : activeClient?.id;
  const effectiveClient = clients.find((item) => item.id === effectiveClientId) ?? activeClient;
  const clientProducts = products.filter((item) => item.clientId === effectiveClientId);
  const clientCustomers = customers.filter((item) => item.clientId === effectiveClientId);
  const clientOrders = orders.filter((item) => item.clientId === effectiveClientId);
  const filteredProducts = clientProducts.filter((item) => item.name.toLowerCase().includes(productSearch.toLowerCase()) || item.sku.toLowerCase().includes(productSearch.toLowerCase()));

  function publishCurrentApp() {
    if (!activeClient) return;
    setPagesByClient((current) => ({
      ...current,
      [activeClient.id]: { ...(current[activeClient.id] ?? {}), [activePage]: components },
    }));
    const publishedState = loadState<Record<string, boolean>>("b2bapp:published", {});
    saveState("b2bapp:published", { ...publishedState, [activeClient.id]: true });
    setPublished(true);
  }

  function addComponent(type: ComponentType) {
    const meta = palette.find((item) => item.type === type);
    if (!meta) return;
    const id = `${type}-${Date.now()}`;
    const next: BuilderComponent = {
      id,
      type,
      title: meta.label,
      data: { ...defaults[type] },
    };    setComponents((items) => {
      const updated = [...items, next];
      if (activeClient) {
        setPagesByClient((current) => ({
          ...current,
          [activeClient.id]: { ...(current[activeClient.id] ?? {}), [activePage]: updated },
        }));
      }
      return updated;
    });
    setSelectedId(id);
  }

  function updateSelected(field: string, value: string) {
    if (!selected || !activeClient) return;
    const next = components.map((item) =>
      item.id === selected.id
        ? field === "title"
          ? { ...item, title: value }
          : { ...item, data: { ...item.data, [field]: value } }
        : item
    );
    setComponents(next);
    setPagesByClient((current) => ({ ...current, [activeClient.id]: { ...(current[activeClient.id] ?? {}), [activePage]: next } }));
  }

  function moveSelected(direction: -1 | 1) {
    const index = components.findIndex((item) => item.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= components.length) return;
    const copy = [...components];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setComponents(copy);
    if (activeClient) setPagesByClient((current) => ({ ...current, [activeClient.id]: { ...(current[activeClient.id] ?? {}), [activePage]: copy } }));
  }

  function removeSelected() {
    if (!selected) return;
    const next = components.filter((item) => item.id !== selected.id);
    setComponents(next);
    if (activeClient) setPagesByClient((current) => ({ ...current, [activeClient.id]: { ...(current[activeClient.id] ?? {}), [activePage]: next } }));
    setSelectedId(next[0]?.id ?? "");
  }

  function switchPage(page: string) {
    if (!activeClient || page === activePage) return;
    setPagesByClient((current) => ({
      ...current,
      [activeClient.id]: { ...(current[activeClient.id] ?? {}), [activePage]: components },
    }));
    const next = pagesByClient[activeClient.id]?.[page] ?? (
      page === "Category"
        ? components.filter((x) => x.type === "category" || x.type === "product")
        : page === "Photo Search"
          ? [{ id: `search-${Date.now()}`, type: "search" as ComponentType, title: "Find Products by Photo", data: { title: "Find Products by Photo" } }]
          : page === "Share Product"
            ? [
                { id: `share-product-${Date.now()}`, type: "product" as ComponentType, title: "Featured Products", data: { source: "catalog", items: "", prices: "" } },
                { id: `share-whatsapp-${Date.now() + 1}`, type: "whatsapp" as ComponentType, title: "Share Product", data: { label: "Share on WhatsApp" } },
              ]
            : []);
    setActivePage(page);
    setComponents(next);
    setSelectedId(next[0]?.id ?? "");
    setTab("content");
  }

  function createBuilderPage() {
    const name = newPageName.trim();
    if (!name || !activeClient) return;
    const existing = Object.keys(pagesByClient[activeClient.id] ?? {});
    if (existing.some((x) => x.toLowerCase() === name.toLowerCase())) return;
    setPagesByClient((current) => ({
      ...current,
      [activeClient.id]: { ...(current[activeClient.id] ?? {}), [name]: [] },
    }));
    setActivePage(name);
    setComponents([]);
    setSelectedId("");
    setShowPageForm(false);
    setNewPageName("");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const type = event.dataTransfer.getData("component-type") as ComponentType;
    if (type) addComponent(type);
  }

  function createClient() { const name=newClientName.trim(); const email=newOwnerEmail.trim().toLowerCase(); const password=newOwnerPassword; if(!name || !email || password.length<8) return; const newSlug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); if(clients.some(x=>x.slug===newSlug || x.ownerEmail?.toLowerCase()===email)) return; const nextNumber=clients.reduce((max,c)=>Math.max(max,Number(c.id.replace("YA-",""))||100),100)+1; const item:Client={id:`YA-${nextNumber}`,name,slug:newSlug,limit:Math.max(1,Number(newClientLimit)||1000),status:"Active",builder:true,products:0,customers:0,ownerEmail:email,ownerPassword:password}; setClients(x=>[...x,item]); setClient(name); setShowClientForm(false); setNewClientName(""); setNewOwnerEmail(""); setNewOwnerPassword("ChangeMe@123"); setView("shop"); }
  async function saveProduct() {
    const name=newProductName.trim();
    if(!name || !activeClient) return;
    const stock=Number(newProductStock);
    if(!Number.isFinite(stock) || stock<0) return;
    const payload={name,price:newProductPrice.trim()||"₹0",stock};
    if(ownerSession){
      try{
        if(editingProduct){
          const response=await fetch(`/api/owner/products/${editingProduct.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(payload)});
          if(!response.ok) throw new Error("Product update failed");
          const updated=await response.json();
          setProducts(x=>x.map(p=>p.id===updated.id?updated:p));
        }else{
          const response=await fetch("/api/owner/products",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(payload)});
          if(!response.ok) throw new Error("Product create failed");
          const created=await response.json();
          setProducts(x=>[created,...x]);
        }
      }catch{
        return;
      }
    }else if(editingProduct){
      setProducts(x=>x.map(p=>p.id===editingProduct.id?{...p,name,price:payload.price,stock}:p));
    }else{
      setProducts(x=>[...x,{id:`P-${Date.now()}`,name,sku:`SKU-${Date.now().toString().slice(-6)}`,category:"General",price:payload.price,stock,status:"Active",clientId:activeClient.id}]);
    }
    setNewProductName(""); setNewProductPrice(""); setNewProductStock("0"); setEditingProduct(null); setShowProductForm(false);
  }

  function openProductEdit(product:Product){
    setEditingProduct(product); setNewProductName(product.name); setNewProductPrice(product.price); setNewProductStock(String(product.stock)); setShowProductForm(true);
  }

  async function deleteProduct(id:string){
    if(!window.confirm("Delete this product?")) return;
    if(ownerSession){
      try{
        const response=await fetch(`/api/owner/products/${id}`,{method:"DELETE",credentials:"include"});
        if(!response.ok) throw new Error("Delete failed");
      }catch{return;}
    }
    setProducts(x=>x.filter(p=>p.id!==id));
  }

  function createProduct() { saveProduct(); }
  function toggleClientStatus(id:string) { setClients(x=>x.map(c=>c.id===id?{...c,status:c.status==="Active"?"Inactive":"Active"}:c)); }

  function openOwnerWorkspace(viewName: AppView) {
    if (!ownerSession) return;
    const owner = clients.find((item) => item.id === ownerSession);
    if (!owner || owner.status !== "Active") {
      setShopOwnerMode(false);
      setOwnerSession(null);
      setView("shop");
      return;
    }
    setClient(owner.name);
    setView(viewName);
  }

  function openShopOwner() {
    setShopOwnerMode(true);
    setOwnerSession(null);
    setOwnerEmail("");
    setOwnerPassword("");
    setOwnerError("");
    setView("shop");
  }

  async function loginShopOwner() {
    if (!activeClient) return;
    const email = ownerEmail.trim().toLowerCase();
    if (!email || !ownerPassword) {
      setOwnerError("Email and password are required.");
      return;
    }
    const account = clients.find((item) => item.id === activeClient.id);
    if (!account || account.status !== "Active") {
      setOwnerError("This shop is inactive. Contact the Super Admin.");
      return;
    }
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password: ownerPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.clientId !== account.id) {
        setOwnerError(response.status === 401 ? "Invalid shop owner email or password." : "Owner authentication service is unavailable.");
        return;
      }
      setOwnerSession(data.clientId);
      setOwnerError("");
      setOwnerPassword("");
    } catch {
      setOwnerError("Owner authentication service is unavailable.");
    }
  }

  function handleDragStart(event: DragEvent<HTMLButtonElement>, type: ComponentType) {
    event.dataTransfer.setData("component-type", type);
  }

  return (
    <div className="app-shell">
      <header className={shopOwnerMode ? "topbar owner-topbar" : "topbar"}>
        <div className="brand">
          <div className="brand-logo">{shopOwnerMode ? (activeClient?.name.slice(0,1) || "S") : "Y"}</div>
          <div><strong>{shopOwnerMode ? (activeClient?.name || "Shop Owner") : "YASH B2B APP Builder"}</strong><span className="saas-pill">{shopOwnerMode ? "SHOP APP" : "SaaS"}</span></div>
        </div>
        {!shopOwnerMode ? <nav className="topnav">
          <span>⌂ Dashboard</span>
          <span>♙ Clients</span>
          <span className="active">✣ App Builder</span>
          <span>▤ Subscriptions</span>
          <span>▥ Reports</span>
        </nav> : <div className="owner-top-title"><span>Shop Owner App</span><small>Manage your B2B business</small></div>}
        <div className="profile"><div className="avatar">{shopOwnerMode ? "SO" : "YM"}</div><b>{shopOwnerMode ? "Shop Owner" : "Yash Mathur"}</b><button className="owner-exit" onClick={() => { fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {}); setShopOwnerMode(false); setOwnerSession(null); setOwnerEmail(""); setOwnerPassword(""); setOwnerError(""); setView("shop"); }}>{shopOwnerMode ? "← Admin" : "⌄"}</button></div>
      </header>

      <div className={shopOwnerMode ? "workspace owner-workspace" : "workspace"}>
        {!shopOwnerMode ? <aside className="sidebar">
          <div className="side-section">
            {([["overview","Overview","⌂"],["clients","Clients","♙"],["builder","App Builder","✣"],["shop","Shop Dashboard","▣"],["products","Products","◇"],["customers","Customers","♧"],["orders","Orders","▤"],["store","Customer App","◉"],["templates","Templates","◫"],["customization","Customization","✦"],["settings","Settings","⚙"],["billing","Billing","▤"],["users","Users","♙"]] as const).map(([key,label,ico]) => <button key={key} className={view===key?"side-item selected":"side-item"} onClick={()=>openOwnerWorkspace(key as AppView)}><span>{ico}</span>{label}</button>)}
          </div>
          <div className="saas-card">
            <div className="crown">♛</div><b>SaaS Model</b>
            <div>✓ Multi Client</div><div>✓ Custom App URL</div><div>✓ Full Customization</div><div>✓ Drag & Drop Builder</div>
          </div>
        </aside> : null}

        <main className="main">
          {view==="overview" && <Overview clients={clients} setView={setView}/>} 
          {view==="clients" && <ClientsView clients={filteredClients} search={clientSearch} setSearch={setClientSearch} onAdd={()=>setShowClientForm(true)} onToggle={toggleClientStatus} onOpen={(name)=>{setClient(name);setView("shop")}}/>}
          {view==="shop" && <ShopDashboard client={activeClient} products={clientProducts} orders={clientOrders} setView={setView} onAddProduct={()=>setShowProductForm(true)} onOpenOwner={openShopOwner}/>}
          {view==="products" && <ProductsView products={filteredProducts} search={productSearch} setSearch={setProductSearch} onAdd={()=>{setEditingProduct(null);setNewProductName("");setNewProductPrice("");setNewProductStock("0");setShowProductForm(true)}} onEdit={openProductEdit} onDelete={deleteProduct}/>} 
          {view==="customers" && <CustomersView client={activeClient} customers={clientCustomers} orders={clientOrders} setCustomers={setCustomers} ownerSession={ownerSession}/>}
          {view==="orders" && <OrdersView client={activeClient} orders={clientOrders} setOrders={setOrders} setProducts={setProducts}/>}
          {view==="store" && <CustomerStorefront client={activeClient} products={clientProducts} customers={clientCustomers} setCustomers={setCustomers} setClients={setClients} setOrders={setOrders}/>} 
          {view==="builder" && <>
          <section className="clientbar">
            <label className="client-select">Client
              <select value={activeClient?.name ?? ""} onChange={(e) => setClient(e.target.value)}>
                {clients.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <div className="urlbox">
              <span>App URL (Client Link)</span>
              <b>https://{slug || "shop"}.b2bapp.in</b>
              <button title="Copy link">⧉</button>
              <button title="Open">↗</button>
            </div>
            <span className="status">● Active</span>
            <button className="ghost" onClick={() => setShowBuilderPreview(true)}>◉ Preview</button>
            <button className="publish" onClick={publishCurrentApp}>⇧ Publish</button>
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
                      {item.type === "text" && <h2 className="mobile-heading">{item.title}</h2>}                      {item.type === "product" && <div><div className="section-head"><b>{item.title}</b><span>View All →</span></div><div className="products">{item.data.items.split("|").filter(Boolean).map((x, i) => <div className="product" key={x}><div className="product-img">◇</div><b>{item.data.prices.split("|")[i] ?? "₹999"}</b><span>{x}</span></div>)}</div></div>}
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
                    {selected.type === "product" && <><label className="field">Product Source<select value={selected.data.source || "manual"} onChange={(e) => updateSelected("source", e.target.value)}><option value="catalog">Live Shop Catalog</option><option value="manual">Manual Products</option></select></label>{(selected.data.source || "manual") === "manual" && <><Field label="Products (use | between items)" value={selected.data.items || ""} onChange={(v) => updateSelected("items", v)} /><Field label="Prices" value={selected.data.prices || ""} onChange={(v) => updateSelected("prices", v)} /></>}</>}
                    {selected.type === "image" && <Field label="Image URL" value={selected.data.url} onChange={(v) => updateSelected("url", v)} />}
                    {selected.type === "button" && <Field label="Button Label" value={selected.data.label} onChange={(v) => updateSelected("label", v)} />}
                    {selected.type === "search" && <Field label="Heading" value={selected.data.title} onChange={(v) => updateSelected("title", v)} />}
                    {selected.type === "whatsapp" && <Field label="Share Text" value={selected.data.label} onChange={(v) => updateSelected("label", v)} />}
                    {selected.type === "video" && <Field label="Video Title" value={selected.data.title} onChange={(v) => updateSelected("title", v)} />}
                  </>}
                  {tab === "style" && <><h4>Design Options</h4><RangeField label="Border Radius" value={selected.data.radius || "16"} min={0} max={30} onChange={(v) => updateSelected("radius", v)} /><RangeField label="Spacing" value={selected.data.spacing || "16"} min={0} max={40} onChange={(v) => updateSelected("spacing", v)} /><label className="field">Background<select value={selected.data.background || "Gradient"} onChange={(e) => updateSelected("background", e.target.value)}><option>Gradient</option><option>Solid</option><option>Transparent</option></select></label><div className="two-col"><label className="field">Height<input type="number" value={selected.data.height || "220"} onChange={(e) => updateSelected("height", e.target.value)} /></label><label className="field">Padding<input type="number" value={selected.data.padding || "16"} onChange={(e) => updateSelected("padding", e.target.value)} /></label></div></>}
                  {tab === "action" && <><h4>Action on Tap</h4><label className="field">Action<select value={selected.data.action || "Open Products"} onChange={(e) => updateSelected("action", e.target.value)}><option>Open Products</option><option>Open Category</option><option>Open Product</option><option>Open WhatsApp</option><option>Open External Link</option><option>None</option></select></label><Field label="Link / Target" value={selected.data.target || "/products"} onChange={(v) => updateSelected("target", v)} /></>}
                  {tab === "visibility" && <><h4>Visibility Rules</h4><label className="toggle-row"><input type="checkbox" checked={selected.data.homeVisible !== "false"} onChange={(e) => updateSelected("homeVisible", String(e.target.checked))} /> Visible on Home</label><label className="toggle-row"><input type="checkbox" checked={selected.data.customerVisible !== "false"} onChange={(e) => updateSelected("customerVisible", String(e.target.checked))} /> Visible for Customers</label><label className="toggle-row"><input type="checkbox" checked={selected.data.loginOnly === "true"} onChange={(e) => updateSelected("loginOnly", String(e.target.checked))} /> Show only for logged-in customers</label></>}
                </div>
              )}
            </section>
          </section>

          <section className="pagebar">
            <b>Page Management</b>
            {Array.from(new Set(["Home", "Category", "Photo Search", "Share Product", ...Object.keys(pagesByClient[activeClient?.id ?? ""] ?? {})])).map((page, i) => <button key={page} className={activePage === page ? "page active" : "page"} onClick={() => switchPage(page)}>{page} <small>Page {i + 1}</small></button>)}
            <button className="page add" onClick={() => { setNewPageName(""); setShowPageForm(true); }}>＋ Add Page</button>
          </section>
          </>}
        </main>
                {shopOwnerMode && <nav className="owner-bottom-nav">
          {([["shop","Home","⌂"],["orders","Orders","▤"],["products","Products","◇"],["customers","Customers","♧"]] as const).map(([key,label,ico]) =>
            <button key={key} className={view===key?"active":""} onClick={()=>setView(key as AppView)}><span>{ico}</span><small>{label}</small></button>
          )}
          <button className={view==="store"?"active":""} onClick={()=>openOwnerWorkspace("store")}><span>◉</span><small>Customer App</small></button>
        </nav>}
      </div>

      {showPageForm && <Modal title="Add Builder Page" onClose={()=>setShowPageForm(false)}><Field label="Page Name" value={newPageName} onChange={setNewPageName}/><button className="primary-full" onClick={createBuilderPage}>Create Page</button></Modal>}
      {showClientForm && <Modal title="Create New Shop Client" onClose={()=>setShowClientForm(false)}><Field label="Shop Name" value={newClientName} onChange={setNewClientName}/><Field label="Owner Email" value={newOwnerEmail} onChange={setNewOwnerEmail}/><Field label="Owner Password (min 8 characters)" value={newOwnerPassword} onChange={setNewOwnerPassword}/><Field label="Customer Limit" value={newClientLimit} onChange={setNewClientLimit}/><button className="primary-full" onClick={createClient}>Create Client & Open Dashboard</button></Modal>}
      {showProductForm && <Modal title="Add Product" onClose={()=>setShowProductForm(false)}><Field label="Product Name" value={newProductName} onChange={setNewProductName}/><Field label="Selling Price" value={newProductPrice} onChange={setNewProductPrice}/><Field label="Opening Stock" value={newProductStock} onChange={setNewProductStock}/><button className="primary-full" onClick={createProduct}>Save Product</button></Modal>}

      {showBuilderPreview && activeClient && <Modal title={activeClient.name + " — Customer App Preview"} wide onClose={() => setShowBuilderPreview(false)}><div className="builder-preview-modal"><div className="phone preview-large"><div className="phone-top"><span>☰</span><b>{activeClient.name}</b><span>⌕ 🛒</span></div><div className="phone-body">{components.filter(x => x.data.customerVisible !== "false" && (activePage !== "Home" || x.data.homeVisible !== "false") && (x.data.loginOnly !== "true" || previewLoggedIn)).map(item => <BuilderPreviewComponent key={item.id} item={item} products={clientProducts} client={activeClient} onAction={(target) => {
                const action = target.data.action || "None";
                if (action === "Open External Link" && target.data.target) window.open(target.data.target, "_blank");
                else if (action === "Open WhatsApp") window.open("https://wa.me/?text=" + encodeURIComponent(target.title + " — " + window.location.origin + "/?shop=" + activeClient.slug), "_blank");
                else if (action === "Open Products") setView("store");
                else if (action === "Open Category") setView("store");
                else if (action === "Open Product") setView("store");
              }} />)}</div></div><div className="preview-side"><b>Live customer preview</b><p>Published: {published ? "Yes" : "Draft"}</p><p>Page: {activePage}</p><label className="toggle-row"><input type="checkbox" checked={previewLoggedIn} onChange={(e) => setPreviewLoggedIn(e.target.checked)} /> Simulate logged-in customer</label><button className="primary-full" onClick={() => setShowBuilderPreview(false)}>Close Preview</button></div></div></Modal>}

      {published && <div className="toast" onClick={() => setPublished(false)}>✓ {client} app published successfully</div>}
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


function Overview({clients,setView}:{clients:Client[];setView:(v:AppView)=>void}){const active=clients.filter(x=>x.status==="Active").length;const customers=clients.reduce((s,x)=>s+x.customers,0);return <section className="page-view"><div className="page-title"><div><span className="eyebrow">SUPER ADMIN</span><h1>B2B Platform Overview</h1><p>Manage shops, customer limits and the branded B2B app network.</p></div><button className="primary" onClick={()=>setView("clients")}>＋ Create Client</button></div><div className="stats-grid"><Stat label="Total Clients" value={clients.length} note="Shop accounts"/><Stat label="Active Clients" value={active} note="Currently live"/><Stat label="Customers" value={customers.toLocaleString("en-IN")} note="Across all shops"/><Stat label="Builder Access" value={clients.filter(x=>x.builder).length} note="Enabled shops"/></div><div className="dashboard-grid"><div className="card"><div className="card-head"><div><h3>Client Network</h3><p>Each shop has its own B2B URL and customer limit.</p></div><button className="text-button" onClick={()=>setView("clients")}>Manage →</button></div>{clients.map(c=><div className="client-row" key={c.id}><div className="client-mark">{c.name.slice(0,1)}</div><div className="client-info"><b>{c.name}</b><span>{c.id} • {c.slug}.b2bapp.in</span></div><span className={c.status==="Active"?"status":"status off"}>{c.status}</span><span className="usage">{c.customers}/{c.limit}</span></div>)}</div><div className="card"><div className="card-head"><div><h3>Quick Actions</h3><p>Continue the client setup flow.</p></div></div>{[["clients","♙","Client Management","Create shop, set customer limit, status"],["shop","▣","Shop Dashboard","Catalog, orders and shop operations"],["builder","✣","App Builder","Design the customer's branded app"]].map(([v,i,t,d])=><button className="quick-action" key={v} onClick={()=>setView(v as AppView)}>{i}<span><b>{t}</b><small>{d}</small></span>→</button>)}</div></div></section>}
function Stat({label,value,note}:{label:string;value:string|number;note:string}){return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function ClientsView({clients,search,setSearch,onAdd,onToggle,onOpen}:{clients:Client[];search:string;setSearch:(v:string)=>void;onAdd:()=>void;onToggle:(id:string)=>void;onOpen:(name:string)=>void}){return <section className="page-view"><div className="page-title"><div><span className="eyebrow">CLIENT MANAGEMENT</span><h1>Shop Clients</h1><p>Create and control every shop's B2B app account.</p></div><button className="primary" onClick={onAdd}>＋ New Client</button></div><div className="toolbar"><div className="search-wide">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search client name or ID..."/></div><span>{clients.length} clients</span></div><div className="card table-card"><table><thead><tr><th>CLIENT</th><th>APP URL</th><th>CUSTOMERS</th><th>BUILDER</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{clients.map(c=><tr key={c.id}><td><div className="table-client"><div className="client-mark">{c.name.slice(0,1)}</div><span><b>{c.name}</b><small>{c.id}</small></span></div></td><td><code>https://{c.slug}.b2bapp.in</code></td><td><b>{c.customers}</b> / {c.limit}</td><td><span className={c.builder?"tag":"tag muted"}>{c.builder?"Enabled":"Disabled"}</span></td><td><button className={c.status==="Active"?"status":"status off"} onClick={()=>onToggle(c.id)}>{c.status}</button></td><td><button className="small-action" onClick={()=>onOpen(c.name)}>Open Dashboard</button></td></tr>)}</tbody></table></div></section>}
function ShopDashboard({client,products,setView,onAddProduct,orders,onOpenOwner}:{client:Client;products:Product[];setView:(v:AppView)=>void;onAddProduct:()=>void;orders:Order[];onOpenOwner:()=>void}){return <section className="page-view"><div className="page-title"><div><span className="eyebrow">SHOP DASHBOARD</span><h1>{client.name}</h1><p>Manage this shop's catalog and customer-facing B2B app.</p></div><div className="title-actions"><button className="ghost-dark" onClick={onOpenOwner}>📱 Open Shop Owner App</button><button className="ghost-dark" onClick={()=>setView("builder")}>✣ App Builder</button><button className="primary" onClick={onAddProduct}>＋ Add Product</button></div></div><div className="shop-identity"><div className="shop-logo">{client.name.slice(0,1)}</div><div><b>Shop Owner Workspace</b><span>Customer limit: {client.limit.toLocaleString("en-IN")} • {client.status}</span></div><button className="copy-btn" onClick={()=>navigator.clipboard?.writeText(window.location.origin+"/?shop="+client.slug)}>⧉ Copy App Link</button></div><div className="stats-grid"><Stat label="Products" value={products.length} note="Catalog items"/><Stat label="Customers" value={client.customers} note={`${client.limit-client.customers} slots available`}/><Stat label="Orders" value={orders.length} note="B2B orders"/><Stat label="App Status" value={client.status} note="Customer app"/></div><div className="dashboard-grid"><div className="card"><div className="card-head"><div><h3>Catalog</h3><p>Products currently available to the shop.</p></div><button className="text-button" onClick={()=>setView("products")}>Manage Products →</button></div><div className="mini-products">{products.slice(0,4).map(p=><div className="mini-product" key={p.id}><div className="product-thumb">◇</div><div><b>{p.name}</b><span>{p.sku} • {p.category}</span></div><strong>{p.price}</strong></div>)}</div></div><div className="card customer-card"><div className="card-head"><div><h3>Customer App</h3><p>What your customers will open.</p></div></div><div className="customer-link">✓ Customer app is ready</div><div className="app-features"><span>✓ Branded shop</span><span>✓ Product catalog</span><span>✓ WhatsApp sharing</span><span>✓ Mobile-first</span></div><div className="store-actions"><button className="outline-full" onClick={()=>setView("builder")}>Customize Customer App</button><button className="primary-full" onClick={()=>setView("store")}>Open Customer App</button></div></div></div></section>}
function ProductsView({products,search,setSearch,onAdd,onEdit,onDelete}:{products:Product[];search:string;setSearch:(v:string)=>void;onAdd:()=>void;onEdit:(p:Product)=>void;onDelete:(id:string)=>void}){return <section className="page-view"><div className="page-title"><div><span className="eyebrow">PRODUCT MANAGEMENT</span><h1>Products</h1><p>Add and maintain the shop catalog used by the customer app.</p></div><button className="primary" onClick={onAdd}>＋ Add Product</button></div><div className="toolbar"><div className="search-wide">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product or SKU..."/></div><span>{products.length} products</span></div><div className="card table-card"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="table-client"><div className="product-thumb small">◇</div><span><b>{p.name}</b><small>{p.sku}</small></span></div></td><td>{p.category}</td><td><b>{p.price}</b></td><td><span className={p.stock===0?"stock zero":"stock"}>{p.stock}</span></td><td><span className={p.status==="Active"?"tag":"tag muted"}>{p.status}</span></td><td><div className="row-actions"><button className="small-action" onClick={()=>onEdit(p)}>Edit</button><button className="small-action danger-text" onClick={()=>onDelete(p.id)}>Delete</button></div></td></tr>)}</tbody></table></div></section>}
function CustomersView({client,customers,orders,setCustomers,ownerSession}:{client:Client;customers:Customer[];orders:Order[];setCustomers:Dispatch<SetStateAction<Customer[]>>;ownerSession:string|null}){const available=Math.max(0,client.limit-client.customers);return <section className="page-view"><div className="page-title"><div><span className="eyebrow">CUSTOMER MANAGEMENT</span><h1>{client.name} Customers</h1><p>Customer access is bounded by the Super Admin limit.</p></div><div className="limit-badge">Limit {client.limit.toLocaleString("en-IN")}</div></div><div className="stats-grid"><Stat label="Registered" value={client.customers} note="Active customer accounts"/><Stat label="Available Slots" value={available} note="Remaining capacity"/><Stat label="Usage" value={`${Math.round((client.customers/client.limit)*100)}%`} note="Customer limit usage"/><Stat label="Access" value={client.status} note="Shop status"/></div><div className="card table-card"><div className="customer-toolbar"><b>Customer Accounts</b><span>{customers.length} loaded</span></div><table><thead><tr><th>CUSTOMER</th><th>PHONE</th><th>ORDERS</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td><div className="table-client"><div className="client-mark">{c.name.slice(0,1)}</div><span><b>{c.name}</b><small>{c.id}</small></span></div></td><td>{c.phone}</td><td>{c.orders}</td><td><span className={c.status==="Active"?"tag":"tag muted"}>{c.status}</span></td><td><div className="row-actions"><button className="small-action" onClick={()=>setViewingCustomer(c)}>View</button><button className="small-action" onClick={async()=>{const nextStatus=c.status==="Active"?"Blocked":"Active";if(ownerSession){try{const response=await fetch(`/api/owner/customers/${c.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({status:nextStatus})});if(!response.ok)return;const updated=await response.json();setCustomers(x=>x.map(v=>v.id===updated.id?updated:v));}catch{return;}}else setCustomers(x=>x.map(v=>v.id===c.id?{...v,status:nextStatus}:v))}}>{c.status==="Active"?"Block":"Unblock"}</button></div></td></tr>)}</tbody></table>{viewingCustomer&&<Modal title="Customer Details" onClose={()=>setViewingCustomer(null)}><div className="detail-grid"><div><span>Name</span><b>{viewingCustomer.name}</b></div><div><span>Mobile</span><b>{viewingCustomer.phone}</b></div><div><span>Email</span><b>{viewingCustomer.email||"—"}</b></div><div><span>Address</span><b>{viewingCustomer.address||"—"}</b></div><div><span>Orders</span><b>{viewingCustomer.orders}</b></div><div><span>Status</span><b>{viewingCustomer.status}</b></div></div><div className="history-section"><h3>Order History</h3>{orders.filter(o=>o.customerId===viewingCustomer.id).map(o=><div className="history-row" key={o.id}><b>{o.id}</b><span>{o.createdAt}</span><span>{o.status}</span><strong>₹{o.amount.toLocaleString("en-IN")}</strong></div>)}{orders.filter(o=>o.customerId===viewingCustomer.id).length===0&&<div className="empty">No orders found.</div>}</div></Modal>}</div></section>}
function CustomerStorefront({client,products,customers,setCustomers,setClients,setOrders}:{client:Client;products:Product[];customers:Customer[];setCustomers:Dispatch<SetStateAction<Customer[]>>;setClients:React.Dispatch<React.SetStateAction<Client[]>>;setOrders:Dispatch<SetStateAction<Order[]>>}){
  const [category,setCategory]=useState("All");
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState<Record<string,number>>({});
  const [cartOpen,setCartOpen]=useState(false);
  const [authMode,setAuthMode]=useState<"login"|"register"|null>(null);
  const [checkoutOpen,setCheckoutOpen]=useState(false);
  const [customer,setCustomer]=useState<Customer|null>(null);
  const [authName,setAuthName]=useState("");  const [authPhone,setAuthPhone]=useState("");
  const [authEmail,setAuthEmail]=useState("");
  const [authAddress,setAuthAddress]=useState("");
  const [authError,setAuthError]=useState("");
  const [ordered,setOrdered]=useState<string|null>(null);
  const cats=["All",...Array.from(new Set(products.map(p=>p.category)))];
  const visible=products.filter(p=>(category==="All"||p.category===category)&&p.name.toLowerCase().includes(search.toLowerCase())&&p.status==="Active");
  const count=Object.values(cart).reduce((a,b)=>a+b,0);
  const priceOf=(price:string)=>Number(price.replace(/[^0-9.]/g,""))||0;
  const total=products.reduce((s,p)=>s+(cart[p.id]||0)*priceOf(p.price),0);

  function openCheckout(){
    if(count===0) return;
    setAuthError("");
    if(customer){ setCartOpen(false); setCheckoutOpen(true); return; }
    setCartOpen(false); setAuthMode("login");
  }

  function login(){
    const phone=authPhone.trim();
    if(phone.length<8){setAuthError("Enter a valid mobile number.");return;}
    const found=customers.find(c=>c.phone.replace(/\\D/g,"")===phone.replace(/\\D/g,"")&&c.status==="Active");
    if(!found){setAuthError("Customer not found. Please register first.");return;}
    setCustomer(found); setAuthMode(null); setAuthError(""); setAuthAddress(found.address||""); setCheckoutOpen(true);
  }

  function register(){
    const name=authName.trim(), phone=authPhone.trim(), email=authEmail.trim(), address=authAddress.trim();
    if(name.length<2){setAuthError("Enter your business/customer name.");return;}
    if(phone.replace(/\\D/g,"").length<8){setAuthError("Enter a valid mobile number.");return;}
    if(!address){setAuthError("Delivery address is required.");return;}
    if(customers.some(c=>c.phone.replace(/\\D/g,"")===phone.replace(/\\D/g,""))){setAuthError("This mobile number is already registered. Please login.");return;}
    const registeredCount=client.customers;
    if(registeredCount>=client.limit){setAuthError("Customer registration limit has been reached for this shop.");return;}
    const next:Customer={id:`C-${Date.now()}`,name,phone,email:email||undefined,address,orders:0,status:"Active",clientId:client.id};
    setCustomers(x=>[...x,next]); setClients(x=>x.map(c=>c.id===client.id?{...c,customers:c.customers+1}:c)); setCustomer(next); setAuthMode(null); setAuthError(""); setCheckoutOpen(true);
  }

  function placeOrder(){
    if(!customer){setAuthMode("login");return;}
    const address=authAddress.trim()||customer.address?.trim()||"";
    if(!address){setAuthMode("register");setAuthError("Delivery address is required.");return;}
    const items=Object.entries(cart).filter(([,q])=>q>0).reduce((sum,[id,q])=>sum+q,0);
    if(items===0)return;
    const orderId=`ORD-${Date.now()}`;
    const createdAt=new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
    const lines:OrderLine[]=Object.entries(cart).filter(([,q])=>q>0).map(([id,qty])=>{const p=products.find(x=>x.id===id);if(!p)return null;const unitPrice=priceOf(p.price);return {productId:p.id,name:p.name,sku:p.sku,qty,unitPrice,lineTotal:unitPrice*qty};}).filter((x):x is OrderLine=>Boolean(x));
    if(lines.length===0)return;
    const insufficient=lines.find(line=>{const p=products.find(x=>x.id===line.productId);return !p||p.stock<line.qty;});
    if(insufficient){setAuthError(`Insufficient stock for ${insufficient.name}.`);setCheckoutOpen(true);return;}
    const order:Order={id:orderId,customer:customer.name,phone:customer.phone,email:customer.email,address,customerId:customer.id,clientId:client.id,items,lines,amount:lines.reduce((sum,line)=>sum+line.lineTotal,0),status:"Pending",createdAt};
    setProducts(prev=>prev.map(p=>{const line=lines.find(x=>x.productId===p.id);return line?{...p,stock:p.stock-line.qty}:p;}));
    setOrders(x=>[order,...x]);
    setCustomers(x=>x.map(c=>c.id===customer.id?{...c,orders:c.orders+1,address}:c));
    setCustomer(x=>x?{...x,address}:x);
    setCart({});setCartOpen(false);setCheckoutOpen(false);setOrdered(orderId);
  }

  return <section className="storefront">
    <header className="store-head"><div className="brand"><div className="store-logo">{client.name.slice(0,1)}</div><div><b>{client.name}</b><span>B2B Shopping App</span></div></div><div className="store-actions-inline"><button className="cart-btn" onClick={()=>setCartOpen(true)}>🛒 <b>{count}</b></button>{customer?<button className="account-chip" onClick={()=>{setAuthMode("register");setAuthError("");setAuthName(customer.name);setAuthPhone(customer.phone);setAuthEmail(customer.email||"");setAuthAddress(customer.address||"")}}>👤 {customer.name}</button>:<button className="login-link" onClick={()=>{setAuthMode("login");setAuthError("")}}>Login</button>}</div></header>
    <div className="store-hero"><div><span>WELCOME TO {client.name.toUpperCase()}</span><h1>Order your products<br/>quickly & easily.</h1><p>Browse the catalog and build your B2B order.</p></div><div className="hero-art">🛍️</div></div>
    <div className="store-search">⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."/></div>
    <div className="category-scroll">{cats.map(x=><button key={x} className={category===x?"cat active":"cat"} onClick={()=>setCategory(x)}>{x}</button>)}</div>
    <div className="store-section-head"><div><span>PRODUCTS</span><h2>{category==="All"?"Featured Products":category}</h2></div><small>{visible.length} items</small></div>
    <div className="product-grid">{visible.map(p=><article className="store-product" key={p.id}><div className="store-product-image">◇<span>{p.stock>0?"In Stock":"Out of Stock"}</span></div><div className="store-product-info"><small>{p.category}</small><h3>{p.name}</h3><p>{p.sku}</p><div className="price-row"><strong>{p.price}</strong><button disabled={p.stock===0} onClick={()=>setCart(x=>({...x,[p.id]:Math.min(p.stock,(x[p.id]||0)+1)}))}>＋ Add</button></div></div></article>)}</div>
    <div className="store-bottom"><div><span>{count} items</span><b>₹{total.toLocaleString("en-IN")}</b></div><button onClick={()=>setCartOpen(true)}>View Cart →</button></div>
    {cartOpen&&<div className="cart-sheet"><div className="cart-panel"><div className="cart-head"><div><span>YOUR ORDER</span><h2>Cart</h2></div><button onClick={()=>setCartOpen(false)}>×</button></div>{Object.entries(cart).filter(([,q])=>q>0).map(([id,q])=>{const p=products.find(x=>x.id===id);if(!p)return null;return <div className="cart-row" key={id}><div className="cart-thumb">◇</div><div className="cart-info"><b>{p.name}</b><small>{p.price} × {q}</small></div><div className="qty"><button onClick={()=>setCart(x=>({...x,[id]:Math.max(0,(x[id]||0)-1)}))}>−</button><b>{q}</b><button onClick={()=>setCart(x=>({...x,[id]:Math.min(p.stock,(x[id]||0)+1)}))}>＋</button></div></div>})}{count===0&&<div className="empty-cart">Your cart is empty.</div>}<div className="cart-total"><span>Total</span><b>₹{total.toLocaleString("en-IN")}</b></div><button className="checkout" disabled={!count} onClick={openCheckout}>Place B2B Order →</button></div></div>}
    {authMode&&<div className="modal-backdrop" onClick={()=>{setAuthMode(null);setAuthError("")}}><div className="modal checkout-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">CUSTOMER ACCOUNT</span><h2>{authMode==="login"?"Customer Login":"Customer Registration"}</h2></div><button onClick={()=>{setAuthMode(null);setAuthError("")}}>×</button></div><div className="auth-tabs"><button className={authMode==="login"?"active":""} onClick={()=>{setAuthMode("login");setAuthError("")}}>Login</button><button className={authMode==="register"?"active":""} onClick={()=>{setAuthMode("register");setAuthError("")}}>Register</button></div>{authMode==="login"?<><Field label="Mobile Number" value={authPhone} onChange={setAuthPhone}/><button className="primary-full" onClick={login}>Login & Continue</button></>:<><Field label="Business / Customer Name" value={authName} onChange={setAuthName}/><Field label="Mobile Number" value={authPhone} onChange={setAuthPhone}/><Field label="Email (Optional)" value={authEmail} onChange={setAuthEmail}/><Field label="Delivery Address" value={authAddress} onChange={setAuthAddress}/><button className="primary-full" onClick={register}>Register & Continue</button></>}{authError&&<div className="form-error">{authError}</div>}</div></div>}
    {checkoutOpen&&customer&&count>0&&<div className="modal-backdrop" onClick={()=>setCheckoutOpen(false)}><div className="modal checkout-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">CHECKOUT</span><h2>Delivery Details</h2></div><button onClick={()=>setCheckoutOpen(false)}>×</button></div><Field label="Customer" value={customer.name} onChange={()=>{}}/><Field label="Mobile" value={customer.phone} onChange={()=>{}}/><Field label="Delivery Address" value={authAddress||customer.address||""} onChange={setAuthAddress}/><div className="checkout-total">Order Total <b>₹{total.toLocaleString("en-IN")}</b></div><button className="primary-full" onClick={placeOrder}>Confirm & Place B2B Order</button></div></div>}
    {ordered&&<div className="order-success"><div>✓</div><h2>Order Placed</h2><p>Your order <b>{ordered}</b> has been submitted to {client.name}.</p><button onClick={()=>setOrdered(null)}>Continue Shopping</button></div>}
  </section>
}
function OrdersView({client,orders,setOrders,setProducts}:{client:Client;orders:Order[];setOrders:Dispatch<SetStateAction<Order[]>>;setProducts:Dispatch<SetStateAction<Product[]>>}){const [q,setQ]=useState("");const [selectedOrder,setSelectedOrder]=useState<Order|null>(null);const filtered=orders.filter(o=>(o.id+" "+o.customer+" "+o.phone).toLowerCase().includes(q.toLowerCase()));const statusClass=(s:string)=>s==="Delivered"?"tag":s==="Cancelled"?"tag muted":"tag";
async function changeStatus(order:Order,next:Order["status"]){if(order.status===next)return;if(order.status==="Delivered"&&next!=="Delivered")return;if(order.status==="Cancelled"&&next!=="Cancelled")return;if(ownerSession){try{const response=await fetch(`/api/owner/orders/${order.id}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({status:next})});if(!response.ok)return;const updated=await response.json();setOrders(x=>x.map(v=>v.id===updated.id?updated:v));return;}catch{return;}}if(next==="Cancelled"&&order.status!=="Cancelled"){setProducts(prev=>prev.map(p=>{const line=order.lines?.find(x=>x.productId===p.id);return line?{...p,stock:p.stock+line.qty}:p;}));}setOrders(x=>x.map(v=>v.id===order.id?{...v,status:next}:v));}
return <section className="page-view"><div className="page-title"><div><span className="eyebrow">SHOP OPERATIONS</span><h1>Orders</h1><p>Manage customer B2B orders from one place.</p></div><div className="title-actions"><button className="ghost-dark" onClick={()=>setOrders(x=>[...x].sort((a,b)=>b.id.localeCompare(a.id)))}>↻ Refresh</button></div></div><div className="stats-grid"><div className="stat-card"><span>Total Orders</span><strong>{orders.length}</strong><small>All order records</small></div><div className="stat-card"><span>Pending</span><strong>{orders.filter(x=>x.status==="Pending").length}</strong><small>Needs action</small></div><div className="stat-card"><span>Confirmed / Packed</span><strong>{orders.filter(x=>x.status==="Confirmed"||x.status==="Packed").length}</strong><small>In fulfillment</small></div><div className="stat-card"><span>Order Value</span><strong>₹{orders.reduce((s,x)=>s+x.amount,0).toLocaleString("en-IN")}</strong><small>Current records</small></div></div><div className="toolbar"><div className="search-wide">⌕<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search order, customer or phone..." /></div><span>{filtered.length} orders</span></div><div className="card table-card"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>AMOUNT</th><th>STATUS</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody>{filtered.map(o=><tr key={o.id}><td><button className="link-button" onClick={()=>setSelectedOrder(o)}><b>{o.id}</b></button></td><td><div className="table-client"><div className="client-mark">◉</div><span><b>{o.customer}</b><small>{o.phone}</small></span></div></td><td>{o.items}</td><td><b>₹{o.amount.toLocaleString("en-IN")}</b></td><td><span className={statusClass(o.status)}>{o.status}</span></td><td>{o.createdAt}</td><td><select className="order-status" value={o.status} onChange={e=>changeStatus(o,e.target.value as Order["status"])} disabled={o.status==="Delivered"||o.status==="Cancelled"}><option>Pending</option><option>Confirmed</option><option>Packed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td></tr>)}</tbody></table>{filtered.length===0&&<div className="empty">No orders found.</div>}</div>{selectedOrder&&<Modal title={selectedOrder.id} onClose={()=>setSelectedOrder(null)}><div className="order-detail-head"><div><span>Customer</span><b>{selectedOrder.customer}</b></div><div><span>Mobile</span><b>{selectedOrder.phone}</b></div><div><span>Status</span><b>{selectedOrder.status}</b></div><div><span>Created</span><b>{selectedOrder.createdAt}</b></div></div><div className="order-address"><span>Delivery Address</span><b>{selectedOrder.address||"—"}</b></div><div className="order-lines"><div className="order-line header"><span>PRODUCT</span><span>SKU</span><span>QTY</span><span>RATE</span><span>AMOUNT</span></div>{selectedOrder.lines?.map(line=><div className="order-line" key={line.productId}><span><b>{line.name}</b></span><span>{line.sku}</span><span>{line.qty}</span><span>₹{line.unitPrice.toLocaleString("en-IN")}</span><span>₹{line.lineTotal.toLocaleString("en-IN")}</span></div>)||<div className="empty">Legacy order: item-level details are not available.</div>}</div><div className="order-total"><span>Total Qty <b>{selectedOrder.items}</b></span><strong>₹{selectedOrder.amount.toLocaleString("en-IN")}</strong></div></Modal>}</section>}

function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}){return <div className="modal-backdrop" onClick={onClose}><div className={wide?"modal modal-wide":"modal"} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">B2B PLATFORM</span><h2>{title}</h2></div><button onClick={onClose}>×</button></div>{children}</div></div>}
function BuilderProductShare({ title, products, client, style }: { title:string; products:Product[]; client:Client; style:React.CSSProperties }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || "");
  const product = products.find(p=>p.id===selectedProductId) || products[0];
  if (!product) return <div className="whatsapp-button" style={style}>◉ {title} — No active products</div>;
  const shopSlug = client.slug;
  const appUrl = window.location.origin + "/?shop=" + encodeURIComponent(shopSlug);
  const shareText = `Product: ${product.name}\nPrice: ${product.price}\nSKU: ${product.sku}\nOrder: ${appUrl}`;
  function share() {
    if (navigator.share) {
      navigator.share({ title: product.name, text: shareText, url: appUrl }).catch(()=>{});
      return;
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(shareText), "_blank");
  }
  return <div style={style}>
    <div className="share-product-card">
      <div className="product-image">◇</div>
      <div><b>{product.name}</b><span>{product.price} • {product.sku}</span></div>
      <select value={product.id} onChange={e=>setSelectedProductId(e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.name} — {p.price}</option>)}</select>
      <button className="whatsapp-button" onClick={share}>◉ {title}</button>
    </div>
  </div>;
}

function BuilderPhotoSearch({ title, products, style }: { title:string; products:Product[]; style:React.CSSProperties }) {
  const [query, setQuery] = useState("");
  const [matched, setMatched] = useState<Product[]>([]);
  function findProducts(value:string) {
    setQuery(value);
    const normalized=value.toLowerCase().trim();
    if (!normalized) { setMatched([]); return; }
    setMatched(products.filter(p => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(normalized)));
  }
  return <div className="feature-card" style={style}>
    <div className="feature-icon">⌾</div>
    <div style={{flex:1}}>
      <b>{title}</b>
      <span>Search catalog by photo or keyword</span>
      <input type="file" accept="image/*" onChange={(e)=>{const file=e.target.files?.[0]; if(file) findProducts(file.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," "));}} />
      <input value={query} onChange={(e)=>findProducts(e.target.value)} placeholder="Try product name / SKU..." />
      {matched.length>0&&<div className="search-results">{matched.slice(0,4).map(p=><div key={p.id}><b>{p.name}</b><span>{p.price} • Similar products: {products.filter(x=>x.category===p.category).length}</span></div>)}</div>}
      {query && matched.length===0 && <small>No catalog match found.</small>}
    </div>
    <span>›</span>
  </div>;
}
