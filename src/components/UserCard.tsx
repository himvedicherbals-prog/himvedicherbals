'use client';

import { User } from '@/lib/api';

interface UserCardProps {
  user: User;
  variant?: 'default' | 'compact';
  showEmail?: boolean;
}

export default function UserCard({ 
  user, 
  variant = 'default',
  showEmail = true 
}: UserCardProps) {
  const initials = user.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : '';

  if (variant === 'compact') {
    return (
      <div className="user-card compact">
        <div className="avatar small">{initials}</div>
        <div className="user-info">
          <span className="name">{user.name}</span>
          {showEmail && <span className="email">{user.email}</span>}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <article className="user-card">
      <div className="avatar">
        {initials}
      </div>
      
      <div className="user-details">
        <h4 className="name">{user.name}</h4>
        
        {showEmail && (
          <a 
            href={`mailto:${user.email}`} 
            className="email"
            onClick={(e) => e.stopPropagation()}
          >
            {user.email}
          </a>
        )}

        <div className="user-meta">
          {user.role && (
            <span className={`role-badge ${user.role.toLowerCase()}`}>
              {user.role}
            </span>
          )}
          
          {formattedDate && (
            <time dateTime={user.created_at} className="joined-date">
              Joined {formattedDate}
            </time>
          )}
        </div>
      </div>

      {/* Action buttons - can be customized */}
      <div className="user-actions">
        <button className="action-btn view" title="View Profile">
          👁️
        </button>
        <button className="action-btn edit" title="Edit User">
          ✏️
        </button>
      </div>
    </article>
  );
}

// Component for displaying user list/table
interface UserListProps {
  users: User[];
  title?: string;
  showHeader?: boolean;
}

export function UserList({ 
  users, 
  title = "Registered Users", 
  showHeader = true 
}: UserListProps) {
  if (users.length === 0) {
    return (
      <section className="user-list empty">
        {showHeader && <h2>{title}</h2>}
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <p>No users found</p>
          <p className="empty-hint">Users will appear here once they register.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="user-list">
      {showHeader && (
        <header className="list-header">
          <h2>{title}</h2>
          <span className="count">{users.length} {users.length === 1 ? 'User' : 'Users'}</span>
        </header>
      )}

      <div className="users-grid">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Desktop table view */}
      <table className="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="table-user">
                  <span className="avatar tiny">
                    {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                  {user.name}
                </div>
              </td>
              <td>{user.email}</td>
              <td>{user.role || 'User'}</td>
              <td>
                {user.created_at 
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'
                }
              </td>
              <td>
                <div className="table-actions">
                  <button className="action-btn-sm" title="View">👁️</button>
                  <button className="action-btn-sm" title="Edit">✏️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
