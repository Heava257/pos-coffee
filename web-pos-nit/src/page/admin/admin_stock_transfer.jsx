import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const AdminStockTransfer = () => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qtyTransferred, setQtyTransferred] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txtSearch, setTxtSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userResponse = await axios.get("/api/users");
        setUsers(userResponse.data.list || []);
        const productResponse = await axios.get("/api/products");
        setProducts(productResponse.data.list || []);
        fetchTransfers();
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);
  useEffect(() => {
    fetchTransfers();
  }, [page, txtSearch]);
  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/admin_stock_transfer", {
        params: {
          txt_search: txtSearch,
          user_id: selectedUser || undefined,
          page: page
        }
      });
      setTransfers(response.data.list || []);
      setTotalItems(response.data.total);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      setIsLoading(false);
    }
  };
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedProduct || !qtyTransferred || qtyTransferred <= 0) {
      alert("Please fill in all fields with valid values");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post("/api/admin_stock_transfer", {
        user_id: selectedUser,
        product_id: selectedProduct,
        qty_transferred: qtyTransferred
      });
      alert("Stock transfer successful!");
      setSelectedUser("");
      setSelectedProduct("");
      setQtyTransferred("");
      fetchTransfers();
    } catch (error) {
      console.error("Error transferring stock:", error);
      alert("Stock transfer failed: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransfers();
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transfer?")) {
      return;
    }
    try {
      await axios.delete(`/api/admin_stock_transfer/${id}`);
      alert("Transfer deleted successfully!");
      fetchTransfers();
    } catch (error) {
      console.error("Error deleting transfer:", error);
      alert("Failed to delete transfer");
    }
  };
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Admin - Stock Transfer</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by product name or barcode"
            value={txtSearch}
            onChange={(e) => setTxtSearch(e.target.value)}
            className="border p-2 rounded flex-grow"
          />
          <select 
            value={selectedUser} 
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            Search
          </button>
        </form>
      </div>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-xl font-semibold mb-4">Create New Transfer</h3>
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block mb-1">Select User:</label>
            <select 
              value={selectedUser} 
              onChange={(e) => setSelectedUser(e.target.value)} 
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Choose User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Select Product:</label>
            <select 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)} 
              className="w-full border p-2 rounded"
              required
            >
              <option value="">Choose Product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.barcode} ({product.qty} in stock)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1">Quantity:</label>
            <input
              type="number"
              value={qtyTransferred}
              onChange={(e) => setQtyTransferred(e.target.value)}
              className="w-full border p-2 rounded"
              min="1"
              required
            />
          </div>
          <button 
            type="submit" 
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Transfer Stock"}
          </button>
        </form>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">Transfer History</h3>
        {isLoading ? (
          <p className="text-center p-4">Loading...</p>
        ) : transfers.length === 0 ? (
          <p className="text-center p-4">No transfers found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="custom-table w-full">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th>Brand</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td>{transfer.id}</td>
                      <td>{users.find(u => u.id === transfer.user_id)?.name || transfer.user_id}</td>
                      <td>{transfer.name}</td>
                      <td>{transfer.barcode}</td>
                      <td>{transfer.brand}</td>
                      <td>{transfer.qty_transferred}</td>
                      <td>{new Date(transfer.date_transferred).toLocaleDateString()}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(transfer.id)} 
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span>
                Showing {transfers.length} of {totalItems} entries
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="border px-3 py-1 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">Page {page}</span>
                <button 
                  onClick={() => setPage(page + 1)}
                  disabled={transfers.length < 2} // Using pageSize from backend
                  className="border px-3 py-1 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default AdminStockTransfer;