// src/pages/GymProfileForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../api/authService';
import parseApiError from '../utils/parseApiError';
import { useAuth } from '../context/AuthContext';

export default function GymProfileForm() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    photos: [],
    facilities: [],
    plans: [{ name: '', price: '', duration: 'month' }],
  });

  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const facilitiesOptions = ['Free Weights', 'Cardio Machines', 'Functional Training Area', 'Swimming Pool', 'Sauna & Steam Room', 'Locker Rooms', 'Parking', 'Wi-Fi'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      facilities: checked
        ? [...prev.facilities, value]
        : prev.facilities.filter(f => f !== value)
    }));
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (formData.photos.length + files.length > 5) {
        alert("You can only upload a maximum of 5 photos.");
        return;
    }
    setFormData((prev) => ({ ...prev, photos: [...prev.photos, ...files] }));
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...previews]);
  };

  const handlePlanChange = (index, field, value) => {
    const newPlans = [...formData.plans];
    newPlans[index][field] = value;
    setFormData((prev) => ({ ...prev, plans: newPlans }));
  };

  const addPlan = () => {
    setFormData((prev) => ({
      ...prev,
      plans: [...prev.plans, { name: '', price: '', duration: 'month' }]
    }));
  };
  
  const removePlan = (index) => {
    const newPlans = formData.plans.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, plans: newPlans }));
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setLoading(false);
          setSubmitError('');
        },
        (error) => {
          console.error("Geolocation error:", error);
          setSubmitError("Could not get location. Please enter it manually or check browser permissions.");
          setLoading(false);
        }
      );
    } else {
      setSubmitError("Geolocation is not supported by this browser.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Gym name is required.';
    if (!formData.address.trim()) newErrors.address = 'Address is required.';
    if (formData.photos.length === 0) newErrors.photos = 'Upload at least one photo.';
    if (formData.facilities.length === 0) newErrors.facilities = 'Select at least one facility.';

    const planNames = new Set();
    formData.plans.forEach((plan, index) => {
        // Name validation
        const trimmedName = plan.name.trim();
        if (!trimmedName) {
            newErrors[`planName-${index}`] = 'Plan name is required.';
        } else if (planNames.has(trimmedName.toLowerCase())) {
            newErrors[`planName-${index}`] = 'Plan names must be unique.';
        } else {
            planNames.add(trimmedName.toLowerCase());
        }

        // Duration validation
        if (!plan.duration.trim()) newErrors[`planDuration-${index}`] = 'Duration is required.';
        
        // ** MORE ROBUST PRICE VALIDATION **
        // Check if price is null, undefined, an empty string, or not a positive number.
        if (plan.price == null || plan.price === '' || isNaN(parseFloat(plan.price)) || parseFloat(plan.price) <= 0) {
            newErrors[`planPrice-${index}`] = 'A valid, positive price is required.';
        }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
        const apiPayload = {
            name: formData.name,
            address: formData.address,
            latitude: parseFloat(formData.latitude) || null,
            longitude: parseFloat(formData.longitude) || null,
            photos: formData.photos.map(file => `https://placehold.co/600x400?text=${encodeURIComponent(file.name || 'Image')}`),
            facilities: formData.facilities,
            plans: formData.plans
                .filter(plan => plan.name.trim() && plan.duration.trim() && plan.price)
                .map(p => ({ ...p, price: parseFloat(p.price) }))
        };
        
        const response = await authService.createGymProfile(apiPayload);

        if (response.success) {
            setAuthData(response.data.token, response.data.user);
            alert('✅ Gym profile submitted successfully!');
            navigate('/dashboard'); 
        } else {
            throw new Error(response.message || 'An unknown error occurred.');
        }
    } catch (err) {
        setSubmitError(parseApiError(err));
        console.error("Gym profile creation failed:", err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-700">
        <div className="bg-gray-800 text-white p-8 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-3xl font-bold">Complete Your Gym Profile</h1>
          <p className="text-gray-400 mt-2">Attract members with a professional gym listing</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {submitError && <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">{submitError}</div>}

          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Gym Name</label>
              <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className={`w-full bg-gray-800 border ${errors.name ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500`} placeholder="Elite Fitness Center" required />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">Full Address</label>
              <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} className={`w-full bg-gray-800 border ${errors.address ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500`} placeholder="e.g., 123 Fitness St, New York, NY 10001" required />
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Location Coordinates</label>
            <div className="flex items-center gap-4">
                <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} placeholder="Latitude" className={`w-full bg-gray-800 border ${errors.location ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500`} />
                <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} placeholder="Longitude" className={`w-full bg-gray-800 border ${errors.location ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500`} />
            </div>
            {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
            <button type="button" onClick={handleGetLocation} disabled={loading} className="px-4 py-2 text-sm font-medium text-teal-300 bg-teal-800/50 rounded-lg hover:bg-teal-800/80 transition-colors">
                📍 Get My Current Location
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Facilities & Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {facilitiesOptions.map((facility) => (
                <label key={facility} className="flex items-center p-3 bg-gray-800 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                  <input type="checkbox" value={facility} checked={formData.facilities.includes(facility)} onChange={handleCheckboxChange} className="h-4 w-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-500" />
                  <span className="ml-3 text-sm text-gray-200">{facility}</span>
                </label>
              ))}
            </div>
             {errors.facilities && <p className="text-red-400 text-xs mt-1">{errors.facilities}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Membership Plans</label>
            <div className="space-y-4">
              {formData.plans.map((plan, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start gap-3 p-4 bg-gray-800 border border-gray-700 rounded-lg">
                  <div className="w-full sm:w-1/3">
                    <input type="text" value={plan.name} onChange={e => handlePlanChange(index, 'name', e.target.value)} placeholder="Plan Name (e.g., Gold)" className={`w-full bg-gray-700 border ${errors[`planName-${index}`] ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3`} required />
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
                  <button type="button" onClick={() => removePlan(index)} className="text-gray-500 hover:text-red-400 font-bold text-2xl p-1 self-center transition-colors">&times;</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPlan} className="mt-4 px-4 py-2 text-sm font-medium text-teal-300 bg-teal-800/50 rounded-lg hover:bg-teal-800/80 transition-colors">+ Add Another Plan</button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Gym Photos (up to 5)</label>
            <input type="file" name="photos" onChange={handlePhotoChange} multiple accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-gray-300 hover:file:bg-gray-600"/>
            {errors.photos && <p className="text-red-400 text-xs mt-1">{errors.photos}</p>}
            {photoPreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                {photoPreviews.map((src, i) => <img key={i} src={src} alt={`Gym preview ${i+1}`} className="w-full h-24 object-cover rounded-lg"/>)}
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-gray-700">
            <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors">
              {loading ? 'Submitting...' : 'Create Gym Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}