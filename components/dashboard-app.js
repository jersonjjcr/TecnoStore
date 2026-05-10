"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const views = [
  { id: "dashboard", label: "Resumen" },
  { id: "sales", label: "Ventas" },
  { id: "inventory", label: "Inventario" },
  { id: "repairs", label: "Reparaciones" },
  { id: "settings", label: "Configuraciones" }
];

const viewTitles = {
  dashboard: "Resumen general",
  sales: "Modulo de ventas",
  inventory: "Control de inventario",
  repairs: "Servicio tecnico",
  settings: "Configuraciones"
};

const emptyData = {
  products: [],
  sales: [],
  repairs: []
};

export default function DashboardApp() {
  const [activeView, setActiveView] = useState("dashboard");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [settings, setSettings] = useState({
    storeName: "TecnoStore",
    brandCopy:
      "Ventas, inventario y servicio tecnico para una tienda de accesorios y reparacion de telefonos.",
    lowStockThreshold: 5,
    notifications: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const savedSettings = window.localStorage.getItem("dashboardSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("dashboardSettings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [products, sales, repairs] = await Promise.all([
        fetchJson("/api/products"),
        fetchJson("/api/sales"),
        fetchJson("/api/repairs")
      ]);

      setData({ products, sales, repairs });
    } catch (loadError) {
      setError(loadError.message || "No se pudo cargar la informacion.");
    } finally {
      setLoading(false);
    }
  }

  async function createSale(formData) {
    try {
      await postJson("/api/sales", formData);
      setToast("Venta registrada y stock actualizado.");
      await loadData();
      setActiveView("dashboard");
    } catch (submitError) {
      setToast(submitError.message || "No se pudo guardar la venta.");
    }
  }

  async function createProduct(formData) {
    try {
      await postJson("/api/products", formData);
      setToast("Producto agregado al inventario.");
      await loadData();
    } catch (submitError) {
      setToast(submitError.message || "No se pudo agregar el producto.");
    }
  }

  async function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto del inventario?")) return;

    try {
      await deleteJson("/api/products", { id });
      setToast("Producto eliminado del inventario.");
      await loadData();
    } catch (deleteError) {
      setToast(deleteError.message || "No se pudo eliminar el producto.");
    }
  }

  async function deleteSale(id) {
    if (!confirm("¿Eliminar esta venta?")) return;

    try {
      await deleteJson("/api/sales", { id });
      setToast("Venta eliminada.");
      await loadData();
    } catch (deleteError) {
      setToast(deleteError.message || "No se pudo eliminar la venta.");
    }
  }

  async function deleteRepair(id) {
    if (!confirm("¿Eliminar esta orden de servicio?")) return;

    try {
      await deleteJson("/api/repairs", { id });
      setToast("Orden de servicio eliminada.");
      await loadData();
    } catch (deleteError) {
      setToast(deleteError.message || "No se pudo eliminar la orden.");
    }
  }

  async function saveSettings(newSettings) {
    setSettings((current) => ({ ...current, ...newSettings }));
    setToast("Configuracion guardada.");
  }

  async function createRepair(formData) {
    try {
      await postJson("/api/repairs", formData);
      setToast("Orden de reparacion creada.");
      await loadData();
      setActiveView("dashboard");
    } catch (submitError) {
      setToast(submitError.message || "No se pudo crear la orden.");
    }
  }

  async function advanceRepairStatus(id) {
    try {
      await patchJson(`/api/repairs/${id}`, {});
      setToast("Estado de reparacion actualizado.");
      await loadData();
    } catch (submitError) {
      setToast(submitError.message || "No se pudo actualizar la orden.");
    }
  }

  const metrics = getMetrics(data, settings);
  const alerts = getAlerts(data, settings);

  return (
    <>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand-card">
            <div className="brand-mark">TS</div>
            <div>
              <p className="eyebrow">Panel de control</p>
              <h1>{settings.storeName}</h1>
            </div>
            <p className="brand-copy">{settings.brandCopy}</p>
          </div>

          <nav className="nav" aria-label="Secciones principales">
            {views.map((view) => (
              <button
                key={view.id}
                className={`nav-link ${activeView === view.id ? "is-active" : ""}`}
                onClick={() => setActiveView(view.id)}
                type="button"
              >
                {view.label}
              </button>
            ))}
          </nav>

          <section className="sidebar-panel">
            <p className="eyebrow">Alertas</p>
            <div className="stack">
              {alerts.map((alert) => (
                <div key={alert.title} className="alert-item">
                  <strong>{alert.title}</strong>
                  <p className="muted">{alert.description}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <main className="main-content">
          <header className="hero">
            <div>
              <p className="eyebrow">Administrador web</p>
              <h2>Controla la tienda desde un solo lugar</h2>
              <p className="hero-copy">
                Registra ventas, agrega accesorios nuevos y sigue el estado de
                cada reparacion sin salir del panel.
              </p>
            </div>
            <div className="hero-badge">
              <span className="pulse"></span>
              API interna con Next.js
            </div>
          </header>

          <section className="metrics-grid" aria-label="Indicadores">
            {metrics.map((metric) => (
              <article key={metric.title} className="metric-card">
                <p className="eyebrow">{metric.title}</p>
                <div className="value">{metric.value}</div>
                <p className="meta">{metric.meta}</p>
              </article>
            ))}
          </section>

          <section className="view-switcher">
            <div>
              <p className="eyebrow">Operacion diaria</p>
              <h3>{viewTitles[activeView]}</h3>
            </div>
          </section>

          {error ? <div className="error-card">{error}</div> : null}
          {loading ? <div className="loading-card">Cargando informacion...</div> : null}
          {!loading && !error ? (
            <ViewRenderer
              activeView={activeView}
              data={data}
              settings={settings}
              onCreateSale={createSale}
              onDeleteSale={deleteSale}
              onCreateProduct={createProduct}
              onDeleteProduct={deleteProduct}
              onCreateRepair={createRepair}
              onDeleteRepair={deleteRepair}
              onAdvanceRepair={advanceRepairStatus}
              onSaveSettings={saveSettings}
            />
          ) : null}
        </main>
      </div>

      <div className={`toast ${toast ? "is-visible" : ""}`}>{toast}</div>
    </>
  );
}

function ViewRenderer({
  activeView,
  data,
  settings,
  onCreateSale,
  onDeleteSale,
  onCreateProduct,
  onDeleteProduct,
  onCreateRepair,
  onDeleteRepair,
  onAdvanceRepair,
  onSaveSettings
}) {
  switch (activeView) {
    case "sales":
      return <SalesView data={data} onCreateSale={onCreateSale} onDeleteSale={onDeleteSale} />;
    case "inventory":
      return <InventoryView data={data} lowStockThreshold={settings.lowStockThreshold} onCreateProduct={onCreateProduct} onDeleteProduct={onDeleteProduct} />;
    case "repairs":
      return (
        <RepairsView
          data={data}
          onCreateRepair={onCreateRepair}
          onDeleteRepair={onDeleteRepair}
          onAdvanceRepair={onAdvanceRepair}
        />
      );
    case "settings":
      return <SettingsView settings={settings} onSaveSettings={onSaveSettings} />;
    default:
      return <DashboardView data={data} settings={settings} />;
  }
}

function DashboardView({ data, settings }) {
  const topProducts = summarizeTopProducts(data.sales);
  const recentRepairs = [...data.repairs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  return (
    <>
      <div className="dashboard-grid">
        <PanelCard
          eyebrow="Movimiento reciente"
          title="Ultimas ventas cargadas en caja"
        >
          <div className="list">
            {data.sales.slice(0, 5).map((sale) => (
              <article key={sale.id} className="list-item">
                <div>
                  <strong>
                    {sale.productName} x{sale.quantity}
                  </strong>
                  <p className="muted">
                    {sale.customer} · {sale.payment}
                  </p>
                  <div className="list-meta">
                    <Badge tone="primary">{formatDate(sale.createdAt)}</Badge>
                  </div>
                </div>
                <strong>{formatCurrency(sale.total)}</strong>
              </article>
            ))}
          </div>
        </PanelCard>

        <PanelCard
          eyebrow="Indicadores rapidos"
          title="Lo que mas se esta moviendo en la tienda"
        >
          <div className="stack">
            {topProducts.map((item) => (
              <div key={item.name} className="mini-card">
                <strong>{item.name}</strong>
                <p className="muted">{item.units} unidades vendidas</p>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <PanelCard
          eyebrow="Estado de reparaciones"
          title="Seguimiento de ordenes recientes"
        >
          <div className="list">
            {recentRepairs.map((repair) => (
              <article key={repair.id} className="list-item">
                <div>
                  <strong>{repair.device}</strong>
                  <p className="muted">
                    {repair.customer} · {repair.issue}
                  </p>
                </div>
                <StatusBadge status={repair.status} />
              </article>
            ))}
          </div>
        </PanelCard>

        <PanelCard eyebrow="Consejos de operacion" title="Siguientes acciones sugeridas">
          <div className="stack">
            <div className="mini-card">
              <strong>Revisar stock de cargadores</strong>
              <p className="muted">
                Los accesorios de carga suelen rotar mas rapido que fundas y audio.
              </p>
            </div>
            <div className="mini-card">
              <strong>Llamar equipos listos</strong>
              <p className="muted">
                Cuando una orden pase a "Lista para entregar", ya puedes contactar al cliente.
              </p>
            </div>
            <div className="mini-card">
              <strong>Registrar cada venta</strong>
              <p className="muted">
                El inventario se actualiza desde el backend cuando guardas la venta.
              </p>
            </div>
          </div>
        </PanelCard>
      </div>
    </>
  );
}

function SalesView({ data, onCreateSale, onDeleteSale }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await onCreateSale({
      customer: String(formData.get("customer") || "").trim(),
      payment: String(formData.get("payment") || ""),
      productId: String(formData.get("productId") || ""),
      quantity: Number(formData.get("quantity") || 0)
    });

    event.currentTarget.reset();
  }

  function exportToExcel() {
    if (data.sales.length === 0) {
      alert("No hay ventas para exportar.");
      return;
    }

    const salesData = data.sales.map((sale) => ({
      "Cliente": sale.customer,
      "Producto": sale.productName,
      "Cantidad": sale.quantity,
      "Método de Pago": sale.payment,
      "Total": sale.total,
      "Fecha": new Date(sale.createdAt).toLocaleString("es-CO")
    }));

    const worksheet = XLSX.utils.json_to_sheet(salesData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

    const fileName = `ventas_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  return (
    <div className="content-grid">
      <PanelCard
        eyebrow="Registrar venta"
        title="Descuenta stock automaticamente y guarda el historial"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field label="Cliente" htmlFor="sale-customer">
              <input id="sale-customer" name="customer" placeholder="Nombre del cliente" required />
            </Field>

            <Field label="Metodo de pago" htmlFor="sale-payment">
              <select id="sale-payment" name="payment" defaultValue="Efectivo" required>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Tarjeta">Tarjeta</option>
              </select>
            </Field>

            <Field label="Producto" htmlFor="sale-product">
              <select id="sale-product" name="productId" required>
                {data.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {formatCurrency(product.price)} · stock {product.stock}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cantidad" htmlFor="sale-quantity">
              <input
                id="sale-quantity"
                name="quantity"
                type="number"
                min="1"
                defaultValue="1"
                required
              />
            </Field>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="submit">
              Guardar venta
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard eyebrow="Historial de ventas" title="Ultimos movimientos registrados">
        <div style={{ marginBottom: 16 }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={exportToExcel}
          >
            Descargar Excel
          </button>
        </div>
        <div className="list">
          {[...data.sales]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((sale) => (
              <article key={sale.id} className="list-item">
                <div>
                  <strong>
                    {sale.productName} x{sale.quantity}
                  </strong>
                  <p className="muted">{sale.customer}</p>
                  <div className="list-meta">
                    <Badge tone="primary">{sale.payment}</Badge>
                    <Badge tone="warning">{formatDate(sale.createdAt)}</Badge>
                  </div>
                </div>
                <div className="stack" style={{ alignItems: "flex-end", gap: 8 }}>
                  <strong>{formatCurrency(sale.total)}</strong>
                  <button
                    className="btn btn-small"
                    type="button"
                    onClick={() => onDeleteSale(sale.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
        </div>
      </PanelCard>
    </div>
  );
}

function InventoryView({ data, onCreateProduct, onDeleteProduct }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await onCreateProduct({
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      stock: Number(formData.get("stock") || 0),
      price: Number(formData.get("price") || 0)
    });

    event.currentTarget.reset();
  }

  return (
    <div className="content-grid">
      <PanelCard eyebrow="Agregar accesorio" title="Crea nuevas referencias para la tienda">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field label="Nombre del producto" htmlFor="product-name">
              <input
                id="product-name"
                name="name"
                placeholder="Ej. Power bank 20.000 mAh"
                required
              />
            </Field>

            <Field label="Categoria" htmlFor="product-category">
              <input
                id="product-category"
                name="category"
                placeholder="Carga, audio, proteccion..."
                required
              />
            </Field>

            <Field label="Stock inicial" htmlFor="product-stock">
              <input id="product-stock" name="stock" type="number" min="0" defaultValue="5" required />
            </Field>

            <Field label="Precio de venta" htmlFor="product-price">
              <input id="product-price" name="price" type="number" min="1" defaultValue="25000" required />
            </Field>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="submit">
              Agregar producto
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard eyebrow="Inventario actual" title="Stock disponible y alertas de reposicion">
        <div className="list">
          {[...data.products]
            .sort((a, b) => a.stock - b.stock)
            .map((product) => (
              <article key={product.id} className="list-item">
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted">
                    {product.category} · {formatCurrency(product.price)}
                  </p>
                  <div className="list-meta">
                    {product.stock <= 5 ? (
                      <Badge tone="warning">Reposicion sugerida</Badge>
                    ) : (
                      <Badge tone="success">Stock estable</Badge>
                    )}
                  </div>
                </div>
                <div className="stack" style={{ alignItems: "flex-end", gap: 8 }}>
                  <strong>{product.stock} und</strong>
                  <button
                    className="btn btn-small"
                    type="button"
                    onClick={() => onDeleteProduct(product.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
        </div>
      </PanelCard>
    </div>
  );
}

function RepairsView({ data, onCreateRepair, onDeleteRepair, onAdvanceRepair }) {
  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await onCreateRepair({
      customer: String(formData.get("customer") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      device: String(formData.get("device") || "").trim(),
      issue: String(formData.get("issue") || "").trim(),
      estimate: Number(formData.get("estimate") || 0)
    });

    event.currentTarget.reset();
  }

  return (
    <div className="content-grid">
      <PanelCard
        eyebrow="Ingresar reparacion"
        title="Registra datos del cliente, equipo y diagnostico inicial"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Field label="Cliente" htmlFor="repair-customer">
              <input id="repair-customer" name="customer" placeholder="Nombre del cliente" required />
            </Field>

            <Field label="Telefono" htmlFor="repair-phone">
              <input id="repair-phone" name="phone" placeholder="3001234567" required />
            </Field>

            <Field label="Equipo" htmlFor="repair-device">
              <input id="repair-device" name="device" placeholder="iPhone 12, A54, Redmi..." required />
            </Field>

            <Field label="Presupuesto" htmlFor="repair-estimate">
              <input
                id="repair-estimate"
                name="estimate"
                type="number"
                min="1"
                defaultValue="60000"
                required
              />
            </Field>

            <Field label="Falla reportada" htmlFor="repair-issue" full>
              <textarea
                id="repair-issue"
                name="issue"
                placeholder="Describe el problema del equipo"
                required
              />
            </Field>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="submit">
              Crear orden
            </button>
          </div>
        </form>
      </PanelCard>

      <PanelCard eyebrow="Ordenes de servicio" title="Cambia el estado segun avance cada trabajo">
        <div className="list">
          {[...data.repairs]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((repair) => (
              <article key={repair.id} className="list-item">
                <div>
                  <strong>
                    {repair.device} · {repair.customer}
                  </strong>
                  <p className="muted">{repair.issue}</p>
                  <div className="list-meta">
                    <Badge tone="primary">{repair.phone}</Badge>
                    <Badge tone="warning">{formatCurrency(repair.estimate)}</Badge>
                  </div>
                </div>
                <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
                  <StatusBadge status={repair.status} />
                  {repair.status !== "entregada" ? (
                    <button
                      className="btn-small"
                      type="button"
                      onClick={() => onAdvanceRepair(repair.id)}
                    >
                      Avanzar estado
                    </button>
                  ) : null}
                  <button
                    className="btn btn-small"
                    type="button"
                    onClick={() => onDeleteRepair(repair.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
        </div>
      </PanelCard>
    </div>
  );
}

function PanelCard({ eyebrow, title, children }) {
  return (
    <article className="panel-card">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      <div className="panel-body">{children}</div>
    </article>
  );
}

function Field({ label, htmlFor, children, full = false }) {
  return (
    <div className={`field ${full ? "full" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

function Badge({ tone, children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function StatusBadge({ status }) {
  const config = {
    recibida: { label: "Recibida", tone: "warning" },
    revision: { label: "En revision", tone: "primary" },
    lista: { label: "Lista para entregar", tone: "success" },
    entregada: { label: "Entregada", tone: "danger" }
  }[status];

  return <Badge tone={config.tone}>{config.label}</Badge>;
}

function getMetrics(data) {
  const today = new Date();
  const todaySales = data.sales.reduce((sum, sale) => {
    const date = new Date(sale.createdAt);
    const sameDay =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return sameDay ? sum + sale.total : sum;
  }, 0);

  const totalUnits = data.products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = data.products.filter((product) => product.stock <= 5).length;
  const activeRepairs = data.repairs.filter((repair) => repair.status !== "entregada").length;
  const inventoryValue = data.products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0
  );

  return [
    {
      title: "Ventas del dia",
      value: formatCurrency(todaySales),
      meta: `${data.sales.length} ventas registradas`
    },
    {
      title: "Inventario total",
      value: `${totalUnits} und`,
      meta: `${lowStock} referencias con alerta`
    },
    {
      title: "Reparaciones activas",
      value: `${activeRepairs}`,
      meta: `${data.repairs.length} ordenes historicas`
    },
    {
      title: "Valor en stock",
      value: formatCurrency(inventoryValue),
      meta: "Capital aproximado en accesorios"
    }
  ];
}

function getAlerts(data) {
  const alerts = [];
  const lowStockItem = data.products.find((product) => product.stock <= 5);
  const readyRepair = data.repairs.find((repair) => repair.status === "lista");

  if (lowStockItem) {
    alerts.push({
      title: "Stock bajo",
      description: `${lowStockItem.name} tiene solo ${lowStockItem.stock} unidades.`
    });
  }

  if (readyRepair) {
    alerts.push({
      title: "Equipo listo",
      description: `${readyRepair.device} de ${readyRepair.customer} ya se puede entregar.`
    });
  }

  if (!alerts.length) {
    alerts.push({
      title: "Todo al dia",
      description: "No hay alertas urgentes en este momento."
    });
  }

  return alerts;
}

function summarizeTopProducts(sales) {
  const counts = new Map();

  sales.forEach((sale) => {
    counts.set(sale.productName, (counts.get(sale.productName) || 0) + sale.quantity);
  });

  const items = Array.from(counts.entries()).map(([name, units]) => ({ name, units }));
  if (!items.length) {
    return [{ name: "Sin ventas aun", units: 0 }];
  }

  return items.sort((a, b) => b.units - a.units).slice(0, 3);
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || "Error de red.");
  }
  return json;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || "No se pudo completar la solicitud.");
  }

  return json;
}

async function patchJson(url, payload) {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || "No se pudo completar la solicitud.");
  }

  return json;
}

async function deleteJson(url, payload) {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || "No se pudo completar la solicitud.");
  }

  return json;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(date));
}
