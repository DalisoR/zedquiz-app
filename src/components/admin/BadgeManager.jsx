import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToastNotification } from '../../hooks/useToastNotification';

const BadgeManager = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    icon_url: '',
    points_required: 0
  });
  const { showSuccess, showError } = useToastNotification();

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      showError('Failed to load badges: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBadge(prev => ({
      ...prev,
      [name]: name === 'points_required' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('badges')
        .insert([newBadge]);

      if (error) throw error;

      showSuccess('Badge created successfully!');
      setNewBadge({
        name: '',
        description: '',
        icon_url: '',
        points_required: 0
      });
      fetchBadges();
    } catch (error) {
      showError('Failed to create badge: ' + error.message);
    }
  };

  const deleteBadge = async (id) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) return;
    
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Badge deleted successfully!');
      fetchBadges();
    } catch (error) {
      showError('Failed to delete badge: ' + error.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading badges...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Manage Badges</h2>
      
      {/* Create New Badge Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">Create New Badge</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={newBadge.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={newBadge.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
              rows="2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon URL</label>
            <input
              type="url"
              name="icon_url"
              value={newBadge.icon_url}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="https://example.com/icon.png"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points Required</label>
            <input
              type="number"
              name="points_required"
              value={newBadge.points_required}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              min="0"
              required
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Create Badge
          </button>
        </form>
      </div>
      
      {/* Badges List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Existing Badges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="border rounded-lg p-4 flex items-start">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                {badge.icon_url ? (
                  <img src={badge.icon_url} alt={badge.name} className="w-8 h-8" />
                ) : (
                  <span className="text-yellow-600 text-xl">🏆</span>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{badge.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{badge.points_required} pts</span>
                  <button
                    onClick={() => deleteBadge(badge.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {badges.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              No badges created yet. Create your first badge above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BadgeManager;
