import { useEffect, useState } from "react";

interface BenchmarkOptionChooserSettings {
    type: "filter" | "sort",
    title: string,
    options: string[],
    selected: string
}

let openChooserFn: ((settings: BenchmarkOptionChooserSettings) => Promise<string | null>) | null = null;

export function registerChooser(fn: typeof openChooserFn){
    openChooserFn = fn;
}

export async function chooseOption(settings: BenchmarkOptionChooserSettings) {
    if (!openChooserFn){
        console.error("BenchmarkOptionChooser ist noch nicht im DOM gemounted.");
        return null;
    }

    return openChooserFn(settings);
}

export function BenchmarkOptionChooser() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<BenchmarkOptionChooserSettings | null>(null);
    const [resolver, setResolver] = useState<((value: string | null) => void) | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        registerChooser((incomingSettings) => {
            setSettings(incomingSettings);
            setIsOpen(true);
            setSelectedOption(incomingSettings.selected === "" ? null : incomingSettings.selected);

            return new Promise<string | null>((resolve) => {
                setResolver(() => resolve);
            })
        })
    }, []);
    
    const handleApply = () => {
        if(resolver) resolver(selectedOption);
        setIsOpen(false);
    }

    const handleCancel = () => {
        if(resolver) resolver("cancel");
        setIsOpen(false);
    }

    if (!isOpen || !settings) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-[500px] rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-6 shadow-2xl border border-white/20 text-gray-800">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2d5b3b] text-white p-1">
                        {settings.type === "filter" 
                            ? 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={"50px"} height={"50px"}>
                                <path fill="currentColor" d="M96 128C83.1 128 71.4 135.8 66.4 147.8C61.4 159.8 64.2 173.5 73.4 182.6L256 365.3L256 480C256 488.5 259.4 496.6 265.4 502.6L329.4 566.6C338.6 575.8 352.3 578.5 364.3 573.5C376.3 568.5 384 556.9 384 544L384 365.3L566.6 182.7C575.8 173.5 578.5 159.8 573.5 147.8C568.5 135.8 556.9 128 544 128L96 128z"/>
                            </svg>
                            : 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={"50px"} height={"50px"}>
                                <path fill="currentColor" d="M130.4 268.2C135.4 280.2 147 288 160 288L480 288C492.9 288 504.6 280.2 509.6 268.2C514.6 256.2 511.8 242.5 502.7 233.3L342.7 73.3C330.2 60.8 309.9 60.8 297.4 73.3L137.4 233.3C128.2 242.5 125.5 256.2 130.5 268.2zM130.4 371.7C125.4 383.7 128.2 397.4 137.3 406.6L297.3 566.6C309.8 579.1 330.1 579.1 342.6 566.6L502.6 406.6C511.8 397.4 514.5 383.7 509.5 371.7C504.5 359.7 492.9 352 480 352L160 352C147.1 352 135.4 359.8 130.4 371.8z"/>
                            </svg>
                            }
                    </div>
                    <h2 className="text-xl font-bold">{settings.title}</h2>
                </div>

                <div className="mb-8">
                    <div className="space-y-2">
                        {settings.options.map((option) => (
                            <label
                                key={option}
                                className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all cursor-pointer ${
                                    selectedOption === option ? 'border-[#2d5b3b] bg-green-50/50' : 'border-gray-200'
                                }`}>
                                <input
                                    type="radio"
                                    name="sortOption"
                                    checked={selectedOption === option}
                                    onClick={() => {
                                        setSelectedOption(prev => prev === option ? null : option)
                                    }}
                                    className="accent-[#2d5b3b] h-4 w-4"    
                                />
                                <span className="text-sm font-medium" style={{userSelect: "none"}}>{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleApply}
                        className="flex-1 h-12 rounded-xl bg-[#2d5b3b] font-medium text-white shadow-lg hover:bg-[#23472e] transition-all"
                    >
                        {settings.type === 'filter' ? "Filter Anwenden" : "Sortieren"}
                    </button>
                    <button
                        onClick={handleCancel}
                        className="flex-1 h-12 rounded-xl bg-[#8f1010] font-medium text-white hover:bg-[#7e0f0f] transition-all"
                    >
                        Abbrechen
                    </button>
                </div>

            </div>
        </div>
    )
}