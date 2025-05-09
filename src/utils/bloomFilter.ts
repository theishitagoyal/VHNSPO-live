import { createHash } from 'crypto';

interface BloomFilterOptions {
    size: number;          // Size of the bit array
    hashCount: number;     // Number of hash functions
    falsePositiveRate?: number; // Desired false positive rate
}

export class BloomFilter {
    private bitArray: boolean[];
    private size: number;
    private hashCount: number;
    private hashFunctions: ((value: string) => number)[];

    constructor(options: BloomFilterOptions) {
        this.size = options.size;
        this.hashCount = options.hashCount;
        this.bitArray = new Array(this.size).fill(false);
        this.hashFunctions = this.generateHashFunctions();
    }

    /**
     * Generate multiple hash functions using different seeds
     */
    private generateHashFunctions(): ((value: string) => number)[] {
        const functions: ((value: string) => number)[] = [];
        
        for (let i = 0; i < this.hashCount; i++) {
            functions.push((value: string) => {
                const hash = createHash('sha256')
                    .update(value + i.toString())
                    .digest('hex');
                return parseInt(hash.substring(0, 8), 16) % this.size;
            });
        }
        
        return functions;
    }

    /**
     * Add an element to the Bloom filter
     */
    public add(value: string): void {
        this.hashFunctions.forEach(hashFn => {
            const index = hashFn(value);
            this.bitArray[index] = true;
        });
    }

    /**
     * Check if an element might be in the set
     * Returns false if definitely not in set, true if probably in set
     */
    public mightContain(value: string): boolean {
        return this.hashFunctions.every(hashFn => {
            const index = hashFn(value);
            return this.bitArray[index];
        });
    }

    /**
     * Get the current false positive rate
     */
    public getFalsePositiveRate(): number {
        const m = this.size;
        const k = this.hashCount;
        const n = this.getApproximateElementCount();
        
        return Math.pow(1 - Math.exp(-k * n / m), k);
    }

    /**
     * Get approximate number of elements in the filter
     */
    private getApproximateElementCount(): number {
        const m = this.size;
        const k = this.hashCount;
        const bitsSet = this.bitArray.filter(bit => bit).length;
        
        return -m / k * Math.log(1 - bitsSet / m);
    }

    /**
     * Clear the Bloom filter
     */
    public clear(): void {
        this.bitArray.fill(false);
    }

    /**
     * Get the current state of the bit array
     */
    public getBitArray(): boolean[] {
        return [...this.bitArray];
    }
}

/**
 * Log compression using Bloom filter
 */
export class LogCompressor {
    private bloomFilter: BloomFilter;
    private uniqueLogs: Set<string>;
    private compressionStats: {
        totalLogs: number;
        uniqueLogs: number;
        compressedSize: number;
        originalSize: number;
    };

    constructor(options: BloomFilterOptions) {
        this.bloomFilter = new BloomFilter(options);
        this.uniqueLogs = new Set();
        this.compressionStats = {
            totalLogs: 0,
            uniqueLogs: 0,
            compressedSize: 0,
            originalSize: 0
        };
    }

    /**
     * Compress a log entry
     * Returns true if the log is unique, false if it's a duplicate
     */
    public compressLog(log: string): boolean {
        this.compressionStats.totalLogs++;
        this.compressionStats.originalSize += log.length;

        // Check if we've seen this log before
        if (this.bloomFilter.mightContain(log)) {
            // Double-check with the Set to handle false positives
            if (this.uniqueLogs.has(log)) {
                return false;
            }
        }

        // This is a new log
        this.bloomFilter.add(log);
        this.uniqueLogs.add(log);
        this.compressionStats.uniqueLogs++;
        this.compressionStats.compressedSize += log.length;
        return true;
    }

    /**
     * Get compression statistics
     */
    public getStats(): typeof this.compressionStats {
        return { ...this.compressionStats };
    }

    /**
     * Get compression ratio
     */
    public getCompressionRatio(): number {
        if (this.compressionStats.originalSize === 0) return 0;
        return this.compressionStats.compressedSize / this.compressionStats.originalSize;
    }

    /**
     * Get current false positive rate
     */
    public getFalsePositiveRate(): number {
        return this.bloomFilter.getFalsePositiveRate();
    }

    /**
     * Clear the compressor
     */
    public clear(): void {
        this.bloomFilter.clear();
        this.uniqueLogs.clear();
        this.compressionStats = {
            totalLogs: 0,
            uniqueLogs: 0,
            compressedSize: 0,
            originalSize: 0
        };
    }
}

/**
 * Create a Bloom filter with optimal parameters for a given number of elements
 * and desired false positive rate
 */
export function createOptimalBloomFilter(
    expectedElements: number,
    falsePositiveRate: number = 0.01
): BloomFilter {
    const size = Math.ceil(-expectedElements * Math.log(falsePositiveRate) / (Math.log(2) * Math.log(2)));
    const hashCount = Math.ceil(size / expectedElements * Math.log(2));
    
    return new BloomFilter({
        size,
        hashCount,
        falsePositiveRate
    });
} 