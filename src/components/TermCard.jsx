import React from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const TermCard = ({ term, onClick }) => {
    return (
        <div className="term-card" onClick={() => onClick(term)}>
            <div className="card-header">
                <h3 className="term-name">{term.term}</h3>
                <span className="category-badge">{term.category}</span>
            </div>

            <div className="term-definition">
                {term.definition}
            </div>

            {/* Show truncated description or just definition on card to keep it clean, 
          but per design let's show description if it fits or maybe just definition.
          Let's stick to current design but render Math properly. */}

            {term.formula && (
                <div className="term-formula-box">
                    <span className="formula-label">Formula</span>
                    <div style={{ fontSize: '1.1em' }}>
                        <InlineMath>{term.formula}</InlineMath>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: '600' }}>
                Click for details &rarr;
            </div>
        </div>
    );
};

export default TermCard;
