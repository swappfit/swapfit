// src/pages/TrainerProfileForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../api/authService';
import parseApiError from '../utils/parseApiError';
import { useAuth } from '../context/AuthContext';
import { uploadMultipleImages } from '../utils/cloudinary';

export default function TrainerProfileForm() {
  const [formData, setFormData] = useState({
    bio: '',
    experience: '',
    gallery: [],
    plans: [{ name: '', price: '', duration: 'month' }],
  });

  const { setAuthData } = useAuth();
  const navigate = useNavigate();
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (formData.gallery.length + files.length > 5) {
        alert("You can only upload a maximum of 5 photos.");
        return;
    }
    setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, ...files] }));
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...previews]);
  };

  const removePhoto = (index) => {
    const newGallery = [...formData.gallery];
    const newPreviews = [...photoPreviews];
    
    newGallery.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData(prev => ({ ...prev, gallery: newGallery }));
    setPhotoPreviews(newPreviews);
  };

  const addPlan = () => {
    setFormData((prev) => ({ ...prev, plans: [...prev.plans, { name: '', price: '', duration: 'month' }] }));
  };

  const handlePlanChange = (index, field, value) => {
    const newPlans = [...formData.plans];
    newPlans[index][field] = value;
    setFormData((prev) => ({ ...prev, plans: newPlans }));
  };

  const removePlan = (index) => {
    const newPlans = formData.plans.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, plans: newPlans }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.bio.trim() || formData.bio.length < 50) newErrors.bio = 'A detailed bio of at least 50 characters is required.';
    if (formData.experience == null || formData.experience === '' || parseInt(formData.experience, 10) < 0) newErrors.experience = 'Please enter a valid number of years.';
    if (formData.gallery.length === 0) newErrors.gallery = 'Upload at least one photo.';

    const planNames = new Set();
    formData.plans.forEach((plan, index) => {
        const trimmedName = plan.name.trim();
        if (!trimmedName) {
            newErrors[`planName-${index}`] = 'Plan name is required.';
        } else if (planNames.has(trimmedName.toLowerCase())) {
            newErrors[`planName-${index}`] = 'Plan names must be unique.';
        } else {
            planNames.add(trimmedName.toLowerCase());
        }
        if (plan.price == null || plan.price === '' || isNaN(parseFloat(plan.price)) || parseFloat(plan.price) <= 0) {
            newErrors[`planPrice-${index}`] = 'A valid, positive price is required.';
        }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (validate()) {
      setLoading(true);
      try {
        // First upload images to Cloudinary
        setUploadingImages(true);
        let uploadedGallery = [];
        
        if (formData.gallery.length > 0) {
          try {
            uploadedGallery = await uploadMultipleImages(formData.gallery);
            console.log('Images uploaded successfully:', uploadedGallery);
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError);
            setErrors({ submit: 'Failed to upload images. Please try again.' });
            setLoading(false);
            setUploadingImages(false);
            return;
          }
        }
        
        setUploadingImages(false);

        const apiPayload = {
          bio: formData.bio,
          experience: parseInt(formData.experience, 10),
          gallery: uploadedGallery, // Use the uploaded image URLs
          plans: formData.plans
            .filter(p => p.name && p.price && parseFloat(p.price) > 0)
            .map(p => ({ ...p, price: parseFloat(p.price) }))
        };

        const response = await authService.createTrainerProfile(apiPayload);

        if (response.success) {
          setAuthData(response.data.token, response.data.user);
          alert('✅ Trainer profile submitted successfully!');
          navigate('/dashboard'); 
        } else {
          throw new Error(response.message || 'An unknown error occurred.');
        }
      } catch (err) {
        setErrors({ submit: parseApiError(err) });
        console.error("Profile creation failed:", err);
      } finally {
        setLoading(false);
        setUploadingImages(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto bg-gray-900 rounded-2xl shadow-xl border border-gray-700">
        <div className="bg-gray-800 text-white p-8 text-center">
          <h1 className="text-3xl font-bold">Create Your Trainer Profile</h1>
          <p className="text-gray-400 mt-2">Showcase your expertise to attract new clients.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {errors.submit && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg">{errors.submit}</div>}

          <div className="space-y-6">
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Your Bio</label>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows="5" className={`w-full bg-gray-800 border ${errors.bio ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500`} placeholder="Tell potential clients about your training philosophy, specialties..." required />
              {errors.bio && <p className="text-red-400 text-xs mt-1">{errors.bio}</p>}
            </div>
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
              <input id="experience" name="experience" type="number" value={formData.experience} onChange={handleChange} className={`w-full bg-gray-800 border ${errors.experience ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500`} placeholder="e.g., 5" required />
              {errors.experience && <p className="text-red-400 text-xs mt-1">{errors.experience}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Gallery (up to 5 images)</label>
            <input type="file" name="gallery" onChange={handlePhotoChange} multiple accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"/>
            {errors.gallery && <p className="text-red-400 text-xs mt-1">{errors.gallery}</p>}
            {photoPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt={`Gallery preview ${i+1}`} className="w-full h-24 object-cover rounded-lg"/>
                    <button 
                      type="button" 
                      onClick={() => removePhoto(i)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Your Coaching Plans</label>
            <div className="space-y-4">
              {formData.plans.map((plan, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start gap-3 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <div className="w-full sm:w-1/3">
                    <input type="text" value={plan.name} onChange={e => handlePlanChange(index, 'name', e.target.value)} placeholder="Plan Name" className={`w-full bg-gray-700 border ${errors[`planName-${index}`] ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3`} required />
                    {errors[`planName-${index}`] && <p className="text-red-400 text-xs mt-1">{errors[`planName-${index}`]}</p>}
                  </div>
                  <div className="w-full sm:w-1/3">
                    <select 
                      value={plan.duration} 
                      onChange={e => handlePlanChange(index, 'duration', e.target.value)} 
                      className={`w-full bg-gray-700 border ${errors[`planDuration-${index}`] ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3 appearance-none`} 
                      required
                    >
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                      <option value="week">Week</option>
                      <option value="day">Day</option>
                    </select>
                    {errors[`planDuration-${index}`] && <p className="text-red-400 text-xs mt-1">{errors[`planDuration-${index}`]}</p>}
                  </div>
                  <div className="w-full sm:w-1/3">
                    <input type="number" value={plan.price} onChange={e => handlePlanChange(index, 'price', e.target.value)} placeholder="Price ($)" className={`w-full bg-gray-700 border ${errors[`planPrice-${index}`] ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3`} required />
                    {errors[`planPrice-${index}`] && <p className="text-red-400 text-xs mt-1">{errors[`planPrice-${index}`]}</p>}
                  </div>
                  <button type="button" onClick={() => removePlan(index)} className="text-gray-500 hover:text-red-400 font-bold text-2xl p-1 self-center">&times;</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPlan} className="mt-4 px-4 py-2 text-sm font-medium text-teal-300 bg-teal-800/50 rounded-lg hover:bg-teal-800/80">+ Add a Plan</button>
          </div>

          <div className="pt-5 border-t border-gray-700">
            <button type="submit" disabled={loading || uploadingImages} className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg">
              {loading ? 'Saving Profile...' : uploadingImages ? 'Uploading Images...' : 'Publish Trainer Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}