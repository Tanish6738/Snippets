// AI Project Health Insights Component
import React from 'react';

const ProjectHealthInsights = ({ insights }) => {
  return <div>Project Health Insights: {insights ? JSON.stringify(insights) : 'No data'}</div>;
};

export default ProjectHealthInsights;