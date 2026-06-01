import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, AlertTriangle, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "../utils/api";
import "./ProductsCatalog.css";

export default function ProductsCatalog() {
  // Catalog Data & Loading States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState("");

  // Modal / Drawer Active States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getProducts();
      if (res.success) {
        setProducts(res.data);
      } else {
        setError(res.message || "Failed to load product inventory.");
      }
    } catch (err) {
      setError("Failed to connect: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Form Clear
  const clearForm = () => {
    setSku("");
    setName("");
    setDescription("");
    setPrice("");
    setStock("");
    setEditingProduct(null);
  };

  // Open Add
  const handleOpenAdd = () => {
    clearForm();
    setIsModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setIsModalOpen(true);
  };

  // Create or Update Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price),
      stock: parseInt(stock)
    };

    if (isNaN(payload.price) || payload.price < 0) {
      setError("Price must be a valid positive number.");
      return;
    }
    if (isNaN(payload.stock) || payload.stock < 0) {
      setError("Stock must be a positive integer.");
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (editingProduct) {
        res = await api.updateProduct(editingProduct.id, payload);
      } else {
        res = await api.createProduct(payload);
      }

      if (res.success) {
        setSuccess(res.message);
        setIsModalOpen(false);
        clearForm();
        fetchProducts();
      } else {
        setError(res.message || "Failed to save product details.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await api.deleteProduct(id);
      if (res.success) {
        setSuccess(res.message);
        fetchProducts();
      } else {
        setError(res.message || "Failed to delete product.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter products client-side
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="tab-pane products-pane animate-fade-in">
      {/* View Header */}
      <div className="view-header">
        <div className="header-meta">
          <span className="header-breadcrumbs">Workspace / Products</span>
          <h1 className="header-title">Products Inventory Catalog</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn refresh-btn" onClick={fetchProducts} title="Refresh Catalog">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Filter by Name, SKU, Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>×</button>
          )}
        </div>

        <button className="primary-btn add-btn" onClick={handleOpenAdd}>
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* Notification Banners */}
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

      {/* Data Ingestion Grid */}
      {loading ? (
        <div className="pane-loader"><div className="spinner"></div></div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-panel-txt">No products found matching your catalog query.</div>
      ) : (
        <div className="table-responsive main-table-container">
          <table className="main-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Description</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th className="center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                let stockBadge = <span className="stock-pill in-stock">In Stock</span>;
                if (p.stock === 0) {
                  stockBadge = <span className="stock-pill out-of-stock">Out of Stock</span>;
                } else if (p.stock < 10) {
                  stockBadge = <span className="stock-pill low-stock">Low Stock</span>;
                }

                return (
                  <tr key={p.id} className="row-hover">
                    <td className="bold code">{p.sku}</td>
                    <td className="bold">{p.name}</td>
                    <td className="desc-cell" title={p.description}>{p.description || "-"}</td>
                    <td className="accent font-mono">${p.price.toFixed(2)}</td>
                    <td className="font-mono bold">{p.stock}</td>
                    <td>{stockBadge}</td>
                    <td className="center action-cells">
                      <button className="action-btn edit-icon-btn" onClick={() => handleOpenEdit(p)} title="Edit Details">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn delete-icon-btn" onClick={() => handleDelete(p.id)} title="Delete Product">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT PRODUCT DYNAMIC MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop animate-fade-in">
          <div className="modal-drawer glass-card animate-scale-up">
            <header className="modal-header">
              <h2 className="form-title">{editingProduct ? "Edit Product Details" : "Register Product"}</h2>
              <button className="close-modal-btn" onClick={() => {
                setIsModalOpen(false);
                clearForm();
              }}><X size={20} /></button>
            </header>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="input-group">
                <label className="input-label">SKU Code</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="PROD-100"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    disabled={!!editingProduct} // SKU immutable on edit
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Product Name</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Heavy Duty Brass Valve"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Description <span className="label-optional">(Optional)</span></label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Industrial grade valve, threaded, brass core"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-double-row">
                <div className="input-group">
                  <label className="input-label">Unit Price ($)</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="19.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Stock Quantity</label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      placeholder="50"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="primary-btn submit-btn" disabled={isSaving}>
                {isSaving ? (
                  <div className="spinner button-spinner"></div>
                ) : (
                  <>
                    {editingProduct ? "Save Changes" : "Create Product"} <ArrowRight size={18} />
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
