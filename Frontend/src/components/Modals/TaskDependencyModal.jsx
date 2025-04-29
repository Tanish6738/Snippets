// Task Dependency Modal
import React from 'react';

const TaskDependencyModal = ({ isOpen, onClose, onSave, dependencies }) => {
  if (!isOpen) return null;
  return <div>Task Dependency Modal</div>;
};

export default TaskDependencyModal;