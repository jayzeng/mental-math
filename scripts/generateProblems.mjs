import fs from 'node:fs';

const CategoryType = {
  ADDITION: 'ADDITION',
  SUBTRACTION: 'SUBTRACTION',
  MULT_BREAKDOWN: 'MULT_BREAKDOWN',
  MULT_NEAR: 'MULT_NEAR',
  MULT_SQUARE: 'MULT_SQUARE',
  DIVISION: 'DIVISION',
  FRACTIONS: 'FRACTIONS',
  ESTIMATION: 'ESTIMATION',
};

const TOTAL_PER_CATEGORY = 200; // problems per category
const FREE_TEXT_COUNT = 100; // for ADDITION..FRACTIONS: first 100 are free-text, rest MC

function padId(n) {
  return String(n).padStart(3, '0');
}

function difficultyForIndex(i) {
  const cycle = ['easy', 'medium', 'hard'];
  return cycle[i % cycle.length];
}

function makeOptions(correct, deltas) {
  const correctNum = Number(correct);
  const opts = new Set([String(correctNum)]);
  for (const d of deltas) {
    if (opts.size >= 4) break;
    opts.add(String(correctNum + d));
  }
  // If still not 4 (e.g., duplicate deltas), fill with +/-1 steps
  let step = 1;
  while (opts.size < 4) {
    opts.add(String(correctNum + step));
    step += 1;
  }
  return Array.from(opts).sort(() => Math.random() - 0.5);
}

// ── Category generators ──

function makeAdditionProblem(index, isFree) {
  // Numbers between ~20 and 99
  const a = 20 + ((index * 7) % 60); // 20..79
  const b = 25 + ((index * 9) % 60); // 25..84
  const answerNum = a + b;
  const answer = String(answerNum);

  const roundedB = Math.ceil(b / 10) * 10; // round up to friendly ten
  const diff = roundedB - b; // >= 0

  const question = `${a} + ${b}`;
  const trick = 'Round one number to a friendly ten, add, then subtract the extra.';
  const explanation = `Round ${b} up to ${roundedB}. Compute ${a} + ${roundedB} = ${a + roundedB}. You added ${diff} too much, so subtract ${diff}: ${(a + roundedB)} - ${diff} = ${answerNum}.`;

  const base = {
    question: `What is ${question}?`,
    answer,
    trick,
    explanation,
  };

  if (isFree) {
    return { ...base, options: [] };
  }

  const options = makeOptions(answer, [-10, -5, 5, 10, 2, -2]);
  return { ...base, options };
}

function makeSubtractionProblem(index, isFree) {
  const minuend = 60 + ((index * 11) % 140); // 60..199
  const subtrahend = 15 + ((index * 7) % 70); // 15..84
  const answerNum = minuend - subtrahend;
  const answer = String(answerNum);

  const tensToNext = 10 - (subtrahend % 10);
  const firstJump = subtrahend + tensToNext;

  const question = `${minuend} - ${subtrahend}`;
  const trick = 'Use "counting up": start from the smaller number and count up to the bigger one.';
  const explanation = `Start at ${subtrahend}. Add ${tensToNext} to reach ${firstJump}. Then count up from ${firstJump} to ${minuend}. Altogether you added ${answerNum}, so ${minuend} - ${subtrahend} = ${answerNum}.`;

  const base = {
    question: `What is ${question}?`,
    answer,
    trick,
    explanation,
  };

  if (isFree) {
    return { ...base, options: [] };
  }
  const options = makeOptions(answer, [-10, -5, 5, 10, 3, -3]);
  return { ...base, options };
}

function makeMultBreakdownProblem(index, isFree) {
  const tens = 10 + ((index * 3) % 70); // tens-ish part
  const ones = 1 + (index % 9); // 1..9
  const a = tens + ones; // 2-digit
  const b = 3 + ((index * 2) % 7); // 3..9

  const answerNum = a * b;
  const answer = String(answerNum);

  const tensPart = Math.floor(a / 10) * 10;
  const onesPart = a - tensPart;

  const question = `${a} × ${b}`;
  const trick = 'Break the 2-digit number into tens and ones, multiply each part, then add.';
  const explanation = `Split ${a} into ${tensPart} and ${onesPart}. Multiply: ${tensPart} × ${b} = ${tensPart * b}, and ${onesPart} × ${b} = ${onesPart * b}. Add them: ${tensPart * b} + ${onesPart * b} = ${answerNum}.`;

  const base = {
    question: `What is ${question}?`,
    answer,
    trick,
    explanation,
  };

  if (isFree) {
    return { ...base, options: [] };
  }
  const options = makeOptions(answer, [-20, -10, 10, 20, 5, -5]);
  return { ...base, options };
}

