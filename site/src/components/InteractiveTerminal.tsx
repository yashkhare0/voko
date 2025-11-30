import { useState, useEffect, useRef } from 'react';

type Step = {
  type: 'input' | 'output' | 'wait' | 'clear';
  text?: string;
  delay?: number;
};

const SEQUENCE: Step[] = [
  { type: 'input', text: 'npx @yashkhare0/voko-cli init', delay: 50 },
  { type: 'wait', delay: 800 },
  { type: 'output', text: '\n👋 Welcome to voko-cli setup wizard!\n' },
  { type: 'output', text: '? Path to base language file:' },
  { type: 'input', text: 'src/locales/en.json', delay: 30 },
  { type: 'wait', delay: 500 },
  { type: 'output', text: '\n? Base language code: (en)' },
  { type: 'wait', delay: 300 },
  { type: 'output', text: ' en' }, // Confirm default
  { type: 'wait', delay: 400 },
  { type: 'output', text: '\n? Select target languages:' },
  { type: 'wait', delay: 600 },
  { type: 'input', text: 'es, fr, de, ja', delay: 80 },
  { type: 'wait', delay: 500 },
  { type: 'output', text: '\n? Select translation engine:' },
  { type: 'input', text: 'DeepL', delay: 100 },
  { type: 'wait', delay: 800 },
  { type: 'output', text: '\n✅ Configuration saved to voko.config.json\n' },
  { type: 'wait', delay: 1500 },
  { type: 'input', text: 'npx @yashkhare0/voko-cli sync', delay: 50 },
  { type: 'wait', delay: 800 },
  { type: 'output', text: '\nReading base file... Done.' },
  { type: 'output', text: 'Syncing es... 4 keys translated.' },
  { type: 'output', text: 'Syncing fr... 4 keys translated.' },
  { type: 'output', text: 'Syncing de... 4 keys translated.' },
  { type: 'output', text: 'Syncing ja... 4 keys translated.' },
  { type: 'output', text: '\n✨ All locales are up to date!' },
  { type: 'wait', delay: 4000 },
  { type: 'clear' }
];

export const InteractiveTerminal = () => {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, currentLine]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const processStep = async () => {
      const step = SEQUENCE[stepIndex];
      
      if (!step) {
        setStepIndex(0); // Loop
        return;
      }

      if (step.type === 'wait') {
        timeout = setTimeout(() => {
          setStepIndex(prev => prev + 1);
        }, step.delay || 500);
      } 
      else if (step.type === 'clear') {
        setLines([]);
        setCurrentLine('');
        setStepIndex(prev => prev + 1);
      }
      else if (step.type === 'output') {
        setLines(prev => [...prev, step.text || '']);
        setStepIndex(prev => prev + 1);
      } 
      else if (step.type === 'input') {
        const text = step.text || '';
        let charIndex = 0;
        
        const typeChar = () => {
          if (charIndex < text.length) {
            setCurrentLine(text.substring(0, charIndex + 1));
            charIndex++;
            timeout = setTimeout(typeChar, step.delay || 50);
          } else {
            // Finished typing input
            setTimeout(() => {
              setLines(prev => [...prev, `$ ${text}`]);
              setCurrentLine('');
              setStepIndex(prev => prev + 1);
            }, 300);
          }
        };
        typeChar();
      }
    };

    processStep();

    return () => clearTimeout(timeout);
  }, [stepIndex]);

  return (
    <div className="w-full bg-[#0a0a0a] rounded-lg border border-neutral-800 shadow-2xl overflow-hidden font-mono text-xs sm:text-sm md:text-base relative">
      {/* Title Bar */}
      <div className="bg-[#151515] px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
        <div className="text-neutral-500 text-[10px] md:text-xs truncate ml-4">user@dev:~/project</div>
        <div className="w-4 md:w-10"></div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="p-4 md:p-6 h-[300px] md:h-[400px] overflow-y-auto text-neutral-300 font-medium leading-relaxed"
      >
        {lines.map((line, i) => {
           if (line.startsWith('$')) {
               return (
                   <div key={i} className="mb-2 break-all">
                       <span className="text-red-500 mr-2 font-bold">➜</span>
                       <span className="text-white">{line.substring(2)}</span>
                   </div>
               )
           }
           if (line.startsWith('?')) {
               return (
                   <div key={i} className="mb-1 text-blue-400 font-bold break-words">
                       {line}
                   </div>
               )
           }
           if (line.includes('✅') || line.includes('✨')) {
               return (
                   <div key={i} className="mb-2 text-green-400 font-bold">
                       {line}
                   </div>
               )
           }
           if (line.includes('Syncing')) {
               return (
                   <div key={i} className="mb-1 text-neutral-400">
                       <span className="text-blue-500">ℹ</span> {line}
                   </div>
               )
           }
           return <div key={i} className="whitespace-pre-wrap mb-1">{line}</div>;
        })}
        
        {/* Active Line */}
        <div className="flex items-center">
            {currentLine ? (
                <>
                   <span className="text-red-500 mr-2 font-bold shrink-0">➜</span>
                   <span className="text-white break-all">{currentLine}</span>
                </>
            ) : (
                 lines.length > 0 && lines[lines.length-1].startsWith('?') ? null : <span className="text-red-500 mr-2 font-bold shrink-0">➜</span>
            )}
            <span className="w-2 md:w-2.5 h-4 md:h-5 bg-red-500 ml-1 animate-cursor-blink inline-block align-middle shrink-0"></span>
        </div>
      </div>
    </div>
  );
};
