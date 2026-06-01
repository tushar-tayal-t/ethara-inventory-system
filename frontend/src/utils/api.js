const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const setAuthData = (token, customer) => {
  localStorage.setItem("token", token);
  localStorage.setItem("customer", JSON.stringify(customer));
};

export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("customer");
};

async function request(endpoint, options = {}) {
  let url = `${API_BASE_URL}${endpoint}`;
  if (options.method === "GET") {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}_t=${Date.now()}`;
  }

  const headers = { ...options.headers };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.method === "GET") {
    headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    headers["Pragma"] = "no-cache";
    headers["Expires"] = "0";
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json();

    if (!response.ok) {
      let errorMessage = "An unexpected error occurred.";
      if (result && result.detail) {
        if (typeof result.detail === "string") {
          errorMessage = result.detail;
        } else if (result.detail.message) {
          errorMessage = result.detail.message;
        } else if (Array.isArray(result.detail)) {
          errorMessage = result.detail
            .map((err) => `${err.loc.join(" -> ")}: ${err.msg}`)
            .join("; ");
        }
      } else if (result && result.message) {
        errorMessage = result.message;
      }
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  registerCustomer: async (customerData) => {
    const result = await request("/customers/", {
      method: "POST",
      body: JSON.stringify(customerData),
    });
    if (result.success && result.data?.token) {
      setAuthData(result.data.token, result.data.customer);
    }
    return result;
  },

  loginCustomer: async (loginData) => {
    const result = await request("/customers/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });
    if (result.success && result.data?.token) {
      setAuthData(result.data.token, result.data.customer);
    }
    return result;
  },

  getCurrentUser: () => {
    const data = localStorage.getItem("customer");
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  },

  checkServerHealth: async () => {
    const rootUrl = API_BASE_URL.replace("/api/v1", "") || "http://localhost:8000";
    const response = await fetch(rootUrl, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error("Server responded with error status");
    }
    return await response.json();
  },

  getAnalyticsSummary: async () => {
    return await request("/analytics/summary", {
      method: "GET",
    });
  },

  getProducts: async () => {
    return await request("/products/", {
      method: "GET",
    });
  },

  createProduct: async (productData) => {
    return await request("/products/", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (id, productData) => {
    return await request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (id) => {
    return await request(`/products/${id}`, {
      method: "DELETE",
    });
  },

  getCustomers: async () => {
    return await request("/customers/", {
      method: "GET",
    });
  },

  getOrders: async () => {
    return await request("/orders/", {
      method: "GET",
    });
  },

  createOrder: async (orderData) => {
    return await request("/orders/", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  },

  deleteOrder: async (id) => {
    return await request(`/orders/${id}`, {
      method: "DELETE",
    });
  },

  updateOrderStatus: async (id, status) => {
    return await request(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  validateImport: async (type, formData) => {
    return await request(`/${type}/import/validate`, {
      method: "POST",
      body: formData,
    });
  },

  commitImport: async (type, formData) => {
    return await request(`/${type}/import`, {
      method: "POST",
      body: formData,
    });
  }
};
