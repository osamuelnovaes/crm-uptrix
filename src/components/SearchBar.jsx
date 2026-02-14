import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange }) {
    return (
        <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
                type="text"
                placeholder="Buscar por nome, telefone ou empresa..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="search-input"
            />
        </div>
    );
}
