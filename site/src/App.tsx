import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Globe, 
  Zap, 
  RefreshCw, 
  Layers, 
  Github, 
  ChevronRight, 
  Command, 
  Copy, 
  Check,
  Menu,
  X
} from 'lucide-react';
import { InteractiveTerminal } from './components/InteractiveTerminal';

// --- Types & Constants ---

const LANGUAGES = [
  "Spanish (es)", "French (fr)", "German (de)", "Italian (it)", "Portuguese (pt)", 
  "Chinese (zh)", "Japanese (ja)", "Korean (ko)", "Hindi (hi)", "Arabic (ar)",
  "Russian (ru)", "Dutch (nl)", "Swedish (sv)", "Turkish (tr)", "Vietnamese (vi)"
];

const FEATURES = [
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Multi-Engine Support",
    description: "Leverage the power of Google Translate, DeepL, LibreTranslate, or Yandex to localize your app instantly."
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: "Strict Sync",
    description: "Keep your locale files pristine. Automatically remove keys that no longer exist in your base language file."
  },
  {
    icon: <Terminal className="w-6 h-6" />,
    title: "Interactive Setup",
    description: "A beautiful CLI wizard guides you through configuring languages, engines, and paths effortlessly."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Automatic Translation",
    description: "Detects missing keys in target files and fills the gaps automatically, saving hours of manual work."
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Framework Agnostic",
    description: "Works perfectly with React, Vue, Svelte, Node.js, or any project structure using JSON locale files."
  },
  {
    icon: <Command className="w-6 h-6" />,
    title: "CI/CD Friendly",
    description: "Full support for non-interactive flags makes it easy to integrate into your GitHub Actions or deployment pipelines."
  }
];

// --- Components ---

const SparksBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      update: () => void;
      draw: () => void;
    }[] = [];
    
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const createParticle = () => {
      // Updated colors to match the darker red theme
      const colors = ['#991b1b', '#7f1d1d', '#ffffff'];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100, // Start below screen
        size: Math.random() * 2,
        speedY: Math.random() * 0.8 + 0.2,
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        update() {
          this.y -= this.speedY;
          this.x += this.speedX;
          this.opacity -= 0.003;
          
          if (this.opacity <= 0) {
            this.y = canvas.height + 10;
            this.x = Math.random() * canvas.width;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.speedY = Math.random() * 0.8 + 0.2;
          }
        },
        draw() {
          ctx.globalAlpha = this.opacity;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      };
    };

    const particleCount = Math.min(window.innerWidth / 8, 80);
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" style={{ mixBlendMode: 'screen' }} />;
};

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-40 bg-brand-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono font-bold text-lg md:text-xl tracking-tighter z-50">
          <span className="text-brand-red">&gt;</span>
          <span className="text-white">voko-cli</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#usage" className="hover:text-white transition-colors">Usage</a>
          <a href="https://github.com/yashkhare0/voko-cli" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white hover:text-brand-red transition-colors">
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a 
              href="https://www.npmjs.com/package/@yashkhare0/voko-cli" 
              target="_blank"
              rel="noreferrer"
              className="bg-white text-black px-4 py-2 rounded-none hover:bg-brand-red hover:text-white transition-all font-bold"
          >
            v1.2.0
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden z-50 text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="fixed inset-0 bg-brand-black z-40 flex flex-col items-center justify-center space-y-8 text-xl font-bold md:hidden">
            <a href="#features" onClick={() => setIsOpen(false)} className="hover:text-brand-red transition-colors">Features</a>
            <a href="#usage" onClick={() => setIsOpen(false)} className="hover:text-brand-red transition-colors">Usage</a>
            <a href="https://github.com/yashkhare0/voko-cli" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-brand-red transition-colors">
              <Github className="w-5 h-5" />
              GitHub
            </a>
            <a 
                href="https://www.npmjs.com/package/@yashkhare0/voko-cli" 
                target="_blank"
                rel="noreferrer"
                className="bg-white text-black px-6 py-2 rounded-none hover:bg-brand-red hover:text-white transition-all"
            >
              v1.2.0
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

const CopyCommand = ({ command }: { command: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex items-center bg-brand-gray border border-white/10 rounded overflow-hidden font-mono text-sm w-full max-w-full">
      <div className="pl-4 py-3 text-brand-red select-none shrink-0">$</div>
      <div className="flex-1 pl-2 py-3 text-neutral-300 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {command}
      </div>
      <button 
        onClick={handleCopy}
        className="px-4 py-3 bg-white/5 hover:bg-white/10 border-l border-white/10 transition-colors shrink-0"
        aria-label="Copy command"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-neutral-400" />}
      </button>
    </div>
  );
};

