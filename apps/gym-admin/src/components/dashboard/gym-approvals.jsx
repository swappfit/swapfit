// src/components/dashboard/gym-approvals.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getGymsForBadging, getMultiGymTiers, assignGymToTier } from '../../api/adminService';

export function GymBadgingManagement() {
  const [gyms, setGyms] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedTier, setSelectedTier] = useState('');
  const [assigningTier, setAssigningTier] = useState(false);

  // Fetch gyms and tiers on component mount
  useEffect(() => {
    console.log('🏋️ [Gym Badging] Component mounted, fetching data...');
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch gyms that have opted in for multi-gym access
        console.log('🏋️ [Gym Badging] Fetching gyms...');
        const gymsResponse = await getGymsForBadging();
        console.log('🏋️ [Gym Badging] Gyms response:', gymsResponse);
        
        if (gymsResponse.success) {
          setGyms(gymsResponse.data);
          console.log('🏋️ [Gym Badging] Gyms set in state:', gymsResponse.data);
        } else {
          console.error('🏋️ [Gym Badging] Failed to fetch gyms:', gymsResponse.message);
          toast.error(gymsResponse.message || 'Failed to fetch gyms.');
        }
        
        // Fetch available tiers
        console.log('🏆 [Gym Badging] Fetching tiers...');
        const tiersResponse = await getMultiGymTiers();
        console.log('🏆 [Gym Badging] Tiers response:', tiersResponse);
        
        if (tiersResponse.success) {
          setTiers(tiersResponse.data);
          console.log('🏆 [Gym Badging] Tiers set in state:', tiersResponse.data);
        } else {
          console.error('🏆 [Gym Badging] Failed to fetch tiers:', tiersResponse.message);
          toast.error(tiersResponse.message || 'Failed to fetch tiers.');
        }
      } catch (error) {
        console.error('🏋️ [Gym Badging] Failed to fetch data:', error);
        toast.error('An error occurred while fetching data. Please try again.');
      } finally {
        setLoading(false);
        console.log('🏋️ [Gym Badging] Data fetching completed');
      }
    };

    fetchData();
  }, []);

  // Handle tier assignment
  const handleAssignTier = async () => {
    console.log('🏷️ [Gym Badging] Assigning tier:', { selectedGym, selectedTier });
    
    if (!selectedGym || !selectedTier) {
      console.error('🏷️ [Gym Badging] Missing gym or tier selection');
      toast.error('Please select a gym and a tier.');
      return;
    }

    try {
      setAssigningTier(true);
      console.log('🏷️ [Gym Badging] Sending assignment request...');
      const response = await assignGymToTier(selectedGym, selectedTier);
      console.log('🏷️ [Gym Badging] Assignment response:', response);
      
      if (response.success) {
        toast.success(`Gym assigned to ${selectedTier} tier successfully.`);
        
        // Update the gym in the local state
        setGyms(prevGyms => {
          const updatedGyms = prevGyms.map(gym => 
            gym.id === selectedGym 
              ? { ...gym, tier: selectedTier } 
              : gym
          );
          console.log('🏷️ [Gym Badging] Updated gyms state:', updatedGyms);
          return updatedGyms;
        });
        
        // Reset selection
        setSelectedGym(null);
        setSelectedTier('');
      } else {
        console.error('🏷️ [Gym Badging] Assignment failed:', response.message);
        toast.error(response.message || 'Failed to assign tier.');
      }
    } catch (error) {
      console.error('🏷️ [Gym Badging] Failed to assign tier:', error);
      toast.error('An error occurred while assigning tier. Please try again.');
    } finally {
      setAssigningTier(false);
    }
  };

  if (loading) {
    console.log('🏋️ [Gym Badging] Component in loading state');
    return <div className="flex justify-center items-center h-64">Loading gyms...</div>;
  }

  console.log('🏋️ [Gym Badging] Rendering component with:', { gyms, tiers });
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gym Badging Management</h1>
      
      {/* Tier Assignment Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Assign Tier to Gym</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Gym</label>
            <select
              value={selectedGym || ''}
              onChange={(e) => {
                console.log('🏋️ [Gym Badging] Gym selection changed:', e.target.value);
                setSelectedGym(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="">Select a gym</option>
              {gyms.map(gym => (
                <option key={gym.id} value={gym.id}>
                  {gym.name} {gym.tier && `(${gym.tier})`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => {
                console.log('🏆 [Gym Badging] Tier selection changed:', e.target.value);
                setSelectedTier(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
            >
              <option value="">Select a tier</option>
              {tiers.map(tier => (
                <option key={tier.id} value={tier.name}>
                  {tier.name} - ${tier.price}/month
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                console.log('🏷️ [Gym Badging] Assign button clicked');
                handleAssignTier();
              }}
              disabled={assigningTier || !selectedGym || !selectedTier}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {assigningTier ? 'Assigning...' : 'Assign Tier'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Gyms List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Gyms Opted In for Multi-Gym Access</h2>
        </div>
        
        {gyms.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No gyms have opted in for multi-gym access yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Gym Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Tier
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {gyms.map(gym => (
                  <tr key={gym.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {gym.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {gym.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {gym.manager?.memberProfile?.name || gym.manager?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        gym.tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                        gym.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                        gym.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {gym.tier || 'Not Assigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}