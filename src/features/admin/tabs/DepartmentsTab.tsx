import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { Building2, Plus, Search, RefreshCw, Edit2, Trash2, ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  onBack?: () => void;
}

export default function DepartmentsTab({ onBack }: Props) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [deletingDeptId, setDeletingDeptId] = useState<number | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/admin/departments');
      if (response.data?.success) {
        setDepartments(response.data.data || []);
        setFilteredDepartments(response.data.data || []);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (!query) {
      setFilteredDepartments(departments);
    } else {
      setFilteredDepartments(departments.filter(d => 
        (d.name || '').toLowerCase().includes(query) ||
        (d.code || '').toLowerCase().includes(query)
      ));
    }
  };

  const [deptSections, setDeptSections] = useState<any[]>([]);
  const [newSectionName, setNewSectionName] = useState('');
  const [isLoadingSections, setIsLoadingSections] = useState(false);

  const fetchDeptSections = async (deptId: number) => {
    setIsLoadingSections(true);
    try {
      const response = await apiClient.get(`/api/v1/admin/departments/${deptId}/sections`);
      if (response.data?.success || response.data?.data) {
        setDeptSections(response.data.data || response.data || []);
      } else {
        setDeptSections([]);
      }
    } catch (e) {
      logger.error("Failed to load sections", e);
      setDeptSections([]);
    } finally {
      setIsLoadingSections(false);
    }
  };

  const openModal = (dept: any = null) => {
    setEditingDept(dept);
    if (dept) {
      setFormData({ name: dept.name || '', code: dept.code || '' });
      fetchDeptSections(dept.id);
    } else {
      setFormData({ name: '', code: '' });
      setDeptSections([]);
    }
    setNewSectionName('');
    setIsModalOpen(true);
  };

  const handleAddSection = async () => {
    if (!editingDept) return;
    const nameToUse = newSectionName.trim();
    if (!nameToUse) {
      toast.error("Section name cannot be empty");
      return;
    }
    const exists = deptSections.some(
      s => (s.sectionName || s.name || '').toUpperCase() === nameToUse.toUpperCase()
    );
    if (exists) {
      toast.error(`Section '${nameToUse}' already exists in this department`);
      return;
    }

    const toastId = toast.loading("Adding section...");
    try {
      await apiClient.post(`/api/v1/admin/departments/${editingDept.id}/sections`, {
        sectionName: nameToUse,
        name: nameToUse
      });
      toast.dismiss(toastId);
      toast.success(`Section ${nameToUse} added successfully`);
      setNewSectionName('');
      fetchDeptSections(editingDept.id);
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to add section');
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!editingDept) return;
    const toastId = toast.loading("Deleting section...");
    try {
      await apiClient.delete(`/api/v1/admin/departments/${editingDept.id}/sections/${sectionId}`);
      toast.dismiss(toastId);
      toast.success("Section deleted successfully");
      fetchDeptSections(editingDept.id);
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Department Name and Code are required.");
      return;
    }

    const toastId = toast.loading("Saving department...");
    try {
      if (editingDept) {
        await apiClient.put(`/api/v1/admin/departments/${editingDept.id}`, {
          name: formData.name.trim(),
          code: formData.code.trim()
        });
      } else {
        await apiClient.post('/api/v1/admin/departments', {
          name: formData.name.trim(),
          code: formData.code.trim()
        });
      }
      toast.dismiss(toastId);
      toast.success("Department updated successfully");
      setIsModalOpen(false);
      fetchDepartments();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to save department.');
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingDeptId(null);
    const toastId = toast.loading("Deleting department...");
    try {
      await apiClient.delete(`/api/v1/admin/departments/${id}`);
      toast.dismiss(toastId);
      toast.success("Department deleted successfully");
      fetchDepartments();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete department.');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      <div className="bg-slate-900 px-6 pt-12 pb-4 shadow-md z-10">
        <div className="flex items-center space-x-4 mb-2">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-white flex-1">Academic Departments</h1>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        {departments.length > 0 && (
          <div className="mb-6 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setFilteredDepartments(departments); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
            No departments found.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDepartments.map(dept => (
              <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4 pl-2">
                  <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-[15px]">{dept.name}</h3>
                    <p className="text-xs font-medium text-slate-500">{dept.code}</p>
                  </div>
                </div>
                <div className="flex space-x-1 pr-2">
                  <button onClick={() => openModal(dept)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletingDeptId(dept.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Add Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => openModal()}
          className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="p-6 pb-4">
              <h2 className="text-[17px] font-bold text-slate-900 mb-1">
                {editingDept ? `Edit Department: ${editingDept.code}` : 'Add New Department'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="px-6 pb-6 space-y-6">
              
              <div>
                <p className="text-[11px] font-bold text-slate-500 tracking-wider mb-3">DEPARTMENT DETAILS</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Department Name *</label>
                    <div className="relative">
                      <Building2 className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Department Code *</label>
                    <div className="relative">
                      <div className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 font-mono text-sm">{'</>'}</div>
                      <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none uppercase text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {editingDept && (
                <>
                  <div className="h-px bg-slate-200"></div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 tracking-wider mb-3">SECTIONS MANAGEMENT</p>
                    <div className="flex gap-2 mb-4">
                      <input 
                        type="text" 
                        value={newSectionName} 
                        onChange={e => setNewSectionName(e.target.value)}
                        placeholder="Add Section (e.g. A, B)" 
                        className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg outline-none focus:border-slate-400 text-sm" 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddSection} 
                        className="bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {isLoadingSections ? (
                      <div className="text-center py-4 text-slate-400 text-xs flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Loading sections...
                      </div>
                    ) : deptSections.length === 0 ? (
                      <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-sm text-slate-450">No sections added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {deptSections.map((sec: any) => (
                          <div key={sec.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <span className="font-semibold text-slate-800">Section {sec.sectionName || sec.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(sec.id)}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDeptId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Delete Department</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete this department? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeletingDeptId(null)}
                className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingDeptId)}
                className="px-5 py-2 bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
