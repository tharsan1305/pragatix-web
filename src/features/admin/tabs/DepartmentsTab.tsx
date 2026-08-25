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
    <div className="flex flex-col min-h-full bg-bg relative pb-20">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-4 sm:px-6 py-4 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Academic Departments</h1>
            {!isLoading && (
              <p className="type-caption text-text-secondary font-medium">
                {searchQuery
                  ? `Showing ${filteredDepartments.length} of ${departments.length} departments`
                  : `Showing ${departments.length} academic departments`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDepartments}
            className="p-2 bg-card border border-border hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Departments"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2.5 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search departments by name or code..." 
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchDepartments();
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-bg text-text-primary placeholder:text-text-muted border border-border rounded-lg focus:border-text-primary outline-none shadow-none type-body-sm font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setFilteredDepartments(departments); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => fetchDepartments()}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg type-caption font-bold flex items-center space-x-1.5 shadow-none transition-colors cursor-pointer shrink-0"
            title="Search & Refresh from database"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading departments...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-16 text-text-secondary bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-border space-y-2 p-8 flex flex-col items-center">
            <p className="font-bold type-h5 text-text-primary">No departments found.</p>
            <p className="type-caption text-text-secondary">Try adjusting your search query or add a new academic department.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDepartments.map(dept => (
              <div key={dept.id} className="bg-card rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border p-4 flex items-center justify-between hover:border-accent/40 transition-all gap-3">
                <div className="flex items-center space-x-3.5 pl-1 min-w-0">
                  <div className="w-11 h-11 bg-bg border border-border rounded-xl flex items-center justify-center text-accent shrink-0">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="type-h5 font-bold text-text-primary truncate">{dept.name}</h3>
                      <span className="px-2 py-0.5 rounded-md type-fine font-extrabold bg-accent-tint text-accent border border-accent/20">
                        {dept.code}
                      </span>
                    </div>
                    <p className="type-caption text-text-secondary font-medium mt-0.5">
                      Academic Department • Department ID: #{dept.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 pr-1 shrink-0">
                  <button 
                    onClick={() => openModal(dept)} 
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer"
                    title="Edit Department"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeletingDeptId(dept.id)} 
                    className="p-2 text-text-secondary hover:text-accent hover:bg-accent-tint rounded-lg transition-colors cursor-pointer"
                    title="Delete Department"
                  >
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
          className="w-14 h-14 bg-accent hover:bg-accent-hover text-card rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
          title="Add New Department"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
              <h2 className="type-h4 font-bold text-text-primary">
                {editingDept ? `Edit Department: ${editingDept.code}` : 'Add New Department'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6 bg-bg">
              <div>
                <p className="type-fine font-bold text-text-muted tracking-wider mb-3 uppercase">DEPARTMENT DETAILS</p>
                <div className="space-y-4">
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Department Name <span className="text-accent">*</span></label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Department Code <span className="text-accent">*</span></label>
                    <div className="relative">
                      <div className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted font-mono type-caption font-bold">{'</>'}</div>
                      <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary uppercase type-body-sm font-semibold bg-card text-text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {editingDept && (
                <>
                  <div className="h-px bg-border"></div>
                  <div>
                    <p className="type-fine font-bold text-text-muted tracking-wider mb-3 uppercase">SECTIONS MANAGEMENT</p>
                    <div className="flex gap-2 mb-4">
                      <input 
                        type="text" 
                        value={newSectionName} 
                        onChange={e => setNewSectionName(e.target.value)} 
                        placeholder="Add Section (e.g. A, B)" 
                        className="flex-1 px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddSection} 
                        className="type-btn bg-accent hover:bg-accent-hover text-card px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {isLoadingSections ? (
                      <div className="text-center py-4 text-text-secondary type-caption flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 animate-spin text-accent mr-2" />
                        Loading sections...
                      </div>
                    ) : deptSections.length === 0 ? (
                      <div className="text-center py-4 bg-card border border-border rounded-xl">
                        <p className="type-body-sm text-text-muted">No sections added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {deptSections.map((sec: any) => (
                          <div key={sec.id} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-lg type-caption">
                            <span className="font-bold text-text-primary">Section {sec.sectionName || sec.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(sec.id)}
                              className="text-text-secondary hover:text-accent p-1 rounded-md transition-colors cursor-pointer"
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
              
              <div className="flex justify-end space-x-2.5 pt-2 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-text-secondary font-bold hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="type-btn px-6 py-2 bg-accent hover:bg-accent-hover text-card font-bold rounded-lg transition-colors shadow-none cursor-pointer">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDeptId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="type-h4 font-bold text-text-primary">Delete Department</h3>
            <p className="type-caption text-text-secondary">
              Are you sure you want to delete this department? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2.5 pt-2 border-t border-border">
              <button
                onClick={() => setDeletingDeptId(null)}
                className="px-4 py-2 text-text-secondary font-bold hover:bg-bg border border-border rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingDeptId)}
                className="px-5 py-2 bg-accent hover:bg-accent-hover text-card font-bold rounded-lg shadow-none cursor-pointer transition-colors"
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