const LanguageMarquee = () => (
  // Changed text-black to text-white for better contrast with the darker red background
  <div className="w-full bg-brand-red text-white py-4 overflow-hidden relative border-y border-brand-red">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...LANGUAGES, ...LANGUAGES, ...LANGUAGES].map((lang, i) => (
        <span key={i} className="mx-4 md:mx-6 font-mono font-bold text-base md:text-lg uppercase tracking-wider">
          {lang} <span className="mx-2 opacity-30">•</span>
        </span>
      ))}
    </div>
    <div className="absolute inset-y-0 left-0 w-10 md:w-20 bg-gradient-to-r from-brand-red to-transparent z-10" />
    <div className="absolute inset-y-0 right-0 w-10 md:w-20 bg-gradient-to-l from-brand-red to-transparent z-10" />
  </div>
);

const FeatureCard: React.FC<{ feature: typeof FEATURES[0] }> = ({ feature }) => (
  <div className="p-6 md:p-8 border border-white/10 hover:border-brand-red/50 bg-neutral-900/50 hover:bg-neutral-900 transition-all duration-300 group rounded-lg">
    <div className="mb-6 p-3 bg-brand-black w-fit border border-white/10 text-white group-hover:text-brand-red group-hover:border-brand-red transition-colors rounded">
      {feature.icon}
    </div>
    <h3 className="text-lg md:text-xl font-bold mb-3 font-mono">{feature.title}</h3>
    <p className="text-neutral-400 leading-relaxed text-sm md:text-base">{feature.description}</p>
  </div>
);

// --- Main App Component ---

