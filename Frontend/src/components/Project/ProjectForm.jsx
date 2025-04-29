import React from 'react';
import { FiEdit3, FiCalendar, FiType, FiFlag, FiLayers, FiZap } from 'react-icons/fi';

const typeOptions = [
  { value: 'Standard', label: 'Standard' },
  { value: 'Development', label: 'Development' },
  { value: 'Research', label: 'Research' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Event', label: 'Event' },
  { value: 'Other', label: 'Other' },
];
const statusOptions = [
  { value: 'Planning', label: 'Planning' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];
const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

const ProjectForm = ({ initialValues = {}, onSubmit, loading }) => {
  const [form, setForm] = React.useState({
    title: initialValues.title || '',
    description: initialValues.description || '',
    deadline: initialValues.deadline ? initialValues.deadline.slice(0, 10) : '',
    projectType: initialValues.projectType || 'Standard',
    status: initialValues.status || 'Planning',
    priority: initialValues.priority || 'Medium',
  });
  const prevId = React.useRef(initialValues._id);

  React.useEffect(() => {
    // Only update form if the project id changes (edit mode) or if switching from create to edit
    if (initialValues._id && initialValues._id !== prevId.current) {
      setForm({
        title: initialValues.title || '',
        description: initialValues.description || '',
        deadline: initialValues.deadline ? initialValues.deadline.slice(0, 10) : '',
        projectType: initialValues.projectType || 'Standard',
        status: initialValues.status || 'Planning',
        priority: initialValues.priority || 'Medium',
      });
      prevId.current = initialValues._id;
    }
    // If switching from edit to create (no _id)
    if (!initialValues._id && prevId.current) {
      setForm({
        title: '',
        description: '',
        deadline: '',
        projectType: 'Standard',
        status: 'Planning',
        priority: 'Medium',
      });
      prevId.current = undefined;
    }
  }, [initialValues]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-8 rounded-2xl border border-slate-700/40 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <FiEdit3 className="text-indigo-400 text-2xl" />
        <h2 className="text-2xl font-bold text-white">{initialValues._id ? 'Edit Project' : 'Create Project'}</h2>
      </div>
      <div>
        <label className="font-medium text-slate-200 mb-1 flex items-center gap-2"><FiType /> Title</label>
        <input name="title" value={form.title} onChange={handleChange} required className="input input-bordered w-full bg-slate-900/60 border-slate-700/40 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500" placeholder="Project title" />
      </div>
      <div>
        <label className="font-medium text-slate-200 mb-1 flex items-center gap-2"><FiEdit3 /> Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="input input-bordered w-full bg-slate-900/60 border-slate-700/40 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500 min-h-[80px]" placeholder="Project description" />
      </div>
      <div>
        <label className="font-medium text-slate-200 mb-1 flex items-center gap-2"><FiCalendar /> Deadline</label>
        <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className="input input-bordered w-full bg-slate-900/60 border-slate-700/40 text-white focus:border-indigo-500 focus:ring-indigo-500" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="font-medium text-slate-200 mb-1 flex items-center gap-2"><FiLayers /> Type</label>
          <select name="projectType" value={form.projectType} onChange={handleChange} className="input input-bordered w-full bg-slate-900/60 border-slate-700/40 text-white focus:border-indigo-500 focus:ring-indigo-500">
            {typeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="font-medium text-slate-200 mb-1 flex items-center gap-2"><FiFlag /> Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="input input-bordered w-full bg-slate-900/60 border-slate-700/40 text-white focus:border-indigo-500 focus:ring-indigo-500">
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="font-medium text-slate-200 mb-1 flex items-center gap-2"><FiZap /> Priority</label>
          <select name="priority" value={form.priority} onChange={handleChange} className="input input-bordered w-full bg-slate-900/60 border-slate-700/40 text-white focus:border-indigo-500 focus:ring-indigo-500">
            {priorityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full mt-4 py-2 text-lg font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>{loading ? 'Saving...' : (initialValues._id ? 'Update Project' : 'Create Project')}</button>
    </form>
  );
};

export default ProjectForm;