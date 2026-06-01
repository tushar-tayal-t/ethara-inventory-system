import React, { useState, useEffect } from "react";
import { Plus, X, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, ShoppingBag } from "lucide-react";
import { api } from "../utils/api";
import "./OrdersTracker.css";

export default function OrdersTracker() {
  // Orders & Data lists
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Place Order Modal Forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderCustomer, setOrderCustomer] = useState("");
  const [orderItems, setOrderItems] = useState([{ productId: "", quantity: 1 }]);

  // Fetch all resources
  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      // Parallel loading
      const [resOrders, resProducts, resCustomers] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCustomers()
      ]);

      if (resOrders.success) setOrders(resOrders.data);
      if (resProducts.success) setProducts(resProducts.data);
      if (resCustomers.success) setCustomers(resCustomers.data);
    } catch (err) {
      setError("Failed to load tracker logs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Place Order handlers
  const handleAddField = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveField = (idx) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, value) => {
    const updated = [...orderItems];
    updated[idx][field] = value;
    setOrderItems(updated);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!orderCustomer) {
      setError("Please select a customer profile.");
      return;
    }

    const cleanItems = orderItems.map((item) => ({
      product_id: parseInt(item.productId),
      quantity: parseInt(item.quantity)
    }));

    if (cleanItems.some((item) => isNaN(item.product_id) || item.quantity <= 0)) {
      setError("Please enter valid product selections and positive quantities.");
      return;
    }

    // Verify stock client-side as a sanity check
    for (const item of cleanItems) {
      const match = products.find((p) => p.id === item.product_id);
      if (match && match.stock < item.quantity) {
        setError(`Insufficient stock for ${match.name}. Available: ${match.stock}, Requested: ${item.quantity}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customer_id: parseInt(orderCustomer),
        items: cleanItems
      };

      const res = await api.createOrder(payload);
      if (res.success) {
        setSuccess(res.message);
        setIsModalOpen(false);
        setOrderCustomer("");
        setOrderItems([{ productId: "", quantity: 1 }]);
        fetchAllData(); // refresh stock and orders
      } else {
        setError(res.message || "Failed to launch fulfillment order.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel/Delete Order
  const handleCancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this fulfillment order? Stock will be restored.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.deleteOrder(id);
      if (res.success) {
        setSuccess(res.message);
        fetchAllData();
      } else {
        setError(res.message || "Failed to cancel order.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Change Order Status
  const handleStatusChange = async (id, newStatus) => {
    setError("");
    setSuccess("");
    try {
      const res = await api.updateOrderStatus(id, newStatus);
      if (res.success) {
        setSuccess(res.message);
        fetchAllData(); // refresh orders & stock
      } else {
        setError(res.message || "Failed to update order status.");
      }
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="tab-pane orders-pane animate-fade-in">
      {/* View Header */}
      <div className="view-header">
        <div className="header-meta">
          <span className="header-breadcrumbs">Workspace / Orders</span>
          <h1 className="header-title">Fulfillment & Orders Tracker</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn refresh-btn" onClick={fetchAllData} title="Refresh Tracker">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar flex-end">
        <button className="primary-btn add-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Place Fulfillment Order
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert-message error-alert animate-fade-in">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError("")}><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="alert-message success-alert animate-fade-in">
          <CheckCircle size={18} />
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess("")}><X size={14} /></button>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="pane-loader"><div className="spinner"></div></div>
      ) : orders.length === 0 ? (
        <div className="empty-panel-txt">
          <ShoppingBag size={48} style={{ opacity: 0.15, marginBottom: "0.5rem" }} />
          <span>No orders placed in the system. Launch one now!</span>
        </div>
      ) : (
        <div className="table-responsive main-table-container">
          <table className="main-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Profile</th>
                <th>Order Items Summary</th>
                <th>Fulfillment Cost</th>
                <th>Status</th>
                <th>Date Logged</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="row-hover">
                  <td className="bold">#{o.id}</td>
                  <td className="bold">{o.customer_name || `Customer #${o.customer_id}`}</td>
                  <td>
                    <div className="items-list-container">
                      {o.items && o.items.map((item, idx) => (
                        <span key={idx} className="item-tag-pill">
                          {item.product_name || `Prod #${item.product_id}`} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="accent font-mono bold">${o.total_amount.toFixed(2)}</td>
                  <td>
                    <select
                      className={`status-select-pill ${o.status}`}
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td className="dim-txt">{o.created_at ? new Date(o.created_at).toLocaleString() : "-"}</td>
                  <td className="center action-cells">
                    {o.status !== "cancelled" && (
                      <button className="action-btn delete-icon-btn cancel-order-btn" onClick={() => handleCancelOrder(o.id)} title="Cancel & Restore Stock">
                        <X size={14} /> Cancel Order
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PLACE FULFILLMENT ORDER MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-drawer glass-card order-modal-drawer animate-scale-up">
            <header className="modal-header">
              <h2 className="form-title">Launch Fulfillment Order</h2>
              <button className="close-modal-btn" onClick={() => {
                setIsModalOpen(false);
                setOrderCustomer("");
                setOrderItems([{ productId: "", quantity: 1 }]);
              }}><X size={20} /></button>
            </header>

            <form onSubmit={handleOrderSubmit} className="modal-form">
              {/* Customer Account */}
              <div className="input-group">
                <label className="input-label">Select Customer Account</label>
                <div className="input-wrapper">
                  <select
                    className="modal-select-input"
                    value={orderCustomer}
                    onChange={(e) => setOrderCustomer(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Account --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi product scroll view list */}
              <div className="order-items-scroll-section">
                <span className="input-label select-items-lbl">Select Products and Quantities:</span>

                {orderItems.map((item, idx) => (
                  <div key={idx} className="order-item-selection-row">
                    {/* Selector */}
                    <div className="select-product-wrap">
                      <select
                        className="modal-select-input"
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                        required
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock === 0}>
                            {p.name} (SKU: {p.sku}) - ${p.price.toFixed(2)} [Stock: {p.stock}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Qty */}
                    <div className="select-qty-wrap">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        required
                      />
                    </div>

                    {/* Delete icon */}
                    <button
                      type="button"
                      className="remove-item-row-btn"
                      disabled={orderItems.length === 1}
                      onClick={() => handleRemoveField(idx)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="add-item-row-btn"
                  onClick={handleAddField}
                >
                  <Plus size={14} /> Add Another Product
                </button>
              </div>

              <button type="submit" className="primary-btn submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="spinner button-spinner"></div>
                ) : (
                  <>
                    Launch Fulfillment Order <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
