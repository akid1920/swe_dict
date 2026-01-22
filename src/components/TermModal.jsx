import React from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const TermModal = ({ term, onClose, relatedTerms, onSelectTerm }) => {
    if (!term) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="modal-header">
                    <span className="category-badge">{term.category}</span>
                    <h2 className="modal-title">{term.term}</h2>
                </div>

                <div className="modal-body">
                    <div className="modal-section">
                        <h3>Definition</h3>
                        <p>{term.definition}</p>
                    </div>

                    <div className="modal-section">
                        <h3>Description</h3>
                        <p className="modal-description">{term.description}</p>
                    </div>

                    {term.formula && (
                        <div className="modal-section">
                            <h3>Formula</h3>
                            <div className="formula-container">
                                <BlockMath>{term.formula}</BlockMath>
                                {term.formula_description && (
                                    <div style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                        <div style={{ fontStyle: 'italic', fontWeight: 'bold', marginBottom: '0.25rem' }}>Where</div>
                                        <div style={{ paddingLeft: '1.5rem' }}>
                                            {term.formula_description.split('\n').map((line, i) => (
                                                <div key={i} style={{ marginBottom: '0.1rem' }}>
                                                    {line}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {relatedTerms && relatedTerms.length > 0 && (
                        <div className="modal-section related-section">
                            <h3>Related in {term.category}</h3>
                            <div className="related-tags">
                                {relatedTerms.map(rt => (
                                    <button
                                        key={rt.id}
                                        className="related-tag"
                                        onClick={() => onSelectTerm(rt)}
                                    >
                                        {rt.term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TermModal;
