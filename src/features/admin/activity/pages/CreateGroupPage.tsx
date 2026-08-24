import { logger } from '../../../../utils/logger';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, UserPlus, X, AlertCircle } from 'lucide-react';
import { activityService } from '../api/activityService';

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const assignmentId = parseInt(searchParams.get('assignmentId') || '0', 10);
  const preselectedYear = searchParams.get('year') || 'Global';
  const preselectedDept = searchParams.get('dept') || 'Global';
  
  const [formData, setFormData] = useState({
    name: '',
    size: 5
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [_isSearching, setIsSearching] = useState(false);
  const [selectedCaptain, setSelectedCaptain] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await activityService.searchStudents(query);
      const content = response.content || response.data?.content || [];
      const filtered = content.filter((s: any) => {
        const matchesDept = preselectedDept === 'Global' || s.departmentName === preselectedDept;
        return matchesDept;
      });
      setSearchResults(filtered);
    } catch (err) {
      logger.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaptain) {
      setError('Please select a captain.');
      return;
    }
    if (!formData.name.trim() || formData.size <= 0) {
      setError('Please provide a valid group name and size.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await activityService.createTeam({
        name: formData.name.trim(),
        size: formData.size,
        captainStudentId: selectedCaptain.regNo,
        assignmentId: assignmentId
      });
      navigate(-1);
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="type-h3 text-slate-800">Create Group</h1>
        <p className="text-slate-500 mt-1">Assign a captain and create a new student group.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="type-body-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="type-h4 text-slate-800 border-b pb-2">Academic Scope</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="type-form-label type-body-sm font-semibold text-slate-700 block mb-1">Academic Year</label>
              <input type="text" readOnly value={preselectedYear} className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-600" />
            </div>
            <div>
              <label className="type-form-label type-body-sm font-semibold text-slate-700 block mb-1">Department</label>
              <input type="text" readOnly value={preselectedDept} className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="type-h4 text-slate-800 border-b pb-2">Group Details</h3>
          <div className="space-y-4">
            <div>
              <label className="type-form-label type-body-sm font-semibold text-slate-700 block mb-1">Group Name *</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. Alpha Team" />
            </div>
            <div>
              <label className="type-form-label type-body-sm font-semibold text-slate-700 block mb-1">Maximum Size *</label>
              <input required type="number" min="1" value={formData.size} onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 1 })} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h3 className="type-h4 text-slate-800 border-b pb-2">Assign Captain</h3>
          
          {selectedCaptain ? (
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold type-h4">
                  {selectedCaptain.fullName?.charAt(0)}
                </div>
                <div>
                  <h4 className="type-h5 text-slate-800">{selectedCaptain.fullName}</h4>
                  <p className="type-body-sm text-slate-500">{selectedCaptain.regNo} | {selectedCaptain.departmentName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCaptain(null)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <label className="type-form-label type-body-sm font-semibold text-slate-700 block mb-1">Search by Name or ID</label>
              <div className="relative">
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Type to search students..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none" />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
              
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {searchResults.map((student) => (
                    <button key={student.regNo} type="button" onClick={() => { setSelectedCaptain(student); setSearchQuery(''); setSearchResults([]); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 type-caption font-bold">
                        {student.fullName?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{student.fullName}</div>
                        <div className="type-caption text-slate-500">{student.regNo} | {student.departmentName}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button type="submit" disabled={isSubmitting} className="type-btn px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {isSubmitting ? 'Creating Group...' : 'Save Group'}
          </button>
        </div>
      </form>
    </div>
  );
}
