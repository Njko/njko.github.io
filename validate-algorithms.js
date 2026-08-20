'use strict';

const fs = require('fs');
const path = require('path');

const REQUIRED_LEVELS = ['facile', 'moyen', 'difficile'];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateExercise(prefix, exercise, index) {
  const errors = [];
  const expectedLevel = REQUIRED_LEVELS[index];
  if (exercise.level !== expectedLevel) {
    errors.push(`${prefix} exercises[${index}].level must be "${expectedLevel}", got "${exercise.level}"`);
  }
  ['title', 'statement'].forEach((field) => {
    if (!isNonEmptyString(exercise[field])) {
      errors.push(`${prefix} exercises[${index}].${field} must be a non-empty string`);
    }
  });
  ['swift', 'kotlin'].forEach((lang) => {
    const block = exercise[lang];
    if (!block || !isNonEmptyString(block.signature) || !isNonEmptyString(block.solution)) {
      errors.push(`${prefix} exercises[${index}].${lang} must have non-empty signature and solution`);
    }
  });
  if (!Array.isArray(exercise.tests) || exercise.tests.length !== 2) {
    errors.push(`${prefix} exercises[${index}].tests must be an array of exactly 2 items`);
  } else {
    exercise.tests.forEach((test, testIndex) => {
      if (!isNonEmptyString(test.input) || !isNonEmptyString(test.output)) {
        errors.push(`${prefix} exercises[${index}].tests[${testIndex}] must have non-empty input and output strings`);
      }
    });
  }
  return errors;
}

function validateAlgorithm(algo) {
  const prefix = `[${algo.id}]`;
  const errors = [];
  if (!isNonEmptyString(algo.docUrl)) {
    errors.push(`${prefix} docUrl must be a non-empty string`);
  }
  if (Object.prototype.hasOwnProperty.call(algo, 'practiceUrl') && !isNonEmptyString(algo.practiceUrl)) {
    errors.push(`${prefix} practiceUrl, if present, must be a non-empty string`);
  }
  if (!Array.isArray(algo.exercises) || algo.exercises.length !== 3) {
    errors.push(`${prefix} exercises must be an array of exactly 3 items`);
    return errors;
  }
  algo.exercises.forEach((exercise, index) => {
    errors.push(...validateExercise(prefix, exercise, index));
  });
  return errors;
}

function main() {
  const filePath = path.join(__dirname, 'algorithms.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const algorithms = data.algorithms;
  const errors = algorithms.flatMap(validateAlgorithm);

  if (errors.length > 0) {
    console.error(`${errors.length} validation error(s):`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log(`OK: ${algorithms.length} algorithms validated.`);
}

main();
