// src/pages/Merchant/AddProductModal.jsx

import { useState } from 'react';

// Your Cloudinary configuration
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dlaij1gcp/image/upload';
const UPLOAD_PRESET = 'rn_unsigned';

export default function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Supplements', // Default to first category
    images: [], 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for image upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file selection and upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // For immediate preview

      // Start upload process
      setUploadingImage(true);
      setError('');

      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', UPLOAD_PRESET);

      try {
        const response = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: data,
        });
        const imageData = await response.json();
        
        if (imageData.secure_url) {
          // On success, update form data with image URL
          setFormData(prev => ({ ...prev, images: [imageData.secure_url] }));
        } else {
          throw new Error('Image upload failed.');
        }
      } catch (err) {
        console.error("Cloudinary upload error:", err);
        setError(err.message || "Failed to upload image.");
        // Reset on failure
        setImageFile(null);
        setImagePreview('');
        setFormData(prev => ({ ...prev, images: [] }));
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!formData.name || !formData.price || !formData.stock || !formData.category) {
        throw new Error("Please fill in all required fields.");
      }
      
      // The images array is now populated from upload
      if (formData.images.length === 0) {
        throw new Error("Please upload a product image.");
      }
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
      };

      await onProductAdded(payload);
      onClose(); // Close modal on success
      
      // Reset form for next time
      setFormData({ name: '', description: '', price: '', stock: '', category: 'Supplements', images: [] });
      setImageFile(null);
      setImagePreview('');

    } catch (err) {
      setError(err.message || "Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fade-in-fast p-4">
      <div className="bg-gray-800 rounded-xl p-4 w-full max-w-md shadow-2xl border border-gray-700 text-white max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Add New Product</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-red-400 bg-red-900/50 p-2 rounded-lg text-sm">{error}</p>}
          
          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Product Image</label>
            <input 
              type="file" 
              onChange={handleImageChange} 
              accept="image/*" 
              className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700"
            />
            {uploadingImage && <p className="text-teal-400 text-sm mt-1">Uploading image...</p>}
            {imagePreview && !uploadingImage && (
              <div className="mt-2 flex justify-center">
                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
              </div>
            )}
          </div>

          <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Product Description (Optional)" className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 h-20 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          
          <div className="grid grid-cols-2 gap-2">
            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price ($)" step="0.01" className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            <input type="number" name="stock" value={formData.stock} onChange={handleChange} placeholder="Stock Quantity" step="1" className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          
          <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {["Supplements", "Equipment", "Accessories", "Apparel"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 font-semibold py-2 px-4 rounded-lg transition">Cancel</button>
            <button type="submit" disabled={loading || uploadingImage} className="bg-teal-600 hover:bg-teal-500 font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}