// Task Checklist Component
import React from 'react';

const TaskChecklist = ({ checklist = [] }) => {
  if (!checklist.length) return <div className="text-gray-400">No checklist items.</div>;
  return (
    <ul className="list-disc ml-6 text-sm text-gray-700">
      {checklist.map((item, i) => (
        <li key={item._id || i} className={item.checked ? 'line-through text-green-600' : ''}>
          {item.text || item.title || 'Checklist item'}
        </li>
      ))}
    </ul>
  );
};

export default TaskChecklist;