/*
OPTIONS:
-------------------------------------------------------------------------------------------------------------
| Option	        |   Type	 |  Default	 |  Description                                                 |
------------------------------------------------------------------------------------------------------------|
| length	        |   number	 |  20	     |  Length of the generated ID.                                 |
| useLetters	    |   boolean	 |  true	 |  Use letters (English alphabet) as part of the generated ID. |
| useNumbers	    |   boolean	 |  true	 |  Use numbers as part of the generated ID.                    |
| includeSymbols	|   array	 |  []	     |  Use additional letters as part of the generated ID.         |
| excludeSymbols	|   array	 |  []	     |  Do not use these symbols as part of the generated ID.       |
-------------------------------------------------------------------------------------------------------------
USAGE:
----------------------------------------------------------------
const generateUniqueId = require('generate-unique-id');

//* example 1
const id = generateUniqueId();

//* example 2
const id = generateUniqueId({
  length: 32,
  useLetters: false
});

//* example 3
const id = generateUniqueId({
  includeSymbols: ['@','#','|'],
  excludeSymbols: ['0']
});
----------------------------------------------------------------
*/

function getRandomNumber(limit) {
    return Math.floor(Math.random() * limit).toString();
}

function filterSymbols(excludeSymbols, group) {
    let newGroup = group;
    excludeSymbols.forEach((symbol) => {
        newGroup = newGroup.replace(symbol, '');
    });

    return newGroup;
}

function createId(availableChars, idLength) {
    let id = '';

    for (let i = 0; i < idLength; i++) {
        id += availableChars[getRandomNumber(availableChars.length)];
    }

    return id;
}

function generateUniqueId({
    length = 20,
    useLetters = true,
    useNumbers = true,
    includeSymbols = [],
    excludeSymbols = [],
    uuid = false
  } = {}) {

    let letters = 'abcdefghijklmnopqrstuvwxyz';
    let upletters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numbers = '0123456789';
    let availableChars = [];
    let lettersArr = [];
    let numbersArr = [];

    if (uuid) {
        availableChars = [...letters.split(''), ...numbers.split('')];
        const _uuid = `${createId(availableChars, 8)}-${createId(availableChars, 4)}-${createId(availableChars, 4)}-${createId(availableChars, 4)}-${createId(availableChars, 10)}`
        return _uuid
    }

    if (useLetters) {
      if (excludeSymbols.length) letters = filterSymbols(excludeSymbols, letters);
      if (excludeSymbols.length) upletters = filterSymbols(excludeSymbols, upletters);
      lettersArr = letters.split('').concat(upletters.split(''));
    }

    if (useNumbers) {
      if (excludeSymbols.length) numbers = filterSymbols(excludeSymbols, numbers);
      numbersArr = numbers.split('');
    }

    availableChars = [...lettersArr, ...numbersArr, ...includeSymbols];

    return createId(availableChars, length);
}

module.exports = generateUniqueId

