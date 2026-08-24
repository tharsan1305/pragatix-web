import { ArrowLeft, Edit2, Users } from 'lucide-react';
import type { ActivityModel } from '../types/ActivityTypes';

interface Props {
  activity: ActivityModel;
  onBack: () => void;
  onEdit: () => void;
  onAssignFaculty: () => void;
}

export default function AdminActivityDetailPage({ activity, onBack, onEdit, onAssignFaculty }: Props) {
  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="type-h3 text-white">Activity Details</h1>
            <p className="text-slate-400 type-body-sm">{activity.name}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={onAssignFaculty}
            className="flex items-center type-btn px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Users className="w-4 h-4 mr-2" />
            Assign Faculty
          </button>
          <button 
            onClick={onEdit}
            className="flex items-center type-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="type-h4 text-slate-800 mb-4">General Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="type-body-sm text-slate-500">Name</p>
              <p className="font-medium text-slate-800">{activity.name}</p>
            </div>
            <div>
              <p className="type-body-sm text-slate-500">Type</p>
              <p className="font-medium text-slate-800">{activity.type}</p>
            </div>
            <div>
              <p className="type-body-sm text-slate-500">XP Category</p>
              <p className="font-medium text-slate-800">{activity.xpCategory}</p>
            </div>
            <div>
              <p className="type-body-sm text-slate-500">Frequency</p>
              <p className="font-medium text-slate-800">{activity.awardFrequency}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="type-h4 text-slate-800 mb-4">Award & Penalty Rules</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="type-body-sm text-slate-500">Award Enabled</p>
              <p className="font-medium text-slate-800">{activity.awardEnabled ? 'Yes' : 'No'} ({activity.awardXp} XP)</p>
            </div>
            <div>
              <p className="type-body-sm text-slate-500">Penalty Enabled</p>
              <p className="font-medium text-slate-800">{activity.penaltyEnabled ? 'Yes' : 'No'} ({activity.penaltyXp} XP)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