function makeMultNearProblem(index, isFree) {
  // Use numbers near 10, 20, 50, or 100
  const anchors = [10, 20, 50, 100];
  const anchor = anchors[index % anchors.length];
  const diff = (index % 3) + 1; // 1..3 away
  const a = anchor + (index % 2 === 0 ? -diff : diff);
  const b = 3 + ((index * 4) % 8); // 3..10-ish

  const answerNum = a * b;
  const answer = String(answerNum);

  const question = `${a} × ${b}`;
  const trick = `Use ${anchor} as an anchor: think ${anchor} × ${b} then adjust by the difference.`;
  const explanation = `Think of ${a} as ${anchor} ${a > anchor ? '+' : '-'} ${Math.abs(a - anchor)}. First do ${anchor} × ${b} = ${anchor * b}. Then ${a > anchor ? 'add' : 'subtract'} ${Math.abs(a - anchor)} × ${b} = ${Math.abs(a - anchor) * b}. So the answer is ${anchor * b} ${a > anchor ? '+' : '-'} ${Math.abs(a - anchor) * b} = ${answerNum}.`;

  const base = {
    question: `What is ${question}?`,
    answer,
    trick,
    explanation,
  };

  if (isFree) {
    return { ...base, options: [] };
  }
  const options = makeOptions(answer, [-30, -20, 20, 30, 10, -10]);
  return { ...base, options };
}

function makeMultSquareProblem(index, isFree) {
  // Squares of numbers between 8 and 40-ish
  const base = 8 + index;
  const a = base;
  const answerNum = a * a;
  const answer = String(answerNum);

  const tens = Math.round(a / 10) * 10;
  const diff = tens - a;

  const question = `${a} × ${a}`;
  const trick = 'Square the number by using a nearby ten: (a - d)(a + d) + d² or by rounding then adjusting.';
  const explanation = `Think of ${a} as ${tens} - ${Math.abs(diff)}. Then ${a}² = (${tens} - ${Math.abs(diff)})² = (${tens} - ${Math.abs(diff)}) × (${tens} - ${Math.abs(diff)}). You can also think: ${a}² = (${tens} - ${Math.abs(diff)})(${tens} + ${Math.abs(diff)}) + ${Math.abs(diff)}² = ${tens - Math.abs(diff)} × ${tens + Math.abs(diff)} + ${Math.abs(diff) ** 2} = ${answerNum}.`;

  const baseObj = {
    question: `What is ${question}?`,
    answer,
    trick,
    explanation,
  };

  if (isFree) {
    return { ...baseObj, options: [] };
  }
  const options = makeOptions(answer, [-50, -20, 20, 50, 10, -10]);
  return { ...baseObj, options };
}

function makeDivisionProblem(index, isFree) {
  const divisor = 3 + (index % 7); // 3..9
  const baseQuot = 4 + ((index * 3) % 12); // 4..15
  const remainder = index % divisor; // ensures < divisor

  const dividend = baseQuot * divisor + (isFree ? 0 : remainder);
  const exact = dividend % divisor === 0;

  const answer = exact
    ? String(dividend / divisor)
    : `${Math.floor(dividend / divisor)} R${dividend % divisor}`;

  const question = `${dividend} ÷ ${divisor}`;
  const trick = exact
    ? 'Think of how many equal groups of the divisor fit into the dividend.'
    : 'Use division with remainders: see how many full groups fit, then how much is left over.';

  const explanation = exact
    ? `Find how many times ${divisor} fits into ${dividend}. ${divisor} × ${dividend / divisor} = ${dividend}, so the answer is ${dividend / divisor}.`
    : `Find how many times ${divisor} fits into ${dividend}. ${divisor} × ${Math.floor(dividend / divisor)} = ${Math.floor(dividend / divisor) * divisor}. The leftover is ${dividend - Math.floor(dividend / divisor) * divisor}, so the answer is ${Math.floor(dividend / divisor)} R${dividend - Math.floor(dividend / divisor) * divisor}.`;

  const baseObj = {
    question: `What is ${question}?`,
    answer,
    trick,
    explanation,
  };

  if (isFree) {
    return { ...baseObj, options: [] };
  }

  if (exact) {
    const numAnswer = Number(answer);
    const options = makeOptions(numAnswer, [-3, -2, 2, 3]);
    return { ...baseObj, options };
  } else {
    const [qStr, rStr] = answer.split(' R');
    const q = Number(qStr);
    const r = Number(rStr);
    const opts = new Set([answer]);
    opts.add(`${q + 1} R${Math.max(0, r - 1)}`);
    opts.add(`${Math.max(0, q - 1)} R${r + 1}`);
    opts.add(`${q} R${r + 2}`);
    const options = Array.from(opts).slice(0, 4).sort(() => Math.random() - 0.5);
    return { ...baseObj, options };
  }
}

