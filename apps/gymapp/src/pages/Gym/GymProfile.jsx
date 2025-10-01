// src/components/GymProfile.jsx
import React, { useState, useEffect } from "react";
import { getMyGymProfile } from "../../api/gymService";
import apiClient from "../../api/apiClient";

/**
 * GymProfile component – defensive and robust:
 * - Handles different response shapes from the backend
 * - Guards against undefined arrays (facilities/plans/photos)
 * - Logs raw responses for debugging
 */
export default function GymProfile() {
  const [gymDetails, setGymDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugPayload, setDebugPayload] = useState(null); // dev-only inspect

  useEffect(() => {
    const fetchGym = async () => {
      setLoading(true);
      try {
        const data = await getMyGymProfile();
        // log raw for debug
        console.log("[GymProfile] normalized gym payload:", data);
        setDebugPayload(data);

        // ensure defaults for arrays/optional fields
        const normalized = {
          id: data?.id ?? null,
          name: data?.name ?? "",
          address: data?.address ?? "",
          contact: data?.contact ?? "",
          email: data?.email ?? "",
          established: data?.established ?? "",
          description: data?.description ?? "",
          photos: Array.isArray(data?.photos) ? data.photos : [],
          facilities: Array.isArray(data?.facilities) ? data.facilities : [],
          plans: Array.isArray(data?.plans) ? data.plans : [],
          ...data, // keep any other fields
        };

        setGymDetails(normalized);
        setFormData(JSON.parse(JSON.stringify(normalized))); // deep clone
      } catch (error) {
        console.error("Error fetching gym profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGym();
  }, []);

  const handleEdit = () => {
    setFormData(JSON.parse(JSON.stringify(gymDetails || {
      facilities: [], photos: [], plans: []
    })));
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilitiesChange = (index, value) => {
    const arr = Array.isArray(formData.facilities) ? [...formData.facilities] : [];
    arr[index] = value;
    setFormData(prev => ({ ...prev, facilities: arr }));
  };

  const handleAddFacility = () => {
    const arr = Array.isArray(formData.facilities) ? [...formData.facilities] : [];
    arr.push("");
    setFormData(prev => ({ ...prev, facilities: arr }));
  };

  const handleRemoveFacility = (index) => {
    const arr = Array.isArray(formData.facilities) ? [...formData.facilities] : [];
    arr.splice(index, 1);
    setFormData(prev => ({ ...prev, facilities: arr }));
  };

  const handleSave = async () => {
    try {
      // backend might return { success, data } — normalize it here
      const resp = await apiClient.put("/gyms/owner/my-profile", formData);
      const payload = resp?.data ?? resp;
      const updatedGym = payload?.data ?? payload;
      console.log("[GymProfile] update response (raw):", resp, "normalized:", updatedGym);

      const normalized = {
        id: updatedGym?.id ?? gymDetails?.id,
        name: updatedGym?.name ?? gymDetails?.name,
        address: updatedGym?.address ?? gymDetails?.address,
        contact: updatedGym?.contact ?? gymDetails?.contact,
        email: updatedGym?.email ?? gymDetails?.email,
        established: updatedGym?.established ?? gymDetails?.established,
        description: updatedGym?.description ?? gymDetails?.description,
        photos: Array.isArray(updatedGym?.photos) ? updatedGym.photos : (gymDetails?.photos || []),
        facilities: Array.isArray(updatedGym?.facilities) ? updatedGym.facilities : (gymDetails?.facilities || []),
        plans: Array.isArray(updatedGym?.plans) ? updatedGym.plans : (gymDetails?.plans || []),
        ...updatedGym,
      };

      setGymDetails(normalized);
      setFormData(JSON.parse(JSON.stringify(normalized)));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating gym profile:", error);
      // optionally show UI feedback to user
    }
  };

  if (loading) {
    return <div className="text-white text-center py-10">Loading gym profile...</div>;
  }

  if (!gymDetails) {
    return <div className="text-red-500 text-center py-10">No gym profile found.</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gym Profile</h1>
          <p className="text-gray-400">Manage your gym’s identity and amenities</p>
        </div>
        <button
          onClick={handleEdit}
          className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2 rounded-lg shadow-md transition"
        >
          Edit Details
        </button>
      </div>

      {/* Gym Info */}
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg mb-10">
        <h2 className="text-xl font-semibold text-teal-400 mb-4">{gymDetails.name || "-"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
          <p><span className="font-medium text-white"> Address:</span> {gymDetails.address || "-"}</p>
          <p><span className="font-medium text-white"> Contact:</span> {gymDetails.contact || "-"}</p>
          <p><span className="font-medium text-white"> Email:</span> {gymDetails.email || "-"}</p>
          <p><span className="font-medium text-white"> Established:</span> {gymDetails.established || "-"}</p>
        </div>
        <div className="mt-6">
          <h3 className="text-white font-semibold mb-2"> Description</h3>
          <p className="text-gray-300 text-sm">{gymDetails.description || "-"}</p>
        </div>
      </div>

      {/* Facilities Section */}
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg mb-10">
        <h2 className="text-white text-lg font-semibold mb-4"> Facilities</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
          {(gymDetails.facilities || []).length === 0 ? (
            <li className="text-gray-500">No facilities added yet.</li>
          ) : (
            (gymDetails.facilities || []).map((facility, index) => (
              <li key={index} className="bg-gray-800 rounded-md px-4 py-2 shadow-sm">{facility}</li>
            ))
          )}
        </ul>
      </div>

      {/* Plans Section */}
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg mb-10">
        <h2 className="text-white text-lg font-semibold mb-4"> Plans</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
          {(gymDetails.plans || []).length === 0 ? (
            <li className="text-gray-500">No plans added yet.</li>
          ) : (
            (gymDetails.plans || []).map((plan) => (
              <li key={plan.id ?? plan.name} className="bg-gray-800 rounded-md px-4 py-2 shadow-sm">
                {plan.name} - {plan.price} INR / {plan.duration}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-xl shadow-lg overflow-auto max-h-[90vh]">
            <h2 className="text-white text-xl font-semibold mb-4">Edit Gym Details</h2>
            <div className="space-y-3 text-sm text-gray-300">
              <input name="name" value={formData.name || ""} onChange={handleChange} className="w-full bg-gray-800 text-white px-4 py-2 rounded-md" />
              <input name="address" value={formData.address || ""} onChange={handleChange} className="w-full bg-gray-800 text-white px-4 py-2 rounded-md" />
              <input name="contact" value={formData.contact || ""} onChange={handleChange} className="w-full bg-gray-800 text-white px-4 py-2 rounded-md" />
              <input name="email" value={formData.email || ""} onChange={handleChange} className="w-full bg-gray-800 text-white px-4 py-2 rounded-md" />
              <input name="established" value={formData.established || ""} onChange={handleChange} className="w-full bg-gray-800 text-white px-4 py-2 rounded-md" />
              <textarea name="description" value={formData.description || ""} onChange={handleChange} className="w-full bg-gray-800 text-white px-4 py-2 rounded-md" rows={3} />

              <div>
                <h3 className="text-white font-semibold mb-2">Facilities</h3>
                {(formData.facilities || []).map((facility, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      value={facility}
                      onChange={(e) => handleFacilitiesChange(index, e.target.value)}
                      className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-md"
                    />
                    <button type="button" onClick={() => handleRemoveFacility(index)} className="bg-red-600 px-3 rounded-md">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={handleAddFacility} className="bg-teal-600 px-3 py-2 rounded-md">Add Facility</button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsEditing(false)} className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-md">Cancel</button>
              <button onClick={handleSave} className="bg-teal-600 hover:bg-teal-500 text-white text-sm px-4 py-2 rounded-md">Save Changes</button>
            </div>

            {/* dev-only: show raw payload for debugging */}
            <details className="mt-4 text-sm text-gray-400">
              <summary className="cursor-pointer">Raw payload (debug)</summary>
              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(debugPayload || gymDetails, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
