// Read the current useUnistockDEX.ts file
const fs = require('fs');
const content = fs.readFileSync('src/hooks/useUnistockDEX.ts', 'utf8');

// Fix the addLiquidity function call
const fixedContent = content.replace(
  /const tx = await \(router as any\)\.addLiquidity\(\s*token0,\s*token1,\s*amount0Wei,\s*amount1Wei,\s*tickLower,\s*tickUpper,\s*fee,\s*tickSpacing,\s*\{\s*gasLimit: 500000n\s*\}\s*\);/,
  `const tx = await (router as any).addLiquidity(
        token0,
        token1,
        amount0Wei,
        amount1Wei,
        tickLower,
        tickUpper,
        fee,
        tickSpacing,
        {
          gasLimit: 500000n
        }
      );`
);

// Write the fixed content back
fs.writeFileSync('src/hooks/useUnistockDEX.ts', fixedContent);
console.log('Fixed addLiquidity function call');
