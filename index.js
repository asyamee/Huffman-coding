const FILE_WINDOW = document.querySelector('.file-window');
const GO_BUTTON = document.querySelector('.submit');

const COMPRESSED_FILE_WINDOW = document.querySelector('.compressed-window');
const KEY_WINDOW = document.querySelector('.key-window');
const GOGO_BUTTON = document.querySelector('.decompress');

GO_BUTTON.addEventListener('click', function () {
	handleFileChange(FILE_WINDOW);
});

GOGO_BUTTON.addEventListener('click', function () {
	handleFilesChanges(COMPRESSED_FILE_WINDOW, KEY_WINDOW);
});

function handleFilesChanges(firstInput, secondInput) {
	readAndProcessFiles(firstInput, secondInput);
}

function readFileMultiple(file) {
	return new Promise((resolve, reject) => {
		var reader = new FileReader();

		reader.onload = function (e) {
			resolve(e.target.result);
		};

		reader.onerror = function (e) {
			reject(e);
		};

		reader.readAsText(file);
	});
}

function readAndProcessFiles(fileInput1, fileInput2) {
	var file1 = fileInput1.files[0];
	var file2 = fileInput2.files[0];

	if (!file1 || !file2) {
		alert('Нужно два файла');
		return;
	}

	Promise.all([readFileMultiple(file1), readFileMultiple(file2)]).then((results) => {
		var content1 = results[0];
		var content2 = results[1];

		decompressAndSendFile(content1, content2, getFileName(file1.name));
	});
}

function handleFileChange(input) {
	if (!input.files[0]) {
		alert('Нужен файл!');
		return;
	}
	const READER = new FileReader();
	let file = input.files[0];
	READER.readAsText(file);

	READER.onload = function () {
		const RESULT = readFile(READER.result);

		const TEXT_CONTENT = RESULT[1];
		const KEY = JSON.stringify(RESULT[0]);

		createAndSendFiles(getFileName(file.name), TEXT_CONTENT, KEY);
	};

	READER.onerror = function () {
		console.log(READER.error, 'Error caught!');
	};
}

function getFileName(text) {
	return text.split('.')[0];
}

function decompressAndSendFile(file, key, filename) {
	const swappedCodes = swapKeysAndValues(JSON.parse(key));
	const DECOMPRESSED_TEXT = decompressHuffman(file, swappedCodes);

	const DECOMPRESSED_FILE = document.createElement('a');

	const DECOMPRESSED_BLOB = new Blob([DECOMPRESSED_TEXT], {
		type: 'plain/text',
	});

	let decompressedURL = URL.createObjectURL(DECOMPRESSED_BLOB);

	DECOMPRESSED_FILE.setAttribute('href', decompressedURL);
	DECOMPRESSED_FILE.setAttribute('download', `${filename}-decompressed.txt`);

	DECOMPRESSED_FILE.style.display = 'none';
	document.body.appendChild(DECOMPRESSED_FILE);
	DECOMPRESSED_FILE.click();
}

function swapKeysAndValues(obj) {
	const swappedObj = {};
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			swappedObj[obj[key]] = key;
		}
	}
	return swappedObj;
}

function decompressHuffman(compressedText, savedHuffmanCode) {
	let currentCode = '';
	let decompressedText = '';

	for (const bit of compressedText) {
		currentCode += bit;

		if (savedHuffmanCode[currentCode]) {
			decompressedText += savedHuffmanCode[currentCode];
			currentCode = '';
		}
	}

	return decompressedText;
}

function createAndSendFiles(filename, content, key) {
	const COMPRESSED_FILE = document.createElement('a');
	const KEY_FILE = document.createElement('a');

	const BLOB_COMPRESSED = new Blob([content], {
		type: 'application/octet-stream',
	});

	const BLOB_KEY = new Blob([key], {
		type: 'plain/text',
	});

	let fileURL = URL.createObjectURL(BLOB_COMPRESSED);
	let keyURL = URL.createObjectURL(BLOB_KEY);

	COMPRESSED_FILE.setAttribute('href', fileURL);
	COMPRESSED_FILE.setAttribute('download', `${filename}.bin`);

	KEY_FILE.setAttribute('href', keyURL);
	KEY_FILE.setAttribute('download', `${filename}-key.txt`);

	KEY_FILE.style.display = 'none';
	document.body.appendChild(KEY_FILE);
	KEY_FILE.click();

	COMPRESSED_FILE.style.display = 'none';
	document.body.appendChild(COMPRESSED_FILE);
	COMPRESSED_FILE.click();
}

function readFile(text) {
	const frequencyDict = createFrequencyDictionary(text);
	const huffmanTree = buildHuffmanTree(frequencyDict);
	const huffmanCodes = buildHuffmanCodes(huffmanTree);
	const encodedText = encodeHuffman(text, huffmanCodes);

	return [huffmanCodes, encodedText];
}

// Шаг 1: Создайте функцию для создания частотного словаря

function createFrequencyDictionary(text) {
	const frequencyDict = {};
	for (let char of text) {
		if (frequencyDict[char]) {
			frequencyDict[char]++;
		} else {
			frequencyDict[char] = 1;
		}
	}
	return frequencyDict;
}

// Шаг 2: Создайте класс для узла дерева Хаффмана

class HuffmanNode {
	constructor(char, frequency) {
		this.char = char;
		this.frequency = frequency;
		this.left = null;
		this.right = null;
	}
}

// Шаг 3: Создайте функцию для построения дерева Хаффмана

function buildHuffmanTree(frequencyDict) {
	const nodes = Object.keys(frequencyDict).map((char) => new HuffmanNode(char, frequencyDict[char]));

	while (nodes.length > 1) {
		nodes.sort((a, b) => a.frequency - b.frequency);

		const left = nodes.shift();
		const right = nodes.shift();

		const newNode = new HuffmanNode(null, left.frequency + right.frequency);
		newNode.left = left;
		newNode.right = right;

		nodes.push(newNode);
	}

	return nodes[0];
}

// Шаг 4: Создайте функцию для создания кодовых таблиц

function buildHuffmanCodes(root) {
	const codes = {};

	function traverse(node, code) {
		if (node.char) {
			codes[node.char] = code;
		} else {
			traverse(node.left, code + '0');
			traverse(node.right, code + '1');
		}
	}

	traverse(root, '');
	return codes;
}

// Шаг 5: Кодирование текста с использованием кодовых таблиц

function encodeHuffman(text, codes) {
	let encodedText = '';
	for (let char of text) {
		encodedText += codes[char];
	}
	return encodedText;
}

function decodeHuffman(encodedText, root) {
	let decodedText = '';
	let currentNode = root;

	for (let bit of encodedText) {
		if (bit === '0') {
			currentNode = currentNode.left;
		} else if (bit === '1') {
			currentNode = currentNode.right;
		}

		if (currentNode.char) {
			decodedText += currentNode.char;
			currentNode = root; // Вернуться в корень дерева
		}
	}

	return decodedText;
}