function makeFractionsProblem(index, isFree) {
  const whole = 20 + ((index * 5) % 80); // 20..99
  const type = index % 3; // 0: half, 1: quarter, 2: three-quarters

  let fracText;
  let answerNum;

  if (type === 0) {
    fracText = 'half';
    answerNum = whole / 2;
  } else if (type === 1) {
    fracText = 'one quarter';
    answerNum = whole / 4;
  } else {
    fracText = 'three quarters';
    answerNum = (3 * whole) / 4;
  }

  const answer = String(answerNum);
  const question = `What is ${fracText} of ${whole}?`;
  const trick = 'Think of halves and quarters: halve the number, then halve again for quarters.';
  const explanation = type === 0
    ? `Half of ${whole} is ${whole} ÷ 2 = ${answerNum}.`
    : type === 1
      ? `A quarter is half of a half. Half of ${whole} is ${whole / 2}, and half of ${whole / 2} is ${answerNum}.`
      : `Three quarters is three times one quarter. One quarter of ${whole} is ${whole / 4}. Multiply that by 3: ${whole / 4} × 3 = ${answerNum}.`;

  const baseObj = {
    question,
    answer,
    trick,
    explanation,
  };

  if (isFree) {
    return { ...baseObj, options: [] };
  }

  const options = makeOptions(answer, [-5, -2, 2, 5, 10, -10]);
  return { ...baseObj, options };
}

function makeEstimationProblem(index) {
  // Mix of addition and multiplication estimation
  const useAddition = index % 2 === 0;

  if (useAddition) {
    const a = 30 + ((index * 7) % 70);
    const b = 40 + ((index * 5) % 60);
    const approx = Math.round(a / 10) * 10 + Math.round(b / 10) * 10;
    const answer = String(approx);
    const question = `About what is ${a} + ${b}?`;
    const trick = 'Round each number to the nearest ten first, then add.';
    const explanation = `Round ${a} to ${Math.round(a / 10) * 10} and ${b} to ${Math.round(b / 10) * 10}. Add them: ${Math.round(a / 10) * 10} + ${Math.round(b / 10) * 10} = ${approx}.`;
    const options = makeOptions(answer, [-20, -10, 10, 20, 30, -30]);
    return { question, answer, trick, explanation, options };
  } else {
    const a = 6 + (index % 7); // 6..12
    const b = 18 + ((index * 6) % 60); // 18..77
    const roundedB = Math.round(b / 10) * 10;
    const approx = a * roundedB;
    const answer = String(approx);
    const question = `About what is ${a} × ${b}?`;
    const trick = 'Round the larger number to a friendly ten, multiply, and use that as your estimate.';
    const explanation = `Round ${b} to ${roundedB}. Multiply: ${a} × ${roundedB} = ${approx}. That is a good estimate for ${a} × ${b}.`;
    const options = makeOptions(answer, [-50, -20, 20, 50, 100, -100]);
    return { question, answer, trick, explanation, options };
  }
}

// ── Build full pool ──

function buildCategory(category) {
  const problems = [];
  for (let i = 0; i < TOTAL_PER_CATEGORY; i += 1) {
    const isFree = category !== CategoryType.ESTIMATION && i < FREE_TEXT_COUNT;
    const difficulty = difficultyForIndex(i);

    let core;
    switch (category) {
      case CategoryType.ADDITION:
        core = makeAdditionProblem(i, isFree);
        break;
      case CategoryType.SUBTRACTION:
        core = makeSubtractionProblem(i, isFree);
        break;
      case CategoryType.MULT_BREAKDOWN:
        core = makeMultBreakdownProblem(i, isFree);
        break;
      case CategoryType.MULT_NEAR:
        core = makeMultNearProblem(i, isFree);
        break;
      case CategoryType.MULT_SQUARE:
        core = makeMultSquareProblem(i, isFree);
        break;
      case CategoryType.DIVISION:
        core = makeDivisionProblem(i, isFree);
        break;
      case CategoryType.FRACTIONS:
        core = makeFractionsProblem(i, isFree);
        break;
      case CategoryType.ESTIMATION:
        core = makeEstimationProblem(i);
        break;
      default:
        throw new Error(`Unknown category ${category}`);
    }

    const options = core.options ?? [];

    problems.push({
      id: `${category}_${padId(i + 1)}`,
      category,
      difficulty,
      question: core.question,
      answer: core.answer,
      options,
      trick: core.trick,
      explanation: core.explanation,
    });
  }
  return problems;
}

function buildPool() {
  const pool = {};
  for (const category of Object.values(CategoryType)) {
    pool[category] = buildCategory(category);
  }
  return pool;
}

function main() {
  const pool = buildPool();
  const json = JSON.stringify(pool, null, 2);
  fs.writeFileSync('public/problems.json', json, 'utf-8');
  console.log('Generated public/problems.json');
}

main();
