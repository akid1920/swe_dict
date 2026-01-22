import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Mic, ArrowRight, Bookmark, Star } from 'lucide-react'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import TermCard from './TermCard'
import TermModal from './TermModal'

import soilIcon from '../assets/soil_icon.png'
import waterIcon from '../assets/water_icon.png'
import envIcon from '../assets/environment_icon.png'

function Home() {
    const [terms, setTerms] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState(null) // null means all/landing
    const [selectedTerm, setSelectedTerm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [termOfDay, setTermOfDay] = useState(null)
    const [visibleCount, setVisibleCount] = useState(12)

    const [isListening, setIsListening] = useState(false)

    // Fetch data from API
    useEffect(() => {
        fetch('/api/terms')
            .then(res => res.json())
            .then(data => {
                setTerms(data)
                setLoading(false)

                if (data.length > 0) {
                    // Check for saved term of the day
                    const today = new Date().toISOString().split('T')[0];
                    const savedDate = localStorage.getItem('termOfDayDate');
                    const savedTermId = localStorage.getItem('termOfDayId');

                    if (savedDate === today && savedTermId) {
                        // Find the term in the fresh data by ID
                        const foundTerm = data.find(t => t.id.toString() === savedTermId.toString());

                        if (foundTerm) {
                            setTermOfDay(foundTerm);
                        } else {
                            // ID not found (maybe deleted), pick new
                            pickNewTerm(data, today);
                        }
                    } else {
                        // New day or no term saved
                        pickNewTerm(data, today);
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load terms", err)
                setLoading(false)
            })
    }, [])

    const pickNewTerm = (data, dateStr) => {
        if (!data || data.length === 0) return;
        const random = data[Math.floor(Math.random() * data.length)];
        setTermOfDay(random);
        localStorage.setItem('termOfDayId', random.id);
        localStorage.setItem('termOfDayDate', dateStr);
        // Clear legacy full object storage if it exists
        localStorage.removeItem('termOfDay');
    }

    // Filter logic
    const allFilteredTerms = Array.isArray(terms) ? terms.filter(term => {
        const tName = term.term ? term.term.toLowerCase() : '';
        const search = searchTerm.toLowerCase();

        // ONLY search by term name as requested
        const matchesSearch = tName.includes(search);

        // If specific category selected, filter by it. If null, show all (but UI handles view mode)
        const matchesCategory = selectedCategory ? term.category && term.category.toLowerCase().includes(selectedCategory.toLowerCase()) : true;

        return matchesSearch && matchesCategory;
    }) : []

    const filteredTerms = allFilteredTerms.slice(0, visibleCount);

    // Reset pagination when filter changes
    useEffect(() => {
        setVisibleCount(12)
    }, [searchTerm, selectedCategory])

    const loadMore = () => {
        setVisibleCount(prev => prev + 12)
    }

    // View Mode Logic
    // If search term is present OR a category is selected, show "Results View"
    // Otherwise show "Landing View"
    const isLandingView = !searchTerm && !selectedCategory;

    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        // Ensure we scroll to results or just update view
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedCategory(null)
    }

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.continuous = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                // Remove trailing punctuation (dot, question mark, etc.) commonly added by voice engines
                setSearchTerm(transcript.replace(/[.!?]+$/, ''));
            };

            recognition.start();
        } else {
            alert("Your browser does not support voice search.");
        }
    }

    const categories = [
        { name: 'Soil', icon: soilIcon, fullName: 'Soil Science' },
        { name: 'Water', icon: waterIcon, fullName: 'Water Science' },
        { name: 'Environment', icon: envIcon, fullName: 'Environmental Science' }
    ]

    return (
        <div className="app-container" style={{ position: 'relative' }}>
            {/* Back Button */}
            {/* Back Button */}
            {!isLandingView && (
                <button
                    onClick={clearFilters}
                    className="back-button"
                >
                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back
                </button>
            )}

            {/* Hero Section */}
            <div className={`hero-section ${!isLandingView ? 'hero-compact' : ''}`}>
                <h1 className="hero-title">
                    Search scientific terms in Soil, Water <br /> & Environmental Sciences
                </h1>

                <div className="hero-search-container">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder='Search topics like "evapotranspiration", "soil porosity", "eutrophication"...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Mic
                            className={`search-icon-mic ${isListening ? 'listening' : ''}`}
                            size={20}
                            onClick={startListening}
                            style={{ cursor: 'pointer', color: isListening ? 'red' : '#9aa0a6' }}
                        />
                    </div>
                    <button className="search-button">
                        <Search size={24} color="white" />
                    </button>
                </div>

                {/* Pills removed as requested */}
            </div>

            <main className="main-content">
                {loading ? (
                    <div className="loading-spinner">Loading Dictionary...</div>
                ) : (
                    <>
                        {isLandingView ? (
                            <>
                                {/* Term of the Day */}
                                {termOfDay && (
                                    <section className="section-term-of-day">
                                        <h2 className="section-header">Term of the Day</h2>
                                        <div className="term-of-day-card">
                                            <div className="tod-content">
                                                <div className="tod-header">
                                                    <h3 className="tod-title">{termOfDay.term}</h3>
                                                    <span className="tod-category">{termOfDay.category}</span>
                                                </div>
                                                <p className="tod-definition">{termOfDay.definition}</p>
                                                {termOfDay.formula && (
                                                    <div className="tod-unit">
                                                        Formula: <InlineMath>{termOfDay.formula}</InlineMath>
                                                        {termOfDay.formula_description && (
                                                            <div style={{ marginTop: '1rem', fontSize: '0.9em', color: '#444', textAlign: 'left' }}>
                                                                <div style={{ fontStyle: 'italic', fontWeight: 'bold', marginBottom: '0.25rem' }}>Where</div>
                                                                <div style={{ paddingLeft: '1.5rem' }}>
                                                                    {termOfDay.formula_description.split('\n').map((line, i) => (
                                                                        <div key={i} style={{ marginBottom: '0.1rem' }}>
                                                                            {line}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="tod-source">Source: FAO</div> {/* Placeholder */}
                                            </div>
                                            <div className="tod-actions">
                                                <button className="btn-view-full" onClick={() => setSelectedTerm(termOfDay)}>
                                                    <Bookmark size={16} /> Click for details
                                                </button>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                {/* Browse by Category */}
                                <section className="section-categories">
                                    <div className="category-section-header">
                                        <span className="line"></span>
                                        <h2 className="section-header-center">Browse by Category</h2>
                                        <span className="line"></span>
                                    </div>

                                    <div className="category-grid">
                                        {categories.map(cat => (
                                            <div key={cat.name} className="category-card" onClick={() => handleCategoryClick(cat.name)}>
                                                <div className="cat-icon-wrapper">
                                                    <img src={cat.icon} alt={cat.name} />
                                                </div>
                                                <span className="cat-name">{cat.fullName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        ) : (
                            /* Results View */
                            <div className="results-container">
                                <h2 className="results-header">
                                    {searchTerm ? `Results for "${searchTerm}"` : `Category: ${selectedCategory}`}
                                    <span className="results-count">({filteredTerms.length} terms)</span>
                                </h2>
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
                                        <div className="no-results">
                                            <p>No terms found matching your criteria.</p>
                                            <button onClick={clearFilters} className="btn-text">Clear all filters</button>
                                        </div>
                                    )}
                                </div>
                                {visibleCount < allFilteredTerms.length && (
                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem', paddingBottom: '3rem', width: '100%' }}>
                                        <button
                                            onClick={loadMore}
                                            className="filter-btn"
                                            style={{
                                                padding: '0.8rem 4rem',
                                                fontSize: '1rem',
                                                background: 'white',
                                                border: '1px solid #e0e0e0',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                                cursor: 'pointer',
                                                borderRadius: '30px',
                                                color: 'var(--text-main)',
                                                transition: 'all 0.2s',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            <TermModal
                term={selectedTerm}
                onClose={() => setSelectedTerm(null)}
                // Smart Related Terms Logic
                relatedTerms={(() => {
                    if (!selectedTerm || !terms.length) return [];

                    const currentWords = selectedTerm.term.toLowerCase().split(/\s+/).filter(w => w.length > 3);

                    return terms
                        .filter(t => t.id !== selectedTerm.id)
                        .map(t => {
                            let score = 0;
                            const termName = t.term.toLowerCase();
                            const termDef = t.definition.toLowerCase();

                            // High score for sharing words in the name
                            currentWords.forEach(word => {
                                if (termName.includes(word)) score += 10;
                                if (termDef.includes(word)) score += 2;
                            });

                            return { ...t, score };
                        })
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 4); // Show top 4 related terms
                })()}
                onSelectTerm={setSelectedTerm}
            />

            <footer className="app-footer">
                <div className="footer-content">
                    <p>&copy; 2026 Soil, Water & Environmental Sciences Dictionary. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default Home
