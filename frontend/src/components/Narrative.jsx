import React from 'react';

export default function Narrative({ title, text, icon, variant = "light" }) {
  // Bootstrap variant styling
  const getVariantClasses = () => {
    switch(variant) {
      case 'primary':
        return 'bg-primary bg-opacity-10 border-primary';
      case 'secondary':
        return 'bg-secondary bg-opacity-10 border-secondary';
      case 'success':
        return 'bg-success bg-opacity-10 border-success';
      case 'danger':
        return 'bg-danger bg-opacity-10 border-danger';
      case 'warning':
        return 'bg-warning bg-opacity-10 border-warning';
      case 'info':
        return 'bg-info bg-opacity-10 border-info';
      case 'light':
      default:
        return 'bg-white border-light';
    }
  };

  return (
    <div className={`card h-100 border shadow-sm ${variant !== 'light' ? getVariantClasses() : ''}`}>
      <div className="card-header d-flex align-items-center bg-transparent">
        {icon && (
          <i className={`${icon} me-2 ${variant !== 'light' ? `text-${variant}` : 'text-muted'}`}></i>
        )}
        <h5 className="mb-0">{title}</h5>
      </div>
      <div className="card-body overflow-auto" style={{ maxHeight: "280px" }}>
        {!text ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
            <p className="mb-0">No data available</p>
          </div>
        ) : (
          <div className="text-secondary">
            {text}
          </div>
        )}
      </div>
    </div>
  );
}