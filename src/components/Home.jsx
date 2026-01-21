import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import TermCard from './TermCard'
import TermModal from './TermModal'

function Home() {
    const [terms, setTerms] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [selectedTerm, setSelectedTerm] = useState(null)
    const [loading, setLoading] = useState(true)

    // Fetch data from API
    useEffect(() => {
        fetch('/api/terms')
            .then(res => res.json())
            .then(data => {
                setTerms(data)
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to load terms", err)
                setLoading(false)
            })
    }, [])

    // Derive unique categories from data
    const categories = Array.isArray(terms) ? [...new Set(terms.filter(t => t.category).map(t => t.category))] : []

    // Filter logic
    const filteredTerms = Array.isArray(terms) ? terms.filter(term => {
        const tName = term.term ? term.term.toLowerCase() : '';
        const tDef = term.definition ? term.definition.toLowerCase() : '';
        const search = searchTerm.toLowerCase();

        const matchesSearch = tName.includes(search) || tDef.includes(search);
        const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;

        return matchesSearch && matchesCategory;
    }) : []

    // Get related terms for the modal (same category, excluding current)
    const getRelatedTerms = (currentTerm) => {
        if (!currentTerm) return []
        return terms.filter(t => t.category === currentTerm.category && t.id !== currentTerm.id)
    }

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">Soil, Water and Environment Sciences</h1>
                <p className="app-subtitle">Idea Incubation Platform</p>
            </header>

            <main>
                <div className="controls-container">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                    <CategoryFilter
                        categories={categories}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                    />
                </div>

                {loading ? (
                    <p style={{ textAlign: 'center' }}>Loading Dictionary...</p>
                ) : (
                    <div className="terms-grid">
                        {filteredTerms.length > 0 ? (
                            filteredTerms.map(term => (
                                <TermCard
                                    key={term.id}
                                    term={term}
                                    onClick={setSelectedTerm}
                                />
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-muted)' }}>
                                No terms found matching your criteria.
                            </p>
                        )}
                    </div>
                )}
            </main>

            <TermModal
                term={selectedTerm}
                onClose={() => setSelectedTerm(null)}
                relatedTerms={getRelatedTerms(selectedTerm)}
                onSelectTerm={setSelectedTerm}
            />
        </div>
    )
}

export default Home
