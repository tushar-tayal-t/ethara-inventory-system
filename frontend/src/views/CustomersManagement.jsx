import React, { useState, useEffect } from "react";
import { Search, Plus, Eye, X, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, User, Mail, Phone, Calendar, ShoppingBag } from "lucide-react";
import { api } from "../utils/api";
import "./ProductsCatalog.css"; // Reuse premium table & modal structures
import "./CustomersManagement.css"; // Customer details custom styling

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  // Modals & Panels State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const customersRes = await api.getCustomers();
      const ordersRes = await api.getOrders();

      if (customersRes.success) {
        setCustomers(customersRes.data);
      } else {
        setError(customersRes.message || "Failed to load customers.");
      }

      if (ordersRes.success) {
        setOrders(ordersRes.data);
      }
    } catch (err) {
      setError("Failed to connect to server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const clearForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setFormError("");
  };

  const handleOpenAdd = () => {
    clearForm();
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      password: password
    };

    setIsSaving(true);
    try {
      const res = await api.createCustomer(payload);
      if (res.success) {
        setSuccess(res.message || "Customer created successfully.");
        setIsAddModalOpen(false);
        clearForm();
        fetchData();
      } else {
        setFormError(res.message || "Failed to create customer.");
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.toLowerCase().includes(term))
    );
  });

  // Get orders associated with a customer
  const getCustomerOrders = (customerId) => {
    return orders.filter((o) => o.customer_id === customerId);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="tab-pane customers-pane animate-fade-in">
      <div className="view-header">
        <div className="header-meta">
          <span className="header-breadcrumbs">Workspace / Customers</span>
          <h1 className="header-title">Customer Directory & Registry</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn refresh-btn" onClick={fetchData} title="Refresh Directory">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="action-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Name, Email, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>×</button>
          )}
        </div>

        <button className="primary-btn add-btn" onClick={handleOpenAdd}>
          <Plus size={18} /> Register Customer
        </button>
      </div>

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

      {loading ? (
        <div className="pane-loader"><div className="spinner"></div></div>
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-panel-txt">No customers found matching your directory query.</div>
      ) : (
        <div className="table-responsive main-table-container">
          <table className="main-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email Address</th>
                <th>Phone Contact</th>
                <th>Registration Date</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const customerOrdersCount = getCustomerOrders(c.id).length;

                return (
                  <tr key={c.id} className="row-hover">
                    <td className="bold code">{c.id}</td>
                    <td className="bold">{c.name}</td>
                    <td>{c.email}</td>
                    <td className="font-mono">{c.phone || "-"}</td>
                    <td>{formatDate(c.created_at)}</td>
                    <td className="center action-cells">
                      <button
                        className="action-btn detail-icon-btn"
                        onClick={() => handleOpenDetails(c)}
                        title="View Customer Details & History"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Customer Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-drawer glass-card animate-scale-up">
            <header className="modal-header">
              <h2 className="form-title">Register Customer</h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setIsAddModalOpen(false);
                  clearForm();
                }}
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="modal-form">
              {formError && (
                <div className="alert-message error-alert animate-fade-in" style={{ margin: "0 0 0.5rem 0" }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontSize: "0.825rem" }}>{formError}</span>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Full Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="E.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    placeholder="E.g. jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Phone Contact <span className="label-optional">(Optional)</span></label>
                <div className="input-wrapper">
                  <input
                    type="tel"
                    placeholder="E.g. +1 555-0199"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password <span className="label-optional">(Min. 6 chars)</span></label>
                <div className="input-wrapper">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="primary-btn submit-btn" disabled={isSaving}>
                {isSaving ? (
                  <div className="spinner button-spinner"></div>
                ) : (
                  <>
                    Create Customer Profile <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details & History Side Drawer */}
      {isDetailsOpen && selectedCustomer && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsDetailsOpen(false)}>
          <div
            className="customer-detail-drawer glass-card animate-scale-up"
            onClick={(e) => e.stopPropagation()} // Prevent closing drawer when clicking inside
          >
            <header className="modal-header">
              <h2 className="form-title">Customer Details</h2>
              <button
                className="close-modal-btn"
                onClick={() => {
                  setIsDetailsOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                <X size={20} />
              </button>
            </header>

            <div className="profile-summary-card">
              <div className="profile-summary-item">
                <span className="profile-label">Customer ID</span>
                <span className="profile-value code">#{selectedCustomer.id}</span>
              </div>
              <div className="profile-summary-item">
                <span className="profile-label">Joined Date</span>
                <span className="profile-value">{formatDate(selectedCustomer.created_at)}</span>
              </div>
              <div className="profile-summary-item full-width">
                <span className="profile-label">Full Name</span>
                <span className="profile-value" style={{ fontSize: "1.1rem", fontWeight: "700" }}>
                  {selectedCustomer.name}
                </span>
              </div>
              <div className="profile-summary-item">
                <span className="profile-label">Email Address</span>
                <span className="profile-value">{selectedCustomer.email}</span>
              </div>
              <div className="profile-summary-item">
                <span className="profile-label">Phone Contact</span>
                <span className="profile-value">{selectedCustomer.phone || "Not provided"}</span>
              </div>
            </div>

            <div className="section-divider">Order History</div>

            <div className="orders-history-container">
              {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                <div className="no-orders-txt">
                  <ShoppingBag size={24} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
                  <div>This customer hasn't placed any orders yet.</div>
                </div>
              ) : (
                getCustomerOrders(selectedCustomer.id).map((order) => (
                  <div key={order.id} className="mini-order-card">
                    <div className="mini-order-header">
                      <div className="mini-order-meta">
                        <span className="mini-order-id">Order ID: #{order.id}</span>
                        <span className={`status-pill ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>
                      <span className="mini-order-date">{formatDate(order.created_at)}</span>
                    </div>

                    <div className="order-items-summary">
                      {order.items && order.items.map((item, idx) => (
                        <div key={item.id || idx} className="order-item-row">
                          <span className="order-item-name">{item.product_name || `Product ID: ${item.product_id}`}</span>
                          <span className="order-item-qty">Qty: {item.quantity}</span>
                        </div>
                      ))}
                      <div className="order-item-row" style={{ marginTop: "0.5rem", borderTop: "1px dashed rgba(255, 255, 255, 0.05)", paddingTop: "0.5rem" }}>
                        <span style={{ fontWeight: "700", color: "var(--text-main)" }}>Total Amount</span>
                        <span className="mini-order-amount">${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
