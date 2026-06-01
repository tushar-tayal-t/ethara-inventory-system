import React, { useState, useEffect } from "react";
import { BarChart3, Box, ClipboardList, DollarSign, ShoppingBag, CheckCircle, AlertTriangle, X, RefreshCw, Users } from "lucide-react";
import { api } from "../utils/api";
import "./DashboardOverview.css";

export default function DashboardOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);


  const fetchAnalytics = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError("");
    try {
      const res = await api.getAnalyticsSummary();
      if (res.success) {
        setAnalytics(res.data);
      } else {
        setError(res.message || "Failed to load system metrics.");
      }
    } catch (err) {
      setError("Failed to load dashboard metrics: " + err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Auto-refresh metrics every 10 seconds silently
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tab-pane overview-pane animate-fade-in">
      {/* View Header with Breadcrumbs & Title */}
      <div className="view-header">
        <div className="header-meta">
          <span className="header-breadcrumbs">Workspace / Overview</span>
          <h1 className="header-title">System Dashboard Summary</h1>
        </div>
        <div className="header-actions">
          <div className="live-indicator" title="Overview metrics automatically refresh in real-time">
            <span className="live-dot"></span>
            <span className="live-text">Live Sync</span>
          </div>
          <button 
            className={`icon-btn refresh-btn ${isRefreshing ? "spinning" : ""}`} 
            onClick={() => fetchAnalytics()} 
            title="Refresh Stats"
          >
            <RefreshCw size={18} />
          </button>
          <div className="header-date">
            📅 {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>


      {/* Notifications */}
      {error && (
        <div className="alert-message error-alert animate-fade-in">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="pane-loader">
          <div className="spinner"></div>
        </div>
      ) : analytics ? (
        <>
          {/* 6 Glowing Analytics KPI Widgets */}
          <div className="analytics-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-indigo">
                <Box className="kpi-icon" />
              </div>
              <div className="kpi-stats">
                <span className="kpi-val">{analytics.metrics.total_products}</span>
                <span className="kpi-label">Total Products</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-violet">
                <Users className="kpi-icon" />
              </div>
              <div className="kpi-stats">
                <span className="kpi-val">{analytics.metrics.total_customers}</span>
                <span className="kpi-label">Total Customers</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-green">
                <ShoppingBag className="kpi-icon" />
              </div>
              <div className="kpi-stats">
                <span className="kpi-val">{analytics.metrics.total_orders}</span>
                <span className="kpi-label">Total Orders</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-red">
                <AlertTriangle className="kpi-icon" />
              </div>
              <div className="kpi-stats">
                <span className="kpi-val">{analytics.metrics.low_stock_count}</span>
                <span className="kpi-label">Low Stock Alerts</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-violet">
                <ClipboardList className="kpi-icon" />
              </div>
              <div className="kpi-stats">
                <span className="kpi-val">{analytics.metrics.total_stock}</span>
                <span className="kpi-label">Total Items Stock</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap bg-sky">
                <DollarSign className="kpi-icon" />
              </div>
              <div className="kpi-stats">
                <span className="kpi-val">${analytics.metrics.total_inventory_value.toLocaleString()}</span>
                <span className="kpi-label">Inventory Assets Value</span>
              </div>
            </div>
          </div>

          {/* Sub Split Panels (Recent Orders vs Low Stock) */}
          <div className="overview-split">
            {/* Recent Orders Panel */}
            <div className="split-panel glass-card-panel">
              <h3 className="panel-title">Recent Fulfillment Orders</h3>
              {analytics.recent_orders.length === 0 ? (
                <div className="empty-panel-txt">No recent orders found. Create one in the Orders tab!</div>
              ) : (
                <div className="table-responsive">
                  <table className="panel-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Items</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recent_orders.map((o) => (
                        <tr key={o.id}>
                          <td className="bold">#{o.id}</td>
                          <td>{o.customer_name}</td>
                          <td className="accent font-mono">${o.total_amount.toFixed(2)}</td>
                          <td>{o.items.map((it, idx) => (<span key={idx} className="item-badge">{it.product_name}×{it.quantity}</span>))}</td>
                          <td>
                            <span className={`status-pill ${o.status}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low Stock Alerts Panel */}
            <div className="split-panel glass-card-panel">
              <div className="panel-header-alert">
                <h3 className="panel-title">Low Stock System Alerts</h3>
                {analytics.low_stock_alerts.length > 0 && (
                  <span className="alert-count-pill">{analytics.low_stock_alerts.length}</span>
                )}
              </div>
              {analytics.low_stock_alerts.length === 0 ? (
                <div className="empty-panel-txt success-text">
                  <CheckCircle size={32} className="success-check-alert" />
                  <span>All product inventory levels are healthy!</span>
                </div>
              ) : (
                <div className="alert-scroll-list">
                  {analytics.low_stock_alerts.map((p) => (
                    <div key={p.id} className="alert-item">
                      <div className="alert-item-meta">
                        <span className="alert-prod-name">{p.name}</span>
                        <span className="alert-prod-sku">{p.sku}</span>
                      </div>
                      <div className="alert-item-badge">
                        {p.stock === 0 ? (
                          <span className="badge-critical">Out of Stock</span>
                        ) : (
                          <span className="badge-warning">Only {p.stock} left</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Selling Products Panel */}
            <div className="split-panel glass-card-panel">
              <div className="panel-header-alert">
                <h3 className="panel-title">Top Selling Products</h3>
              </div>
              {analytics.top_selling_products && analytics.top_selling_products.length > 0 ? (
                <div className="top-sellers-list">
                  {analytics.top_selling_products.map((p, idx) => (
                    <div key={p.id} className="top-seller-item">
                      <div className="top-seller-info">
                        <span className="rank">#{idx + 1}</span>
                        <div className="top-seller-meta">
                          <span className="product-name">{p.name}</span>
                          <span className="sku">{p.sku}</span>
                        </div>
                      </div>
                      <div className="top-seller-stats">
                        <span className="sold">{p.total_sold} units sold</span>
                        <span className="rev">${p.revenue.toFixed(2)} rev</span>
                        {p.inventory_value !== undefined && (
                          <span className="inv-val" title="Remaining Inventory Value">
                            Value: ${p.inventory_value.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              ) : (
                <div className="empty-panel-txt">No top selling data.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-panel-txt">No summary analytics found.</div>
      )}
    </div>
  );
}
