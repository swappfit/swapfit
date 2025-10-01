// src/pages/Members.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as gymService from '../api/gymService';
import parseApiError from '../utils/parseApiError';

export default function Members() {
  const { gymProfile } = useAuth(); // Get the gym profile from the context
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // For debugging: Let's see what the component sees from the context
    console.log("[Members.jsx] useEffect triggered. gymProfile from context:", gymProfile);

    // If the gymProfile object isn't available yet, we wait.
    // The effect will re-run when gymProfile is populated.
    if (!gymProfile) {
        console.log("[Members.jsx] No gym profile found in context yet. Waiting...");
        // If the main auth loading is done and there's still no profile, stop the spinner.
        // This handles the case of a non-gym-owner somehow landing here.
        setLoading(false);
        return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError('');
        
        console.log(`[Members.jsx] gymProfile found! Fetching members for gym ID: ${gymProfile.id}`);
        
        // Pass the gym's ID to the service function
        const response = await gymService.getGymMembers(gymProfile.id);
        
        if (response.success) {
          console.log("[Members.jsx] Successfully fetched members:", response.data);
          // Map the backend data to a flat structure for easier filtering/display
          const formattedMembers = response.data.map(sub => ({
            id: sub.user.id,
            name: sub.user.memberProfile?.name || 'N/A',
            email: sub.user.email,
            planName: sub.gymPlan.name,
            joinDate: sub.startDate,
          }));
          setMembers(formattedMembers);
        }
      } catch (err) {
        console.error("[Members.jsx] Failed to fetch members:", err);
        setError(parseApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [gymProfile]); // This dependency array ensures the effect runs when gymProfile is populated

  const filteredMembers = useMemo(() => {
      if (!searchTerm.trim()) return members;
      return members.filter(member => 
          (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [members, searchTerm]);


  if (loading) {
    return <div className="text-center p-8 font-semibold text-gray-500">Loading Members...</div>;
  }
  
  if (error) {
    return <div className="p-4 bg-red-100 text-red-800 rounded-lg">{error}</div>;
  }
  
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">👥 Gym Members</h1>
        <p className="text-gray-600 mt-2">View and manage your gym's active subscribers.</p>
      </div>

      <div className="mb-6 bg-white/90 p-4 rounded-2xl shadow-md border">
        <input 
          type="text"
          placeholder="Search members by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 lg:w-1/3 border-gray-300 rounded-lg shadow-sm"
        />
      </div>
      
      <div className="bg-white/90 rounded-3xl shadow-xl border overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-4">Name</th>
                <th scope="col" className="px-6 py-4">Email</th>
                <th scope="col" className="px-6 py-4">Membership Plan</th>
                <th scope="col" className="px-6 py-4">Join Date</th>
                <th scope="col" className="px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
            </thead>
            <tbody>
                {filteredMembers.length === 0 ? (
                <tr className="bg-white">
                    <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                        {members.length > 0 ? 'No members match your search.' : 'You currently have no active members.'}
                    </td>
                </tr>
                ) : (
                filteredMembers.map(member => (
                    <tr key={member.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">{member.planName}</span>
                    </td>
                    <td className="px-6 py-4">{new Date(member.joinDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                        <button className="font-medium text-indigo-600 hover:underline">View Details</button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}