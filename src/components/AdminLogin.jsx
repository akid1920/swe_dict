import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                localStorage.setItem('adminPass', password);
                navigate('/admin/dashboard');
            } else if (res.status === 401) {
                setError('Invalid Password');
            } else {
                setError(`Server Error: ${res.status}`);
            }
        } catch (err) {
            console.error(err);
            setError('Network Error. Check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '2rem',
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--glass-shadow)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <h2 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Admin Access</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            marginBottom: '1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #ccc',
                            fontSize: '1rem'
                        }}
                    />
                    {error && <p style={{ color: 'red', marginTop: '-0.5rem' }}>{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="filter-btn active"
                        style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Verifying...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
