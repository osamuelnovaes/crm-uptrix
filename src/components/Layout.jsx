import { LogOut } from 'lucide-react';

export default function Layout({ children, user, onSignOut }) {
    return (
        <div className="app-layout">
            {children}
            {user && (
                <div className="user-bar">
                    <span className="user-email">{user.email}</span>
                    <button className="btn-logout" onClick={onSignOut} title="Sair">
                        <LogOut size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
