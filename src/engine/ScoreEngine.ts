export interface RunStats {
  wavesCleared: number;
  livesRemaining: number;
  maxLives: number;
  goldSpent: number;
  goldEarned: number;
  uniqueTowerTypes: number;
  totalTowerTypes: number;
  gameTime: number; // in seconds
  synergyActivations: number;
  baseScore: number;
}

export class ScoreEngine {
  public static calculateFinalScore(runStats: RunStats): number {
    const W = runStats.wavesCleared / 200;
    const L = runStats.livesRemaining / runStats.maxLives;
    const E = Math.min(1, runStats.goldSpent / Math.max(1, runStats.goldEarned));
    const T = Math.min(1, runStats.uniqueTowerTypes / Math.max(1, runStats.totalTowerTypes));
    
    // Par time: 30 + w * 0.5
    const parTime = 30 + runStats.wavesCleared * 0.5;
    let S = 0;
    if (runStats.gameTime <= parTime) {
      S = 1.0;
    } else {
      // linear decay to 0 at 2x par time
      const decayTime = parTime * 2;
      S = Math.max(0, 1 - (runStats.gameTime - parTime) / parTime);
    }
    
    const SYN = runStats.synergyActivations / 8;
    
    const weightSum = (0.4 * W) + (0.2 * L) + (0.15 * E) + (0.1 * T) + (0.1 * S) + (0.05 * SYN);
    
    // BaseScore = sum of gold collected * 10
    const finalScore = runStats.baseScore * weightSum;
    
    return Math.floor(finalScore);
  }
}
