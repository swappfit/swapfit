// src/pages/Merchant/MerchantProductsPage.jsx

import React, { useState, useEffect } from 'react';
import * as productService from '../../api/productService';
import { useAuth } from '../../context/AuthContext';
import AddProductModal from './AddProductModal';

const CATEGORIES = ["All", "Supplements", "Equipment", "Accessories", "Apparel"];

export default function MerchantProductsPage() {
  const { setAuthData } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // ✅ NEW: State for showing success/error feedback messages to the user
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ UPDATED: Added detailed logging to trace the fetch process
  const fetchProducts = async () => {
    console.log("🔄 [FRONTEND] fetchProducts: Starting to fetch products...");
    try {
      setLoading(true);
      setError('');
      const response = await productService.getMyProducts();
      console.log("✅ [FRONTEND] fetchProducts: API call successful.", response);
      if (response.success) {
        setProducts(response.data);
        console.log("✅ [FRONTEND] fetchProducts: Product state updated with", response.data.length, "products.");
      } else {
        // Handle cases where the API returns a success: false
        throw new Error(response.message || "Failed to fetch products.");
      }
    } catch (err) {
      console.error("❌ [FRONTEND] fetchProducts: An error occurred.", err);
      setError("Failed to fetch products.");
    } finally {
      setLoading(false);
      console.log("🏁 [FRONTEND] fetchProducts: Finished.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ UPDATED: Added detailed logging and user feedback
  const handleAddProduct = async (productData) => {
    console.log("🚀 [FRONTEND] handleAddProduct: Starting product creation with data:", productData);
    try {
      // Clear any previous feedback messages
      setFeedbackMessage({ type: '', text: '' });

      const response = await productService.addMyProduct(productData);
      console.log("✅ [FRONTEND] handleAddProduct: API call successful.", response);

      if (response.success) {
        // Show a success message to the user
        setFeedbackMessage({ type: 'success', text: 'Product created successfully!' });
        
        // Update auth data (if necessary)
        setAuthData(response.data.token, response.data.user);
        
        // Re-fetch the product list from the server to show the new product
        console.log("🔄 [FRONTEND] handleAddProduct: Re-fetching products to update the list...");
        await fetchProducts();

        // Hide the success message after 3 seconds
        setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 3000);

      } else {
        throw new Error(response.message || "Failed to create product.");
      }
    } catch (err) {
      console.error("❌ [FRONTEND] handleAddProduct: An error occurred.", err);
      // Show an error message to the user
      setFeedbackMessage({ type: 'error', text: 'Failed to create product. Please try again.' });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
        console.log(`🗑️ [FRONTEND] handleDeleteProduct: Attempting to delete product ${productId}`);
        try {
            const response = await productService.deleteMyProduct(productId);
            if (response.success) {
                setAuthData(response.data.token, response.data.user);
                fetchProducts(); // Re-fetch products to update the list
            }
        } catch (err) {
            setError("Failed to delete product.");
            console.error(err);
        }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full animate-fade-in">
      {/* ✅ NEW: Feedback Message Display */}
      {feedbackMessage.text && (
        <div className={`text-center p-3 mb-4 rounded-lg mx-6 ${
          feedbackMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {feedbackMessage.text}
        </div>
      )}

      <AddProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProductAdded={handleAddProduct}
      />

      {/* Header */}
      <div className="bg-transparent p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Product Catalog</h2>
            <p className="text-gray-300">Manage all your listed products</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            + Add New Product
          </button>
        </div>
        
        {/* Filters */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-40"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-6 pb-8">
        {loading && <p className="text-center text-gray-400">Loading products...</p>}
        {error && <p className="text-center text-red-400">{error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-gray-800 p-5 rounded-xl shadow-xl border border-gray-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-end items-start mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      product.stock > 0 ? "bg-green-600 text-green-100" : "bg-red-600 text-red-100"
                    }`}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                    </span>
                  </div>

                  <div className="flex justify-center mb-4 h-20">
                    <img 
                      src={product.images && product.images[0] ? product.images[0] : `https://via.placeholder.com/80/FFFFFF?text=${product.name.substring(0,2)}`} 
                      alt={product.name} 
                      className="w-20 h-20 object-contain" 
                    />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 h-10">{product.name}</h3>
                  <p className="text-teal-400 font-bold text-lg">${product.price.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs mb-4">{product.category}</p>
                </div>

                <div className="flex gap-2 w-full mt-4">
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition">
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs py-2 px-3 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && products.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            <h3 className="text-lg font-semibold">No products yet!</h3>
            <p>Click "Add New Product" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}