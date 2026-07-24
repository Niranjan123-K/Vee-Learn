import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './PageHeader.css';

export default function PageHeader({ title, description, subtitle, breadcrumb, actions, rightContent, variant = 'default', children }) {
  const isDashboard = variant === 'dashboard';
  
  return (
    <div className={`page-header-root ${isDashboard ? 'page-header-dashboard' : ''}`}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="page-breadcrumb">
          {breadcrumb.map((item, i) => (
            <span key={i} className="breadcrumb-item">
              {i > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
              {item.to ? (
                <Link to={item.to} className="breadcrumb-link">{item.label}</Link>
              ) : (
                <span className="breadcrumb-current">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="page-header-main">
        <div className="page-header-text">
          <h1 className={`page-header-title ${isDashboard ? 'title-large' : ''}`}>{title}</h1>
          {subtitle && <p className="page-header-subtitle text-muted text-sm mt-xs">{subtitle}</p>}
          {description && <p className="page-header-desc">{description}</p>}
        </div>
        
        {rightContent && <div className="page-header-right-content">{rightContent}</div>}
        {actions && !rightContent && <div className="page-header-actions">{actions}</div>}
      </div>
      {isDashboard && <div className="page-header-divider" />}
      {children}
    </div>
  );
}
