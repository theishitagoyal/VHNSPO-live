/**
 * Log Compression Algorithms
 * This module provides various algorithms for compressing log data
 */

/**
 * Run-Length Encoding (RLE) for log compression
 * @param logs Array of log entries
 * @returns Compressed logs in RLE format
 */
export function runLengthEncoding(logs: string[]): { count: number; log: string }[] {
    if (logs.length === 0) return [];
    
    const compressed: { count: number; log: string }[] = [];
    let currentLog = logs[0];
    let count = 1;

    for (let i = 1; i < logs.length; i++) {
        if (logs[i] === currentLog) {
            count++;
        } else {
            compressed.push({ count, log: currentLog });
            currentLog = logs[i];
            count = 1;
        }
    }
    compressed.push({ count, log: currentLog });
    return compressed;
}

/**
 * Delta Encoding for log compression
 * @param logs Array of log entries
 * @returns Compressed logs with delta encoding
 */
export function deltaEncoding(logs: string[]): { timestamp: number; delta: number; message: string }[] {
    if (logs.length === 0) return [];
    
    const compressed: { timestamp: number; delta: number; message: string }[] = [];
    let lastTimestamp = 0;

    for (const log of logs) {
        const timestamp = Date.parse(log.split(' ')[0]);
        const message = log.split(' ').slice(1).join(' ');
        const delta = lastTimestamp === 0 ? 0 : timestamp - lastTimestamp;
        
        compressed.push({ timestamp, delta, message });
        lastTimestamp = timestamp;
    }
    return compressed;
}

/**
 * Dictionary-based compression for logs
 * @param logs Array of log entries
 * @returns Compressed logs with dictionary references
 */
export function dictionaryCompression(logs: string[]): { 
    dictionary: Map<string, number>;
    compressed: number[];
} {
    const dictionary = new Map<string, number>();
    const compressed: number[] = [];
    let nextCode = 0;

    for (const log of logs) {
        if (!dictionary.has(log)) {
            dictionary.set(log, nextCode++);
        }
        compressed.push(dictionary.get(log)!);
    }

    return { dictionary, compressed };
}

/**
 * Pattern-based compression for logs
 * @param logs Array of log entries
 * @returns Compressed logs with pattern matching
 */
export function patternCompression(logs: string[]): {
    patterns: Map<string, string>;
    compressed: string[];
} {
    const patterns = new Map<string, string>();
    const compressed: string[] = [];
    let patternId = 0;

    // Find common patterns in logs
    for (const log of logs) {
        const words = log.split(' ');
        for (let i = 0; i < words.length - 1; i++) {
            const pattern = `${words[i]} ${words[i + 1]}`;
            if (!patterns.has(pattern)) {
                patterns.set(pattern, `P${patternId++}`);
            }
        }
    }

    // Compress logs using patterns
    for (const log of logs) {
        let compressedLog = log;
        patterns.forEach((patternId, pattern) => {
            compressedLog = compressedLog.replace(new RegExp(pattern, 'g'), patternId);
        });
        compressed.push(compressedLog);
    }

    return { patterns, compressed };
}

/**
 * Decompress RLE compressed logs
 * @param compressed Compressed logs in RLE format
 * @returns Original log entries
 */
export function decompressRLE(compressed: { count: number; log: string }[]): string[] {
    return compressed.flatMap(({ count, log }) => Array(count).fill(log));
}

/**
 * Decompress delta encoded logs
 * @param compressed Compressed logs with delta encoding
 * @returns Original log entries
 */
export function decompressDelta(compressed: { timestamp: number; delta: number; message: string }[]): string[] {
    return compressed.map(({ timestamp, message }) => {
        const date = new Date(timestamp);
        return `${date.toISOString()} ${message}`;
    });
}

/**
 * Decompress dictionary compressed logs
 * @param compressed Compressed logs with dictionary
 * @returns Original log entries
 */
export function decompressDictionary(
    compressed: { dictionary: Map<string, number>; compressed: number[] }
): string[] {
    const reverseDict = new Map<number, string>();
    compressed.dictionary.forEach((code, log) => reverseDict.set(code, log));
    return compressed.compressed.map(code => reverseDict.get(code)!);
}

/**
 * Decompress pattern compressed logs
 * @param compressed Compressed logs with patterns
 * @returns Original log entries
 */
export function decompressPattern(
    compressed: { patterns: Map<string, string>; compressed: string[] }
): string[] {
    return compressed.compressed.map(log => {
        let decompressed = log;
        compressed.patterns.forEach((patternId, pattern) => {
            decompressed = decompressed.replace(new RegExp(patternId, 'g'), pattern);
        });
        return decompressed;
    });
} 