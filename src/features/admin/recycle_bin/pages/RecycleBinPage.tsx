import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trash2, RotateCcw, AlertTriangle, RefreshCw, Search, Calendar, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { recycleBinService } from '../services/recycleBinService';
import type { RecycleBinItem } from '../types';

interface Props {
  onBack?: () => void;
}

export default function RecycleBinPage({ onBack }: Props) {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Confirmation modal state for permanent deletion
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<RecycleBinItem | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await recycleBinService.getDeletedItems();
      setItems(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load recycle bin items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (item: RecycleBinItem) => {
    setIsProcessing(true);
    const toastId = toast.loading(`Restoring ${item.entityName}...`);
    try {
      await recycleBinService.restoreItem(item.entityType, item.id);
      toast.dismiss(toastId);
      toast.success(`${item.entityType} "${item.entityName}" restored successfully!`);
      fetchItems();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || `Failed to restore ${item.entityName}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteConfirmItem) return;
    setIsProcessing(true);
    const item = deleteConfirmItem;
    const toastId = toast.loading(`Permanently deleting ${item.entityName}...`);
    try {
      await recycleBinService.permanentlyDeleteItem(item.entityType, item.id);
      toast.dismiss(toastId);
      toast.success(`${item.entityType} "${item.entityName}" permanently deleted`);
      setDeleteConfirmItem(null);
      fetchItems();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to permanently delete item');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const entityTypes = useMemo(() => {
    const types = new Set(items.map(i => i.entityType));
    return ['ALL', ...Array.from(types)];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.deletedBy && item.deletedBy.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = selectedType === 'ALL' || item.entityType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, selectedType]);

  const getTypeBadgeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'STUDENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TEACHER':
      case 'FACULTY':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DEPARTMENT':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ACTIVITY':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'TEAM':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Top Header Bar */}
      <div className="bg-[#1E293B] text-white px-6 pt-10 pb-6 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <Trash2 className="w-6 h-6 text-rose-400" />
              <h1 className="font-heading text-2xl font-bold">Recycle Bin</h1>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Restore soft-deleted items or permanently remove them
            </p>
          </div>
        </div>

        <button
          onClick={fetchItems}
          disabled={isLoading}
          className="p-2.5 bg-slate-800 rounded-xl text-white hover:bg-slate-700 transition-colors flex items-center space-x-2 text-xs font-semibold"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900">Soft-Deletion Policy</p>
            <p className="text-amber-700">
              Deleted items remain in the Recycle Bin for up to 30 days before being automatically purged from the system. You can restore them anytime or permanently delete them now.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search deleted items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {entityTypes.map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedType === t
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-xs font-semibold text-slate-500">Loading Recycle Bin...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-base font-bold text-slate-700">Recycle Bin is Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedType !== 'ALL'
                ? 'No items match your filter criteria.'
                : 'There are no soft-deleted records in the system.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={`${item.entityType}-${item.id}`}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base">
                        {item.entityName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${getTypeBadgeColor(item.entityType)}`}>
                        {item.entityType}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      {item.deletedAt && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Deleted: {formatDateTime(item.deletedAt)}</span>
                        </div>
                      )}
                      {item.permanentDeleteAt && (
                        <div className="flex items-center space-x-1 text-amber-700 font-semibold">
                          <span>Auto-purge: {formatDateOnly(item.permanentDeleteAt)}</span>
                        </div>
                      )}
                      {item.deletedBy && (
                        <span className="text-slate-400">By: {item.deletedBy}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleRestore(item)}
                    disabled={isProcessing}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
                    title="Restore item"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => setDeleteConfirmItem(item)}
                    disabled={isProcessing}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
                    title="Permanently Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Permanent Delete */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900">Delete Permanently?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 font-bold">"{deleteConfirmItem.entityName}"</strong> ({deleteConfirmItem.entityType})?
              <br />
              <span className="text-rose-600 font-semibold mt-1 block">
                This action cannot be undone and all associated records will be erased forever.
              </span>
            </p>
            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermanentDelete}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Forever</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
