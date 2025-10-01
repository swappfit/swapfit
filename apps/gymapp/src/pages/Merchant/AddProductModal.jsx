// src/pages/Merchant/AddProductModal.jsx

import { useState } from 'react';

const CATEGORIES = ["Supplements", "Equipment", "Accessories", "Apparel"];

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: CATEGORIES[0],
    images: [], // To match your schema
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!formData.name || !formData.price || !formData.stock || !formData.category) {
        throw new Error("Please fill in all required fields.");
      }
      
      // Prepare the payload, ensuring price and stock are numbers
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        // For now, we'll send an empty array for images. Image upload is a separate feature.
        images: [], 
      };

      await onProductAdded(payload);
      onClose(); // Close modal on success
      
      // Reset form for next time
      setFormData({ name: '', description: '', price: '', stock: '', category: CATEGORIES[0], images: [] });

    } catch (err) {
      setError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in-fast">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl border border-gray-700 text-white">
        <h3 className="text-xl font-bold mb-6">Add New Product</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg text-sm">{error}</p>}
          
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Product Description (Optional)" className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 h-24 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          
          <div className="grid grid-cols-2 gap-4">
            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price ($)" step="0.01" className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock Quantity" step="1" className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          
          <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          {/* We will add an image uploader here in a future step */}
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-semibold py-2 px-5 rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-500 font-semibold py-2 px-5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}