export default function App() {
  return (
    <div className="min-h-screen selection:bg-brand-red selection:text-white pb-20 relative overflow-hidden">
      <SparksBackground />
      <NavBar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 lg:pt-48 lg:pb-32 px-4 md:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Hero Content */}
          <div className="relative z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-brand-red/30 text-red-400 text-xs font-mono tracking-widest uppercase bg-brand-red/5 rounded-full">
              <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>
              v1.2.0 Release Available
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1] mb-6 text-white">
              Automate your <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
                i18n workflow.
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-neutral-400 mb-8 max-w-xl leading-relaxed mx-auto lg:mx-0">
              Stop manually editing JSON files. <strong className="text-white">voko</strong> is the CLI tool that syncs, translates, and manages your project's localization with a single command.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center lg:justify-start">
               <div className="w-full sm:w-auto min-w-[280px]">
                <CopyCommand command="npm install -D voko-cli" />
               </div>
               <a 
                 href="https://github.com/yashkhare0/voko-cli" 
                 className="flex items-center justify-center gap-2 px-6 py-3 border border-white/20 hover:border-white text-white font-medium transition-all hover:bg-white hover:text-black rounded"
               >
                 View on GitHub <ChevronRight className="w-4 h-4" />
               </a>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 text-xs md:text-sm text-neutral-500 font-mono">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-red" /> 13+ Dependencies
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-red" /> MIT License
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-red" /> TypeScript
              </div>
            </div>
          </div>

          {/* Hero Visual - Interactive Terminal */}
          <div className="relative z-10 w-full max-w-xl lg:max-w-full mx-auto">
             {/* Decorative blob behind terminal */}
             <div className="absolute -inset-4 bg-brand-red/20 blur-3xl rounded-full opacity-20 animate-pulse"></div>
             <div className="relative">
                <div className="absolute -top-8 -right-8 md:-top-12 md:-right-12 text-neutral-800 opacity-20 pointer-events-none select-none">
                  <Terminal className="w-48 h-48 md:w-[300px] md:h-[300px]" strokeWidth={0.5} />
                </div>
                <InteractiveTerminal />
             </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <LanguageMarquee />

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 md:px-6 bg-brand-black/90 relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center lg:text-left">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Built for speed & precision.
            </h2>
            <p className="text-neutral-400 max-w-2xl text-base md:text-lg mx-auto lg:mx-0">
              Translating your app shouldn't slow you down. Voko handles the heavy lifting so you can focus on shipping features.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <FeatureCard key={idx} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Usage / Workflow Section */}
      <section id="usage" className="py-20 px-4 md:px-6 border-t border-white/10 bg-neutral-950 z-10 relative">
        <div className="max-w-7xl mx-auto">
           <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-8">
                  Streamlined Workflow
                </h2>
                
                <div className="space-y-12">
                  <div className="relative pl-8 border-l border-white/10">
                    <span className="absolute -left-3 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-red text-white font-bold text-xs">1</span>
                    <h3 className="text-xl font-bold mb-2 font-mono">Initialize</h3>
                    <p className="text-neutral-400 mb-4 text-sm md:text-base">
                      Run the interactive setup wizard to generate your configuration file. Select your base language, target languages, and preferred translation engine.
                    </p>
                    <div className="bg-black border border-white/10 p-3 md:p-4 rounded font-mono text-xs md:text-sm text-neutral-300 overflow-x-auto whitespace-nowrap">
                      <span className="text-brand-red">$</span> npx @yashkhare0/voko-cli init
                    </div>
                  </div>

                  <div className="relative pl-8 border-l border-white/10">
                    <span className="absolute -left-3 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-red text-white font-bold text-xs">2</span>
                    <h3 className="text-xl font-bold mb-2 font-mono">Sync & Translate</h3>
                    <p className="text-neutral-400 mb-4 text-sm md:text-base">
                      Voko reads your base file, finds missing keys in target files, and uses your chosen engine to fill them in automatically.
                    </p>
                    <div className="bg-black border border-white/10 p-3 md:p-4 rounded font-mono text-xs md:text-sm text-neutral-300 overflow-x-auto whitespace-nowrap">
                      <span className="text-brand-red">$</span> npx @yashkhare0/voko-cli sync
                    </div>
                  </div>

                  <div className="relative pl-8 border-l border-white/10">
                    <span className="absolute -left-3 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-brand-red text-white font-bold text-xs">3</span>
                    <h3 className="text-xl font-bold mb-2 font-mono">Strict Mode (Optional)</h3>
                    <p className="text-neutral-400 mb-4 text-sm md:text-base">
                      Keep your repo clean. Strict mode removes keys from translation files that no longer exist in your source of truth.
                    </p>
                    <div className="bg-black border border-white/10 p-3 md:p-4 rounded font-mono text-xs md:text-sm text-neutral-300 overflow-x-auto whitespace-nowrap">
                      <span className="text-brand-red">$</span> npx @yashkhare0/voko-cli sync --strict
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mt-8 lg:mt-0">
                <div className="sticky top-24 bg-neutral-900 border border-white/10 p-4 md:p-6 rounded-lg">
                  <div className="flex items-center gap-2 mb-4 text-neutral-400 font-mono text-xs uppercase tracking-widest border-b border-white/5 pb-4">
                    <Command className="w-4 h-4" /> voko.config.json
                  </div>
                  <pre className="font-mono text-xs md:text-sm text-neutral-300 overflow-x-auto">
{`{
  "baseLanguage": "en",
  "baseFile": "src/locales/en.json",
  "languages": [
    "es", 
    "fr", 
    "de", 
    "ja"
  ],
  "engine": "deepl",
  "apiKeyEnvVar": "DEEPL_KEY"
}`}
                  </pre>
                  <div className="mt-6 pt-6 border-t border-white/5">
                     <p className="text-sm text-neutral-500 mb-2">Supported Engines:</p>
                     <div className="flex flex-wrap gap-2">
                        {['Google Translate', 'DeepL', 'LibreTranslate', 'Yandex'].map(e => (
                          <span key={e} className="px-2 py-1 bg-white/5 text-xs text-white rounded border border-white/5">{e}</span>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 bg-black text-center z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <div className="font-mono font-bold text-2xl tracking-tighter mb-4">
            voko-cli
          </div>
          <p className="text-neutral-500 mb-8 max-w-md">
            The CLI tool for modern i18n management. Built for developers who value automation.
          </p>
          <div className="flex items-center gap-6 mb-8">
            <a href="https://github.com/yashkhare0/voko-cli" className="text-neutral-400 hover:text-white transition-colors">GitHub</a>
            <a href="https://www.npmjs.com/package/@yashkhare0/voko-cli" className="text-neutral-400 hover:text-white transition-colors">NPM</a>
            <a href="https://github.com/yashkhare0/voko-cli/blob/main/LICENSE" className="text-neutral-400 hover:text-white transition-colors">License</a>
          </div>
          <p className="text-neutral-700 text-sm">
            © {new Date().getFullYear()} Yash Khare. Released under MIT License.
          </p>
        </div>
      </footer>
    </div>
  );
}
