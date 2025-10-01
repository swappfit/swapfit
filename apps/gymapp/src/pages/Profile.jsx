// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as trainerService from '../api/trainerService';
import * as userService from '../api/userService';
import parseApiError from '../utils/parseApiError';

export default function Profile() {
  const { user } = useAuth(); // Get the authenticated user object
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({}); // For the edit modal
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ✅ CORRECTED useEffect
  useEffect(() => {
    // Define the async function to fetch data
    const fetchProfile = async () => {
      // We need user.id to make the API call, so we wait until it's available.
      if (user && user.id) { 
        try {
          setLoading(true);
          setError('');
          
          // Make the API call
          const response = await trainerService.getMyProfile(user.id);

          if (response.success) {
            setProfileData(response.data);
            // Pre-fill the form state for the "Edit" modal
            setFormData({
              bio: response.data.bio || '',
              experience: response.data.experience || 0,
              // gallery will be handled separately
            });
          }
        } catch (err) {
          setError(parseApiError(err));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]); // This effect re-runs whenever the user object changes.

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      // For now, we only submit the text fields. Image uploads are a separate topic.
      const updatePayload = {
          bio: formData.bio,
          experience: parseInt(formData.experience, 10),
      };

      const response = await userService.updateMyProfile(updatePayload);
      if (response.success) {
        setProfileData(response.data); // Update the main view with the new data
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      setError(parseApiError(err)); // Show errors inside the modal
    } finally {
      setSaving(false);
    }
  };

  // Other handlers (handleEdit, handleClose, handleChange, etc.) are unchanged
  const handleEdit = () => {
    if (!profileData) return;
    setFormData({
        bio: profileData.bio || '',
        experience: profileData.experience || 0,
    });
    setIsEditing(true);
  };
  const handleClose = () => setIsEditing(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // --- UI State Rendering ---
  
  if (loading) {
    return <div className="text-center p-8">Loading Profile...</div>;
  }

  // Show error only if not in editing mode (modal has its own error display)
  if (error && !isEditing) {
    return <div className="p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>;
  }

  if (!profileData) {
    return <div className="text-center p-8">Could not load your profile data. Try refreshing the page.</div>;
  }

  // --- Main JSX ---

  return (
    <div className="animate-fade-in">
      <div className="mb-8"><h1 className="text-3xl font-bold text-gray-800">👤 Your Profile</h1><p className="text-gray-600 mt-2">Manage your public trainer profile and credentials</p></div>
      
      <div className="bg-white/90 rounded-3xl shadow-2xl border mb-8">
        <div className="h-40 bg-gradient-to-r from-blue-500 to-emerald-600 relative rounded-t-3xl">
          <button onClick={handleEdit} className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
            ✏ Edit Profile
          </button>
        </div>
        <div className="px-8 pb-8 relative -mt-16">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden">
              <img src={profileData.gallery?.[0] || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{profileData.user.email}</h2>
              <p className="text-gray-600 mt-2 leading-relaxed max-w-2xl">{profileData.bio}</p>
              <div className="flex flex-wrap gap-6 mt-6 text-sm">
                <div className="text-center"><div className="font-bold text-gray-800">{profileData.experience || 0} yrs</div><div className="text-gray-500">Experience</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">✏ Edit Profile</h3>
            <form onSubmit={handleSave} className="space-y-6">
              {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="w-full border border-gray-300 rounded-xl px-4 py-2.5" />
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={handleClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-600 text-white py-3 rounded-xl font-semibold disabled:opacity-70">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}