/* global React */
// Top app header strip: role · school · user.

function AppHeader({ role, school, user }) {
  return (
    <header className="app-header">
      <span className="role">{role}</span>
      <span className="school">{school}</span>
      <div className="spacer"></div>
      <div className="user">
        <span>{user.name}</span>
        <div className="avatar">{user.initials}</div>
      </div>
    </header>
  );
}

window.AppHeader = AppHeader;
