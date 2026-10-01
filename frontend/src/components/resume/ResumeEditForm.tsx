import React, { useState } from 'react';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Resume } from '@/types/resume';

interface ResumeEditFormProps {
  resume: Resume;
  onSave: (updatedResume: Resume) => void;
  onCancel: () => void;
}

export function ResumeEditForm({ resume, onSave, onCancel }: ResumeEditFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(resume.parsed_data || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`/resumes/${resume.id}/`, {
        parsed_data: formData,
      });
      onSave(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save resume updates.');
      setIsSaving(false);
    }
  };

  const renderField = (key: string, value: any, path: string[]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const isMultiline = typeof value === 'string' && value.length > 50;
      return (
        <div key={path.join('.')} className="space-y-1">
          <label className="text-sm font-medium text-gray-300 capitalize">{key.replace(/_/g, ' ')}</label>
          {isMultiline ? (
            <textarea
              className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 min-h-[120px]"
              value={value}
              onChange={(e) => updateField(path, e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="w-full bg-[#1A1A24] border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500"
              value={value}
              onChange={(e) => updateField(path, e.target.value)}
            />
          )}
        </div>
      );
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0 || typeof value[0] === 'string' || typeof value[0] === 'number') {
        return (
          <div key={path.join('.')} className="space-y-3">
            <label className="text-sm font-medium text-gray-300 capitalize block">{key.replace(/_/g, ' ')}</label>
            <div className="space-y-2">
              {value.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="flex-1 bg-[#1A1A24] border border-white/10 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    value={item}
                    onChange={(e) => updateArrayItem(path, index, e.target.value)}
                  />
                  <button type="button" onClick={() => removeArrayItem(path, index)} className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addArrayItem(path, '')} className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              <Plus className="w-4 h-4" /> <span>Add item</span>
            </button>
          </div>
        );
      } else if (typeof value[0] === 'object') {
        return (
          <div key={path.join('.')} className="space-y-4">
            <label className="text-lg font-medium text-white border-b border-white/10 pb-2 block capitalize">{key.replace(/_/g, ' ')}</label>
            <div className="space-y-6">
              {value.map((obj, index) => (
                <div key={index} className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-4 relative">
                  <button type="button" onClick={() => removeArrayItem(path, index)} className="absolute top-4 right-4 text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(obj).map(([objKey, objVal]) => renderField(objKey, objVal, [...path, index.toString(), objKey]))}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addArrayItem(path, { ...value[0], ...Object.fromEntries(Object.keys(value[0]).map(k => [k, ''])) })} className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300">
              <Plus className="w-4 h-4" /> <span>Add new</span>
            </button>
          </div>
        );
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={path.join('.')} className="space-y-4 p-5 bg-white/5 border border-white/10 rounded-xl">
          <label className="text-lg font-medium text-white capitalize">{key.replace(/_/g, ' ')}</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {Object.entries(value).map(([objKey, objVal]) => renderField(objKey, objVal, [...path, objKey]))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  const updateField = (path: string[], value: any) => {
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const updateArrayItem = (path: string[], index: number, value: any) => {
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      current[index] = value;
      return newData;
    });
  };

  const addArrayItem = (path: string[], emptyItem: any) => {
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      current.push(emptyItem);
      return newData;
    });
  };

  const removeArrayItem = (path: string[], index: number) => {
    setFormData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length; i++) {
        current = current[path[i]];
      }
      current.splice(index, 1);
      return newData;
    });
  };

  return (
    <div className="bg-[#11111A] border border-white/10 rounded-xl p-6 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Edit Resume Details</h3>
          <p className="text-sm text-gray-400 mt-1">Review and correct your extracted information.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button onClick={() => { if(window.confirm('Discard unsaved changes?')) onCancel(); }} disabled={isSaving} className="px-4 py-2 flex-1 sm:flex-none text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-10">
        {Object.entries(formData).map(([key, value]) => renderField(key, value, [key]))}
      </div>
      
      {Object.keys(formData).length === 0 && (
         <div className="text-center p-12 border border-dashed border-white/10 rounded-xl text-gray-400">
           No structured data available to edit.
         </div>
      )}
    </div>
  );
}
