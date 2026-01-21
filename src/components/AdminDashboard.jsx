import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [newTerm, setNewTerm] = useState({
        term: '', definition: '', description: '', category: 'Soil', formula: ''
    });
    const [message, setMessage] = useState('');
    const [terms, setTerms] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'x-admin-password': localStorage.getItem('adminPass')
    });

    // Fetch terms list
    useEffect(() => {
        fetch('/api/terms')
            .then(res => res.json())
            .then(data => setTerms(data))
            .catch(err => console.error("Failed to load terms", err));
    }, [refreshTrigger]);

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/terms', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newTerm)
            });
            if (res.ok) {
                setMessage('Term added successfully!');
                setNewTerm({ term: '', definition: '', description: '', category: 'Soil', formula: '' });
                setRefreshTrigger(prev => prev + 1);
            } else {
                setMessage('Failed to add term.');
            }
        } catch (err) {
            setMessage('Error connecting to server.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this term?")) return;

        try {
            const res = await fetch(`/api/terms/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setMessage('Term deleted.');
                setRefreshTrigger(prev => prev + 1);
            } else {
                setMessage('Failed to delete term.');
            }
        } catch (err) {
            setMessage('Error deleting term.');
        }
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        // Universal parser for JSON, CSV, Excel
        reader.onload = async (evt) => {
            try {
                const data = evt.target.result;
                let jsonData = [];

                if (file.name.endsWith('.json')) {
                    jsonData = JSON.parse(data);
                } else {
                    // For Excel/CSV
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const rawData = XLSX.utils.sheet_to_json(sheet);

                    // Normalize keys to lowercase to match our API (Term -> term)
                    jsonData = rawData.map(row => {
                        const newRow = {};
                        Object.keys(row).forEach(key => {
                            newRow[key.toLowerCase()] = row[key];
                        });
                        // Default category if missing
                        if (!newRow.category) newRow.category = 'Other';
                        return newRow;
                    });
                }

                const res = await fetch('/api/import', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(jsonData)
                });
                const responseData = await res.json();

                if (res.ok) {
                    setMessage(`Success! ${responseData.message}`);
                    setRefreshTrigger(prev => prev + 1);
                } else {
                    setMessage('Import failed. Check file format.');
                }
            } catch (err) {
                console.error(err);
                setMessage('Invalid file.');
            }
        };

        if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    };

    const logout = () => {
        localStorage.removeItem('adminPass');
        navigate('/');
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--color-primary)' }}>Admin Dashboard</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => navigate('/')} className="filter-btn">Go to Dictionary</button>
                    <button onClick={logout} className="filter-btn" style={{ background: '#ef4444', color: 'white' }}>Logout</button>
                </div>

            </div>

            {message && <div style={{
                padding: '1rem',
                background: message.includes('Success') || message.includes('success') || message.includes('deleted') ? '#dcfce7' : '#fee2e2',
                color: message.includes('Success') || message.includes('success') || message.includes('deleted') ? '#166534' : '#991b1b',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem'
            }}>
                {message}
            </div>}

            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--glass-shadow)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ marginTop: 0 }}>Add New Term</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        className="search-input"
                        placeholder="Term Name"
                        value={newTerm.term}
                        onChange={e => setNewTerm({ ...newTerm, term: e.target.value })}
                        required
                    />
                    <select
                        className="search-input"
                        value={newTerm.category}
                        onChange={e => setNewTerm({ ...newTerm, category: e.target.value })}
                    >
                        <option value="Soil">Soil</option>
                        <option value="Water">Water</option>
                        <option value="Environment">Environment</option>
                        <option value="Other">Other</option>
                    </select>
                    <textarea
                        className="search-input"
                        placeholder="Definition"
                        rows="2"
                        value={newTerm.definition}
                        onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })}
                        required
                    />
                    <textarea
                        className="search-input"
                        placeholder="Description (Optional)"
                        rows="3"
                        value={newTerm.description}
                        onChange={e => setNewTerm({ ...newTerm, description: e.target.value })}
                    />
                    <input
                        className="search-input"
                        placeholder="LaTeX Formula (Optional, e.g. E=mc^2)"
                        value={newTerm.formula}
                        onChange={e => setNewTerm({ ...newTerm, formula: e.target.value })}
                    />
                    <button type="submit" className="filter-btn active">Add Term</button>
                </form>
            </div>

            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--glass-shadow)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ marginTop: 0 }}>Import Terms</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Upload a file (.csv, .xlsx, .json) with columns: Term, Definition, Description, Category, Formula.
                </p>
                <input
                    type="file"
                    accept=".json, .csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--glass-shadow)'
            }}>
                <h3 style={{ marginTop: 0 }}>Manage Terms ({terms.length})</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '0.5rem' }}>Term</th>
                                <th style={{ padding: '0.5rem' }}>Category</th>
                                <th style={{ padding: '0.5rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {terms.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #fcfcfc' }}>
                                    <td style={{ padding: '0.5rem' }}>{t.term}</td>
                                    <td style={{ padding: '0.5rem' }}><span className="category-badge" style={{ fontSize: '0.7em' }}>{t.category}</span></td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            style={{
                                                background: '#fee2e2',
                                                color: '#991b1b',
                                                padding: '0.2rem 0.5rem',
                                                fontSize: '0.8rem',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
