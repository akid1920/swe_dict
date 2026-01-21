import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, setSelectedCategory }) => {
    return (
        <div className="filter-container">
            <button
                className={`filter-btn ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
            >
                All
            </button>
            {categories.map((cat) => (
                <button
                    key={cat}
                    className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};

export default CategoryFilter;
