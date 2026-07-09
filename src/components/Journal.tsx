import React, { useState } from 'react';
import { JOURNAL_ARTICLES } from '../data';
import { JournalArticle } from '../types';
import { BookOpen, Calendar, Clock, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface JournalProps {
  onBackToAtelier: () => void;
}

export default function Journal({ onBackToAtelier }: JournalProps) {
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);

  // Custom vector illustrations for the articles with Editorial Aesthetic
  const renderArticleIllustration = (articleId: string) => {
    const isGold = articleId.includes('gold');
    return (
      <div className="w-full h-80 flex items-center justify-center bg-[#EAE8E3] border border-[#381932] rounded-none relative overflow-hidden group">
        
        {/* Fine background crosshairs or grids representing drafts */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#381932" strokeWidth="0.5" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#381932" strokeWidth="0.5" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#381932" strokeWidth="0.5" />
        </div>

        <svg width="180" height="180" viewBox="0 0 100 100" className="relative z-10 transition-transform duration-1000 group-hover:scale-105">
          {isGold ? (
            <g>
              {/* Melting crucible pouring gold liquid - stark ink sketch */}
              <path d="M30,35 L70,35 L62,70 L38,70 Z" fill="none" stroke="#381932" strokeWidth="2" />
              <path d="M33,35 L67,35" stroke="#381932" strokeWidth="0.5" />
              {/* Dripping gold droplet */}
              <path d="M50,42 Q50,75 55,75 Q60,75 50,42" fill="#F9F7F2" stroke="#381932" strokeWidth="1" />
              <circle cx="50" cy="80" r="3" fill="#381932" className="animate-bounce" />
              {/* Sparks */}
              <circle cx="28" cy="45" r="1.5" fill="#381932" />
              <circle cx="72" cy="50" r="1.5" fill="#381932" />
              <circle cx="45" cy="22" r="1.5" fill="#381932" />
            </g>
          ) : (
            <g>
              {/* Cutting standard raw amethyst jewel facet - stark ink sketch */}
              <polygon points="50,15 80,45 50,85 20,45" fill="none" stroke="#381932" strokeWidth="2" />
              <polygon points="50,15 62,45 50,85 38,45" fill="none" stroke="#381932" strokeWidth="0.5" />
              <line x1="20" y1="45" x2="80" y2="45" stroke="#381932" strokeWidth="0.5" />
              {/* Star sparkles */}
              <path d="M72,25 Q75,28 78,25 Q75,22 72,25" fill="#381932" />
              <path d="M22,70 Q25,73 28,70 Q25,67 22,70" fill="#381932" />
            </g>
          )}
        </svg>

        {/* Read Article Overlay */}
        <div className="absolute inset-0 bg-[#381932]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
          <BookOpen size={16} className="text-[#F9F7F2]" />
          <span className="text-[10px] tracking-[0.25em] font-sans uppercase text-[#F9F7F2] font-bold">
            Read Editorial Story
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="py-12 bg-[#F9F7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {selectedArticle ? (
          /* Full Article Reader view */
          <article className="space-y-8">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center space-x-2 text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932] hover:line-through mb-6 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Journal index</span>
            </button>

            {/* Illustration frame inside full view */}
            {renderArticleIllustration(selectedArticle.id)}

            {/* Title and metadata */}
            <div className="space-y-3 border-b border-[#381932] pb-6">
              <div className="flex items-center space-x-3 text-[9px] tracking-widest font-sans uppercase font-bold text-[#381932] opacity-60">
                <span>{selectedArticle.category}</span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-mono">
                  <Calendar size={10} />
                  <span>{selectedArticle.date}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1 font-mono">
                  <Clock size={10} />
                  <span>{selectedArticle.readTime}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif-luxury tracking-wide text-[#381932] font-bold leading-tight">
                {selectedArticle.title}
              </h1>
            </div>

            {/* Content paragraph stream */}
            <div className="space-y-6 text-[#381932]/80 text-sm leading-relaxed font-light font-sans">
              {selectedArticle.content.map((paragraph, index) => (
                <p key={index} className="first-of-type:text-base first-of-type:text-[#381932] first-of-type:font-medium">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Elegant visual line divider */}
            <div className="pt-12 border-t border-[#381932] flex items-center justify-between">
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932] hover:line-through cursor-pointer"
              >
                Return to Lookbook
              </button>
              <Sparkles className="text-[#381932] opacity-40 animate-pulse-slow" size={14} />
            </div>
          </article>
        ) : (
          /* Editorial list view */
          <div className="space-y-12">
            
            {/* Header info */}
            <div className="text-center space-y-3">
              <span className="text-[10px] tracking-[0.3em] font-sans uppercase font-bold text-[#381932]">
                The Atelier Journal
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif-luxury tracking-wide text-[#381932] font-bold">
                The Lookbook & Heritage
              </h1>
              <p className="max-w-lg mx-auto text-xs text-[#381932]/70 leading-relaxed font-sans">
                Discover the silent philosophies, metallurgical formulas, and artisanal lineages that define high-luxury jewelry creation.
              </p>
            </div>

            {/* Articles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {JOURNAL_ARTICLES.map((article) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group cursor-pointer space-y-4"
                >
                  {/* Visual block */}
                  {renderArticleIllustration(article.id)}

                  {/* Article descriptions */}
                  <div className="space-y-2">
                    <span className="text-[9px] tracking-widest font-sans uppercase font-bold text-[#381932] opacity-60">
                      {article.category} • {article.date}
                    </span>
                    <h3 className="text-xl font-serif-luxury text-[#381932] font-bold group-hover:line-through transition-all duration-300">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[#381932]/70 leading-relaxed line-clamp-3 font-sans">
                      {article.excerpt}
                    </p>
                    <div className="pt-2 flex items-center space-x-2 text-[10px] uppercase tracking-widest font-sans font-bold text-[#381932] group-hover:line-through">
                      <span>Examine Story</span>
                      <ArrowRight size={10} className="transform group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
