import React, { useState, useEffect, useRef } from 'react';
import { Search, Info, X, Command, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- AST Definitions ---
export type TokenType = 'KEYWORD' | 'OPERATOR' | 'STRING' | 'WHITESPACE' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

export type ASTNode = 
  | { type: 'Query'; left: ASTNode; operator: 'AND' | 'OR'; right: ASTNode }
  | { type: 'Expression'; field: string; operator: ':' | '=' | '>' | '<' | '>='; value: string }
  | { type: 'Text'; value: string };

class Lexer {
  private pos = 0;
  constructor(private input: string) {}

  private isSpace(char: string) { return /\s/.test(char); }
  private isAlphaNumeric(char: string) { return /[a-zA-Z0-9_\-\.]/.test(char); }
  private isOperator(char: string) { return /[:=><]/.test(char); }

  getNextToken(): Token {
    if (this.pos >= this.input.length) return { type: 'EOF', value: '', start: this.pos, end: this.pos };

    const char = this.input[this.pos];
    const start = this.pos;

    if (this.isSpace(char)) {
      while (this.pos < this.input.length && this.isSpace(this.input[this.pos])) this.pos++;
      return { type: 'WHITESPACE', value: this.input.substring(start, this.pos), start, end: this.pos };
    }

    if (this.isOperator(char)) {
      if ((char === '>' || char === '<') && this.input[this.pos + 1] === '=') {
        this.pos += 2;
      } else {
        this.pos++;
      }
      return { type: 'OPERATOR', value: this.input.substring(start, this.pos), start, end: this.pos };
    }

    if (char === '"' || char === "'") {
      const quote = char;
      this.pos++;
      while (this.pos < this.input.length && this.input[this.pos] !== quote) this.pos++;
      this.pos++; // consume quote
      return { type: 'STRING', value: this.input.substring(start, this.pos), start, end: this.pos };
    }

    if (this.isAlphaNumeric(char)) {
      while (this.pos < this.input.length && this.isAlphaNumeric(this.input[this.pos])) this.pos++;
      const value = this.input.substring(start, this.pos);
      if (value.toUpperCase() === 'AND' || value.toUpperCase() === 'OR') {
        return { type: 'KEYWORD', value: value.toUpperCase(), start, end: this.pos };
      }
      return { type: 'STRING', value, start, end: this.pos };
    }

    this.pos++;
    return { type: 'STRING', value: char, start, end: this.pos };
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.getNextToken();
    while (token.type !== 'EOF') {
      if (token.type !== 'WHITESPACE') tokens.push(token);
      token = this.getNextToken();
    }
    return tokens;
  }
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }

  parse(): ASTNode | null {
    if (this.tokens.length === 0) return null;
    return this.parseQuery();
  }

  private parseQuery(): ASTNode {
    let left = this.parseExpression();

    while (this.pos < this.tokens.length) {
      const token = this.peek();
      if (token?.type === 'KEYWORD' && (token.value === 'AND' || token.value === 'OR')) {
        this.consume();
        const right = this.parseExpression();
        left = { type: 'Query', left, operator: token.value as 'AND' | 'OR', right };
      } else {
        // Implicit AND
        const right = this.parseExpression();
        left = { type: 'Query', left, operator: 'AND', right };
      }
    }
    return left;
  }

  private parseExpression(): ASTNode {
    const token = this.consume();
    
    if (token?.type === 'STRING') {
      const nextToken = this.peek();
      if (nextToken?.type === 'OPERATOR') {
        const op = this.consume();
        const valueToken = this.consume();
        if (valueToken?.type === 'STRING') {
          return { type: 'Expression', field: token.value, operator: op.value as any, value: valueToken.value.replace(/['"]/g, '') };
        }
        throw new Error(`Expected value after operator ${op.value} at position ${op.end}`);
      }
      return { type: 'Text', value: token.value.replace(/['"]/g, '') };
    }
    
    throw new Error(`Unexpected token ${token?.value || 'EOF'} at position ${token?.start || 'end'}`);
  }
}

interface AuditSearchBarProps {
  onSearch: (ast: ASTNode | null, rawQuery: string) => void;
  placeholder?: string;
}

export const AuditSearchBar: React.FC<AuditSearchBarProps> = ({ onSearch, placeholder = "Search logs using Aegis Query Language (AQL)..." }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ast, setAst] = useState<ASTNode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const autocompleteSuggestions = [
    { label: 'ip:', desc: 'Filter by IP Address' },
    { label: 'action:', desc: 'Filter by action (e.g. login, delete)' },
    { label: 'risk_score>', desc: 'Filter by anomaly score' },
    { label: 'status:', desc: 'Filter by HTTP status code' },
    { label: 'user_id:', desc: 'Filter by specific user ID' },
  ];

  useEffect(() => {
    try {
      if (!query.trim()) {
        setAst(null);
        setError(null);
        onSearch(null, query);
        return;
      }

      const lexer = new Lexer(query);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const parsedAst = parser.parse();
      
      setAst(parsedAst);
      setError(null);
      onSearch(parsedAst, query);
    } catch (err: any) {
      setError(err.message);
      // We don't clear AST on partial errors to allow typing to continue
    }
  }, [query, onSearch]);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(prev => {
      const newQuery = prev.endsWith(' ') || prev === '' ? prev + suggestion : prev + ' ' + suggestion;
      inputRef.current?.focus();
      return newQuery;
    });
  };

  const renderAstNode = (node: ASTNode | null): React.ReactNode => {
    if (!node) return null;
    
    switch (node.type) {
      case 'Query':
        return (
          <div className="flex items-center space-x-1.5 whitespace-nowrap">
            {renderAstNode(node.left)}
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono text-[10px] uppercase font-bold border border-indigo-500/30">
              {node.operator}
            </span>
            {renderAstNode(node.right)}
          </div>
        );
      case 'Expression':
        return (
          <div className="flex items-center space-x-1 bg-black/50 border border-white/10 rounded-md px-2 py-1 shadow-inner">
            <span className="text-zinc-400 font-medium">{node.field}</span>
            <span className="text-zinc-600 font-mono text-[10px]">{node.operator}</span>
            <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1 rounded">{node.value}</span>
          </div>
        );
      case 'Text':
        return (
          <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-300 shadow-inner">
            "{node.value}"
          </div>
        );
    }
  };

  return (
    <div className="relative w-full max-w-4xl font-sans z-50">
      <div 
        className={`relative flex items-center w-full bg-[#0a0a0c] border rounded-xl shadow-2xl transition-all duration-300 ${
          isFocused ? 'border-indigo-500/50 ring-4 ring-indigo-500/10' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="pl-4 pr-2 text-zinc-500 flex-shrink-0">
          <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-indigo-400' : ''}`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none py-4 px-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-0 font-mono"
        />

        <div className="pr-4 flex items-center space-x-2 flex-shrink-0">
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="flex items-center text-[10px] font-mono text-zinc-500 space-x-1">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* AQL Parsing State Indicator */}
      <div className="absolute -bottom-6 right-2 flex items-center space-x-2 text-[10px] font-mono">
        {error ? (
          <span className="text-red-400 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Syntax Error</span>
        ) : query ? (
          <span className="text-emerald-400 flex items-center"><Check className="w-3 h-3 mr-1"/> Valid AQL</span>
        ) : null}
      </div>

      {/* Autocomplete & AST Visualizer Dropdown */}
      <AnimatePresence>
        {isFocused && (query.length > 0 || true) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d12] border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 flex flex-col"
          >
            {/* Live AST Visualizer */}
            {ast && !error && (
              <div className="p-4 border-b border-white/5 bg-black/40">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-3 flex items-center space-x-2">
                  <Command className="w-3 h-3" />
                  <span>Parsed Query AST</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {renderAstNode(ast)}
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 border-b border-red-500/20 bg-red-500/5 flex items-start space-x-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-400">Query Parsing Error</h4>
                  <p className="text-xs text-red-400/70 font-mono mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
              <div className="px-3 py-2 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                Available Filters
              </div>
              {autocompleteSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion.label)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                >
                  <span className="text-sm font-mono text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    {suggestion.label}
                  </span>
                  <span className="text-xs text-zinc-500 truncate ml-4">
                    {suggestion.desc}
                  </span>
                </button>
              ))}
              
              <div className="mt-2 pt-2 border-t border-white/5">
                 <div className="px-3 py-2 flex items-center space-x-2 text-xs text-zinc-500">
                    <Info className="w-4 h-4" />
                    <span>Supports logical operators: <strong className="text-white">AND</strong>, <strong className="text-white">OR</strong>. Wrap strings in quotes.</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
