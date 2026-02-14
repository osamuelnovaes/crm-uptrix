import { useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { Lock, Mail, LogIn, UserPlus, AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isSignUp) {
                await signUp(email, password);
                setSuccess('Conta criada com sucesso! Verifique seu email para confirmar.');
                setIsSignUp(false);
                setEmail('');
                setPassword('');
            } else {
                await signIn(email, password);
            }
        } catch (err) {
            if (err.message === 'Invalid login credentials') {
                setError('Email ou senha incorretos.');
            } else if (err.message?.includes('Email not confirmed')) {
                setError('Email não confirmado. Verifique sua caixa de entrada.');
            } else if (err.message?.includes('already registered')) {
                setError('Este email já está cadastrado.');
            } else if (err.message?.includes('Password should be')) {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else {
                setError(err.message || 'Erro ao autenticar.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="login-bg-gradient" />
                <div className="login-bg-orb login-bg-orb-1" />
                <div className="login-bg-orb login-bg-orb-2" />
                <div className="login-bg-orb login-bg-orb-3" />
            </div>

            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <div className="login-logo-icon">
                            <span>U</span>
                        </div>
                        <h1>Uptrix <span className="login-crm-badge">CRM</span></h1>
                    </div>
                    <p className="login-subtitle">
                        {isSignUp ? 'Criar nova conta' : 'Acesse sua conta'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-alert login-alert-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="login-alert login-alert-success">
                            <AlertCircle size={16} />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="login-field">
                        <label htmlFor="email">
                            <Mail size={14} />
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="login-field">
                        <label htmlFor="password">
                            <Lock size={14} />
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <><Loader size={16} className="spin" /> Aguarde...</>
                        ) : isSignUp ? (
                            <><UserPlus size={16} /> Criar Conta</>
                        ) : (
                            <><LogIn size={16} /> Entrar</>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <button
                        type="button"
                        className="login-switch"
                        onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
                    >
                        {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
                    </button>
                </div>
            </div>
        </div>
    );
}
