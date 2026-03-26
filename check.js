const fs = require('fs');
const lines = fs.readFileSync('src/app/features/profile/profile.component.ts', 'utf8').split('\n');
let op = 0, cl = 0;
for (let i = 27; i < 358; i++) {
  const line = lines[i] || '';
  const o = (line.match(/<div\b/g) || []).length;
  const c = (line.match(/<\/div>/g) || []).length;
  op += o; cl += c;
  if (o !== c || (op - cl < 0)) {
     console.log(`L${i+1}: op=${op} cl=${cl} diff=${op-cl}`);
  }
}
console.log(`FINAL: Opens=${op}, Closes=${cl}, Diff=${op-cl}`);
